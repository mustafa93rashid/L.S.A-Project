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

import { useCreatePartnerMutation, useUpdatePartnerMutation } from '@/features/partners/queries'
import { partnerSchema, type PartnerInput } from '@/features/partners/schema'
import type { Partner } from '@/features/partners/types'

interface PartnerFormProps {
  partner?: Partner | null
  onSuccess: () => void
  onCancel: () => void
}

export function PartnerForm({ partner, onSuccess, onCancel }: PartnerFormProps) {
  const isEditing = Boolean(partner)

  const [formError, setFormError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const createMutation = useCreatePartnerMutation()
  const updateMutation = useUpdatePartnerMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<PartnerInput>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      website: partner?.website ?? '',
    },
  })

  const guard = useUnsavedChangesGuard(form.formState.isDirty || logoFile !== null)

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null

    if (!file) {
      setLogoFile(null)
      return
    }

    const validationError = validateImageFile(file)

    if (validationError) {
      setFormError(validationError)
      setLogoFile(null)
      event.target.value = ''
      return
    }

    setFormError(null)
    setLogoFile(file)
  }

  const onSubmit = form.handleSubmit((values) => {
    if (!isEditing && !logoFile) {
      setFormError('Partner logo is required.')
      return
    }

    setFormError(null)

    const formData = buildFormData(
      {
        website: values.website,
      },
      {
        logo: logoFile,
      },
    )

    const onError = (error: unknown) => setFormError(applyServerErrors(form, error))

    if (isEditing && partner) {
      updateMutation.mutate(
        {
          id: partner._id,
          formData,
        },
        {
          onSuccess: () => {
            toast.success('Partner updated successfully')
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
        toast.success('Partner created successfully')
        guard.bypassOnce()
        onSuccess()
      },
      onError,
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError ? <div className="rounded-xl border border-destructive/20 bg-destructive-subtle px-4 py-3 text-sm font-medium text-destructive">{formError}</div> : null}

      <FormSection title="Partner Information">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="partner-logo">{isEditing ? 'Partner logo' : 'Upload partner logo'}</Label>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{isEditing ? 'Upload a new image only if you want to replace the current partner logo.' : 'Upload the logo that will be displayed on the public website.'}</p>
            </div>

            <div className="overflow-hidden rounded-[18px] border border-border/70 bg-muted/[0.12]">
              {logoFile ? (
                <img src={URL.createObjectURL(logoFile)} alt="Selected partner logo preview" className="aspect-[16/7] h-full w-full object-cover" />
              ) : partner?.logo?.url ? (
                <img src={cloudinaryThumbnail(partner.logo.url, 720)} alt="Partner logo" className="aspect-[16/7] h-full w-full object-cover" />
              ) : (
                <div className="flex aspect-[16/7] items-center justify-center px-6 text-center text-xs text-muted-foreground">No logo selected</div>
              )}
            </div>

            <input
              id="partner-logo"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleLogoChange}
              className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
            />

            <p className="text-[10px] text-muted-foreground/70">JPEG, PNG, GIF or WebP.</p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="partner-website">Website</Label>

              <Input id="partner-website" type="url" placeholder="https://example.com" aria-invalid={!!form.formState.errors.website} {...form.register('website')} />

              {form.formState.errors.website ? <p className="text-xs text-destructive">{form.formState.errors.website.message}</p> : null}

              <p className="text-[11px] leading-5 text-muted-foreground">Optional external link to the partner's official website.</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/[0.12] px-4 py-3">
              <span className="text-[9px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">Display behavior</span>

              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                The partner logo will be displayed in the public partners section. If a website is provided, visitors can use it to reach the partner's external site.
              </p>
            </div>
          </div>
        </div>
      </FormSection>

      <FormActions onCancel={onCancel} submitLabel={isEditing ? 'Save changes' : 'Create partner'} isSubmitting={isSubmitting} />

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