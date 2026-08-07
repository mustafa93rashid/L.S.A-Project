import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/** Top-level render-error boundary. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled application error:', error, info.componentStack)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background p-6 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-destructive-subtle text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <p className="text-lg font-semibold tracking-tight text-foreground">
            Something went wrong
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            An unexpected error occurred. Try reloading the page.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={this.handleReload}
            className="mt-2"
          >
            Reload
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
