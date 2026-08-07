import type { AuditUser } from '@/types/api'

export interface EquipmentCategory {
  _id: string
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
  createdBy?: AuditUser | null
  updatedBy?: AuditUser | null
  createdAt: string
  updatedAt: string
}

export interface EquipmentCategoryPayload {
  name: string
  slug: string
  displayOrder?: number
  isActive?: boolean
}
