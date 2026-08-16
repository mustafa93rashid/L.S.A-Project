import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  FileText,
  ListChecks,
  MapPin,
  Send,
  UsersRound,
} from 'lucide-react'

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FieldError } from '@/components/forms/FieldError'
import { FormErrorAlert } from '@/components/forms/FormErrorAlert'
import { FormSection } from '@/components/forms/FormSection'
import { FormStepper, type FormStep } from '@/components/forms/FormStepper'
import { FormStepNavigation } from '@/components/forms/FormStepNavigation'
import { StringListField } from '@/components/forms/StringListField'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { applyServerErrors } from '@/lib/form-errors'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

import {
  useCreateJobMutation,
  useUpdateJobMutation,
} from '@/features/jobs/queries'

import {
  jobSchema,
  type JobInput,
} from '@/features/jobs/schema'

import {
  EMPLOYMENT_TYPES,
  JOB_DEPARTMENTS,
  JOB_STATUSES,
  type Job,
} from '@/features/jobs/types'

import { jobStatusLabel } from '@/features/jobs/utils'

interface JobFormProps {
  job?: Job | null
  onSuccess: () => void
  onCancel?: () => void
}

// ==================== Steps ====================

const STEPS: FormStep[] = [
  {
    key: 'information',
    label: 'Information',
    icon: BriefcaseBusiness,
  },
  {
    key: 'description',
    label: 'Description',
    icon: FileText,
  },
  {
    key: 'requirements',
    label: 'Requirements',
    icon: ListChecks,
  },
  {
    key: 'publishing',
    label: 'Publishing',
    icon: Send,
  },
]

// ==================== Default Values ====================

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

// ==================== Array Error ====================

function getArrayErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined

  const candidate = error as {
    message?: unknown
    root?: {
      message?: unknown
    }
  }

  if (typeof candidate.message === 'string') return candidate.message
  if (typeof candidate.root?.message === 'string') return candidate.root.message

  return undefined
}

// ==================== String Item Errors ====================

function getStringItemErrors(error: unknown): Array<string | undefined> {
  if (!Array.isArray(error)) return []

  return error.map((item) => {
    if (!item || typeof item !== 'object') return undefined

    const candidate = item as {
      message?: unknown
    }

    return typeof candidate.message === 'string'
      ? candidate.message
      : undefined
  })
}

// ==================== Job Form ====================

export function JobForm({ job, onSuccess }: JobFormProps) {
  const isEditing = Boolean(job)

  // ==================== Step State ====================

  const [currentStep, setCurrentStep] = useState(0)
  const [completedStep, setCompletedStep] = useState(-1)

  // ==================== Error State ====================

  const [formError, setFormError] = useState<string | null>(null)

  // ==================== Mutations ====================

  const createMutation = useCreateJobMutation()
  const updateMutation = useUpdateJobMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // ==================== Form ====================

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

  const status = form.watch('status') ?? 'draft'
  const employmentType = form.watch('employmentType')
  const department = form.watch('department')

  // ==================== Unsaved Changes ====================

  const guard = useUnsavedChangesGuard(form.formState.isDirty)

  // ==================== Scroll To Top ====================

  const scrollFormToTop = () => {
    const main = document.querySelector('main')

    if (main) {
      main.scrollTo({
        top: 0,
        behavior: 'smooth',
      })

      return
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // ==================== Validate Current Step ====================

  const validateCurrentStep = async (): Promise<boolean> => {
    setFormError(null)

    switch (currentStep) {
      case 0:
        return form.trigger([
          'title',
          'location',
          'employmentType',
          'department',
          'deadline',
        ])

      case 1:
        return form.trigger([
          'shortDescription',
          'description',
        ])

      case 2:
        return form.trigger([
          'responsibilities',
          'requirements',
        ])

      case 3:
        return form.trigger(['status'])

      default:
        return true
    }
  }

  // ==================== Next Step ====================

  const handleNext = async () => {
    const valid = await validateCurrentStep()

    if (!valid) return

    setCompletedStep((current) => Math.max(current, currentStep))
    setCurrentStep((current) => Math.min(current + 1, STEPS.length - 1))

    scrollFormToTop()
  }

  // ==================== Previous Step ====================

  const handlePrevious = () => {
    setCurrentStep((current) => Math.max(current - 1, 0))
    setFormError(null)
    scrollFormToTop()
  }

  // ==================== Step Click ====================

  const handleStepClick = (index: number) => {
    if (index > completedStep + 1) return

    setCurrentStep(index)
    setFormError(null)
    scrollFormToTop()
  }

  // ==================== Submit ====================

  const onSubmit = form.handleSubmit(
    (values) => {
      setFormError(null)

      const payload = {
        ...values,
        deadline: values.deadline || null,
      }

      // ==================== Server Error ====================

      const onError = (error: unknown) => {
        const generalError = applyServerErrors(form, error)

        setFormError(generalError)
        scrollFormToTop()
      }

      // ==================== Update ====================

      if (isEditing && job) {
        updateMutation.mutate(
          {
            id: job._id,
            payload,
          },
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

      // ==================== Create ====================

      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Job created successfully')
          guard.bypassOnce()
          onSuccess()
        },
        onError,
      })
    },

    // ==================== Client Validation Error ====================

    (errors) => {
      if (
        errors.title ||
        errors.location ||
        errors.employmentType ||
        errors.department ||
        errors.deadline
      ) {
        setCurrentStep(0)
        scrollFormToTop()
        return
      }

      if (errors.shortDescription || errors.description) {
        setCurrentStep(1)
        scrollFormToTop()
        return
      }

      if (errors.responsibilities || errors.requirements) {
        setCurrentStep(2)
        scrollFormToTop()
        return
      }

      if (errors.status) {
        setCurrentStep(3)
        scrollFormToTop()
      }
    },
  )

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      noValidate
      className="flex min-w-0 flex-col gap-5 overflow-x-hidden"
    >
      {/* ==================== Stepper ==================== */}

      <FormStepper
        steps={STEPS}
        currentStep={currentStep}
        completedStep={completedStep}
        onStepClick={handleStepClick}
      />

      {/* ==================== General Form Error ==================== */}

      <FormErrorAlert
        title="Unable to save job"
        message={formError}
      />

      {/* ==================== Step Content ==================== */}

      <div className="min-w-0">
        {/* ==================== Step 1 - Job Information ==================== */}

        {currentStep === 0 ? (
          <FormSection
            title="Job Information"
            description="Define the position, department, employment type, location, and application deadline."
            icon={BriefcaseBusiness}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Job Title ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="job-title"
                  className="text-[12px] font-semibold"
                >
                  Job title
                </Label>

                <div className="group relative">
                  <BriefcaseBusiness
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                    strokeWidth={1.8}
                  />

                  <Input
                    id="job-title"
                    placeholder="e.g. Senior Mechanical Engineer"
                    className="h-11 rounded-xl pl-10"
                    aria-invalid={!!form.formState.errors.title}
                    {...form.register('title')}
                  />
                </div>

                <FieldError
                  message={form.formState.errors.title?.message}
                />
              </div>

              {/* ==================== Location And Employment Type ==================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ==================== Location ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="job-location"
                    className="text-[12px] font-semibold"
                  >
                    Location
                  </Label>

                  <div className="group relative">
                    <MapPin
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                      strokeWidth={1.8}
                    />

                    <Input
                      id="job-location"
                      placeholder="e.g. Basra, Iraq"
                      className="h-11 rounded-xl pl-10"
                      aria-invalid={!!form.formState.errors.location}
                      {...form.register('location')}
                    />
                  </div>

                  <FieldError
                    message={form.formState.errors.location?.message}
                  />
                </div>

                {/* ==================== Employment Type ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="job-employment-type"
                    className="text-[12px] font-semibold"
                  >
                    Employment type
                  </Label>

                  <Select
                    value={employmentType}
                    onValueChange={(value) =>
                      form.setValue(
                        'employmentType',
                        value as JobInput['employmentType'],
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      )
                    }
                  >
                    <SelectTrigger
                      id="job-employment-type"
                      className="h-11 w-full rounded-xl"
                      aria-invalid={!!form.formState.errors.employmentType}
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((type) => (
                        <SelectItem
                          key={type}
                          value={type}
                        >
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FieldError
                    message={form.formState.errors.employmentType?.message}
                  />
                </div>
              </div>

              {/* ==================== Department And Deadline ==================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ==================== Department ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="job-department"
                    className="text-[12px] font-semibold"
                  >
                    Department
                  </Label>

                  <Select
                    value={department}
                    onValueChange={(value) =>
                      form.setValue(
                        'department',
                        value as JobInput['department'],
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      )
                    }
                  >
                    <SelectTrigger
                      id="job-department"
                      className="h-11 w-full rounded-xl"
                      aria-invalid={!!form.formState.errors.department}
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {JOB_DEPARTMENTS.map((departmentItem) => (
                        <SelectItem
                          key={departmentItem}
                          value={departmentItem}
                        >
                          {departmentItem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FieldError
                    message={form.formState.errors.department?.message}
                  />
                </div>

                {/* ==================== Application Deadline ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="job-deadline"
                    className="text-[12px] font-semibold"
                  >
                    Application deadline
                  </Label>

                  <div className="group relative">
                    <CalendarDays
                      className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                      strokeWidth={1.8}
                    />

                    <Input
                      id="job-deadline"
                      type="date"
                      className="h-11 rounded-xl pl-10"
                      aria-invalid={!!form.formState.errors.deadline}
                      {...form.register('deadline')}
                    />
                  </div>

                  <FieldError
                    message={form.formState.errors.deadline?.message}
                  />
                </div>
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 2 - Job Description ==================== */}

        {currentStep === 1 ? (
          <FormSection
            title="Job Description"
            description="Describe the opportunity and provide candidates with a clear understanding of the position."
            icon={FileText}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Short Description ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="job-short"
                  className="text-[12px] font-semibold"
                >
                  Short description
                </Label>

                <Textarea
                  id="job-short"
                  rows={3}
                  placeholder="A short summary displayed in the careers listing."
                  className="min-h-[100px] resize-y rounded-xl"
                  aria-invalid={!!form.formState.errors.shortDescription}
                  {...form.register('shortDescription')}
                />

                <FieldError
                  message={form.formState.errors.shortDescription?.message}
                />
              </div>

              {/* ==================== Full Description ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="job-description"
                  className="text-[12px] font-semibold"
                >
                  Full description
                </Label>

                <Textarea
                  id="job-description"
                  rows={6}
                  placeholder="Describe the position, its main purpose, work environment, and any relevant details."
                  className="min-h-[180px] resize-y rounded-xl"
                  aria-invalid={!!form.formState.errors.description}
                  {...form.register('description')}
                />

                <FieldError
                  message={form.formState.errors.description?.message}
                />
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 3 - Responsibilities And Requirements ==================== */}

        {currentStep === 2 ? (
          <FormSection
            title="Responsibilities & Requirements"
            description="Define what the employee will be responsible for and the qualifications expected from candidates."
            icon={ListChecks}
            className="min-w-0"
          >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* ==================== Responsibilities ==================== */}

              <div className="min-w-0 rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <ListChecks
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-foreground">
                      Position responsibilities
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                      Add the primary duties associated with this role.
                    </p>
                  </div>
                </div>

                <StringListField
                  id="job-responsibilities"
                  label="Responsibilities"
                  placeholder="Responsibility"
                  addLabel="Add responsibility"
                  values={form.watch('responsibilities') ?? ['']}
                  onChange={(values) =>
                    form.setValue('responsibilities', values, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  error={getArrayErrorMessage(
                    form.formState.errors.responsibilities,
                  )}
                  itemErrors={getStringItemErrors(
                    form.formState.errors.responsibilities,
                  )}
                />
              </div>

              {/* ==================== Requirements ==================== */}

              <div className="min-w-0 rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <UsersRound
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-foreground">
                      Candidate requirements
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                      Add skills, experience and qualifications candidates
                      should have.
                    </p>
                  </div>
                </div>

                <StringListField
                  id="job-requirements"
                  label="Requirements"
                  placeholder="Requirement"
                  addLabel="Add requirement"
                  values={form.watch('requirements') ?? ['']}
                  onChange={(values) =>
                    form.setValue('requirements', values, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  error={getArrayErrorMessage(
                    form.formState.errors.requirements,
                  )}
                  itemErrors={getStringItemErrors(
                    form.formState.errors.requirements,
                  )}
                />
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 4 - Publishing Settings ==================== */}

        {currentStep === 3 ? (
          <FormSection
            title="Publishing Settings"
            description="Control the lifecycle and public availability of this job opportunity."
            icon={Send}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Job Status ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="job-status"
                  className="text-[12px] font-semibold"
                >
                  Job status
                </Label>

                <Select
                  value={status}
                  onValueChange={(value) =>
                    form.setValue(
                      'status',
                      value as JobInput['status'],
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    )
                  }
                >
                  <SelectTrigger
                    id="job-status"
                    className="h-11 w-full rounded-xl"
                    aria-invalid={!!form.formState.errors.status}
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {JOB_STATUSES.map((jobStatus) => (
                      <SelectItem
                        key={jobStatus}
                        value={jobStatus}
                      >
                        {jobStatusLabel(jobStatus)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <FieldError
                  message={form.formState.errors.status?.message}
                />
              </div>

              {/* ==================== Status Information ==================== */}

              <div
                className={`rounded-2xl border p-4 transition-colors ${
                  status === 'published'
                    ? 'border-success/20 bg-success/[0.035]'
                    : status === 'closed'
                      ? 'border-destructive/15 bg-destructive/[0.025]'
                      : 'border-border/70 bg-muted/[0.06]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                      status === 'published'
                        ? 'border-success/15 bg-success-subtle text-success'
                        : status === 'closed'
                          ? 'border-destructive/15 bg-destructive/5 text-destructive'
                          : 'border-border/70 bg-background text-muted-foreground'
                    }`}
                  >
                    {status === 'published' ? (
                      <CheckCircle2
                        className="size-[17px]"
                        strokeWidth={1.8}
                      />
                    ) : status === 'closed' ? (
                      <CircleDot
                        className="size-[17px]"
                        strokeWidth={1.8}
                      />
                    ) : (
                      <FileText
                        className="size-[17px]"
                        strokeWidth={1.8}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[12px] font-semibold text-foreground">
                        {jobStatusLabel(status)}
                      </p>

                      <span
                        className={`size-1.5 rounded-full ${
                          status === 'published'
                            ? 'bg-success'
                            : status === 'closed'
                              ? 'bg-destructive'
                              : 'bg-muted-foreground/40'
                        }`}
                      />
                    </div>

                    <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                      {status === 'published'
                        ? 'This job is visible on the public careers page and candidates can submit applications.'
                        : status === 'closed'
                          ? 'This position is closed and no longer accepts new applications.'
                          : 'This job remains private and will not appear on the public careers page.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        ) : null}
      </div>

      {/* ==================== Actions ==================== */}

      <FormStepNavigation
        currentStep={currentStep}
        totalSteps={STEPS.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        submitLabel={isEditing ? 'Save changes' : 'Create job'}
      />

      {/* ==================== Confirm Dialog ==================== */}

      <ConfirmDialog
        open={guard.isBlocked}
        onOpenChange={(open) => {
          if (!open) guard.cancelLeave()
        }}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        variant="destructive"
        onConfirm={guard.confirmLeave}
      />
    </form>
  )
}