import type { AuditUser } from '@/types/api'

export const EQUIPMENT_REQUEST_STATUSES = [
  'new',
  'contacted',
  'quoted',
  'approved',
  'rejected',
  'completed',
] as const

export type EquipmentRequestStatus = (typeof EQUIPMENT_REQUEST_STATUSES)[number]

export interface EquipmentRequestEquipmentRef {
  _id: string
  title: string
  slug: string
  location?: string
  availableUnits?: number
  isActive?: boolean
}

export interface EquipmentRequest {
  _id: string
  equipment: EquipmentRequestEquipmentRef
  fullName: string
  email: string
  phone: string
  company: string
  workLocation: string
  estimatedRequiredDays: number
  workDescription: string
  status: EquipmentRequestStatus
  contactedAt: string | null
  completedAt: string | null
  updatedBy?: AuditUser | null
  createdAt: string
  updatedAt: string
}

export interface EquipmentRequestFilters {
  status?: EquipmentRequestStatus
  search?: string
  page: number
  limit: number
}

export interface EquipmentRequestStatistics {
  total: number
  new: number
  contacted: number
  quoted: number
  approved: number
  rejected: number
  completed: number
}
