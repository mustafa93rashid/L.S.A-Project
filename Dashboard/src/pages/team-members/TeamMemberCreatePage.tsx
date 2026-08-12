import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { TeamMemberForm } from '@/features/team-members/components/TeamMemberForm'

const LIST_PATH = '/team-members'

export default function TeamMemberCreatePage() {
  const navigate = useNavigate()

  return (
    <PageContainer className="max-w-6xl">
      <BackLink to={LIST_PATH} label="Back to Team Members" />
      <PageHeader
        title="Add team member"
        description="Add a team member to display them on the public site."
      />
      <TeamMemberForm
        onSuccess={() => navigate(LIST_PATH)}
        onCancel={() => navigate(LIST_PATH)}
      />
    </PageContainer>
  )
}
