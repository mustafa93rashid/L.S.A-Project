import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope, Paginated } from '@/types/api'
import type {
  ContactMessage,
  ContactMessageFilters,
  ContactMessageStatistics,
  ContactMessageStatus,
} from '@/features/contact-messages/types'

export async function getContactMessages(
  filters: ContactMessageFilters,
): Promise<Paginated<ContactMessage>> {
  const response = await apiClient.get<Paginated<ContactMessage>>('/contact-messages', {
    params: {
      status: filters.status || undefined,
      service: filters.service || undefined,
      search: filters.search || undefined,
      page: filters.page,
      limit: filters.limit,
    },
  })
  return response.data
}

export async function getContactMessageStatistics(): Promise<ContactMessageStatistics> {
  const response = await apiClient.get<ApiEnvelope<ContactMessageStatistics>>(
    '/contact-messages/statistics',
  )
  if (!response.data.data) throw new Error('Statistics response did not include data.')
  return response.data.data
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus,
): Promise<ContactMessage> {
  const response = await apiClient.patch<ApiEnvelope<ContactMessage>>(
    `/contact-messages/${id}/status`,
    { status },
  )
  if (!response.data.data) throw new Error('Status update response did not include data.')
  return response.data.data
}

export async function deleteContactMessage(id: string): Promise<void> {
  await apiClient.delete(`/contact-messages/${id}`)
}
