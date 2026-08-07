import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { ProjectForm } from '@/features/projects/components/ProjectForm'

const LIST_PATH = '/projects'

export default function ProjectCreatePage() {
  const navigate = useNavigate()

  return (
    <PageContainer className="max-w-5xl">
      <BackLink to={LIST_PATH} label="Back to Projects" />
      <PageHeader
        title="Add project"
        description="Create a new project case study for the public site."
      />
      <ProjectForm
        onSuccess={() => navigate(LIST_PATH)}
        onCancel={() => navigate(LIST_PATH)}
      />
    </PageContainer>
  )
}
