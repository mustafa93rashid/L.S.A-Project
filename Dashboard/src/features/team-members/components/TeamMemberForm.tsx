import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  BriefcaseBusiness,
  Hash,
  ImagePlus,
  Sparkles,
  UserRound,
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
import { VisibilityToggle } from '@/components/forms/VisibilityToggle'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

import {
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
} from '@/features/team-members/queries'

import {
  teamMemberSchema,
  type TeamMemberInput,
} from '@/features/team-members/schema'

import type { TeamMember } from '@/features/team-members/types'

interface TeamMemberFormProps {
  teamMember?: TeamMember | null
  onSuccess: () => void
  onCancel: () => void
}

// ==================== Steps ====================

const STEPS: FormStep[] = [
  {
    key: 'profile',
    label: 'Profile',
    icon: UserRound,
  },
  {
    key: 'photo',
    label: 'Photo',
    icon: ImagePlus,
  },
  {
    key: 'display',
    label: 'Display',
    icon: Sparkles,
  },
]

// ==================== Default Values ====================

const emptyDefaults: TeamMemberInput = {
  fullName: '',
  position: '',
  experience: '',
  displayOrder: 0,
  isActive: true,
}

// ==================== Team Member Form ====================

export function TeamMemberForm({
  teamMember,
  onSuccess,
}: TeamMemberFormProps) {
  const isEditing = Boolean(teamMember)

  // ==================== Step State ====================

  const [currentStep, setCurrentStep] = useState(0)
  const [completedStep, setCompletedStep] = useState(-1)

  // ==================== Error State ====================

  const [formError, setFormError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  // ==================== File State ====================

  const [imageFile, setImageFile] = useState<File | null>(null)

  // ==================== Mutations ====================

  const createMutation = useCreateTeamMemberMutation()
  const updateMutation = useUpdateTeamMemberMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // ==================== Form ====================

  const form = useForm<TeamMemberInput>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: teamMember
      ? {
          fullName: teamMember.fullName,
          position: teamMember.position,
          experience: teamMember.experience,
          displayOrder: teamMember.displayOrder,
          isActive: teamMember.isActive,
        }
      : emptyDefaults,
  })

  const isActive = form.watch('isActive') ?? true

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
          'fullName',
          'position',
          'experience',
        ])

      case 1: {
        const hasImage =
          Boolean(imageFile) ||
          Boolean(teamMember?.image?.url)

        if (!hasImage) {
          setImageError('Team member photo is required.')
          return false
        }

        setImageError(null)

        return true
      }

      case 2:
        return form.trigger([
          'displayOrder',
          'isActive',
        ])

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
        !teamMember?.image?.url

      if (needsImage) {
        setImageError('Team member photo is required.')
        setCurrentStep(1)
        scrollFormToTop()
        return
      }

      setImageError(null)
      setFormError(null)

      const formData = buildFormData(
        {
          fullName: values.fullName,
          position: values.position,
          experience: values.experience,
          displayOrder: values.displayOrder,
          isActive: values.isActive,
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
              setCurrentStep(1)
            },
          },
        })

        setFormError(generalError)
        scrollFormToTop()
      }

      // ==================== Update ====================

      if (isEditing && teamMember) {
        updateMutation.mutate(
          {
            id: teamMember._id,
            formData,
          },
          {
            onSuccess: () => {
              toast.success('Team member updated successfully')
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
          toast.success('Team member created successfully')
          guard.bypassOnce()
          onSuccess()
        },
        onError,
      })
    },

    // ==================== Client Validation Error ====================

    (errors) => {
      if (
        errors.fullName ||
        errors.position ||
        errors.experience
      ) {
        setCurrentStep(0)
        scrollFormToTop()
        return
      }

      if (
        errors.displayOrder ||
        errors.isActive
      ) {
        setCurrentStep(2)
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
        title="Unable to save team member"
        message={formError}
      />

      {/* ==================== Step Content ==================== */}

      <div className="min-w-0">
        {/* ==================== Step 1 - Profile Information ==================== */}

        {currentStep === 0 ? (
          <FormSection
            title="Profile Information"
            description="Add the team member's identity, role, and professional experience."
            icon={UserRound}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Full Name ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="tm-fullName"
                  className="text-[12px] font-semibold"
                >
                  Full name
                </Label>

                <div className="group relative">
                  <UserRound
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                    strokeWidth={1.8}
                  />

                  <Input
                    id="tm-fullName"
                    placeholder="Enter team member name"
                    aria-invalid={!!form.formState.errors.fullName}
                    className="h-11 rounded-xl pl-10"
                    {...form.register('fullName')}
                  />
                </div>

                <FieldError
                  message={form.formState.errors.fullName?.message}
                />
              </div>

              {/* ==================== Position And Experience ==================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ==================== Position ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="tm-position"
                    className="text-[12px] font-semibold"
                  >
                    Position
                  </Label>

                  <div className="group relative">
                    <BriefcaseBusiness
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                      strokeWidth={1.8}
                    />

                    <Input
                      id="tm-position"
                      placeholder="e.g. Operations Manager"
                      aria-invalid={!!form.formState.errors.position}
                      className="h-11 rounded-xl pl-10"
                      {...form.register('position')}
                    />
                  </div>

                  <FieldError
                    message={form.formState.errors.position?.message}
                  />
                </div>

                {/* ==================== Experience ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="tm-experience"
                    className="text-[12px] font-semibold"
                  >
                    Experience
                  </Label>

                  <div className="group relative">
                    <Sparkles
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                      strokeWidth={1.8}
                    />

                    <Input
                      id="tm-experience"
                      placeholder="e.g. 8+ years"
                      aria-invalid={!!form.formState.errors.experience}
                      className="h-11 rounded-xl pl-10"
                      {...form.register('experience')}
                    />
                  </div>

                  <FieldError
                    message={form.formState.errors.experience?.message}
                  />
                </div>
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 2 - Profile Photo ==================== */}

        {currentStep === 1 ? (
          <FormSection
            title="Profile Photo"
            description="Upload the portrait displayed for this team member on the public website."
            icon={ImagePlus}
            className="min-w-0"
          >
            <ImageUploadField
              id="tm-image"
              title="Profile photo"
              description="Click the image area to upload or replace the team member photo."
              file={imageFile}
              onFileChange={setImageFile}
              error={imageError}
              onErrorChange={setImageError}
              existingUrl={teamMember?.image?.url}
              existingAlt={teamMember?.fullName ?? 'Team member'}
              placeholderTitle="Add profile photo"
              placeholderDescription="Click to select an image"
              acceptedFormatsText="JPEG, PNG, GIF or WebP — maximum file size 5 MB."
              maxWidthClassName="max-w-[300px]"
              aspectClassName="aspect-[4/3]"
              thumbnailWidth={720}
              icon={ImagePlus}
              required
            />
          </FormSection>
        ) : null}

        {/* ==================== Step 3 - Display Settings ==================== */}

        {currentStep === 2 ? (
          <FormSection
            title="Display Settings"
            description="Control ordering and whether this team member appears on the public website."
            icon={Sparkles}
            className="min-w-0"
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* ==================== Display Order ==================== */}

              <div className="rounded-2xl border border-border/70 bg-muted/[0.06] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <Hash
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      Display order
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                      Lower numbers appear first in the public team section.
                    </p>
                  </div>
                </div>

                <Input
                  id="tm-order"
                  type="number"
                  min={0}
                  max={999}
                  className="mt-4 h-11 rounded-xl bg-background text-center text-base font-semibold tabular-nums"
                  aria-invalid={!!form.formState.errors.displayOrder}
                  {...form.register('displayOrder', {
                    valueAsNumber: true,
                  })}
                />

                <FieldError
                  message={form.formState.errors.displayOrder?.message}
                />
              </div>

              {/* ==================== Public Visibility ==================== */}

              <VisibilityToggle
                id="tm-active"
                checked={isActive}
                onCheckedChange={(checked) =>
                  form.setValue('isActive', checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                title="Public visibility"
                activeDescription="This member is visible in the public team section."
                inactiveDescription="This member is hidden from the public team section."
                activeLabel="Visible"
                inactiveLabel="Hidden"
              />
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
        submitLabel={isEditing ? 'Save changes' : 'Create team member'}
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