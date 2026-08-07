import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useJobQuery } from '@/features/jobs/queries'
import { JobForm } from '@/features/jobs/components/JobForm'

const LIST_PATH = '/jobs'

export default function JobEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: job, isLoading, isError, refetch } = useJobQuery(id)

  return (
    <PageContainer className="max-w-2xl">
      <BackLink to={LIST_PATH} label="Back to Job Postings" />
      <PageHeader title="Edit job posting" description="Update this careers listing." />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          description="This job posting could not be loaded."
          onRetry={() => refetch()}
        />
      ) : !job ? (
        <ErrorState
          title="Job posting not found"
          description="It may have been deleted or the link is out of date."
        />
      ) : (
        <JobForm
          job={job}
          onSuccess={() => navigate(LIST_PATH)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}
    </PageContainer>
  )
}
