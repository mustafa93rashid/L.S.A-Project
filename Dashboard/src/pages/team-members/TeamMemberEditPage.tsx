import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useTeamMembersQuery } from '@/features/team-members/queries'
import { TeamMemberForm } from '@/features/team-members/components/TeamMemberForm'

const LIST_PATH = '/team-members'

export default function TeamMemberEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useTeamMembersQuery()
  const teamMember = data?.find((item) => item._id === id)

  return (
    <PageContainer className="max-w-xl">
      <BackLink to={LIST_PATH} label="Back to Team Members" />
      <PageHeader
        title="Edit team member"
        description="Update this team member's profile."
      />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          description="This team member could not be loaded."
          onRetry={() => refetch()}
        />
      ) : !teamMember ? (
        <ErrorState
          title="Team member not found"
          description="It may have been deleted or the link is out of date."
        />
      ) : (
        <TeamMemberForm
          teamMember={teamMember}
          onSuccess={() => navigate(LIST_PATH)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}
    </PageContainer>
  )
}
