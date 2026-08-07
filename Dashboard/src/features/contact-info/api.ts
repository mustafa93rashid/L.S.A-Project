import { apiClient } from '@/lib/api-client'
import { ApiError, type ApiEnvelope } from '@/types/api'
import type { ContactInfo, ContactInfoPayload } from '@/features/contact-info/types'

/** Returns null when the singleton hasn't been created yet (backend
 * responds 404 in that case) — the page treats that as "first-time setup"
 * rather than an error. */
export async function getContactInfo(): Promise<ContactInfo | null> {
  try {
    const response = await apiClient.get<ApiEnvelope<ContactInfo>>('/contacts')
    return response.data.data ?? null
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function saveContactInfo(payload: ContactInfoPayload): Promise<ContactInfo> {
  const response = await apiClient.put<ApiEnvelope<ContactInfo>>('/contacts', payload)
  if (!response.data.data)
    throw new Error('Save response did not include contact information data.')
  return response.data.data
}
