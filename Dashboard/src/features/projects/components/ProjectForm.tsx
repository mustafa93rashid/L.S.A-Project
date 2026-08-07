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
  /** Present when editing — absent means "create". */
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

/** Shared by ProjectCreatePage and ProjectEditPage. */
export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const isEditing = Boolean(project)
  const [formError, setFormError] = useState<string | null>(null)
  const [cardImageFile, setCardImageFile] = useState<File | null>(null)
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)
  const [galleryNewFiles, setGalleryNewFiles] = useState<NewGalleryFile[]>([])
  const [galleryRemovedPublicIds, setGalleryRemovedPublicIds] = useState<string[]>([])
  const [certificateNewFiles, setCertificateNewFiles] = useState<NewGalleryFile[]>([])
  const [certificateRemovedPublicIds, setCertificateRemovedPublicIds] = useState<
    string[]
  >([])

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
          galleryNewFiles.length > 0 ? galleryNewFiles.map((f) => f.alt) : undefined,
        certificateAlt:
          certificateNewFiles.length > 0
            ? certificateNewFiles.map((f) => f.alt)
            : undefined,
        removeGalleryPublicIds: isEditing ? galleryRemovedPublicIds : undefined,
        removeCertificatePublicIds: isEditing ? certificateRemovedPublicIds : undefined,
        displayOrder: values.displayOrder,
        isFeatured: values.isFeatured,
        isActive: values.isActive,
      },
      { cardImage: cardImageFile, heroImage: heroImageFile },
    )

    galleryNewFiles.forEach(({ file }) => formData.append('gallery', file))
    certificateNewFiles.forEach(({ file }) => formData.append('certificateImages', file))

    const onError = (error: unknown) => setFormError(applyServerErrors(form, error))

    if (isEditing && project) {
      updateMutation.mutate(
        { id: project._id, formData },
        {
          onSuccess: () => {
            toast.success('Project updated successfully')
            guard.bypassOnce()
            onSuccess()
          },
          onError,
        },
      )
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Project created successfully')
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

  const selectedServiceIds = form.watch('services')

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

      <div className="flex items-start gap-6">
        <SectionNav items={SECTIONS} />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <FormSection id="proj-section-general" title="General">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-title">Title</Label>
              <Input
                id="proj-title"
                aria-invalid={!!form.formState.errors.title}
                {...form.register('title')}
              />
              {form.formState.errors.title ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-slug">Slug</Label>
                <Input
                  id="proj-slug"
                  placeholder="e.g. basra-pipeline-upgrade"
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
                <Label htmlFor="proj-category">Category label</Label>
                <Input
                  id="proj-category"
                  placeholder="e.g. Pipeline Services"
                  aria-invalid={!!form.formState.errors.categoryLabel}
                  {...form.register('categoryLabel')}
                />
                {form.formState.errors.categoryLabel ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.categoryLabel.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-shortDescription">Short description</Label>
              <Textarea
                id="proj-shortDescription"
                rows={2}
                aria-invalid={!!form.formState.errors.shortDescription}
                {...form.register('shortDescription')}
              />
              {form.formState.errors.shortDescription ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.shortDescription.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-description">Description</Label>
              <Textarea
                id="proj-description"
                rows={4}
                aria-invalid={!!form.formState.errors.description}
                {...form.register('description')}
              />
              {form.formState.errors.description ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              ) : null}
            </div>
          </FormSection>

          <FormSection
            id="proj-section-services"
            title="Related Services"
            description="Shown as related links on the project's detail page."
          >
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              {(services ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No services exist yet — create one first if you want to link it here.
                </p>
              ) : (
                (services ?? []).map((service) => (
                  <label
                    key={service._id}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <Checkbox
                      checked={selectedServiceIds.includes(service._id)}
                      onCheckedChange={(checked) =>
                        form.setValue(
                          'services',
                          checked
                            ? [...selectedServiceIds, service._id]
                            : selectedServiceIds.filter((id) => id !== service._id),
                          { shouldValidate: true },
                        )
                      }
                    />
                    {service.title}
                  </label>
                ))
              )}
            </div>
          </FormSection>

          <FormSection
            id="proj-section-card"
            title="Card Image"
            description="Shown on the projects list page."
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-cardImage">
                Card image{isEditing ? ' (leave empty to keep current)' : ''}
              </Label>
              {project?.cardImage.url ? (
                <img
                  src={cloudinaryThumbnail(project.cardImage.url, 96)}
                  alt={project.cardImage.alt}
                  className="h-24 w-24 rounded-md border border-border object-cover"
                />
              ) : null}
              <input
                id="proj-cardImage"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange(setCardImageFile)}
                className="rounded-md border border-input bg-transparent px-2.5 py-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-secondary-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-cardImageAlt">Card image alt text</Label>
              <Input id="proj-cardImageAlt" {...form.register('cardImageAlt')} />
            </div>
          </FormSection>

          <FormSection
            id="proj-section-hero"
            title="Hero Section"
            description="Shown at the top of the project's detail page."
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-heroTitle">Title</Label>
              <Input
                id="proj-heroTitle"
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
              <Label htmlFor="proj-heroDescription">Description</Label>
              <Textarea
                id="proj-heroDescription"
                rows={3}
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
              <Label htmlFor="proj-heroImage">
                Hero image{isEditing ? ' (leave empty to keep current)' : ''}
              </Label>
              {project?.hero.image.url ? (
                <img
                  src={cloudinaryThumbnail(project.hero.image.url, 96)}
                  alt={project.hero.image.alt}
                  className="h-24 w-24 rounded-md border border-border object-cover"
                />
              ) : null}
              <input
                id="proj-heroImage"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange(setHeroImageFile)}
                className="rounded-md border border-input bg-transparent px-2.5 py-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-secondary-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-heroImageAlt">Hero image alt text</Label>
              <Input id="proj-heroImageAlt" {...form.register('heroImageAlt')} />
            </div>
          </FormSection>

          <FormSection
            id="proj-section-details"
            title="Project Details"
            description="All fields are optional."
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-client">Client</Label>
                <Input id="proj-client" {...form.register('client')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-location">Location</Label>
                <Input id="proj-location" {...form.register('location')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-completionDate">Completion date</Label>
                <Input
                  id="proj-completionDate"
                  type="date"
                  {...form.register('completionDate')}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-duration">Duration</Label>
                <Input
                  id="proj-duration"
                  placeholder="e.g. 6 months"
                  {...form.register('duration')}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-status">Status</Label>
                <Input
                  id="proj-status"
                  placeholder="e.g. Completed"
                  {...form.register('status')}
                />
              </div>
            </div>
          </FormSection>

          <FormSection id="proj-section-scope" title="Detailed Scope">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-scopeTitle">Title</Label>
              <Input
                id="proj-scopeTitle"
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
              <Label htmlFor="proj-scopeDescription">Description</Label>
              <Textarea
                id="proj-scopeDescription"
                rows={2}
                aria-invalid={!!form.formState.errors.detailedScopeDescription}
                {...form.register('detailedScopeDescription')}
              />
              {form.formState.errors.detailedScopeDescription ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.detailedScopeDescription.message}
                </p>
              ) : null}
            </div>
            <StepsEditor
              label="Scope items"
              itemLabel="Item"
              values={form.watch('detailedScopeItems')}
              onChange={(items) =>
                form.setValue('detailedScopeItems', items, { shouldValidate: true })
              }
              error={form.formState.errors.detailedScopeItems?.message}
            />
          </FormSection>

          <FormSection
            id="proj-section-gallery"
            title="Gallery"
            description="Additional project photos."
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

          <FormSection
            id="proj-section-certificates"
            title="Certificates"
            description="Compliance/safety certificates."
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

          <FormSection id="proj-section-settings" title="Settings">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proj-order">Display order</Label>
                <Input
                  id="proj-order"
                  type="number"
                  min={0}
                  max={999}
                  {...form.register('displayOrder', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="proj-featured">Featured</Label>
              <Switch
                id="proj-featured"
                checked={form.watch('isFeatured')}
                onCheckedChange={(checked) => form.setValue('isFeatured', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="proj-active">Active</Label>
              <Switch
                id="proj-active"
                checked={form.watch('isActive')}
                onCheckedChange={(checked) => form.setValue('isActive', checked)}
              />
            </div>
          </FormSection>

          <FormActions
            onCancel={onCancel}
            submitLabel={isEditing ? 'Save changes' : 'Create project'}
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
