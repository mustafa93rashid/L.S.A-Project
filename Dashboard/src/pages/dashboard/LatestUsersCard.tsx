import { formatDistanceToNow } from 'date-fns'
import { Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/data-display/RoleBadge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Role } from '@/constants/roles'
import { SectionHeader } from '@/components/layout/SectionHeader'


interface LatestUser {
  id: string
  fullName: string
  role: Role
  createdAt: string
  avatar: {
    url: string | null
  }
}


interface LatestUsersCardProps {
  users: LatestUser[] | undefined
  isLoading: boolean
}


function initials(fullName: string): string {
  return fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}


function UserSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
      <Skeleton className="size-11 shrink-0 rounded-full" />

      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-3 w-20" />
      </div>

      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  )
}


export function LatestUsersCard({ users, isLoading }: LatestUsersCardProps) {
  const userCount = users?.length ?? 0

  return (
    <section className="space-y-5">

      <SectionHeader
        eyebrow="Users"
        title="Latest Users"
        description="Recently added dashboard accounts."
        icon={Users}
        statLabel="Recent"
        statValue={userCount}
        showStat={!isLoading && userCount > 0}
      />


      <Card className="overflow-hidden rounded-[22px] border-border/70 bg-card p-0 shadow-[0_1px_3px_rgba(0,0,0,0.025)]">

        {isLoading ? (
          <div className="divide-y divide-border/50">
            {Array.from({ length: 4 }).map((_, index) => (
              <UserSkeleton key={index} />
            ))}
          </div>
        ) : users && users.length > 0 ? (
          <ul className="divide-y divide-border/50">

            {users.map((user) => (
              <li key={user.id} className="group relative flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-muted/25 sm:px-6">

                <span aria-hidden="true" className="absolute bottom-3 left-0 top-3 w-[2px] origin-center scale-y-0 rounded-r-full bg-foreground/50 transition-transform duration-200 group-hover:scale-y-100" />


                <Avatar className="size-11 shrink-0 border border-border/70 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">

                  {user.avatar.url ? (
                    <AvatarImage
                      src={user.avatar.url}
                      alt={user.fullName}
                      className="object-cover"
                    />
                  ) : null}

                  <AvatarFallback className="bg-muted/55 text-[12px] font-semibold tracking-wide text-foreground/75">
                    {initials(user.fullName)}
                  </AvatarFallback>

                </Avatar>


                <div className="min-w-0 flex-1">

                  <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {user.fullName}
                  </p>

                  <div className="mt-1 flex items-center gap-2">

                    <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-muted-foreground/35" />

                    <time dateTime={user.createdAt} className="truncate text-[11px] font-medium text-muted-foreground/70 tabular-nums">
                      Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </time>

                  </div>

                </div>


                <div className="shrink-0">
                  <RoleBadge role={user.role} />
                </div>

              </li>
            ))}

          </ul>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center px-6 py-12">

            <div className="text-center">

              <p className="text-sm font-medium text-foreground">
                No users yet
              </p>

              <p className="mt-1.5 text-xs text-muted-foreground">
                Newly created dashboard users will appear here.
              </p>

            </div>

          </div>
        )}

      </Card>

    </section>
  )
}