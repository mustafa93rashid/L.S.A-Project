import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/lib/env'
import { ApiError, type ApiFieldError } from '@/types/api'
import { useSessionStore } from '@/stores/session.store'

interface BackendErrorBody {
  success: false
  message?: string
  errors?: ApiFieldError[]
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

/**
 * Base HTTP client for the LSA API. `withCredentials` is required for the
 * backend's httpOnly auth cookies to be sent/received. The backend never
 * exposes the access token to JavaScript (cookie-only, with a Bearer-header
 * fallback the browser client doesn't use) — this client never attempts to
 * read or store it itself; the browser's cookie jar is the only place it
 * lives.
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
})

function toApiError(error: AxiosError<BackendErrorBody>): ApiError {
  const status = error.response?.status
  const body = error.response?.data
  const message =
    body?.message ?? error.message ?? 'Something went wrong. Please try again.'

  return new ApiError(message, { status, errors: body?.errors })
}

/**
 * Single-flight refresh: multiple requests failing with 401 at the same
 * moment must trigger exactly one POST /auth/refresh-token call, not one
 * per failed request — the backend's refresh token rotates on every call
 * and treats reuse of a stale token as revocation, so a duplicate
 * concurrent call would actively break the session instead of just being
 * wasteful. Deliberately uses a plain `axios.post` (not `apiClient`) so
 * this call never itself passes through the response interceptor below.
 */
let refreshPromise: Promise<void> | null = null

function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${env.apiBaseUrl}/auth/refresh-token`, null, { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<BackendErrorBody>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    const status = error.response?.status

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        await refreshAccessToken()
        return apiClient(originalRequest)
      } catch {
        useSessionStore.getState().clearSession()
        return Promise.reject(toApiError(error))
      }
    }

    return Promise.reject(toApiError(error))
  },
)
