import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Boxes,
  Hash,
  ImageIcon,
  Layers3,
  Link2,
  MapPin,
  ShieldCheck,
  Tag,
  Truck,
  Wrench,
} from 'lucide-react'

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FieldError } from '@/components/forms/FieldError'
import { FormErrorAlert } from '@/components/forms/FormErrorAlert'
import { FormSection } from '@/components/forms/FormSection'
import { FormStepper, type FormStep } from '@/components/forms/FormStepper'
import { FormStepNavigation } from '@/components/forms/FormStepNavigation'
import { ImageUploadField } from '@/components/forms/ImageUploadField'
import { VisibilityToggle } from '@/components/forms/VisibilityToggle'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

import {
  useCreateEquipmentMutation,
  useEquipmentCategoryOptionsQuery,
  useUpdateEquipmentMutation,
} from '@/features/equipment/queries'

import {
  equipmentSchema,
  type EquipmentInput,
} from '@/features/equipment/schema'

import type { Equipment } from '@/features/equipment/types'

interface EquipmentFormProps {
  equipment?: Equipment | null
  onSuccess: () => void
  onCancel?: () => void
}

// ==================== Steps ====================

const STEPS: FormStep[] = [
  { key: 'general', label: 'General', icon: Truck },
  { key: 'specification', label: 'Specification', icon: Wrench },
  { key: 'availability', label: 'Availability', icon: Layers3 },
  { key: 'image', label: 'Image', icon: ImageIcon },
]

// ==================== Default Values ====================

const emptyDefaults: EquipmentInput = {
  title: '',
  slug: '',
  category: '',
  shortDescription: '',
  description: '',
  specLabel: '',
  specValue: '',
  location: '',
  availableUnits: 0,
  safetyAvailable: false,
  safetyMessage: '',
  displayOrder: 0,
  isActive: true,
  imageAlt: '',
}

// ==================== Equipment Form ====================

export function EquipmentForm({ equipment, onSuccess }: EquipmentFormProps) {
  const isEditing = Boolean(equipment)

  // ==================== Step State ====================

  const [currentStep, setCurrentStep] = useState(0)
  const [completedStep, setCompletedStep] = useState(-1)

  // ==================== Error State ====================

  const [formError, setFormError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  // ==================== File State ====================

  const [imageFile, setImageFile] = useState<File | null>(null)

  // ==================== Queries ====================

  const { data: categoryOptions } = useEquipmentCategoryOptionsQuery()

  // ==================== Mutations ====================

  const createMutation = useCreateEquipmentMutation()
  const updateMutation = useUpdateEquipmentMutation()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // ==================== Form ====================

  const form = useForm<EquipmentInput>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: equipment
      ? {
          title: equipment.title,
          slug: equipment.slug,
          category: equipment.category._id,
          shortDescription: equipment.shortDescription,
          description: equipment.description,
          specLabel: equipment.primarySpecification.label,
          specValue: equipment.primarySpecification.value,
          location: equipment.location,
          availableUnits: equipment.availableUnits,
          safetyAvailable: equipment.safetyCertificate.isAvailable,
          safetyMessage: equipment.safetyCertificate.message,
          displayOrder: equipment.displayOrder,
          isActive: equipment.isActive,
          imageAlt: equipment.image.alt,
        }
      : emptyDefaults,
  })

  const safetyAvailable = form.watch('safetyAvailable') ?? false
  const isActive = form.watch('isActive') ?? true

  // ==================== Unsaved Changes ====================

  const guard = useUnsavedChangesGuard(
    form.formState.isDirty || imageFile !== null,
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
          'category',
          'location',
          'shortDescription',
          'description',
        ])

      case 1:
        return form.trigger([
          'specLabel',
          'specValue',
          'safetyAvailable',
          'safetyMessage',
        ])

      case 2:
        return form.trigger([
          'availableUnits',
          'displayOrder',
          'isActive',
        ])

      case 3: {
        const valid = await form.trigger(['imageAlt'])

        const hasImage =
          Boolean(imageFile) ||
          Boolean(equipment?.image?.url)

        setImageError(
          hasImage
            ? null
            : 'Equipment image is required.',
        )

        return valid && hasImage
      }

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
      const needsImage =
        !imageFile &&
        !equipment?.image?.url

      if (needsImage) {
        setImageError('Equipment image is required.')
        setCurrentStep(3)
        scrollFormToTop()
        return
      }

      setImageError(null)
      setFormError(null)

      const formData = buildFormData(
        {
          title: values.title,
          slug: values.slug,
          category: values.category,
          shortDescription: values.shortDescription,
          description: values.description,
          primarySpecification: {
            label: values.specLabel,
            value: values.specValue,
          },
          location: values.location,
          availableUnits: values.availableUnits,
          safetyCertificate: {
            isAvailable: values.safetyAvailable,
            message: values.safetyAvailable
              ? values.safetyMessage
              : '',
          },
          displayOrder: values.displayOrder,
          isActive: values.isActive,
          imageAlt: values.imageAlt,
        },
        {
          image: imageFile,
        },
      )

      // ==================== Server Error ====================

      const onError = (error: unknown) => {
        const generalError = applyServerErrors(form, error, {
          customFields: {
            image: (message: string) => {
              setImageError(message)
              setCurrentStep(3)
            },
          },
        })

        setFormError(generalError)
        scrollFormToTop()
      }

      // ==================== Update ====================

      if (isEditing && equipment) {
        updateMutation.mutate(
          {
            id: equipment._id,
            formData,
          },
          {
            onSuccess: () => {
              toast.success('Equipment updated successfully')
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
          toast.success('Equipment created successfully')
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
        errors.category ||
        errors.location ||
        errors.shortDescription ||
        errors.description
      ) {
        setCurrentStep(0)
        scrollFormToTop()
        return
      }

      if (
        errors.specLabel ||
        errors.specValue ||
        errors.safetyAvailable ||
        errors.safetyMessage
      ) {
        setCurrentStep(1)
        scrollFormToTop()
        return
      }

      if (
        errors.availableUnits ||
        errors.displayOrder ||
        errors.isActive
      ) {
        setCurrentStep(2)
        scrollFormToTop()
        return
      }

      if (errors.imageAlt) {
        setCurrentStep(3)
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
        title="Unable to save equipment"
        message={formError}
      />

      {/* ==================== Step Content ==================== */}

      <div className="min-w-0">
        {/* ==================== Step 1 - Basic Information ==================== */}

        {currentStep === 0 ? (
          <FormSection
            title="Basic Information"
            description="Core identity and descriptive information for this equipment."
            icon={Truck}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Title And Slug ==================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ==================== Equipment Title ==================== */}

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor="eq-title"
                      className="text-[12px] font-semibold"
                    >
                      Equipment title
                    </Label>

                    <span className="rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                      Required
                    </span>
                  </div>

                  <div className="group relative">
                    <Tag
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                      strokeWidth={1.8}
                    />

                    <Input
                      id="eq-title"
                      placeholder="e.g. CAT 320 Excavator"
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
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor="eq-slug"
                      className="text-[12px] font-semibold"
                    >
                      Slug
                    </Label>

                    <span className="rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                      URL
                    </span>
                  </div>

                  <div className="group relative">
                    <Link2
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                      strokeWidth={1.8}
                    />

                    <Input
                      id="eq-slug"
                      placeholder="e.g. cat-320-excavator"
                      className="h-11 rounded-xl pl-10 font-mono text-[12px]"
                      aria-invalid={!!form.formState.errors.slug}
                      {...form.register('slug')}
                    />
                  </div>

                  <FieldError
                    message={form.formState.errors.slug?.message}
                  />
                </div>
              </div>

              {/* ==================== Category And Location ==================== */}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ==================== Category ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="eq-category"
                    className="text-[12px] font-semibold"
                  >
                    Category
                  </Label>

                  <Select
                    value={form.watch('category')}
                    onValueChange={(value) =>
                      form.setValue('category', value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger
                      id="eq-category"
                      className="h-11 w-full rounded-xl"
                      aria-invalid={!!form.formState.errors.category}
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>

                    <SelectContent>
                      {(categoryOptions ?? []).map((option) => (
                        <SelectItem
                          key={option._id}
                          value={option._id}
                        >
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FieldError
                    message={form.formState.errors.category?.message}
                  />
                </div>

                {/* ==================== Location ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="eq-location"
                    className="text-[12px] font-semibold"
                  >
                    Location
                  </Label>

                  <div className="group relative">
                    <MapPin
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                      strokeWidth={1.8}
                    />

                    <Input
                      id="eq-location"
                      placeholder="e.g. Basra"
                      className="h-11 rounded-xl pl-10"
                      aria-invalid={!!form.formState.errors.location}
                      {...form.register('location')}
                    />
                  </div>

                  <FieldError
                    message={form.formState.errors.location?.message}
                  />
                </div>
              </div>

              {/* ==================== Short Description ==================== */}

              <div className="space-y-2">
                <Label
                  htmlFor="eq-short"
                  className="text-[12px] font-semibold"
                >
                  Short description
                </Label>

                <Textarea
                  id="eq-short"
                  rows={3}
                  placeholder="A concise description shown in equipment cards and previews."
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
                  htmlFor="eq-description"
                  className="text-[12px] font-semibold"
                >
                  Full description
                </Label>

                <Textarea
                  id="eq-description"
                  rows={5}
                  placeholder="Describe the equipment, its capabilities, applications, and relevant details."
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

        {/* ==================== Step 2 - Specification And Safety ==================== */}

        {currentStep === 1 ? (
          <FormSection
            title="Specification & Safety"
            description="Operational specifications and safety certification information."
            icon={Wrench}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Primary Specification ==================== */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* ==================== Specification Label ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="eq-spec-label"
                    className="text-[12px] font-semibold"
                  >
                    Specification label
                  </Label>

                  <Input
                    id="eq-spec-label"
                    placeholder="e.g. Engine Power"
                    className="h-11 rounded-xl"
                    aria-invalid={!!form.formState.errors.specLabel}
                    {...form.register('specLabel')}
                  />

                  <FieldError
                    message={form.formState.errors.specLabel?.message}
                  />
                </div>

                {/* ==================== Specification Value ==================== */}

                <div className="space-y-2">
                  <Label
                    htmlFor="eq-spec-value"
                    className="text-[12px] font-semibold"
                  >
                    Specification value
                  </Label>

                  <Input
                    id="eq-spec-value"
                    placeholder="e.g. 250 HP"
                    className="h-11 rounded-xl"
                    aria-invalid={!!form.formState.errors.specValue}
                    {...form.register('specValue')}
                  />

                  <FieldError
                    message={form.formState.errors.specValue?.message}
                  />
                </div>
              </div>

              {/* ==================== Safety Certificate ==================== */}

              <div
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  safetyAvailable
                    ? 'border-success/20 bg-success/[0.025]'
                    : 'border-border/70 bg-muted/[0.10]'
                }`}
              >
                <div className="flex items-center justify-between gap-5 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                        safetyAvailable
                          ? 'border-success/15 bg-success-subtle text-success'
                          : 'border-border/70 bg-background text-muted-foreground'
                      }`}
                    >
                      <ShieldCheck
                        className="size-[17px]"
                        strokeWidth={1.8}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="eq-safety"
                        className="cursor-pointer text-[12px] font-semibold"
                      >
                        Safety certificate
                      </Label>

                      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                        {safetyAvailable
                          ? 'A valid safety certificate is available for this equipment.'
                          : 'Enable this option when a valid certificate is available.'}
                      </p>
                    </div>
                  </div>

                  <Switch
                    id="eq-safety"
                    checked={safetyAvailable}
                    onCheckedChange={(checked) =>
                      form.setValue('safetyAvailable', checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                </div>

                {/* ==================== Safety Message ==================== */}

                {safetyAvailable ? (
                  <div className="border-t border-border/60 bg-background/40 px-4 py-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="eq-safety-message"
                        className="text-[12px] font-semibold"
                      >
                        Certificate message
                      </Label>

                      <Textarea
                        id="eq-safety-message"
                        rows={4}
                        placeholder="Add relevant safety or certification information."
                        className="min-h-[110px] resize-y rounded-xl bg-background"
                        aria-invalid={!!form.formState.errors.safetyMessage}
                        {...form.register('safetyMessage')}
                      />

                      <FieldError
                        message={form.formState.errors.safetyMessage?.message}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 3 - Availability And Visibility ==================== */}

        {currentStep === 2 ? (
          <FormSection
            title="Availability & Visibility"
            description="Control inventory quantities, catalog ordering, and public visibility."
            icon={Layers3}
            className="min-w-0"
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* ==================== Available Units ==================== */}

              <div className="rounded-2xl border border-border/70 bg-muted/[0.10] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <Boxes
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="eq-units"
                      className="text-[12px] font-semibold"
                    >
                      Available units
                    </Label>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                      Current quantity available.
                    </p>
                  </div>
                </div>

                <Input
                  id="eq-units"
                  type="number"
                  min={0}
                  max={99999}
                  className="mt-4 h-11 rounded-xl bg-background text-center text-base font-semibold tabular-nums"
                  aria-invalid={!!form.formState.errors.availableUnits}
                  {...form.register('availableUnits', {
                    valueAsNumber: true,
                  })}
                />

                <FieldError
                  message={form.formState.errors.availableUnits?.message}
                />
              </div>

              {/* ==================== Display Order ==================== */}

              <div className="rounded-2xl border border-border/70 bg-muted/[0.10] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <Hash
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="eq-order"
                      className="text-[12px] font-semibold"
                    >
                      Display order
                    </Label>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                      Lower numbers appear earlier.
                    </p>
                  </div>
                </div>

                <Input
                  id="eq-order"
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

              {/* ==================== Catalog Visibility ==================== */}

              <VisibilityToggle
                id="eq-active"
                checked={isActive}
                onCheckedChange={(checked) =>
                  form.setValue('isActive', checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                title="Catalog visibility"
                activeDescription="Visible on the public equipment catalog."
                inactiveDescription="Hidden from the public equipment catalog."
                activeLabel="Active"
                inactiveLabel="Inactive"
              />
            </div>
          </FormSection>
        ) : null}

        {/* ==================== Step 4 - Equipment Image ==================== */}

        {currentStep === 3 ? (
          <FormSection
            title="Equipment Image"
            description="Upload the primary image displayed throughout the equipment catalog."
            icon={ImageIcon}
            className="min-w-0"
          >
            <div className="space-y-6">
              {/* ==================== Image Upload ==================== */}

              <ImageUploadField
                id="eq-image"
                title="Equipment image"
                description="Click the image area to upload or replace the equipment image."
                file={imageFile}
                onFileChange={setImageFile}
                error={imageError}
                onErrorChange={setImageError}
                existingUrl={equipment?.image?.url}
                existingAlt={equipment?.image?.alt ?? 'Equipment preview'}
                placeholderTitle="Add equipment image"
                placeholderDescription="Click to select an image"
                acceptedFormatsText="JPEG, PNG, GIF or WebP — maximum file size 5 MB."
                maxWidthClassName="max-w-[460px]"
                aspectClassName="aspect-[16/7] min-h-[190px]"
                thumbnailWidth={900}
                icon={ImageIcon}
                required
              />

              {/* ==================== Accessibility Description ==================== */}

              <div className="rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                    <ImageIcon
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      Accessibility description
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                      Describe the visible content of the image.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="eq-image-alt"
                    className="text-[12px] font-semibold"
                  >
                    Image alt text
                  </Label>

                  <Input
                    id="eq-image-alt"
                    placeholder="e.g. CAT 320 excavator at project site"
                    className="h-11 rounded-xl bg-background"
                    aria-invalid={!!form.formState.errors.imageAlt}
                    {...form.register('imageAlt')}
                  />

                  <FieldError
                    message={form.formState.errors.imageAlt?.message}
                  />
                </div>
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
        submitLabel={isEditing ? 'Save changes' : 'Create equipment'}
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