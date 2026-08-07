import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormSection } from '@/components/forms/FormSection'
import { FormActions } from '@/components/forms/FormActions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { applyServerErrors } from '@/lib/form-errors'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { useCreateJobMutation, useUpdateJobMutation } from '@/features/jobs/queries'
import { jobSchema, type JobInput } from '@/features/jobs/schema'
import {
  EMPLOYMENT_TYPES,
  JOB_DEPARTMENTS,
  JOB_STATUSES,
  type Job,
} from '@/features/jobs/types'
import { jobStatusLabel } from '@/features/jobs/utils'
import { StringListField } from '@/components/forms/StringListField'

interface JobFormProps {
  /** Present when editing — absent means "create". */
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

/** Shared by JobCreatePage and JobEditPage. */
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
    const payload = {
      ...values,
      deadline: values.deadline || null,
    }
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
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Job created successfully')
          guard.bypassOnce()
          onSuccess()
        },
        onError,
      })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

      <FormSection title="Job posting details">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="job-title">Title</Label>
          <Input
            id="job-title"
            aria-invalid={!!form.formState.errors.title}
            {...form.register('title')}
          />
          {form.formState.errors.title ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.title.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="job-short">Short description</Label>
          <Textarea
            id="job-short"
            rows={2}
            aria-invalid={!!form.formState.errors.shortDescription}
            {...form.register('shortDescription')}
          />
          {form.formState.errors.shortDescription ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.shortDescription.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="job-description">Description</Label>
          <Textarea
            id="job-description"
            rows={4}
            aria-invalid={!!form.formState.errors.description}
            {...form.register('description')}
          />
          {form.formState.errors.description ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.description.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="job-location">Location</Label>
          <Input
            id="job-location"
            aria-invalid={!!form.formState.errors.location}
            {...form.register('location')}
          />
          {form.formState.errors.location ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.location.message}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="job-employment-type">Employment type</Label>
            <Select
              value={form.watch('employmentType')}
              onValueChange={(value) =>
                form.setValue('employmentType', value as JobInput['employmentType'])
              }
            >
              <SelectTrigger id="job-employment-type">
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="job-department">Department</Label>
            <Select
              value={form.watch('department')}
              onValueChange={(value) =>
                form.setValue('department', value as JobInput['department'])
              }
            >
              <SelectTrigger id="job-department">
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
          </div>
        </div>

        <StringListField
          id="job-responsibilities"
          label="Responsibilities"
          values={form.watch('responsibilities')}
          onChange={(values) =>
            form.setValue('responsibilities', values, { shouldValidate: true })
          }
          error={form.formState.errors.responsibilities?.message}
        />

        <StringListField
          id="job-requirements"
          label="Requirements"
          values={form.watch('requirements')}
          onChange={(values) =>
            form.setValue('requirements', values, { shouldValidate: true })
          }
          error={form.formState.errors.requirements?.message}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="job-status">Status</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) =>
                form.setValue('status', value as JobInput['status'])
              }
            >
              <SelectTrigger id="job-status">
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="job-deadline">Application deadline</Label>
            <Input id="job-deadline" type="date" {...form.register('deadline')} />
          </div>
        </div>
      </FormSection>

      <FormActions
        onCancel={onCancel}
        submitLabel={isEditing ? 'Save changes' : 'Create job'}
        isSubmitting={isSubmitting}
      />

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
