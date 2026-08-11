import type { AuditUser } from '@/types/api'

export const JOB_STATUSES = ['draft', 'published', 'closed'] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Temporary', 'Internship'] as const
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

export const JOB_DEPARTMENTS = [
  'Engineering',
  'Mechanical',
  'Electrical',
  'Instrumentation',
  'Civil',
  'HSE',
  'Operations',
  'Maintenance',
  'Administration',
  'Procurement',
  'Finance',
  'Human Resources',
  'Information Technology',
  'Other',
] as const

export type JobDepartment = (typeof JOB_DEPARTMENTS)[number]

export interface Job {
  _id: string
  title: string
  shortDescription: string
  description: string
  location: string
  employmentType: EmploymentType
  department: JobDepartment
  responsibilities: string[]
  requirements: string[]
  status: JobStatus
  deadline: string | null
  publishedAt: string | null
  createdBy?: AuditUser | null
  updatedBy?: AuditUser | null
  createdAt: string
  updatedAt: string
}

export interface JobFilters {
  status?: JobStatus
  department?: JobDepartment
  employmentType?: EmploymentType
  search?: string
  page: number
  limit: number
}

export interface JobStatistics {
  total: number
  published: number
  draft: number
  closed: number
}

export interface JobPayload {
  title: string
  shortDescription: string
  description: string
  location: string
  employmentType: EmploymentType
  department: JobDepartment
  responsibilities: string[]
  requirements: string[]
  status?: JobStatus
  deadline?: string | null
}