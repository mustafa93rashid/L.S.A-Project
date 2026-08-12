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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/file-validation'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

import { useCreateJourneyMutation, useUpdateJourneyMutation } from '@/features/journeys/queries'
import { journeySchema, type JourneyInput } from '@/features/journeys/schema'
import { JOURNEY_SIDES, type Journey } from '@/features/journeys/types'

interface JourneyFormProps {
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null

    if (!file) {
      setImageFile(null)
      return
    }

    const validationError = validateImageFile(file)

    if (validationError) {
      setFormError(validationError)
      setImageFile(null)
      event.target.value = ''
      return
    }

    setFormError(null)
    setImageFile(file)
  }

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

      return
    }

    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Journey milestone created successfully')
        guard.bypassOnce()
        onSuccess()
      },
      onError,
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError ? <div className="rounded-xl border border-destructive/20 bg-destructive-subtle px-4 py-3 text-sm font-medium text-destructive">{formError}</div> : null}

      <FormSection title="Milestone Information">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="journey-period">Period</Label>
            <Input id="journey-period" placeholder="e.g. 2024 or 2024 - 2025" aria-invalid={!!form.formState.errors.period} {...form.register('period')} />
            {form.formState.errors.period ? <p className="text-xs text-destructive">{form.formState.errors.period.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="journey-side">Timeline side</Label>

            <Select value={form.watch('side')} onValueChange={(value) => form.setValue('side', value as JourneyInput['side'], { shouldDirty: true, shouldValidate: true })}>
              <SelectTrigger id="journey-side" className="w-full">
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

            {form.formState.errors.side ? <p className="text-xs text-destructive">{form.formState.errors.side.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <Label htmlFor="journey-title">Title</Label>
            <Input id="journey-title" placeholder="Enter milestone title" aria-invalid={!!form.formState.errors.title} {...form.register('title')} />
            {form.formState.errors.title ? <p className="text-xs text-destructive">{form.formState.errors.title.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <Label htmlFor="journey-description">Description</Label>
            <Textarea id="journey-description" rows={5} placeholder="Describe this stage in the company's journey." aria-invalid={!!form.formState.errors.description} {...form.register('description')} />
            {form.formState.errors.description ? <p className="text-xs text-destructive">{form.formState.errors.description.message}</p> : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Timeline Presentation">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="journey-icon">Icon</Label>
            <Input id="journey-icon" placeholder="e.g. FaBuilding" aria-invalid={!!form.formState.errors.icon} {...form.register('icon')} />
            {form.formState.errors.icon ? <p className="text-xs text-destructive">{form.formState.errors.icon.message}</p> : null}

            <p className="text-[11px] leading-5 text-muted-foreground">Use the icon identifier expected by the public website.</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/[0.12] px-4 py-3">
            <span className="text-[9px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">Timeline position</span>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              {form.watch('side') === 'left' ? 'This milestone will appear on the left side of the company timeline.' : 'This milestone will appear on the right side of the company timeline.'}
            </p>
          </div>
        </div>
      </FormSection>

      <FormSection title="Milestone Image">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-[18px] border border-border/70 bg-muted/20">
            {imageFile ? (
              <img src={URL.createObjectURL(imageFile)} alt="Selected journey preview" className="aspect-[4/3] h-full w-full object-cover" />
            ) : journey?.image.url ? (
              <img src={cloudinaryThumbnail(journey.image.url, 480)} alt={journey.title} className="aspect-[4/3] h-full w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center px-4 text-center text-xs text-muted-foreground">No image selected</div>
            )}
          </div>

          <div className="flex flex-col justify-center gap-3">
            <div>
              <Label htmlFor="journey-image">{isEditing ? 'Replace image' : 'Upload image'}</Label>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{isEditing ? 'Leave empty to keep the current image.' : 'Upload the image displayed with this journey milestone.'}</p>
            </div>

            <input
              id="journey-image"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
            />

            <p className="text-[10px] text-muted-foreground/70">JPEG, PNG, GIF or WebP.</p>
          </div>
        </div>
      </FormSection>

      <FormActions onCancel={onCancel} submitLabel={isEditing ? 'Save changes' : 'Create milestone'} isSubmitting={isSubmitting} />

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

