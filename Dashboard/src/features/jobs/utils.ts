import type { StatusTone } from '@/components/data-display/StatusBadge'
import type { JobStatus } from '@/features/jobs/types'

export function jobStatusTone(status: JobStatus): StatusTone {
  switch (status) {
    case 'draft':
      return 'warning'
    case 'published':
      return 'success'
    case 'closed':
      return 'neutral'
  }
}

export function jobStatusLabel(status: JobStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
