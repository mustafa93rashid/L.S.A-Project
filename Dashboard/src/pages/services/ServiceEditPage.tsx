import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useServicesQuery } from '@/features/services/queries'
import { ServiceForm } from '@/features/services/components/ServiceForm'

const LIST_PATH = '/services'

export default function ServiceEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useServicesQuery()
  const service = data?.find((item) => item._id === id)

  return (
    <PageContainer className="max-w-5xl">
      <BackLink to={LIST_PATH} label="Back to Services" />
      <PageHeader title="Edit service" description="Update this service page." />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          description="This service could not be loaded."
          onRetry={() => refetch()}
        />
      ) : !service ? (
        <ErrorState
          title="Service not found"
          description="It may have been deleted or the link is out of date."
        />
      ) : (
        <ServiceForm
          service={service}
          onSuccess={() => navigate(LIST_PATH)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}
    </PageContainer>
  )
}
