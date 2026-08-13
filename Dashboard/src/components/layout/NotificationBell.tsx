import { Link } from 'react-router-dom'
import { formatDistanceToNowStrict } from 'date-fns'
import {
  Bell,
  CheckCheck,
  CircleAlert,
  Loader2,
  WifiOff,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { cn } from '@/lib/utils'
import { useNotificationStore } from '@/stores/notification.store'

import {
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationsQuery,
} from '@/features/notifications/queries'

import { getNotificationTypeMeta } from '@/features/notifications/utils'
import type { AppNotification } from '@/features/notifications/types'

// ==================== Notification Row ====================

function NotificationRow({
  notification,
  onRead,
}: {
  notification: AppNotification
  onRead: (id: string) => void
}) {
  const { icon: Icon, path } =
    getNotificationTypeMeta(notification.type)

  const handleRead = () => {
    if (!notification.isRead) {
      onRead(notification._id)
    }
  }

  const content = (
    <div
      className={cn(
        'group relative flex w-full items-start gap-3 rounded-xl p-3',
        'transition-colors duration-200',
        notification.isRead
          ? 'hover:bg-muted/60'
          : 'bg-primary/[0.045] hover:bg-primary/[0.075]',
      )}
    >
      {!notification.isRead ? (
        <span
          className="absolute top-3 right-3 size-2 rounded-full bg-primary ring-4 ring-primary/10"
          aria-hidden="true"
        />
      ) : null}

      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg border',
          'transition-colors duration-200',
          notification.isRead
            ? 'border-border/70 bg-muted text-muted-foreground'
            : 'border-primary/15 bg-primary/10 text-primary',
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1 pr-3">
        <div className="flex items-start gap-2">
          <p
            className={cn(
              'min-w-0 flex-1 truncate text-[13px] leading-5 text-foreground',
              notification.isRead
                ? 'font-medium'
                : 'font-semibold',
            )}
          >
            {notification.title}
          </p>
        </div>

        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {notification.message}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] font-medium text-muted-foreground/70 tabular-nums">
            {formatDistanceToNowStrict(
              new Date(notification.createdAt),
              {
                addSuffix: true,
              },
            )}
          </span>

          {!notification.isRead ? (
            <>
              <span className="size-1 rounded-full bg-border" />

              <span className="text-[10px] font-semibold tracking-wide text-primary uppercase">
                New
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (!path) {
    return (
      <DropdownMenuItem
        onSelect={handleRead}
        className="block cursor-default p-0 focus:bg-transparent"
      >
        {content}
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuItem
      asChild
      onSelect={handleRead}
      className="p-0 focus:bg-transparent"
    >
      <Link to={path} className="block">
        {content}
      </Link>
    </DropdownMenuItem>
  )
}

// ==================== Notification Bell ====================

export function NotificationBell() {
  const connectionStatus = useNotificationStore(
    (state) => state.connectionStatus,
  )

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useNotificationsQuery()

  const markAsReadMutation =
    useMarkNotificationAsReadMutation()

  const markAllAsReadMutation =
    useMarkAllNotificationsAsReadMutation()

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  const handleMarkAsRead = (id: string) => {
    if (markAsReadMutation.isPending) {
      return
    }

    markAsReadMutation.mutate(id)
  }

  const handleMarkAllAsRead = () => {
    if (
      unreadCount === 0 ||
      markAllAsReadMutation.isPending
    ) {
      return
    }

    markAllAsReadMutation.mutate()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className={cn(
            'relative rounded-xl',
            'border-border/70 bg-background/80',
            'shadow-xs backdrop-blur-sm',
            'transition-all duration-200',
            'hover:-translate-y-0.5 hover:border-primary/20',
            'hover:bg-accent/50 hover:shadow-md',
            'active:translate-y-0 active:scale-[0.97]',
          )}
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
        >
          <Bell
            className={cn(
              'size-[18px] transition-colors',
              unreadCount > 0
                ? 'text-foreground'
                : 'text-muted-foreground',
            )}
            aria-hidden="true"
          />

          {unreadCount > 0 ? (
            <span
              className={cn(
                'absolute -top-1.5 -right-1.5',
                'flex h-[18px] min-w-[18px] items-center justify-center',
                'rounded-full border-2 border-background bg-primary px-1',
                'text-[9px] font-bold leading-none text-primary-foreground',
                'shadow-sm tabular-nums',
              )}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className={cn(
          'w-[360px] overflow-hidden rounded-2xl p-0',
          'border-border/70 bg-popover/95',
          'shadow-[0_18px_50px_-18px_rgba(0,0,0,0.28)]',
          'backdrop-blur-xl',
        )}
      >
        {/* ==================== Header ==================== */}

        <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Notifications
              </h3>

              {unreadCount > 0 ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary tabular-nums">
                  {unreadCount} unread
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-[11px] text-muted-foreground">
              Recent activity and updates
            </p>
          </div>

          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={markAllAsReadMutation.isPending}
              onClick={(event) => {
                event.stopPropagation()
                handleMarkAllAsRead()
              }}
              className="h-8 shrink-0 gap-1.5 rounded-lg px-2.5 text-[11px]"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCheck className="size-3.5" />
              )}

              Mark all read
            </Button>
          ) : null}
        </div>

        {/* ==================== Connection Status ==================== */}

        {connectionStatus !== 'connected' ? (
          <div className="mx-3 mb-3 flex items-center gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2">
            <WifiOff className="size-3.5 shrink-0 text-amber-600" />

            <p className="text-[11px] leading-4 text-muted-foreground">
              {connectionStatus === 'connecting'
                ? 'Connecting to real-time updates…'
                : 'Real-time updates unavailable. Reconnecting…'}
            </p>
          </div>
        ) : null}

        <DropdownMenuSeparator className="m-0" />

        {/* ==================== Content ==================== */}

        <div className="max-h-[420px] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>

              <p className="text-xs text-muted-foreground">
                Loading notifications...
              </p>
            </div>
          ) : isError ? (
            <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <CircleAlert className="size-4 text-destructive" />
              </div>

              <p className="mt-3 text-sm font-medium text-foreground">
                Couldn&apos;t load notifications
              </p>

              <p className="mt-1 max-w-56 text-xs leading-5 text-muted-foreground">
                Something went wrong while loading your notifications.
              </p>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 h-8 rounded-lg text-xs"
                onClick={() => {
                  void refetch()
                }}
              >
                Try again
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex min-h-44 flex-col items-center justify-center px-6 text-center">
              <div className="relative flex size-12 items-center justify-center rounded-2xl border bg-muted/50">
                <Bell className="size-5 text-muted-foreground" />

                <span className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-background bg-emerald-500" />
              </div>

              <p className="mt-3 text-sm font-semibold text-foreground">
                You&apos;re all caught up
              </p>

              <p className="mt-1 max-w-56 text-xs leading-5 text-muted-foreground">
                New activity will appear here when it arrives.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification._id}
                  notification={notification}
                  onRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </div>

        {/* ==================== Footer ==================== */}

        {notifications.length > 0 ? (
          <>
            <DropdownMenuSeparator className="m-0" />

            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[10px] text-muted-foreground">
                Showing latest {notifications.length} notifications
              </span>

              <span
                className={cn(
                  'flex items-center gap-1.5 text-[10px] font-medium',
                  connectionStatus === 'connected'
                    ? 'text-emerald-600'
                    : 'text-muted-foreground',
                )}
              >

              </span>
            </div>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}