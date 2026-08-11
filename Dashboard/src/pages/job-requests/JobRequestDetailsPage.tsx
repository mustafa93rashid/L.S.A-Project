import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { BriefcaseBusiness, CalendarDays, FileText, Mail, MapPin, Phone, Trash2, UserRound, Workflow } from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { BackLink } from '@/components/layout/BackLink'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'

import { CvDocumentCard } from '@/features/job-requests/components/CvDocumentCard'

import { useSessionStore } from '@/stores/session.store'
import { ROLES } from '@/constants/roles'
import { ApiError } from '@/types/api'

import { jobStatusLabel, jobStatusTone } from '@/features/jobs/utils'

import { useDeleteJobRequestMutation, useJobRequestQuery, useUpdateJobRequestStatusMutation } from '@/features/job-requests/queries'
import { JOB_REQUEST_STATUSES, type JobRequestStatus } from '@/features/job-requests/types'
import { jobRequestStatusLabel, jobRequestStatusTone } from '@/features/job-requests/utils'

const LIST_PATH = '/job-requests'

interface DetailFieldProps {
  label: string
  value: string
  icon?: typeof UserRound
}

function DetailField({ label, value, icon: Icon }: DetailFieldProps) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border/60 bg-muted/[0.12] px-3.5 py-3">
      {Icon ? (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground">
          <Icon className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
        </div>
      ) : null}

      <div className="min-w-0">
        <span className="block text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{label}</span>
        <span className="mt-1 block break-words text-[12px] font-medium text-foreground">{value}</span>
      </div>
    </div>
  )
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-4">
      <span className="text-[9px] font-semibold tracking-[0.14em] text-muted-foreground/70 uppercase">{eyebrow}</span>
      <h2 className="mt-1 text-[14px] font-semibold tracking-[-0.015em] text-foreground">{title}</h2>
      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{description}</p>
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
          toast.error(error instanceof ApiError ? error.message : 'Failed to update status')
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
        toast.error(error instanceof ApiError ? error.message : 'Failed to delete request')
        setDeleteConfirmOpen(false)
      },
    })
  }

  return (
    <PageContainer className="max-w-5xl">
      <div className="space-y-6">
        <BackLink to={LIST_PATH} label="Back to Applications" />

        {isLoading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-[22px] border border-border/70 bg-card">
            <PageLoader />
          </div>
        ) : isError ? (
          <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
            <ErrorState description="This application could not be loaded." onRetry={() => refetch()} />
          </div>
        ) : !request ? (
          <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
            <ErrorState title="Application not found" description="It may have been deleted or the link is out of date." />
          </div>
        ) : (
          <>
            {/* =====================================================
                Header
            ===================================================== */}

            <section className="relative overflow-hidden rounded-[22px] border border-border/70 bg-card px-5 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.025)] sm:px-6">
              <div className="pointer-events-none absolute -right-20 -top-24 size-[220px] rounded-full bg-primary/[0.035] blur-[80px]" />

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] border border-border/70 bg-muted/35 text-muted-foreground">
                    <UserRound className="size-5" strokeWidth={1.8} aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <span className="text-[9px] font-semibold tracking-[0.14em] text-muted-foreground/70 uppercase">Application Profile</span>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                      <h1 className="truncate text-[22px] font-semibold tracking-[-0.03em] text-foreground sm:text-[26px]">
                        {request.firstName} {request.lastName}
                      </h1>

                      <StatusBadge label={jobRequestStatusLabel(request.status)} tone={jobRequestStatusTone(request.status)} />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" strokeWidth={1.8} />
                        Submitted {format(new Date(request.createdAt), 'PPP p')}
                      </span>

                      {request.job?.title ? (
                        <span className="flex items-center gap-1.5">
                          <BriefcaseBusiness className="size-3.5" strokeWidth={1.8} />
                          {request.job.title}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {canDelete ? (
                  <Button type="button" variant="outline" size="sm" className="shrink-0 text-muted-foreground hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteConfirmOpen(true)}>
                    <Trash2 className="size-4" strokeWidth={1.8} />
                    Delete application
                  </Button>
                ) : null}
              </div>
            </section>

            {/* =====================================================
                Information Grid
            ===================================================== */}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {/* Applicant Information */}

              <section className="rounded-[22px] border border-border/70 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
                <SectionHeader eyebrow="Candidate" title="Applicant Information" description="Primary contact and submission details for this applicant." />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailField label="Full name" value={`${request.firstName} ${request.lastName}`} icon={UserRound} />
                  <DetailField label="Email" value={request.email} icon={Mail} />
                  <DetailField label="Phone" value={request.phone} icon={Phone} />
                  <DetailField label="Submitted" value={format(new Date(request.createdAt), 'PPP p')} icon={CalendarDays} />
                </div>
              </section>

              {/* Applied Position */}

              <section className="rounded-[22px] border border-border/70 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
                <SectionHeader eyebrow="Position" title="Applied Position" description="Job information linked to this application." />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailField label="Job title" value={request.job?.title ?? 'Job no longer exists'} icon={BriefcaseBusiness} />

                  {request.job?.department ? <DetailField label="Department" value={request.job.department} /> : null}
                  {request.job?.location ? <DetailField label="Location" value={request.job.location} icon={MapPin} /> : null}
                  {request.job?.employmentType ? <DetailField label="Employment type" value={request.job.employmentType} /> : null}
                </div>

                {request.job?.status ? (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-muted/[0.12] px-3.5 py-3">
                    <span className="text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">Job posting status</span>
                    <StatusBadge label={jobStatusLabel(request.job.status)} tone={jobStatusTone(request.job.status)} />
                  </div>
                ) : null}
              </section>
            </div>

            {/* =====================================================
                Documents
            ===================================================== */}

            <section className="rounded-[22px] border border-border/70 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
              <SectionHeader eyebrow="Documents" title="Submitted Documents" description="Review the CV and application documents submitted by the candidate." />

              <div className="rounded-[18px] border border-border/60 bg-muted/[0.08] p-3">
                <CvDocumentCard cv={request.cv} />
              </div>
            </section>

            {/* =====================================================
                Workflow
            ===================================================== */}

            <section className="rounded-[22px] border border-border/70 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground">
                  <Workflow className="size-4" strokeWidth={1.8} aria-hidden="true" />
                </div>

                <div>
                  <span className="text-[9px] font-semibold tracking-[0.14em] text-muted-foreground/70 uppercase">Workflow</span>
                  <h2 className="mt-1 text-[14px] font-semibold tracking-[-0.015em] text-foreground">Application Status</h2>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Update the candidate's position in the recruitment workflow.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-[18px] border border-border/60 bg-muted/[0.1] p-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="w-full lg:max-w-[320px]">
                  <label htmlFor="job-request-status" className="mb-1.5 block text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                    Application status
                  </label>

                  <Select value={selectedStatus} onValueChange={(value) => setPendingStatus(value as JobRequestStatus)} disabled={statusMutation.isPending}>
                    <SelectTrigger id="job-request-status" className="h-11 rounded-xl bg-background">
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

                <Button type="button" className="lg:min-w-[140px]" onClick={handleSaveStatus} disabled={!isStatusDirty || statusMutation.isPending}>
                  {statusMutation.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </div>

              {request.updatedBy ? (
                <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <FileText className="size-3.5" strokeWidth={1.8} />
                  Last updated by <span className="font-medium text-foreground">{request.updatedBy.fullName}</span>
                </div>
              ) : null}
            </section>
          </>
        )}

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete job application"
          description={request ? `Are you sure you want to delete the application from "${request.firstName} ${request.lastName}"? This cannot be undone.` : ''}
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </PageContainer>
  )
}