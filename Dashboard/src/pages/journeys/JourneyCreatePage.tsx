import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { JourneyForm } from '@/features/journeys/components/JourneyForm'

const LIST_PATH = '/journeys'

export default function JourneyCreatePage() {
  const navigate = useNavigate()

  return (
    <PageContainer className="max-w-6xl">
      <BackLink to={LIST_PATH} label="Back to Company Journey" />
      <PageHeader
        title="Add milestone"
        description="Add a milestone to the company timeline."
      />
      <JourneyForm
        onSuccess={() => navigate(LIST_PATH)}
        onCancel={() => navigate(LIST_PATH)}
      />
    </PageContainer>
  )
}
