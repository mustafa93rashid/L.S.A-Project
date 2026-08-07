import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormSection } from '@/components/forms/FormSection'
import { FormActions } from '@/components/forms/FormActions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/file-validation'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import {
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
} from '@/features/partners/queries'
import { partnerSchema, type PartnerInput } from '@/features/partners/schema'
import type { Partner } from '@/features/partners/types'

interface PartnerFormProps {
  /** Present when editing — absent means "create". */
  partner?: Partner | null
  onSuccess: () => void
  onCancel: () => void
}

/** Shared by PartnerCreatePage and PartnerEditPage. */
export function PartnerForm({ partner, onSuccess, onCancel }: PartnerFormProps) {
  const isEditing = Boolean(partner)
  const [formError, setFormError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const createMutation = useCreatePartnerMutation()
  const updateMutation = useUpdatePartnerMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<PartnerInput>({
    resolver: zodResolver(partnerSchema),
    defaultValues: { website: partner?.website ?? '' },
  })

  const guard = useUnsavedChangesGuard(form.formState.isDirty || logoFile !== null)

  const onSubmit = form.handleSubmit((values) => {
    if (!isEditing && !logoFile) {
      setFormError('Partner logo is required.')
      return
    }
    setFormError(null)

    // Sent even when empty so clearing an existing website on edit reaches
    // the backend as an explicit `website: ""` rather than being omitted
    // (the update controller only touches the field when it's present).
    const formData = buildFormData({ website: values.website }, { logo: logoFile })

    const onError = (error: unknown) => setFormError(applyServerErrors(form, error))

    if (isEditing && partner) {
      updateMutation.mutate(
        { id: partner._id, formData },
        {
          onSuccess: () => {
            toast.success('Partner updated successfully')
            guard.bypassOnce()
            onSuccess()
          },
          onError,
        },
      )
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Partner created successfully')
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

      <FormSection title="Partner details">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="partner-logo">
            Logo{isEditing ? ' (leave empty to keep current)' : ''}
          </Label>
          {partner?.logo.url ? (
            <img
              src={cloudinaryThumbnail(partner.logo.url, 96)}
              alt="Partner logo"
              className="h-16 w-16 rounded-md border border-border object-contain p-1"
            />
          ) : null}
          <input
            id="partner-logo"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              if (file) {
                const validationError = validateImageFile(file)
                if (validationError) {
                  setFormError(validationError)
                  setLogoFile(null)
                  event.target.value = ''
                  return
                }
              }
              setFormError(null)
              setLogoFile(file)
            }}
            className="rounded-md border border-input bg-transparent px-2.5 py-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-secondary-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="partner-website">Website</Label>
          <Input
            id="partner-website"
            type="url"
            placeholder="https://example.com"
            aria-invalid={!!form.formState.errors.website}
            {...form.register('website')}
          />
          {form.formState.errors.website ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.website.message}
            </p>
          ) : null}
        </div>
      </FormSection>

      <FormActions
        onCancel={onCancel}
        submitLabel={isEditing ? 'Save changes' : 'Create partner'}
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
