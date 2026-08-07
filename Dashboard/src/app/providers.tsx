import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { SocketSync } from '@/app/SocketSync'
import { TooltipProvider } from '@/components/ui/tooltip'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * All app-wide providers, composed once here so `App.tsx` stays a plain
 * composition root. Order matters: ErrorBoundary is outermost so it can
 * catch errors thrown by anything rendered inside it, including consumers
 * of the QueryClient context.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SocketSync />
          {children}
          <Toaster richColors closeButton position="bottom-right" theme="light" />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
