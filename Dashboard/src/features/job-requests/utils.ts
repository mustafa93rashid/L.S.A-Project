import type { StatusTone } from '@/components/data-display/StatusBadge'
import type { JobRequestCv, JobRequestStatus } from '@/features/job-requests/types'

export function jobRequestStatusTone(status: JobRequestStatus): StatusTone {
  switch (status) {
    case 'new':
      return 'info'
    case 'reviewed':
    case 'shortlisted':
      return 'warning'
    case 'accepted':
      return 'success'
    case 'rejected':
      return 'danger'
    case 'ignored':
      return 'neutral'
  }
}

export function jobRequestStatusLabel(status: JobRequestStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const MIME_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF document',
  'application/msword': 'Word document (.doc)',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'Word document (.docx)',
}

/** Human label for a CV's stored mimeType — falls back to a generic label
 * for any type the backend's validator didn't reject but this list
 * doesn't otherwise recognize, rather than showing a raw MIME string. */
export function cvFileTypeLabel(mimeType: string): string {
  return MIME_TYPE_LABELS[mimeType] ?? 'Document'
}

/** "128 KB" / "2.4 MB" — bytes is always populated by the backend (a
 * required schema field), so no "unknown size" case is needed. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`
}

/** Extracts the extension from a URL's last path segment, or null when
 * there isn't one. Cloudinary raw resources uploaded before the storage
 * fix (see Backend/src/services/cloudinary.service.js) have no extension
 * on their public ID, which is exactly what makes them undeliverable —
 * this is used to detect those legacy records so the UI can show a clear
 * "can't be previewed" state instead of a broken link. */
function getUrlExtension(url: string): string | null {
  const lastSegment = url.split('/').pop() ?? ''
  const match = /\.([a-zA-Z0-9]+)$/.exec(lastSegment)
  return match ? match[1].toLowerCase() : null
}

export type CvFileAvailability = 'available' | 'legacy' | 'missing'

/** Classifies a submitted CV so the UI never renders a link it can't
 * back up: 'missing' when there's no URL at all, 'legacy' when the URL
 * was generated before the extension fix (undeliverable by Cloudinary,
 * see the root-cause writeup), 'available' otherwise. */
export function getCvFileAvailability(
  cv: JobRequestCv | null | undefined,
): CvFileAvailability {
  if (!cv?.url) return 'missing'

  let parsed: URL
  try {
    parsed = new URL(cv.url)
  } catch {
    return 'missing'
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return 'missing'

  return getUrlExtension(cv.url) === null ? 'legacy' : 'available'
}
