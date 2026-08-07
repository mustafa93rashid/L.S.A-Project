import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useProjectsQuery } from '@/features/projects/queries'
import { ProjectForm } from '@/features/projects/components/ProjectForm'

const LIST_PATH = '/projects'

export default function ProjectEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useProjectsQuery()
  const project = data?.find((item) => item._id === id)

  return (
    <PageContainer className="max-w-5xl">
      <BackLink to={LIST_PATH} label="Back to Projects" />
      <PageHeader title="Edit project" description="Update this project case study." />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          description="This project could not be loaded."
          onRetry={() => refetch()}
        />
      ) : !project ? (
        <ErrorState
          title="Project not found"
          description="It may have been deleted or the link is out of date."
        />
      ) : (
        <ProjectForm
          project={project}
          onSuccess={() => navigate(LIST_PATH)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}
    </PageContainer>
  )
}
