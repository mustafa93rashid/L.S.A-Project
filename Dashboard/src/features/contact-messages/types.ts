import type { AuditUser } from '@/types/api'

export const CONTACT_MESSAGE_STATUSES = ['new', 'read', 'replied', 'archived'] as const
export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number]

export const CONTACT_MESSAGE_SERVICES = [
  'General Inquiry',
  'EPC Projects',
  'Pipeline Services',
  'Process Piping',
  'Hot Tapping',
  'Pipeline Integrity',
  'Storage Tanks',
  'Mechanical Works',
  'Cathodic Protection',
  'Civil Works',
  'Electrical and Instrumentation',
  'Auger Boring & HDD',
] as const
export type ContactMessageService = (typeof CONTACT_MESSAGE_SERVICES)[number]

export interface ContactMessage {
  _id: string
  fullName: string
  email: string
  phone: string
  service: ContactMessageService
  projectDescription: string
  status: ContactMessageStatus
  readAt: string | null
  repliedAt: string | null
  archivedAt: string | null
  updatedBy?: AuditUser | null
  createdAt: string
  updatedAt: string
}

export interface ContactMessageFilters {
  status?: ContactMessageStatus
  service?: ContactMessageService
  search?: string
  page: number
  limit: number
}

export interface ContactMessageStatistics {
  total: number
  new: number
  read: number
  replied: number
  archived: number
}
