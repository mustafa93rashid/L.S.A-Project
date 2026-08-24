import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Handshake, Hash, ImageIcon, Link2, ListOrdered } from 'lucide-react'

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormSection } from '@/components/forms/FormSection'
import { FormActions } from '@/components/forms/FormActions'
import { FieldError } from '@/components/forms/FieldError'
import { FormErrorAlert } from '@/components/forms/FormErrorAlert'
import { ImageUploadField } from '@/components/forms/ImageUploadField'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

import {
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
} from '@/features/partners/queries'

import {
  partnerSchema,
  type PartnerInput,
} from '@/features/partners/schema'

import type { Partner } from '@/features/partners/types'

interface PartnerFormProps {
  partner?: Partner | null
  onSuccess: () => void
  onCancel: () => void
}

// ==================== Partner Form ====================

export function PartnerForm({
  partner,
  onSuccess,
  onCancel,
}: PartnerFormProps) {
  const isEditing = Boolean(partner)

  // ==================== State ====================

  const [formError, setFormError] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // ==================== Mutations ====================

  const createMutation = useCreatePartnerMutation()
  const updateMutation = useUpdatePartnerMutation()

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending

  // ==================== Form ====================

  const form = useForm<PartnerInput>({
    resolver: zodResolver(partnerSchema),

    defaultValues: {
      website: partner?.website ?? '',
      displayOrder: partner?.displayOrder ?? 1,
    },
  })

  // ==================== Unsaved Changes ====================

  const guard = useUnsavedChangesGuard(
    form.formState.isDirty || logoFile !== null,
  )

  // ==================== Submit ====================

  const onSubmit = form.handleSubmit((values) => {
    const hasLogo =
      Boolean(logoFile) ||
      Boolean(partner?.logo?.url)

    if (!hasLogo) {
      setLogoError('Partner logo is required.')
      return
    }

    setLogoError(null)
    setFormError(null)

    const formData = buildFormData(
      {
        website: values.website,
        displayOrder: values.displayOrder,
      },
      {
        logo: logoFile,
      },
    )

    // ==================== Error Handler ====================

    const onError = (error: unknown) => {
      const generalError = applyServerErrors(
        form,
        error,
        {
          customFields: {
            logo: (message: string) => {
              setLogoError(message)
            },
          },
        },
      )

      setFormError(generalError)
    }

    // ==================== Update ====================

    if (isEditing && partner) {
      updateMutation.mutate(
        {
          id: partner._id,
          formData,
        },
        {
          onSuccess: () => {
            toast.success(
              'Partner updated successfully',
            )

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
        toast.success(
          'Partner created successfully',
        )

        guard.bypassOnce()

        onSuccess()
      },

      onError,
    })
  })

  // ==================== Render ====================

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-6"
    >
      {/* ==================== General Error ==================== */}

      <FormErrorAlert
        title="Unable to save partner"
        message={formError}
      />

      {/* ==================== Partner Information ==================== */}

      <FormSection
        title="Partner Information"
        description="Manage the partner logo, website, and display position in the public partners section."
        icon={Handshake}
      >
        <div className="space-y-7">

          {/* ==================== Partner Logo ==================== */}

          <ImageUploadField
            id="partner-logo"
            title="Partner logo"
            description="Click the image area to upload or replace the partner logo."
            file={logoFile}
            onFileChange={setLogoFile}
            error={logoError}
            onErrorChange={setLogoError}
            existingUrl={partner?.logo?.url}
            existingAlt="Partner logo"
            placeholderTitle="Add partner logo"
            placeholderDescription="Click to select an image"
            acceptedFormatsText="JPEG, PNG, GIF or WebP — maximum file size 5 MB. Transparent PNG or WebP is recommended."
            maxWidthClassName="max-w-[260px]"
            aspectClassName="h-[140px]"
            thumbnailWidth={640}
            icon={ImageIcon}
            required
          />

          {/* ==================== Details ==================== */}

          <div className="border-t border-border/60 pt-6">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

              {/* ==================== Website ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="partner-website"
                  className="text-[12px] font-semibold"
                >
                  Website
                </Label>

                <div className="group relative">
                  <div
                    className="
                      pointer-events-none
                      absolute left-3 top-1/2
                      flex size-7
                      -translate-y-1/2
                      items-center justify-center
                      text-muted-foreground/45
                      transition-colors
                      group-focus-within:text-foreground
                    "
                  >
                    <Link2
                      className="size-3.5"
                      strokeWidth={1.8}
                    />
                  </div>

                  <Input
                    id="partner-website"
                    type="url"
                    placeholder="https://example.com"
                    aria-invalid={
                      !!form.formState.errors.website
                    }
                    className="h-11 rounded-xl pl-12"
                    {...form.register('website')}
                  />
                </div>

                <FieldError
                  message={
                    form.formState.errors
                      .website?.message
                  }
                />

                <p className="text-[10px] leading-5 text-muted-foreground">
                  Optional external link to the
                  partner&apos;s official website.
                </p>
              </div>

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
            </div>
          </div>

          {/* ==================== Display Information ==================== */}

          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              border border-border/70
              bg-muted/[0.08]
              p-4
            "
          >
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute -right-8 -top-10
                size-24
                rounded-full
                bg-primary/[0.035]
                blur-3xl
              "
            />

            <div className="relative flex items-start gap-3">
              <div
                className="
                  flex size-9
                  shrink-0
                  items-center justify-center
                  rounded-xl
                  border border-border/70
                  bg-background
                  text-muted-foreground
                "
              >
                <ListOrdered
                  className="size-4"
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">
                <span
                  className="
                    text-[9px]
                    font-semibold
                    uppercase
                    tracking-[0.1em]
                    text-muted-foreground
                  "
                >
                  Display behavior
                </span>

                <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">
                  Partners are displayed according to
                  their display order. A lower value
                  places the logo earlier in the public
                  partners section.
                </p>
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      {/* ==================== Actions ==================== */}

      <FormActions
        onCancel={onCancel}
        submitLabel={
          isEditing
            ? 'Save changes'
            : 'Create partner'
        }
        isSubmitting={isSubmitting}
      />

      {/* ==================== Unsaved Changes ==================== */}

      <ConfirmDialog
        open={guard.isBlocked}
        onOpenChange={(open) => {
          if (!open) {
            guard.cancelLeave()
          }
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