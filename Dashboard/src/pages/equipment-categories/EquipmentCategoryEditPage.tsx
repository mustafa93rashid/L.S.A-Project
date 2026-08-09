import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useEquipmentCategoriesQuery } from '@/features/equipment-categories/queries'
import { EquipmentCategoryForm } from '@/features/equipment-categories/components/EquipmentCategoryForm'

const LIST_PATH = '/equipment-categories'

export default function EquipmentCategoryEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useEquipmentCategoriesQuery()
  const category = data?.find((item) => item._id === id)

  return (
    <PageContainer className="max-w-6xl">
      <BackLink to={LIST_PATH} label="Back to Equipment Categories" />
      <PageHeader title="Edit category" description="Update this equipment category." />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          description="This category could not be loaded."
          onRetry={() => refetch()}
        />
      ) : !category ? (
        <ErrorState
          title="Category not found"
          description="It may have been deleted or the link is out of date."
        />
      ) : (
        <EquipmentCategoryForm
          category={category}
          onSuccess={() => navigate(LIST_PATH)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}
    </PageContainer>
  )
}
