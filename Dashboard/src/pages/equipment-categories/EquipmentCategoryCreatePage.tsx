import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { EquipmentCategoryForm } from '@/features/equipment-categories/components/EquipmentCategoryForm'

const LIST_PATH = '/equipment-categories'

export default function EquipmentCategoryCreatePage() {
  const navigate = useNavigate()

  return (
    <PageContainer className="max-w-6xl">
      <BackLink to={LIST_PATH} label="Back to Equipment Categories" />
      <PageHeader
        title="Add category"
        description="Create a new equipment category for the public catalog."
      />
      <EquipmentCategoryForm
        onSuccess={() => navigate(LIST_PATH)}
        onCancel={() => navigate(LIST_PATH)}
      />
    </PageContainer>
  )
}
