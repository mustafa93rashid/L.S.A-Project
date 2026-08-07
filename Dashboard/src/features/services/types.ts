export interface ServiceImage {
  url: string
  publicId: string
  alt: string
}

export interface DeliveryStep {
  title: string
  description: string
  icon: string
}

export interface CapabilityTableRow {
  cells: string[]
}

/**
 * Every section is typed optional — confirmed live against the real
 * backend that at least one seeded record predates the current model
 * shape entirely (a service with no `serviceCard`, `heroSection`,
 * `deliveryProcessSection`, or `homeCapability` at all, despite the
 * Mongoose schema marking them `required`, which only Mongoose-mediated
 * writes enforce). The dashboard reads defensively rather than assuming
 * every record is complete.
 */
export interface Service {
  _id: string
  title: string
  slug: string
  serviceCard?: {
    label: string
    description: string
    highlights: string[]
    image: ServiceImage
  }
  heroSection?: {
    title: string
    description: string
    image: ServiceImage
  }
  deliveryProcessSection?: {
    title: string
    description: string
    steps: DeliveryStep[]
  }
  capabilitiesSection?: {
    title: string
    description: string
    items: string[]
    table: {
      headers: string[]
      rows: CapabilityTableRow[]
    }
  }
  homeCapability?: {
    isVisible: boolean
    title: string
    shortDescription: string
    displayOrder: number
  }
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
