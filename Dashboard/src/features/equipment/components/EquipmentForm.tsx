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
import { Switch } from '@/components/ui/switch'
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
  useCreateEquipmentMutation,
  useEquipmentCategoryOptionsQuery,
  useUpdateEquipmentMutation,
} from '@/features/equipment/queries'
import { equipmentSchema, type EquipmentInput } from '@/features/equipment/schema'
import type { Equipment } from '@/features/equipment/types'

interface EquipmentFormProps {
  /** Present when editing — absent means "create". */
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

/** Shared by EquipmentCreatePage and EquipmentEditPage. */
export function EquipmentForm({ equipment, onSuccess, onCancel }: EquipmentFormProps) {
  const isEditing = Boolean(equipment)
  const [formError, setFormError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
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
  const guard = useUnsavedChangesGuard(form.formState.isDirty || imageFile !== null)

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
        primarySpecification: { label: values.specLabel, value: values.specValue },
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
      { image: imageFile },
    )

    const onError = (error: unknown) => setFormError(applyServerErrors(form, error))

    if (isEditing && equipment) {
      updateMutation.mutate(
        { id: equipment._id, formData },
        {
          onSuccess: () => {
            toast.success('Equipment updated successfully')
            guard.bypassOnce()
            onSuccess()
          },
          onError,
        },
      )
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Equipment created successfully')
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

      <FormSection title="Equipment details">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eq-title">Title</Label>
          <Input
            id="eq-title"
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
          <Label htmlFor="eq-slug">Slug</Label>
          <Input
            id="eq-slug"
            aria-invalid={!!form.formState.errors.slug}
            {...form.register('slug')}
          />
          {form.formState.errors.slug ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.slug.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eq-category">Category</Label>
          <Select
            value={form.watch('category')}
            onValueChange={(value) =>
              form.setValue('category', value, { shouldValidate: true })
            }
          >
            <SelectTrigger
              id="eq-category"
              aria-invalid={!!form.formState.errors.category}
            >
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
          {form.formState.errors.category ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.category.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eq-short">Short description</Label>
          <Textarea
            id="eq-short"
            rows={2}
            aria-invalid={!!form.formState.errors.shortDescription}
            {...form.register('shortDescription')}
          />
          {form.formState.errors.shortDescription ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.shortDescription.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eq-description">Description</Label>
          <Textarea
            id="eq-description"
            rows={4}
            aria-invalid={!!form.formState.errors.description}
            {...form.register('description')}
          />
          {form.formState.errors.description ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.description.message}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="eq-spec-label">Specification label</Label>
            <Input
              id="eq-spec-label"
              placeholder="e.g. Engine Power"
              aria-invalid={!!form.formState.errors.specLabel}
              {...form.register('specLabel')}
            />
            {form.formState.errors.specLabel ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.specLabel.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="eq-spec-value">Specification value</Label>
            <Input
              id="eq-spec-value"
              placeholder="e.g. 250 HP"
              aria-invalid={!!form.formState.errors.specValue}
              {...form.register('specValue')}
            />
            {form.formState.errors.specValue ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.specValue.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eq-location">Location</Label>
          <Input
            id="eq-location"
            aria-invalid={!!form.formState.errors.location}
            {...form.register('location')}
          />
          {form.formState.errors.location ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.location.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eq-units">Available units</Label>
          <Input
            id="eq-units"
            type="number"
            min={0}
            max={99999}
            aria-invalid={!!form.formState.errors.availableUnits}
            {...form.register('availableUnits', { valueAsNumber: true })}
          />
          {form.formState.errors.availableUnits ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.availableUnits.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="eq-safety">Safety certificate available</Label>
            <Switch
              id="eq-safety"
              checked={safetyAvailable}
              onCheckedChange={(checked) => form.setValue('safetyAvailable', checked)}
            />
          </div>
          {safetyAvailable ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="eq-safety-message">Certificate message</Label>
              <Textarea
                id="eq-safety-message"
                rows={2}
                aria-invalid={!!form.formState.errors.safetyMessage}
                {...form.register('safetyMessage')}
              />
              {form.formState.errors.safetyMessage ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.safetyMessage.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eq-image">
            Image{isEditing ? ' (leave empty to keep current)' : ''}
          </Label>
          {equipment?.image.url ? (
            <img
              src={cloudinaryThumbnail(equipment.image.url, 96)}
              alt={equipment.image.alt}
              className="h-24 w-24 rounded-md border border-border object-cover"
            />
          ) : null}
          <input
            id="eq-image"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            aria-invalid={!!formError}
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eq-image-alt">Image alt text</Label>
          <Input id="eq-image-alt" {...form.register('imageAlt')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eq-order">Display order</Label>
          <Input
            id="eq-order"
            type="number"
            min={0}
            max={999}
            {...form.register('displayOrder', { valueAsNumber: true })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="eq-active">Active</Label>
          <Switch
            id="eq-active"
            checked={form.watch('isActive')}
            onCheckedChange={(checked) => form.setValue('isActive', checked)}
          />
        </div>
      </FormSection>

      <FormActions
        onCancel={onCancel}
        submitLabel={isEditing ? 'Save changes' : 'Create equipment'}
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
