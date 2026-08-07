/** Mirrors Backend/src/models/notification.model.js exactly. `system` is a
 * real enum value on the backend but no code path there ever creates one
 * (confirmed by searching every `Notification.create` call) — kept here
 * for type completeness, not because it's expected to arrive. */
export const NOTIFICATION_TYPES = [
  'equipmentRequest',
  'jobRequest',
  'contactMessage',
  'system',
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export type NotificationReferenceModel =
  'EquipmentRequest' | 'JobRequest' | 'ContactMessage'

export interface AppNotification {
  _id: string
  type: NotificationType
  title: string
  message: string
  reference: {
    model: NotificationReferenceModel
    id: string
  }
  metadata: Record<string, unknown>
  isRead: boolean
  readAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

/** The exact payload shape `notification.service.js`'s `emitNotificationSafely`
 * sends on the `notification:new` event — verified live against the real
 * backend, not assumed. */
export interface NotificationEventPayload {
  success: boolean
  data: AppNotification
}
