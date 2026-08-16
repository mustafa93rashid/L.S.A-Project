import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  BriefcaseBusiness,
  CalendarDays,
  FileCheck2,
  FolderKanban,
  GalleryHorizontalEnd,
  Hash,
  ImagePlus,
  Link2,
  MapPin,
  PanelsTopLeft,
  Settings2,
  Sparkles,
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
import { StepsEditor } from '@/components/forms/StepsEditor'
import { VisibilityToggle } from '@/components/forms/VisibilityToggle'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

import { useServicesQuery } from '@/features/services/queries'
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from '@/features/projects/queries'
import {
  projectSchema,
  type ProjectInput,
} from '@/features/projects/schema'
import type { Project } from '@/features/projects/types'
import {
  GalleryManager,
  type NewGalleryFile,
} from '@/features/projects/components/GalleryManager'

interface ProjectFormProps {
  project?: Project | null
  onSuccess: () => void
  onCancel?: () => void
}

interface StepFieldError {
  title?: string
  description?: string
  icon?: string
}

// ==================== Steps ====================

const STEPS: FormStep[] = [
  { key: 'general', label: 'General', icon: FolderKanban },
  { key: 'services', label: 'Services', icon: Workflow },
  { key: 'card', label: 'Card', icon: PanelsTopLeft },
  { key: 'hero', label: 'Hero', icon: ImagePlus },
  { key: 'details', label: 'Details', icon: BriefcaseBusiness },
  { key: 'scope', label: 'Scope', icon: FileCheck2 },
  { key: 'gallery', label: 'Gallery', icon: GalleryHorizontalEnd },
  { key: 'certificates', label: 'Certificates', icon: FileCheck2 },
  { key: 'settings', label: 'Settings', icon: Settings2 },
]

// ==================== Default Values ====================

const emptyDefaults: ProjectInput = {
  title: '',
  slug: '',
  categoryLabel: '',
  shortDescription: '',
  description: '',
  services: [],
  heroTitle: '',
  heroDescription: '',
  cardImageAlt: '',
  heroImageAlt: '',
  client: '',
  location: '',
  completionDate: '',
  duration: '',
  status: '',
  detailedScopeTitle: '',
  detailedScopeDescription: '',
  detailedScopeItems: [],
  displayOrder: 0,
  isFeatured: false,
  isActive: true,
}

// ==================== Upload Limits ====================

const GALLERY_MAX = 20
const CERTIFICATE_MAX = 10

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
      title:
        typeof candidate.title?.message === 'string'
          ? candidate.title.message
          : undefined,
      description:
        typeof candidate.description?.message === 'string'
          ? candidate.description.message
          : undefined,
      icon:
        typeof candidate.icon?.message === 'string'
          ? candidate.icon.message
          : undefined,
    }
  })
}

// ==================== Project Form ====================

export function ProjectForm({ project, onSuccess }: ProjectFormProps) {
  const isEditing = Boolean(project)

  // ==================== Step State ====================

  const [currentStep, setCurrentStep] = useState(0)
  const [completedStep, setCompletedStep] = useState(-1)

  // ==================== Error State ====================

  const [formError, setFormError] = useState<string | null>(null)
  const [cardImageError, setCardImageError] = useState<string | null>(null)
  const [heroImageError, setHeroImageError] = useState<string | null>(null)

  // ==================== Image State ====================

  const [cardImageFile, setCardImageFile] = useState<File | null>(null)
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)

  // ==================== Gallery State ====================

  const [galleryNewFiles, setGalleryNewFiles] = useState<NewGalleryFile[]>([])
  const [galleryRemovedPublicIds, setGalleryRemovedPublicIds] = useState<string[]>(
    [],
  )

  // ==================== Certificate State ====================

  const [certificateNewFiles, setCertificateNewFiles] = useState<
    NewGalleryFile[]
  >([])

  const [certificateRemovedPublicIds, setCertificateRemovedPublicIds] = useState<
    string[]
  >([])

  // ==================== Queries ====================

  const { data: services } = useServicesQuery()

  // ==================== Mutations ====================

  const createMutation = useCreateProjectMutation()
  const updateMutation = useUpdateProjectMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // ==================== Form ====================

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          title: project.title,
          slug: project.slug,
          categoryLabel: project.categoryLabel,
          shortDescription: project.shortDescription,
          description: project.description,
          services: project.services.map((service) => service._id),
          heroTitle: project.hero.title,
          heroDescription: project.hero.description,
          cardImageAlt: project.cardImage.alt,
          heroImageAlt: project.hero.image.alt,
          client: project.projectDetails.client ?? '',
          location: project.projectDetails.location ?? '',
          completionDate: project.projectDetails.completionDate
            ? project.projectDetails.completionDate.slice(0, 10)
            : '',
          duration: project.projectDetails.duration ?? '',
          status: project.projectDetails.status ?? '',
          detailedScopeTitle: project.detailedScope.title,
          detailedScopeDescription: project.detailedScope.description,
          detailedScopeItems: project.detailedScope.items,
          displayOrder: project.displayOrder,
          isFeatured: project.isFeatured,
          isActive: project.isActive,
        }
      : emptyDefaults,
  })

  const selectedServiceIds = form.watch('services') ?? []
  const isFeatured = form.watch('isFeatured') ?? false
  const isActive = form.watch('isActive') ?? true

  // ==================== Unsaved Changes ====================

  const guard = useUnsavedChangesGuard(
    form.formState.isDirty ||
      cardImageFile !== null ||
      heroImageFile !== null ||
      galleryNewFiles.length > 0 ||
      galleryRemovedPublicIds.length > 0 ||
      certificateNewFiles.length > 0 ||
      certificateRemovedPublicIds.length > 0,
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
        return form.trigger([
          'title',
          'slug',
          'categoryLabel',
          'shortDescription',
          'description',
        ])

      case 1:
        return form.trigger(['services'])

      case 2: {
        const valid = await form.trigger(['cardImageAlt'])

        const hasImage =
          Boolean(cardImageFile) || Boolean(project?.cardImage?.url)

        setCardImageError(
          hasImage ? null : 'Project card image is required.',
        )

        return valid && hasImage
      }

      case 3: {
        const valid = await form.trigger([
          'heroTitle',
          'heroDescription',
          'heroImageAlt',
        ])

        const hasImage =
          Boolean(heroImageFile) || Boolean(project?.hero?.image?.url)

        setHeroImageError(
          hasImage ? null : 'Project hero image is required.',
        )

        return valid && hasImage
      }

      case 4:
        return form.trigger([
          'client',
          'location',
          'completionDate',
          'duration',
          'status',
        ])

      case 5:
        return form.trigger([
          'detailedScopeTitle',
          'detailedScopeDescription',
          'detailedScopeItems',
        ])

      case 6:
      case 7:
        return true

      case 8:
        return form.trigger([
          'displayOrder',
          'isFeatured',
          'isActive',
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
      const needsCardImage =
        !cardImageFile &&
        !project?.cardImage?.url

      const needsHeroImage =
        !heroImageFile &&
        !project?.hero?.image?.url

      if (needsCardImage) {
        setCardImageError('Project card image is required.')
      }

      if (needsHeroImage) {
        setHeroImageError('Project hero image is required.')
      }

      if (needsCardImage || needsHeroImage) {
        setCurrentStep(needsCardImage ? 2 : 3)
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
          categoryLabel: values.categoryLabel,
          shortDescription: values.shortDescription,
          description: values.description,
          services: values.services,
          heroTitle: values.heroTitle,
          heroDescription: values.heroDescription,
          cardImageAlt: values.cardImageAlt,
          heroImageAlt: values.heroImageAlt,
          projectDetails: {
            client: values.client || null,
            location: values.location || null,
            completionDate: values.completionDate || null,
            duration: values.duration || null,
            status: values.status || null,
          },
          detailedScope: {
            title: values.detailedScopeTitle,
            description: values.detailedScopeDescription,
            items: values.detailedScopeItems,
          },
          galleryAlt:
            galleryNewFiles.length > 0
              ? galleryNewFiles.map((file) => file.alt)
              : undefined,
          certificateAlt:
            certificateNewFiles.length > 0
              ? certificateNewFiles.map((file) => file.alt)
              : undefined,
          removeGalleryPublicIds: isEditing
            ? galleryRemovedPublicIds
            : undefined,
          removeCertificatePublicIds: isEditing
            ? certificateRemovedPublicIds
            : undefined,
          displayOrder: values.displayOrder,
          isFeatured: values.isFeatured,
          isActive: values.isActive,
        },
        {
          cardImage: cardImageFile,
          heroImage: heroImageFile,
        },
      )

      // ==================== Gallery Files ====================

      galleryNewFiles.forEach(({ file }) => {
        formData.append('gallery', file)
      })

      // ==================== Certificate Files ====================

      certificateNewFiles.forEach(({ file }) => {
        formData.append('certificateImages', file)
      })

      // ==================== Server Error ====================

      const onError = (error: unknown) => {
        const generalError = applyServerErrors(form, error, {
          customFields: {
            cardImage: (message: string) => {
              setCardImageError(message)
              setCurrentStep(2)
            },
            heroImage: (message: string) => {
              setHeroImageError(message)
              setCurrentStep((current) => (current === 2 ? current : 3))
            },
          },
        })

        setFormError(generalError)
        scrollFormToTop()
      }

      // ==================== Update ====================

      if (isEditing && project) {
        updateMutation.mutate(
          {
            id: project._id,
            formData,
          },
          {
            onSuccess: () => {
              toast.success('Project updated successfully')
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
          toast.success('Project created successfully')
          guard.bypassOnce()
          onSuccess()
        },
        onError,
      })
    },

    // ==================== Client Validation Error ====================

    (errors) => {
      if (
        errors.title ||
        errors.slug ||
        errors.categoryLabel ||
        errors.shortDescription ||
        errors.description
      ) {
        setCurrentStep(0)
        scrollFormToTop()
        return
      }

      if (errors.services) {
        setCurrentStep(1)
        scrollFormToTop()
        return
      }

      if (errors.cardImageAlt) {
        setCurrentStep(2)
        scrollFormToTop()
        return
      }

      if (
        errors.heroTitle ||
        errors.heroDescription ||
        errors.heroImageAlt
      ) {
        setCurrentStep(3)
        scrollFormToTop()
        return
      }

      if (
        errors.client ||
        errors.location ||
        errors.completionDate ||
        errors.duration ||
        errors.status
      ) {
        setCurrentStep(4)
        scrollFormToTop()
        return
      }

      if (
        errors.detailedScopeTitle ||
        errors.detailedScopeDescription ||
        errors.detailedScopeItems
      ) {
        setCurrentStep(5)
        scrollFormToTop()
        return
      }

      if (
        errors.displayOrder ||
        errors.isFeatured ||
        errors.isActive
      ) {
        setCurrentStep(8)
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

      <FormErrorAlert
        title="Unable to save project"
        message={formError}
      />

      {/* ==================== Step Content ==================== */}

      <div className="min-w-0">
        {/* ==================== Step 1 - General Information ==================== */}

        {currentStep === 0 ? (
          <FormSection
            title="General Information"
            description="Define the project's identity and primary public content."
            icon={FolderKanban}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Title And Slug ==================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ==================== Project Title ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="proj-title"
                    className="text-[12px] font-semibold"
                  >
                    Project title
                  </Label>

                  <div className="group relative">
                    <Tag
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                      strokeWidth={1.8}
                    />

                    <Input
                      id="proj-title"
                      placeholder="e.g. Basra Pipeline Upgrade"
                      className="h-11 rounded-xl pl-10"
                      aria-invalid={!!form.formState.errors.title}
                      {...form.register('title')}
                    />
                  </div>

                  <FieldError
                    message={form.formState.errors.title?.message}
                  />
                </div>

                {/* ==================== Slug ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="proj-slug"
                    className="text-[12px] font-semibold"
                  >
                    Slug
                  </Label>

                  <div className="group relative">
                    <Link2
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                      strokeWidth={1.8}
                    />

                    <Input
                      id="proj-slug"
                      placeholder="basra-pipeline-upgrade"
                      className="h-11 rounded-xl pl-10 font-mono text-xs"
                      aria-invalid={!!form.formState.errors.slug}
                      {...form.register('slug')}
                    />
                  </div>

                  <FieldError
                    message={form.formState.errors.slug?.message}
                  />
                </div>
              </div>

              {/* ==================== Category ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="proj-category"
                  className="text-[12px] font-semibold"
                >
                  Category label
                </Label>

                <Input
                  id="proj-category"
                  placeholder="e.g. Pipeline Services"
                  className="h-11 rounded-xl"
                  aria-invalid={!!form.formState.errors.categoryLabel}
                  {...form.register('categoryLabel')}
                />

                <FieldError
                  message={form.formState.errors.categoryLabel?.message}
                />
              </div>

              {/* ==================== Short Description ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="proj-short-description"
                  className="text-[12px] font-semibold"
                >
                  Short description
                </Label>

                <Textarea
                  id="proj-short-description"
                  rows={3}
                  placeholder="Short description displayed in project cards."
                  className="min-h-[100px] resize-y rounded-xl"
                  aria-invalid={!!form.formState.errors.shortDescription}
                  {...form.register('shortDescription')}
                />

                <FieldError
                  message={form.formState.errors.shortDescription?.message}
                />
              </div>

              {/* ==================== Full Description ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="proj-description"
                  className="text-[12px] font-semibold"
                >
                  Full description
                </Label>

                <Textarea
                  id="proj-description"
                  rows={5}
                  placeholder="Describe the project, objectives, implementation and results."
                  className="min-h-[140px] resize-y rounded-xl"
                  aria-invalid={!!form.formState.errors.description}
                  {...form.register('description')}
                />

                <FieldError
                  message={form.formState.errors.description?.message}
                />
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 2 - Related Services ==================== */}

        {currentStep === 1 ? (
          <FormSection
            title="Related Services"
            description="Select the services related to this project."
            icon={Workflow}
            className="min-w-0"
          >
            {(services ?? []).length === 0 ? (
              <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/[0.04] px-6 text-center">
                <div>
                  <Workflow
                    className="mx-auto size-5 text-muted-foreground/45"
                    strokeWidth={1.6}
                  />

                  <p className="mt-3 text-[11px] font-semibold text-foreground">
                    No services available
                  </p>

                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Create services first if you want to link them to this
                    project.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(services ?? []).map((service) => {
                  const checked = selectedServiceIds.includes(service._id)

                  return (
                    <label
                      key={service._id}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors ${
                        checked
                          ? 'border-foreground/15 bg-muted/40'
                          : 'border-border/70 bg-muted/[0.04] hover:bg-muted/20'
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          form.setValue(
                            'services',
                            value
                              ? [...selectedServiceIds, service._id]
                              : selectedServiceIds.filter(
                                  (id) => id !== service._id,
                                ),
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            },
                          )
                        }}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-foreground">
                          {service.title}
                        </p>

                        <p className="mt-0.5 text-[9px] text-muted-foreground">
                          Related service
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            <FieldError
              message={form.formState.errors.services?.message}
            />
          </FormSection>
        ) : null}

        {/* ==================== Step 3 - Project Card ==================== */}

        {currentStep === 2 ? (
          <FormSection
            title="Project Card"
            description="Configure the image displayed in the public projects collection."
            icon={PanelsTopLeft}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Card Image ==================== */}

              <ImageUploadField
                id="proj-card-image"
                title="Card image"
                description="Click the image area to upload or replace the project card image."
                file={cardImageFile}
                onFileChange={setCardImageFile}
                error={cardImageError}
                onErrorChange={setCardImageError}
                existingUrl={project?.cardImage?.url}
                existingAlt={project?.cardImage?.alt ?? 'Project card'}
                placeholderTitle="Add project card image"
                placeholderDescription="Click to select an image"
                acceptedFormatsText="JPEG, PNG, GIF or WebP — maximum file size 5 MB."
                maxWidthClassName="max-w-[420px]"
                aspectClassName="aspect-[16/8]"
                thumbnailWidth={900}
                icon={ImagePlus}
                required
              />

              {/* ==================== Card Image Alt ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="proj-card-alt"
                  className="text-[12px] font-semibold"
                >
                  Image alt text
                </Label>

                <Input
                  id="proj-card-alt"
                  placeholder="Describe the project card image"
                  className="h-11 rounded-xl"
                  aria-invalid={!!form.formState.errors.cardImageAlt}
                  {...form.register('cardImageAlt')}
                />

                <FieldError
                  message={form.formState.errors.cardImageAlt?.message}
                />
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 4 - Hero Section ==================== */}

        {currentStep === 3 ? (
          <FormSection
            title="Hero Section"
            description="Configure the main section displayed at the top of the project details page."
            icon={ImagePlus}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Hero Title ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="proj-hero-title"
                  className="text-[12px] font-semibold"
                >
                  Hero title
                </Label>

                <Input
                  id="proj-hero-title"
                  className="h-11 rounded-xl"
                  aria-invalid={!!form.formState.errors.heroTitle}
                  {...form.register('heroTitle')}
                />

                <FieldError
                  message={form.formState.errors.heroTitle?.message}
                />
              </div>

              {/* ==================== Hero Description ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="proj-hero-description"
                  className="text-[12px] font-semibold"
                >
                  Hero description
                </Label>

                <Textarea
                  id="proj-hero-description"
                  rows={4}
                  className="min-h-[120px] resize-y rounded-xl"
                  aria-invalid={!!form.formState.errors.heroDescription}
                  {...form.register('heroDescription')}
                />

                <FieldError
                  message={form.formState.errors.heroDescription?.message}
                />
              </div>

              {/* ==================== Hero Image ==================== */}

              <ImageUploadField
                id="proj-hero-image"
                title="Hero image"
                description="Click the image area to upload or replace the project hero image."
                file={heroImageFile}
                onFileChange={setHeroImageFile}
                error={heroImageError}
                onErrorChange={setHeroImageError}
                existingUrl={project?.hero?.image?.url}
                existingAlt={project?.hero?.image?.alt ?? 'Project hero'}
                placeholderTitle="Add project hero image"
                placeholderDescription="Click to select an image"
                acceptedFormatsText="JPEG, PNG, GIF or WebP — maximum file size 5 MB."
                maxWidthClassName="max-w-[500px]"
                aspectClassName="aspect-[16/8]"
                thumbnailWidth={1200}
                icon={ImagePlus}
                required
              />

              {/* ==================== Hero Image Alt ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="proj-hero-alt"
                  className="text-[12px] font-semibold"
                >
                  Hero image alt text
                </Label>

                <Input
                  id="proj-hero-alt"
                  placeholder="Describe the project hero image"
                  className="h-11 rounded-xl"
                  aria-invalid={!!form.formState.errors.heroImageAlt}
                  {...form.register('heroImageAlt')}
                />

                <FieldError
                  message={form.formState.errors.heroImageAlt?.message}
                />
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 5 - Project Details ==================== */}

        {currentStep === 4 ? (
          <FormSection
            title="Project Details"
            description="Add optional operational and commercial information about the project."
            icon={BriefcaseBusiness}
            className="min-w-0"
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* ==================== Client ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="proj-client"
                  className="text-[12px] font-semibold"
                >
                  Client
                </Label>

                <div className="relative">
                  <BriefcaseBusiness
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45"
                    strokeWidth={1.8}
                  />

                  <Input
                    id="proj-client"
                    placeholder="Client or organization"
                    className="h-11 rounded-xl pl-10"
                    aria-invalid={!!form.formState.errors.client}
                    {...form.register('client')}
                  />
                </div>

                <FieldError
                  message={form.formState.errors.client?.message}
                />
              </div>

              {/* ==================== Location ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="proj-location"
                  className="text-[12px] font-semibold"
                >
                  Location
                </Label>

                <div className="relative">
                  <MapPin
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45"
                    strokeWidth={1.8}
                  />

                  <Input
                    id="proj-location"
                    placeholder="e.g. Basra, Iraq"
                    className="h-11 rounded-xl pl-10"
                    aria-invalid={!!form.formState.errors.location}
                    {...form.register('location')}
                  />
                </div>

                <FieldError
                  message={form.formState.errors.location?.message}
                />
              </div>

              {/* ==================== Completion Date ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="proj-date"
                  className="text-[12px] font-semibold"
                >
                  Completion date
                </Label>

                <div className="relative">
                  <CalendarDays
                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground/45"
                    strokeWidth={1.8}
                  />

                  <Input
                    id="proj-date"
                    type="date"
                    className="h-11 rounded-xl pl-10"
                    aria-invalid={!!form.formState.errors.completionDate}
                    {...form.register('completionDate')}
                  />
                </div>

                <FieldError
                  message={form.formState.errors.completionDate?.message}
                />
              </div>

              {/* ==================== Duration ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="proj-duration"
                  className="text-[12px] font-semibold"
                >
                  Duration
                </Label>

                <Input
                  id="proj-duration"
                  placeholder="e.g. 6 months"
                  className="h-11 rounded-xl"
                  aria-invalid={!!form.formState.errors.duration}
                  {...form.register('duration')}
                />

                <FieldError
                  message={form.formState.errors.duration?.message}
                />
              </div>

              {/* ==================== Project Status ==================== */}

              <div className="space-y-2 lg:col-span-2">
                <Label
                  htmlFor="proj-status"
                  className="text-[12px] font-semibold"
                >
                  Project status
                </Label>

                <Input
                  id="proj-status"
                  placeholder="e.g. Completed"
                  className="h-11 rounded-xl"
                  aria-invalid={!!form.formState.errors.status}
                  {...form.register('status')}
                />

                <FieldError
                  message={form.formState.errors.status?.message}
                />
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 6 - Detailed Scope ==================== */}

        {currentStep === 5 ? (
          <FormSection
            title="Detailed Scope"
            description="Describe the technical scope and key project activities."
            icon={FileCheck2}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Scope Title ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="proj-scope-title"
                  className="text-[12px] font-semibold"
                >
                  Section title
                </Label>

                <Input
                  id="proj-scope-title"
                  className="h-11 rounded-xl"
                  aria-invalid={!!form.formState.errors.detailedScopeTitle}
                  {...form.register('detailedScopeTitle')}
                />

                <FieldError
                  message={form.formState.errors.detailedScopeTitle?.message}
                />
              </div>

              {/* ==================== Scope Description ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="proj-scope-description"
                  className="text-[12px] font-semibold"
                >
                  Description
                </Label>

                <Textarea
                  id="proj-scope-description"
                  rows={4}
                  className="min-h-[110px] resize-y rounded-xl"
                  aria-invalid={
                    !!form.formState.errors.detailedScopeDescription
                  }
                  {...form.register('detailedScopeDescription')}
                />

                <FieldError
                  message={
                    form.formState.errors.detailedScopeDescription?.message
                  }
                />
              </div>

              {/* ==================== Scope Items ==================== */}

              <div className="rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <StepsEditor
                  label="Scope items"
                  itemLabel="Item"
                  values={form.watch('detailedScopeItems') ?? []}
                  onChange={(items) =>
                    form.setValue('detailedScopeItems', items, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  error={getArrayErrorMessage(
                    form.formState.errors.detailedScopeItems,
                  )}
                  itemErrors={getStepItemErrors(
                    form.formState.errors.detailedScopeItems,
                  )}
                />
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 7 - Gallery ==================== */}

        {currentStep === 6 ? (
          <FormSection
            title="Project Gallery"
            description={`Upload additional project photographs. Maximum ${GALLERY_MAX} images.`}
            icon={GalleryHorizontalEnd}
            className="min-w-0"
          >
            <GalleryManager
              id="proj-gallery"
              label="Gallery images"
              existingImages={project?.gallery ?? []}
              removedPublicIds={galleryRemovedPublicIds}
              onRemovedPublicIdsChange={setGalleryRemovedPublicIds}
              newFiles={galleryNewFiles}
              onNewFilesChange={setGalleryNewFiles}
              maxFiles={GALLERY_MAX}
              onError={setFormError}
            />
          </FormSection>
        ) : null}

        {/* ==================== Step 8 - Certificates ==================== */}

        {currentStep === 7 ? (
          <FormSection
            title="Certificates"
            description={`Upload compliance and safety certificate images. Maximum ${CERTIFICATE_MAX} files.`}
            icon={FileCheck2}
            className="min-w-0"
          >
            <GalleryManager
              id="proj-certificates"
              label="Certificate images"
              existingImages={project?.certificates ?? []}
              removedPublicIds={certificateRemovedPublicIds}
              onRemovedPublicIdsChange={setCertificateRemovedPublicIds}
              newFiles={certificateNewFiles}
              onNewFilesChange={setCertificateNewFiles}
              maxFiles={CERTIFICATE_MAX}
              onError={setFormError}
            />
          </FormSection>
        ) : null}

        {/* ==================== Step 9 - Project Settings ==================== */}

        {currentStep === 8 ? (
          <FormSection
            title="Project Settings"
            description="Control ordering, featured placement and public visibility."
            icon={Settings2}
            className="min-w-0"
          >
            <div className="space-y-5">
              {/* ==================== Display Order ==================== */}

              <div className="rounded-2xl border border-border/70 bg-muted/[0.06] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <Hash
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="proj-order"
                      className="text-[12px] font-semibold"
                    >
                      Display order
                    </Label>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                      Lower values appear earlier in the public projects
                      collection.
                    </p>
                  </div>
                </div>

                <Input
                  id="proj-order"
                  type="number"
                  min={0}
                  max={999}
                  className="mt-4 h-11 rounded-xl bg-background text-center text-base font-semibold tabular-nums"
                  aria-invalid={!!form.formState.errors.displayOrder}
                  {...form.register('displayOrder', {
                    valueAsNumber: true,
                  })}
                />

                <FieldError
                  message={form.formState.errors.displayOrder?.message}
                />
              </div>

              {/* ==================== Featured Project ==================== */}

              <div
                className={`rounded-2xl border p-4 transition-colors ${
                  isFeatured
                    ? 'border-info/20 bg-info/[0.035]'
                    : 'border-border/70 bg-muted/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                        isFeatured
                          ? 'border-info/15 bg-info-subtle text-info'
                          : 'border-border/70 bg-background text-muted-foreground'
                      }`}
                    >
                      <Sparkles
                        className="size-4"
                        strokeWidth={1.8}
                      />
                    </div>

                    <div className="min-w-0">
                      <Label
                        htmlFor="proj-featured"
                        className="cursor-pointer text-[12px] font-semibold"
                      >
                        Featured project
                      </Label>

                      <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                        {isFeatured
                          ? 'This project can appear in featured project areas.'
                          : 'Enable to feature this project in highlighted areas.'}
                      </p>
                    </div>
                  </div>

                  <Switch
                    id="proj-featured"
                    checked={isFeatured}
                    onCheckedChange={(checked) =>
                      form.setValue('isFeatured', checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                </div>
              </div>

              {/* ==================== Public Visibility ==================== */}

              <VisibilityToggle
                id="proj-active"
                checked={isActive}
                onCheckedChange={(checked) =>
                  form.setValue('isActive', checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                title="Public visibility"
                activeDescription="This project is visible on the public website."
                inactiveDescription="This project is hidden from the public website."
                activeLabel="Visible"
                inactiveLabel="Hidden"
              />
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
        submitLabel={isEditing ? 'Save changes' : 'Create project'}
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