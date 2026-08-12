import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  CalendarDays,
  FolderKanban,
  ImagePlus,
  Link2,
  MapPin,
  Settings2,
  Sparkles,
} from 'lucide-react'

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormSection } from '@/components/forms/FormSection'
import { FormActions } from '@/components/forms/FormActions'
import { SectionNav } from '@/components/forms/SectionNav'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { StepsEditor } from '@/components/forms/StepsEditor'

import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/file-validation'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

import { useServicesQuery } from '@/features/services/queries'
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from '@/features/projects/queries'
import { projectSchema, type ProjectInput } from '@/features/projects/schema'
import type { Project } from '@/features/projects/types'
import {
  GalleryManager,
  type NewGalleryFile,
} from '@/features/projects/components/GalleryManager'

interface ProjectFormProps {
  project?: Project | null
  onSuccess: () => void
  onCancel: () => void
}

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

const GALLERY_MAX = 20
const CERTIFICATE_MAX = 10

const SECTIONS = [
  { id: 'proj-section-general', label: 'General' },
  { id: 'proj-section-services', label: 'Related Services' },
  { id: 'proj-section-card', label: 'Card Image' },
  { id: 'proj-section-hero', label: 'Hero Section' },
  { id: 'proj-section-details', label: 'Project Details' },
  { id: 'proj-section-scope', label: 'Detailed Scope' },
  { id: 'proj-section-gallery', label: 'Gallery' },
  { id: 'proj-section-certificates', label: 'Certificates' },
  { id: 'proj-section-settings', label: 'Settings' },
]

export function ProjectForm({
  project,
  onSuccess,
  onCancel,
}: ProjectFormProps) {
  const isEditing = Boolean(project)

  const [formError, setFormError] = useState<string | null>(null)
  const [cardImageFile, setCardImageFile] = useState<File | null>(null)
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)

  const [galleryNewFiles, setGalleryNewFiles] = useState<NewGalleryFile[]>([])
  const [galleryRemovedPublicIds, setGalleryRemovedPublicIds] = useState<string[]>([])

  const [certificateNewFiles, setCertificateNewFiles] = useState<NewGalleryFile[]>([])
  const [certificateRemovedPublicIds, setCertificateRemovedPublicIds] = useState<string[]>([])

  const { data: services } = useServicesQuery()

  const createMutation = useCreateProjectMutation()
  const updateMutation = useUpdateProjectMutation()

  const isSubmitting = createMutation.isPending || updateMutation.isPending

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

  const guard = useUnsavedChangesGuard(
    form.formState.isDirty ||
      cardImageFile !== null ||
      heroImageFile !== null ||
      galleryNewFiles.length > 0 ||
      galleryRemovedPublicIds.length > 0 ||
      certificateNewFiles.length > 0 ||
      certificateRemovedPublicIds.length > 0,
  )

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
    if (!isEditing && (!cardImageFile || !heroImageFile)) {
      setFormError('Both the card image and hero image are required.')
      return
    }

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

    galleryNewFiles.forEach(({ file }) => {
      formData.append('gallery', file)
    })

    certificateNewFiles.forEach(({ file }) => {
      formData.append('certificateImages', file)
    })

    const onError = (error: unknown) =>
      setFormError(applyServerErrors(form, error))

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

    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Project created successfully')
        guard.bypassOnce()
        onSuccess()
      },
      onError,
    })
  })

  const selectedServiceIds = form.watch('services')

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive-subtle px-4 py-3 text-sm font-medium text-destructive">
          {formError}
        </div>
      ) : null}

      <div className="flex items-start gap-7">
        <aside className="sticky top-24 hidden w-52 shrink-0 lg:block">
          <SectionNav items={SECTIONS} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <FormSection
            id="proj-section-general"
            title="General Information"
          >
            <div className="mb-1 flex items-start gap-3 rounded-[16px] border border-border/70 bg-muted/[0.12] px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                <Settings2 className="size-4" strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground">
                  Project identity
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  Define the project title, category, URL and public descriptions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <Label htmlFor="proj-title">
                  Title
                </Label>

                <Input
                  id="proj-title"
                  placeholder="e.g. Basra Pipeline Upgrade"
                  className="h-11"
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
                <Label htmlFor="proj-slug">
                  Slug
                </Label>

                <Input
                  id="proj-slug"
                  placeholder="e.g. basra-pipeline-upgrade"
                  className="h-11"
                  aria-invalid={!!form.formState.errors.slug}
                  {...form.register('slug')}
                />

                {form.formState.errors.slug ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.slug.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-category">
                  Category label
                </Label>

                <Input
                  id="proj-category"
                  placeholder="e.g. Pipeline Services"
                  className="h-11"
                  aria-invalid={!!form.formState.errors.categoryLabel}
                  {...form.register('categoryLabel')}
                />

                {form.formState.errors.categoryLabel ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.categoryLabel.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <Label htmlFor="proj-shortDescription">
                  Short description
                </Label>

                <Textarea
                  id="proj-shortDescription"
                  rows={3}
                  placeholder="Short summary used across project cards."
                  aria-invalid={!!form.formState.errors.shortDescription}
                  {...form.register('shortDescription')}
                />

                {form.formState.errors.shortDescription ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.shortDescription.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <Label htmlFor="proj-description">
                  Description
                </Label>

                <Textarea
                  id="proj-description"
                  rows={5}
                  placeholder="Detailed project overview."
                  aria-invalid={!!form.formState.errors.description}
                  {...form.register('description')}
                />

                {form.formState.errors.description ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                ) : null}
              </div>
            </div>
          </FormSection>

          <FormSection
            id="proj-section-services"
            title="Related Services"
            description="Link this project with services displayed on the project detail page."
          >
            <div className="mb-1 flex items-start gap-3 rounded-[16px] border border-border/70 bg-muted/[0.12] px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                <Link2 className="size-4" strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground">
                  Service relationships
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  Select the services connected to this project.
                </p>
              </div>
            </div>

            {(services ?? []).length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-border bg-muted/[0.08] px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No services exist yet. Create a service first if you want to link it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(services ?? []).map((service) => {
                  const checked = selectedServiceIds.includes(service._id)

                  return (
                    <label
                      key={service._id}
                      className={`flex cursor-pointer items-center gap-3 rounded-[14px] border px-3.5 py-3 transition-colors ${
                        checked
                          ? 'border-primary/30 bg-primary/[0.04]'
                          : 'border-border/70 bg-card hover:bg-muted/[0.12]'
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

                      <span className="truncate text-xs font-medium text-foreground">
                        {service.title}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </FormSection>

          <FormSection
            id="proj-section-card"
            title="Card Image"
            description="Image displayed in the public Projects collection."
          >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="proj-cardImage">
                    {isEditing
                      ? 'Project card image'
                      : 'Upload project card image'}
                  </Label>

                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    {isEditing
                      ? 'Upload a new image only if you want to replace the current one.'
                      : 'Use a strong landscape image representing the project.'}
                  </p>
                </div>

                <div className="overflow-hidden rounded-[18px] border border-border/70 bg-muted/[0.12]">
                  {cardImageFile ? (
                    <img
                      src={URL.createObjectURL(cardImageFile)}
                      alt="Selected project card preview"
                      className="aspect-[16/7] h-full w-full object-cover"
                    />
                  ) : project?.cardImage.url ? (
                    <img
                      src={cloudinaryThumbnail(
                        project.cardImage.url,
                        960,
                      )}
                      alt={project.cardImage.alt}
                      className="aspect-[16/7] h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[16/7] flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
                      <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background">
                        <ImagePlus
                          className="size-4"
                          strokeWidth={1.8}
                        />
                      </div>

                      <p className="text-xs font-medium">
                        No card image selected
                      </p>
                    </div>
                  )}
                </div>

                <input
                  id="proj-cardImage"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange(setCardImageFile)}
                  className="w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
                />
              </div>

              <div className="flex flex-col justify-center gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="proj-cardImageAlt">
                    Card image alt text
                  </Label>

                  <Input
                    id="proj-cardImageAlt"
                    placeholder="Describe the project card image"
                    className="h-11"
                    {...form.register('cardImageAlt')}
                  />
                </div>

                <div className="rounded-[16px] border border-border/70 bg-muted/[0.12] px-4 py-3">
                  <p className="text-[10px] leading-5 text-muted-foreground">
                    Recommended: landscape image with a wide composition suitable for project cards.
                  </p>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            id="proj-section-hero"
            title="Hero Section"
            description="Content shown at the top of the project detail page."
          >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="proj-heroTitle">
                    Hero title
                  </Label>

                  <Input
                    id="proj-heroTitle"
                    className="h-11"
                    aria-invalid={!!form.formState.errors.heroTitle}
                    {...form.register('heroTitle')}
                  />

                  {form.formState.errors.heroTitle ? (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.heroTitle.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="proj-heroDescription">
                    Hero description
                  </Label>

                  <Textarea
                    id="proj-heroDescription"
                    rows={5}
                    aria-invalid={!!form.formState.errors.heroDescription}
                    {...form.register('heroDescription')}
                  />

                  {form.formState.errors.heroDescription ? (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.heroDescription.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="proj-heroImageAlt">
                    Hero image alt text
                  </Label>

                  <Input
                    id="proj-heroImageAlt"
                    className="h-11"
                    placeholder="Describe the project hero image"
                    {...form.register('heroImageAlt')}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="proj-heroImage">
                    {isEditing
                      ? 'Hero image'
                      : 'Upload hero image'}
                  </Label>

                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    {isEditing
                      ? 'Leave empty to keep the current hero image.'
                      : 'Use a high-quality wide image suitable for the project hero section.'}
                  </p>
                </div>

                <div className="overflow-hidden rounded-[18px] border border-border/70 bg-muted/[0.12]">
                  {heroImageFile ? (
                    <img
                      src={URL.createObjectURL(heroImageFile)}
                      alt="Selected project hero preview"
                      className="aspect-[16/9] h-full w-full object-cover"
                    />
                  ) : project?.hero.image.url ? (
                    <img
                      src={cloudinaryThumbnail(
                        project.hero.image.url,
                        960,
                      )}
                      alt={project.hero.image.alt}
                      className="aspect-[16/9] h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
                      <div className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background">
                        <ImagePlus
                          className="size-4"
                          strokeWidth={1.8}
                        />
                      </div>

                      <p className="text-xs font-medium">
                        No hero image selected
                      </p>
                    </div>
                  )}
                </div>

                <input
                  id="proj-heroImage"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange(setHeroImageFile)}
                  className="w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            id="proj-section-details"
            title="Project Details"
            description="Optional project metadata displayed on the detail page."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-client">
                  Client
                </Label>

                <Input
                  id="proj-client"
                  className="h-11"
                  placeholder="Client name"
                  {...form.register('client')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-location">
                  Location
                </Label>

                <div className="relative">
                  <MapPin
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45"
                    strokeWidth={1.8}
                  />

                  <Input
                    id="proj-location"
                    className="h-11 pl-10"
                    placeholder="Project location"
                    {...form.register('location')}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-completionDate">
                  Completion date
                </Label>

                <div className="relative">
                  <CalendarDays
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45"
                    strokeWidth={1.8}
                  />

                  <Input
                    id="proj-completionDate"
                    type="date"
                    className="h-11 pl-10"
                    {...form.register('completionDate')}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-duration">
                  Duration
                </Label>

                <Input
                  id="proj-duration"
                  className="h-11"
                  placeholder="e.g. 6 months"
                  {...form.register('duration')}
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="proj-status">
                  Project status
                </Label>

                <Input
                  id="proj-status"
                  className="h-11"
                  placeholder="e.g. Completed"
                  {...form.register('status')}
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            id="proj-section-scope"
            title="Detailed Scope"
            description="Describe the main scope and technical work delivered in this project."
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-scopeTitle">
                  Section title
                </Label>

                <Input
                  id="proj-scopeTitle"
                  className="h-11"
                  aria-invalid={!!form.formState.errors.detailedScopeTitle}
                  {...form.register('detailedScopeTitle')}
                />

                {form.formState.errors.detailedScopeTitle ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.detailedScopeTitle.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-scopeDescription">
                  Description
                </Label>

                <Textarea
                  id="proj-scopeDescription"
                  rows={3}
                  aria-invalid={
                    !!form.formState.errors.detailedScopeDescription
                  }
                  {...form.register('detailedScopeDescription')}
                />

                {form.formState.errors.detailedScopeDescription ? (
                  <p className="text-xs text-destructive">
                    {
                      form.formState.errors
                        .detailedScopeDescription
                        .message
                    }
                  </p>
                ) : null}
              </div>
            </div>

            <StepsEditor
              label="Scope items"
              itemLabel="Item"
              values={form.watch('detailedScopeItems')}
              onChange={(items) =>
                form.setValue(
                  'detailedScopeItems',
                  items,
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  },
                )
              }
              error={
                form.formState.errors
                  .detailedScopeItems?.message
              }
            />
          </FormSection>

          <FormSection
            id="proj-section-gallery"
            title="Gallery"
            description="Additional project images displayed on the public project page."
          >
            <GalleryManager
              id="proj-gallery"
              label="Gallery images"
              existingImages={project?.gallery ?? []}
              removedPublicIds={galleryRemovedPublicIds}
              onRemovedPublicIdsChange={
                setGalleryRemovedPublicIds
              }
              newFiles={galleryNewFiles}
              onNewFilesChange={setGalleryNewFiles}
              maxFiles={GALLERY_MAX}
              onError={setFormError}
            />
          </FormSection>

          <FormSection
            id="proj-section-certificates"
            title="Certificates"
            description="Compliance, inspection or safety certificates related to this project."
          >
            <GalleryManager
              id="proj-certificates"
              label="Certificate images"
              existingImages={project?.certificates ?? []}
              removedPublicIds={
                certificateRemovedPublicIds
              }
              onRemovedPublicIdsChange={
                setCertificateRemovedPublicIds
              }
              newFiles={certificateNewFiles}
              onNewFilesChange={
                setCertificateNewFiles
              }
              maxFiles={CERTIFICATE_MAX}
              onError={setFormError}
            />
          </FormSection>

          <FormSection
            id="proj-section-settings"
            title="Settings"
            description="Control project ordering, featured state and public visibility."
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-order">
                  Display order
                </Label>

                <Input
                  id="proj-order"
                  type="number"
                  min={0}
                  max={999}
                  className="h-11"
                  aria-invalid={
                    !!form.formState.errors.displayOrder
                  }
                  {...form.register(
                    'displayOrder',
                    {
                      valueAsNumber: true,
                    },
                  )}
                />

                {form.formState.errors.displayOrder ? (
                  <p className="text-xs text-destructive">
                    {
                      form.formState.errors
                        .displayOrder.message
                    }
                  </p>
                ) : null}

                <p className="text-[11px] leading-5 text-muted-foreground">
                  Lower values appear earlier in the project collection.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-[16px] border border-border/70 bg-muted/[0.12] px-4 py-4">
                <div className="pr-5">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className="size-3.5 text-muted-foreground"
                      strokeWidth={1.8}
                    />

                    <Label htmlFor="proj-featured">
                      Featured
                    </Label>
                  </div>

                  <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
                    Highlight this project as a featured case study.
                  </p>
                </div>

                <Switch
                  id="proj-featured"
                  checked={form.watch('isFeatured')}
                  onCheckedChange={(checked) =>
                    form.setValue(
                      'isFeatured',
                      checked,
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-[16px] border border-border/70 bg-muted/[0.12] px-4 py-4">
                <div className="pr-5">
                  <div className="flex items-center gap-2">
                    <FolderKanban
                      className="size-3.5 text-muted-foreground"
                      strokeWidth={1.8}
                    />

                    <Label htmlFor="proj-active">
                      Public visibility
                    </Label>
                  </div>

                  <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
                    Controls whether this project is visible on the public website.
                  </p>
                </div>

                <Switch
                  id="proj-active"
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) =>
                    form.setValue(
                      'isActive',
                      checked,
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    )
                  }
                />
              </div>
            </div>
          </FormSection>

          <FormActions
            onCancel={onCancel}
            submitLabel={
              isEditing
                ? 'Save changes'
                : 'Create project'
            }
            isSubmitting={isSubmitting}
            sticky
          />
        </div>
      </div>

      <ConfirmDialog
        open={guard.isBlocked}
        onOpenChange={(open) =>
          !open && guard.cancelLeave()
        }
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        variant="destructive"
        onConfirm={guard.confirmLeave}
      />
    </form>
  )
}