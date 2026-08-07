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
import { buildFormData } from '@/lib/form-data'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/file-validation'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import {
  useCreateJourneyMutation,
  useUpdateJourneyMutation,
} from '@/features/journeys/queries'
import { journeySchema, type JourneyInput } from '@/features/journeys/schema'
import { JOURNEY_SIDES, type Journey } from '@/features/journeys/types'

interface JourneyFormProps {
  /** Present when editing — absent means "create". */
  journey?: Journey | null
  onSuccess: () => void
  onCancel: () => void
}

const emptyDefaults: JourneyInput = {
  period: '',
  title: '',
  description: '',
  icon: '',
  side: 'left',
}

/** Shared by JourneyCreatePage and JourneyEditPage. */
export function JourneyForm({ journey, onSuccess, onCancel }: JourneyFormProps) {
  const isEditing = Boolean(journey)
  const [formError, setFormError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const createMutation = useCreateJourneyMutation()
  const updateMutation = useUpdateJourneyMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

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

  const guard = useUnsavedChangesGuard(form.formState.isDirty || imageFile !== null)

  const onSubmit = form.handleSubmit((values) => {
    if (!isEditing && !imageFile) {
      setFormError('Journey image is required.')
      return
    }
    setFormError(null)

    const formData = buildFormData(
      {
        period: values.period,
        title: values.title,
        description: values.description,
        icon: values.icon,
        side: values.side,
      },
      { image: imageFile },
    )

    const onError = (error: unknown) => setFormError(applyServerErrors(form, error))

    if (isEditing && journey) {
      updateMutation.mutate(
        { id: journey._id, formData },
        {
          onSuccess: () => {
            toast.success('Journey milestone updated successfully')
            guard.bypassOnce()
            onSuccess()
          },
          onError,
        },
      )
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Journey milestone created successfully')
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

      <FormSection title="Milestone details">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="journey-period">Period</Label>
            <Input
              id="journey-period"
              placeholder="e.g. 2024 or 2024 - 2025"
              aria-invalid={!!form.formState.errors.period}
              {...form.register('period')}
            />
            {form.formState.errors.period ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.period.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="journey-side">Timeline side</Label>
            <Select
              value={form.watch('side')}
              onValueChange={(value) =>
                form.setValue('side', value as JourneyInput['side'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="journey-side">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOURNEY_SIDES.map((side) => (
                  <SelectItem key={side} value={side}>
                    {side === 'left' ? 'Left' : 'Right'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="journey-title">Title</Label>
          <Input
            id="journey-title"
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
          <Label htmlFor="journey-description">Description</Label>
          <Textarea
            id="journey-description"
            rows={3}
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
          <Label htmlFor="journey-icon">Icon</Label>
          <Input
            id="journey-icon"
            placeholder="e.g. FaBuilding (React Icons name)"
            aria-invalid={!!form.formState.errors.icon}
            {...form.register('icon')}
          />
          {form.formState.errors.icon ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.icon.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="journey-image">
            Image{isEditing ? ' (leave empty to keep current)' : ''}
          </Label>
          {journey?.image.url ? (
            <img
              src={cloudinaryThumbnail(journey.image.url, 96)}
              alt={journey.title}
              className="h-24 w-24 rounded-md border border-border object-cover"
            />
          ) : null}
          <input
            id="journey-image"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              if (file) {
                const validationError = validateImageFile(file)
                if (validationError) {
                  setFormError(validationError)
                  setImageFile(null)
                  event.target.value = ''
                  return
                }
              }
              setFormError(null)
              setImageFile(file)
            }}
            className="rounded-md border border-input bg-transparent px-2.5 py-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-secondary-foreground"
          />
        </div>
      </FormSection>

      <FormActions
        onCancel={onCancel}
        submitLabel={isEditing ? 'Save changes' : 'Create milestone'}
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
