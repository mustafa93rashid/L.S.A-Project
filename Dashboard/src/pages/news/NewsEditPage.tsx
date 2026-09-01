import { useNavigate, useParams } from 'react-router-dom'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { BackLink } from '@/components/layout/BackLink'

import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'

import NewsForm from '@/features/news/components/NewsForm'

import { useNewsById } from '@/features/news/queries'

// ==================== Constants ====================

const LIST_PATH = '/news'

// ==================== News Edit Page ====================

export default function NewsEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // ==================== Query ====================

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useNewsById(id ?? '')

  // ==================== Data ====================

  const news = data

  // ==================== Render ====================

  return (
    <PageContainer className="max-w-6xl">
      <BackLink
        to={LIST_PATH}
        label="Back to Company News"
      />

      <PageHeader
        title="Edit news"
        description="Update this company news item."
      />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          description="This news item could not be loaded."
          onRetry={() => refetch()}
        />
      ) : !news ? (
        <ErrorState
          title="News not found"
          description="It may have been deleted or the link is out of date."
        />
      ) : (
        <NewsForm
          news={news}
          onSuccess={() => navigate(LIST_PATH)}
          onCancel={() => navigate(LIST_PATH)}
        />
      )}
    </PageContainer>
  )
}