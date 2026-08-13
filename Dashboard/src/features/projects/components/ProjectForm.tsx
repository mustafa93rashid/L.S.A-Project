import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  EyeOff,
  FileBadge2,
  FolderKanban,
  Hash,
  ImagePlus,
  Images,
  Link2,
  MapPin,
  Settings2,
  Sparkles,
  Tag,
  Upload,
  Workflow,
  X,
} from 'lucide-react'

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormSection } from '@/components/forms/FormSection'
import { FormActions } from '@/components/forms/FormActions'
import { SectionNav } from '@/components/forms/SectionNav'
import { StepsEditor } from '@/components/forms/StepsEditor'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'

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
  {
    id: 'proj-section-general',
    label: 'General',
  },
  {
    id: 'proj-section-services',
    label: 'Related Services',
  },
  {
    id: 'proj-section-card',
    label: 'Card Image',
  },
  {
    id: 'proj-section-hero',
    label: 'Hero Section',
  },
  {
    id: 'proj-section-details',
    label: 'Project Details',
  },
  {
    id: 'proj-section-scope',
    label: 'Detailed Scope',
  },
  {
    id: 'proj-section-gallery',
    label: 'Gallery',
  },
  {
    id: 'proj-section-certificates',
    label: 'Certificates',
  },
  {
    id: 'proj-section-settings',
    label: 'Settings',
  },
]


function FieldError({
  message,
}: {
  message?: string
}) {
  if (!message) return null

  return (
    <p className="flex items-center gap-1.5 text-[10px] font-medium text-destructive">
      <AlertCircle
        className="size-3 shrink-0"
        strokeWidth={1.8}
      />

      {message}
    </p>
  )
}


export function ProjectForm({
  project,
  onSuccess,
  onCancel,
}: ProjectFormProps) {
  const isEditing = Boolean(project)

  const [formError, setFormError] =
    useState<string | null>(null)

  const [cardImageFile, setCardImageFile] =
    useState<File | null>(null)

  const [heroImageFile, setHeroImageFile] =
    useState<File | null>(null)

  const [
    galleryNewFiles,
    setGalleryNewFiles,
  ] = useState<NewGalleryFile[]>([])

  const [
    galleryRemovedPublicIds,
    setGalleryRemovedPublicIds,
  ] = useState<string[]>([])

  const [
    certificateNewFiles,
    setCertificateNewFiles,
  ] = useState<NewGalleryFile[]>([])

  const [
    certificateRemovedPublicIds,
    setCertificateRemovedPublicIds,
  ] = useState<string[]>([])


  const { data: services } =
    useServicesQuery()

  const createMutation =
    useCreateProjectMutation()

  const updateMutation =
    useUpdateProjectMutation()

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending


  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),

    defaultValues: project
      ? {
          title: project.title,
          slug: project.slug,
          categoryLabel:
            project.categoryLabel,
          shortDescription:
            project.shortDescription,
          description:
            project.description,

          services:
            project.services.map(
              (service) => service._id,
            ),

          heroTitle:
            project.hero.title,

          heroDescription:
            project.hero.description,

          cardImageAlt:
            project.cardImage.alt,

          heroImageAlt:
            project.hero.image.alt,

          client:
            project.projectDetails
              .client ?? '',

          location:
            project.projectDetails
              .location ?? '',

          completionDate:
            project.projectDetails
              .completionDate
              ? project.projectDetails.completionDate.slice(
                  0,
                  10,
                )
              : '',

          duration:
            project.projectDetails
              .duration ?? '',

          status:
            project.projectDetails
              .status ?? '',

          detailedScopeTitle:
            project.detailedScope
              .title,

          detailedScopeDescription:
            project.detailedScope
              .description,

          detailedScopeItems:
            project.detailedScope
              .items,

          displayOrder:
            project.displayOrder,

          isFeatured:
            project.isFeatured,

          isActive:
            project.isActive,
        }
      : emptyDefaults,
  })


  const selectedServiceIds =
    form.watch('services') ?? []

  const isFeatured =
    form.watch('isFeatured') ?? false

  const isActive =
    form.watch('isActive') ?? true


  const guard =
    useUnsavedChangesGuard(
      form.formState.isDirty ||
        cardImageFile !== null ||
        heroImageFile !== null ||
        galleryNewFiles.length > 0 ||
        galleryRemovedPublicIds.length >
          0 ||
        certificateNewFiles.length >
          0 ||
        certificateRemovedPublicIds
          .length > 0,
    )


  const cardImagePreview =
    useMemo(() => {
      if (cardImageFile) {
        return URL.createObjectURL(
          cardImageFile,
        )
      }

      if (project?.cardImage?.url) {
        return cloudinaryThumbnail(
          project.cardImage.url,
          960,
        )
      }

      return null
    }, [
      cardImageFile,
      project?.cardImage?.url,
    ])


  const heroImagePreview =
    useMemo(() => {
      if (heroImageFile) {
        return URL.createObjectURL(
          heroImageFile,
        )
      }

      if (project?.hero?.image?.url) {
        return cloudinaryThumbnail(
          project.hero.image.url,
          1200,
        )
      }

      return null
    }, [
      heroImageFile,
      project?.hero?.image?.url,
    ])


  useEffect(() => {
    if (
      !cardImageFile ||
      !cardImagePreview
    ) {
      return
    }

    return () => {
      URL.revokeObjectURL(
        cardImagePreview,
      )
    }
  }, [
    cardImageFile,
    cardImagePreview,
  ])


  useEffect(() => {
    if (
      !heroImageFile ||
      !heroImagePreview
    ) {
      return
    }

    return () => {
      URL.revokeObjectURL(
        heroImagePreview,
      )
    }
  }, [
    heroImageFile,
    heroImagePreview,
  ])


  const handleImageChange =
    (
      setFile: (
        file: File | null,
      ) => void,
    ) =>
    (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target.files?.[0] ??
        null

      if (!file) {
        setFile(null)
        return
      }

      const validationError =
        validateImageFile(file)

      if (validationError) {
        setFormError(
          validationError,
        )

        setFile(null)

        event.target.value = ''

        return
      }

      setFormError(null)
      setFile(file)
    }


  const onSubmit =
    form.handleSubmit((values) => {
      if (
        !isEditing &&
        (!cardImageFile ||
          !heroImageFile)
      ) {
        setFormError(
          'Both the card image and hero image are required.',
        )

        return
      }

      setFormError(null)


      const formData =
        buildFormData(
          {
            title: values.title,
            slug: values.slug,

            categoryLabel:
              values.categoryLabel,

            shortDescription:
              values.shortDescription,

            description:
              values.description,

            services:
              values.services,

            heroTitle:
              values.heroTitle,

            heroDescription:
              values.heroDescription,

            cardImageAlt:
              values.cardImageAlt,

            heroImageAlt:
              values.heroImageAlt,

            projectDetails: {
              client:
                values.client ||
                null,

              location:
                values.location ||
                null,

              completionDate:
                values.completionDate ||
                null,

              duration:
                values.duration ||
                null,

              status:
                values.status ||
                null,
            },

            detailedScope: {
              title:
                values.detailedScopeTitle,

              description:
                values.detailedScopeDescription,

              items:
                values.detailedScopeItems,
            },

            galleryAlt:
              galleryNewFiles.length >
              0
                ? galleryNewFiles.map(
                    (file) =>
                      file.alt,
                  )
                : undefined,

            certificateAlt:
              certificateNewFiles.length >
              0
                ? certificateNewFiles.map(
                    (file) =>
                      file.alt,
                  )
                : undefined,

            removeGalleryPublicIds:
              isEditing
                ? galleryRemovedPublicIds
                : undefined,

            removeCertificatePublicIds:
              isEditing
                ? certificateRemovedPublicIds
                : undefined,

            displayOrder:
              values.displayOrder,

            isFeatured:
              values.isFeatured,

            isActive:
              values.isActive,
          },
          {
            cardImage:
              cardImageFile,

            heroImage:
              heroImageFile,
          },
        )


      galleryNewFiles.forEach(
        ({ file }) => {
          formData.append(
            'gallery',
            file,
          )
        },
      )


      certificateNewFiles.forEach(
        ({ file }) => {
          formData.append(
            'certificateImages',
            file,
          )
        },
      )


      const onError = (
        error: unknown,
      ) => {
        setFormError(
          applyServerErrors(
            form,
            error,
          ),
        )
      }


      if (
        isEditing &&
        project
      ) {
        updateMutation.mutate(
          {
            id: project._id,
            formData,
          },
          {
            onSuccess: () => {
              toast.success(
                'Project updated successfully',
              )

              guard.bypassOnce()
              onSuccess()
            },

            onError,
          },
        )

        return
      }


      createMutation.mutate(
        formData,
        {
          onSuccess: () => {
            toast.success(
              'Project created successfully',
            )

            guard.bypassOnce()
            onSuccess()
          },

          onError,
        },
      )
    })


  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-6"
    >

      {/* ================= Error ================= */}

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.045] px-4 py-3.5"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle
              className="size-4"
              strokeWidth={1.8}
            />
          </div>

          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-destructive">
              Unable to save project
            </p>

            <p className="mt-1 text-[11px] leading-5 text-destructive/80">
              {formError}
            </p>
          </div>
        </div>
      ) : null}


      <div className="flex items-start gap-7">

        {/* ================= Navigation ================= */}

        <aside className="hidden w-56 shrink-0 lg:block">
          <SectionNav
            items={SECTIONS}
            title="Project Setup"
          />
        </aside>


        <div className="min-w-0 flex-1 space-y-6">

          {/* ================= General ================= */}

          <FormSection
            id="proj-section-general"
            title="General Information"
            description="Define the project identity, category, URL and public descriptions."
            icon={FolderKanban}
          >
            <div className="space-y-5">

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="proj-title"
                    className="text-[12px] font-semibold"
                  >
                    Project title
                  </Label>

                  <span className="rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                    Required
                  </span>
                </div>

                <Input
                  id="proj-title"
                  placeholder="e.g. Basra Pipeline Upgrade"
                  className="h-11 rounded-xl"
                  aria-invalid={
                    !!form.formState
                      .errors.title
                  }
                  {...form.register(
                    'title',
                  )}
                />

                <FieldError
                  message={
                    form.formState
                      .errors.title
                      ?.message
                  }
                />
              </div>


              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

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
                      placeholder="e.g. basra-pipeline-upgrade"
                      className="h-11 rounded-xl pl-10 font-mono text-[12px]"
                      aria-invalid={
                        !!form
                          .formState
                          .errors.slug
                      }
                      {...form.register(
                        'slug',
                      )}
                    />
                  </div>

                  <FieldError
                    message={
                      form.formState
                        .errors.slug
                        ?.message
                    }
                  />
                </div>


                <div className="space-y-2">
                  <Label
                    htmlFor="proj-category"
                    className="text-[12px] font-semibold"
                  >
                    Category label
                  </Label>

                  <div className="group relative">
                    <Tag
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                      strokeWidth={1.8}
                    />

                    <Input
                      id="proj-category"
                      placeholder="e.g. Pipeline Services"
                      className="h-11 rounded-xl pl-10"
                      aria-invalid={
                        !!form
                          .formState
                          .errors
                          .categoryLabel
                      }
                      {...form.register(
                        'categoryLabel',
                      )}
                    />
                  </div>

                  <FieldError
                    message={
                      form.formState
                        .errors
                        .categoryLabel
                        ?.message
                    }
                  />
                </div>

              </div>


              <div className="space-y-2">
                <Label
                  htmlFor="proj-shortDescription"
                  className="text-[12px] font-semibold"
                >
                  Short description
                </Label>

                <Textarea
                  id="proj-shortDescription"
                  rows={3}
                  placeholder="Short summary used across project cards."
                  className="min-h-[100px] resize-y rounded-xl"
                  aria-invalid={
                    !!form.formState
                      .errors
                      .shortDescription
                  }
                  {...form.register(
                    'shortDescription',
                  )}
                />

                <FieldError
                  message={
                    form.formState
                      .errors
                      .shortDescription
                      ?.message
                  }
                />
              </div>


              <div className="space-y-2">
                <Label
                  htmlFor="proj-description"
                  className="text-[12px] font-semibold"
                >
                  Description
                </Label>

                <Textarea
                  id="proj-description"
                  rows={5}
                  placeholder="Detailed project overview."
                  className="min-h-[140px] resize-y rounded-xl"
                  aria-invalid={
                    !!form.formState
                      .errors.description
                  }
                  {...form.register(
                    'description',
                  )}
                />

                <FieldError
                  message={
                    form.formState
                      .errors.description
                      ?.message
                  }
                />
              </div>

            </div>
          </FormSection>


          {/* ================= Services ================= */}

          <FormSection
            id="proj-section-services"
            title="Related Services"
            description="Link this project with services displayed on the project details page."
            icon={Link2}
          >
            {(services ?? []).length ===
            0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/[0.08] px-5 py-8 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">
                  No services exist yet.
                  Create a service first if
                  you want to link it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(services ?? []).map(
                  (service) => {
                    const checked =
                      selectedServiceIds.includes(
                        service._id,
                      )

                    return (
                      <label
                        key={
                          service._id
                        }
                        className={`group flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
                          checked
                            ? 'border-primary/25 bg-primary/[0.045]'
                            : 'border-border/70 bg-muted/[0.06] hover:border-foreground/10 hover:bg-muted/[0.14]'
                        }`}
                      >
                        <Checkbox
                          checked={
                            checked
                          }
                          onCheckedChange={(
                            value,
                          ) => {
                            form.setValue(
                              'services',
                              value
                                ? [
                                    ...selectedServiceIds,
                                    service._id,
                                  ]
                                : selectedServiceIds.filter(
                                    (
                                      id,
                                    ) =>
                                      id !==
                                      service._id,
                                  ),
                              {
                                shouldDirty:
                                  true,
                                shouldValidate:
                                  true,
                              },
                            )
                          }}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-semibold text-foreground">
                            {
                              service.title
                            }
                          </p>

                          <p className="mt-1 text-[9px] text-muted-foreground">
                            Linked service
                          </p>
                        </div>

                        <Link2
                          className={`size-3.5 shrink-0 transition-colors ${
                            checked
                              ? 'text-primary'
                              : 'text-muted-foreground/30'
                          }`}
                          strokeWidth={
                            1.8
                          }
                        />
                      </label>
                    )
                  },
                )}
              </div>
            )}
          </FormSection>


          {/* ================= Card Image ================= */}

          <FormSection
            id="proj-section-card"
            title="Card Image"
            description="Upload the image displayed in the public Projects collection."
            icon={ImagePlus}
          >
            <div className="space-y-5">

              <div className="space-y-2">
                <Label
                  htmlFor="proj-cardImageAlt"
                  className="text-[12px] font-semibold"
                >
                  Card image alt text
                </Label>

                <Input
                  id="proj-cardImageAlt"
                  placeholder="Describe the project card image"
                  className="h-11 rounded-xl"
                  {...form.register(
                    'cardImageAlt',
                  )}
                />

                <p className="text-[10px] leading-4 text-muted-foreground">
                  Used for accessibility
                  and search engine image
                  context.
                </p>
              </div>


              <div className="flex justify-start">

                <div className="group relative w-full max-w-[440px] overflow-hidden rounded-[20px] border border-border/70 bg-muted/[0.10]">

                  {cardImagePreview ? (
                    <div className="relative aspect-[16/7] overflow-hidden bg-background">

                      <img
                        src={
                          cardImagePreview
                        }
                        alt={
                          cardImageFile
                            ? 'Selected project card preview'
                            : project
                                ?.cardImage
                                ?.alt ??
                              'Project card'
                        }
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                      />

                      {cardImageFile ? (
                        <button
                          type="button"
                          aria-label="Remove selected card image"
                          onClick={() =>
                            setCardImageFile(
                              null,
                            )
                          }
                          className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-lg border border-white/20 bg-black/35 text-white/80 backdrop-blur transition-colors hover:bg-black/50 hover:text-white"
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : null}

                    </div>
                  ) : (
                    <div className="flex aspect-[16/7] flex-col items-center justify-center gap-3 px-5 text-center">

                      <div className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                        <ImagePlus
                          className="size-[18px]"
                          strokeWidth={
                            1.8
                          }
                        />
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-foreground">
                          No card image
                          selected
                        </p>

                        <p className="mt-1 text-[9px] text-muted-foreground">
                          Upload a landscape
                          project image.
                        </p>
                      </div>

                    </div>
                  )}

                </div>

              </div>


              <label
                htmlFor="proj-cardImage"
                className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/[0.08] px-4 py-4 transition-all hover:border-foreground/15 hover:bg-muted/[0.15]"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                  <Upload
                    className="size-4"
                    strokeWidth={1.8}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-foreground">
                    {cardImageFile
                      ? cardImageFile.name
                      : isEditing
                        ? 'Choose replacement card image'
                        : 'Choose project card image'}
                  </p>

                  <p className="mt-1 text-[9px] text-muted-foreground">
                    JPEG, PNG, GIF or
                    WebP.
                  </p>
                </div>

                <span className="hidden rounded-lg border border-border/70 bg-background px-3 py-1.5 text-[9px] font-semibold text-muted-foreground sm:block">
                  Browse
                </span>
              </label>

              <input
                id="proj-cardImage"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange(
                  setCardImageFile,
                )}
                className="sr-only"
              />

            </div>
          </FormSection>


          {/* ================= Hero ================= */}

          <FormSection
            id="proj-section-hero"
            title="Hero Section"
            description="Content shown at the top of the project detail page."
            icon={ImagePlus}
          >
            <div className="space-y-6">

              <div className="space-y-2">
                <Label
                  htmlFor="proj-heroTitle"
                  className="text-[12px] font-semibold"
                >
                  Hero title
                </Label>

                <Input
                  id="proj-heroTitle"
                  className="h-11 rounded-xl"
                  aria-invalid={
                    !!form.formState
                      .errors.heroTitle
                  }
                  {...form.register(
                    'heroTitle',
                  )}
                />

                <FieldError
                  message={
                    form.formState
                      .errors.heroTitle
                      ?.message
                  }
                />
              </div>


              <div className="space-y-2">
                <Label
                  htmlFor="proj-heroDescription"
                  className="text-[12px] font-semibold"
                >
                  Hero description
                </Label>

                <Textarea
                  id="proj-heroDescription"
                  rows={5}
                  className="min-h-[140px] resize-y rounded-xl"
                  aria-invalid={
                    !!form.formState
                      .errors
                      .heroDescription
                  }
                  {...form.register(
                    'heroDescription',
                  )}
                />

                <FieldError
                  message={
                    form.formState
                      .errors
                      .heroDescription
                      ?.message
                  }
                />
              </div>


              <div className="space-y-2">
                <Label
                  htmlFor="proj-heroImageAlt"
                  className="text-[12px] font-semibold"
                >
                  Hero image alt text
                </Label>

                <Input
                  id="proj-heroImageAlt"
                  placeholder="Describe the project hero image"
                  className="h-11 rounded-xl"
                  {...form.register(
                    'heroImageAlt',
                  )}
                />
              </div>


              <div className="border-t border-border/60 pt-6">

                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground">
                    <ImagePlus
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      Hero image
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                      {isEditing
                        ? 'Leave unchanged to keep the current hero image.'
                        : 'Use a wide high-quality image suitable for the project hero.'}
                    </p>
                  </div>
                </div>


                <div className="flex justify-start">

                  <div className="group relative w-full max-w-[560px] overflow-hidden rounded-[20px] border border-border/70 bg-muted/[0.10]">

                    {heroImagePreview ? (
                      <div className="relative aspect-[16/8] overflow-hidden bg-background">

                        <img
                          src={
                            heroImagePreview
                          }
                          alt={
                            heroImageFile
                              ? 'Selected project hero preview'
                              : project
                                  ?.hero
                                  ?.image
                                  ?.alt ??
                                'Project hero'
                          }
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />

                        {heroImageFile ? (
                          <button
                            type="button"
                            aria-label="Remove selected hero image"
                            onClick={() =>
                              setHeroImageFile(
                                null,
                              )
                            }
                            className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-lg border border-white/20 bg-black/35 text-white/80 backdrop-blur transition-colors hover:bg-black/50 hover:text-white"
                          >
                            <X className="size-3.5" />
                          </button>
                        ) : null}

                      </div>
                    ) : (
                      <div className="flex aspect-[16/8] flex-col items-center justify-center gap-3 px-5 text-center">
                        <div className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                          <ImagePlus
                            className="size-[18px]"
                            strokeWidth={
                              1.8
                            }
                          />
                        </div>

                        <p className="text-[11px] font-semibold text-foreground">
                          No hero image
                          selected
                        </p>
                      </div>
                    )}

                  </div>

                </div>


                <label
                  htmlFor="proj-heroImage"
                  className="group mt-4 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/[0.08] px-4 py-4 transition-all hover:border-foreground/15 hover:bg-muted/[0.15]"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                    <Upload
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-foreground">
                      {heroImageFile
                        ? heroImageFile.name
                        : isEditing
                          ? 'Choose replacement hero image'
                          : 'Choose hero image'}
                    </p>

                    <p className="mt-1 text-[9px] text-muted-foreground">
                      JPEG, PNG, GIF or
                      WebP.
                    </p>
                  </div>

                  <span className="hidden rounded-lg border border-border/70 bg-background px-3 py-1.5 text-[9px] font-semibold text-muted-foreground sm:block">
                    Browse
                  </span>
                </label>

                <input
                  id="proj-heroImage"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange(
                    setHeroImageFile,
                  )}
                  className="sr-only"
                />

              </div>

            </div>
          </FormSection>


          {/* ================= Project Details ================= */}

          <FormSection
            id="proj-section-details"
            title="Project Details"
            description="Optional project metadata displayed on the detail page."
            icon={BriefcaseBusiness}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div className="space-y-2">
                <Label
                  htmlFor="proj-client"
                  className="text-[12px] font-semibold"
                >
                  Client
                </Label>

                <Input
                  id="proj-client"
                  className="h-11 rounded-xl"
                  placeholder="Client name"
                  {...form.register(
                    'client',
                  )}
                />
              </div>


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
                    className="h-11 rounded-xl pl-10"
                    placeholder="Project location"
                    {...form.register(
                      'location',
                    )}
                  />
                </div>
              </div>


              <div className="space-y-2">
                <Label
                  htmlFor="proj-completionDate"
                  className="text-[12px] font-semibold"
                >
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
                    className="h-11 rounded-xl pl-10"
                    {...form.register(
                      'completionDate',
                    )}
                  />
                </div>
              </div>


              <div className="space-y-2">
                <Label
                  htmlFor="proj-duration"
                  className="text-[12px] font-semibold"
                >
                  Duration
                </Label>

                <Input
                  id="proj-duration"
                  className="h-11 rounded-xl"
                  placeholder="e.g. 6 months"
                  {...form.register(
                    'duration',
                  )}
                />
              </div>


              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="proj-status"
                  className="text-[12px] font-semibold"
                >
                  Project status
                </Label>

                <Input
                  id="proj-status"
                  className="h-11 rounded-xl"
                  placeholder="e.g. Completed"
                  {...form.register(
                    'status',
                  )}
                />
              </div>

            </div>
          </FormSection>


          {/* ================= Scope ================= */}

          <FormSection
            id="proj-section-scope"
            title="Detailed Scope"
            description="Describe the technical and operational work delivered in this project."
            icon={Workflow}
          >
            <div className="space-y-6">

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                <div className="space-y-2">
                  <Label
                    htmlFor="proj-scopeTitle"
                    className="text-[12px] font-semibold"
                  >
                    Section title
                  </Label>

                  <Input
                    id="proj-scopeTitle"
                    className="h-11 rounded-xl"
                    aria-invalid={
                      !!form
                        .formState
                        .errors
                        .detailedScopeTitle
                    }
                    {...form.register(
                      'detailedScopeTitle',
                    )}
                  />

                  <FieldError
                    message={
                      form.formState
                        .errors
                        .detailedScopeTitle
                        ?.message
                    }
                  />
                </div>


                <div className="space-y-2">
                  <Label
                    htmlFor="proj-scopeDescription"
                    className="text-[12px] font-semibold"
                  >
                    Description
                  </Label>

                  <Textarea
                    id="proj-scopeDescription"
                    rows={3}
                    className="min-h-[90px] resize-y rounded-xl"
                    aria-invalid={
                      !!form
                        .formState
                        .errors
                        .detailedScopeDescription
                    }
                    {...form.register(
                      'detailedScopeDescription',
                    )}
                  />

                  <FieldError
                    message={
                      form.formState
                        .errors
                        .detailedScopeDescription
                        ?.message
                    }
                  />
                </div>

              </div>


              <div className="rounded-2xl border border-border/70 bg-muted/[0.06] p-4">

                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <Workflow
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      Scope items
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                      Add the main
                      technical work and
                      project deliverables.
                    </p>
                  </div>
                </div>

                <StepsEditor
                  label="Scope items"
                  itemLabel="Item"
                  values={
                    form.watch(
                      'detailedScopeItems',
                    ) ?? []
                  }
                  onChange={(
                    items,
                  ) =>
                    form.setValue(
                      'detailedScopeItems',
                      items,
                      {
                        shouldDirty:
                          true,
                        shouldValidate:
                          true,
                      },
                    )
                  }
                  error={
                    form.formState
                      .errors
                      .detailedScopeItems
                      ?.message
                  }
                />

              </div>

            </div>
          </FormSection>


          {/* ================= Gallery ================= */}

          <FormSection
            id="proj-section-gallery"
            title="Gallery"
            description="Additional project images displayed on the public project page."
            icon={Images}
          >
            <div className="rounded-2xl border border-border/70 bg-muted/[0.06] p-4">

              <GalleryManager
                id="proj-gallery"
                label="Gallery images"
                existingImages={
                  project?.gallery ?? []
                }
                removedPublicIds={
                  galleryRemovedPublicIds
                }
                onRemovedPublicIdsChange={
                  setGalleryRemovedPublicIds
                }
                newFiles={
                  galleryNewFiles
                }
                onNewFilesChange={
                  setGalleryNewFiles
                }
                maxFiles={
                  GALLERY_MAX
                }
                onError={
                  setFormError
                }
              />

            </div>
          </FormSection>


          {/* ================= Certificates ================= */}

          <FormSection
            id="proj-section-certificates"
            title="Certificates"
            description="Compliance, inspection or safety certificates related to this project."
            icon={FileBadge2}
          >
            <div className="rounded-2xl border border-border/70 bg-muted/[0.06] p-4">

              <GalleryManager
                id="proj-certificates"
                label="Certificate images"
                existingImages={
                  project?.certificates ??
                  []
                }
                removedPublicIds={
                  certificateRemovedPublicIds
                }
                onRemovedPublicIdsChange={
                  setCertificateRemovedPublicIds
                }
                newFiles={
                  certificateNewFiles
                }
                onNewFilesChange={
                  setCertificateNewFiles
                }
                maxFiles={
                  CERTIFICATE_MAX
                }
                onError={
                  setFormError
                }
              />

            </div>
          </FormSection>


          {/* ================= Settings ================= */}

          <FormSection
            id="proj-section-settings"
            title="Display Settings"
            description="Control ordering, featured state and public visibility."
            icon={Settings2}
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

              {/* Order */}

              <div className="rounded-2xl border border-border/70 bg-muted/[0.08] p-4">
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
                      Lower values appear
                      earlier in the
                      projects collection.
                    </p>
                  </div>

                </div>

                <Input
                  id="proj-order"
                  type="number"
                  min={0}
                  max={999}
                  className="mt-4 h-11 rounded-xl text-center text-base font-semibold tabular-nums"
                  aria-invalid={
                    !!form.formState
                      .errors.displayOrder
                  }
                  {...form.register(
                    'displayOrder',
                    {
                      valueAsNumber:
                        true,
                    },
                  )}
                />

                <FieldError
                  message={
                    form.formState
                      .errors
                      .displayOrder
                      ?.message
                  }
                />
              </div>


              {/* Featured */}

              <div
                className={`rounded-2xl border p-4 transition-colors ${
                  isFeatured
                    ? 'border-info/20 bg-info/[0.035]'
                    : 'border-border/70 bg-muted/[0.08]'
                }`}
              >
                <div className="flex h-full flex-col justify-between gap-5">

                  <div className="flex items-start gap-3">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                        isFeatured
                          ? 'border-info/15 bg-info-subtle text-info'
                          : 'border-border/70 bg-background text-muted-foreground'
                      }`}
                    >
                      <Sparkles
                        className="size-4"
                        strokeWidth={
                          1.8
                        }
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="proj-featured"
                        className="cursor-pointer text-[12px] font-semibold"
                      >
                        Featured project
                      </Label>

                      <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                        Highlight this
                        project as a
                        featured case
                        study.
                      </p>
                    </div>
                  </div>


                  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2.5">

                    <span className="text-[10px] font-semibold text-foreground">
                      {isFeatured
                        ? 'Featured'
                        : 'Standard'}
                    </span>

                    <Switch
                      id="proj-featured"
                      checked={
                        isFeatured
                      }
                      onCheckedChange={(
                        checked,
                      ) =>
                        form.setValue(
                          'isFeatured',
                          checked,
                          {
                            shouldDirty:
                              true,
                            shouldValidate:
                              true,
                          },
                        )
                      }
                    />

                  </div>

                </div>
              </div>


              {/* Visibility */}

              <div
                className={`rounded-2xl border p-4 transition-colors ${
                  isActive
                    ? 'border-success/20 bg-success/[0.035]'
                    : 'border-border/70 bg-muted/[0.08]'
                }`}
              >
                <div className="flex h-full flex-col justify-between gap-5">

                  <div className="flex items-start gap-3">

                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                        isActive
                          ? 'border-success/15 bg-success-subtle text-success'
                          : 'border-border/70 bg-background text-muted-foreground'
                      }`}
                    >
                      {isActive ? (
                        <CheckCircle2
                          className="size-4"
                          strokeWidth={
                            1.8
                          }
                        />
                      ) : (
                        <EyeOff
                          className="size-4"
                          strokeWidth={
                            1.8
                          }
                        />
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="proj-active"
                        className="cursor-pointer text-[12px] font-semibold"
                      >
                        Public visibility
                      </Label>

                      <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                        {isActive
                          ? 'This project is visible on the public website.'
                          : 'This project is hidden from the public website.'}
                      </p>
                    </div>

                  </div>


                  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2.5">

                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${
                          isActive
                            ? 'bg-success'
                            : 'bg-muted-foreground/35'
                        }`}
                      />

                      <span className="text-[10px] font-semibold text-foreground">
                        {isActive
                          ? 'Visible'
                          : 'Hidden'}
                      </span>
                    </div>

                    <Switch
                      id="proj-active"
                      checked={isActive}
                      onCheckedChange={(
                        checked,
                      ) =>
                        form.setValue(
                          'isActive',
                          checked,
                          {
                            shouldDirty:
                              true,
                            shouldValidate:
                              true,
                          },
                        )
                      }
                    />

                  </div>

                </div>
              </div>

            </div>
          </FormSection>


          {/* ================= Actions ================= */}

          <FormActions
            onCancel={onCancel}
            submitLabel={
              isEditing
                ? 'Save changes'
                : 'Create project'
            }
            isSubmitting={
              isSubmitting
            }
            sticky
          />

        </div>
      </div>


      <ConfirmDialog
        open={guard.isBlocked}
        onOpenChange={(open) => {
          if (!open) {
            guard.cancelLeave()
          }
        }}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        variant="destructive"
        onConfirm={
          guard.confirmLeave
        }
      />

    </form>
  )
}