import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { EquipmentForm } from '@/features/equipment/components/EquipmentForm'

const LIST_PATH = '/equipment'

export default function EquipmentCreatePage() {
  const navigate = useNavigate()

  return (
    <PageContainer className="max-w-2xl">
      <BackLink to={LIST_PATH} label="Back to Equipment" />
      <PageHeader
        title="Add equipment"
        description="Add a new item to the rentable equipment catalog."
      />
      <EquipmentForm
        onSuccess={() => navigate(LIST_PATH)}
        onCancel={() => navigate(LIST_PATH)}
      />
    </PageContainer>
  )
}
