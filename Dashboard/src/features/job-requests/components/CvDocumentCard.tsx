import { AlertTriangle, FileText, FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  cvFileTypeLabel,
  formatFileSize,
  getCvFileAvailability,
} from '@/features/job-requests/utils'
import type { JobRequestCv } from '@/features/job-requests/types'

interface CvDocumentCardProps {
  cv: JobRequestCv | null | undefined
}

/** The "Submitted Documents" section content on the applicant details
 * page — never renders an actionable link for a file that can't
 * actually be opened; always resolves to one of three honest states. */
export function CvDocumentCard({ cv }: CvDocumentCardProps) {
  const availability = getCvFileAvailability(cv)

  if (availability === 'missing' || !cv) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-5 py-6">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <FileX className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-foreground">No document submitted</p>
          <p className="text-sm text-muted-foreground">
            This application does not include a CV file.
          </p>
        </div>
      </div>
    )
  }

  if (availability === 'legacy') {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border border-dashed border-warning/40 bg-warning-subtle/50 px-5 py-6"
        role="status"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning-subtle text-warning">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-foreground">
            This document can't be previewed
          </p>
          <p className="text-sm text-muted-foreground">
            &ldquo;{cv.originalName}&rdquo; was uploaded using a previous storage format
            and can no longer be opened or downloaded. Ask the applicant to resubmit their
            CV.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info-subtle text-info">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {cv.originalName}
          </span>
          <span className="text-xs text-muted-foreground">
            {cvFileTypeLabel(cv.mimeType)} · {formatFileSize(cv.size)} · Uploaded
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <a
            href={cv.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${cv.originalName}`}
          >
            View
          </a>
        </Button>
        <Button asChild size="sm">
          <a
            href={cv.url}
            download={cv.originalName}
            aria-label={`Download ${cv.originalName}`}
          >
            Download
          </a>
        </Button>
      </div>
    </div>
  )
}
