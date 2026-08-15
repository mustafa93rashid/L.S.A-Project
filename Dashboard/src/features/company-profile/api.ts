import { apiClient } from '@/lib/api-client'
import { ApiError, type ApiEnvelope } from '@/types/api'
import type { CompanyProfile } from '@/features/company-profile/types'

const COMPANY_PROFILE_FILE_FIELD = 'file'

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  try {
    const response = await apiClient.get<ApiEnvelope<CompanyProfile>>('/company-profile')
    return response.data.data ?? null
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function updateCompanyProfile(file: File): Promise<CompanyProfile> {
  const formData = new FormData()
  formData.append(COMPANY_PROFILE_FILE_FIELD, file)

  const response = await apiClient.put<ApiEnvelope<CompanyProfile>>('/company-profile', formData)

  if (!response.data.data) throw new Error('Update response did not include company profile data.')

  return response.data.data
}

export async function deleteCompanyProfile(): Promise<void> {
  await apiClient.delete('/company-profile')
}

export async function downloadCompanyProfile(fileName: string): Promise<void> {
  const response = await apiClient.get<Blob>('/company-profile/download', { responseType: 'blob' })

  const blobUrl = URL.createObjectURL(response.data)
  const anchor = document.createElement('a')

  anchor.href = blobUrl
  anchor.download = fileName || 'LSA-Company-Profile.pdf'

  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(blobUrl)
}