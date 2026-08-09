import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  FileCheck2,
  Hash,
  ImageIcon,
  Info,
  Layers3,
  Link2,
  MapPin,
  ShieldCheck,
  Tag,
  Truck,
  Upload,
  Wrench,
  X,
} from 'lucide-react'

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { FormActions } from '@/components/forms/FormActions'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/file-validation'

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
  onCancel: () => void
}

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

/* =========================================================
    Field Error
========================================================= */

function FieldError({
  message,
}: {
  message?: string
}) {
  if (!message) return null

  return (
    <p className="flex items-center gap-1.5 text-[11px] text-destructive">
      <AlertCircle className="size-3" />
      {message}
    </p>
  )
}

/* =========================================================
    Section Header
========================================================= */

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string
  title: string
  description: string
  icon: typeof Info
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div
        className="
          flex
          size-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          border
          border-border/70
          bg-muted/30
          text-muted-foreground
        "
      >
        <Icon
          className="size-4"
          strokeWidth={1.8}
        />
      </div>

      <div>
        <span
          className="
            text-[9px]
            font-semibold
            tracking-[0.14em]
            text-muted-foreground/65
            uppercase
          "
        >
          {eyebrow}
        </span>

        <h3
          className="
            mt-1
            text-[14px]
            font-semibold
            tracking-[-0.015em]
            text-foreground
          "
        >
          {title}
        </h3>

        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

/* =========================================================
    Equipment Form
========================================================= */

export function EquipmentForm({
  equipment,
  onSuccess,
  onCancel,
}: EquipmentFormProps) {
  const isEditing = Boolean(equipment)

  const [formError, setFormError] =
    useState<string | null>(null)

  const [imageFile, setImageFile] =
    useState<File | null>(null)

  const [imagePreview, setImagePreview] =
    useState<string | null>(null)

  const { data: categoryOptions } =
    useEquipmentCategoryOptionsQuery()

  const createMutation =
    useCreateEquipmentMutation()

  const updateMutation =
    useUpdateEquipmentMutation()

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending

  /* =========================================================
      Form
  ========================================================= */

  const form = useForm<EquipmentInput>({
    resolver: zodResolver(
      equipmentSchema,
    ),

    defaultValues: equipment
      ? {
          title:
            equipment.title,

          slug:
            equipment.slug,

          category:
            equipment.category._id,

          shortDescription:
            equipment.shortDescription,

          description:
            equipment.description,

          specLabel:
            equipment.primarySpecification
              .label,

          specValue:
            equipment.primarySpecification
              .value,

          location:
            equipment.location,

          availableUnits:
            equipment.availableUnits,

          safetyAvailable:
            equipment.safetyCertificate
              .isAvailable,

          safetyMessage:
            equipment.safetyCertificate
              .message,

          displayOrder:
            equipment.displayOrder,

          isActive:
            equipment.isActive,

          imageAlt:
            equipment.image.alt,
        }
      : emptyDefaults,
  })

  const safetyAvailable =
    form.watch('safetyAvailable')

  const isActive =
    form.watch('isActive')

  const guard =
    useUnsavedChangesGuard(
      form.formState.isDirty ||
        imageFile !== null,
    )

  /* =========================================================
      Image Preview
  ========================================================= */

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }

    const objectUrl =
      URL.createObjectURL(imageFile)

    setImagePreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [imageFile])

  const currentImage =
    useMemo(() => {
      if (imagePreview) {
        return imagePreview
      }

      if (
        equipment?.image.url
      ) {
        return cloudinaryThumbnail(
          equipment.image.url,
          700,
        )
      }

      return null
    }, [
      equipment,
      imagePreview,
    ])

  /* =========================================================
      Submit
  ========================================================= */

  const onSubmit =
    form.handleSubmit(
      (values) => {
        if (
          !isEditing &&
          !imageFile
        ) {
          setFormError(
            'Equipment image is required.',
          )

          return
        }

        setFormError(null)

        const formData =
          buildFormData(
            {
              title:
                values.title,

              slug:
                values.slug,

              category:
                values.category,

              shortDescription:
                values.shortDescription,

              description:
                values.description,

              primarySpecification: {
                label:
                  values.specLabel,

                value:
                  values.specValue,
              },

              location:
                values.location,

              availableUnits:
                values.availableUnits,

              safetyCertificate: {
                isAvailable:
                  values.safetyAvailable,

                message:
                  values.safetyAvailable
                    ? values.safetyMessage
                    : '',
              },

              displayOrder:
                values.displayOrder,

              isActive:
                values.isActive,

              imageAlt:
                values.imageAlt,
            },

            {
              image: imageFile,
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
          equipment
        ) {
          updateMutation.mutate(
            {
              id: equipment._id,
              formData,
            },
            {
              onSuccess: () => {
                toast.success(
                  'Equipment updated successfully',
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
                'Equipment created successfully',
              )

              guard.bypassOnce()

              onSuccess()
            },

            onError,
          },
        )
      },
    )

  /* =========================================================
      Image Selection
  ========================================================= */

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0] ??
      null

    if (!file) {
      setImageFile(null)
      return
    }

    const validationError =
      validateImageFile(file)

    if (validationError) {
      setFormError(
        validationError,
      )

      setImageFile(null)

      event.target.value = ''

      return
    }

    setFormError(null)
    setImageFile(file)
  }

  /* =========================================================
      Render
  ========================================================= */

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-6"
    >
      {/* =====================================================
          Global Form Error
      ===================================================== */}

      {formError ? (
        <div
          role="alert"
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-destructive/20
            bg-destructive/[0.045]
            px-4
            py-3
          "
        >
          <AlertCircle
            className="
              mt-0.5
              size-4
              shrink-0
              text-destructive
            "
            strokeWidth={1.8}
          />

          <div>
            <p className="text-[12px] font-semibold text-destructive">
              Unable to save equipment
            </p>

            <p className="mt-0.5 text-[11px] leading-5 text-destructive/80">
              {formError}
            </p>
          </div>
        </div>
      ) : null}

      {/* =====================================================
          Basic Information
      ===================================================== */}

      <section
        className="
          rounded-[22px]
          border
          border-border/70
          bg-card
          p-5
          shadow-[0_1px_3px_rgba(0,0,0,0.025)]
          sm:p-6
        "
      >
        <SectionHeader
          eyebrow="Equipment"
          title="Basic Information"
          description="Core information used to identify and describe this equipment."
          icon={Truck}
        />

        <div className="space-y-5">
          {/* Title / Slug */}
          <div
            className="
              grid
              grid-cols-1
              gap-5
              lg:grid-cols-2
            "
          >
            {/* Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor="eq-title"
                  className="text-[12px] font-medium"
                >
                  Equipment title
                </Label>

                <span className="text-[9px] font-medium text-muted-foreground/55">
                  Required
                </span>
              </div>

              <div className="relative">
                <Tag
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    size-4
                    -translate-y-1/2
                    text-muted-foreground/45
                  "
                  strokeWidth={1.8}
                />

                <Input
                  id="eq-title"
                  placeholder="e.g. CAT 320 Excavator"
                  aria-invalid={
                    !!form.formState
                      .errors.title
                  }
                  {...form.register(
                    'title',
                  )}
                  className="
                    h-11
                    rounded-xl
                    pl-10
                  "
                />
              </div>

              <FieldError
                message={
                  form.formState
                    .errors.title
                    ?.message
                }
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor="eq-slug"
                  className="text-[12px] font-medium"
                >
                  Slug
                </Label>

                <span className="text-[9px] font-medium text-muted-foreground/55">
                  URL identifier
                </span>
              </div>

              <div className="relative">
                <Link2
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    size-4
                    -translate-y-1/2
                    text-muted-foreground/45
                  "
                  strokeWidth={1.8}
                />

                <Input
                  id="eq-slug"
                  placeholder="e.g. cat-320-excavator"
                  aria-invalid={
                    !!form.formState
                      .errors.slug
                  }
                  {...form.register(
                    'slug',
                  )}
                  className="
                    h-11
                    rounded-xl
                    pl-10
                    font-mono
                    text-[12px]
                  "
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
          </div>

          {/* Category / Location */}
          <div
            className="
              grid
              grid-cols-1
              gap-5
              lg:grid-cols-2
            "
          >
            {/* Category */}
            <div className="space-y-2">
              <Label
                htmlFor="eq-category"
                className="text-[12px] font-medium"
              >
                Category
              </Label>

              <Select
                value={
                  form.watch(
                    'category',
                  )
                }
                onValueChange={(
                  value,
                ) =>
                  form.setValue(
                    'category',
                    value,
                    {
                      shouldValidate:
                        true,
                      shouldDirty:
                        true,
                    },
                  )
                }
              >
                <SelectTrigger
                  id="eq-category"
                  aria-invalid={
                    !!form.formState
                      .errors.category
                  }
                  className="
                    h-11
                    rounded-xl
                  "
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>

                <SelectContent>
                  {(
                    categoryOptions ??
                    []
                  ).map(
                    (option) => (
                      <SelectItem
                        key={
                          option._id
                        }
                        value={
                          option._id
                        }
                      >
                        {
                          option.name
                        }
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>

              <FieldError
                message={
                  form.formState
                    .errors.category
                    ?.message
                }
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label
                htmlFor="eq-location"
                className="text-[12px] font-medium"
              >
                Location
              </Label>

              <div className="relative">
                <MapPin
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    size-4
                    -translate-y-1/2
                    text-muted-foreground/45
                  "
                  strokeWidth={1.8}
                />

                <Input
                  id="eq-location"
                  placeholder="e.g. Basra"
                  aria-invalid={
                    !!form.formState
                      .errors.location
                  }
                  {...form.register(
                    'location',
                  )}
                  className="
                    h-11
                    rounded-xl
                    pl-10
                  "
                />
              </div>

              <FieldError
                message={
                  form.formState
                    .errors.location
                    ?.message
                }
              />
            </div>
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label
              htmlFor="eq-short"
              className="text-[12px] font-medium"
            >
              Short description
            </Label>

            <Textarea
              id="eq-short"
              rows={2}
              placeholder="A concise description shown in equipment cards and previews."
              aria-invalid={
                !!form.formState
                  .errors
                  .shortDescription
              }
              {...form.register(
                'shortDescription',
              )}
              className="
                min-h-[82px]
                resize-none
                rounded-xl
              "
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

          {/* Full Description */}
          <div className="space-y-2">
            <Label
              htmlFor="eq-description"
              className="text-[12px] font-medium"
            >
              Full description
            </Label>

            <Textarea
              id="eq-description"
              rows={5}
              placeholder="Describe the equipment, its capabilities, applications, and relevant details."
              aria-invalid={
                !!form.formState
                  .errors.description
              }
              {...form.register(
                'description',
              )}
              className="
                min-h-[140px]
                resize-y
                rounded-xl
              "
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
      </section>

      {/* =====================================================
          Technical + Catalog Layout
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-6
          xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]
        "
      >
        {/* ===================================================
            Technical Information
        =================================================== */}

        <section
          className="
            rounded-[22px]
            border
            border-border/70
            bg-card
            p-5
            shadow-[0_1px_3px_rgba(0,0,0,0.025)]
            sm:p-6
          "
        >
          <SectionHeader
            eyebrow="Technical"
            title="Specification & Safety"
            description="Operational specification and safety information for this equipment."
            icon={Wrench}
          />

          <div className="space-y-5">
            {/* Specification */}
            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
              "
            >
              <div className="space-y-2">
                <Label
                  htmlFor="eq-spec-label"
                  className="text-[12px] font-medium"
                >
                  Specification label
                </Label>

                <Input
                  id="eq-spec-label"
                  placeholder="e.g. Engine Power"
                  aria-invalid={
                    !!form.formState
                      .errors.specLabel
                  }
                  {...form.register(
                    'specLabel',
                  )}
                  className="h-11 rounded-xl"
                />

                <FieldError
                  message={
                    form.formState
                      .errors.specLabel
                      ?.message
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="eq-spec-value"
                  className="text-[12px] font-medium"
                >
                  Specification value
                </Label>

                <Input
                  id="eq-spec-value"
                  placeholder="e.g. 250 HP"
                  aria-invalid={
                    !!form.formState
                      .errors.specValue
                  }
                  {...form.register(
                    'specValue',
                  )}
                  className="h-11 rounded-xl"
                />

                <FieldError
                  message={
                    form.formState
                      .errors.specValue
                      ?.message
                  }
                />
              </div>
            </div>

            {/* Safety */}
            <div
              className="
                overflow-hidden
                rounded-2xl
                border
                border-border/70
                bg-muted/[0.14]
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-5
                  px-4
                  py-3.5
                "
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      flex
                      size-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      ${
                        safetyAvailable
                          ? 'border-success/15 bg-success-subtle text-success'
                          : 'border-border/70 bg-background text-muted-foreground'
                      }
                    `}
                  >
                    <ShieldCheck
                      className="size-4"
                      strokeWidth={
                        1.8
                      }
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="eq-safety"
                      className="
                        cursor-pointer
                        text-[12px]
                        font-semibold
                      "
                    >
                      Safety certificate
                    </Label>

                    <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                      Indicate whether a valid safety certificate is available.
                    </p>
                  </div>
                </div>

                <Switch
                  id="eq-safety"
                  checked={
                    safetyAvailable
                  }
                  onCheckedChange={(
                    checked,
                  ) =>
                    form.setValue(
                      'safetyAvailable',
                      checked,
                      {
                        shouldDirty:
                          true,
                      },
                    )
                  }
                />
              </div>

              {safetyAvailable ? (
                <div
                  className="
                    border-t
                    border-border/60
                    px-4
                    py-4
                  "
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="eq-safety-message"
                      className="text-[12px] font-medium"
                    >
                      Certificate message
                    </Label>

                    <Textarea
                      id="eq-safety-message"
                      rows={3}
                      placeholder="Add relevant safety or certification information."
                      aria-invalid={
                        !!form.formState
                          .errors
                          .safetyMessage
                      }
                      {...form.register(
                        'safetyMessage',
                      )}
                      className="
                        min-h-[90px]
                        resize-none
                        rounded-xl
                        bg-background
                      "
                    />

                    <FieldError
                      message={
                        form.formState
                          .errors
                          .safetyMessage
                          ?.message
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* ===================================================
            Catalog Settings
        =================================================== */}

        <section
          className="
            rounded-[22px]
            border
            border-border/70
            bg-card
            p-5
            shadow-[0_1px_3px_rgba(0,0,0,0.025)]
            sm:p-6
          "
        >
          <SectionHeader
            eyebrow="Catalog"
            title="Availability & Visibility"
            description="Control inventory quantities, ordering, and public visibility."
            icon={Layers3}
          />

          <div className="space-y-4">
            {/* Units */}
            <div className="space-y-2">
              <Label
                htmlFor="eq-units"
                className="text-[12px] font-medium"
              >
                Available units
              </Label>

              <div className="relative">
                <Boxes
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    size-4
                    -translate-y-1/2
                    text-muted-foreground/45
                  "
                  strokeWidth={1.8}
                />

                <Input
                  id="eq-units"
                  type="number"
                  min={0}
                  max={99999}
                  aria-invalid={
                    !!form.formState
                      .errors
                      .availableUnits
                  }
                  {...form.register(
                    'availableUnits',
                    {
                      valueAsNumber:
                        true,
                    },
                  )}
                  className="
                    h-11
                    rounded-xl
                    pl-10
                    tabular-nums
                  "
                />
              </div>

              <FieldError
                message={
                  form.formState
                    .errors
                    .availableUnits
                    ?.message
                }
              />
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label
                htmlFor="eq-order"
                className="text-[12px] font-medium"
              >
                Display order
              </Label>

              <div className="relative">
                <Hash
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    size-4
                    -translate-y-1/2
                    text-muted-foreground/45
                  "
                  strokeWidth={1.8}
                />

                <Input
                  id="eq-order"
                  type="number"
                  min={0}
                  max={999}
                  {...form.register(
                    'displayOrder',
                    {
                      valueAsNumber:
                        true,
                    },
                  )}
                  className="
                    h-11
                    rounded-xl
                    pl-10
                    tabular-nums
                  "
                />
              </div>

              <p className="text-[10px] leading-4 text-muted-foreground">
                Lower values appear earlier in the public catalog.
              </p>
            </div>

            {/* Active */}
            <div
              className="
                flex
                items-center
                justify-between
                gap-5
                rounded-2xl
                border
                border-border/70
                bg-muted/[0.14]
                px-4
                py-3.5
              "
            >
              <div className="flex items-start gap-3">
                <div
                  className={`
                    flex
                    size-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    ${
                      isActive
                        ? 'border-success/15 bg-success-subtle text-success'
                        : 'border-border/70 bg-background text-muted-foreground'
                    }
                  `}
                >
                  {isActive ? (
                    <CheckCircle2
                      className="size-4"
                      strokeWidth={
                        1.8
                      }
                    />
                  ) : (
                    <FileCheck2
                      className="size-4"
                      strokeWidth={
                        1.8
                      }
                    />
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="eq-active"
                    className="
                      cursor-pointer
                      text-[12px]
                      font-semibold
                    "
                  >
                    Catalog visibility
                  </Label>

                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                    {isActive
                      ? 'Visible on the public equipment catalog.'
                      : 'Hidden from the public equipment catalog.'}
                  </p>
                </div>
              </div>

              <Switch
                id="eq-active"
                checked={
                  isActive
                }
                onCheckedChange={(
                  checked,
                ) =>
                  form.setValue(
                    'isActive',
                    checked,
                    {
                      shouldDirty:
                        true,
                    },
                  )
                }
              />
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================
          Equipment Media
      ===================================================== */}

      <section
        className="
          rounded-[22px]
          border
          border-border/70
          bg-card
          p-5
          shadow-[0_1px_3px_rgba(0,0,0,0.025)]
          sm:p-6
        "
      >
        <SectionHeader
          eyebrow="Media"
          title="Equipment Image"
          description="Upload the primary image displayed throughout the equipment catalog."
          icon={ImageIcon}
        />

        <div
          className="
            grid
            grid-cols-1
            gap-6
            lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]
          "
        >
          {/* =================================================
              Image Preview
          ================================================= */}

          <div>
            <div
              className="
                relative
                aspect-[16/10]
                overflow-hidden
                rounded-[18px]
                border
                border-border/70
                bg-muted/35
              "
            >
              {currentImage ? (
                <img
                  src={
                    currentImage
                  }
                  alt={
                    form.watch(
                      'imageAlt',
                    ) ||
                    equipment?.image
                      .alt ||
                    'Equipment preview'
                  }
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />
              ) : (
                <div
                  className="
                    flex
                    h-full
                    flex-col
                    items-center
                    justify-center
                    gap-3
                    text-muted-foreground/45
                  "
                >
                  <div
                    className="
                      flex
                      size-12
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-border/70
                      bg-background/60
                    "
                  >
                    <ImageIcon
                      className="size-5"
                      strokeWidth={
                        1.6
                      }
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-[11px] font-medium">
                      No image selected
                    </p>

                    <p className="mt-1 text-[10px]">
                      JPEG, PNG, GIF or WebP
                    </p>
                  </div>
                </div>
              )}

              {imageFile ? (
                <div
                  className="
                    absolute
                    inset-x-3
                    bottom-3
                    flex
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    border
                    border-white/15
                    bg-black/35
                    px-3
                    py-2
                    backdrop-blur-md
                  "
                >
                  <div className="min-w-0">
                    <p
                      className="
                        truncate
                        text-[10px]
                        font-medium
                        text-white
                      "
                    >
                      {
                        imageFile.name
                      }
                    </p>

                    <p className="mt-0.5 text-[9px] text-white/55">
                      New image selected
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Remove selected image"
                    onClick={() =>
                      setImageFile(
                        null,
                      )
                    }
                    className="
                      flex
                      size-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      text-white/65
                      transition-colors
                      hover:bg-white/10
                      hover:text-white
                    "
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : null}
            </div>

            {isEditing &&
            !imageFile ? (
              <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                The current image will remain unchanged unless you select a replacement.
              </p>
            ) : null}
          </div>

          {/* =================================================
              Upload Controls
          ================================================= */}

          <div className="space-y-5">
            {/* Upload */}
            <div className="space-y-2">
              <Label
                htmlFor="eq-image"
                className="text-[12px] font-medium"
              >
                {isEditing
                  ? 'Replace image'
                  : 'Equipment image'}
              </Label>

              <label
                htmlFor="eq-image"
                className="
                  group
                  flex
                  cursor-pointer
                  items-center
                  gap-4
                  rounded-2xl
                  border
                  border-dashed
                  border-border
                  bg-muted/[0.12]
                  px-4
                  py-4
                  transition-all
                  hover:border-foreground/15
                  hover:bg-muted/25
                "
              >
                <div
                  className="
                    flex
                    size-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-border/70
                    bg-background
                    text-muted-foreground
                    transition-colors
                    group-hover:text-foreground
                  "
                >
                  <Upload
                    className="size-4"
                    strokeWidth={
                      1.8
                    }
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-foreground">
                    Choose image
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                    JPEG, PNG, GIF or WebP. Select a high-quality catalog image.
                  </p>
                </div>

                <span
                  className="
                    hidden
                    rounded-lg
                    border
                    border-border
                    bg-background
                    px-2.5
                    py-1.5
                    text-[10px]
                    font-medium
                    text-muted-foreground
                    sm:block
                  "
                >
                  Browse
                </span>
              </label>

              <input
                id="eq-image"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                aria-invalid={
                  !!formError
                }
                onChange={
                  handleImageChange
                }
                className="sr-only"
              />
            </div>

            {/* Alt Text */}
            <div className="space-y-2">
              <Label
                htmlFor="eq-image-alt"
                className="text-[12px] font-medium"
              >
                Image alt text
              </Label>

              <Input
                id="eq-image-alt"
                placeholder="Describe the image for accessibility."
                {...form.register(
                  'imageAlt',
                )}
                className="h-11 rounded-xl"
              />

              <p className="text-[10px] leading-4 text-muted-foreground">
                Used by screen readers and when the image cannot be displayed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          Actions
      ===================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          border-t
          border-border/60
          pt-5
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div className="hidden items-center gap-2 sm:flex">
          <Info
            className="size-3.5 text-muted-foreground/45"
            strokeWidth={1.8}
          />

          <span className="text-[10px] text-muted-foreground">
            Review all equipment information before saving.
          </span>
        </div>

        <FormActions
          onCancel={onCancel}
          submitLabel={
            isEditing
              ? 'Save changes'
              : 'Create equipment'
          }
          isSubmitting={
            isSubmitting
          }
        />
      </div>

      {/* =====================================================
          Unsaved Changes
      ===================================================== */}

      <ConfirmDialog
        open={
          guard.isBlocked
        }
        onOpenChange={(
          open,
        ) => {
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