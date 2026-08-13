import { format } from 'date-fns'
import { CalendarDays, Clock3, ShieldCheck, UserRound } from 'lucide-react'
import { FormSection } from '@/components/forms/FormSection'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { ROLE_LABELS } from '@/constants/roles'
import type { ProfileUser } from '@/features/profile/types'
import { BadgeCheck } from 'lucide-react'


interface AccountInfoCardProps {
  profile: ProfileUser
}


function formatDateTime(value: string | null): string {
  if (!value) return 'Never'
  const date = new Date(value)
  return `${format(date, 'MMMM d, yyyy')} • ${format(date, 'h:mm a')}`
}


function formatDate(value: string): string {
  return format(new Date(value), 'MMMM d, yyyy')
}


interface MetaItemProps {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}


function MetaItem({ icon: Icon, label, children }: MetaItemProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/[0.12] p-3.5">

      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.8} />

        <span className="text-[9px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          {label}
        </span>
      </div>

      <div className="mt-2 text-sm font-medium text-foreground">
        {children}
      </div>

    </div>
  )
}


export function AccountInfoCard({ profile }: AccountInfoCardProps) {
  return (
    <FormSection title="Account Information" description="Account metadata, role and activity."   icon={BadgeCheck}
>

      <div className="grid gap-3 sm:grid-cols-2">

        <MetaItem icon={ShieldCheck} label="Role">
          {ROLE_LABELS[profile.role]}
        </MetaItem>


        <MetaItem icon={ShieldCheck} label="Account status">
          <StatusBadge label={profile.isActive ? 'Active' : 'Inactive'} tone={profile.isActive ? 'success' : 'neutral'} />
        </MetaItem>


        <MetaItem icon={Clock3} label="Last login">
          {formatDateTime(profile.lastLoginAt)}
        </MetaItem>


        <MetaItem icon={CalendarDays} label="Joined">
          {formatDate(profile.createdAt)}
        </MetaItem>


        <div className="sm:col-span-2">
          <MetaItem icon={UserRound} label="Created by">
            {profile.createdBy ? (
              <div>
                <p>{profile.createdBy.fullName}</p>
                <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                  {profile.createdBy.email}
                </p>
              </div>
            ) : (
              'System'
            )}
          </MetaItem>
        </div>

      </div>

    </FormSection>
  )
}