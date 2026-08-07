import { format } from 'date-fns'
import { FormSection } from '@/components/forms/FormSection'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { ROLE_LABELS } from '@/constants/roles'
import type { ProfileUser } from '@/features/profile/types'

interface AccountInfoCardProps {
  profile: ProfileUser
}

/** "August 5, 2026 • 4:35 PM" — same fixed English date-fns format used
 * everywhere else in the dashboard (see `UserCard.tsx`'s `formatLastLogin`),
 * kept identical here so this page doesn't render timestamps differently
 * from the rest of the app. */
function formatDateTime(value: string | null): string {
  if (!value) return 'Never'
  const date = new Date(value)
  return `${format(date, 'MMMM d, yyyy')} • ${format(date, 'h:mm a')}`
}

function formatDate(value: string): string {
  return format(new Date(value), 'MMMM d, yyyy')
}

interface MetaRowProps {
  label: string
  children: React.ReactNode
}

function MetaRow({ label, children }: MetaRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

/** Read-only account metadata — no form, no mutation. Only fields the
 * backend actually returns are shown; nothing here is invented. */
export function AccountInfoCard({ profile }: AccountInfoCardProps) {
  return (
    <FormSection title="Account Information" description="Metadata about your account.">
      <div className="grid gap-5 sm:grid-cols-2">
        <MetaRow label="Role">{ROLE_LABELS[profile.role]}</MetaRow>

        <MetaRow label="Account status">
          <StatusBadge
            label={profile.isActive ? 'Active' : 'Inactive'}
            tone={profile.isActive ? 'success' : 'neutral'}
          />
        </MetaRow>

        <MetaRow label="Last login">{formatDateTime(profile.lastLoginAt)}</MetaRow>

        <MetaRow label="Joined">{formatDate(profile.createdAt)}</MetaRow>

        <MetaRow label="Created by">
          {profile.createdBy ? (
            <div className="flex flex-col">
              <span>{profile.createdBy.fullName}</span>
              <span className="text-xs text-muted-foreground">
                {profile.createdBy.email}
              </span>
            </div>
          ) : (
            'System'
          )}
        </MetaRow>
      </div>
    </FormSection>
  )
}
