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


export default function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useProfileQuery()

  if (isLoading) return <PageLoader />
  if (isError || !profile) return <ErrorState onRetry={() => refetch()} />

  return (
    <PageContainer className="max-w-7xl">
      <div className="space-y-7">

        <PageHeader
          title="Account Settings"
          description="Manage your profile, account information, email address, and security."
        />


        <ProfileHeader profile={profile} />


        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
          <PersonalInfoCard profile={profile} />

          <AccountInfoCard profile={profile} />
        </div>


        <EmailChangeField profile={profile} />


        <SecurityCard />

      </div>
    </PageContainer>
  )
}