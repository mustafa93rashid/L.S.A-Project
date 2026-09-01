import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  FileText,
  Hash,
  ImageIcon,
  Layers3,
  Newspaper,
  Send,
  Tag,
} from 'lucide-react'

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FieldError } from '@/components/forms/FieldError'
import { FormErrorAlert } from '@/components/forms/FormErrorAlert'
import { FormSection } from '@/components/forms/FormSection'
import {
  FormStepper,
  type FormStep,
} from '@/components/forms/FormStepper'
import { FormStepNavigation } from '@/components/forms/FormStepNavigation'
import { ImageUploadField } from '@/components/forms/ImageUploadField'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

import {
  useCreateNews,
  useUpdateNews,
} from '@/features/news/queries'

import {
  newsSchema,
  type NewsFormValues,
} from '@/features/news/schema'

import type { News } from '@/features/news/types'

// ==================== Props ====================

interface NewsFormProps {
  news?: News | null
  onSuccess: () => void
  onCancel: () => void
}

// ==================== Steps ====================

const STEPS: FormStep[] = [
  {
    key: 'content',
    label: 'Content',
    icon: Newspaper,
  },
  {
    key: 'publishing',
    label: 'Publishing',
    icon: Send,
  },
  {
    key: 'image',
    label: 'Image',
    icon: ImageIcon,
  },
]

// ==================== Default Values ====================

const emptyDefaults: NewsFormValues = {
  title: '',
  shortDescription: '',
  content: '',
  category: 'company',
  status: 'draft',
  displayOrder: 0,
  imageAlt: '',
  image: undefined,
}

// ==================== News Form ====================

export default function NewsForm({
  news,
  onSuccess,
}: NewsFormProps) {
  const isEditing = Boolean(news)

  // ==================== Step State ====================

  const [currentStep, setCurrentStep] = useState(0)
  const [completedStep, setCompletedStep] = useState(-1)

  // ==================== Error State ====================

  const [formError, setFormError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  // ==================== File State ====================

  const [imageFile, setImageFile] = useState<File | null>(null)

  // ==================== Mutations ====================

  const createMutation = useCreateNews()
  const updateMutation = useUpdateNews()

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending

  // ==================== Form ====================

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),

    defaultValues: news
      ? {
          title: news.title,
          shortDescription: news.shortDescription,
          content: news.content,
          category: news.category,
          status: news.status,
          displayOrder: news.displayOrder ?? 0,
          imageAlt: news.image?.alt ?? '',
          image: undefined,
        }
      : emptyDefaults,
  })

  const category = form.watch('category') ?? 'company'
  const status = form.watch('status') ?? 'draft'
  const shortDescription = form.watch('shortDescription') ?? ''

  // ==================== Unsaved Changes ====================

  const guard = useUnsavedChangesGuard(
    form.formState.isDirty ||
    imageFile !== null,
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
          'shortDescription',
          'content',
        ])

      case 1:
        return form.trigger([
          'category',
          'status',
          'displayOrder',
        ])

      case 2: {
        const valid = await form.trigger([
          'imageAlt',
        ])

        const hasImage =
          Boolean(imageFile) ||
          Boolean(news?.image?.url)

        if (!hasImage) {
          setImageError('News image is required.')
          return false
        }

        setImageError(null)

        return valid
      }

      default:
        return true
    }
  }

  // ==================== Next Step ====================

  const handleNext = async () => {
    const valid = await validateCurrentStep()

    if (!valid) return

    setCompletedStep((current) =>
      Math.max(current, currentStep),
    )

    setCurrentStep((current) =>
      Math.min(
        current + 1,
        STEPS.length - 1,
      ),
    )

    scrollFormToTop()
  }

  // ==================== Previous Step ====================

  const handlePrevious = () => {
    setCurrentStep((current) =>
      Math.max(current - 1, 0),
    )

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
      const needsImage =
        !imageFile &&
        !news?.image?.url

      if (needsImage) {
        setImageError(
          'News image is required.',
        )

        setCurrentStep(2)
        scrollFormToTop()

        return
      }

      setImageError(null)
      setFormError(null)

      // ==================== Form Data ====================

      const formData = buildFormData(
        {
          title: values.title,
          shortDescription: values.shortDescription,
          content: values.content,
          category: values.category,
          status: values.status,
          displayOrder: values.displayOrder,
          imageAlt: values.imageAlt || '',
        },
        {
          image: imageFile,
        },
      )

      // ==================== Server Error ====================

      const onError = (error: unknown) => {
        const generalError =
          applyServerErrors(
            form,
            error,
            {
              customFields: {
                image: (
                  message: string,
                ) => {
                  setImageError(
                    message,
                  )

                  setCurrentStep(2)
                },
              },
            },
          )

        setFormError(generalError)

        scrollFormToTop()
      }

      // ==================== Update ====================

      if (isEditing && news) {
        updateMutation.mutate(
          {
            id: news._id,
            formData,
          },
          {
            onSuccess: () => {
              toast.success(
                'News updated successfully',
              )

              guard.bypassOnce()

              onSuccess()
            },

            onError,
          },
        )

        return
      }

      // ==================== Create ====================

      createMutation.mutate(
        formData,
        {
          onSuccess: () => {
            toast.success(
              'News created successfully',
            )

            guard.bypassOnce()

            onSuccess()
          },

          onError,
        },
      )
    },

    // ==================== Client Validation Error ====================

    (errors) => {
      if (
        errors.title ||
        errors.shortDescription ||
        errors.content
      ) {
        setCurrentStep(0)

        scrollFormToTop()

        return
      }

      if (
        errors.category ||
        errors.status ||
        errors.displayOrder
      ) {
        setCurrentStep(1)

        scrollFormToTop()

        return
      }

      if (
        errors.imageAlt ||
        errors.image
      ) {
        setCurrentStep(2)

        scrollFormToTop()
      }
    },
  )

  return (
    <form
      onSubmit={(event) =>
        event.preventDefault()
      }
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
        title="Unable to save news"
        message={formError}
      />

      {/* ==================== Step Content ==================== */}

      <div className="min-w-0">
        {/* ==================== Step 1 - News Content ==================== */}

        {currentStep === 0 ? (
          <FormSection
            title="News Content"
            description="Define the title, summary, and complete content displayed for this news item."
            icon={Newspaper}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Title ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="news-title"
                  className="text-[12px] font-semibold"
                >
                  News title
                </Label>

                <div className="group relative">
                  <Newspaper
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                    strokeWidth={1.8}
                  />

                  <Input
                    id="news-title"
                    placeholder="Enter news title"
                    className="h-11 rounded-xl pl-10"
                    aria-invalid={
                      !!form.formState.errors.title
                    }
                    {...form.register(
                      'title',
                    )}
                  />
                </div>

                <FieldError
                  message={
                    form.formState.errors
                      .title?.message
                  }
                />
              </div>

              {/* ==================== Short Description ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="news-short-description"
                  className="text-[12px] font-semibold"
                >
                  Short description
                </Label>

                <Textarea
                  id="news-short-description"
                  rows={4}
                  placeholder="Enter a short description displayed in the news listing."
                  className="min-h-[110px] resize-y rounded-xl"
                  aria-invalid={
                    !!form.formState.errors
                      .shortDescription
                  }
                  {...form.register(
                    'shortDescription',
                  )}
                />

                <div className="flex items-start justify-between gap-4">
                  <FieldError
                    message={
                      form.formState.errors
                        .shortDescription
                        ?.message
                    }
                  />

                  <span
                    className={`shrink-0 text-[9px] tabular-nums ${
                      shortDescription.length >
                      500
                        ? 'font-medium text-destructive'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {
                      shortDescription.length
                    }
                    /500
                  </span>
                </div>
              </div>

              {/* ==================== Content ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="news-content"
                  className="text-[12px] font-semibold"
                >
                  Full content
                </Label>

                <Textarea
                  id="news-content"
                  rows={9}
                  placeholder="Write the complete news article."
                  className="min-h-[220px] resize-y rounded-xl"
                  aria-invalid={
                    !!form.formState.errors
                      .content
                  }
                  {...form.register(
                    'content',
                  )}
                />

                <FieldError
                  message={
                    form.formState.errors
                      .content?.message
                  }
                />
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 2 - Publishing Settings ==================== */}

        {currentStep === 1 ? (
          <FormSection
            title="Publishing Settings"
            description="Control the category, publication state, and position of this news item on the public website."
            icon={Send}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Category And Status ==================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ==================== Category ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="news-category"
                    className="text-[12px] font-semibold"
                  >
                    Category
                  </Label>

                  <Select
                    value={category}
                    onValueChange={(
                      value,
                    ) =>
                      form.setValue(
                        'category',
                        value as NewsFormValues['category'],
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      )
                    }
                  >
                    <SelectTrigger
                      id="news-category"
                      className="h-11 w-full rounded-xl"
                      aria-invalid={
                        !!form.formState
                          .errors.category
                      }
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="projects">
                        Projects
                      </SelectItem>

                      <SelectItem value="company">
                        Company
                      </SelectItem>

                      <SelectItem value="hse">
                        HSE
                      </SelectItem>

                      <SelectItem value="events">
                        Events
                      </SelectItem>

                      <SelectItem value="partnerships">
                        Partnerships
                      </SelectItem>

                      <SelectItem value="achievements">
                        Achievements
                      </SelectItem>

                      <SelectItem value="training">
                        Training
                      </SelectItem>

                      <SelectItem value="equipment">
                        Equipment
                      </SelectItem>

                      <SelectItem value="other">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <FieldError
                    message={
                      form.formState.errors
                        .category?.message
                    }
                  />
                </div>

                {/* ==================== Status ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="news-status"
                    className="text-[12px] font-semibold"
                  >
                    Status
                  </Label>

                  <Select
                    value={status}
                    onValueChange={(
                      value,
                    ) =>
                      form.setValue(
                        'status',
                        value as NewsFormValues['status'],
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      )
                    }
                  >
                    <SelectTrigger
                      id="news-status"
                      className="h-11 w-full rounded-xl"
                      aria-invalid={
                        !!form.formState
                          .errors.status
                      }
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="draft">
                        Draft
                      </SelectItem>

                      <SelectItem value="published">
                        Published
                      </SelectItem>

                      <SelectItem value="archived">
                        Archived
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <FieldError
                    message={
                      form.formState.errors
                        .status?.message
                    }
                  />
                </div>
              </div>

              {/* ==================== Display Order ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="news-display-order"
                  className="text-[12px] font-semibold"
                >
                  Display order
                </Label>

                <div className="group relative">
                  <Hash
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                    strokeWidth={1.8}
                  />

                  <Input
                    id="news-display-order"
                    type="number"
                    min={0}
                    max={999}
                    className="h-11 rounded-xl pl-10"
                    aria-invalid={
                      !!form.formState.errors
                        .displayOrder
                    }
                    {...form.register(
                      'displayOrder',
                      {
                        valueAsNumber: true,
                      },
                    )}
                  />
                </div>

                <FieldError
                  message={
                    form.formState.errors
                      .displayOrder?.message
                  }
                />

                <p className="flex items-start gap-1.5 text-[10px] leading-5 text-muted-foreground">
                  <Layers3
                    className="mt-1 size-3 shrink-0"
                    strokeWidth={1.8}
                  />

                  Lower numbers appear first
                  on the public website.
                </p>
              </div>

              {/* ==================== Publishing Preview ==================== */}

              <div className="rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                      status ===
                      'published'
                        ? 'border-success/20 bg-success-subtle text-success'
                        : 'border-border/70 bg-background text-muted-foreground'
                    }`}
                  >
                    {status ===
                    'published' ? (
                      <Send
                        className="size-4"
                        strokeWidth={1.8}
                      />
                    ) : (
                      <FileText
                        className="size-4"
                        strokeWidth={1.8}
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold capitalize text-foreground">
                      {status}
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                      {status ===
                      'published'
                        ? 'This news item will be visible on the public website.'
                        : status ===
                            'archived'
                          ? 'This news item is archived and will not appear as active public news.'
                          : 'This news item remains private until it is published.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 3 - News Image ==================== */}

        {currentStep === 2 ? (
          <FormSection
            title="News Image"
            description="Upload the visual displayed with this news item on the public website."
            icon={ImageIcon}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Image ==================== */}

              <ImageUploadField
                id="news-image"
                title="News image"
                description="Click the image area to upload or replace the news image."
                file={imageFile}
                onFileChange={
                  setImageFile
                }
                error={imageError}
                onErrorChange={
                  setImageError
                }
                existingUrl={
                  news?.image?.url
                }
                existingAlt={
                  news?.image?.alt ??
                  news?.title ??
                  'News image'
                }
                placeholderTitle="Add news image"
                placeholderDescription="Click to select an image"
                acceptedFormatsText="JPEG, PNG, GIF or WebP — maximum file size 5 MB."
                maxWidthClassName="max-w-[620px]"
                aspectClassName="aspect-[16/8]"
                thumbnailWidth={960}
                icon={ImageIcon}
                required
              />

              {/* ==================== Image Alt ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="news-image-alt"
                  className="text-[12px] font-semibold"
                >
                  Image alt text
                </Label>

                <div className="group relative">
                  <Tag
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                    strokeWidth={1.8}
                  />

                  <Input
                    id="news-image-alt"
                    placeholder="Describe the image for accessibility"
                    className="h-11 rounded-xl pl-10"
                    aria-invalid={
                      !!form.formState.errors
                        .imageAlt
                    }
                    {...form.register(
                      'imageAlt',
                    )}
                  />
                </div>

                <FieldError
                  message={
                    form.formState.errors
                      .imageAlt?.message
                  }
                />

                <p className="text-[10px] leading-5 text-muted-foreground">
                  Used by screen readers
                  and when the image cannot
                  be displayed.
                </p>
              </div>
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
        submitLabel={
          isEditing
            ? 'Save changes'
            : 'Create news'
        }
      />

      {/* ==================== Confirm Dialog ==================== */}

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