import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AlertCircle, ExternalLink, Handshake, ImageIcon, Link2, Sparkles, Upload, X } from 'lucide-react'
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


function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="flex items-center gap-1.5 text-[10px] font-medium text-destructive">
      <AlertCircle className="size-3 shrink-0" strokeWidth={1.8} />
      {message}
    </p>
  )
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


  const logoPreviewUrl = useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile)
    if (partner?.logo?.url) return cloudinaryThumbnail(partner.logo.url, 640)
    return null
  }, [logoFile, partner?.logo?.url])


  useEffect(() => {
    if (!logoFile || !logoPreviewUrl) return

    return () => {
      URL.revokeObjectURL(logoPreviewUrl)
    }
  }, [logoFile, logoPreviewUrl])


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

    const onError = (error: unknown) => {
      setFormError(applyServerErrors(form, error))
    }

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
    <form onSubmit={onSubmit} noValidate className="space-y-6">

      {formError ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.045] px-4 py-3.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-4" strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-destructive">
              Unable to save partner
            </p>

            <p className="mt-1 text-[11px] leading-5 text-destructive/80">
              {formError}
            </p>
          </div>
        </div>
      ) : null}


      <FormSection
        title="Partner Information"
        description="Manage the partner logo and the external website associated with this organization."
        icon={Handshake}
      >
        <div className="space-y-7">

          {/* =====================================================
              PARTNER LOGO
          ===================================================== */}

          <div className="space-y-4">

            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground">
                <ImageIcon className="size-4" strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-foreground">
                  Partner logo
                </p>

                <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                  {isEditing
                    ? 'Replace the logo only if the partner branding has changed.'
                    : 'Upload the logo that will represent this partner on the public website.'}
                </p>
              </div>
            </div>


            {/* Compact Logo Preview */}

            <div className="flex justify-start">

              <div className="group relative w-full max-w-[260px] overflow-hidden rounded-[18px] border border-border/70 bg-muted/[0.10] shadow-[0_1px_3px_rgba(0,0,0,0.025)]">

                {logoPreviewUrl ? (
                  <div className="relative flex h-[140px] items-center justify-center bg-background p-5">

                    <img
                      src={logoPreviewUrl}
                      alt="Partner logo preview"
                      className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                    />


                    {logoFile ? (
                      <button
                        type="button"
                        aria-label="Remove selected logo"
                        onClick={() => setLogoFile(null)}
                        className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-lg border border-border/70 bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}

                  </div>
                ) : (
                  <div className="flex h-[140px] flex-col items-center justify-center gap-2.5 px-5 text-center">

                    <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                      <ImageIcon className="size-[17px]" strokeWidth={1.7} />
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold text-foreground">
                        No logo selected
                      </p>

                      <p className="mt-1 text-[9px] text-muted-foreground">
                        Upload a logo to preview it here.
                      </p>
                    </div>

                  </div>
                )}

              </div>

            </div>


            {/* Upload Control */}

            <label
              htmlFor="partner-logo"
              className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/[0.08] px-4 py-4 transition-all hover:border-foreground/15 hover:bg-muted/[0.16]"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                <Upload className="size-4" strokeWidth={1.8} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-foreground">
                  {logoFile
                    ? logoFile.name
                    : isEditing
                      ? 'Choose replacement logo'
                      : 'Choose partner logo'}
                </p>

                <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                  JPEG, PNG, GIF or WebP. Transparent PNG or WebP is recommended for logos.
                </p>
              </div>

              <span className="hidden rounded-lg border border-border/70 bg-background px-3 py-1.5 text-[9px] font-semibold text-muted-foreground transition-colors group-hover:text-foreground sm:block">
                Browse
              </span>
            </label>


            <input
              id="partner-logo"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleLogoChange}
              className="sr-only"
            />


            {!isEditing ? (
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-destructive/70" />
                A logo is required when creating a partner.
              </div>
            ) : null}

          </div>


          {/* =====================================================
              WEBSITE
          ===================================================== */}

          <div className="border-t border-border/60 pt-6">

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">

              <div className="space-y-2">

                <Label
                  htmlFor="partner-website"
                  className="text-[12px] font-semibold"
                >
                  Website
                </Label>


                <div className="group relative">

                  <div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground/45 transition-colors group-focus-within:text-foreground">
                    <Link2 className="size-3.5" strokeWidth={1.8} />
                  </div>


                  <Input
                    id="partner-website"
                    type="url"
                    placeholder="https://example.com"
                    aria-invalid={!!form.formState.errors.website}
                    {...form.register('website')}
                    className="h-11 rounded-xl pl-12"
                  />

                </div>


                <FieldError
                  message={form.formState.errors.website?.message}
                />


                <p className="text-[10px] leading-5 text-muted-foreground">
                  Optional external link to the partner&apos;s official website.
                </p>

              </div>


              {/* Display behavior */}

              <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-muted/[0.08] p-4">

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-8 -top-10 size-24 rounded-full bg-primary/[0.035] blur-3xl"
                />


                <div className="relative flex items-start gap-3">

                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <ExternalLink className="size-4" strokeWidth={1.8} />
                  </div>


                  <div>
                    <span className="text-[9px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                      Display behavior
                    </span>

                    <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">
                      The logo is displayed in the public partners section. When a website is provided, visitors can open the partner&apos;s official external site.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </FormSection>


      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">

        <div className="hidden items-center gap-2 sm:flex">
          <Sparkles className="size-3.5 text-muted-foreground/45" strokeWidth={1.8} />

          <span className="text-[10px] text-muted-foreground">
            Review the partner logo and website information before saving.
          </span>
        </div>


        <FormActions
          onCancel={onCancel}
          submitLabel={isEditing ? 'Save changes' : 'Create partner'}
          isSubmitting={isSubmitting}
        />

      </div>


      {/* =====================================================
          UNSAVED CHANGES
      ===================================================== */}

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