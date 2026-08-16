import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Clock3,
  FileText,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Share2,
} from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'

import { FieldError } from '@/components/forms/FieldError'
import { FormErrorAlert } from '@/components/forms/FormErrorAlert'
import { FormSection } from '@/components/forms/FormSection'
import { FormStepper, type FormStep } from '@/components/forms/FormStepper'
import { FormStepNavigation } from '@/components/forms/FormStepNavigation'
import { StringListField } from '@/components/forms/StringListField'
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
import { Textarea } from '@/components/ui/textarea'

import { applyServerErrors } from '@/lib/form-errors'

import {
  useContactInfoQuery,
  useSaveContactInfoMutation,
} from '@/features/contact-info/queries'

import {
  contactInfoSchema,
  type ContactInfoInput,
} from '@/features/contact-info/schema'

// ==================== Steps ====================

const STEPS: FormStep[] = [
  {
    key: 'general',
    label: 'General',
    icon: FileText,
  },
  {
    key: 'location',
    label: 'Location',
    icon: MapPin,
  },
  {
    key: 'contact',
    label: 'Contact',
    icon: Phone,
  },
  {
    key: 'hours',
    label: 'Hours',
    icon: Clock3,
  },
  {
    key: 'social',
    label: 'Social',
    icon: Share2,
  },
]

// ==================== Default Values ====================

const emptyDefaults: ContactInfoInput = {
  title: '',
  description: '',
  address: '',
  mapUrl: '',
  phones: [''],
  primaryPhone: '',
  email: '',
  workingHours: '',
  emergencyHours: '',
  facebook: '',
  instagram: '',
  linkedin: '',
  whatsapp: '',
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

    return typeof candidate.message === 'string'
      ? candidate.message
      : undefined
  })
}

// ==================== Contact Information Page ====================

export default function ContactInfoPage() {
  // ==================== Query ====================

  const {
    data: contactInfo,
    isLoading,
    isError,
    refetch,
  } = useContactInfoQuery()

  // ==================== Mutation ====================

  const saveMutation = useSaveContactInfoMutation()

  // ==================== Step State ====================

  const [currentStep, setCurrentStep] = useState(0)
  const [completedStep, setCompletedStep] = useState(-1)

  // ==================== Error State ====================

  const [formError, setFormError] = useState<string | null>(null)

  // ==================== Form ====================

  const form = useForm<ContactInfoInput>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: emptyDefaults,
  })

  // ==================== Load Contact Information ====================

  useEffect(() => {
    if (!contactInfo) return

    const normalizedPhones = (contactInfo.phones ?? [])
      .map((phone) => phone.trim())
      .filter(Boolean)

    form.reset({
      title: contactInfo.title ?? '',
      description: contactInfo.description ?? '',
      address:
        contactInfo.location?.address ??
        contactInfo.address ??
        '',
      mapUrl: contactInfo.location?.mapUrl ?? '',
      phones: normalizedPhones.length > 0 ? normalizedPhones : [''],
      primaryPhone: contactInfo.primaryPhone?.trim() ?? '',
      email: contactInfo.email ?? '',
      workingHours: contactInfo.workingHours ?? '',
      emergencyHours: contactInfo.emergencyHours ?? '',
      facebook: contactInfo.socialLinks?.facebook ?? '',
      instagram: contactInfo.socialLinks?.instagram ?? '',
      linkedin: contactInfo.socialLinks?.linkedin ?? '',
      whatsapp: contactInfo.socialLinks?.whatsapp ?? '',
      isActive: contactInfo.isActive ?? true,
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactInfo])

  // ==================== Watched Values ====================

  const watchedPhones = form.watch('phones') ?? ['']
  const primaryPhone = form.watch('primaryPhone') ?? ''
  const isActive = form.watch('isActive') ?? true

  // ==================== Normalized Phones ====================

  const phones = watchedPhones
    .map((phone) => phone.trim())
    .filter(Boolean)

  // ==================== Phones Change ====================

  const handlePhonesChange = (values: string[]) => {
    const normalizedValues = values.map((phone) => phone.trimStart())

    form.setValue('phones', normalizedValues, {
      shouldDirty: true,
      shouldValidate: true,
    })

    const currentPrimaryPhone = (
      form.getValues('primaryPhone') ?? ''
    ).trim()

    const availablePhones = normalizedValues
      .map((phone) => phone.trim())
      .filter(Boolean)

    if (
      currentPrimaryPhone &&
      !availablePhones.includes(currentPrimaryPhone)
    ) {
      form.setValue('primaryPhone', '', {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }

  // ==================== Primary Phone Change ====================

  const handlePrimaryPhoneChange = (value: string) => {
    form.setValue('primaryPhone', value.trim(), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

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

  // ==================== Validate Primary Phone ====================

  const validatePrimaryPhone = (): boolean => {
    const normalizedPhones = (form.getValues('phones') ?? [])
      .map((phone) => phone.trim())
      .filter(Boolean)

    const normalizedPrimaryPhone = (
      form.getValues('primaryPhone') ?? ''
    ).trim()

    if (
      normalizedPrimaryPhone &&
      !normalizedPhones.includes(normalizedPrimaryPhone)
    ) {
      form.setError('primaryPhone', {
        type: 'manual',
        message: 'Primary phone number must exist in the phones list.',
      })

      return false
    }

    return true
  }

  // ==================== Validate Current Step ====================

  const validateCurrentStep = async (): Promise<boolean> => {
    setFormError(null)

    switch (currentStep) {
      case 0:
        return form.trigger([
          'title',
          'description',
          'isActive',
        ])

      case 1:
        return form.trigger([
          'address',
          'mapUrl',
        ])

      case 2: {
        const valid = await form.trigger([
          'phones',
          'primaryPhone',
          'email',
        ])

        const primaryPhoneValid = validatePrimaryPhone()

        return valid && primaryPhoneValid
      }

      case 3:
        return form.trigger([
          'workingHours',
          'emergencyHours',
        ])

      case 4:
        return form.trigger([
          'facebook',
          'instagram',
          'linkedin',
          'whatsapp',
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
      setFormError(null)

      const normalizedPhones = (values.phones ?? [])
        .map((phone) => phone.trim())
        .filter(Boolean)

      const normalizedPrimaryPhone = (
        values.primaryPhone ?? ''
      ).trim()

      if (!normalizedPhones.includes(normalizedPrimaryPhone)) {
        form.setError('primaryPhone', {
          type: 'manual',
          message: 'Primary phone number must exist in the phones list.',
        })

        setCurrentStep(2)
        scrollFormToTop()

        return
      }

      saveMutation.mutate(
        {
          title: values.title,
          description: values.description,
          location: {
            address: values.address,
            mapUrl: values.mapUrl,
          },
          phones: normalizedPhones,
          primaryPhone: normalizedPrimaryPhone,
          email: values.email,
          workingHours: values.workingHours,
          emergencyHours: values.emergencyHours,
          socialLinks: {
            facebook: values.facebook,
            instagram: values.instagram,
            linkedin: values.linkedin,
            whatsapp: values.whatsapp,
          },
          isActive: values.isActive,
        },
        {
          // ==================== Success ====================

          onSuccess: (savedContactInfo) => {
            toast.success('Contact information saved successfully')

            const savedPhones = (savedContactInfo.phones ?? [])
              .map((phone) => phone.trim())
              .filter(Boolean)

            form.reset({
              title: savedContactInfo.title ?? '',
              description: savedContactInfo.description ?? '',
              address:
                savedContactInfo.location?.address ??
                savedContactInfo.address ??
                '',
              mapUrl: savedContactInfo.location?.mapUrl ?? '',
              phones: savedPhones.length > 0 ? savedPhones : [''],
              primaryPhone: savedContactInfo.primaryPhone ?? '',
              email: savedContactInfo.email ?? '',
              workingHours: savedContactInfo.workingHours ?? '',
              emergencyHours: savedContactInfo.emergencyHours ?? '',
              facebook: savedContactInfo.socialLinks?.facebook ?? '',
              instagram: savedContactInfo.socialLinks?.instagram ?? '',
              linkedin: savedContactInfo.socialLinks?.linkedin ?? '',
              whatsapp: savedContactInfo.socialLinks?.whatsapp ?? '',
              isActive: savedContactInfo.isActive ?? true,
            })
          },

          // ==================== Server Error ====================

          onError: (error) => {
            const generalError = applyServerErrors(form, error)

            setFormError(generalError)
            scrollFormToTop()
          },
        },
      )
    },

    // ==================== Client Validation Error ====================

    (errors) => {
      if (
        errors.title ||
        errors.description ||
        errors.isActive
      ) {
        setCurrentStep(0)
        scrollFormToTop()
        return
      }

      if (
        errors.address ||
        errors.mapUrl
      ) {
        setCurrentStep(1)
        scrollFormToTop()
        return
      }

      if (
        errors.phones ||
        errors.primaryPhone ||
        errors.email
      ) {
        setCurrentStep(2)
        scrollFormToTop()
        return
      }

      if (
        errors.workingHours ||
        errors.emergencyHours
      ) {
        setCurrentStep(3)
        scrollFormToTop()
        return
      }

      if (
        errors.facebook ||
        errors.instagram ||
        errors.linkedin ||
        errors.whatsapp
      ) {
        setCurrentStep(4)
        scrollFormToTop()
      }
    },
  )

  // ==================== Loading ====================

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex min-h-[420px] items-center justify-center">
          <PageLoader />
        </div>
      </PageContainer>
    )
  }

  // ==================== Render ====================

  return (
    <PageContainer className="max-w-6xl">
      <div className="space-y-7">
        {/* ==================== Page Header ==================== */}

        <PageHeader
          title="Contact Information"
          description="Manage the location, contact channels, working hours, and social links displayed on the public website."
        />

        {/* ==================== Load Error ==================== */}

        {isError ? (
          <div className="rounded-[22px] border border-border/70 bg-card px-6 py-10">
            <ErrorState
              description="Contact information could not be loaded."
              onRetry={() => refetch()}
            />
          </div>
        ) : null}

        {/* ==================== Contact Information Form ==================== */}

        {!isError ? (
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
              title="Unable to save contact information"
              message={formError}
            />

            {/* ==================== Step Content ==================== */}

            <div className="min-w-0">
              {/* ==================== Step 1 - General Information ==================== */}

              {currentStep === 0 ? (
                <FormSection
                  title="General Information"
                  description="Define the heading, description, and public visibility of the contact section."
                  icon={FileText}
                  className="min-w-0"
                >
                  <div className="space-y-5">
                    {/* ==================== Title ==================== */}

                    <div className="space-y-2">
                      <Label
                        htmlFor="ci-title"
                        className="text-[12px] font-semibold"
                      >
                        Title
                      </Label>

                      <Input
                        id="ci-title"
                        placeholder="e.g. Basra Headquarters"
                        aria-invalid={!!form.formState.errors.title}
                        className="h-11 rounded-xl"
                        {...form.register('title')}
                      />

                      <FieldError
                        message={form.formState.errors.title?.message}
                      />
                    </div>

                    {/* ==================== Description ==================== */}

                    <div className="space-y-2">
                      <Label
                        htmlFor="ci-description"
                        className="text-[12px] font-semibold"
                      >
                        Description
                      </Label>

                      <Textarea
                        id="ci-description"
                        rows={4}
                        placeholder="Short description displayed with the contact information."
                        aria-invalid={!!form.formState.errors.description}
                        className="min-h-[120px] resize-y rounded-xl"
                        {...form.register('description')}
                      />

                      <FieldError
                        message={form.formState.errors.description?.message}
                      />
                    </div>

                    {/* ==================== Public Visibility ==================== */}

                    <VisibilityToggle
                      id="ci-active"
                      checked={isActive}
                      onCheckedChange={(checked) =>
                        form.setValue('isActive', checked, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      title="Public visibility"
                      activeDescription="Contact information is visible on the public website."
                      inactiveDescription="Contact information is hidden from the public website."
                      activeLabel="Visible"
                      inactiveLabel="Hidden"
                    />
                  </div>
                </FormSection>
              ) : null}

              {/* ==================== Step 2 - Location ==================== */}

              {currentStep === 1 ? (
                <FormSection
                  title="Location"
                  description="Manage the office address and map destination displayed to visitors."
                  icon={MapPin}
                  className="min-w-0"
                >
                  <div className="space-y-5">
                    {/* ==================== Address ==================== */}

                    <div className="space-y-2">
                      <Label
                        htmlFor="ci-address"
                        className="text-[12px] font-semibold"
                      >
                        Address
                      </Label>

                      <div className="group relative">
                        <MapPin
                          className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                          strokeWidth={1.8}
                        />

                        <Textarea
                          id="ci-address"
                          rows={3}
                          placeholder="Enter the full office address"
                          aria-invalid={!!form.formState.errors.address}
                          className="min-h-[110px] rounded-xl pl-10"
                          {...form.register('address')}
                        />
                      </div>

                      <FieldError
                        message={form.formState.errors.address?.message}
                      />
                    </div>

                    {/* ==================== Map URL ==================== */}

                    <div className="space-y-2">
                      <Label
                        htmlFor="ci-mapUrl"
                        className="text-[12px] font-semibold"
                      >
                        Map URL
                      </Label>

                      <div className="group relative">
                        <Globe2
                          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                          strokeWidth={1.8}
                        />

                        <Input
                          id="ci-mapUrl"
                          type="url"
                          placeholder="https://maps.google.com/..."
                          aria-invalid={!!form.formState.errors.mapUrl}
                          className="h-11 rounded-xl pl-10"
                          {...form.register('mapUrl')}
                        />
                      </div>

                      <FieldError
                        message={form.formState.errors.mapUrl?.message}
                      />
                    </div>
                  </div>
                </FormSection>
              ) : null}

              {/* ==================== Step 3 - Contact Details ==================== */}

              {currentStep === 2 ? (
                <FormSection
                  title="Contact Details"
                  description="Manage the public phone numbers, primary phone, and email address."
                  icon={Phone}
                  className="min-w-0"
                >
                  <div className="space-y-6">
                    {/* ==================== Phone Numbers ==================== */}

                    <div className="rounded-2xl border border-border/70 bg-muted/[0.08] p-4">
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                          <Phone
                            className="size-4"
                            strokeWidth={1.8}
                          />
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold text-foreground">
                            Phone numbers
                          </p>

                          <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                            Add all phone numbers that should be available to
                            website visitors.
                          </p>
                        </div>
                      </div>

                      <StringListField
                        id="ci-phones"
                        label="Phone numbers"
                        placeholder="Phone number"
                        addLabel="Add phone number"
                        values={watchedPhones}
                        onChange={handlePhonesChange}
                        error={getArrayErrorMessage(
                          form.formState.errors.phones,
                        )}
                        itemErrors={getStringItemErrors(
                          form.formState.errors.phones,
                        )}
                      />
                    </div>

                    {/* ==================== Primary Phone And Email ==================== */}

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      {/* ==================== Primary Phone ==================== */}

                      <div className="space-y-2">
                        <Label
                          htmlFor="ci-primaryPhone"
                          className="text-[12px] font-semibold"
                        >
                          Primary phone
                        </Label>

                        <Select
                          value={primaryPhone}
                          onValueChange={handlePrimaryPhoneChange}
                        >
                          <SelectTrigger
                            id="ci-primaryPhone"
                            className="h-11 w-full rounded-xl"
                            aria-invalid={
                              !!form.formState.errors.primaryPhone
                            }
                          >
                            <SelectValue placeholder="Select the primary phone number" />
                          </SelectTrigger>

                          <SelectContent>
                            {phones.map((phone) => (
                              <SelectItem
                                key={phone}
                                value={phone}
                              >
                                {phone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <FieldError
                          message={
                            form.formState.errors.primaryPhone?.message
                          }
                        />

                        <p className="text-[10px] leading-4 text-muted-foreground">
                          The primary phone must be one of the phone numbers
                          listed above.
                        </p>
                      </div>

                      {/* ==================== Email ==================== */}

                      <div className="space-y-2">
                        <Label
                          htmlFor="ci-email"
                          className="text-[12px] font-semibold"
                        >
                          Email
                        </Label>

                        <div className="group relative">
                          <Mail
                            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                            strokeWidth={1.8}
                          />

                          <Input
                            id="ci-email"
                            type="email"
                            placeholder="info@example.com"
                            aria-invalid={!!form.formState.errors.email}
                            className="h-11 rounded-xl pl-10"
                            {...form.register('email')}
                          />
                        </div>

                        <FieldError
                          message={form.formState.errors.email?.message}
                        />
                      </div>
                    </div>

                    {/* ==================== Contact Information ==================== */}

                    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/[0.08] p-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                        <Phone
                          className="size-4"
                          strokeWidth={1.8}
                        />
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-foreground">
                          Primary contact channels
                        </p>

                        <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                          The selected primary phone and email are used as the
                          main public contact channels throughout the website.
                        </p>
                      </div>
                    </div>
                  </div>
                </FormSection>
              ) : null}

              {/* ==================== Step 4 - Business Hours ==================== */}

              {currentStep === 3 ? (
                <FormSection
                  title="Business Hours"
                  description="Define normal office hours and emergency availability."
                  icon={Clock3}
                  className="min-w-0"
                >
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* ==================== Working Hours ==================== */}

                    <div className="space-y-2">
                      <Label
                        htmlFor="ci-workingHours"
                        className="text-[12px] font-semibold"
                      >
                        Working hours
                      </Label>

                      <div className="group relative">
                        <Clock3
                          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                          strokeWidth={1.8}
                        />

                        <Input
                          id="ci-workingHours"
                          placeholder="Sun - Thu, 8am - 5pm"
                          aria-invalid={
                            !!form.formState.errors.workingHours
                          }
                          className="h-11 rounded-xl pl-10"
                          {...form.register('workingHours')}
                        />
                      </div>

                      <FieldError
                        message={
                          form.formState.errors.workingHours?.message
                        }
                      />
                    </div>

                    {/* ==================== Emergency Hours ==================== */}

                    <div className="space-y-2">
                      <Label
                        htmlFor="ci-emergencyHours"
                        className="text-[12px] font-semibold"
                      >
                        Emergency hours
                      </Label>

                      <div className="group relative">
                        <Clock3
                          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                          strokeWidth={1.8}
                        />

                        <Input
                          id="ci-emergencyHours"
                          placeholder="e.g. 24/7 emergency support"
                          aria-invalid={
                            !!form.formState.errors.emergencyHours
                          }
                          className="h-11 rounded-xl pl-10"
                          {...form.register('emergencyHours')}
                        />
                      </div>

                      <FieldError
                        message={
                          form.formState.errors.emergencyHours?.message
                        }
                      />
                    </div>
                  </div>
                </FormSection>
              ) : null}

              {/* ==================== Step 5 - Social Media ==================== */}

              {currentStep === 4 ? (
                <FormSection
                  title="Social Media"
                  description="Manage the public social media links displayed across the website."
                  icon={Share2}
                  className="min-w-0"
                >
                  <div className="space-y-5">
                    {/* ==================== Social Information ==================== */}

                    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/[0.08] p-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                        <Share2
                          className="size-4"
                          strokeWidth={1.8}
                        />
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-foreground">
                          Social channels
                        </p>

                        <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                          Add only the channels that should be available
                          publicly. Leave unused fields empty.
                        </p>
                      </div>
                    </div>

                    {/* ==================== Social Fields ==================== */}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {/* ==================== Facebook ==================== */}

                      <div className="space-y-2">
                        <Label
                          htmlFor="ci-facebook"
                          className="text-[12px] font-semibold"
                        >
                          Facebook
                        </Label>

                        <div className="group relative">
                          <Globe2
                            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                            strokeWidth={1.8}
                          />

                          <Input
                            id="ci-facebook"
                            type="url"
                            placeholder="https://facebook.com/..."
                            aria-invalid={
                              !!form.formState.errors.facebook
                            }
                            className="h-11 rounded-xl pl-10"
                            {...form.register('facebook')}
                          />
                        </div>

                        <FieldError
                          message={
                            form.formState.errors.facebook?.message
                          }
                        />
                      </div>

                      {/* ==================== Instagram ==================== */}

                      <div className="space-y-2">
                        <Label
                          htmlFor="ci-instagram"
                          className="text-[12px] font-semibold"
                        >
                          Instagram
                        </Label>

                        <div className="group relative">
                          <Globe2
                            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                            strokeWidth={1.8}
                          />

                          <Input
                            id="ci-instagram"
                            type="url"
                            placeholder="https://instagram.com/..."
                            aria-invalid={
                              !!form.formState.errors.instagram
                            }
                            className="h-11 rounded-xl pl-10"
                            {...form.register('instagram')}
                          />
                        </div>

                        <FieldError
                          message={
                            form.formState.errors.instagram?.message
                          }
                        />
                      </div>

                      {/* ==================== LinkedIn ==================== */}

                      <div className="space-y-2">
                        <Label
                          htmlFor="ci-linkedin"
                          className="text-[12px] font-semibold"
                        >
                          LinkedIn
                        </Label>

                        <div className="group relative">
                          <Globe2
                            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                            strokeWidth={1.8}
                          />

                          <Input
                            id="ci-linkedin"
                            type="url"
                            placeholder="https://linkedin.com/company/..."
                            aria-invalid={
                              !!form.formState.errors.linkedin
                            }
                            className="h-11 rounded-xl pl-10"
                            {...form.register('linkedin')}
                          />
                        </div>

                        <FieldError
                          message={
                            form.formState.errors.linkedin?.message
                          }
                        />
                      </div>

                      {/* ==================== WhatsApp ==================== */}

                      <div className="space-y-2">
                        <Label
                          htmlFor="ci-whatsapp"
                          className="text-[12px] font-semibold"
                        >
                          WhatsApp
                        </Label>

                        <div className="group relative">
                          <Phone
                            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground"
                            strokeWidth={1.8}
                          />

                          <Input
                            id="ci-whatsapp"
                            placeholder="e.g. +964..."
                            aria-invalid={
                              !!form.formState.errors.whatsapp
                            }
                            className="h-11 rounded-xl pl-10"
                            {...form.register('whatsapp')}
                          />
                        </div>

                        <FieldError
                          message={
                            form.formState.errors.whatsapp?.message
                          }
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
              isSubmitting={saveMutation.isPending}
              submitLabel={
                contactInfo
                  ? 'Save changes'
                  : 'Create contact information'
              }
            />
          </form>
        ) : null}
      </div>
    </PageContainer>
  )
}