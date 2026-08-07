import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useJourneysQuery } from '@/features/journeys/queries'
import { JourneyForm } from '@/features/journeys/components/JourneyForm'

const LIST_PATH = '/journeys'

export default function JourneyEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useJourneysQuery()
  const journey = data?.find((item) => item._id === id)

  return (
    <PageContainer className="max-w-xl">
      <BackLink to={LIST_PATH} label="Back to Company Journey" />
      <PageHeader title="Edit milestone" description="Update this journey milestone." />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          description="This milestone could not be loaded."
          onRetry={() => refetch()}
        />
      ) : !journey ? (
        <ErrorState
          title="Milestone not found"
          description="It may have been deleted or the link is out of date."
        />
      ) : (
        <JourneyForm
          journey={journey}
          onSuccess={() => navigate(LIST_PATH)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}
    </PageContainer>
  )
}
