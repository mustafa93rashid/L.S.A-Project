/** Standard success envelope returned by every backend endpoint. */
export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** Shape returned by every paginated list endpoint (see the API reference). */
export interface Paginated<T> {
  success: boolean
  count: number
  pagination: PaginationMeta
  data: T[]
}

/** Shape returned by list endpoints that have no pagination at all
 * (Equipment, Equipment Categories) — the whole collection, just counted. */
export interface CountedList<T> {
  success: boolean
  count: number
  data: T[]
}

/** The `fullName email role` shape almost every resource populates
 * `createdBy`/`updatedBy` with. */
export interface AuditUser {
  _id: string
  fullName: string
  email: string
  role: string
}

export interface ApiFieldError {
  field: string
  message: string
}

/**
 * Normalized error thrown by the API client for every failed request —
 * components and forms consume this instead of the raw Axios error.
 */
export class ApiError extends Error {
  readonly status?: number
  readonly errors?: ApiFieldError[]

  constructor(message: string, options?: { status?: number; errors?: ApiFieldError[] }) {
    super(message)
    this.name = 'ApiError'
    this.status = options?.status
    this.errors = options?.errors
  }
}
