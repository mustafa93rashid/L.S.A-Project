/**
 * Single typed access point for environment variables — reads fail fast at
 * module load if a required variable is missing, instead of surfacing as an
 * obscure runtime error later (e.g. a silent `undefined` baseURL in Axios).
 */
function readEnvVar(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

/**
 * `VITE_SOCKET_URL` is intentionally optional (unlike `VITE_API_BASE_URL`):
 * the auth cookie the socket handshake relies on is scoped to whichever
 * origin the browser thinks it's talking to, so — exactly like the REST
 * API — the socket must connect same-origin (through the dev proxy locally,
 * through the reverse proxy in production strategy A) for the cookie to be
 * sent at all. Leaving it unset means "same origin as the page" (passing no
 * URL to `socket.io-client`); it only needs a value for a genuine
 * cross-origin deployment (strategy B), matching the same two strategies
 * documented in README.md for `VITE_API_BASE_URL`.
 */
function readOptionalEnvVar(key: keyof ImportMetaEnv): string | undefined {
  return import.meta.env[key] || undefined
}

export const env = Object.freeze({
  apiBaseUrl: readEnvVar('VITE_API_BASE_URL'),
  socketUrl: readOptionalEnvVar('VITE_SOCKET_URL'),
})
