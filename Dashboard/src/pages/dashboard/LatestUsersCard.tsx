import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/data-display/RoleBadge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Role } from '@/constants/roles'

interface LatestUser {
  id: string
  fullName: string
  role: Role
  createdAt: string
}

interface LatestUsersCardProps {
  users: LatestUser[] | undefined
  isLoading: boolean
}

function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/** Superadmin-only — same `GET /users` data the Users page itself uses,
 * just the 5 most recent (backend already sorts newest-first). */
export function LatestUsersCard({ users, isLoading }: LatestUsersCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-5">
        <h2 className="text-sm font-semibold text-foreground">Latest Users</h2>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : users && users.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <Avatar size="sm">
                  <AvatarFallback>{initials(user.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {user.fullName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Joined{' '}
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <RoleBadge role={user.role} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No users yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
