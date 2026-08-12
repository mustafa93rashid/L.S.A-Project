import { useState } from 'react'
import { format } from 'date-fns'
import {
  AtSign,
  CalendarDays,
  Clock3,
  MoreHorizontal,
  Phone,
  RotateCcw,
  ShieldCheck,
  UserCog,
  UserRoundCheck,
  UserRoundX,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { ROLE_LABELS } from '@/constants/roles'
import type { User } from '@/features/users/types'

interface UserCardProps {
  user: User
  isSelf?: boolean
  onChangeRole: () => void
  onToggleStatus: () => void
  onDelete: () => void
}

function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function UserCard({
  user,
  isSelf = false,
  onChangeRole,
  onToggleStatus,
  onDelete,
}: UserCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const initials = getInitials(user.fullName)

  const handleCardClick = () => {
    setIsFlipped((current) => !current)
  }

  return (
    <div className="group relative h-[390px] w-full [perspective:1200px]">
      <div
        role="button"
        tabIndex={0}
        aria-label={`${
          isFlipped ? 'Show user profile' : 'Show user activity'
        } for ${user.fullName}`}
        onClick={handleCardClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleCardClick()
          }
        }}
        className={`
          relative
          h-full
          w-full
          cursor-pointer
          transition-transform
          duration-700
          [transform-style:preserve-3d]
          ${
            isFlipped
              ? '[transform:rotateY(180deg)]'
              : ''
          }
        `}
      >
        {/* ================================================== */}
        {/* Front */}
        {/* ================================================== */}

        <article
          className="
            absolute
            inset-0
            overflow-hidden
            rounded-[22px]
            border
            border-border/70
            bg-card
            shadow-[0_1px_3px_rgba(0,0,0,0.025)]
            transition-shadow
            duration-300
            [backface-visibility:hidden]
            group-hover:shadow-[0_14px_34px_rgba(0,0,0,0.06)]
          "
        >
          <div className="relative flex h-full flex-col">
            <div
              className="
                relative
                flex
                flex-1
                flex-col
                items-center
                justify-center
                border-b
                border-border/60
                bg-gradient-to-b
                from-muted/35
                via-card
                to-card
                px-5
                py-5
              "
            >
              {/* Actions */}

              <div
                className="absolute right-3 top-3 z-20"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${user.fullName}`}
                      className="
                        rounded-lg
                        text-muted-foreground
                        hover:bg-background
                        hover:text-foreground
                      "
                    >
                      <MoreHorizontal
                        className="size-4"
                        strokeWidth={1.8}
                      />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-48"
                  >
                    <DropdownMenuItem
                      onSelect={onChangeRole}
                    >
                      <UserCog className="size-4" />
                      Change role
                    </DropdownMenuItem>

                    {!isSelf ? (
                      <>
                        <DropdownMenuItem
                          onSelect={onToggleStatus}
                        >
                          {user.isActive ? (
                            <UserRoundX className="size-4" />
                          ) : (
                            <UserRoundCheck className="size-4" />
                          )}

                          {user.isActive
                            ? 'Deactivate user'
                            : 'Activate user'}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="
                            text-destructive
                            focus:text-destructive
                          "
                          onSelect={onDelete}
                        >
                          Delete user
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status */}

              <div className="absolute left-4 top-4">
                <Badge
                  variant={
                    user.isActive
                      ? 'success'
                      : 'secondary'
                  }
                >
                  {user.isActive
                    ? 'Active'
                    : 'Inactive'}
                </Badge>
              </div>

              {/* Avatar */}

              <div className="relative">
                {user.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt={user.fullName}
                    className="
                      size-28
                      rounded-full
                      border-[5px]
                      border-card
                      object-cover
                      shadow-[0_10px_30px_rgba(0,0,0,0.11)]
                      ring-1
                      ring-border/70
                      transition-transform
                      duration-300
                      group-hover:scale-[1.025]
                    "
                  />
                ) : (
                  <div
                    className="
                      flex
                      size-28
                      items-center
                      justify-center
                      rounded-full
                      border-[5px]
                      border-card
                      bg-muted
                      shadow-[0_10px_30px_rgba(0,0,0,0.08)]
                      ring-1
                      ring-border/70
                    "
                  >
                    <span
                      className="
                        text-[28px]
                        font-semibold
                        tracking-[-0.06em]
                        text-foreground
                      "
                    >
                      {initials}
                    </span>
                  </div>
                )}

                <span
                  className={`
                    absolute
                    bottom-1
                    right-1
                    size-[18px]
                    rounded-full
                    border-[4px]
                    border-card
                    ${
                      user.isActive
                        ? 'bg-success'
                        : 'bg-muted-foreground/40'
                    }
                  `}
                />
              </div>

              {/* Name */}

              <div className="mt-4 flex max-w-full items-center gap-2">
                <h3
                  className="
                    max-w-[240px]
                    truncate
                    text-center
                    text-[17px]
                    font-semibold
                    tracking-[-0.025em]
                    text-foreground
                  "
                >
                  {user.fullName}
                </h3>

                {isSelf ? (
                  <Badge
                    variant="secondary"
                    className="
                      shrink-0
                      px-1.5
                      py-0
                      text-[8px]
                      font-semibold
                      tracking-[0.08em]
                      uppercase
                    "
                  >
                    You
                  </Badge>
                ) : null}
              </div>

              {/* Email */}

              <div
                className="
                  mt-1.5
                  flex
                  max-w-full
                  items-center
                  gap-1.5
                  text-muted-foreground
                "
              >
                <AtSign
                  className="size-3 shrink-0"
                  strokeWidth={1.8}
                />

                <span className="max-w-[240px] truncate text-[10px]">
                  {user.email}
                </span>
              </div>

              {/* Role */}

              <div
                className="
                  mt-4
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-border/60
                  bg-background/70
                  px-3
                  py-2
                "
              >
                <ShieldCheck
                  className="size-3.5 text-muted-foreground"
                  strokeWidth={1.8}
                />

                <div>
                  <p
                    className="
                      text-[7px]
                      font-semibold
                      tracking-[0.1em]
                      text-muted-foreground/55
                      uppercase
                    "
                  >
                    Assigned role
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-[10px]
                      font-semibold
                      text-foreground
                    "
                  >
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}

            <div className="grid grid-cols-2 divide-x divide-border/60">
              <div className="min-w-0 px-4 py-3.5">
                <div
                  className="
                    flex
                    items-center
                    gap-1.5
                    text-muted-foreground/55
                  "
                >
                  <AtSign
                    className="size-3"
                    strokeWidth={1.8}
                  />

                  <span
                    className="
                      text-[8px]
                      font-semibold
                      tracking-[0.1em]
                      uppercase
                    "
                  >
                    Email
                  </span>
                </div>

                <p
                  className="
                    mt-1.5
                    truncate
                    text-[10px]
                    font-medium
                    text-foreground
                  "
                >
                  {user.email}
                </p>
              </div>

              <div className="min-w-0 px-4 py-3.5">
                <div
                  className="
                    flex
                    items-center
                    gap-1.5
                    text-muted-foreground/55
                  "
                >
                  <Phone
                    className="size-3"
                    strokeWidth={1.8}
                  />

                  <span
                    className="
                      text-[8px]
                      font-semibold
                      tracking-[0.1em]
                      uppercase
                    "
                  >
                    Phone
                  </span>
                </div>

                <p
                  className="
                    mt-1.5
                    truncate
                    text-[10px]
                    font-medium
                    text-foreground
                  "
                >
                  {user.phone || '—'}
                </p>
              </div>
            </div>

            {/* Footer */}

            <div
              className="
                flex
                items-center
                justify-between
                gap-3
                border-t
                border-border/60
                bg-muted/[0.08]
                px-4
                py-3
              "
            >
              <div className="flex items-center gap-2">
                <span
                  className={`
                    size-1.5
                    rounded-full
                    ${
                      user.isActive
                        ? 'bg-success'
                        : 'bg-muted-foreground/30'
                    }
                  `}
                />

                <span
                  className="
                    text-[9px]
                    font-medium
                    text-muted-foreground
                  "
                >
                  {user.isActive
                    ? 'Account enabled'
                    : 'Account disabled'}
                </span>
              </div>

              <span
                className="
                  text-[8px]
                  font-semibold
                  tracking-[0.1em]
                  text-muted-foreground/45
                  uppercase
                "
              >
                Click for activity
              </span>
            </div>
          </div>
        </article>

        {/* ================================================== */}
        {/* Back */}
        {/* ================================================== */}

        <article
          className="
            absolute
            inset-0
            overflow-hidden
            rounded-[22px]
            border
            border-border/70
            bg-card
            shadow-[0_14px_34px_rgba(0,0,0,0.06)]
            [backface-visibility:hidden]
            [transform:rotateY(180deg)]
          "
        >
          <div className="flex h-full flex-col">
            {/* Back Header */}



            {/* Activity Information */}

            <div
              className="
                flex
                flex-1
                flex-col
                justify-center
                gap-3
                p-5
              "
            >
              {/* Last Login */}

              <div
                className="
                  rounded-[18px]
                  border
                  border-border/70
                  bg-muted/[0.12]
                  p-4
                "
              >
                <div className="flex items-start gap-3">
                  <div
                    className="
                      flex
                      size-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-border/70
                      bg-background
                      text-muted-foreground
                    "
                  >
                    <Clock3
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        text-[8px]
                        font-semibold
                        tracking-[0.12em]
                        text-muted-foreground/55
                        uppercase
                      "
                    >
                      Last login
                    </p>

                    <p
                      className="
                        mt-1.5
                        text-[13px]
                        font-semibold
                        text-foreground
                      "
                    >
                      {user.lastLoginAt
                        ? format(
                            new Date(user.lastLoginAt),
                            'MMM d, yyyy',
                          )
                        : 'Never'}
                    </p>

                    <p
                      className="
                        mt-1
                        text-[10px]
                        text-muted-foreground
                      "
                    >
                      {user.lastLoginAt
                        ? format(
                            new Date(user.lastLoginAt),
                            'h:mm a',
                          )
                        : 'This account has not signed in yet.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Joined At */}

              <div
                className="
                  rounded-[18px]
                  border
                  border-border/70
                  bg-muted/[0.12]
                  p-4
                "
              >
                <div className="flex items-start gap-3">
                  <div
                    className="
                      flex
                      size-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-border/70
                      bg-background
                      text-muted-foreground
                    "
                  >
                    <CalendarDays
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        text-[8px]
                        font-semibold
                        tracking-[0.12em]
                        text-muted-foreground/55
                        uppercase
                      "
                    >
                      Joined at
                    </p>

                    <p
                      className="
                        mt-1.5
                        text-[13px]
                        font-semibold
                        text-foreground
                      "
                    >
                      {format(
                        new Date(user.createdAt),
                        'MMM d, yyyy',
                      )}
                    </p>

                    <p
                      className="
                        mt-1
                        text-[10px]
                        text-muted-foreground
                      "
                    >
                      {format(
                        new Date(user.createdAt),
                        'h:mm a',
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Added By */}

              <div
                className="
                  rounded-[18px]
                  border
                  border-border/70
                  bg-muted/[0.12]
                  p-4
                "
              >
                <div className="flex items-start gap-3">
                  <div
                    className="
                      flex
                      size-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-border/70
                      bg-background
                      text-muted-foreground
                    "
                  >
                    <UserRoundCheck
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        text-[8px]
                        font-semibold
                        tracking-[0.12em]
                        text-muted-foreground/55
                        uppercase
                      "
                    >
                      Added by
                    </p>

                    <p
                      className="
                        mt-1.5
                        truncate
                        text-[13px]
                        font-semibold
                        text-foreground
                      "
                    >
                      {user.createdBy?.fullName ?? 'System'}
                    </p>

                    <p
                      className="
                        mt-1
                        truncate
                        text-[10px]
                        text-muted-foreground
                      "
                    >
                      {user.createdBy?.email ??
                        'System generated account'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back Footer */}

            <div
              className="
                border-t
                border-border/60
                bg-muted/[0.08]
                px-4
                py-3
                text-center
              "
            >
              <span
                className="
                  text-[8px]
                  font-semibold
                  tracking-[0.1em]
                  text-muted-foreground/45
                  uppercase
                "
              >
                Click anywhere to return to profile
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}