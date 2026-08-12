import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ImagePlus, UserRound } from 'lucide-react'

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

import { useCreateTeamMemberMutation, useUpdateTeamMemberMutation } from '@/features/team-members/queries'
import { teamMemberSchema, type TeamMemberInput } from '@/features/team-members/schema'
import type { TeamMember } from '@/features/team-members/types'

interface TeamMemberFormProps {
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
      {
        image: imageFile,
      },
    )

    const onError = (error: unknown) => setFormError(applyServerErrors(form, error))

    if (isEditing && teamMember) {
      updateMutation.mutate(
        {
          id: teamMember._id,
          formData,
        },
        {
          onSuccess: () => {
            toast.success('Team member updated successfully')
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
        toast.success('Team member created successfully')
        guard.bypassOnce()
        onSuccess()
      },
      onError,
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError ? <div className="rounded-xl border border-destructive/20 bg-destructive-subtle px-4 py-3 text-sm font-medium text-destructive">{formError}</div> : null}

      <div className="flex items-start gap-3 rounded-[18px] border border-border/70 bg-card px-5 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground">
          <UserRound className="size-4" strokeWidth={1.8} />
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-[-0.015em] text-foreground">{isEditing ? 'Update team member' : 'Create team member'}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Add the member profile, role, experience and public display settings.</p>
        </div>
      </div>

      <FormSection title="Profile Information">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <Label htmlFor="tm-fullName">Full name</Label>
            <Input id="tm-fullName" placeholder="Enter team member name" className="h-11" aria-invalid={!!form.formState.errors.fullName} {...form.register('fullName')} />
            {form.formState.errors.fullName ? <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tm-position">Position</Label>
            <Input id="tm-position" placeholder="e.g. Operations Manager" className="h-11" aria-invalid={!!form.formState.errors.position} {...form.register('position')} />
            {form.formState.errors.position ? <p className="text-xs text-destructive">{form.formState.errors.position.message}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tm-experience">Experience</Label>
            <Input id="tm-experience" placeholder="e.g. 8+ years" className="h-11" aria-invalid={!!form.formState.errors.experience} {...form.register('experience')} />
            {form.formState.errors.experience ? <p className="text-xs text-destructive">{form.formState.errors.experience.message}</p> : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Profile Photo">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-[18px] border border-border/70 bg-muted/[0.12]">
            {imageFile ? (
              <img src={URL.createObjectURL(imageFile)} alt="Selected team member preview" className="aspect-[4/3] h-full w-full object-cover" />
            ) : teamMember?.image?.url ? (
              <img src={cloudinaryThumbnail(teamMember.image.url, 720)} alt={teamMember.fullName} className="aspect-[4/3] h-full w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
                <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background">
                  <ImagePlus className="size-4" strokeWidth={1.8} />
                </div>

                <p className="text-xs font-medium">No photo selected</p>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div>
              <Label htmlFor="tm-image">{isEditing ? 'Replace photo' : 'Upload photo'}</Label>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{isEditing ? 'Leave empty to keep the current profile photo.' : 'Upload the profile image displayed on the public About page.'}</p>
            </div>

            <input
              id="tm-image"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
            />

            <div className="rounded-xl border border-border/60 bg-muted/[0.12] px-3.5 py-3">
              <p className="text-[10px] leading-5 text-muted-foreground">Recommended: clear portrait image with the subject centered. Supported formats: JPEG, PNG, GIF and WebP.</p>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Display Settings">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tm-order">Display order</Label>
            <Input id="tm-order" type="number" min={0} max={999} className="h-11" aria-invalid={!!form.formState.errors.displayOrder} {...form.register('displayOrder', { valueAsNumber: true })} />
            {form.formState.errors.displayOrder ? <p className="text-xs text-destructive">{form.formState.errors.displayOrder.message}</p> : null}
            <p className="text-[11px] leading-5 text-muted-foreground">Lower values appear first on the public website.</p>
          </div>

          <div className="flex items-center justify-between rounded-[16px] border border-border/70 bg-muted/[0.12] px-4 py-4">
            <div className="pr-6">
              <Label htmlFor="tm-active">Public visibility</Label>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">When active, this member is visible in the public team section.</p>
            </div>

            <Switch id="tm-active" checked={form.watch('isActive')} onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true, shouldValidate: true })} />
          </div>
        </div>
      </FormSection>

      <div className="border-t border-border/60 pt-5">
        <FormActions onCancel={onCancel} submitLabel={isEditing ? 'Save changes' : 'Create team member'} isSubmitting={isSubmitting} />
      </div>

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
