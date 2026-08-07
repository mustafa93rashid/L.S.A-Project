import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { JobForm } from '@/features/jobs/components/JobForm'

const LIST_PATH = '/jobs'

export default function JobCreatePage() {
  const navigate = useNavigate()

  return (
    <PageContainer className="max-w-2xl">
      <BackLink to={LIST_PATH} label="Back to Job Postings" />
      <PageHeader title="Add job posting" description="Create a new careers listing." />
      <JobForm
        onSuccess={() => navigate(LIST_PATH)}
        onCancel={() => navigate(LIST_PATH)}
      />
    </PageContainer>
  )
}
