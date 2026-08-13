import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AlertCircle, CalendarRange, ImageIcon, Landmark, LayoutTemplate, Milestone, PanelLeft, PanelRight, Route, Sparkles, Upload } from 'lucide-react'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormSection } from '@/components/forms/FormSection'
import { FormActions } from '@/components/forms/FormActions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/file-validation'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { useCreateJourneyMutation, useUpdateJourneyMutation } from '@/features/journeys/queries'
import { journeySchema, type JourneyInput } from '@/features/journeys/schema'
import { JOURNEY_SIDES, type Journey } from '@/features/journeys/types'

interface JourneyFormProps { journey?: Journey | null; onSuccess: () => void; onCancel: () => void }

const emptyDefaults: JourneyInput = { period: '', title: '', description: '', icon: '', side: 'left' }

function FieldError({ message }: { message?: string }) { if (!message) return null; return <p className="flex items-center gap-1.5 text-[10px] font-medium text-destructive"><AlertCircle className="size-3 shrink-0" strokeWidth={1.8} />{message}</p> }

export function JourneyForm({ journey, onSuccess, onCancel }: JourneyFormProps) {
  const isEditing = Boolean(journey)
  const [formError, setFormError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const createMutation = useCreateJourneyMutation()
  const updateMutation = useUpdateJourneyMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<JourneyInput>({ resolver: zodResolver(journeySchema), defaultValues: journey ? { period: journey.period, title: journey.title, description: journey.description, icon: journey.icon, side: journey.side } : emptyDefaults })

  const side = form.watch('side') ?? 'left'
  const guard = useUnsavedChangesGuard(form.formState.isDirty || imageFile !== null)

  const imagePreviewUrl = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile)
    if (journey?.image.url) return cloudinaryThumbnail(journey.image.url, 720)
    return null
  }, [imageFile, journey?.image.url])

  useEffect(() => {
    if (!imageFile || !imagePreviewUrl) return
    return () => URL.revokeObjectURL(imagePreviewUrl)
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
      setFormError('Journey image is required.')
      return
    }

    setFormError(null)

    const formData = buildFormData({ period: values.period, title: values.title, description: values.description, icon: values.icon, side: values.side }, { image: imageFile })
    const onError = (error: unknown) => setFormError(applyServerErrors(form, error))

    if (isEditing && journey) {
      updateMutation.mutate({ id: journey._id, formData }, { onSuccess: () => { toast.success('Journey milestone updated successfully'); guard.bypassOnce(); onSuccess() }, onError })
      return
    }

    createMutation.mutate(formData, { onSuccess: () => { toast.success('Journey milestone created successfully'); guard.bypassOnce(); onSuccess() }, onError })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">

      {formError ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.045] px-4 py-3.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><AlertCircle className="size-4" strokeWidth={1.8} /></div>
          <div className="min-w-0"><p className="text-[12px] font-semibold text-destructive">Unable to save milestone</p><p className="mt-1 text-[11px] leading-5 text-destructive/80">{formError}</p></div>
        </div>
      ) : null}


      {/* =====================================================
          MILESTONE INFORMATION
      ===================================================== */}

      <FormSection title="Milestone Information" description="Define when this milestone occurred and the story associated with this stage of the company journey." icon={Milestone}>
        <div className="space-y-5">

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            <div className="space-y-2">
              <Label htmlFor="journey-period" className="text-[12px] font-semibold">Period</Label>
              <div className="group relative">
                <div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground/45 transition-colors group-focus-within:text-foreground"><CalendarRange className="size-3.5" strokeWidth={1.8} /></div>
                <Input id="journey-period" placeholder="e.g. 2024 or 2024 - 2025" aria-invalid={!!form.formState.errors.period} {...form.register('period')} className="h-11 rounded-xl pl-12" />
              </div>
              <FieldError message={form.formState.errors.period?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="journey-side" className="text-[12px] font-semibold">Timeline side</Label>
              <Select value={side} onValueChange={(value) => form.setValue('side', value as JourneyInput['side'], { shouldDirty: true, shouldValidate: true })}>
                <SelectTrigger id="journey-side" className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOURNEY_SIDES.map((timelineSide) => (
                    <SelectItem key={timelineSide} value={timelineSide}>
                      <span className="flex items-center gap-2">
                        {timelineSide === 'left' ? <PanelLeft className="size-3.5 text-muted-foreground" strokeWidth={1.8} /> : <PanelRight className="size-3.5 text-muted-foreground" strokeWidth={1.8} />}
                        {timelineSide === 'left' ? 'Left' : 'Right'}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={form.formState.errors.side?.message} />
            </div>

          </div>


          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="journey-title" className="text-[12px] font-semibold">Milestone title</Label>
              <span className="rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">Required</span>
            </div>

            <div className="group relative">
              <div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground/45 transition-colors group-focus-within:text-foreground"><Landmark className="size-3.5" strokeWidth={1.8} /></div>
              <Input id="journey-title" placeholder="Enter milestone title" aria-invalid={!!form.formState.errors.title} {...form.register('title')} className="h-11 rounded-xl pl-12" />
            </div>

            <FieldError message={form.formState.errors.title?.message} />
          </div>


          <div className="space-y-2">
            <Label htmlFor="journey-description" className="text-[12px] font-semibold">Description</Label>
            <Textarea id="journey-description" rows={5} placeholder="Describe this stage in the company's journey." aria-invalid={!!form.formState.errors.description} {...form.register('description')} className="min-h-[140px] resize-y rounded-xl" />
            <FieldError message={form.formState.errors.description?.message} />
          </div>

        </div>
      </FormSection>


      {/* =====================================================
          TIMELINE PRESENTATION
      ===================================================== */}

      <FormSection title="Timeline Presentation" description="Control how this milestone is represented and positioned on the public company timeline." icon={LayoutTemplate}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">

          <div className="space-y-2">
            <Label htmlFor="journey-icon" className="text-[12px] font-semibold">Icon identifier</Label>

            <div className="group relative">
              <div className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground/45 transition-colors group-focus-within:text-foreground"><Sparkles className="size-3.5" strokeWidth={1.8} /></div>
              <Input id="journey-icon" placeholder="e.g. FaBuilding" aria-invalid={!!form.formState.errors.icon} {...form.register('icon')} className="h-11 rounded-xl pl-12" />
            </div>

            <FieldError message={form.formState.errors.icon?.message} />

            <p className="flex items-start gap-1.5 text-[10px] leading-5 text-muted-foreground">
              <Sparkles className="mt-1 size-3 shrink-0" strokeWidth={1.8} />
              Use the icon identifier expected by the public website.
            </p>
          </div>


          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-muted/[0.08] p-4">
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 size-28 rounded-full bg-primary/[0.035] blur-3xl" />

            <div className="relative flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                {side === 'left' ? <PanelLeft className="size-[17px]" strokeWidth={1.8} /> : <PanelRight className="size-[17px]" strokeWidth={1.8} />}
              </div>

              <div className="min-w-0">
                <span className="text-[9px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">Timeline position</span>
                <p className="mt-1.5 text-[11px] font-medium text-foreground">{side === 'left' ? 'Left side' : 'Right side'}</p>
                <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{side === 'left' ? 'This milestone will appear on the left side of the company timeline.' : 'This milestone will appear on the right side of the company timeline.'}</p>
              </div>
            </div>
          </div>

        </div>
      </FormSection>


      {/* =====================================================
          MILESTONE IMAGE
      ===================================================== */}

      <FormSection title="Milestone Image" description="Upload the visual displayed alongside this milestone on the public website." icon={ImageIcon}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">

          <div className="group relative overflow-hidden rounded-[20px] border border-border/70 bg-muted/20 shadow-[0_1px_3px_rgba(0,0,0,0.025)]">

            {imagePreviewUrl ? (
              <>
                <img src={imagePreviewUrl} alt={imageFile ? 'Selected journey preview' : journey?.title ?? 'Journey milestone'} className="aspect-[4/3] h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-3.5 pb-3 pt-8">
                  <span className="text-[9px] font-semibold tracking-[0.08em] text-white/80 uppercase">{imageFile ? 'New image preview' : 'Current image'}</span>
                </div>
              </>
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 px-5 text-center">
                <div className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground"><ImageIcon className="size-[18px]" strokeWidth={1.7} /></div>
                <div><p className="text-[11px] font-semibold text-foreground">No image selected</p><p className="mt-1 text-[9px] leading-4 text-muted-foreground">Select an image to preview it here.</p></div>
              </div>
            )}

          </div>


          <div className="flex min-w-0 flex-col justify-center">

            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground"><Upload className="size-[17px]" strokeWidth={1.8} /></div>

              <div>
                <Label htmlFor="journey-image" className="text-[12px] font-semibold">{isEditing ? 'Replace milestone image' : 'Upload milestone image'}</Label>
                <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{isEditing ? 'Choose a new image only if you want to replace the current milestone image.' : 'Choose the image that will accompany this milestone on the public website.'}</p>
              </div>
            </div>


            <label htmlFor="journey-image" className="group/upload flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/[0.08] p-4 transition-all duration-200 hover:border-foreground/20 hover:bg-muted/[0.15]">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors group-hover/upload:text-foreground"><Upload className="size-4" strokeWidth={1.8} /></div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-foreground">{imageFile ? imageFile.name : isEditing ? 'Choose a replacement image' : 'Choose an image'}</p>
                <p className="mt-1 text-[9px] text-muted-foreground">JPEG, PNG, GIF or WebP</p>
              </div>

              <span className="shrink-0 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-[9px] font-semibold text-muted-foreground transition-colors group-hover/upload:text-foreground">Browse</span>
            </label>

            <input id="journey-image" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageChange} className="sr-only" />

            {!isEditing ? (
              <div className="mt-3 flex items-center gap-2 text-[9px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-destructive/70" />
                An image is required when creating a milestone.
              </div>
            ) : null}

          </div>

        </div>
      </FormSection>


      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="hidden items-center gap-2 sm:flex">
          <Route className="size-3.5 text-muted-foreground/45" strokeWidth={1.8} />
          <span className="text-[10px] text-muted-foreground">Review the milestone content and timeline presentation before saving.</span>
        </div>

        <FormActions onCancel={onCancel} submitLabel={isEditing ? 'Save changes' : 'Create milestone'} isSubmitting={isSubmitting} />
      </div>


      <ConfirmDialog open={guard.isBlocked} onOpenChange={(open) => { if (!open) guard.cancelLeave() }} title="Discard changes?" description="You have unsaved changes. Are you sure you want to discard them?" confirmLabel="Discard" variant="destructive" onConfirm={guard.confirmLeave} />

    </form>
  )
}