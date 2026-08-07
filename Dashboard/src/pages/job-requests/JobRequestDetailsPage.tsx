import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { BackLink } from '@/components/layout/BackLink'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { FormSection } from '@/components/forms/FormSection'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { CvDocumentCard } from '@/features/job-requests/components/CvDocumentCard'
import { useSessionStore } from '@/stores/session.store'
import { ROLES } from '@/constants/roles'
import { ApiError } from '@/types/api'
import { jobStatusLabel, jobStatusTone } from '@/features/jobs/utils'
import {
  useDeleteJobRequestMutation,
  useJobRequestQuery,
  useUpdateJobRequestStatusMutation,
} from '@/features/job-requests/queries'
import {
  JOB_REQUEST_STATUSES,
  type JobRequestStatus,
} from '@/features/job-requests/types'
import {
  jobRequestStatusLabel,
  jobRequestStatusTone,
} from '@/features/job-requests/utils'

const LIST_PATH = '/job-requests'

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm break-words text-foreground">{value}</span>
    </div>
  )
}

export default function JobRequestDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const role = useSessionStore((state) => state.user?.role)
  const canDelete = role === ROLES.SUPERADMIN

  const { data: request, isLoading, isError, refetch } = useJobRequestQuery(id)
  const statusMutation = useUpdateJobRequestStatusMutation()
  const deleteMutation = useDeleteJobRequestMutation()

  const [pendingStatus, setPendingStatus] = useState<JobRequestStatus | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const selectedStatus = pendingStatus ?? request?.status ?? 'new'
  const isStatusDirty = pendingStatus !== null && pendingStatus !== request?.status

  const handleSaveStatus = () => {
    if (!request || !pendingStatus || pendingStatus === request.status) return
    statusMutation.mutate(
      { id: request._id, status: pendingStatus },
      {
        onSuccess: () => {
          toast.success('Job request status updated successfully')
          setPendingStatus(null)
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiError ? error.message : 'Failed to update status',
          )
        },
      },
    )
  }

  const handleDelete = () => {
    if (!request) return
    deleteMutation.mutate(request._id, {
      onSuccess: () => {
        toast.success('Job request deleted successfully')
        navigate(LIST_PATH)
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to delete request',
        )
        setDeleteConfirmOpen(false)
      },
    })
  }

  return (
    <PageContainer className="max-w-3xl">
      <BackLink to={LIST_PATH} label="Back to Applications" />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          description="This application could not be loaded."
          onRetry={() => refetch()}
        />
      ) : !request ? (
        <ErrorState
          title="Application not found"
          description="It may have been deleted or the link is out of date."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {request.firstName} {request.lastName}
                </h1>
                <StatusBadge
                  label={jobRequestStatusLabel(request.status)}
                  tone={jobRequestStatusTone(request.status)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Submitted {format(new Date(request.createdAt), 'PPP p')}
              </p>
            </div>
            {canDelete ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete application
              </Button>
            ) : null}
          </div>

          <FormSection title="Applicant Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField
                label="Full name"
                value={`${request.firstName} ${request.lastName}`}
              />
              <DetailField label="Email" value={request.email} />
              <DetailField label="Phone" value={request.phone} />
              <DetailField
                label="Submitted"
                value={format(new Date(request.createdAt), 'PPP p')}
              />
            </div>
          </FormSection>

          <FormSection title="Applied Position">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField
                label="Job title"
                value={request.job?.title ?? 'Job no longer exists'}
              />
              {request.job?.department ? (
                <DetailField label="Department" value={request.job.department} />
              ) : null}
              {request.job?.location ? (
                <DetailField label="Location" value={request.job.location} />
              ) : null}
              {request.job?.employmentType ? (
                <DetailField label="Employment type" value={request.job.employmentType} />
              ) : null}
            </div>
            {request.job?.status ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Job posting status</span>
                <StatusBadge
                  label={jobStatusLabel(request.job.status)}
                  tone={jobStatusTone(request.job.status)}
                />
              </div>
            ) : null}
          </FormSection>

          <FormSection title="Submitted Documents">
            <CvDocumentCard cv={request.cv} />
          </FormSection>

          <FormSection title="Application Status">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-1.5 sm:w-64">
                <label
                  htmlFor="job-request-status"
                  className="text-xs text-muted-foreground"
                >
                  Status
                </label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setPendingStatus(value as JobRequestStatus)}
                  disabled={statusMutation.isPending}
                >
                  <SelectTrigger id="job-request-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_REQUEST_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {jobRequestStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={handleSaveStatus}
                disabled={!isStatusDirty || statusMutation.isPending}
              >
                {statusMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>

            {request.updatedBy ? (
              <p className="text-xs text-muted-foreground">
                Last updated by {request.updatedBy.fullName}
              </p>
            ) : null}
          </FormSection>
        </>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete job application"
        description={
          request
            ? `Are you sure you want to delete the application from "${request.firstName} ${request.lastName}"? This cannot be undone.`
            : ''
        }
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
