import { Briefcase, Inbox, Mail, Bell, type LucideIcon } from 'lucide-react'
import type { NotificationType } from '@/features/notifications/types'

interface NotificationTypeMeta {
  icon: LucideIcon
  /** Where clicking the notification navigates. `null` for `system` (never
   * actually emitted by the backend, and has no associated resource). */
  path: string | null
}

/**
 * The backend only ever emits a given notification type to the roles that
 * also have dashboard access to its linked module (verified: the role sets
 * in `Backend/src/services/notification.service.js` match
 * `MODULE_ROLES[MODULES.EQUIPMENT_REQUESTS/JOB_REQUESTS/CONTACT_MESSAGES]`
 * exactly) — so a notification's target route is always one the receiving
 * user can already open, no extra guard needed here.
 */
const NOTIFICATION_TYPE_META: Record<NotificationType, NotificationTypeMeta> = {
  equipmentRequest: { icon: Inbox, path: '/equipment-requests' },
  jobRequest: { icon: Briefcase, path: '/job-requests' },
  contactMessage: { icon: Mail, path: '/contact-messages' },
  system: { icon: Bell, path: null },
}

export function getNotificationTypeMeta(type: NotificationType): NotificationTypeMeta {
  return NOTIFICATION_TYPE_META[type]
}
