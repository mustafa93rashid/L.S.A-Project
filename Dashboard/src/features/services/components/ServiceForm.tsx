import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Hash, Home, ImagePlus, LayoutGrid, Link2, ListChecks, PanelsTopLeft, Settings2, Sparkles, TableProperties, Tag, Upload, Workflow, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormSection } from '@/components/forms/FormSection'
import { FormActions } from '@/components/forms/FormActions'
import { SectionNav } from '@/components/forms/SectionNav'
import { StringListField } from '@/components/forms/StringListField'
import { StepsEditor } from '@/components/forms/StepsEditor'
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


const emptyDefaults: ServiceInput = {
  title: '',
  slug: '',
  serviceCard: {
    label: '',
    description: '',
    highlights: [''],
    imageAlt: '',
  },
  heroSection: {
    title: '',
    description: '',
    imageAlt: '',
  },
  deliveryProcessSection: {
    title: '',
    description: '',
    steps: [
      {
        title: '',
        description: '',
        icon: '',
      },
    ],
  },
  capabilitiesSection: {
    title: '',
    description: '',
    items: [''],
    table: {
      headers: [''],
      rows: [],
    },
  },
  homeCapability: {
    isVisible: false,
    title: '',
    shortDescription: '',
    displayOrder: 0,
  },
  displayOrder: 0,
  isActive: true,
}


const SECTIONS = [
  { id: 'svc-section-general', label: 'General' },
  { id: 'svc-section-card', label: 'Service Card' },
  { id: 'svc-section-hero', label: 'Hero Section' },
  { id: 'svc-section-delivery', label: 'Delivery Process' },
  { id: 'svc-section-capabilities', label: 'Capabilities' },
  { id: 'svc-section-home', label: 'Home Capabilities' },
]


function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="flex items-center gap-1.5 text-[10px] font-medium text-destructive"><AlertCircle className="size-3 shrink-0" strokeWidth={1.8} />{message}</p>
}


export function ServiceForm({ service, onSuccess, onCancel }: ServiceFormProps) {
  const isEditing = Boolean(service)

  const [formError, setFormError] = useState<string | null>(null)
  const [cardImageFile, setCardImageFile] = useState<File | null>(null)
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)

  const createMutation = useCreateServiceMutation()
  const updateMutation = useUpdateServiceMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? {
          title: service.title,
          slug: service.slug,
          serviceCard: service.serviceCard
            ? {
                label: service.serviceCard.label,
                description: service.serviceCard.description,
                highlights: service.serviceCard.highlights,
                imageAlt: service.serviceCard.image.alt,
              }
            : emptyDefaults.serviceCard,
          heroSection: service.heroSection
            ? {
                title: service.heroSection.title,
                description: service.heroSection.description,
                imageAlt: service.heroSection.image.alt,
              }
            : emptyDefaults.heroSection,
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


  const handleImageChange = (setFile: (file: File | null) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null

    if (!file) {
      setFile(null)
      return
    }

    const validationError = validateImageFile(file)

    if (validationError) {
      setFormError(validationError)
      setFile(null)
      event.target.value = ''
      return
    }

    setFormError(null)
    setFile(file)
  }


  const onSubmit = form.handleSubmit((values) => {
    const needsCardImage = !cardImageFile && !service?.serviceCard?.image?.url
    const needsHeroImage = !heroImageFile && !service?.heroSection?.image?.url

    if (needsCardImage || needsHeroImage) {
      setFormError('Both the service card image and hero image are required.')
      return
    }

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

    const onError = (error: unknown) => setFormError(applyServerErrors(form, error))

    if (isEditing && service) {
      updateMutation.mutate(
        {
          id: service._id,
          formData,
        },
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
    <form onSubmit={onSubmit} noValidate className="space-y-6">

      {formError ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.045] px-4 py-3.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-4" strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-destructive">Unable to save service</p>
            <p className="mt-1 text-[11px] leading-5 text-destructive/80">{formError}</p>
          </div>
        </div>
      ) : null}


<div className="flex items-start gap-7">

  <aside className="hidden w-56 shrink-0 lg:block">
    <SectionNav
      items={SECTIONS}
      title="Service Setup"
    />
  </aside>

  <div className="min-w-0 flex-1 space-y-6">
          {/* =====================================================
              GENERAL INFORMATION
          ===================================================== */}

          <FormSection id="svc-section-general" title="General Information" description="Define the service identity, public visibility, URL, and ordering." icon={Settings2}>
            <div className="space-y-6">

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="svc-title" className="text-[12px] font-semibold">Service title</Label>
                    <span className="rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">Required</span>
                  </div>

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
                    <Input id="svc-slug" placeholder="e.g. pipeline-services" className="h-11 rounded-xl pl-10 font-mono text-[12px]" aria-invalid={!!form.formState.errors.slug} {...form.register('slug')} />
                  </div>

                  <FieldError message={form.formState.errors.slug?.message} />
                </div>

              </div>


              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                <div className="rounded-2xl border border-border/70 bg-muted/[0.08] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                      <Hash className="size-4" strokeWidth={1.8} />
                    </div>

                    <div>
                      <Label htmlFor="svc-order" className="text-[12px] font-semibold">Display order</Label>
                      <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Lower values appear earlier in the public service collection.</p>
                    </div>
                  </div>

                  <Input id="svc-order" type="number" min={0} max={999} className="mt-4 h-11 rounded-xl text-center text-base font-semibold tabular-nums" aria-invalid={!!form.formState.errors.displayOrder} {...form.register('displayOrder', { valueAsNumber: true })} />

                  <FieldError message={form.formState.errors.displayOrder?.message} />
                </div>


                <div className={`rounded-2xl border p-4 transition-colors ${isActive ? 'border-success/20 bg-success/[0.035]' : 'border-border/70 bg-muted/[0.08]'}`}>
                  <div className="flex h-full flex-col justify-between gap-5">

                    <div className="flex items-start gap-3">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${isActive ? 'border-success/15 bg-success-subtle text-success' : 'border-border/70 bg-background text-muted-foreground'}`}>
                        {isActive ? <CheckCircle2 className="size-4" strokeWidth={1.8} /> : <EyeOff className="size-4" strokeWidth={1.8} />}
                      </div>

                      <div>
                        <Label htmlFor="svc-active" className="cursor-pointer text-[12px] font-semibold">Public visibility</Label>
                        <p className="mt-1 text-[9px] leading-4 text-muted-foreground">{isActive ? 'This service is visible on the public website.' : 'This service is hidden from the public website.'}</p>
                      </div>
                    </div>


                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${isActive ? 'bg-success' : 'bg-muted-foreground/35'}`} />
                        <span className="text-[10px] font-semibold text-foreground">{isActive ? 'Visible' : 'Hidden'}</span>
                      </div>

                      <Switch id="svc-active" checked={isActive} onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true, shouldValidate: true })} />
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </FormSection>


          {/* =====================================================
              SERVICE CARD
          ===================================================== */}

          <FormSection id="svc-section-card" title="Service Card" description="Content displayed in the compact card on the public Services collection." icon={PanelsTopLeft}>
            <div className="space-y-6">

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                <div className="space-y-2">
                  <Label htmlFor="svc-card-label" className="text-[12px] font-semibold">Card label</Label>

                  <div className="group relative">
                    <Tag className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground" strokeWidth={1.8} />
                    <Input id="svc-card-label" placeholder="e.g. Pipeline Solutions" className="h-11 rounded-xl pl-10" aria-invalid={!!form.formState.errors.serviceCard?.label} {...form.register('serviceCard.label')} />
                  </div>

                  <FieldError message={form.formState.errors.serviceCard?.label?.message} />
                </div>


                <div className="space-y-2">
                  <Label htmlFor="svc-card-imageAlt" className="text-[12px] font-semibold">Image alt text</Label>
                  <Input id="svc-card-imageAlt" placeholder="Describe the card image for accessibility" className="h-11 rounded-xl" {...form.register('serviceCard.imageAlt')} />
                </div>

              </div>


              <div className="space-y-2">
                <Label htmlFor="svc-card-description" className="text-[12px] font-semibold">Card description</Label>
                <Textarea id="svc-card-description" rows={4} placeholder="Short description displayed on the service card." className="min-h-[110px] resize-y rounded-xl" aria-invalid={!!form.formState.errors.serviceCard?.description} {...form.register('serviceCard.description')} />
                <FieldError message={form.formState.errors.serviceCard?.description?.message} />
              </div>


              <div className="rounded-2xl border border-border/70 bg-muted/[0.06] p-4">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <ListChecks className="size-4" strokeWidth={1.8} />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-foreground">Card highlights</p>
                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Add the main service features displayed in the compact card.</p>
                  </div>
                </div>

                <StringListField id="svc-card-highlights" label="Highlights" values={form.watch('serviceCard.highlights')} onChange={(values) => form.setValue('serviceCard.highlights', values, { shouldDirty: true, shouldValidate: true })} error={form.formState.errors.serviceCard?.highlights?.message} />
              </div>


              <div className="border-t border-border/60 pt-6">

                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground">
                    <ImagePlus className="size-4" strokeWidth={1.8} />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-foreground">Service card image</p>
                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">{isEditing ? 'Choose a replacement only if you want to change the current card image.' : 'Upload the image shown in the public service card.'}</p>
                  </div>
                </div>


                <div className="flex justify-start">
                  <div className="group relative w-full max-w-[420px] overflow-hidden rounded-[20px] border border-border/70 bg-muted/[0.10]">

                    {cardImagePreview ? (
                      <div className="relative aspect-[16/7] overflow-hidden bg-background">
                        <img src={cardImagePreview} alt={cardImageFile ? 'Selected service card preview' : service?.serviceCard?.image.alt ?? 'Service card'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]" />

                        {cardImageFile ? (
                          <button type="button" aria-label="Remove selected card image" onClick={() => setCardImageFile(null)} className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-lg border border-white/20 bg-black/35 text-white/80 backdrop-blur transition-colors hover:bg-black/50 hover:text-white">
                            <X className="size-3.5" />
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex aspect-[16/7] flex-col items-center justify-center gap-2.5 px-5 text-center">
                        <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                          <ImagePlus className="size-[17px]" strokeWidth={1.8} />
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold text-foreground">No card image selected</p>
                          <p className="mt-1 text-[9px] text-muted-foreground">Upload an image to preview it here.</p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>


                <label htmlFor="svc-card-image" className="group mt-4 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/[0.08] px-4 py-4 transition-all hover:border-foreground/15 hover:bg-muted/[0.15]">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                    <Upload className="size-4" strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-foreground">{cardImageFile ? cardImageFile.name : isEditing ? 'Choose replacement card image' : 'Choose service card image'}</p>
                    <p className="mt-1 text-[9px] text-muted-foreground">JPEG, PNG, GIF or WebP.</p>
                  </div>

                  <span className="hidden rounded-lg border border-border/70 bg-background px-3 py-1.5 text-[9px] font-semibold text-muted-foreground sm:block">Browse</span>
                </label>

                <input id="svc-card-image" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageChange(setCardImageFile)} className="sr-only" />

              </div>

            </div>
          </FormSection>


          {/* =====================================================
              HERO SECTION
          ===================================================== */}

          <FormSection id="svc-section-hero" title="Hero Section" description="Content displayed at the top of the service details page." icon={ImagePlus}>
            <div className="space-y-6">

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                <div className="space-y-2">
                  <Label htmlFor="svc-hero-title" className="text-[12px] font-semibold">Hero title</Label>
                  <Input id="svc-hero-title" className="h-11 rounded-xl" aria-invalid={!!form.formState.errors.heroSection?.title} {...form.register('heroSection.title')} />
                  <FieldError message={form.formState.errors.heroSection?.title?.message} />
                </div>


                <div className="space-y-2">
                  <Label htmlFor="svc-hero-imageAlt" className="text-[12px] font-semibold">Hero image alt text</Label>
                  <Input id="svc-hero-imageAlt" placeholder="Describe the hero image for accessibility" className="h-11 rounded-xl" {...form.register('heroSection.imageAlt')} />
                </div>

              </div>


              <div className="space-y-2">
                <Label htmlFor="svc-hero-description" className="text-[12px] font-semibold">Hero description</Label>
                <Textarea id="svc-hero-description" rows={5} className="min-h-[140px] resize-y rounded-xl" aria-invalid={!!form.formState.errors.heroSection?.description} {...form.register('heroSection.description')} />
                <FieldError message={form.formState.errors.heroSection?.description?.message} />
              </div>


              <div className="border-t border-border/60 pt-6">

                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground">
                    <ImagePlus className="size-4" strokeWidth={1.8} />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-foreground">Hero image</p>
                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">{isEditing ? 'Leave unchanged to keep the current hero image.' : 'Use a wide high-quality image suitable for the service hero.'}</p>
                  </div>
                </div>


                <div className="flex justify-start">
                  <div className="group relative w-full max-w-[540px] overflow-hidden rounded-[20px] border border-border/70 bg-muted/[0.10]">

                    {heroImagePreview ? (
                      <div className="relative aspect-[16/8] overflow-hidden bg-background">
                        <img src={heroImagePreview} alt={heroImageFile ? 'Selected hero preview' : service?.heroSection?.image.alt ?? 'Service hero'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />

                        {heroImageFile ? (
                          <button type="button" aria-label="Remove selected hero image" onClick={() => setHeroImageFile(null)} className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-lg border border-white/20 bg-black/35 text-white/80 backdrop-blur transition-colors hover:bg-black/50 hover:text-white">
                            <X className="size-3.5" />
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex aspect-[16/8] flex-col items-center justify-center gap-2.5 px-5 text-center">
                        <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                          <ImagePlus className="size-[17px]" strokeWidth={1.8} />
                        </div>

                        <p className="text-[10px] font-semibold text-foreground">No hero image selected</p>
                      </div>
                    )}

                  </div>
                </div>


                <label htmlFor="svc-hero-image" className="group mt-4 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/[0.08] px-4 py-4 transition-all hover:border-foreground/15 hover:bg-muted/[0.15]">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                    <Upload className="size-4" strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-foreground">{heroImageFile ? heroImageFile.name : isEditing ? 'Choose replacement hero image' : 'Choose hero image'}</p>
                    <p className="mt-1 text-[9px] text-muted-foreground">JPEG, PNG, GIF or WebP.</p>
                  </div>

                  <span className="hidden rounded-lg border border-border/70 bg-background px-3 py-1.5 text-[9px] font-semibold text-muted-foreground sm:block">Browse</span>
                </label>

                <input id="svc-hero-image" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageChange(setHeroImageFile)} className="sr-only" />

              </div>

            </div>
          </FormSection>


          {/* =====================================================
              DELIVERY PROCESS
          ===================================================== */}

          <FormSection id="svc-section-delivery" title="Delivery Process" description="Describe how the service is delivered from planning through execution." icon={Workflow}>
            <div className="space-y-6">

              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/[0.08] p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                  <LayoutGrid className="size-4" strokeWidth={1.8} />
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-foreground">Process structure</p>
                  <p className="mt-1 text-[10px] leading-5 text-muted-foreground">Create a clear sequence explaining how the service moves from planning to final execution.</p>
                </div>
              </div>


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


              <div className="rounded-2xl border border-border/70 bg-muted/[0.06] p-4">
                <StepsEditor label="Delivery process steps" itemLabel="Step" values={form.watch('deliveryProcessSection.steps')} onChange={(steps) => form.setValue('deliveryProcessSection.steps', steps, { shouldDirty: true, shouldValidate: true })} error={form.formState.errors.deliveryProcessSection?.steps?.message} />
              </div>

            </div>
          </FormSection>


          {/* =====================================================
              CAPABILITIES
          ===================================================== */}

          <FormSection id="svc-section-capabilities" title="Capabilities" description="Define the service capabilities and the structured capability table." icon={TableProperties}>
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


              <div className="rounded-2xl border border-border/70 bg-muted/[0.06] p-4">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <ListChecks className="size-4" strokeWidth={1.8} />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-foreground">Capability items</p>
                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Define the primary technical or operational capabilities of this service.</p>
                  </div>
                </div>

                <StringListField id="svc-capabilities-items" label="Capability items" values={form.watch('capabilitiesSection.items')} onChange={(values) => form.setValue('capabilitiesSection.items', values, { shouldDirty: true, shouldValidate: true })} error={form.formState.errors.capabilitiesSection?.items?.message} />
              </div>


              <div className="rounded-2xl border border-border/70 bg-muted/[0.06] p-4">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <TableProperties className="size-4" strokeWidth={1.8} />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-foreground">Capabilities table</p>
                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Build the structured technical table displayed inside the service details.</p>
                  </div>
                </div>

                <CapabilitiesTableEditor table={form.watch('capabilitiesSection.table')} onChange={(table) => form.setValue('capabilitiesSection.table', table, { shouldDirty: true, shouldValidate: true })} error={form.formState.errors.capabilitiesSection?.table?.headers?.message ?? form.formState.errors.capabilitiesSection?.table?.rows?.message} />
              </div>

            </div>
          </FormSection>


          {/* =====================================================
              HOME CAPABILITIES
          ===================================================== */}

          <FormSection id="svc-section-home" title="Home Capabilities" description="Optionally feature this service in the homepage capabilities section. Maximum 6 services." icon={Home}>
            <div className="space-y-5">

              <div className={`rounded-2xl border p-4 transition-colors ${homeVisible ? 'border-info/20 bg-info/[0.035]' : 'border-border/70 bg-muted/[0.08]'}`}>
                <div className="flex items-center justify-between gap-5">

                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${homeVisible ? 'border-info/15 bg-info-subtle text-info' : 'border-border/70 bg-background text-muted-foreground'}`}>
                      <Sparkles className="size-4" strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0">
                      <Label htmlFor="svc-home-visible" className="cursor-pointer text-[12px] font-semibold">Show in Home Capabilities</Label>
                      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Enable this service as one of the highlighted capabilities on the homepage.</p>
                    </div>
                  </div>

                  <Switch id="svc-home-visible" checked={homeVisible} onCheckedChange={(checked) => form.setValue('homeCapability.isVisible', checked, { shouldDirty: true, shouldValidate: true })} />

                </div>
              </div>


              {homeVisible ? (
                <div className="space-y-5">

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                    <div className="space-y-2">
                      <Label htmlFor="svc-home-title" className="text-[12px] font-semibold">Home title</Label>
                      <Input id="svc-home-title" className="h-11 rounded-xl" aria-invalid={!!form.formState.errors.homeCapability?.title} {...form.register('homeCapability.title')} />
                      <FieldError message={form.formState.errors.homeCapability?.title?.message} />
                    </div>


                    <div className="space-y-2">
                      <Label htmlFor="svc-home-order" className="text-[12px] font-semibold">Home display order</Label>

                      <div className="group relative">
                        <Hash className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45" strokeWidth={1.8} />
                        <Input id="svc-home-order" type="number" min={0} className="h-11 rounded-xl pl-10 tabular-nums" aria-invalid={!!form.formState.errors.homeCapability?.displayOrder} {...form.register('homeCapability.displayOrder', { valueAsNumber: true })} />
                      </div>

                      <FieldError message={form.formState.errors.homeCapability?.displayOrder?.message} />
                    </div>

                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="svc-home-shortDescription" className="text-[12px] font-semibold">Home short description</Label>
                    <Textarea id="svc-home-shortDescription" rows={3} className="min-h-[100px] resize-y rounded-xl" aria-invalid={!!form.formState.errors.homeCapability?.shortDescription} {...form.register('homeCapability.shortDescription')} />
                    <FieldError message={form.formState.errors.homeCapability?.shortDescription?.message} />
                  </div>


                  <div className="flex items-start gap-3 rounded-2xl border border-info/15 bg-info-subtle/50 p-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-info/15 bg-background/70 text-info">
                      <Eye className="size-4" strokeWidth={1.8} />
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-foreground">Homepage visibility enabled</p>
                      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">This service will consume one of the six Home Capabilities positions when the service is saved and active.</p>
                    </div>
                  </div>

                </div>
              ) : null}

            </div>
          </FormSection>


          {/* =====================================================
              ACTIONS
          ===================================================== */}

          <FormActions onCancel={onCancel} submitLabel={isEditing ? 'Save changes' : 'Create service'} isSubmitting={isSubmitting} sticky />

        </div>
      </div>


      <ConfirmDialog open={guard.isBlocked} onOpenChange={(open) => { if (!open) guard.cancelLeave() }} title="Discard changes?" description="You have unsaved changes. Are you sure you want to discard them?" confirmLabel="Discard" variant="destructive" onConfirm={guard.confirmLeave} />

    </form>
  )
}