import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Activity, CircleAlert, FolderCog, Hash, Layers3, Link2, Power } from 'lucide-react'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormSection } from '@/components/forms/FormSection'
import { FormActions } from '@/components/forms/FormActions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { applyServerErrors } from '@/lib/form-errors'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { useCreateEquipmentCategoryMutation, useUpdateEquipmentCategoryMutation } from '@/features/equipment-categories/queries'
import { equipmentCategorySchema, type EquipmentCategoryInput } from '@/features/equipment-categories/schema'
import type { EquipmentCategory } from '@/features/equipment-categories/types'


interface EquipmentCategoryFormProps {
  category?: EquipmentCategory | null
  onSuccess: () => void
  onCancel: () => void
}


export function EquipmentCategoryForm({ category, onSuccess, onCancel }: EquipmentCategoryFormProps) {
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
      : {
          name: '',
          slug: '',
          displayOrder: 0,
          isActive: true,
        },
  })

  const guard = useUnsavedChangesGuard(form.formState.isDirty)
  const isActive = form.watch('isActive')


  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)

    const onError = (error: unknown) => {
      setFormError(applyServerErrors(form, error))
    }

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

      return
    }

    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Equipment category created successfully')
        guard.bypassOnce()
        onSuccess()
      },
      onError,
    })
  })


  return (
    <form onSubmit={onSubmit} className="space-y-6">

      {formError ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.045] px-4 py-3.5 text-destructive">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <CircleAlert className="size-4" strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <p className="text-[12px] font-semibold">Unable to save category</p>
            <p className="mt-1 text-[11px] leading-5 text-destructive/80">{formError}</p>
          </div>
        </div>
      ) : null}


      <FormSection title="Category Details" description="Define the category identity, ordering, and availability." icon={FolderCog}>
        <div className="space-y-7">

          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground">
                <Layers3 className="size-3.5" strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-foreground">Identity</p>
                <p className="mt-0.5 text-[9px] text-muted-foreground">Define how this category is named and identified.</p>
              </div>
            </div>


            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="name" className="text-[12px] font-semibold">
                    Category name
                  </Label>

                  <span className="rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                    Required
                  </span>
                </div>

                <div className="group relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/45 transition-colors group-focus-within:text-foreground">
                    <Layers3 className="size-3.5" strokeWidth={1.8} />
                  </div>

                  <Input id="name" placeholder="e.g. Heavy Equipment" aria-invalid={!!form.formState.errors.name} {...form.register('name')} className="h-12 rounded-xl pl-12" />
                </div>

                {form.formState.errors.name ? (
                  <p className="flex items-center gap-1.5 text-[10px] font-medium text-destructive">
                    <CircleAlert className="size-3 shrink-0" />
                    {form.formState.errors.name.message}
                  </p>
                ) : (
                  <p className="text-[10px] leading-4 text-muted-foreground">Displayed across the dashboard and public website.</p>
                )}
              </div>


              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="slug" className="text-[12px] font-semibold">
                    Slug
                  </Label>

                  <span className="rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                    URL
                  </span>
                </div>

                <div className="group relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/45 transition-colors group-focus-within:text-foreground">
                    <Link2 className="size-3.5" strokeWidth={1.8} />
                  </div>

                  <Input id="slug" placeholder="e.g. heavy-equipment" aria-invalid={!!form.formState.errors.slug} {...form.register('slug')} className="h-12 rounded-xl pl-12 font-mono text-[13px]" />
                </div>

                {form.formState.errors.slug ? (
                  <p className="flex items-center gap-1.5 text-[10px] font-medium text-destructive">
                    <CircleAlert className="size-3 shrink-0" />
                    {form.formState.errors.slug.message}
                  </p>
                ) : (
                  <p className="text-[10px] leading-4 text-muted-foreground">Used as a clean identifier in URLs and API responses.</p>
                )}
              </div>

            </div>
          </div>


          <div className="border-t border-border/60 pt-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground">
                <Activity className="size-3.5" strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-foreground">Configuration</p>
                <p className="mt-0.5 text-[9px] text-muted-foreground">Control ordering and availability.</p>
              </div>
            </div>


            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div className="rounded-2xl border border-border/70 bg-muted/[0.10] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <Hash className="size-4" strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0">
                    <Label htmlFor="displayOrder" className="text-[12px] font-semibold">
                      Display order
                    </Label>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Lower numbers appear first in the list.</p>
                  </div>
                </div>

                <Input id="displayOrder" type="number" min={0} max={999} aria-invalid={!!form.formState.errors.displayOrder} {...form.register('displayOrder', { valueAsNumber: true })} className="mt-4 h-11 rounded-xl text-center text-base font-semibold tabular-nums" />

                {form.formState.errors.displayOrder ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-destructive">
                    <CircleAlert className="size-3 shrink-0" />
                    {form.formState.errors.displayOrder.message}
                  </p>
                ) : null}
              </div>


              <div className={`rounded-2xl border p-4 transition-colors ${isActive ? 'border-success/20 bg-success/[0.035]' : 'border-border/70 bg-muted/[0.10]'}`}>
                <div className="flex h-full flex-col justify-between gap-5">

                  <div className="flex items-start gap-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${isActive ? 'border-success/15 bg-success-subtle text-success' : 'border-border/70 bg-background text-muted-foreground'}`}>
                      <Power className="size-4" strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0">
                      <Label htmlFor="isActive" className="cursor-pointer text-[12px] font-semibold">
                        Category status
                      </Label>

                      <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                        {isActive ? 'Visible and available across the system.' : 'Hidden and unavailable across the system.'}
                      </p>
                    </div>
                  </div>


                  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${isActive ? 'bg-success' : 'bg-muted-foreground/35'}`} />
                      <span className="text-[10px] font-semibold text-foreground">{isActive ? 'Active' : 'Inactive'}</span>
                    </div>

                    <Switch id="isActive" checked={isActive} onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true })} />
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
      </FormSection>


      <div className="border-t border-border/60 pt-5">
        <FormActions onCancel={onCancel} submitLabel={isEditing ? 'Save changes' : 'Create category'} isSubmitting={isSubmitting} />
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