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
import { buildFormData } from '@/lib/form-data'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/file-validation'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import {
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
} from '@/features/team-members/queries'
import { teamMemberSchema, type TeamMemberInput } from '@/features/team-members/schema'
import type { TeamMember } from '@/features/team-members/types'

interface TeamMemberFormProps {
  /** Present when editing — absent means "create". */
  teamMember?: TeamMember | null
  onSuccess: () => void
  onCancel: () => void
}

const emptyDefaults: TeamMemberInput = {
  fullName: '',
  position: '',
  experience: '',
  displayOrder: 0,
  isActive: true,
}

/** Shared by TeamMemberCreatePage and TeamMemberEditPage. */
export function TeamMemberForm({ teamMember, onSuccess, onCancel }: TeamMemberFormProps) {
  const isEditing = Boolean(teamMember)
  const [formError, setFormError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const createMutation = useCreateTeamMemberMutation()
  const updateMutation = useUpdateTeamMemberMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<TeamMemberInput>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: teamMember
      ? {
          fullName: teamMember.fullName,
          position: teamMember.position,
          experience: teamMember.experience,
          displayOrder: teamMember.displayOrder,
          isActive: teamMember.isActive,
        }
      : emptyDefaults,
  })

  const guard = useUnsavedChangesGuard(form.formState.isDirty || imageFile !== null)

  const onSubmit = form.handleSubmit((values) => {
    if (!isEditing && !imageFile) {
      setFormError('Team member photo is required.')
      return
    }
    setFormError(null)

    const formData = buildFormData(
      {
        fullName: values.fullName,
        position: values.position,
        experience: values.experience,
        displayOrder: values.displayOrder,
        isActive: values.isActive,
      },
      { image: imageFile },
    )

    const onError = (error: unknown) => setFormError(applyServerErrors(form, error))

    if (isEditing && teamMember) {
      updateMutation.mutate(
        { id: teamMember._id, formData },
        {
          onSuccess: () => {
            toast.success('Team member updated successfully')
            guard.bypassOnce()
            onSuccess()
          },
          onError,
        },
      )
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Team member created successfully')
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

      <FormSection title="Team member details">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tm-fullName">Full name</Label>
          <Input
            id="tm-fullName"
            aria-invalid={!!form.formState.errors.fullName}
            {...form.register('fullName')}
          />
          {form.formState.errors.fullName ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.fullName.message}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tm-position">Position</Label>
            <Input
              id="tm-position"
              aria-invalid={!!form.formState.errors.position}
              {...form.register('position')}
            />
            {form.formState.errors.position ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.position.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tm-experience">Experience</Label>
            <Input
              id="tm-experience"
              placeholder="e.g. 8+ years"
              aria-invalid={!!form.formState.errors.experience}
              {...form.register('experience')}
            />
            {form.formState.errors.experience ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.experience.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tm-image">
            Photo{isEditing ? ' (leave empty to keep current)' : ''}
          </Label>
          {teamMember?.image.url ? (
            <img
              src={cloudinaryThumbnail(teamMember.image.url, 96)}
              alt={teamMember.fullName}
              className="h-24 w-24 rounded-md border border-border object-cover"
            />
          ) : null}
          <input
            id="tm-image"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
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
          <Label htmlFor="tm-order">Display order</Label>
          <Input
            id="tm-order"
            type="number"
            min={0}
            max={999}
            {...form.register('displayOrder', { valueAsNumber: true })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="tm-active">Active</Label>
          <Switch
            id="tm-active"
            checked={form.watch('isActive')}
            onCheckedChange={(checked) => form.setValue('isActive', checked)}
          />
        </div>
      </FormSection>

      <FormActions
        onCancel={onCancel}
        submitLabel={isEditing ? 'Save changes' : 'Create team member'}
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
