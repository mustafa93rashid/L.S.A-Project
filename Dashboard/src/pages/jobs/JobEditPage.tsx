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

  const handleSuccess = () => navigate(LIST_PATH)
  const handleCancel = () => navigate(LIST_PATH)

  return (
    <PageContainer className="max-w-6xl">
      <div className="space-y-6">
        <BackLink to={LIST_PATH} label="Back to Job Postings" />

        <PageHeader title="Edit Job Posting" description="Update the job details, requirements, publishing status and application deadline." />

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[22px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
            <PageLoader />
          </div>
        ) : isError ? (
          <div className="rounded-[22px] border border-border/70 bg-card px-6 py-10 shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
            <ErrorState description="This job posting could not be loaded." onRetry={() => refetch()} />
          </div>
        ) : !job ? (
          <div className="rounded-[22px] border border-border/70 bg-card px-6 py-10 shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
            <ErrorState title="Job posting not found" description="It may have been deleted or the link is out of date." />
          </div>
        ) : (
          <JobForm job={job} onSuccess={handleSuccess} onCancel={handleCancel} />
        )}
      </div>
    </PageContainer>
  )
}
