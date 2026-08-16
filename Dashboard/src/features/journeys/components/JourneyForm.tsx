import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  CalendarRange,
  ImageIcon,
  Landmark,
  LayoutTemplate,
  Milestone,
  PanelLeft,
  PanelRight,
  Sparkles,
} from 'lucide-react'

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FieldError } from '@/components/forms/FieldError'
import { FormErrorAlert } from '@/components/forms/FormErrorAlert'
import { FormSection } from '@/components/forms/FormSection'
import {
  FormStepper,
  type FormStep,
} from '@/components/forms/FormStepper'
import { FormStepNavigation } from '@/components/forms/FormStepNavigation'
import { ImageUploadField } from '@/components/forms/ImageUploadField'

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
import { buildFormData } from '@/lib/form-data'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

import {
  useCreateJourneyMutation,
  useUpdateJourneyMutation,
} from '@/features/journeys/queries'

import {
  journeySchema,
  type JourneyInput,
} from '@/features/journeys/schema'

import {
  JOURNEY_SIDES,
  type Journey,
} from '@/features/journeys/types'

interface JourneyFormProps {
  journey?: Journey | null
  onSuccess: () => void
  onCancel: () => void
}

// ==================== Steps ====================

const STEPS: FormStep[] = [
  {
    key: 'information',
    label: 'Information',
    icon: Milestone,
  },
  {
    key: 'presentation',
    label: 'Presentation',
    icon: LayoutTemplate,
  },
  {
    key: 'image',
    label: 'Image',
    icon: ImageIcon,
  },
]

// ==================== Default Values ====================

const emptyDefaults: JourneyInput = {
  period: '',
  title: '',
  description: '',
  icon: '',
  side: 'left',
}

// ==================== Journey Form ====================

export function JourneyForm({ journey, onSuccess }: JourneyFormProps) {
  const isEditing = Boolean(journey)

  // ==================== Step State ====================

  const [currentStep, setCurrentStep] = useState(0)
  const [completedStep, setCompletedStep] = useState(-1)

  // ==================== Error State ====================

  const [formError, setFormError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  // ==================== File State ====================

  const [imageFile, setImageFile] = useState<File | null>(null)

  // ==================== Mutations ====================

  const createMutation = useCreateJourneyMutation()
  const updateMutation = useUpdateJourneyMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // ==================== Form ====================

  const form = useForm<JourneyInput>({
    resolver: zodResolver(journeySchema),
    defaultValues: journey
      ? {
          period: journey.period,
          title: journey.title,
          description: journey.description,
          icon: journey.icon,
          side: journey.side,
        }
      : emptyDefaults,
  })

  const side = form.watch('side') ?? 'left'

  // ==================== Unsaved Changes ====================

  const guard = useUnsavedChangesGuard(
    form.formState.isDirty || imageFile !== null,
  )

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
          'period',
          'title',
          'description',
          'side',
        ])

      case 1:
        return form.trigger(['icon'])

      case 2: {
        const hasImage =
          Boolean(imageFile) ||
          Boolean(journey?.image?.url)

        if (!hasImage) {
          setImageError('Journey image is required.')
          return false
        }

        setImageError(null)

        return true
      }

      default:
        return true
    }
  }

  // ==================== Next Step ====================

  const handleNext = async () => {
    const valid = await validateCurrentStep()

    if (!valid) return

    setCompletedStep((current) => Math.max(current, currentStep))

    setCurrentStep((current) =>
      Math.min(current + 1, STEPS.length - 1),
    )

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
      const needsImage =
        !imageFile &&
        !journey?.image?.url

      if (needsImage) {
        setImageError('Journey image is required.')
        setCurrentStep(2)
        scrollFormToTop()
        return
      }

      setImageError(null)
      setFormError(null)

      const formData = buildFormData(
        {
          period: values.period,
          title: values.title,
          description: values.description,
          icon: values.icon,
          side: values.side,
        },
        {
          image: imageFile,
        },
      )

      // ==================== Server Error ====================

      const onError = (error: unknown) => {
        const generalError = applyServerErrors(form, error, {
          customFields: {
            image: (message: string) => {
              setImageError(message)
              setCurrentStep(2)
            },
          },
        })

        setFormError(generalError)
        scrollFormToTop()
      }

      // ==================== Update ====================

      if (isEditing && journey) {
        updateMutation.mutate(
          {
            id: journey._id,
            formData,
          },
          {
            onSuccess: () => {
              toast.success('Journey milestone updated successfully')
              guard.bypassOnce()
              onSuccess()
            },
            onError,
          },
        )

        return
      }

      // ==================== Create ====================

      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Journey milestone created successfully')
          guard.bypassOnce()
          onSuccess()
        },
        onError,
      })
    },

    // ==================== Client Validation Error ====================

    (errors) => {
      if (
        errors.period ||
        errors.title ||
        errors.description ||
        errors.side
      ) {
        setCurrentStep(0)
        scrollFormToTop()
        return
      }

      if (errors.icon) {
        setCurrentStep(1)
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
        title="Unable to save milestone"
        message={formError}
      />

      {/* ==================== Step Content ==================== */}

      <div className="min-w-0">
        {/* ==================== Step 1 - Milestone Information ==================== */}

        {currentStep === 0 ? (
          <FormSection
            title="Milestone Information"
            description="Define when this milestone occurred and the story associated with this stage of the company journey."
            icon={Milestone}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Period And Timeline Side ==================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ==================== Period ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="journey-period"
                    className="text-[12px] font-semibold"
                  >
                    Period
                  </Label>

                  <div className="group relative">
                    <CalendarRange
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                      strokeWidth={1.8}
                    />

                    <Input
                      id="journey-period"
                      placeholder="e.g. 2024 or 2024 - 2025"
                      className="h-11 rounded-xl pl-10"
                      aria-invalid={!!form.formState.errors.period}
                      {...form.register('period')}
                    />
                  </div>

                  <FieldError
                    message={form.formState.errors.period?.message}
                  />
                </div>

                {/* ==================== Timeline Side ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="journey-side"
                    className="text-[12px] font-semibold"
                  >
                    Timeline side
                  </Label>

                  <Select
                    value={side}
                    onValueChange={(value) =>
                      form.setValue(
                        'side',
                        value as JourneyInput['side'],
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      )
                    }
                  >
                    <SelectTrigger
                      id="journey-side"
                      className="h-11 w-full rounded-xl"
                      aria-invalid={!!form.formState.errors.side}
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {JOURNEY_SIDES.map((timelineSide) => (
                        <SelectItem
                          key={timelineSide}
                          value={timelineSide}
                        >
                          <span className="flex items-center gap-2">
                            {timelineSide === 'left' ? (
                              <PanelLeft
                                className="size-3.5 text-muted-foreground"
                                strokeWidth={1.8}
                              />
                            ) : (
                              <PanelRight
                                className="size-3.5 text-muted-foreground"
                                strokeWidth={1.8}
                              />
                            )}

                            {timelineSide === 'left' ? 'Left' : 'Right'}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FieldError
                    message={form.formState.errors.side?.message}
                  />
                </div>
              </div>

              {/* ==================== Milestone Title ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="journey-title"
                  className="text-[12px] font-semibold"
                >
                  Milestone title
                </Label>

                <div className="group relative">
                  <Landmark
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                    strokeWidth={1.8}
                  />

                  <Input
                    id="journey-title"
                    placeholder="Enter milestone title"
                    className="h-11 rounded-xl pl-10"
                    aria-invalid={!!form.formState.errors.title}
                    {...form.register('title')}
                  />
                </div>

                <FieldError
                  message={form.formState.errors.title?.message}
                />
              </div>

              {/* ==================== Description ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="journey-description"
                  className="text-[12px] font-semibold"
                >
                  Description
                </Label>

                <Textarea
                  id="journey-description"
                  rows={5}
                  placeholder="Describe this stage in the company's journey."
                  className="min-h-[140px] resize-y rounded-xl"
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

        {/* ==================== Step 2 - Timeline Presentation ==================== */}

        {currentStep === 1 ? (
          <FormSection
            title="Timeline Presentation"
            description="Control how this milestone is represented and positioned on the public company timeline."
            icon={LayoutTemplate}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Icon Identifier ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="journey-icon"
                  className="text-[12px] font-semibold"
                >
                  Icon identifier
                </Label>

                <div className="group relative">
                  <Sparkles
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                    strokeWidth={1.8}
                  />

                  <Input
                    id="journey-icon"
                    placeholder="e.g. FaBuilding"
                    className="h-11 rounded-xl pl-10"
                    aria-invalid={!!form.formState.errors.icon}
                    {...form.register('icon')}
                  />
                </div>

                <FieldError
                  message={form.formState.errors.icon?.message}
                />

                <p className="flex items-start gap-1.5 text-[10px] leading-5 text-muted-foreground">
                  <Sparkles
                    className="mt-1 size-3 shrink-0"
                    strokeWidth={1.8}
                  />

                  Use the icon identifier expected by the public website.
                </p>
              </div>

              {/* ==================== Timeline Position ==================== */}

              <div className="rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    {side === 'left' ? (
                      <PanelLeft
                        className="size-4"
                        strokeWidth={1.8}
                      />
                    ) : (
                      <PanelRight
                        className="size-4"
                        strokeWidth={1.8}
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-foreground">
                      Timeline position
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                      {side === 'left'
                        ? 'This milestone will appear on the left side of the company timeline.'
                        : 'This milestone will appear on the right side of the company timeline.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 3 - Milestone Image ==================== */}

        {currentStep === 2 ? (
          <FormSection
            title="Milestone Image"
            description="Upload the visual displayed alongside this milestone on the public website."
            icon={ImageIcon}
            className="min-w-0"
          >
            <ImageUploadField
              id="journey-image"
              title="Milestone image"
              description="Click the image area to upload or replace the milestone image."
              file={imageFile}
              onFileChange={setImageFile}
              error={imageError}
              onErrorChange={setImageError}
              existingUrl={journey?.image?.url}
              existingAlt={journey?.title ?? 'Journey milestone'}
              placeholderTitle="Add milestone image"
              placeholderDescription="Click to select an image"
              acceptedFormatsText="JPEG, PNG, GIF or WebP — maximum file size 5 MB."
              maxWidthClassName="max-w-[440px]"
              aspectClassName="aspect-[16/8]"
              thumbnailWidth={720}
              icon={ImageIcon}
              required
            />
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
        submitLabel={isEditing ? 'Save changes' : 'Create milestone'}
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