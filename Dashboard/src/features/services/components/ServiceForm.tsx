import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Hash,
  Home,
  ImagePlus,
  Link2,
  PanelsTopLeft,
  Settings2,
  Sparkles,
  TableProperties,
  Tag,
  Workflow,
} from 'lucide-react'

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FieldError } from '@/components/forms/FieldError'
import { FormErrorAlert } from '@/components/forms/FormErrorAlert'
import { FormSection } from '@/components/forms/FormSection'
import { FormStepper, type FormStep } from '@/components/forms/FormStepper'
import { FormStepNavigation } from '@/components/forms/FormStepNavigation'
import { ImageUploadField } from '@/components/forms/ImageUploadField'
import { StringListField } from '@/components/forms/StringListField'
import { StepsEditor } from '@/components/forms/StepsEditor'
import { VisibilityToggle } from '@/components/forms/VisibilityToggle'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

import { useCreateServiceMutation, useUpdateServiceMutation } from '@/features/services/queries'
import { serviceSchema, type ServiceInput } from '@/features/services/schema'
import type { Service } from '@/features/services/types'
import { CapabilitiesTableEditor } from '@/features/services/components/CapabilitiesTableEditor'

interface ServiceFormProps {
  service?: Service | null
  onSuccess: () => void
}

interface StepFieldError {
  title?: string
  description?: string
  icon?: string
}

// ==================== Steps ====================

const STEPS: FormStep[] = [
  { key: 'general', label: 'General', icon: Settings2 },
  { key: 'card', label: 'Card', icon: PanelsTopLeft },
  { key: 'hero', label: 'Hero', icon: ImagePlus },
  { key: 'delivery', label: 'Process', icon: Workflow },
  { key: 'capabilities', label: 'Capabilities', icon: TableProperties },
  { key: 'home', label: 'Homepage', icon: Home },
]

// ==================== Default Values ====================

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

// ==================== Array Error ====================

function getArrayErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined

  const candidate = error as {
    message?: unknown
    root?: {
      message?: unknown
    }
  }

  if (typeof candidate.message === 'string') return candidate.message
  if (typeof candidate.root?.message === 'string') return candidate.root.message

  return undefined
}

// ==================== String Item Errors ====================

function getStringItemErrors(error: unknown): Array<string | undefined> {
  if (!Array.isArray(error)) return []

  return error.map((item) => {
    if (!item || typeof item !== 'object') return undefined

    const candidate = item as {
      message?: unknown
    }

    return typeof candidate.message === 'string' ? candidate.message : undefined
  })
}

// ==================== Step Item Errors ====================

function getStepItemErrors(error: unknown): StepFieldError[] {
  if (!Array.isArray(error)) return []

  return error.map((item) => {
    if (!item || typeof item !== 'object') return {}

    const candidate = item as {
      title?: { message?: unknown }
      description?: { message?: unknown }
      icon?: { message?: unknown }
    }

    return {
      title: typeof candidate.title?.message === 'string' ? candidate.title.message : undefined,
      description:
        typeof candidate.description?.message === 'string'
          ? candidate.description.message
          : undefined,
      icon: typeof candidate.icon?.message === 'string' ? candidate.icon.message : undefined,
    }
  })
}

// ==================== Service Form ====================

export function ServiceForm({ service, onSuccess }: ServiceFormProps) {
  const isEditing = Boolean(service)

  // ==================== Step State ====================

  const [currentStep, setCurrentStep] = useState(0)
  const [completedStep, setCompletedStep] = useState(-1)

  // ==================== Error State ====================

  const [formError, setFormError] = useState<string | null>(null)
  const [cardImageError, setCardImageError] = useState<string | null>(null)
  const [heroImageError, setHeroImageError] = useState<string | null>(null)

  // ==================== File State ====================

  const [cardImageFile, setCardImageFile] = useState<File | null>(null)
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)

  // ==================== Mutations ====================

  const createMutation = useCreateServiceMutation()
  const updateMutation = useUpdateServiceMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // ==================== Form ====================

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

  const isActive = form.watch('isActive') ?? true
  const homeVisible = form.watch('homeCapability.isVisible') ?? false

  // ==================== Unsaved Changes ====================

  const guard = useUnsavedChangesGuard(
    form.formState.isDirty || cardImageFile !== null || heroImageFile !== null,
  )

  // ==================== Scroll To Top ====================

  const scrollFormToTop = () => {
    const main = document.querySelector('main')

    if (main) {
      main.scrollTo({
        top: 0,
        behavior: 'smooth',
      })

      return
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // ==================== Validate Current Step ====================

  const validateCurrentStep = async (): Promise<boolean> => {
    setFormError(null)

    switch (currentStep) {
      case 0:
        return form.trigger(['title', 'slug', 'displayOrder', 'isActive'])

      case 1: {
        const valid = await form.trigger([
          'serviceCard.label',
          'serviceCard.description',
          'serviceCard.highlights',
          'serviceCard.imageAlt',
        ])

        const hasImage = Boolean(cardImageFile) || Boolean(service?.serviceCard?.image?.url)

        setCardImageError(hasImage ? null : 'Service card image is required.')

        return valid && hasImage
      }

      case 2: {
        const valid = await form.trigger([
          'heroSection.title',
          'heroSection.description',
          'heroSection.imageAlt',
        ])

        const hasImage = Boolean(heroImageFile) || Boolean(service?.heroSection?.image?.url)

        setHeroImageError(hasImage ? null : 'Service hero image is required.')

        return valid && hasImage
      }

      case 3:
        return form.trigger([
          'deliveryProcessSection.title',
          'deliveryProcessSection.description',
          'deliveryProcessSection.steps',
        ])

      case 4:
        return form.trigger([
          'capabilitiesSection.title',
          'capabilitiesSection.description',
          'capabilitiesSection.items',
          'capabilitiesSection.table',
        ])

      case 5:
        return form.trigger([
          'homeCapability.isVisible',
          'homeCapability.title',
          'homeCapability.shortDescription',
          'homeCapability.displayOrder',
        ])

      default:
        return true
    }
  }

  // ==================== Next Step ====================

  const handleNext = async () => {
    const valid = await validateCurrentStep()

    if (!valid) return

    setCompletedStep((current) => Math.max(current, currentStep))
    setCurrentStep((current) => Math.min(current + 1, STEPS.length - 1))
    scrollFormToTop()
  }

  // ==================== Previous Step ====================

  const handlePrevious = () => {
    setCurrentStep((current) => Math.max(current - 1, 0))
    setFormError(null)
    scrollFormToTop()
  }

  // ==================== Step Click ====================

  const handleStepClick = (index: number) => {
    if (index > completedStep + 1) return

    setCurrentStep(index)
    setFormError(null)
    scrollFormToTop()
  }

  // ==================== Submit ====================

  const onSubmit = form.handleSubmit(
    (values) => {
      const needsCardImage = !cardImageFile && !service?.serviceCard?.image?.url
      const needsHeroImage = !heroImageFile && !service?.heroSection?.image?.url

      if (needsCardImage) {
        setCardImageError('Service card image is required.')
      }

      if (needsHeroImage) {
        setHeroImageError('Service hero image is required.')
      }

      if (needsCardImage || needsHeroImage) {
        setCurrentStep(needsCardImage ? 1 : 2)
        scrollFormToTop()
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

      // ==================== Server Error ====================

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

      // ==================== Update ====================

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

      // ==================== Create ====================

      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Service created successfully')
          guard.bypassOnce()
          onSuccess()
        },
        onError,
      })
    },

    // ==================== Client Validation Error ====================

    (errors) => {
      if (errors.title || errors.slug || errors.displayOrder || errors.isActive) {
        setCurrentStep(0)
        scrollFormToTop()
        return
      }

      if (errors.serviceCard) {
        setCurrentStep(1)
        scrollFormToTop()
        return
      }

      if (errors.heroSection) {
        setCurrentStep(2)
        scrollFormToTop()
        return
      }

      if (errors.deliveryProcessSection) {
        setCurrentStep(3)
        scrollFormToTop()
        return
      }

      if (errors.capabilitiesSection) {
        setCurrentStep(4)
        scrollFormToTop()
        return
      }

      if (errors.homeCapability) {
        setCurrentStep(5)
        scrollFormToTop()
      }
    },
  )

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      noValidate
      className="flex min-w-0 flex-col gap-5 overflow-x-hidden"
    >
      {/* ==================== Stepper ==================== */}

      <FormStepper
        steps={STEPS}
        currentStep={currentStep}
        completedStep={completedStep}
        onStepClick={handleStepClick}
      />

      {/* ==================== General Form Error ==================== */}

      <FormErrorAlert title="Unable to save service" message={formError} />

      {/* ==================== Step Content ==================== */}

      <div className="min-w-0">
        {/* ==================== Step 1 - General Information ==================== */}

        {currentStep === 0 ? (
          <FormSection
            title="General Information"
            description="Define the service identity, ordering and public visibility."
            icon={Settings2}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Title And Slug ==================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ==================== Service Title ==================== */}

                <div className="space-y-2">
                  <Label htmlFor="svc-title" className="text-[12px] font-semibold">
                    Service title
                  </Label>

                  <div className="group relative">
                    <Tag
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                      strokeWidth={1.8}
                    />

                    <Input
                      id="svc-title"
                      placeholder="e.g. Pipeline Services"
                      className="h-11 rounded-xl pl-10"
                      aria-invalid={!!form.formState.errors.title}
                      {...form.register('title')}
                    />
                  </div>

                  <FieldError message={form.formState.errors.title?.message} />
                </div>

                {/* ==================== Slug ==================== */}

                <div className="space-y-2">
                  <Label htmlFor="svc-slug" className="text-[12px] font-semibold">
                    Slug
                  </Label>

                  <div className="group relative">
                    <Link2
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                      strokeWidth={1.8}
                    />

                    <Input
                      id="svc-slug"
                      placeholder="pipeline-services"
                      className="h-11 rounded-xl pl-10 font-mono text-xs"
                      aria-invalid={!!form.formState.errors.slug}
                      {...form.register('slug')}
                    />
                  </div>

                  <FieldError message={form.formState.errors.slug?.message} />
                </div>
              </div>

              {/* ==================== Ordering And Visibility ==================== */}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* ==================== Display Order ==================== */}

                <div className="rounded-2xl border border-border/70 bg-muted/[0.06] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                      <Hash className="size-4" strokeWidth={1.8} />
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-foreground">
                        Display order
                      </p>

                      <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                        Lower numbers appear first in the public service collection.
                      </p>
                    </div>
                  </div>

                  <Input
                    id="svc-order"
                    type="number"
                    min={0}
                    max={999}
                    className="mt-4 h-11 rounded-xl bg-background text-center text-base font-semibold tabular-nums"
                    aria-invalid={!!form.formState.errors.displayOrder}
                    {...form.register('displayOrder', {
                      valueAsNumber: true,
                    })}
                  />

                  <FieldError message={form.formState.errors.displayOrder?.message} />
                </div>

                {/* ==================== Public Visibility ==================== */}

                <VisibilityToggle
                  id="svc-active"
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    form.setValue('isActive', checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  title="Public visibility"
                  activeDescription="This service is visible on the public website."
                  inactiveDescription="This service is hidden from the public website."
                  activeLabel="Visible"
                  inactiveLabel="Hidden"
                />
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 2 - Service Card ==================== */}

        {currentStep === 1 ? (
          <FormSection
            title="Service Card"
            description="Configure the content displayed inside the public services collection."
            icon={PanelsTopLeft}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Label And Image Alt ==================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ==================== Card Label ==================== */}

                <div className="space-y-2">
                  <Label htmlFor="svc-card-label" className="text-[12px] font-semibold">
                    Card label
                  </Label>

                  <Input
                    id="svc-card-label"
                    placeholder="e.g. Pipeline Solutions"
                    className="h-11 rounded-xl"
                    aria-invalid={!!form.formState.errors.serviceCard?.label}
                    {...form.register('serviceCard.label')}
                  />

                  <FieldError message={form.formState.errors.serviceCard?.label?.message} />
                </div>

                {/* ==================== Image Alt Text ==================== */}

                <div className="space-y-2">
                  <Label htmlFor="svc-card-alt" className="text-[12px] font-semibold">
                    Image alt text
                  </Label>

                  <Input
                    id="svc-card-alt"
                    placeholder="Describe the card image"
                    className="h-11 rounded-xl"
                    aria-invalid={!!form.formState.errors.serviceCard?.imageAlt}
                    {...form.register('serviceCard.imageAlt')}
                  />

                  <FieldError
                    message={form.formState.errors.serviceCard?.imageAlt?.message}
                  />
                </div>
              </div>

              {/* ==================== Card Description ==================== */}

              <div className="space-y-2">
                <Label htmlFor="svc-card-description" className="text-[12px] font-semibold">
                  Description
                </Label>

                <Textarea
                  id="svc-card-description"
                  rows={4}
                  className="min-h-[120px] resize-y rounded-xl"
                  aria-invalid={!!form.formState.errors.serviceCard?.description}
                  {...form.register('serviceCard.description')}
                />

                <FieldError
                  message={form.formState.errors.serviceCard?.description?.message}
                />
              </div>

              {/* ==================== Card Highlights ==================== */}

              <div className="rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <StringListField
                  id="svc-card-highlights"
                  label="Card highlights"
                  placeholder="Highlight"
                  addLabel="Add highlight"
                  maxItems={10}
                  values={form.watch('serviceCard.highlights') ?? ['']}
                  onChange={(values) =>
                    form.setValue('serviceCard.highlights', values, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  error={getArrayErrorMessage(
                    form.formState.errors.serviceCard?.highlights,
                  )}
                  itemErrors={getStringItemErrors(
                    form.formState.errors.serviceCard?.highlights,
                  )}
                />
              </div>

              {/* ==================== Service Card Image ==================== */}

              <ImageUploadField
                id="svc-card-image"
                title="Service card image"
                description="Click the image area to upload or replace the service card image."
                file={cardImageFile}
                onFileChange={setCardImageFile}
                error={cardImageError}
                onErrorChange={setCardImageError}
                existingUrl={service?.serviceCard?.image?.url}
                existingAlt={service?.serviceCard?.image?.alt ?? 'Service card'}
                placeholderTitle="Add service card image"
                placeholderDescription="Click to select an image"
                acceptedFormatsText="JPEG, PNG, GIF or WebP — maximum file size 5 MB."
                maxWidthClassName="max-w-[420px]"
                aspectClassName="aspect-[16/7]"
                thumbnailWidth={900}
                icon={ImagePlus}
                required
              />
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 3 - Hero Section ==================== */}

        {currentStep === 2 ? (
          <FormSection
            title="Hero Section"
            description="Configure the main visual section displayed at the top of the service page."
            icon={ImagePlus}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Hero Title And Image Alt ==================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ==================== Hero Title ==================== */}

                <div className="space-y-2">
                  <Label htmlFor="svc-hero-title" className="text-[12px] font-semibold">
                    Hero title
                  </Label>

                  <Input
                    id="svc-hero-title"
                    className="h-11 rounded-xl"
                    aria-invalid={!!form.formState.errors.heroSection?.title}
                    {...form.register('heroSection.title')}
                  />

                  <FieldError message={form.formState.errors.heroSection?.title?.message} />
                </div>

                {/* ==================== Hero Image Alt ==================== */}

                <div className="space-y-2">
                  <Label htmlFor="svc-hero-alt" className="text-[12px] font-semibold">
                    Image alt text
                  </Label>

                  <Input
                    id="svc-hero-alt"
                    placeholder="Describe the hero image"
                    className="h-11 rounded-xl"
                    aria-invalid={!!form.formState.errors.heroSection?.imageAlt}
                    {...form.register('heroSection.imageAlt')}
                  />

                  <FieldError
                    message={form.formState.errors.heroSection?.imageAlt?.message}
                  />
                </div>
              </div>

              {/* ==================== Hero Description ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="svc-hero-description"
                  className="text-[12px] font-semibold"
                >
                  Hero description
                </Label>

                <Textarea
                  id="svc-hero-description"
                  rows={5}
                  className="min-h-[140px] resize-y rounded-xl"
                  aria-invalid={!!form.formState.errors.heroSection?.description}
                  {...form.register('heroSection.description')}
                />

                <FieldError
                  message={form.formState.errors.heroSection?.description?.message}
                />
              </div>

              {/* ==================== Hero Image ==================== */}

              <ImageUploadField
                id="svc-hero-image"
                title="Hero image"
                description="Click the image area to upload or replace the service hero image."
                file={heroImageFile}
                onFileChange={setHeroImageFile}
                error={heroImageError}
                onErrorChange={setHeroImageError}
                existingUrl={service?.heroSection?.image?.url}
                existingAlt={service?.heroSection?.image?.alt ?? 'Service hero'}
                placeholderTitle="Add hero image"
                placeholderDescription="Click to select an image"
                acceptedFormatsText="JPEG, PNG, GIF or WebP — maximum file size 5 MB."
                maxWidthClassName="max-w-[500px]"
                aspectClassName="aspect-[16/8]"
                thumbnailWidth={1200}
                icon={ImagePlus}
                required
              />
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 4 - Delivery Process ==================== */}

        {currentStep === 3 ? (
          <FormSection
            title="Delivery Process"
            description="Define the sequence used to deliver this service."
            icon={Workflow}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Delivery Header ==================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ==================== Section Title ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="svc-delivery-title"
                    className="text-[12px] font-semibold"
                  >
                    Section title
                  </Label>

                  <Input
                    id="svc-delivery-title"
                    className="h-11 rounded-xl"
                    aria-invalid={
                      !!form.formState.errors.deliveryProcessSection?.title
                    }
                    {...form.register('deliveryProcessSection.title')}
                  />

                  <FieldError
                    message={
                      form.formState.errors.deliveryProcessSection?.title?.message
                    }
                  />
                </div>

                {/* ==================== Section Description ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="svc-delivery-description"
                    className="text-[12px] font-semibold"
                  >
                    Description
                  </Label>

                  <Textarea
                    id="svc-delivery-description"
                    rows={3}
                    className="min-h-[90px] resize-y rounded-xl"
                    aria-invalid={
                      !!form.formState.errors.deliveryProcessSection?.description
                    }
                    {...form.register('deliveryProcessSection.description')}
                  />

                  <FieldError
                    message={
                      form.formState.errors.deliveryProcessSection?.description
                        ?.message
                    }
                  />
                </div>
              </div>

              {/* ==================== Delivery Steps ==================== */}

              <div className="rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <StepsEditor
                  label="Delivery process steps"
                  itemLabel="Step"
                  maxItems={12}
                  values={form.watch('deliveryProcessSection.steps') ?? []}
                  onChange={(steps) =>
                    form.setValue('deliveryProcessSection.steps', steps, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  error={getArrayErrorMessage(
                    form.formState.errors.deliveryProcessSection?.steps,
                  )}
                  itemErrors={getStepItemErrors(
                    form.formState.errors.deliveryProcessSection?.steps,
                  )}
                />
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 5 - Capabilities ==================== */}

        {currentStep === 4 ? (
          <FormSection
            title="Capabilities"
            description="Configure technical capabilities and structured service data."
            icon={TableProperties}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Capabilities Header ==================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ==================== Capabilities Title ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="svc-capabilities-title"
                    className="text-[12px] font-semibold"
                  >
                    Section title
                  </Label>

                  <Input
                    id="svc-capabilities-title"
                    className="h-11 rounded-xl"
                    aria-invalid={!!form.formState.errors.capabilitiesSection?.title}
                    {...form.register('capabilitiesSection.title')}
                  />

                  <FieldError
                    message={form.formState.errors.capabilitiesSection?.title?.message}
                  />
                </div>

                {/* ==================== Capabilities Description ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="svc-capabilities-description"
                    className="text-[12px] font-semibold"
                  >
                    Description
                  </Label>

                  <Textarea
                    id="svc-capabilities-description"
                    rows={3}
                    className="min-h-[90px] resize-y rounded-xl"
                    aria-invalid={
                      !!form.formState.errors.capabilitiesSection?.description
                    }
                    {...form.register('capabilitiesSection.description')}
                  />

                  <FieldError
                    message={
                      form.formState.errors.capabilitiesSection?.description?.message
                    }
                  />
                </div>
              </div>

              {/* ==================== Capability Items ==================== */}

              <div className="rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <StringListField
                  id="svc-capabilities-items"
                  label="Capability items"
                  placeholder="Capability"
                  addLabel="Add capability"
                  maxItems={20}
                  values={form.watch('capabilitiesSection.items') ?? ['']}
                  onChange={(values) =>
                    form.setValue('capabilitiesSection.items', values, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  error={getArrayErrorMessage(
                    form.formState.errors.capabilitiesSection?.items,
                  )}
                  itemErrors={getStringItemErrors(
                    form.formState.errors.capabilitiesSection?.items,
                  )}
                />
              </div>

              {/* ==================== Capabilities Table ==================== */}

              <div className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <CapabilitiesTableEditor
                  table={form.watch('capabilitiesSection.table')}
                  onChange={(table) =>
                    form.setValue('capabilitiesSection.table', table, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  error={
                    form.formState.errors.capabilitiesSection?.table?.headers
                      ?.message ??
                    form.formState.errors.capabilitiesSection?.table?.rows?.message
                  }
                />
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 6 - Home Capabilities ==================== */}

        {currentStep === 5 ? (
          <FormSection
            title="Home Capabilities"
            description="Configure optional homepage placement for this service."
            icon={Home}
            className="min-w-0"
          >
            <div className="space-y-5">
              {/* ==================== Homepage Visibility ==================== */}

              <div
                className={`rounded-2xl border p-4 transition-colors ${
                  homeVisible
                    ? 'border-info/20 bg-info/[0.035]'
                    : 'border-border/70 bg-muted/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                        homeVisible
                          ? 'border-info/15 bg-info-subtle text-info'
                          : 'border-border/70 bg-background text-muted-foreground'
                      }`}
                    >
                      <Sparkles className="size-4" strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0">
                      <Label
                        htmlFor="svc-home-visible"
                        className="cursor-pointer text-[11px] font-semibold"
                      >
                        Show in Home Capabilities
                      </Label>

                      <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                        Feature this service as one of the highlighted homepage
                        capabilities.
                      </p>
                    </div>
                  </div>

                  <Switch
                    id="svc-home-visible"
                    checked={homeVisible}
                    onCheckedChange={(checked) =>
                      form.setValue('homeCapability.isVisible', checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                </div>
              </div>

              {/* ==================== Homepage Fields ==================== */}

              {homeVisible ? (
                <div className="space-y-5 rounded-2xl border border-info/15 bg-info/[0.02] p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_180px]">
                    {/* ==================== Home Title ==================== */}

                    <div className="space-y-2">
                      <Label
                        htmlFor="svc-home-title"
                        className="text-[12px] font-semibold"
                      >
                        Home title
                      </Label>

                      <Input
                        id="svc-home-title"
                        className="h-11 rounded-xl bg-background"
                        aria-invalid={!!form.formState.errors.homeCapability?.title}
                        {...form.register('homeCapability.title')}
                      />

                      <FieldError
                        message={form.formState.errors.homeCapability?.title?.message}
                      />
                    </div>

                    {/* ==================== Home Display Order ==================== */}

                    <div className="space-y-2">
                      <Label
                        htmlFor="svc-home-order"
                        className="text-[12px] font-semibold"
                      >
                        Display order
                      </Label>

                      <div className="relative">
                        <Hash
                          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45"
                          strokeWidth={1.8}
                        />

                        <Input
                          id="svc-home-order"
                          type="number"
                          min={0}
                          className="h-11 rounded-xl bg-background pl-10"
                          aria-invalid={
                            !!form.formState.errors.homeCapability?.displayOrder
                          }
                          {...form.register('homeCapability.displayOrder', {
                            valueAsNumber: true,
                          })}
                        />
                      </div>

                      <FieldError
                        message={
                          form.formState.errors.homeCapability?.displayOrder?.message
                        }
                      />
                    </div>
                  </div>

                  {/* ==================== Home Short Description ==================== */}

                  <div className="space-y-2">
                    <Label
                      htmlFor="svc-home-description"
                      className="text-[12px] font-semibold"
                    >
                      Short description
                    </Label>

                    <Textarea
                      id="svc-home-description"
                      rows={4}
                      className="min-h-[110px] resize-y rounded-xl bg-background"
                      aria-invalid={
                        !!form.formState.errors.homeCapability?.shortDescription
                      }
                      {...form.register('homeCapability.shortDescription')}
                    />

                    <FieldError
                      message={
                        form.formState.errors.homeCapability?.shortDescription
                          ?.message
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </FormSection>
        ) : null}
      </div>

      {/* ==================== Actions ==================== */}

      <FormStepNavigation
        currentStep={currentStep}
        totalSteps={STEPS.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        submitLabel={isEditing ? 'Save changes' : 'Create service'}
      />

      {/* ==================== Confirm Dialog ==================== */}

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