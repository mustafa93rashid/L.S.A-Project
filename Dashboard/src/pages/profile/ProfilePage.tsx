import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ProfileHeader } from '@/features/profile/components/ProfileHeader'
import { PersonalInfoCard } from '@/features/profile/components/PersonalInfoCard'
import { AccountInfoCard } from '@/features/profile/components/AccountInfoCard'
import { EmailChangeField } from '@/features/profile/components/EmailChangeField'
import { SecurityCard } from '@/features/profile/components/SecurityCard'
import { useProfileQuery } from '@/features/profile/queries'

/**
 * Account Settings page — a thin orchestrator only. Each section owns its
 * own data, form state, and mutations; this component's only job is
 * fetching the profile once and laying the sections out.
 */
export default function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useProfileQuery()

  if (isLoading) return <PageLoader />
  if (isError || !profile) return <ErrorState onRetry={() => refetch()} />

  return (
    <PageContainer>
      <PageHeader
        title="Account Settings"
        description="Manage your profile, account details, and password."
      />

      <ProfileHeader profile={profile} />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <PersonalInfoCard profile={profile} />
        <AccountInfoCard profile={profile} />
      </div>

      <EmailChangeField profile={profile} />

      <SecurityCard />
    </PageContainer>
  )
}
