import type { AuditUser } from '@/types/api'

export interface EquipmentImage {
  url: string
  publicId: string
  alt: string
}

export interface EquipmentPrimarySpecification {
  label: string
  value: string
}

export interface EquipmentSafetyCertificate {
  isAvailable: boolean
  message: string
}

export interface EquipmentCategoryRef {
  _id: string
  name: string
  slug: string
  isActive?: boolean
}

export interface Equipment {
  _id: string
  title: string
  slug: string
  category: EquipmentCategoryRef
  shortDescription: string
  description: string
  image: EquipmentImage
  primarySpecification: EquipmentPrimarySpecification
  location: string
  availableUnits: number
  safetyCertificate: EquipmentSafetyCertificate
  displayOrder: number
  isActive: boolean
  createdBy?: AuditUser | null
  updatedBy?: AuditUser | null
  createdAt: string
  updatedAt: string
}

export interface EquipmentListFilters {
  category?: string
  isActive?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface EquipmentPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface EquipmentListResponse {
  success: boolean
  count: number
  data: Equipment[]
  pagination: EquipmentPagination
}

/** Flat shape the form works with — reassembled into the nested
 * primarySpecification/safetyCertificate objects when building FormData.
 */
export interface EquipmentFormValues {
  title: string
  slug: string
  category: string
  shortDescription: string
  description: string
  specLabel: string
  specValue: string
  location: string
  availableUnits: number
  safetyAvailable: boolean
  safetyMessage: string
  displayOrder?: number
  isActive?: boolean
  imageAlt?: string
}