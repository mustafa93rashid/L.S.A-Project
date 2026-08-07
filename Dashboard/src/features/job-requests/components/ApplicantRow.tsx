import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronRight, FileText, FileX, AlertTriangle } from 'lucide-react'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import {
  getCvFileAvailability,
  jobRequestStatusLabel,
  jobRequestStatusTone,
} from '@/features/job-requests/utils'
import type { JobRequest } from '@/features/job-requests/types'

interface ApplicantRowProps {
  request: JobRequest
}

function CvAvailabilityChip({ request }: { request: JobRequest }) {
  const availability = getCvFileAvailability(request.cv)

  if (availability === 'available') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <FileText className="size-3.5" aria-hidden="true" />
        CV attached
      </span>
    )
  }

  if (availability === 'legacy') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-warning">
        <AlertTriangle className="size-3.5" aria-hidden="true" />
        CV needs re-upload
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <FileX className="size-3.5" aria-hidden="true" />
      No CV
    </span>
  )
}

/** One applicant in the Applications inbox — a real link (not a
 * div+onClick), so the whole row is a native keyboard-focusable
 * navigation target with a visible focus ring, matching an ATS inbox
 * (GitHub PR / Linear issue list) rather than a dense generic table. */
export function ApplicantRow({ request }: ApplicantRowProps) {
  const fullName = `${request.firstName} ${request.lastName}`

  return (
    <Link
      to={`/job-requests/${request._id}`}
      className="group flex items-start gap-3 px-4 py-4 transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none sm:items-center sm:px-5"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-[15px] font-semibold text-foreground">
            {fullName}
          </span>
          <StatusBadge
            label={jobRequestStatusLabel(request.status)}
            tone={jobRequestStatusTone(request.status)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
          <span className="truncate">{request.email}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{request.phone}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">
            Applied for {request.job?.title ?? 'a removed job'}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5 pl-2">
        <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
          {format(new Date(request.createdAt), 'PP · p')}
        </span>
        <CvAvailabilityChip request={request} />
      </div>

      <ChevronRight
        className="mt-1 size-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground sm:mt-0"
        aria-hidden="true"
      />
    </Link>
  )
}
