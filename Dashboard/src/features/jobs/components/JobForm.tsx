import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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

interface JobFormProps {
  job?: Job | null
  onSuccess: () => void
  onCancel: () => void
}

const emptyDefaults: JobInput = {
  title: '',
  shortDescription: '',
  description: '',
  location: '',
  employmentType: 'Full-Time',
  department: 'Engineering',
  responsibilities: [''],
  requirements: [''],
  status: 'draft',
  deadline: '',
}

export function JobForm({ job, onSuccess, onCancel }: JobFormProps) {
  const isEditing = Boolean(job)
  const [formError, setFormError] = useState<string | null>(null)

  const createMutation = useCreateJobMutation()
  const updateMutation = useUpdateJobMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<JobInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: job
      ? {
          title: job.title,
          shortDescription: job.shortDescription,
          description: job.description,
          location: job.location,
          employmentType: job.employmentType,
          department: job.department,
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          status: job.status,
          deadline: job.deadline ? job.deadline.slice(0, 10) : '',
        }
      : emptyDefaults,
  })

  const guard = useUnsavedChangesGuard(form.formState.isDirty)

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)

    const payload = { ...values, deadline: values.deadline || null }
    const onError = (error: unknown) => setFormError(applyServerErrors(form, error))

    if (isEditing && job) {
      updateMutation.mutate(
        { id: job._id, payload },
        {
          onSuccess: () => {
            toast.success('Job updated successfully')
            guard.bypassOnce()
            onSuccess()
          },
          onError,
        },
      )

      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Job created successfully')
        guard.bypassOnce()
        onSuccess()
      },
      onError,
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError ? <div className="rounded-xl border border-destructive/20 bg-destructive-subtle px-4 py-3 text-sm font-medium text-destructive">{formError}</div> : null}

      <FormSection title="Job Information">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <Label htmlFor="job-title">Job title</Label>
            <Input id="job-title" placeholder="e.g. Senior Mechanical Engineer" aria-invalid={!!form.formState.errors.title} {...form.register('title')} />
            {form.formState.errors.title ? <p className="text-xs text-destructive">{form.formState.errors.title.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="job-location">Location</Label>
            <Input id="job-location" placeholder="e.g. Basra, Iraq" aria-invalid={!!form.formState.errors.location} {...form.register('location')} />
            {form.formState.errors.location ? <p className="text-xs text-destructive">{form.formState.errors.location.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="job-employment-type">Employment type</Label>

            <Select value={form.watch('employmentType')} onValueChange={(value) => form.setValue('employmentType', value as JobInput['employmentType'], { shouldDirty: true, shouldValidate: true })}>
              <SelectTrigger id="job-employment-type" className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {EMPLOYMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {form.formState.errors.employmentType ? <p className="text-xs text-destructive">{form.formState.errors.employmentType.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="job-department">Department</Label>

            <Select value={form.watch('department')} onValueChange={(value) => form.setValue('department', value as JobInput['department'], { shouldDirty: true, shouldValidate: true })}>
              <SelectTrigger id="job-department" className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {JOB_DEPARTMENTS.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {form.formState.errors.department ? <p className="text-xs text-destructive">{form.formState.errors.department.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="job-deadline">Application deadline</Label>
            <Input id="job-deadline" type="date" aria-invalid={!!form.formState.errors.deadline} {...form.register('deadline')} />
            {form.formState.errors.deadline ? <p className="text-xs text-destructive">{form.formState.errors.deadline.message}</p> : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Job Description">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="job-short">Short description</Label>
            <Textarea id="job-short" rows={3} placeholder="A short summary displayed in the careers listing." aria-invalid={!!form.formState.errors.shortDescription} {...form.register('shortDescription')} />
            {form.formState.errors.shortDescription ? <p className="text-xs text-destructive">{form.formState.errors.shortDescription.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="job-description">Full description</Label>
            <Textarea id="job-description" rows={6} placeholder="Describe the position and its main purpose." aria-invalid={!!form.formState.errors.description} {...form.register('description')} />
            {form.formState.errors.description ? <p className="text-xs text-destructive">{form.formState.errors.description.message}</p> : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Responsibilities & Requirements">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <StringListField id="job-responsibilities" label="Responsibilities" values={form.watch('responsibilities')} onChange={(values) => form.setValue('responsibilities', values, { shouldDirty: true, shouldValidate: true })} error={form.formState.errors.responsibilities?.message} />

          <StringListField id="job-requirements" label="Requirements" values={form.watch('requirements')} onChange={(values) => form.setValue('requirements', values, { shouldDirty: true, shouldValidate: true })} error={form.formState.errors.requirements?.message} />
        </div>
      </FormSection>

      <FormSection title="Publishing Settings">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="job-status">Status</Label>

            <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value as JobInput['status'], { shouldDirty: true, shouldValidate: true })}>
              <SelectTrigger id="job-status" className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {JOB_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {jobStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {form.formState.errors.status ? <p className="text-xs text-destructive">{form.formState.errors.status.message}</p> : null}
          </div>

          <div className="flex items-center rounded-xl border border-border/70 bg-muted/[0.14] px-4 py-3">
            <p className="text-xs leading-5 text-muted-foreground">
              {form.watch('status') === 'published'
                ? 'Published jobs are visible on the public careers page and can receive applications.'
                : form.watch('status') === 'closed'
                  ? 'Closed jobs remain unavailable for new applications.'
                  : 'Draft jobs remain hidden from the public careers page.'}
            </p>
          </div>
        </div>
      </FormSection>

      <FormActions onCancel={onCancel} submitLabel={isEditing ? 'Save changes' : 'Create job'} isSubmitting={isSubmitting} />

      <ConfirmDialog
        open={guard.isBlocked}
        onOpenChange={(open) => !open && guard.cancelLeave()}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        variant="destructive"
        onConfirm={guard.confirmLeave}
      />
    </form>
  )
}
