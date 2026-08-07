import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  Clock,
  Info,
  MoreVertical,
  Phone,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { RoleBadge } from '@/components/data-display/RoleBadge'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { cn } from '@/lib/utils'
import type { User } from '@/features/users/types'

interface UserCardProps {
  user: User
  /** The signed-in user viewing this card — every mutating action is
   * disabled on your own account, mirroring the backend's own
   * `req.params.id === req.user.id` guards on status/role/delete. */
  isSelf: boolean
  onChangeRole: () => void
  onToggleStatus: () => void
  onDelete: () => void
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase() || '?'
}

/** "August 5, 2026 • 4:35 PM" — full date + exact time, in whatever
 * timezone the browser itself is already in (plain `Date`/`date-fns`
 * read the system clock, nothing is hardcoded to UTC or any fixed
 * offset). Kept to the app's existing English-only formatting
 * convention (see docs/ARCHITECTURE.md's "Known deliberate non-goals")
 * rather than switching to `Intl` locale-name formatting, which would be
 * the one date on this page rendering differently from every other
 * timestamp in the dashboard. */
function formatLastLogin(lastLoginAt: string | null): string {
  if (!lastLoginAt) return 'Never'
  const date = new Date(lastLoginAt)
  return `${format(date, 'MMMM d, yyyy')} • ${format(date, 'h:mm a')}`
}

/** Verified live against `GET /users` (see the comment on
 * `User['createdBy']`): the backend never populates this field, so a
 * non-null value is always just an id — never a name to display. Showing
 * "Unknown" here is the honest fallback the id itself doesn't resolve;
 * inventing a name would be showing data the backend never sent. */
function getCreatedByLabel(createdBy: string | null): string {
  return createdBy === null ? 'System' : 'Unknown'
}

interface DetailRowProps {
  icon: LucideIcon
  label: string
  value: string
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="text-[10.5px] font-semibold tracking-wide uppercase">
          {label}
        </span>
      </div>
      <p className="pl-5 text-[13px] font-medium text-balance text-foreground">{value}</p>
    </div>
  )
}

// `min-h` lives on each face directly (not the rotating parent) — a
// percentage/`h-full` height on the front face wouldn't reliably resolve
// against a parent whose own height is just "auto" (determined by that
// same child), and CardContent's `flex-1` below needs a real height on
// its own flex container to have anything to grow into.
const FACE_BASE_CLASSES =
  'flex min-h-92 flex-col gap-0 rounded-xl border border-border bg-card py-0 text-sm text-card-foreground shadow-xs transition-[box-shadow,border-color] duration-200 ease-out [backface-visibility:hidden] hover:border-primary/15 hover:shadow-card'

/**
 * One card in the Users directory grid — a true 3D flip card. The front
 * (identity) and back (account details) are two full-height faces of the
 * same physical card, rotated 180° apart around the Y axis; only the
 * container's own rotation animates, so nothing reflows or jumps.
 *
 * Accessibility: the whole card body is a mouse-only click-to-flip
 * convenience (a plain `onClick`, no ARIA role — deliberately, so it's
 * never exposed to assistive tech as a single giant control wrapping the
 * real action menu button, which would be invalid/confusing nested
 * semantics). The actual keyboard/screen-reader-operable control is one
 * small, real `<button>` per face ("View details" / "Back to profile"),
 * each a sibling of — never a wrapper around — the menu button. Whichever
 * face isn't currently showing is `inert` (removes it from the tab order
 * and the accessibility tree in one step) and `pointer-events-none` (belt
 *-and-suspenders against `backface-visibility` hit-testing differences
 * across browsers), and focus is moved to the newly-revealed face's own
 * button after a user-initiated flip so keyboard focus never gets stuck
 * on a control that just became inert.
 */
export function UserCard({
  user,
  isSelf,
  onChangeRole,
  onToggleStatus,
  onDelete,
}: UserCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const hasInteractedRef = useRef(false)
  const frontHintRef = useRef<HTMLButtonElement>(null)
  const backHintRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!hasInteractedRef.current) return
    ;(isFlipped ? backHintRef : frontHintRef).current?.focus()
  }, [isFlipped])

  function toggleFlip() {
    hasInteractedRef.current = true
    setIsFlipped((current) => !current)
  }

  return (
    // Three separate transform layers, each on its own element — a
    // hover-lift `translateY` and the flip's `rotateY` would otherwise
    // fight over the single CSS `transform` property on one element.
    <div className="[perspective:1400px]">
      <div className="transition-transform duration-200 ease-out hover:-translate-y-0.5">
        <div
          className="relative transition-transform duration-[450ms] ease-in-out [transform-style:preserve-3d]"
          style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front — identity */}
          <Card
            className={cn(FACE_BASE_CLASSES, isFlipped && 'pointer-events-none')}
            inert={isFlipped || undefined}
            aria-hidden={isFlipped}
            onClick={toggleFlip}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={(event) => event.stopPropagation()}
                  className="absolute top-3 right-3 z-10 rounded-full border border-border/60 bg-card text-muted-foreground shadow-xs transition-all duration-200 ease-out hover:scale-105 hover:border-border hover:text-foreground hover:shadow-card active:scale-95"
                  aria-label={`Actions for ${user.fullName}`}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48"
                onClick={(event) => event.stopPropagation()}
              >
                <DropdownMenuItem onSelect={onChangeRole} disabled={isSelf}>
                  <Shield className="size-4" />
                  Change role
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onToggleStatus} disabled={isSelf}>
                  {user.isActive ? (
                    <UserX className="size-4" />
                  ) : (
                    <UserCheck className="size-4" />
                  )}
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={onDelete}
                  disabled={isSelf}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pt-8 pb-5 text-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar size="xl" className="shadow-card">
                    <AvatarImage
                      src={
                        user.avatar.url
                          ? cloudinaryThumbnail(user.avatar.url, 160)
                          : undefined
                      }
                      alt={user.fullName}
                    />
                    <AvatarFallback className="font-semibold">
                      {initials(user.fullName)}
                    </AvatarFallback>
                    <AvatarBadge
                      className={user.isActive ? 'bg-success' : 'bg-muted-foreground/60'}
                      aria-hidden="true"
                    />
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  {user.isActive ? 'Active account' : 'Inactive account'}
                </TooltipContent>
              </Tooltip>
              {/* The avatar badge is a hover-only affordance (the avatar
                itself isn't keyboard-focusable) — this is the real,
                always-present accessible status text. */}
              <span className="sr-only">
                {user.isActive ? 'Active account' : 'Inactive account'}
              </span>

              <div className="flex min-w-0 flex-col gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="max-w-52 truncate text-[15.5px] font-semibold text-foreground">
                      {user.fullName}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>{user.fullName}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="max-w-52 truncate text-[12.5px] text-muted-foreground">
                      {user.email}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>{user.email}</TooltipContent>
                </Tooltip>
              </div>

              <RoleBadge role={user.role} />
            </CardContent>

            <div className="flex justify-center border-t border-border py-2.5">
              <Button
                ref={frontHintRef}
                type="button"
                variant="ghost"
                size="sm"
                tabIndex={isFlipped ? -1 : 0}
                aria-pressed={isFlipped}
                aria-label={`View account details for ${user.fullName}`}
                onClick={(event) => {
                  event.stopPropagation()
                  toggleFlip()
                }}
                className="h-7 gap-1.5 px-2.5 text-[11.5px] text-muted-foreground hover:text-primary"
              >
                <Info className="size-3.5" />
                View details
              </Button>
            </div>
          </Card>

          {/* Back — account details */}
          <Card
            className={cn(
              FACE_BASE_CLASSES,
              'absolute inset-0 [transform:rotateY(180deg)]',
              !isFlipped && 'pointer-events-none',
            )}
            inert={!isFlipped || undefined}
            aria-hidden={!isFlipped}
            onClick={toggleFlip}
          >
            <CardContent className="@container flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
              <p className="text-center text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                Account details
              </p>

              <div className="grid grid-cols-1 gap-x-5 gap-y-4 @[22rem]:grid-cols-2">
                <DetailRow
                  icon={Building2}
                  label="Department"
                  value={user.department ?? '—'}
                />
                <DetailRow icon={Phone} label="Phone" value={user.phone ?? '—'} />
                <DetailRow
                  icon={Clock}
                  label="Last login"
                  value={formatLastLogin(user.lastLoginAt)}
                />
                <DetailRow
                  icon={CalendarCheck}
                  label="Joined"
                  value={format(new Date(user.createdAt), 'MMMM d, yyyy')}
                />
                <DetailRow
                  icon={UserPlus}
                  label="Created by"
                  value={getCreatedByLabel(user.createdBy)}
                />
              </div>
            </CardContent>

            <div className="flex justify-center border-t border-border py-2.5">
              <Button
                ref={backHintRef}
                type="button"
                variant="ghost"
                size="sm"
                tabIndex={isFlipped ? 0 : -1}
                aria-pressed={isFlipped}
                aria-label={`Back to profile for ${user.fullName}`}
                onClick={(event) => {
                  event.stopPropagation()
                  toggleFlip()
                }}
                className="h-7 gap-1.5 px-2.5 text-[11.5px] text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="size-3.5" />
                Back to profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
