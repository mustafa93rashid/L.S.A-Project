import { QueryClient } from '@tanstack/react-query'

/**
 * Global defaults — deliberately conservative. Individual modules override
 * `staleTime`/`refetchOnWindowFocus` per resource later (e.g. the
 * request-queue inboxes want fresher data than static content lists).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
