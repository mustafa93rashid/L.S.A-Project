import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { ServiceForm } from '@/features/services/components/ServiceForm'

const LIST_PATH = '/services'

export default function ServiceCreatePage() {
  const navigate = useNavigate()

  return (
    <PageContainer className="max-w-5xl">
      <BackLink to={LIST_PATH} label="Back to Services" />
      <PageHeader
        title="Add service"
        description="Create a new service page for the public site."
      />
      <ServiceForm
        onSuccess={() => navigate(LIST_PATH)}
        onCancel={() => navigate(LIST_PATH)}
      />
    </PageContainer>
  )
}
