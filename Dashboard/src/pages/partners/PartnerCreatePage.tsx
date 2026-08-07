import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'
import { PartnerForm } from '@/features/partners/components/PartnerForm'

const LIST_PATH = '/partners'

export default function PartnerCreatePage() {
  const navigate = useNavigate()

  return (
    <PageContainer className="max-w-xl">
      <BackLink to={LIST_PATH} label="Back to Partners" />
      <PageHeader
        title="Add partner"
        description="Add a partner logo to display it on the public site."
      />
      <PartnerForm
        onSuccess={() => navigate(LIST_PATH)}
        onCancel={() => navigate(LIST_PATH)}
      />
    </PageContainer>
  )
}
