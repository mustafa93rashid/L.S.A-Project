import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormSection } from '@/components/forms/FormSection'
import { FormActions } from '@/components/forms/FormActions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { applyServerErrors } from '@/lib/form-errors'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import {
  useCreateEquipmentCategoryMutation,
  useUpdateEquipmentCategoryMutation,
} from '@/features/equipment-categories/queries'
import {
  equipmentCategorySchema,
  type EquipmentCategoryInput,
} from '@/features/equipment-categories/schema'
import type { EquipmentCategory } from '@/features/equipment-categories/types'

interface EquipmentCategoryFormProps {
  /** Present when editing — absent means "create". */
  category?: EquipmentCategory | null
  onSuccess: () => void
  onCancel: () => void
}

/** Shared by EquipmentCategoryCreatePage and EquipmentCategoryEditPage —
 * all fields, validation and mutation wiring live here exactly once. */
export function EquipmentCategoryForm({
  category,
  onSuccess,
  onCancel,
}: EquipmentCategoryFormProps) {
  const isEditing = Boolean(category)
  const [formError, setFormError] = useState<string | null>(null)
  const createMutation = useCreateEquipmentCategoryMutation()
  const updateMutation = useUpdateEquipmentCategoryMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<EquipmentCategoryInput>({
    resolver: zodResolver(equipmentCategorySchema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          displayOrder: category.displayOrder,
          isActive: category.isActive,
        }
      : { name: '', slug: '', displayOrder: 0, isActive: true },
  })

  const guard = useUnsavedChangesGuard(form.formState.isDirty)

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    const onError = (error: unknown) => setFormError(applyServerErrors(form, error))

    if (isEditing && category) {
      updateMutation.mutate(
        { id: category._id, payload: values },
        {
          onSuccess: () => {
            toast.success('Equipment category updated successfully')
            guard.bypassOnce()
            onSuccess()
          },
          onError,
        },
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Equipment category created successfully')
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

      <FormSection title="Category details">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            aria-invalid={!!form.formState.errors.name}
            {...form.register('name')}
          />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            placeholder="e.g. excavators"
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
          <Label htmlFor="displayOrder">Display order</Label>
          <Input
            id="displayOrder"
            type="number"
            min={0}
            max={999}
            aria-invalid={!!form.formState.errors.displayOrder}
            {...form.register('displayOrder', { valueAsNumber: true })}
          />
          {form.formState.errors.displayOrder ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.displayOrder.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="isActive">Active</Label>
          <Switch
            id="isActive"
            checked={form.watch('isActive')}
            onCheckedChange={(checked) => form.setValue('isActive', checked)}
          />
        </div>
      </FormSection>

      <FormActions
        onCancel={onCancel}
        submitLabel={isEditing ? 'Save changes' : 'Create category'}
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
