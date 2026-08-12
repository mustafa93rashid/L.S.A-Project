import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { usePartnersQuery } from '@/features/partners/queries'
import { PartnerForm } from '@/features/partners/components/PartnerForm'

const LIST_PATH = '/partners'

export default function PartnerEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = usePartnersQuery()
  const partner = data?.find((item) => item._id === id)

  return (
    <PageContainer className="max-w-6xl">
      <BackLink to={LIST_PATH} label="Back to Partners" />
      <PageHeader title="Edit partner" description="Update this partner's details." />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          description="This partner could not be loaded."
          onRetry={() => refetch()}
        />
      ) : !partner ? (
        <ErrorState
          title="Partner not found"
          description="It may have been deleted or the link is out of date."
        />
      ) : (
        <PartnerForm
          partner={partner}
          onSuccess={() => navigate(LIST_PATH)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}
    </PageContainer>
  )
}
