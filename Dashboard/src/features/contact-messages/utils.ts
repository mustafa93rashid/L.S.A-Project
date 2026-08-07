import type { StatusTone } from '@/components/data-display/StatusBadge'
import type { ContactMessageStatus } from '@/features/contact-messages/types'

export function contactMessageStatusTone(status: ContactMessageStatus): StatusTone {
  switch (status) {
    case 'new':
      return 'info'
    case 'read':
      return 'warning'
    case 'replied':
      return 'success'
    case 'archived':
      return 'neutral'
  }
}

export function contactMessageStatusLabel(status: ContactMessageStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
