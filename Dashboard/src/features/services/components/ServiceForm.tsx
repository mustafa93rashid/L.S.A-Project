import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
import {
  useCreateServiceMutation,
  useUpdateServiceMutation,
} from '@/features/services/queries'
import { serviceSchema, type ServiceInput } from '@/features/services/schema'
import type { Service } from '@/features/services/types'
import { CapabilitiesTableEditor } from '@/features/services/components/CapabilitiesTableEditor'

interface ServiceFormProps {
  /** Present when editing — absent means "create". */
  service?: Service | null
  onSuccess: () => void
  onCancel: () => void
}

const emptyDefaults: ServiceInput = {
  title: '',
  slug: '',
  serviceCard: { label: '', description: '', highlights: [''], imageAlt: '' },
  heroSection: { title: '', description: '', imageAlt: '' },
  deliveryProcessSection: {
    title: '',
    description: '',
    steps: [{ title: '', description: '', icon: '' }],
  },
  capabilitiesSection: {
    title: '',
    description: '',
    items: [''],
    table: { headers: [''], rows: [] },
  },
  homeCapability: { isVisible: false, title: '', shortDescription: '', displayOrder: 0 },
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

/** Shared by ServiceCreatePage and ServiceEditPage. */
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
    // Falls back to each section's empty shape when missing — a record
    // saved outside the normal create/update path can lack sections the
    // Mongoose schema otherwise requires (confirmed live against the real
    // backend), so editing one of those presents blank fields for
    // whatever's missing instead of crashing.
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
          deliveryProcessSection:
            service.deliveryProcessSection ?? emptyDefaults.deliveryProcessSection,
          capabilitiesSection:
            service.capabilitiesSection ?? emptyDefaults.capabilitiesSection,
          homeCapability: service.homeCapability ?? emptyDefaults.homeCapability,
          displayOrder: service.displayOrder,
          isActive: service.isActive,
        }
      : emptyDefaults,
  })

  const guard = useUnsavedChangesGuard(
    form.formState.isDirty || cardImageFile !== null || heroImageFile !== null,
  )

  const homeVisible = form.watch('homeCapability.isVisible')

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
      { cardImage: cardImageFile, heroImage: heroImageFile },
    )

    const onError = (error: unknown) => setFormError(applyServerErrors(form, error))

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
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Service created successfully')
          guard.bypassOnce()
          onSuccess()
        },
        onError,
      })
    }
  })

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

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

      <div className="flex items-start gap-6">
        <SectionNav items={SECTIONS} />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <FormSection id="svc-section-general" title="General">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-title">Title</Label>
              <Input
                id="svc-title"
                aria-invalid={!!form.formState.errors.title}
                {...form.register('title')}
              />
              {form.formState.errors.title ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-slug">Slug</Label>
              <Input
                id="svc-slug"
                placeholder="e.g. pipeline-services"
                aria-invalid={!!form.formState.errors.slug}
                {...form.register('slug')}
              />
              {form.formState.errors.slug ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.slug.message}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-order">Display order</Label>
                <Input
                  id="svc-order"
                  type="number"
                  min={0}
                  max={999}
                  {...form.register('displayOrder', { valueAsNumber: true })}
                />
              </div>
              <div className="flex items-center justify-between self-end pb-2">
                <Label htmlFor="svc-active" className="pr-2">
                  Active
                </Label>
                <Switch
                  id="svc-active"
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) => form.setValue('isActive', checked)}
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            id="svc-section-card"
            title="Service Card"
            description="The compact card shown on the Services list page."
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-card-label">Label</Label>
              <Input
                id="svc-card-label"
                aria-invalid={!!form.formState.errors.serviceCard?.label}
                {...form.register('serviceCard.label')}
              />
              {form.formState.errors.serviceCard?.label ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.serviceCard.label.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-card-description">Description</Label>
              <Textarea
                id="svc-card-description"
                rows={2}
                aria-invalid={!!form.formState.errors.serviceCard?.description}
                {...form.register('serviceCard.description')}
              />
              {form.formState.errors.serviceCard?.description ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.serviceCard.description.message}
                </p>
              ) : null}
            </div>
            <StringListField
              id="svc-card-highlights"
              label="Highlights"
              values={form.watch('serviceCard.highlights')}
              onChange={(values) =>
                form.setValue('serviceCard.highlights', values, { shouldValidate: true })
              }
              error={form.formState.errors.serviceCard?.highlights?.message}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-card-image">
                Card image{isEditing ? ' (leave empty to keep current)' : ''}
              </Label>
              {service?.serviceCard?.image.url ? (
                <img
                  src={cloudinaryThumbnail(service.serviceCard.image.url, 96)}
                  alt={service.serviceCard.image.alt}
                  className="h-24 w-24 rounded-md border border-border object-cover"
                />
              ) : null}
              <input
                id="svc-card-image"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange(setCardImageFile)}
                className="rounded-md border border-input bg-transparent px-2.5 py-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-secondary-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-card-imageAlt">Card image alt text</Label>
              <Input id="svc-card-imageAlt" {...form.register('serviceCard.imageAlt')} />
            </div>
          </FormSection>

          <FormSection
            id="svc-section-hero"
            title="Hero Section"
            description="Shown at the top of the service's detail page."
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-hero-title">Title</Label>
              <Input
                id="svc-hero-title"
                aria-invalid={!!form.formState.errors.heroSection?.title}
                {...form.register('heroSection.title')}
              />
              {form.formState.errors.heroSection?.title ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.heroSection.title.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-hero-description">Description</Label>
              <Textarea
                id="svc-hero-description"
                rows={3}
                aria-invalid={!!form.formState.errors.heroSection?.description}
                {...form.register('heroSection.description')}
              />
              {form.formState.errors.heroSection?.description ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.heroSection.description.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-hero-image">
                Hero image{isEditing ? ' (leave empty to keep current)' : ''}
              </Label>
              {service?.heroSection?.image.url ? (
                <img
                  src={cloudinaryThumbnail(service.heroSection.image.url, 96)}
                  alt={service.heroSection.image.alt}
                  className="h-24 w-24 rounded-md border border-border object-cover"
                />
              ) : null}
              <input
                id="svc-hero-image"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange(setHeroImageFile)}
                className="rounded-md border border-input bg-transparent px-2.5 py-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-secondary-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-hero-imageAlt">Hero image alt text</Label>
              <Input id="svc-hero-imageAlt" {...form.register('heroSection.imageAlt')} />
            </div>
          </FormSection>

          <FormSection id="svc-section-delivery" title="Delivery Process">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-delivery-title">Title</Label>
              <Input
                id="svc-delivery-title"
                aria-invalid={!!form.formState.errors.deliveryProcessSection?.title}
                {...form.register('deliveryProcessSection.title')}
              />
              {form.formState.errors.deliveryProcessSection?.title ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.deliveryProcessSection.title.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-delivery-description">Description</Label>
              <Textarea
                id="svc-delivery-description"
                rows={2}
                aria-invalid={!!form.formState.errors.deliveryProcessSection?.description}
                {...form.register('deliveryProcessSection.description')}
              />
              {form.formState.errors.deliveryProcessSection?.description ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.deliveryProcessSection.description.message}
                </p>
              ) : null}
            </div>
            <StepsEditor
              label="Delivery process steps"
              itemLabel="Step"
              values={form.watch('deliveryProcessSection.steps')}
              onChange={(steps) =>
                form.setValue('deliveryProcessSection.steps', steps, {
                  shouldValidate: true,
                })
              }
              error={form.formState.errors.deliveryProcessSection?.steps?.message}
            />
          </FormSection>

          <FormSection id="svc-section-capabilities" title="Capabilities">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-capabilities-title">Title</Label>
              <Input
                id="svc-capabilities-title"
                aria-invalid={!!form.formState.errors.capabilitiesSection?.title}
                {...form.register('capabilitiesSection.title')}
              />
              {form.formState.errors.capabilitiesSection?.title ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.capabilitiesSection.title.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-capabilities-description">Description</Label>
              <Textarea
                id="svc-capabilities-description"
                rows={2}
                aria-invalid={!!form.formState.errors.capabilitiesSection?.description}
                {...form.register('capabilitiesSection.description')}
              />
              {form.formState.errors.capabilitiesSection?.description ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.capabilitiesSection.description.message}
                </p>
              ) : null}
            </div>
            <StringListField
              id="svc-capabilities-items"
              label="Capability items"
              values={form.watch('capabilitiesSection.items')}
              onChange={(values) =>
                form.setValue('capabilitiesSection.items', values, {
                  shouldValidate: true,
                })
              }
              error={form.formState.errors.capabilitiesSection?.items?.message}
            />
            <CapabilitiesTableEditor
              table={form.watch('capabilitiesSection.table')}
              onChange={(table) =>
                form.setValue('capabilitiesSection.table', table, {
                  shouldValidate: true,
                })
              }
              error={
                form.formState.errors.capabilitiesSection?.table?.headers?.message ??
                form.formState.errors.capabilitiesSection?.table?.rows?.message
              }
            />
          </FormSection>

          <FormSection
            id="svc-section-home"
            title="Home Capabilities"
            description="Optionally feature this service in the homepage's capabilities strip (max 6 services)."
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="svc-home-visible">Show in Home Capabilities</Label>
              <Switch
                id="svc-home-visible"
                checked={homeVisible}
                onCheckedChange={(checked) =>
                  form.setValue('homeCapability.isVisible', checked, {
                    shouldValidate: true,
                  })
                }
              />
            </div>
            {homeVisible ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="svc-home-title">Home title</Label>
                  <Input
                    id="svc-home-title"
                    aria-invalid={!!form.formState.errors.homeCapability?.title}
                    {...form.register('homeCapability.title')}
                  />
                  {form.formState.errors.homeCapability?.title ? (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.homeCapability.title.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="svc-home-shortDescription">
                    Home short description
                  </Label>
                  <Textarea
                    id="svc-home-shortDescription"
                    rows={2}
                    aria-invalid={
                      !!form.formState.errors.homeCapability?.shortDescription
                    }
                    {...form.register('homeCapability.shortDescription')}
                  />
                  {form.formState.errors.homeCapability?.shortDescription ? (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.homeCapability.shortDescription.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="svc-home-order">Home display order</Label>
                  <Input
                    id="svc-home-order"
                    type="number"
                    min={0}
                    {...form.register('homeCapability.displayOrder', {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </>
            ) : null}
          </FormSection>

          <FormActions
            onCancel={onCancel}
            submitLabel={isEditing ? 'Save changes' : 'Create service'}
            isSubmitting={isSubmitting}
            sticky
          />
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
