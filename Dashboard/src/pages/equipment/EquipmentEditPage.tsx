import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useEquipmentListQuery } from '@/features/equipment/queries'
import { EquipmentForm } from '@/features/equipment/components/EquipmentForm'

const LIST_PATH = '/equipment'

export default function EquipmentEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  // Unfiltered fetch — the list page's own query is keyed by whatever
  // filters are currently applied there, which may exclude this record.
  const { data, isLoading, isError, refetch } = useEquipmentListQuery({})
  const equipment = data?.find((item) => item._id === id)

  return (
    <PageContainer className="max-w-2xl">
      <BackLink to={LIST_PATH} label="Back to Equipment" />
      <PageHeader title="Edit equipment" description="Update this equipment listing." />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          description="This equipment item could not be loaded."
          onRetry={() => refetch()}
        />
      ) : !equipment ? (
        <ErrorState
          title="Equipment not found"
          description="It may have been deleted or the link is out of date."
        />
      ) : (
        <EquipmentForm
          equipment={equipment}
          onSuccess={() => navigate(LIST_PATH)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}
    </PageContainer>
  )
}
