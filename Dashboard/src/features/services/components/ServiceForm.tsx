import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AlertCircle, Check, CheckCircle2, ChevronLeft, ChevronRight, EyeOff, Hash, Home, ImagePlus, Link2, PanelsTopLeft, Settings2, Sparkles, TableProperties, Tag, Upload, Workflow, X, type LucideIcon } from 'lucide-react'

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormSection } from '@/components/forms/FormSection'
import { StringListField } from '@/components/forms/StringListField'
import { StepsEditor } from '@/components/forms/StepsEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/file-validation'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

import { useCreateServiceMutation, useUpdateServiceMutation } from '@/features/services/queries'
import { serviceSchema, type ServiceInput } from '@/features/services/schema'
import type { Service } from '@/features/services/types'
import { CapabilitiesTableEditor } from '@/features/services/components/CapabilitiesTableEditor'

interface ServiceFormProps {
  service?: Service | null
  onSuccess: () => void
  onCancel: () => void
}

interface Step {
  key: string
  title: string
  shortTitle: string
  description: string
  icon: LucideIcon
}

const STEPS: Step[] = [
  { key: 'general', title: 'General Information', shortTitle: 'General', description: 'Service identity, URL, ordering and visibility.', icon: Settings2 },
  { key: 'card', title: 'Service Card', shortTitle: 'Card', description: 'Configure the card displayed in the services collection.', icon: PanelsTopLeft },
  { key: 'hero', title: 'Hero Section', shortTitle: 'Hero', description: 'Configure the main content displayed on the service page.', icon: ImagePlus },
  { key: 'delivery', title: 'Delivery Process', shortTitle: 'Process', description: 'Describe how this service is delivered.', icon: Workflow },
  { key: 'capabilities', title: 'Capabilities', shortTitle: 'Capabilities', description: 'Technical capabilities and structured service data.', icon: TableProperties },
  { key: 'home', title: 'Home Capabilities', shortTitle: 'Homepage', description: 'Configure optional homepage placement.', icon: Home },
]

const emptyDefaults: ServiceInput = {
  title: '',
  slug: '',
  serviceCard: { label: '', description: '', highlights: [''], imageAlt: '' },
  heroSection: { title: '', description: '', imageAlt: '' },
  deliveryProcessSection: { title: '', description: '', steps: [{ title: '', description: '', icon: '' }] },
  capabilitiesSection: { title: '', description: '', items: [''], table: { headers: [''], rows: [] } },
  homeCapability: { isVisible: false, title: '', shortDescription: '', displayOrder: 0 },
  displayOrder: 0,
  isActive: true,
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null
  return <p className="flex items-center gap-1.5 text-[10px] font-medium text-destructive"><AlertCircle className="size-3 shrink-0" strokeWidth={1.8} />{message}</p>
}

function StepHeader({ currentStep, completedStep, onStepClick }: { currentStep: number; completedStep: number; onStepClick: (index: number) => void }) {
  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="min-w-0 overflow-hidden rounded-[22px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
      <div className="border-b border-border/60 px-4 py-4 sm:px-5 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="mt-1 truncate text-[15px] font-semibold tracking-[-0.02em] text-foreground">{STEPS[currentStep].title}</h2>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{STEPS[currentStep].description}</p>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Progress</p>
            <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">{currentStep + 1}<span className="font-medium text-muted-foreground">/{STEPS.length}</span></p>
          </div>
        </div>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted/70">
          <div className="h-full rounded-full bg-foreground transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <div className="grid w-full grid-cols-6 gap-1 px-2 py-3 sm:px-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep || index <= completedStep
            const canNavigate = index <= completedStep + 1 || index < currentStep

            return (
              <button key={step.key} type="button" disabled={!canNavigate} onClick={() => canNavigate && onStepClick(index)} className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition-colors hover:bg-muted/30 disabled:cursor-default disabled:opacity-40 sm:px-2 lg:flex-row lg:gap-2 lg:text-left">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${isActive ? 'border-foreground bg-foreground text-background shadow-sm' : isCompleted ? 'border-success/20 bg-success-subtle text-success' : 'border-border/70 bg-muted/20 text-muted-foreground'}`}>
                  {isCompleted && !isActive ? <Check className="size-3.5" strokeWidth={2} /> : <Icon className="size-3.5" strokeWidth={1.8} />}
                </div>

                <div className="hidden min-w-0 lg:block">
                  <span className={`block truncate text-[10px] font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{step.shortTitle}</span>
                  <span className="mt-0.5 block text-[8px] font-medium text-muted-foreground/50 tabular-nums">Step {String(index + 1).padStart(2, '0')}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ServiceForm({ service, onSuccess, onCancel }: ServiceFormProps) {
  const isEditing = Boolean(service)

  const [currentStep, setCurrentStep] = useState(0)
  const [completedStep, setCompletedStep] = useState(-1)
  const [formError, setFormError] = useState<string | null>(null)
  const [cardImageFile, setCardImageFile] = useState<File | null>(null)
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)
  const [cardImageError, setCardImageError] = useState<string | null>(null)
  const [heroImageError, setHeroImageError] = useState<string | null>(null)

  const createMutation = useCreateServiceMutation()
  const updateMutation = useUpdateServiceMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? {
          title: service.title,
          slug: service.slug,
          serviceCard: service.serviceCard ? { label: service.serviceCard.label, description: service.serviceCard.description, highlights: service.serviceCard.highlights, imageAlt: service.serviceCard.image.alt } : emptyDefaults.serviceCard,
          heroSection: service.heroSection ? { title: service.heroSection.title, description: service.heroSection.description, imageAlt: service.heroSection.image.alt } : emptyDefaults.heroSection,
          deliveryProcessSection: service.deliveryProcessSection ?? emptyDefaults.deliveryProcessSection,
          capabilitiesSection: service.capabilitiesSection ?? emptyDefaults.capabilitiesSection,
          homeCapability: service.homeCapability ?? emptyDefaults.homeCapability,
          displayOrder: service.displayOrder,
          isActive: service.isActive,
        }
      : emptyDefaults,
  })

  const isActive = form.watch('isActive') ?? true
  const homeVisible = form.watch('homeCapability.isVisible') ?? false
  const guard = useUnsavedChangesGuard(form.formState.isDirty || cardImageFile !== null || heroImageFile !== null)

  const cardImagePreview = useMemo(() => {
    if (cardImageFile) return URL.createObjectURL(cardImageFile)
    if (service?.serviceCard?.image?.url) return cloudinaryThumbnail(service.serviceCard.image.url, 900)
    return null
  }, [cardImageFile, service?.serviceCard?.image?.url])

  const heroImagePreview = useMemo(() => {
    if (heroImageFile) return URL.createObjectURL(heroImageFile)
    if (service?.heroSection?.image?.url) return cloudinaryThumbnail(service.heroSection.image.url, 1200)
    return null
  }, [heroImageFile, service?.heroSection?.image?.url])

  useEffect(() => {
    if (!cardImageFile || !cardImagePreview) return
    return () => URL.revokeObjectURL(cardImagePreview)
  }, [cardImageFile, cardImagePreview])

  useEffect(() => {
    if (!heroImageFile || !heroImagePreview) return
    return () => URL.revokeObjectURL(heroImagePreview)
  }, [heroImageFile, heroImagePreview])

  const handleImageChange = (setFile: (file: File | null) => void, setImageError: (message: string | null) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    if (!file) return

    const validationError = validateImageFile(file)

    if (validationError) {
      setImageError(validationError)
      setFile(null)
      event.target.value = ''
      return
    }

    setImageError(null)
    setFormError(null)
    setFile(file)
  }

  const validateCurrentStep = async (): Promise<boolean> => {
    setFormError(null)

    switch (currentStep) {
      case 0:
        return form.trigger(['title', 'slug', 'displayOrder', 'isActive'])

      case 1: {
        const valid = await form.trigger(['serviceCard.label', 'serviceCard.description', 'serviceCard.highlights', 'serviceCard.imageAlt'])
        const hasImage = Boolean(cardImageFile) || Boolean(service?.serviceCard?.image?.url)

        if (!hasImage) {
          setCardImageError('Service card image is required.')
          return false
        }

        setCardImageError(null)
        return valid
      }

      case 2: {
        const valid = await form.trigger(['heroSection.title', 'heroSection.description', 'heroSection.imageAlt'])
        const hasImage = Boolean(heroImageFile) || Boolean(service?.heroSection?.image?.url)

        if (!hasImage) {
          setHeroImageError('Service hero image is required.')
          return false
        }

        setHeroImageError(null)
        return valid
      }

      case 3:
        return form.trigger(['deliveryProcessSection.title', 'deliveryProcessSection.description', 'deliveryProcessSection.steps'])

      case 4:
        return form.trigger(['capabilitiesSection.title', 'capabilitiesSection.description', 'capabilitiesSection.items', 'capabilitiesSection.table'])

      case 5:
        return form.trigger(['homeCapability.isVisible', 'homeCapability.title', 'homeCapability.shortDescription', 'homeCapability.displayOrder'])

      default:
        return true
    }
  }

  const scrollFormToTop = () => {
    const main = document.querySelector('main')
    if (main) {
      main.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNext = async () => {
    const valid = await validateCurrentStep()
    if (!valid) return

    setCompletedStep((current) => Math.max(current, currentStep))
    setCurrentStep((current) => Math.min(current + 1, STEPS.length - 1))
    scrollFormToTop()
  }

  const handlePrevious = () => {
    setCurrentStep((current) => Math.max(current - 1, 0))
    setFormError(null)
    scrollFormToTop()
  }

  const handleStepClick = (index: number) => {
    if (index > completedStep + 1) return
    setCurrentStep(index)
    setFormError(null)
    scrollFormToTop()
  }

  const onSubmit = form.handleSubmit((values) => {
    const needsCardImage = !cardImageFile && !service?.serviceCard?.image?.url
    const needsHeroImage = !heroImageFile && !service?.heroSection?.image?.url

    if (needsCardImage) setCardImageError('Service card image is required.')
    if (needsHeroImage) setHeroImageError('Service hero image is required.')

    if (needsCardImage || needsHeroImage) {
      setCurrentStep(needsCardImage ? 1 : 2)
      return
    }

    setCardImageError(null)
    setHeroImageError(null)
    setFormError(null)

    const formData = buildFormData(
      {
        title: values.title,
        slug: values.slug,
        serviceCard: values.serviceCard,
        heroSection: values.heroSection,
        deliveryProcessSection: values.deliveryProcessSection,
        capabilitiesSection: values.capabilitiesSection,
        homeCapability: values.homeCapability,
        displayOrder: values.displayOrder,
        isActive: values.isActive,
      },
      {
        cardImage: cardImageFile,
        heroImage: heroImageFile,
      },
    )

    const onError = (error: unknown) => {
      const generalError = applyServerErrors(form, error, {
        customFields: {
          cardImage: (message: string) => {
            setCardImageError(message)
            setCurrentStep(1)
          },
          heroImage: (message: string) => {
            setHeroImageError(message)
            setCurrentStep((current) => (current === 1 ? current : 2))
          },
        },
      })

      setFormError(generalError)
      scrollFormToTop()
    }

    if (isEditing && service) {
      updateMutation.mutate(
        { id: service._id, formData },
        {
          onSuccess: () => {
            toast.success('Service updated successfully')
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
        toast.success('Service created successfully')
        guard.bypassOnce()
        onSuccess()
      },
      onError,
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-[calc(100svh-8rem)] min-w-0 flex-col gap-5 overflow-x-hidden">

      <StepHeader currentStep={currentStep} completedStep={completedStep} onStepClick={handleStepClick} />

      {formError ? (
        <div role="alert" className="flex shrink-0 items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.045] px-4 py-3.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-4" strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-destructive">Unable to save service</p>
            <p className="mt-1 text-[10px] leading-5 text-destructive/75">{formError}</p>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 min-w-0 flex-1">

        {currentStep === 0 ? (
          <FormSection title="General Information" description="Define the service identity, ordering and public visibility." icon={Settings2} className="min-w-0">
            <div className="space-y-6">

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="svc-title" className="text-[12px] font-semibold">Service title</Label>
                  <div className="group relative">
                    <Tag className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground" strokeWidth={1.8} />
                    <Input id="svc-title" placeholder="e.g. Pipeline Services" className="h-11 rounded-xl pl-10" aria-invalid={!!form.formState.errors.title} {...form.register('title')} />
                  </div>
                  <FieldError message={form.formState.errors.title?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="svc-slug" className="text-[12px] font-semibold">Slug</Label>
                  <div className="group relative">
                    <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground" strokeWidth={1.8} />
                    <Input id="svc-slug" placeholder="pipeline-services" className="h-11 rounded-xl pl-10 font-mono text-xs" aria-invalid={!!form.formState.errors.slug} {...form.register('slug')} />
                  </div>
                  <FieldError message={form.formState.errors.slug?.message} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-muted/[0.06] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground"><Hash className="size-4" strokeWidth={1.8} /></div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground">Display order</p>
                      <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Lower numbers appear first in the public service collection.</p>
                    </div>
                  </div>

                  <Input id="svc-order" type="number" min={0} max={999} className="mt-4 h-11 rounded-xl bg-background text-center text-base font-semibold tabular-nums" aria-invalid={!!form.formState.errors.displayOrder} {...form.register('displayOrder', { valueAsNumber: true })} />
                  <FieldError message={form.formState.errors.displayOrder?.message} />
                </div>

                <div className={`rounded-2xl border p-4 transition-colors ${isActive ? 'border-success/20 bg-success/[0.035]' : 'border-border/70 bg-muted/[0.06]'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background">
                        {isActive ? <CheckCircle2 className="size-4 text-success" strokeWidth={1.8} /> : <EyeOff className="size-4 text-muted-foreground" strokeWidth={1.8} />}
                      </div>

                      <div className="min-w-0">
                        <Label htmlFor="svc-active" className="cursor-pointer text-[11px] font-semibold">Public visibility</Label>
                        <p className="mt-1 text-[9px] leading-4 text-muted-foreground">{isActive ? 'This service is visible on the public website.' : 'This service is hidden from the public website.'}</p>
                      </div>
                    </div>

                    <Switch id="svc-active" checked={isActive} onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true, shouldValidate: true })} />
                  </div>
                </div>
              </div>

            </div>
          </FormSection>
        ) : null}

        {currentStep === 1 ? (
          <FormSection title="Service Card" description="Configure the content displayed inside the public services collection." icon={PanelsTopLeft} className="min-w-0">
            <div className="space-y-6">

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="svc-card-label" className="text-[12px] font-semibold">Card label</Label>
                  <Input id="svc-card-label" placeholder="e.g. Pipeline Solutions" className="h-11 rounded-xl" aria-invalid={!!form.formState.errors.serviceCard?.label} {...form.register('serviceCard.label')} />
                  <FieldError message={form.formState.errors.serviceCard?.label?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="svc-card-alt" className="text-[12px] font-semibold">Image alt text</Label>
                  <Input id="svc-card-alt" placeholder="Describe the card image" className="h-11 rounded-xl" aria-invalid={!!form.formState.errors.serviceCard?.imageAlt} {...form.register('serviceCard.imageAlt')} />
                  <FieldError message={form.formState.errors.serviceCard?.imageAlt?.message} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="svc-card-description" className="text-[12px] font-semibold">Description</Label>
                <Textarea id="svc-card-description" rows={4} className="min-h-[120px] resize-y rounded-xl" aria-invalid={!!form.formState.errors.serviceCard?.description} {...form.register('serviceCard.description')} />
                <FieldError message={form.formState.errors.serviceCard?.description?.message} />
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <StringListField id="svc-card-highlights" label="Card highlights" values={form.watch('serviceCard.highlights') ?? ['']} onChange={(values) => form.setValue('serviceCard.highlights', values, { shouldDirty: true, shouldValidate: true })} error={form.formState.errors.serviceCard?.highlights?.message} />
              </div>

              <div className={`rounded-2xl border p-4 transition-colors ${cardImageError ? 'border-destructive/30 bg-destructive/[0.02]' : 'border-border/70 bg-muted/[0.05]'}`}>
                <div className="mb-4 flex items-start gap-3">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background ${cardImageError ? 'border-destructive/20 text-destructive' : 'border-border/70 text-muted-foreground'}`}><ImagePlus className="size-4" strokeWidth={1.8} /></div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-semibold text-foreground">Service card image</p>
                      <span className="text-[8px] font-semibold text-destructive">Required</span>
                    </div>
                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Image displayed inside the public service collection.</p>
                  </div>
                </div>

                <div className={`w-full max-w-[460px] overflow-hidden rounded-[18px] border bg-background ${cardImageError ? 'border-destructive/40' : 'border-border/70'}`}>
                  {cardImagePreview ? (
                    <div className="relative aspect-[16/7] overflow-hidden">
                      <img src={cardImagePreview} alt={cardImageFile ? 'Selected service card preview' : service?.serviceCard?.image.alt ?? 'Service card'} className="h-full w-full object-cover" />

                      {cardImageFile ? (
                        <button type="button" aria-label="Remove selected card image" onClick={() => { setCardImageFile(null); if (!service?.serviceCard?.image?.url) setCardImageError('Service card image is required.') }} className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-xl border border-white/15 bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/60">
                          <X className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex aspect-[16/7] flex-col items-center justify-center gap-2 text-center">
                      <ImagePlus className={`size-5 ${cardImageError ? 'text-destructive/70' : 'text-muted-foreground/50'}`} strokeWidth={1.6} />
                      <span className={`text-[10px] ${cardImageError ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>No card image selected</span>
                    </div>
                  )}
                </div>

                <label htmlFor="svc-card-image" className={`mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-background px-3.5 py-3 transition-colors hover:bg-muted/30 ${cardImageError ? 'border-destructive/50' : 'border-border'}`}>
                  <Upload className={`size-4 shrink-0 ${cardImageError ? 'text-destructive' : 'text-muted-foreground'}`} strokeWidth={1.8} />
                  <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-foreground">{cardImageFile ? cardImageFile.name : isEditing ? 'Choose replacement card image' : 'Choose card image'}</span>
                  <span className="hidden text-[9px] text-muted-foreground sm:inline">Browse</span>
                </label>

                <input id="svc-card-image" type="file" className="sr-only" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageChange(setCardImageFile, setCardImageError)} />
                <div className="mt-2"><FieldError message={cardImageError} /></div>
              </div>

            </div>
          </FormSection>
        ) : null}

        {currentStep === 2 ? (
          <FormSection title="Hero Section" description="Configure the main visual section displayed at the top of the service page." icon={ImagePlus} className="min-w-0">
            <div className="space-y-6">

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="svc-hero-title" className="text-[12px] font-semibold">Hero title</Label>
                  <Input id="svc-hero-title" className="h-11 rounded-xl" aria-invalid={!!form.formState.errors.heroSection?.title} {...form.register('heroSection.title')} />
                  <FieldError message={form.formState.errors.heroSection?.title?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="svc-hero-alt" className="text-[12px] font-semibold">Image alt text</Label>
                  <Input id="svc-hero-alt" placeholder="Describe the hero image" className="h-11 rounded-xl" aria-invalid={!!form.formState.errors.heroSection?.imageAlt} {...form.register('heroSection.imageAlt')} />
                  <FieldError message={form.formState.errors.heroSection?.imageAlt?.message} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="svc-hero-description" className="text-[12px] font-semibold">Hero description</Label>
                <Textarea id="svc-hero-description" rows={5} className="min-h-[140px] resize-y rounded-xl" aria-invalid={!!form.formState.errors.heroSection?.description} {...form.register('heroSection.description')} />
                <FieldError message={form.formState.errors.heroSection?.description?.message} />
              </div>

              <div className={`rounded-2xl border p-4 transition-colors ${heroImageError ? 'border-destructive/30 bg-destructive/[0.02]' : 'border-border/70 bg-muted/[0.05]'}`}>
                <div className="mb-4 flex items-start gap-3">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background ${heroImageError ? 'border-destructive/20 text-destructive' : 'border-border/70 text-muted-foreground'}`}><ImagePlus className="size-4" strokeWidth={1.8} /></div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-semibold text-foreground">Hero image</p>
                      <span className="text-[8px] font-semibold text-destructive">Required</span>
                    </div>
                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Use a wide high-quality image suitable for the service hero.</p>
                  </div>
                </div>

                <div className={`w-full max-w-[560px] overflow-hidden rounded-[18px] border bg-background ${heroImageError ? 'border-destructive/40' : 'border-border/70'}`}>
                  {heroImagePreview ? (
                    <div className="relative aspect-[16/8]">
                      <img src={heroImagePreview} alt={heroImageFile ? 'Selected hero preview' : service?.heroSection?.image.alt ?? 'Service hero'} className="h-full w-full object-cover" />

                      {heroImageFile ? (
                        <button type="button" aria-label="Remove selected hero image" onClick={() => { setHeroImageFile(null); if (!service?.heroSection?.image?.url) setHeroImageError('Service hero image is required.') }} className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-xl border border-white/15 bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/60">
                          <X className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex aspect-[16/8] flex-col items-center justify-center gap-2 text-center">
                      <ImagePlus className={`size-5 ${heroImageError ? 'text-destructive/70' : 'text-muted-foreground/50'}`} strokeWidth={1.6} />
                      <span className={`text-[10px] ${heroImageError ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>No hero image selected</span>
                    </div>
                  )}
                </div>

                <label htmlFor="svc-hero-image" className={`mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-background px-3.5 py-3 transition-colors hover:bg-muted/30 ${heroImageError ? 'border-destructive/50' : 'border-border'}`}>
                  <Upload className={`size-4 shrink-0 ${heroImageError ? 'text-destructive' : 'text-muted-foreground'}`} strokeWidth={1.8} />
                  <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-foreground">{heroImageFile ? heroImageFile.name : isEditing ? 'Choose replacement hero image' : 'Choose hero image'}</span>
                  <span className="hidden text-[9px] text-muted-foreground sm:inline">Browse</span>
                </label>

                <input id="svc-hero-image" type="file" className="sr-only" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageChange(setHeroImageFile, setHeroImageError)} />
                <div className="mt-2"><FieldError message={heroImageError} /></div>
              </div>

            </div>
          </FormSection>
        ) : null}

        {currentStep === 3 ? (
          <FormSection title="Delivery Process" description="Define the sequence used to deliver this service." icon={Workflow} className="min-w-0">
            <div className="space-y-6">

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="svc-delivery-title" className="text-[12px] font-semibold">Section title</Label>
                  <Input id="svc-delivery-title" className="h-11 rounded-xl" aria-invalid={!!form.formState.errors.deliveryProcessSection?.title} {...form.register('deliveryProcessSection.title')} />
                  <FieldError message={form.formState.errors.deliveryProcessSection?.title?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="svc-delivery-description" className="text-[12px] font-semibold">Description</Label>
                  <Textarea id="svc-delivery-description" rows={3} className="min-h-[90px] resize-y rounded-xl" aria-invalid={!!form.formState.errors.deliveryProcessSection?.description} {...form.register('deliveryProcessSection.description')} />
                  <FieldError message={form.formState.errors.deliveryProcessSection?.description?.message} />
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <StepsEditor label="Delivery process steps" itemLabel="Step" values={form.watch('deliveryProcessSection.steps') ?? []} onChange={(steps) => form.setValue('deliveryProcessSection.steps', steps, { shouldDirty: true, shouldValidate: true })} error={form.formState.errors.deliveryProcessSection?.steps?.message} />
              </div>

            </div>
          </FormSection>
        ) : null}

        {currentStep === 4 ? (
          <FormSection title="Capabilities" description="Configure technical capabilities and structured service data." icon={TableProperties} className="min-w-0">
            <div className="space-y-6">

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="svc-capabilities-title" className="text-[12px] font-semibold">Section title</Label>
                  <Input id="svc-capabilities-title" className="h-11 rounded-xl" aria-invalid={!!form.formState.errors.capabilitiesSection?.title} {...form.register('capabilitiesSection.title')} />
                  <FieldError message={form.formState.errors.capabilitiesSection?.title?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="svc-capabilities-description" className="text-[12px] font-semibold">Description</Label>
                  <Textarea id="svc-capabilities-description" rows={3} className="min-h-[90px] resize-y rounded-xl" aria-invalid={!!form.formState.errors.capabilitiesSection?.description} {...form.register('capabilitiesSection.description')} />
                  <FieldError message={form.formState.errors.capabilitiesSection?.description?.message} />
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <StringListField id="svc-capabilities-items" label="Capability items" values={form.watch('capabilitiesSection.items') ?? ['']} onChange={(values) => form.setValue('capabilitiesSection.items', values, { shouldDirty: true, shouldValidate: true })} error={form.formState.errors.capabilitiesSection?.items?.message} />
              </div>

              <div className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <CapabilitiesTableEditor table={form.watch('capabilitiesSection.table')} onChange={(table) => form.setValue('capabilitiesSection.table', table, { shouldDirty: true, shouldValidate: true })} error={form.formState.errors.capabilitiesSection?.table?.headers?.message ?? form.formState.errors.capabilitiesSection?.table?.rows?.message} />
              </div>

            </div>
          </FormSection>
        ) : null}

        {currentStep === 5 ? (
          <FormSection title="Home Capabilities" description="Configure optional homepage placement for this service." icon={Home} className="min-w-0">
            <div className="space-y-5">

              <div className={`rounded-2xl border p-4 transition-colors ${homeVisible ? 'border-info/20 bg-info/[0.035]' : 'border-border/70 bg-muted/[0.06]'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground"><Sparkles className="size-4" strokeWidth={1.8} /></div>

                    <div className="min-w-0">
                      <Label htmlFor="svc-home-visible" className="cursor-pointer text-[11px] font-semibold">Show in Home Capabilities</Label>
                      <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Feature this service as one of the highlighted homepage capabilities.</p>
                    </div>
                  </div>

                  <Switch id="svc-home-visible" checked={homeVisible} onCheckedChange={(checked) => form.setValue('homeCapability.isVisible', checked, { shouldDirty: true, shouldValidate: true })} />
                </div>
              </div>

              {homeVisible ? (
                <div className="space-y-5 rounded-2xl border border-info/15 bg-info/[0.02] p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_180px]">
                    <div className="space-y-2">
                      <Label htmlFor="svc-home-title" className="text-[12px] font-semibold">Home title</Label>
                      <Input id="svc-home-title" className="h-11 rounded-xl bg-background" aria-invalid={!!form.formState.errors.homeCapability?.title} {...form.register('homeCapability.title')} />
                      <FieldError message={form.formState.errors.homeCapability?.title?.message} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="svc-home-order" className="text-[12px] font-semibold">Display order</Label>
                      <div className="relative">
                        <Hash className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45" strokeWidth={1.8} />
                        <Input id="svc-home-order" type="number" min={0} className="h-11 rounded-xl bg-background pl-10" aria-invalid={!!form.formState.errors.homeCapability?.displayOrder} {...form.register('homeCapability.displayOrder', { valueAsNumber: true })} />
                      </div>
                      <FieldError message={form.formState.errors.homeCapability?.displayOrder?.message} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="svc-home-description" className="text-[12px] font-semibold">Short description</Label>
                    <Textarea id="svc-home-description" rows={4} className="min-h-[110px] resize-y rounded-xl bg-background" aria-invalid={!!form.formState.errors.homeCapability?.shortDescription} {...form.register('homeCapability.shortDescription')} />
                    <FieldError message={form.formState.errors.homeCapability?.shortDescription?.message} />
                  </div>
                </div>
              ) : null}

            </div>
          </FormSection>
        ) : null}

      </div>

      <div className="mt-auto flex shrink-0 items-center justify-between gap-3 rounded-[20px] border border-border/70 bg-card p-3 shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
        <div className="min-w-0 flex-1">
          {currentStep > 0 ? (
            <Button type="button" variant="outline" onClick={handlePrevious} className="gap-1.5"><ChevronLeft className="size-4" /><span className="hidden sm:inline">Previous</span></Button>
          ) : (
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          )}
        </div>

        <div className="hidden shrink-0 text-center sm:block">
          <p className="text-[8px] font-semibold tracking-[0.1em] text-muted-foreground/50 uppercase">Current step</p>
          <p className="mt-0.5 text-[10px] font-semibold text-foreground tabular-nums">{currentStep + 1} of {STEPS.length}</p>
        </div>

        <div className="flex min-w-0 flex-1 justify-end">
          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} className="gap-1.5">Continue<ChevronRight className="size-4" /></Button>
          ) : (
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create service'}
              {!isSubmitting ? <Check className="size-4" /> : null}
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog open={guard.isBlocked} onOpenChange={(open) => { if (!open) guard.cancelLeave() }} title="Discard changes?" description="You have unsaved changes. Are you sure you want to discard them?" confirmLabel="Discard" variant="destructive" onConfirm={guard.confirmLeave} />

    </form>
  )
}