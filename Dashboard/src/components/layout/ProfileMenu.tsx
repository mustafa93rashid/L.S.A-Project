import { Link } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSessionStore } from '@/stores/session.store'
import { useLogoutMutation } from '@/features/auth/queries'
import { cloudinaryThumbnail } from '@/lib/cloudinary'

function initials(fullName: string | undefined): string {
  if (!fullName) return '?'
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/**
 * The Topbar's sole account entry point — an avatar-only trigger (no
 * name/role ever shown beside it; that identity lives inside the menu it
 * opens) beside NotificationBell. Reuses the exact account behavior that
 * used to live in the Sidebar's user panel (same dropdown content, same
 * logout mutation) rather than inventing a new one; only the trigger's
 * presentation changed. Image is requested at 2x its ~40px display size
 * via cloudinaryThumbnail for a crisp retina render; a missing avatar
 * falls back to initials, never a broken image.
 */
export function ProfileMenu() {
  const user = useSessionStore((state) => state.user)
  const logoutMutation = useLogoutMutation()

  const avatarUrl = user?.avatar?.url
    ? cloudinaryThumbnail(user.avatar.url, 80)
    : undefined
  const accountLabel = user?.fullName ? `${user.fullName} — account menu` : 'Account menu'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={user?.fullName ?? 'Account'}
          aria-label={accountLabel}
          className="group bg-white relative shrink-0 rounded-full outline-none transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <Avatar
            size="lg"
            className="shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_10px_-4px_rgba(15,23,42,0.14)] transition-shadow duration-200 ease-out group-hover:shadow-[0_2px_4px_rgba(15,23,42,0.08),0_8px_18px_-6px_rgba(37,99,235,0.24)] group-aria-expanded:shadow-[0_2px_4px_rgba(15,23,42,0.08),0_8px_18px_-6px_rgba(37,99,235,0.24)]"
          >
            <AvatarImage src={avatarUrl} alt="" />
            <AvatarFallback className="bg-primary/10 text-[12px] font-semibold text-primary">
              {initials(user?.fullName)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={10} className="w-52">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
          <span className="truncate font-semibold text-foreground">{user?.fullName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <User className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="size-4" />
          {logoutMutation.isPending ? 'Signing out…' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
