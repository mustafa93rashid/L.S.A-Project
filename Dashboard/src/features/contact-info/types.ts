import type { AuditUser } from '@/types/api'

/**
 * `location` and `socialLinks` are typed as possibly absent/partial —
 * confirmed live against the real backend that the current singleton
 * record predates the `location` sub-object (it has a legacy top-level
 * `address`, no `location` key at all, no `mapUrl`). `.lean()` doesn't
 * strip fields that don't match the current schema, so old documents can
 * genuinely diverge from Backend/src/models/contactInfo.model.js. The
 * dashboard reads defensively rather than assuming every record matches
 * the current model shape.
 */
export interface ContactInfo {
  _id: string
  title: string
  description: string
  location?: {
    address?: string
    mapUrl?: string
  }
  /** Legacy shape only — pre-`location` records kept it top-level. */
  address?: string
  phones: string[]
  primaryPhone: string
  email: string
  workingHours: string
  emergencyHours: string
  socialLinks?: {
    facebook?: string
    instagram?: string
    linkedin?: string
    whatsapp?: string
  }
  isActive: boolean
  updatedBy?: AuditUser | null
  createdAt: string
  updatedAt: string
}

/** The singleton PUT accepts a partial payload — every field is optional
 * on the wire (Backend/src/validation/contactInfo.validate.js), but the
 * Mongoose model requires address/primaryPhone/email/workingHours the
 * first time the record is created, so the dashboard form always
 * collects those four. */
export interface ContactInfoPayload {
  title?: string
  description?: string
  location?: {
    address: string
    mapUrl?: string
  }
  phones?: string[]
  primaryPhone?: string
  email?: string
  workingHours?: string
  emergencyHours?: string
  socialLinks?: {
    facebook?: string
    instagram?: string
    linkedin?: string
    whatsapp?: string
  }
  isActive?: boolean
}
