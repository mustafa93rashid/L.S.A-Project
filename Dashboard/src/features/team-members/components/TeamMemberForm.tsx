import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AlertCircle, BriefcaseBusiness, CheckCircle2, EyeOff, Hash, ImagePlus, Sparkles, Upload, UserRound, X } from 'lucide-react'
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


function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="flex items-center gap-1.5 text-[10px] font-medium text-destructive">
      <AlertCircle className="size-3 shrink-0" strokeWidth={1.8} />
      {message}
    </p>
  )
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

  const isActive = form.watch('isActive') ?? true
  const guard = useUnsavedChangesGuard(form.formState.isDirty || imageFile !== null)


  const imagePreviewUrl = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile)
    if (teamMember?.image?.url) return cloudinaryThumbnail(teamMember.image.url, 720)
    return null
  }, [imageFile, teamMember?.image?.url])


  useEffect(() => {
    if (!imageFile || !imagePreviewUrl) return

    return () => {
      URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imageFile, imagePreviewUrl])


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

    const onError = (error: unknown) => {
      setFormError(applyServerErrors(form, error))
    }

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
    <form onSubmit={onSubmit} noValidate className="space-y-6">

      {formError ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.045] px-4 py-3.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-4" strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-destructive">Unable to save team member</p>
            <p className="mt-1 text-[11px] leading-5 text-destructive/80">{formError}</p>
          </div>
        </div>
      ) : null}


      <FormSection title="Profile Information" description="Add the team member's identity, role, and professional experience." icon={UserRound}>
        <div className="space-y-5">

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="tm-fullName" className="text-[12px] font-semibold">Full name</Label>

              <span className="rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                Required
              </span>
            </div>

            <div className="group relative">
              <div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground/45 transition-colors group-focus-within:text-foreground">
                <UserRound className="size-3.5" strokeWidth={1.8} />
              </div>

              <Input id="tm-fullName" placeholder="Enter team member name" aria-invalid={!!form.formState.errors.fullName} {...form.register('fullName')} className="h-11 rounded-xl pl-12" />
            </div>

            <FieldError message={form.formState.errors.fullName?.message} />
          </div>


          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            <div className="space-y-2">
              <Label htmlFor="tm-position" className="text-[12px] font-semibold">Position</Label>

              <div className="group relative">
                <div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground/45 transition-colors group-focus-within:text-foreground">
                  <BriefcaseBusiness className="size-3.5" strokeWidth={1.8} />
                </div>

                <Input id="tm-position" placeholder="e.g. Operations Manager" aria-invalid={!!form.formState.errors.position} {...form.register('position')} className="h-11 rounded-xl pl-12" />
              </div>

              <FieldError message={form.formState.errors.position?.message} />
            </div>


            <div className="space-y-2">
              <Label htmlFor="tm-experience" className="text-[12px] font-semibold">Experience</Label>

              <div className="group relative">
                <div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground/45 transition-colors group-focus-within:text-foreground">
                  <Sparkles className="size-3.5" strokeWidth={1.8} />
                </div>

                <Input id="tm-experience" placeholder="e.g. 8+ years" aria-invalid={!!form.formState.errors.experience} {...form.register('experience')} className="h-11 rounded-xl pl-12" />
              </div>

              <FieldError message={form.formState.errors.experience?.message} />
            </div>

          </div>

        </div>
      </FormSection>


      <FormSection title="Profile Photo" description="Upload the portrait displayed for this team member on the public website." icon={ImagePlus}>
        <div className="space-y-5">

          <div className="flex justify-start">
            <div className="group relative w-full max-w-[280px] overflow-hidden rounded-[20px] border border-border/70 bg-muted/[0.10] shadow-[0_1px_3px_rgba(0,0,0,0.025)]">

              {imagePreviewUrl ? (
                <div className="relative h-[220px] overflow-hidden bg-background">
                  <img src={imagePreviewUrl} alt={imageFile ? 'Selected team member preview' : teamMember?.fullName ?? 'Team member'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]" />

                  {imageFile ? (
                    <button type="button" aria-label="Remove selected image" onClick={() => setImageFile(null)} className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-lg border border-white/20 bg-black/35 text-white/80 backdrop-blur transition-colors hover:bg-black/50 hover:text-white">
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-[220px] flex-col items-center justify-center gap-3 px-5 text-center">
                  <div className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <ImagePlus className="size-[18px]" strokeWidth={1.8} />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-foreground">No photo selected</p>
                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Upload a portrait to preview it here.</p>
                  </div>
                </div>
              )}

            </div>
          </div>


          <label htmlFor="tm-image" className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/[0.08] px-4 py-4 transition-all hover:border-foreground/15 hover:bg-muted/[0.16]">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors group-hover:text-foreground">
              <Upload className="size-4" strokeWidth={1.8} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-foreground">{imageFile ? imageFile.name : isEditing ? 'Choose replacement photo' : 'Choose profile photo'}</p>
              <p className="mt-1 text-[9px] leading-4 text-muted-foreground">JPEG, PNG, GIF or WebP. Use a clear portrait with the subject centered.</p>
            </div>

            <span className="hidden rounded-lg border border-border/70 bg-background px-3 py-1.5 text-[9px] font-semibold text-muted-foreground transition-colors group-hover:text-foreground sm:block">Browse</span>
          </label>

          <input id="tm-image" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageChange} className="sr-only" />

          {!isEditing ? (
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-destructive/70" />
              A profile photo is required when creating a team member.
            </div>
          ) : (
            <p className="text-[10px] leading-4 text-muted-foreground">The current profile photo remains unchanged unless you select a replacement.</p>
          )}

        </div>
      </FormSection>


      <FormSection title="Display Settings" description="Control ordering and whether this team member appears on the public website." icon={Sparkles}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          <div className="rounded-2xl border border-border/70 bg-muted/[0.10] p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                <Hash className="size-4" strokeWidth={1.8} />
              </div>

              <div>
                <Label htmlFor="tm-order" className="text-[12px] font-semibold">Display order</Label>
                <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Lower values appear first on the public website.</p>
              </div>
            </div>

            <Input id="tm-order" type="number" min={0} max={999} aria-invalid={!!form.formState.errors.displayOrder} {...form.register('displayOrder', { valueAsNumber: true })} className="mt-4 h-11 rounded-xl text-center text-base font-semibold tabular-nums" />

            <FieldError message={form.formState.errors.displayOrder?.message} />
          </div>


          <div className={`rounded-2xl border p-4 transition-colors ${isActive ? 'border-success/20 bg-success/[0.035]' : 'border-border/70 bg-muted/[0.10]'}`}>
            <div className="flex h-full flex-col justify-between gap-5">

              <div className="flex items-start gap-3">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${isActive ? 'border-success/15 bg-success-subtle text-success' : 'border-border/70 bg-background text-muted-foreground'}`}>
                  {isActive ? <CheckCircle2 className="size-4" strokeWidth={1.8} /> : <EyeOff className="size-4" strokeWidth={1.8} />}
                </div>

                <div>
                  <Label htmlFor="tm-active" className="cursor-pointer text-[12px] font-semibold">Public visibility</Label>
                  <p className="mt-1 text-[9px] leading-4 text-muted-foreground">{isActive ? 'This member is visible in the public team section.' : 'This member is hidden from the public team section.'}</p>
                </div>
              </div>


              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${isActive ? 'bg-success' : 'bg-muted-foreground/35'}`} />
                  <span className="text-[10px] font-semibold text-foreground">{isActive ? 'Visible' : 'Hidden'}</span>
                </div>

                <Switch id="tm-active" checked={isActive} onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true, shouldValidate: true })} />
              </div>

            </div>
          </div>

        </div>
      </FormSection>


      <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="hidden items-center gap-2 sm:flex">
          <UserRound className="size-3.5 text-muted-foreground/45" strokeWidth={1.8} />
          <span className="text-[10px] text-muted-foreground">Review the member profile, photo, and public display settings before saving.</span>
        </div>

        <FormActions onCancel={onCancel} submitLabel={isEditing ? 'Save changes' : 'Create team member'} isSubmitting={isSubmitting} />
      </div>


      <ConfirmDialog open={guard.isBlocked} onOpenChange={(open) => { if (!open) guard.cancelLeave() }} title="Discard changes?" description="You have unsaved changes. Are you sure you want to discard them?" confirmLabel="Discard" variant="destructive" onConfirm={guard.confirmLeave} />

    </form>
  )
}