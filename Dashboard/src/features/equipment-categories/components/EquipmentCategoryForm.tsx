import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { CircleAlert, Hash, Layers3, Link2 } from 'lucide-react'

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

export function EquipmentCategoryForm({
  category,
  onSuccess,
  onCancel,
}: EquipmentCategoryFormProps) {
  const isEditing = Boolean(category)

  const [formError, setFormError] = useState<string | null>(null)

  const createMutation = useCreateEquipmentCategoryMutation()
  const updateMutation = useUpdateEquipmentCategoryMutation()

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending

  const form = useForm<EquipmentCategoryInput>({
    resolver: zodResolver(equipmentCategorySchema),

    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          displayOrder: category.displayOrder,
          isActive: category.isActive,
        }
      : {
          name: '',
          slug: '',
          displayOrder: 0,
          isActive: true,
        },
  })

  const guard = useUnsavedChangesGuard(
    form.formState.isDirty,
  )

  const isActive = form.watch('isActive')

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)

    const onError = (error: unknown) => {
      setFormError(
        applyServerErrors(form, error),
      )
    }

    if (isEditing && category) {
      updateMutation.mutate(
        {
          id: category._id,
          payload: values,
        },
        {
          onSuccess: () => {
            toast.success(
              'Equipment category updated successfully',
            )

            guard.bypassOnce()
            onSuccess()
          },

          onError,
        },
      )

      return
    }

    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success(
          'Equipment category created successfully',
        )

        guard.bypassOnce()
        onSuccess()
      },

      onError,
    })
  })

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6"
    >
      {/* =====================================================
          Form Error
      ===================================================== */}

      {formError ? (
        <div
          role="alert"
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-destructive/20
            bg-destructive/[0.045]
            px-4
            py-3
            text-sm
            text-destructive
          "
        >
          <CircleAlert
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <p className="leading-5">
            {formError}
          </p>
        </div>
      ) : null}

      {/* =====================================================
          Category Details
      ===================================================== */}

      <FormSection title="Category details">
        <div className="space-y-6">
          {/* =================================================
              Primary Information
          ================================================= */}

          <div
            className="
              grid
              grid-cols-1
              gap-5
              lg:grid-cols-2
            "
          >
            {/* Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor="name"
                  className="text-[13px] font-medium"
                >
                  Category name
                </Label>

                <span className="text-[10px] font-medium text-muted-foreground/60">
                  Required
                </span>
              </div>

              <div className="relative">
                <Layers3
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    size-4
                    -translate-y-1/2
                    text-muted-foreground/50
                  "
                  strokeWidth={1.7}
                  aria-hidden="true"
                />

                <Input
                  id="name"
                  placeholder="e.g. Heavy Equipment"
                  aria-invalid={
                    !!form.formState.errors.name
                  }
                  {...form.register('name')}
                  className="
                    h-11
                    rounded-xl
                    pl-10
                  "
                />
              </div>

              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : (
                <p className="text-[11px] leading-4 text-muted-foreground">
                  The category name displayed across the dashboard and website.
                </p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor="slug"
                  className="text-[13px] font-medium"
                >
                  Slug
                </Label>

                <span className="text-[10px] font-medium text-muted-foreground/60">
                  URL identifier
                </span>
              </div>

              <div className="relative">
                <Link2
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    size-4
                    -translate-y-1/2
                    text-muted-foreground/50
                  "
                  strokeWidth={1.7}
                  aria-hidden="true"
                />

                <Input
                  id="slug"
                  placeholder="e.g. heavy-equipment"
                  aria-invalid={
                    !!form.formState.errors.slug
                  }
                  {...form.register('slug')}
                  className="
                    h-11
                    rounded-xl
                    pl-10
                    font-mono
                    text-[13px]
                  "
                />
              </div>

              {form.formState.errors.slug ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.slug.message}
                </p>
              ) : (
                <p className="text-[11px] leading-4 text-muted-foreground">
                  Used as a clean identifier in URLs and API responses.
                </p>
              )}
            </div>
          </div>

          {/* =================================================
              Configuration
          ================================================= */}

          <div
            className="
              grid
              grid-cols-1
              gap-5
              border-t
              border-border/60
              pt-5
              lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]
            "
          >
            {/* Display Order */}
            <div className="space-y-2">
              <Label
                htmlFor="displayOrder"
                className="text-[13px] font-medium"
              >
                Display order
              </Label>

              <div className="relative max-w-[220px]">
                <Hash
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    size-4
                    -translate-y-1/2
                    text-muted-foreground/50
                  "
                  strokeWidth={1.7}
                  aria-hidden="true"
                />

                <Input
                  id="displayOrder"
                  type="number"
                  min={0}
                  max={999}
                  aria-invalid={
                    !!form.formState.errors.displayOrder
                  }
                  {...form.register(
                    'displayOrder',
                    {
                      valueAsNumber: true,
                    },
                  )}
                  className="
                    h-11
                    rounded-xl
                    pl-10
                    tabular-nums
                  "
                />
              </div>

              {form.formState.errors.displayOrder ? (
                <p className="text-xs text-destructive">
                  {
                    form.formState.errors
                      .displayOrder.message
                  }
                </p>
              ) : (
                <p className="text-[11px] leading-4 text-muted-foreground">
                  Lower numbers appear first in ordered category lists.
                </p>
              )}
            </div>

            {/* Active Status */}
            <div
              className="
                flex
                items-center
                justify-between
                gap-5
                rounded-2xl
                border
                border-border/70
                bg-muted/[0.22]
                px-4
                py-3.5
              "
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      isActive
                        ? `
                            size-2
                            shrink-0
                            rounded-full
                            bg-success
                          `
                        : `
                            size-2
                            shrink-0
                            rounded-full
                            bg-muted-foreground/40
                          `
                    }
                  />

                  <Label
                    htmlFor="isActive"
                    className="cursor-pointer text-[13px] font-semibold"
                  >
                    Category status
                  </Label>
                </div>

                <p className="mt-1 pl-4 text-[11px] leading-4 text-muted-foreground">
                  {isActive
                    ? 'This category is currently visible and available.'
                    : 'This category is currently disabled.'}
                </p>
              </div>

              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) =>
                  form.setValue(
                    'isActive',
                    checked,
                    {
                      shouldDirty: true,
                    },
                  )
                }
                className="shrink-0"
              />
            </div>
          </div>
        </div>
      </FormSection>

      {/* =====================================================
          Actions
      ===================================================== */}

      <div
        className="
          border-t
          border-border/60
          pt-5
        "
      >
        <FormActions
          onCancel={onCancel}
          submitLabel={
            isEditing
              ? 'Save changes'
              : 'Create category'
          }
          isSubmitting={isSubmitting}
        />
      </div>

      {/* =====================================================
          Unsaved Changes
      ===================================================== */}

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
