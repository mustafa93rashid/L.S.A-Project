import { useNavigate, useParams } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'

import { useEquipmentQuery } from '@/features/equipment/queries'
import { EquipmentForm } from '@/features/equipment/components/EquipmentForm'

const LIST_PATH = '/equipment'

export default function EquipmentEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: equipment, isLoading, isError, refetch } = useEquipmentQuery(id)

  return (
    <PageContainer className="max-w-6xl">
      <div className="space-y-6">
        <BackLink to={LIST_PATH} label="Back to Equipment" />

        <PageHeader title="Edit Equipment" description="Update the equipment details, availability, specifications and public listing settings." />

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[22px] border border-border/70 bg-card">
            <PageLoader />
          </div>
        ) : isError ? (
          <div className="rounded-[22px] border border-border/70 bg-card px-6 py-10">
            <ErrorState description="This equipment item could not be loaded." onRetry={() => refetch()} />
          </div>
        ) : !equipment ? (
          <div className="rounded-[22px] border border-border/70 bg-card px-6 py-10">
            <ErrorState title="Equipment not found" description="It may have been deleted or the link is out of date." />
          </div>
        ) : (
          <EquipmentForm equipment={equipment} onSuccess={() => navigate(LIST_PATH)} onCancel={() => navigate(LIST_PATH)} />
        )}
      </div>
    </PageContainer>
  )
}