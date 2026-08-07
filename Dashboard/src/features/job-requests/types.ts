import type { AuditUser } from '@/types/api'
import type { JobStatus } from '@/features/jobs/types'

export const JOB_REQUEST_STATUSES = [
  'new',
  'reviewed',
  'shortlisted',
  'accepted',
  'rejected',
  'ignored',
] as const
export type JobRequestStatus = (typeof JOB_REQUEST_STATUSES)[number]

export interface JobRequestJobRef {
  _id: string
  title: string
  location?: string
  employmentType?: string
  department?: string
  status?: JobStatus
  deadline?: string | null
}

export interface JobRequestCv {
  url: string
  publicId: string
  originalName: string
  mimeType: string
  size: number
}

export interface JobRequest {
  _id: string
  job: JobRequestJobRef
  firstName: string
  lastName: string
  email: string
  phone: string
  cv: JobRequestCv
  status: JobRequestStatus
  reviewedAt: string | null
  shortlistedAt: string | null
  acceptedAt: string | null
  rejectedAt: string | null
  ignoredAt: string | null
  updatedBy?: AuditUser | null
  createdAt: string
  updatedAt: string
}

export interface JobRequestFilters {
  status?: JobRequestStatus
  job?: string
  search?: string
  page: number
  limit: number
}

export interface JobRequestStatistics {
  total: number
  new: number
  reviewed: number
  shortlisted: number
  accepted: number
  rejected: number
  ignored: number
}
