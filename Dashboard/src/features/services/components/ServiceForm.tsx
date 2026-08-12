import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Eye, ImagePlus, LayoutGrid, Settings2, Sparkles } from 'lucide-react'

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormSection } from '@/components/forms/FormSection'
import { FormActions } from '@/components/forms/FormActions'
import { SectionNav } from '@/components/forms/SectionNav'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { StringListField } from '@/components/forms/StringListField'
import { StepsEditor } from '@/components/forms/StepsEditor'

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

  const guard = useUnsavedChangesGuard(form.formState.isDirty || cardImageFile !== null || heroImageFile !== null)

  const homeVisible = form.watch('homeCapability.isVisible')

  const handleImageChange =
    (setFile: (file: File | null) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null

      if (file) {
        const validationError = validateImageFile(file)

        if (validationError) {
          setFormError(validationError)
          setFile(null)
          event.target.value = ''
          return
        }
      }

      setFormError(null)
      setFile(file)
    }

  const onSubmit = form.handleSubmit((values) => {
    const needsCardImage = !cardImageFile && !service?.serviceCard?.image.url
    const needsHeroImage = !heroImageFile && !service?.heroSection?.image.url

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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError ? <div className="rounded-xl border border-destructive/20 bg-destructive-subtle px-4 py-3 text-sm font-medium text-destructive">{formError}</div> : null}

      <div className="flex items-start gap-7">
        <aside className="sticky top-24 hidden w-52 shrink-0 lg:block">
          <SectionNav items={SECTIONS} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <FormSection id="svc-section-general" title="General Information">
            <div className="mb-1 flex items-start gap-3 rounded-[16px] border border-border/70 bg-muted/[0.12] px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                <Settings2 className="size-4" strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground">Service configuration</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Define the service identity, URL slug, ordering and public visibility.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-title">Title</Label>
                <Input id="svc-title" placeholder="e.g. Pipeline Services" className="h-11" aria-invalid={!!form.formState.errors.title} {...form.register('title')} />
                {form.formState.errors.title ? <p className="text-xs text-destructive">{form.formState.errors.title.message}</p> : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-slug">Slug</Label>
                <Input id="svc-slug" placeholder="e.g. pipeline-services" className="h-11" aria-invalid={!!form.formState.errors.slug} {...form.register('slug')} />
                {form.formState.errors.slug ? <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p> : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-order">Display order</Label>
                <Input id="svc-order" type="number" min={0} max={999} className="h-11" aria-invalid={!!form.formState.errors.displayOrder} {...form.register('displayOrder', { valueAsNumber: true })} />
                {form.formState.errors.displayOrder ? <p className="text-xs text-destructive">{form.formState.errors.displayOrder.message}</p> : null}
                <p className="text-[11px] leading-5 text-muted-foreground">Lower values appear earlier in the public services collection.</p>
              </div>

              <div className="flex items-center justify-between rounded-[16px] border border-border/70 bg-muted/[0.12] px-4 py-4">
                <div className="pr-6">
                  <Label htmlFor="svc-active">Public visibility</Label>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Controls whether this service is active and visible on the public website.</p>
                </div>

                <Switch id="svc-active" checked={form.watch('isActive')} onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true, shouldValidate: true })} />
              </div>
            </div>
          </FormSection>

          <FormSection id="svc-section-card" title="Service Card" description="Content displayed in the compact service card on the Services listing.">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="svc-card-label">Label</Label>
                  <Input id="svc-card-label" className="h-11" placeholder="e.g. Pipeline Solutions" aria-invalid={!!form.formState.errors.serviceCard?.label} {...form.register('serviceCard.label')} />
                  {form.formState.errors.serviceCard?.label ? <p className="text-xs text-destructive">{form.formState.errors.serviceCard.label.message}</p> : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="svc-card-description">Description</Label>
                  <Textarea id="svc-card-description" rows={4} placeholder="Short description displayed on the service card." aria-invalid={!!form.formState.errors.serviceCard?.description} {...form.register('serviceCard.description')} />
                  {form.formState.errors.serviceCard?.description ? <p className="text-xs text-destructive">{form.formState.errors.serviceCard.description.message}</p> : null}
                </div>

                <StringListField
                  id="svc-card-highlights"
                  label="Highlights"
                  values={form.watch('serviceCard.highlights')}
                  onChange={(values) => form.setValue('serviceCard.highlights', values, { shouldDirty: true, shouldValidate: true })}
                  error={form.formState.errors.serviceCard?.highlights?.message}
                />
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="svc-card-image">{isEditing ? 'Service card image' : 'Upload card image'}</Label>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{isEditing ? 'Upload a new image only if you want to replace the current one.' : 'This image will appear in the service card on the public Services page.'}</p>
                </div>

                <div className="overflow-hidden rounded-[18px] border border-border/70 bg-muted/[0.12]">
                  {cardImageFile ? (
                    <img src={URL.createObjectURL(cardImageFile)} alt="Selected service card preview" className="aspect-[16/7] h-full w-full object-cover" />
                  ) : service?.serviceCard?.image.url ? (
                    <img src={cloudinaryThumbnail(service.serviceCard.image.url, 720)} alt={service.serviceCard.image.alt} className="aspect-[16/7] h-full w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[16/7] flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
                      <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background">
                        <ImagePlus className="size-4" strokeWidth={1.8} />
                      </div>
                      <p className="text-xs font-medium">No card image selected</p>
                    </div>
                  )}
                </div>

                <input id="svc-card-image" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageChange(setCardImageFile)} className="w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground" />

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="svc-card-imageAlt">Image alt text</Label>
                  <Input id="svc-card-imageAlt" className="h-11" placeholder="Describe the image for accessibility" {...form.register('serviceCard.imageAlt')} />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection id="svc-section-hero" title="Hero Section" description="Content displayed at the top of the service detail page.">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="svc-hero-title">Hero title</Label>
                  <Input id="svc-hero-title" className="h-11" aria-invalid={!!form.formState.errors.heroSection?.title} {...form.register('heroSection.title')} />
                  {form.formState.errors.heroSection?.title ? <p className="text-xs text-destructive">{form.formState.errors.heroSection.title.message}</p> : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="svc-hero-description">Hero description</Label>
                  <Textarea id="svc-hero-description" rows={5} aria-invalid={!!form.formState.errors.heroSection?.description} {...form.register('heroSection.description')} />
                  {form.formState.errors.heroSection?.description ? <p className="text-xs text-destructive">{form.formState.errors.heroSection.description.message}</p> : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="svc-hero-imageAlt">Hero image alt text</Label>
                  <Input id="svc-hero-imageAlt" className="h-11" placeholder="Describe the hero image for accessibility" {...form.register('heroSection.imageAlt')} />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="svc-hero-image">{isEditing ? 'Hero image' : 'Upload hero image'}</Label>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{isEditing ? 'Leave empty to keep the current hero image.' : 'Use a wide, high-quality image suitable for the top of the detail page.'}</p>
                </div>

                <div className="overflow-hidden rounded-[18px] border border-border/70 bg-muted/[0.12]">
                  {heroImageFile ? (
                    <img src={URL.createObjectURL(heroImageFile)} alt="Selected hero preview" className="aspect-[16/9] h-full w-full object-cover" />
                  ) : service?.heroSection?.image.url ? (
                    <img src={cloudinaryThumbnail(service.heroSection.image.url, 960)} alt={service.heroSection.image.alt} className="aspect-[16/9] h-full w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
                      <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background">
                        <ImagePlus className="size-4" strokeWidth={1.8} />
                      </div>
                      <p className="text-xs font-medium">No hero image selected</p>
                    </div>
                  )}
                </div>

                <input id="svc-hero-image" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageChange(setHeroImageFile)} className="w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground" />
              </div>
            </div>
          </FormSection>

          <FormSection id="svc-section-delivery" title="Delivery Process" description="Describe how this service is delivered from planning through execution.">
            <div className="mb-1 flex items-start gap-3 rounded-[16px] border border-border/70 bg-muted/[0.12] px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                <LayoutGrid className="size-4" strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground">Process structure</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Create a clear sequence of steps that explains how the service is executed.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-delivery-title">Section title</Label>
                <Input id="svc-delivery-title" className="h-11" aria-invalid={!!form.formState.errors.deliveryProcessSection?.title} {...form.register('deliveryProcessSection.title')} />
                {form.formState.errors.deliveryProcessSection?.title ? <p className="text-xs text-destructive">{form.formState.errors.deliveryProcessSection.title.message}</p> : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-delivery-description">Description</Label>
                <Textarea id="svc-delivery-description" rows={3} aria-invalid={!!form.formState.errors.deliveryProcessSection?.description} {...form.register('deliveryProcessSection.description')} />
                {form.formState.errors.deliveryProcessSection?.description ? <p className="text-xs text-destructive">{form.formState.errors.deliveryProcessSection.description.message}</p> : null}
              </div>
            </div>

            <StepsEditor
              label="Delivery process steps"
              itemLabel="Step"
              values={form.watch('deliveryProcessSection.steps')}
              onChange={(steps) => form.setValue('deliveryProcessSection.steps', steps, { shouldDirty: true, shouldValidate: true })}
              error={form.formState.errors.deliveryProcessSection?.steps?.message}
            />
          </FormSection>

          <FormSection id="svc-section-capabilities" title="Capabilities" description="Define the service capabilities and structured capability table.">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-capabilities-title">Section title</Label>
                <Input id="svc-capabilities-title" className="h-11" aria-invalid={!!form.formState.errors.capabilitiesSection?.title} {...form.register('capabilitiesSection.title')} />
                {form.formState.errors.capabilitiesSection?.title ? <p className="text-xs text-destructive">{form.formState.errors.capabilitiesSection.title.message}</p> : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-capabilities-description">Description</Label>
                <Textarea id="svc-capabilities-description" rows={3} aria-invalid={!!form.formState.errors.capabilitiesSection?.description} {...form.register('capabilitiesSection.description')} />
                {form.formState.errors.capabilitiesSection?.description ? <p className="text-xs text-destructive">{form.formState.errors.capabilitiesSection.description.message}</p> : null}
              </div>
            </div>

            <StringListField
              id="svc-capabilities-items"
              label="Capability items"
              values={form.watch('capabilitiesSection.items')}
              onChange={(values) => form.setValue('capabilitiesSection.items', values, { shouldDirty: true, shouldValidate: true })}
              error={form.formState.errors.capabilitiesSection?.items?.message}
            />

            <CapabilitiesTableEditor
              table={form.watch('capabilitiesSection.table')}
              onChange={(table) => form.setValue('capabilitiesSection.table', table, { shouldDirty: true, shouldValidate: true })}
              error={form.formState.errors.capabilitiesSection?.table?.headers?.message ?? form.formState.errors.capabilitiesSection?.table?.rows?.message}
            />
          </FormSection>

          <FormSection id="svc-section-home" title="Home Capabilities" description="Optionally feature this service in the homepage capabilities section. Maximum 6 services.">
            <div className="flex items-center justify-between rounded-[18px] border border-border/70 bg-muted/[0.12] px-4 py-4">
              <div className="flex items-start gap-3 pr-6">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                  <Sparkles className="size-4" strokeWidth={1.8} />
                </div>

                <div>
                  <Label htmlFor="svc-home-visible">Show in Home Capabilities</Label>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Enable this service as one of the highlighted capabilities on the homepage.</p>
                </div>
              </div>

              <Switch id="svc-home-visible" checked={homeVisible} onCheckedChange={(checked) => form.setValue('homeCapability.isVisible', checked, { shouldDirty: true, shouldValidate: true })} />
            </div>

            {homeVisible ? (
              <div className="mt-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="svc-home-title">Home title</Label>
                  <Input id="svc-home-title" className="h-11" aria-invalid={!!form.formState.errors.homeCapability?.title} {...form.register('homeCapability.title')} />
                  {form.formState.errors.homeCapability?.title ? <p className="text-xs text-destructive">{form.formState.errors.homeCapability.title.message}</p> : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="svc-home-order">Home display order</Label>
                  <Input id="svc-home-order" type="number" min={0} className="h-11" aria-invalid={!!form.formState.errors.homeCapability?.displayOrder} {...form.register('homeCapability.displayOrder', { valueAsNumber: true })} />
                  {form.formState.errors.homeCapability?.displayOrder ? <p className="text-xs text-destructive">{form.formState.errors.homeCapability.displayOrder.message}</p> : null}
                </div>

                <div className="flex flex-col gap-1.5 lg:col-span-2">
                  <Label htmlFor="svc-home-shortDescription">Home short description</Label>
                  <Textarea id="svc-home-shortDescription" rows={3} aria-invalid={!!form.formState.errors.homeCapability?.shortDescription} {...form.register('homeCapability.shortDescription')} />
                  {form.formState.errors.homeCapability?.shortDescription ? <p className="text-xs text-destructive">{form.formState.errors.homeCapability.shortDescription.message}</p> : null}
                </div>

                <div className="lg:col-span-2">
                  <div className="flex items-start gap-3 rounded-[16px] border border-info/15 bg-info-subtle px-4 py-3">
                    <Eye className="mt-0.5 size-4 shrink-0 text-info" strokeWidth={1.8} />

                    <div>
                      <p className="text-xs font-semibold text-foreground">Homepage visibility enabled</p>
                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">This service will consume one of the six available Home Capabilities positions once saved and active.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </FormSection>

          <FormActions onCancel={onCancel} submitLabel={isEditing ? 'Save changes' : 'Create service'} isSubmitting={isSubmitting} sticky />
        </div>
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