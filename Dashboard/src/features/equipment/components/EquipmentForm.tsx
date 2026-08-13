import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AlertCircle, Boxes, CheckCircle2, FileCheck2, Hash, ImageIcon, Info, Layers3, Link2, MapPin, ShieldCheck, Tag, Truck, Upload, Wrench, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormActions } from '@/components/forms/FormActions'
import { FormSection } from '@/components/forms/FormSection'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/file-validation'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { useCreateEquipmentMutation, useEquipmentCategoryOptionsQuery, useUpdateEquipmentMutation } from '@/features/equipment/queries'
import { equipmentSchema, type EquipmentInput } from '@/features/equipment/schema'
import type { Equipment } from '@/features/equipment/types'


interface EquipmentFormProps {
  equipment?: Equipment | null
  onSuccess: () => void
  onCancel: () => void
}


const emptyDefaults: EquipmentInput = {
  title: '',
  slug: '',
  category: '',
  shortDescription: '',
  description: '',
  specLabel: '',
  specValue: '',
  location: '',
  availableUnits: 0,
  safetyAvailable: false,
  safetyMessage: '',
  displayOrder: 0,
  isActive: true,
  imageAlt: '',
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


export function EquipmentForm({ equipment, onSuccess, onCancel }: EquipmentFormProps) {
  const isEditing = Boolean(equipment)

  const [formError, setFormError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { data: categoryOptions } = useEquipmentCategoryOptionsQuery()

  const createMutation = useCreateEquipmentMutation()
  const updateMutation = useUpdateEquipmentMutation()

  const isSubmitting = createMutation.isPending || updateMutation.isPending


  const form = useForm<EquipmentInput>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: equipment
      ? {
          title: equipment.title,
          slug: equipment.slug,
          category: equipment.category._id,
          shortDescription: equipment.shortDescription,
          description: equipment.description,
          specLabel: equipment.primarySpecification.label,
          specValue: equipment.primarySpecification.value,
          location: equipment.location,
          availableUnits: equipment.availableUnits,
          safetyAvailable: equipment.safetyCertificate.isAvailable,
          safetyMessage: equipment.safetyCertificate.message,
          displayOrder: equipment.displayOrder,
          isActive: equipment.isActive,
          imageAlt: equipment.image.alt,
        }
      : emptyDefaults,
  })


  const safetyAvailable = form.watch('safetyAvailable')
  const isActive = form.watch('isActive')

  const guard = useUnsavedChangesGuard(form.formState.isDirty || imageFile !== null)


  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(imageFile)
    setImagePreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [imageFile])


  const currentImage = useMemo(() => {
    if (imagePreview) return imagePreview
    if (equipment?.image.url) return cloudinaryThumbnail(equipment.image.url, 900)
    return null
  }, [equipment, imagePreview])


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
      setFormError('Equipment image is required.')
      return
    }

    setFormError(null)

    const formData = buildFormData(
      {
        title: values.title,
        slug: values.slug,
        category: values.category,
        shortDescription: values.shortDescription,
        description: values.description,
        primarySpecification: {
          label: values.specLabel,
          value: values.specValue,
        },
        location: values.location,
        availableUnits: values.availableUnits,
        safetyCertificate: {
          isAvailable: values.safetyAvailable,
          message: values.safetyAvailable ? values.safetyMessage : '',
        },
        displayOrder: values.displayOrder,
        isActive: values.isActive,
        imageAlt: values.imageAlt,
      },
      {
        image: imageFile,
      },
    )

    const onError = (error: unknown) => {
      setFormError(applyServerErrors(form, error))
    }

    if (isEditing && equipment) {
      updateMutation.mutate(
        {
          id: equipment._id,
          formData,
        },
        {
          onSuccess: () => {
            toast.success('Equipment updated successfully')
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
        toast.success('Equipment created successfully')
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
              Unable to save equipment
            </p>

            <p className="mt-1 text-[11px] leading-5 text-destructive/80">
              {formError}
            </p>
          </div>
        </div>
      ) : null}


      {/* =====================================================
          BASIC INFORMATION
      ===================================================== */}

      <FormSection
        title="Basic Information"
        description="Core identity and descriptive information for this equipment."
        icon={Truck}
      >
        <div className="space-y-6">

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="eq-title" className="text-[12px] font-semibold">
                  Equipment title
                </Label>

                <span className="rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                  Required
                </span>
              </div>

              <div className="group relative">
                <div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground/45 transition-colors group-focus-within:text-foreground">
                  <Tag className="size-3.5" strokeWidth={1.8} />
                </div>

                <Input
                  id="eq-title"
                  placeholder="e.g. CAT 320 Excavator"
                  aria-invalid={!!form.formState.errors.title}
                  {...form.register('title')}
                  className="h-11 rounded-xl pl-12"
                />
              </div>

              <FieldError message={form.formState.errors.title?.message} />
            </div>


            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="eq-slug" className="text-[12px] font-semibold">
                  Slug
                </Label>

                <span className="rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                  URL
                </span>
              </div>

              <div className="group relative">
                <div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground/45 transition-colors group-focus-within:text-foreground">
                  <Link2 className="size-3.5" strokeWidth={1.8} />
                </div>

                <Input
                  id="eq-slug"
                  placeholder="e.g. cat-320-excavator"
                  aria-invalid={!!form.formState.errors.slug}
                  {...form.register('slug')}
                  className="h-11 rounded-xl pl-12 font-mono text-[12px]"
                />
              </div>

              <FieldError message={form.formState.errors.slug?.message} />
            </div>

          </div>


          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            <div className="space-y-2">
              <Label htmlFor="eq-category" className="text-[12px] font-semibold">
                Category
              </Label>

              <Select
                value={form.watch('category')}
                onValueChange={(value) => form.setValue('category', value, { shouldValidate: true, shouldDirty: true })}
              >
                <SelectTrigger id="eq-category" aria-invalid={!!form.formState.errors.category} className="h-11 w-full rounded-xl">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>

                <SelectContent>
                  {(categoryOptions ?? []).map((option) => (
                    <SelectItem key={option._id} value={option._id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <FieldError message={form.formState.errors.category?.message} />
            </div>


            <div className="space-y-2">
              <Label htmlFor="eq-location" className="text-[12px] font-semibold">
                Location
              </Label>

              <div className="group relative">
                <div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground/45 transition-colors group-focus-within:text-foreground">
                  <MapPin className="size-3.5" strokeWidth={1.8} />
                </div>

                <Input
                  id="eq-location"
                  placeholder="e.g. Basra"
                  aria-invalid={!!form.formState.errors.location}
                  {...form.register('location')}
                  className="h-11 rounded-xl pl-12"
                />
              </div>

              <FieldError message={form.formState.errors.location?.message} />
            </div>

          </div>


          <div className="space-y-2">
            <Label htmlFor="eq-short" className="text-[12px] font-semibold">
              Short description
            </Label>

            <Textarea
              id="eq-short"
              rows={2}
              placeholder="A concise description shown in equipment cards and previews."
              aria-invalid={!!form.formState.errors.shortDescription}
              {...form.register('shortDescription')}
              className="min-h-[82px] resize-none rounded-xl"
            />

            <FieldError message={form.formState.errors.shortDescription?.message} />
          </div>


          <div className="space-y-2">
            <Label htmlFor="eq-description" className="text-[12px] font-semibold">
              Full description
            </Label>

            <Textarea
              id="eq-description"
              rows={5}
              placeholder="Describe the equipment, its capabilities, applications, and relevant details."
              aria-invalid={!!form.formState.errors.description}
              {...form.register('description')}
              className="min-h-[140px] resize-y rounded-xl"
            />

            <FieldError message={form.formState.errors.description?.message} />
          </div>

        </div>
      </FormSection>


      {/* =====================================================
          SPECIFICATION & SAFETY
      ===================================================== */}

      <FormSection
        title="Specification & Safety"
        description="Operational specifications and safety certification information."
        icon={Wrench}
      >
        <div className="space-y-6">

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            <div className="space-y-2">
              <Label htmlFor="eq-spec-label" className="text-[12px] font-semibold">
                Specification label
              </Label>

              <Input
                id="eq-spec-label"
                placeholder="e.g. Engine Power"
                aria-invalid={!!form.formState.errors.specLabel}
                {...form.register('specLabel')}
                className="h-11 rounded-xl"
              />

              <FieldError message={form.formState.errors.specLabel?.message} />
            </div>


            <div className="space-y-2">
              <Label htmlFor="eq-spec-value" className="text-[12px] font-semibold">
                Specification value
              </Label>

              <Input
                id="eq-spec-value"
                placeholder="e.g. 250 HP"
                aria-invalid={!!form.formState.errors.specValue}
                {...form.register('specValue')}
                className="h-11 rounded-xl"
              />

              <FieldError message={form.formState.errors.specValue?.message} />
            </div>

          </div>


          <div className={`overflow-hidden rounded-2xl border transition-colors ${safetyAvailable ? 'border-success/20 bg-success/[0.025]' : 'border-border/70 bg-muted/[0.10]'}`}>

            <div className="flex items-center justify-between gap-5 px-4 py-4">

              <div className="flex items-start gap-3">

                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${safetyAvailable ? 'border-success/15 bg-success-subtle text-success' : 'border-border/70 bg-background text-muted-foreground'}`}>
                  <ShieldCheck className="size-[17px]" strokeWidth={1.8} />
                </div>

                <div>
                  <Label htmlFor="eq-safety" className="cursor-pointer text-[12px] font-semibold">
                    Safety certificate
                  </Label>

                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                    {safetyAvailable
                      ? 'A valid safety certificate is available for this equipment.'
                      : 'Enable this option when a valid certificate is available.'}
                  </p>
                </div>

              </div>


              <Switch
                id="eq-safety"
                checked={safetyAvailable}
                onCheckedChange={(checked) => form.setValue('safetyAvailable', checked, { shouldDirty: true })}
              />

            </div>


            {safetyAvailable ? (
              <div className="border-t border-border/60 bg-background/40 px-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="eq-safety-message" className="text-[12px] font-semibold">
                    Certificate message
                  </Label>

                  <Textarea
                    id="eq-safety-message"
                    rows={3}
                    placeholder="Add relevant safety or certification information."
                    aria-invalid={!!form.formState.errors.safetyMessage}
                    {...form.register('safetyMessage')}
                    className="min-h-[90px] resize-none rounded-xl bg-background"
                  />

                  <FieldError message={form.formState.errors.safetyMessage?.message} />
                </div>
              </div>
            ) : null}

          </div>

        </div>
      </FormSection>


      {/* =====================================================
          AVAILABILITY & VISIBILITY
      ===================================================== */}

      <FormSection
        title="Availability & Visibility"
        description="Control inventory quantities, catalog ordering, and public visibility."
        icon={Layers3}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          <div className="rounded-2xl border border-border/70 bg-muted/[0.10] p-4">

            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                <Boxes className="size-4" strokeWidth={1.8} />
              </div>

              <div>
                <Label htmlFor="eq-units" className="text-[12px] font-semibold">
                  Available units
                </Label>

                <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                  Current quantity available.
                </p>
              </div>
            </div>


            <Input
              id="eq-units"
              type="number"
              min={0}
              max={99999}
              aria-invalid={!!form.formState.errors.availableUnits}
              {...form.register('availableUnits', { valueAsNumber: true })}
              className="mt-4 h-11 rounded-xl text-center text-base font-semibold tabular-nums"
            />

            <FieldError message={form.formState.errors.availableUnits?.message} />

          </div>


          <div className="rounded-2xl border border-border/70 bg-muted/[0.10] p-4">

            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                <Hash className="size-4" strokeWidth={1.8} />
              </div>

              <div>
                <Label htmlFor="eq-order" className="text-[12px] font-semibold">
                  Display order
                </Label>

                <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                  Lower numbers appear earlier.
                </p>
              </div>
            </div>


            <Input
              id="eq-order"
              type="number"
              min={0}
              max={999}
              {...form.register('displayOrder', { valueAsNumber: true })}
              className="mt-4 h-11 rounded-xl text-center text-base font-semibold tabular-nums"
            />

          </div>


          <div className={`rounded-2xl border p-4 transition-colors ${isActive ? 'border-success/20 bg-success/[0.035]' : 'border-border/70 bg-muted/[0.10]'}`}>

            <div className="flex h-full flex-col justify-between gap-5">

              <div className="flex items-start gap-3">

                <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${isActive ? 'border-success/15 bg-success-subtle text-success' : 'border-border/70 bg-background text-muted-foreground'}`}>
                  {isActive ? (
                    <CheckCircle2 className="size-4" strokeWidth={1.8} />
                  ) : (
                    <FileCheck2 className="size-4" strokeWidth={1.8} />
                  )}
                </div>

                <div>
                  <Label htmlFor="eq-active" className="cursor-pointer text-[12px] font-semibold">
                    Catalog visibility
                  </Label>

                  <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                    {isActive
                      ? 'Visible on the public equipment catalog.'
                      : 'Hidden from the public equipment catalog.'}
                  </p>
                </div>

              </div>


              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2.5">

                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${isActive ? 'bg-success' : 'bg-muted-foreground/35'}`} />

                  <span className="text-[10px] font-semibold text-foreground">
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <Switch
                  id="eq-active"
                  checked={isActive}
                  onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true })}
                />

              </div>

            </div>

          </div>

        </div>
      </FormSection>


      {/* =====================================================
          EQUIPMENT MEDIA
      ===================================================== */}

      <FormSection
        title="Equipment Image"
        description="Upload the primary image displayed throughout the equipment catalog."
        icon={ImageIcon}
      >
        <div className="space-y-5">

          <div className="relative aspect-[16/7] overflow-hidden rounded-[20px] border border-border/70 bg-muted/25">

            {currentImage ? (
              <img
                src={currentImage}
                alt={form.watch('imageAlt') || equipment?.image.alt || 'Equipment preview'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-muted-foreground/45">

                <div className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-background/60">
                  <ImageIcon className="size-5" strokeWidth={1.6} />
                </div>

                <div className="text-center">
                  <p className="text-[11px] font-medium">
                    No image selected
                  </p>

                  <p className="mt-1 text-[10px]">
                    JPEG, PNG, GIF or WebP
                  </p>
                </div>

              </div>
            )}


            {imageFile ? (
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-black/40 px-3 py-2 backdrop-blur-md">

                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium text-white">
                    {imageFile.name}
                  </p>

                  <p className="mt-0.5 text-[9px] text-white/55">
                    New image selected
                  </p>
                </div>


                <button
                  type="button"
                  aria-label="Remove selected image"
                  onClick={() => setImageFile(null)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white/65 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="size-3.5" />
                </button>

              </div>
            ) : null}

          </div>


          {isEditing && !imageFile ? (
            <p className="text-[10px] leading-4 text-muted-foreground">
              The current image will remain unchanged unless you select a replacement.
            </p>
          ) : null}


          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            <div className="space-y-2">

              <Label htmlFor="eq-image" className="text-[12px] font-semibold">
                {isEditing ? 'Replace image' : 'Equipment image'}
              </Label>

              <label
                htmlFor="eq-image"
                className="group flex min-h-[116px] cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/[0.10] px-4 py-4 transition-all hover:border-foreground/15 hover:bg-muted/25"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                  <Upload className="size-4" strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-foreground">
                    Choose image
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                    JPEG, PNG, GIF or WebP. Select a high-quality catalog image.
                  </p>
                </div>

                <span className="hidden rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground sm:block">
                  Browse
                </span>
              </label>


              <input
                id="eq-image"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                aria-invalid={!!formError}
                onChange={handleImageChange}
                className="sr-only"
              />

            </div>


            <div className="space-y-2">
              <Label htmlFor="eq-image-alt" className="text-[12px] font-semibold">
                Image alt text
              </Label>

              <div className="rounded-2xl border border-border/70 bg-muted/[0.10] p-4">

                <div className="mb-3 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <ImageIcon className="size-4" strokeWidth={1.8} />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      Accessibility description
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                      Describe the visible content of the image.
                    </p>
                  </div>
                </div>

                <Input
                  id="eq-image-alt"
                  placeholder="e.g. CAT 320 excavator at project site"
                  {...form.register('imageAlt')}
                  className="h-11 rounded-xl bg-background"
                />

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
          <Info className="size-3.5 text-muted-foreground/45" strokeWidth={1.8} />

          <span className="text-[10px] text-muted-foreground">
            Review all equipment information before saving.
          </span>
        </div>


        <FormActions
          onCancel={onCancel}
          submitLabel={isEditing ? 'Save changes' : 'Create equipment'}
          isSubmitting={isSubmitting}
        />

      </div>


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