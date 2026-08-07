import type { AuditUser } from '@/types/api'

export interface ProjectMainImage {
  url: string
  publicId: string
  alt: string
}

export interface ProjectGalleryImage {
  url: string
  publicId: string
  alt: string
  displayOrder: number
}

export interface ScopeItem {
  title: string
  description: string
  icon: string
}

export interface ProjectServiceRef {
  _id: string
  title: string
  slug: string
}

export interface Project {
  _id: string
  title: string
  slug: string
  categoryLabel: string
  shortDescription: string
  description: string
  services: ProjectServiceRef[]
  hero: {
    title: string
    description: string
    image: ProjectMainImage
  }
  cardImage: ProjectMainImage
  projectDetails: {
    client: string | null
    location: string | null
    completionDate: string | null
    duration: string | null
    status: string | null
  }
  detailedScope: {
    title: string
    description: string
    items: ScopeItem[]
  }
  gallery: ProjectGalleryImage[]
  certificates: ProjectGalleryImage[]
  displayOrder: number
  isFeatured: boolean
  isActive: boolean
  createdBy?: AuditUser | null
  updatedBy?: AuditUser | null
  createdAt: string
  updatedAt: string
}
