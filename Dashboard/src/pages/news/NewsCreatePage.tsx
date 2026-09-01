import { useNavigate } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'

import NewsForm from '@/features/news/components/NewsForm'

// ==================== Constants ====================

const LIST_PATH = '/news'

// ==================== News Create Page ====================

export default function NewsCreatePage() {
  const navigate = useNavigate()

  return (
    <PageContainer className="max-w-6xl">
      <BackLink
        to={LIST_PATH}
        label="Back to Company News"
      />

      <PageHeader
        title="Create news"
        description="Create and publish a new company news item."
      />

      <NewsForm
        onSuccess={() => navigate(LIST_PATH)}
        onCancel={() => navigate(LIST_PATH)}
      />
    </PageContainer>
  )
}