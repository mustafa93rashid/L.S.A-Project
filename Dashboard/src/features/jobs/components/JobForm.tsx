import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AlertCircle, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2, CircleDot, FileText, ListChecks, MapPin, Send, UsersRound } from 'lucide-react'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormSection } from '@/components/forms/FormSection'
import { FormActions } from '@/components/forms/FormActions'
import { StringListField } from '@/components/forms/StringListField'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { applyServerErrors } from '@/lib/form-errors'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { useCreateJobMutation, useUpdateJobMutation } from '@/features/jobs/queries'
import { jobSchema, type JobInput } from '@/features/jobs/schema'
import { EMPLOYMENT_TYPES, JOB_DEPARTMENTS, JOB_STATUSES, type Job } from '@/features/jobs/types'
import { jobStatusLabel } from '@/features/jobs/utils'

interface JobFormProps { job?: Job | null; onSuccess: () => void; onCancel: () => void }

const emptyDefaults: JobInput = { title: '', shortDescription: '', description: '', location: '', employmentType: 'Full-Time', department: 'Engineering', responsibilities: [''], requirements: [''], status: 'draft', deadline: '' }

function FieldError({ message }: { message?: string }) { if (!message) return null; return <p className="flex items-center gap-1.5 text-[10px] font-medium text-destructive"><AlertCircle className="size-3 shrink-0" strokeWidth={1.8} />{message}</p> }

export function JobForm({ job, onSuccess, onCancel }: JobFormProps) {
  const isEditing = Boolean(job)
  const [formError, setFormError] = useState<string | null>(null)
  const createMutation = useCreateJobMutation()
  const updateMutation = useUpdateJobMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<JobInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: job ? { title: job.title, shortDescription: job.shortDescription, description: job.description, location: job.location, employmentType: job.employmentType, department: job.department, responsibilities: job.responsibilities, requirements: job.requirements, status: job.status, deadline: job.deadline ? job.deadline.slice(0, 10) : '' } : emptyDefaults,
  })

  const status = form.watch('status') ?? 'draft'
  const guard = useUnsavedChangesGuard(form.formState.isDirty)

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)

    const payload = { ...values, deadline: values.deadline || null }
    const onError = (error: unknown) => setFormError(applyServerErrors(form, error))

    if (isEditing && job) {
      updateMutation.mutate({ id: job._id, payload }, { onSuccess: () => { toast.success('Job updated successfully'); guard.bypassOnce(); onSuccess() }, onError })
      return
    }

    createMutation.mutate(payload, { onSuccess: () => { toast.success('Job created successfully'); guard.bypassOnce(); onSuccess() }, onError })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError ? <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.045] px-4 py-3.5"><div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><AlertCircle className="size-4" strokeWidth={1.8} /></div><div className="min-w-0"><p className="text-[12px] font-semibold text-destructive">Unable to save job</p><p className="mt-1 text-[11px] leading-5 text-destructive/80">{formError}</p></div></div> : null}

      <FormSection title="Job Information" description="Define the position, department, employment type, location, and application deadline." icon={BriefcaseBusiness}>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3"><Label htmlFor="job-title" className="text-[12px] font-semibold">Job title</Label><span className="rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">Required</span></div>
            <div className="group relative"><div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground/45 transition-colors group-focus-within:text-foreground"><BriefcaseBusiness className="size-3.5" strokeWidth={1.8} /></div><Input id="job-title" placeholder="e.g. Senior Mechanical Engineer" aria-invalid={!!form.formState.errors.title} {...form.register('title')} className="h-11 rounded-xl pl-12" /></div>
            <FieldError message={form.formState.errors.title?.message} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="job-location" className="text-[12px] font-semibold">Location</Label>
              <div className="group relative"><div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground/45 transition-colors group-focus-within:text-foreground"><MapPin className="size-3.5" strokeWidth={1.8} /></div><Input id="job-location" placeholder="e.g. Basra, Iraq" aria-invalid={!!form.formState.errors.location} {...form.register('location')} className="h-11 rounded-xl pl-12" /></div>
              <FieldError message={form.formState.errors.location?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-employment-type" className="text-[12px] font-semibold">Employment type</Label>
              <Select value={form.watch('employmentType')} onValueChange={(value) => form.setValue('employmentType', value as JobInput['employmentType'], { shouldDirty: true, shouldValidate: true })}>
                <SelectTrigger id="job-employment-type" className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
              <FieldError message={form.formState.errors.employmentType?.message} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="job-department" className="text-[12px] font-semibold">Department</Label>
              <Select value={form.watch('department')} onValueChange={(value) => form.setValue('department', value as JobInput['department'], { shouldDirty: true, shouldValidate: true })}>
                <SelectTrigger id="job-department" className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{JOB_DEPARTMENTS.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}</SelectContent>
              </Select>
              <FieldError message={form.formState.errors.department?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-deadline" className="text-[12px] font-semibold">Application deadline</Label>
              <div className="group relative"><div className="pointer-events-none absolute left-3 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground/45 transition-colors group-focus-within:text-foreground"><CalendarDays className="size-3.5" strokeWidth={1.8} /></div><Input id="job-deadline" type="date" aria-invalid={!!form.formState.errors.deadline} {...form.register('deadline')} className="h-11 rounded-xl pl-12" /></div>
              <FieldError message={form.formState.errors.deadline?.message} />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Job Description" description="Describe the opportunity and provide candidates with a clear understanding of the position." icon={FileText}>
        <div className="space-y-5">
          <div className="space-y-2"><Label htmlFor="job-short" className="text-[12px] font-semibold">Short description</Label><Textarea id="job-short" rows={3} placeholder="A short summary displayed in the careers listing." aria-invalid={!!form.formState.errors.shortDescription} {...form.register('shortDescription')} className="min-h-[92px] resize-none rounded-xl" /><FieldError message={form.formState.errors.shortDescription?.message} /></div>
          <div className="space-y-2"><Label htmlFor="job-description" className="text-[12px] font-semibold">Full description</Label><Textarea id="job-description" rows={6} placeholder="Describe the position, its main purpose, work environment, and any relevant details." aria-invalid={!!form.formState.errors.description} {...form.register('description')} className="min-h-[160px] resize-y rounded-xl" /><FieldError message={form.formState.errors.description?.message} /></div>
        </div>
      </FormSection>

      <FormSection title="Responsibilities & Requirements" description="Define what the employee will be responsible for and the qualifications expected from candidates." icon={ListChecks}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-muted/[0.08] p-4"><div className="mb-4 flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground"><ListChecks className="size-4" strokeWidth={1.8} /></div><div><p className="text-[11px] font-semibold text-foreground">Position responsibilities</p><p className="mt-1 text-[9px] leading-4 text-muted-foreground">Add the primary duties associated with this role.</p></div></div><StringListField id="job-responsibilities" label="Responsibilities" values={form.watch('responsibilities')} onChange={(values) => form.setValue('responsibilities', values, { shouldDirty: true, shouldValidate: true })} error={form.formState.errors.responsibilities?.message} /></div>

          <div className="rounded-2xl border border-border/70 bg-muted/[0.08] p-4"><div className="mb-4 flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground"><UsersRound className="size-4" strokeWidth={1.8} /></div><div><p className="text-[11px] font-semibold text-foreground">Candidate requirements</p><p className="mt-1 text-[9px] leading-4 text-muted-foreground">Add skills, experience, and qualifications candidates should have.</p></div></div><StringListField id="job-requirements" label="Requirements" values={form.watch('requirements')} onChange={(values) => form.setValue('requirements', values, { shouldDirty: true, shouldValidate: true })} error={form.formState.errors.requirements?.message} /></div>
        </div>
      </FormSection>

      <FormSection title="Publishing Settings" description="Control the lifecycle and public availability of this job opportunity." icon={Send}>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="job-status" className="text-[12px] font-semibold">Job status</Label>
            <Select value={status} onValueChange={(value) => form.setValue('status', value as JobInput['status'], { shouldDirty: true, shouldValidate: true })}>
              <SelectTrigger id="job-status" className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{JOB_STATUSES.map((jobStatus) => <SelectItem key={jobStatus} value={jobStatus}>{jobStatusLabel(jobStatus)}</SelectItem>)}</SelectContent>
            </Select>
            <FieldError message={form.formState.errors.status?.message} />
          </div>

          <div className={`flex items-start gap-3 rounded-2xl border px-4 py-4 transition-colors ${status === 'published' ? 'border-success/20 bg-success/[0.035]' : 'border-border/70 bg-muted/[0.10]'}`}>
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${status === 'published' ? 'border-success/15 bg-success-subtle text-success' : 'border-border/70 bg-background text-muted-foreground'}`}>
              {status === 'published' ? <CheckCircle2 className="size-[17px]" strokeWidth={1.8} /> : status === 'closed' ? <CircleDot className="size-[17px]" strokeWidth={1.8} /> : <FileText className="size-[17px]" strokeWidth={1.8} />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-semibold text-foreground">{jobStatusLabel(status)}</p><span className={`size-1.5 rounded-full ${status === 'published' ? 'bg-success' : 'bg-muted-foreground/40'}`} /></div>
              <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{status === 'published' ? 'This job is visible on the public careers page and candidates can submit applications.' : status === 'closed' ? 'This position is closed and no longer accepts new applications.' : 'This job remains private and will not appear on the public careers page.'}</p>
            </div>
          </div>
        </div>
      </FormSection>

      <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="hidden items-center gap-2 sm:flex"><Building2 className="size-3.5 text-muted-foreground/45" strokeWidth={1.8} /><span className="text-[10px] text-muted-foreground">Review the job information before saving.</span></div>
        <FormActions onCancel={onCancel} submitLabel={isEditing ? 'Save changes' : 'Create job'} isSubmitting={isSubmitting} />
      </div>

      <ConfirmDialog open={guard.isBlocked} onOpenChange={(open) => { if (!open) guard.cancelLeave() }} title="Discard changes?" description="You have unsaved changes. Are you sure you want to discard them?" confirmLabel="Discard" variant="destructive" onConfirm={guard.confirmLeave} />
    </form>
  )
}