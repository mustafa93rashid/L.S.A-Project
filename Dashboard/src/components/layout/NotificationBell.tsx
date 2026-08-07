import { Link } from 'react-router-dom'
import { formatDistanceToNowStrict } from 'date-fns'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useNotificationStore } from '@/stores/notification.store'
import { getNotificationTypeMeta } from '@/features/notifications/utils'
import type { AppNotification } from '@/features/notifications/types'

function NotificationRow({
  notification,
  onRead,
}: {
  notification: AppNotification
  onRead: (id: string) => void
}) {
  const { icon: Icon, path } = getNotificationTypeMeta(notification.type)

  const content = (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-md px-2 py-2 text-sm',
        !notification.isRead && 'bg-accent/60',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          {!notification.isRead ? (
            <span
              className="size-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden="true"
            />
          ) : null}
          <span className="truncate font-medium text-foreground">
            {notification.title}
          </span>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {notification.message}
        </p>
        <span className="text-xs text-muted-foreground/70 tabular-nums">
          {formatDistanceToNowStrict(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  )

  if (!path) {
    return (
      <DropdownMenuItem
        onSelect={() => onRead(notification._id)}
        className="cursor-default focus:bg-transparent"
      >
        {content}
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuItem asChild onSelect={() => onRead(notification._id)}>
      <Link to={path}>{content}</Link>
    </DropdownMenuItem>
  )
}

/** Bell icon + unread badge + recent-notifications dropdown, driven
 * entirely by the live Socket.IO feed (app/SocketSync.tsx) — there is no
 * history endpoint on the backend, so "recent" means "received this
 * session," not a persisted inbox. */
export function NotificationBell() {
  const notifications = useNotificationStore((state) => state.notifications)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const connectionStatus = useNotificationStore((state) => state.connectionStatus)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="relative transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_6px_16px_-4px_rgba(37,99,235,0.18)] active:translate-y-0 active:scale-[0.97] active:shadow-xs"
          aria-label={
            unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
          }
        >
          <Bell className="size-[18px]" aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-card bg-primary px-1 text-[9.5px] font-bold tabular-nums text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0 font-medium">Notifications</DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={(event) => {
                event.stopPropagation()
                markAllAsRead()
              }}
            >
              Mark all as read
            </Button>
          ) : null}
        </div>
        {connectionStatus !== 'connected' ? (
          <p className="px-2 pb-1.5 text-xs text-muted-foreground">
            {connectionStatus === 'connecting'
              ? 'Connecting for real-time updates…'
              : 'Real-time updates unavailable — reconnecting…'}
          </p>
        ) : null}
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          notifications.map((notification) => (
            <NotificationRow
              key={notification._id}
              notification={notification}
              onRead={markAsRead}
            />
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
