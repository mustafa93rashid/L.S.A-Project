import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Clock3, FileText, Globe2, Mail, MapPin, Phone, Save, Share2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { FormSection } from '@/components/forms/FormSection'
import { SectionNav } from '@/components/forms/SectionNav'
import { StringListField } from '@/components/forms/StringListField'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { applyServerErrors } from '@/lib/form-errors'
import { useContactInfoQuery, useSaveContactInfoMutation } from '@/features/contact-info/queries'
import { contactInfoSchema, type ContactInfoInput } from '@/features/contact-info/schema'


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


const SECTIONS = [
  { id: 'contact-section-general', label: 'General' },
  { id: 'contact-section-location', label: 'Location' },
  { id: 'contact-section-details', label: 'Contact Details' },
  { id: 'contact-section-hours', label: 'Business Hours' },
  { id: 'contact-section-social', label: 'Social Media' },
]


function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="flex items-center gap-1.5 text-[10px] font-medium text-destructive">
      <AlertCircle className="size-3 shrink-0" strokeWidth={1.8} />
      {message}
    </p>
  )
}


export default function ContactInfoPage() {
  const { data: contactInfo, isLoading, isError, refetch } = useContactInfoQuery()
  const saveMutation = useSaveContactInfoMutation()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<ContactInfoInput>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: emptyDefaults,
  })


  useEffect(() => {
    if (!contactInfo) return

    const normalizedPhones = (contactInfo.phones ?? []).map((phone) => phone.trim()).filter(Boolean)

    form.reset({
      title: contactInfo.title ?? '',
      description: contactInfo.description ?? '',
      address: contactInfo.location?.address ?? contactInfo.address ?? '',
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


  const watchedPhones = form.watch('phones') ?? ['']
  const primaryPhone = form.watch('primaryPhone') ?? ''
  const isActive = form.watch('isActive') ?? true

  const phones = watchedPhones.map((phone) => phone.trim()).filter(Boolean)


  const handlePhonesChange = (values: string[]) => {
    const normalizedValues = values.map((phone) => phone.trimStart())

    form.setValue('phones', normalizedValues, {
      shouldDirty: true,
      shouldValidate: true,
    })

    const currentPrimaryPhone = (form.getValues('primaryPhone') ?? '').trim()
    const availablePhones = normalizedValues.map((phone) => phone.trim()).filter(Boolean)

    if (currentPrimaryPhone && !availablePhones.includes(currentPrimaryPhone)) {
      form.setValue('primaryPhone', '', {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }


  const handlePrimaryPhoneChange = (value: string) => {
    form.setValue('primaryPhone', value.trim(), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }


  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)

    const normalizedPhones = (values.phones ?? []).map((phone) => phone.trim()).filter(Boolean)
    const normalizedPrimaryPhone = (values.primaryPhone ?? '').trim()

    if (!normalizedPhones.includes(normalizedPrimaryPhone)) {
      form.setError('primaryPhone', {
        type: 'manual',
        message: 'Primary phone number must exist in the phones list.',
      })

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
        onSuccess: () => {
          toast.success('Contact information saved successfully')
        },
        onError: (error) => {
          setFormError(applyServerErrors(form, error))
        },
      },
    )
  })


  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex min-h-[420px] items-center justify-center">
          <PageLoader />
        </div>
      </PageContainer>
    )
  }


  return (
    <PageContainer className="max-w-7xl">
      <div className="space-y-7">

        <PageHeader
          title="Contact Information"
          description="Manage the location, contact channels, working hours, and social links displayed on the public website."
        />


        {isError ? (
          <div className="rounded-[22px] border border-border/70 bg-card px-6 py-10">
            <ErrorState
              description="Contact information could not be loaded."
              onRetry={() => refetch()}
            />
          </div>
        ) : null}


        <form onSubmit={onSubmit} noValidate className="space-y-6">

          {formError ? (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.045] px-4 py-3.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="size-4" strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-destructive">
                  Unable to save contact information
                </p>

                <p className="mt-1 text-[11px] leading-5 text-destructive/80">
                  {formError}
                </p>
              </div>
            </div>
          ) : null}


          <div className="flex items-start gap-7">

            <aside className="hidden w-56 shrink-0 lg:block">
              <SectionNav
                items={SECTIONS}
                title="Contact Setup"
              />
            </aside>


            <div className="min-w-0 flex-1 space-y-6">

              <FormSection
                id="contact-section-general"
                title="General Information"
                description="Define the heading, description, and public visibility of the contact section."
                icon={FileText}
              >
                <div className="space-y-5">

                  <div className="space-y-2">
                    <Label htmlFor="ci-title" className="text-[12px] font-semibold">
                      Title
                    </Label>

                    <Input
                      id="ci-title"
                      placeholder="e.g. Basra Headquarters"
                      aria-invalid={!!form.formState.errors.title}
                      {...form.register('title')}
                      className="h-11 rounded-xl"
                    />

                    <FieldError message={form.formState.errors.title?.message} />
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="ci-description" className="text-[12px] font-semibold">
                      Description
                    </Label>

                    <Textarea
                      id="ci-description"
                      rows={4}
                      placeholder="Short description displayed with the contact information."
                      aria-invalid={!!form.formState.errors.description}
                      {...form.register('description')}
                      className="min-h-[120px] resize-y rounded-xl"
                    />

                    <FieldError message={form.formState.errors.description?.message} />
                  </div>


                  <div className={`rounded-2xl border p-4 transition-colors ${isActive ? 'border-success/20 bg-success/[0.035]' : 'border-border/70 bg-muted/[0.10]'}`}>
                    <div className="flex items-center justify-between gap-5">

                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${isActive ? 'border-success/15 bg-success-subtle text-success' : 'border-border/70 bg-background text-muted-foreground'}`}>
                          <CheckCircle2 className="size-4" strokeWidth={1.8} />
                        </div>

                        <div className="min-w-0">
                          <Label htmlFor="ci-active" className="cursor-pointer text-[12px] font-semibold">
                            Public visibility
                          </Label>

                          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                            {isActive
                              ? 'Contact information is visible on the public website.'
                              : 'Contact information is hidden from the public website.'}
                          </p>
                        </div>
                      </div>


                      <div className="flex shrink-0 items-center gap-3">
                        <div className="hidden items-center gap-2 sm:flex">
                          <span className={`size-2 rounded-full ${isActive ? 'bg-success' : 'bg-muted-foreground/35'}`} />

                          <span className="text-[10px] font-semibold text-foreground">
                            {isActive ? 'Visible' : 'Hidden'}
                          </span>
                        </div>

                        <Switch
                          id="ci-active"
                          checked={isActive}
                          onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true, shouldValidate: true })}
                        />
                      </div>

                    </div>
                  </div>

                </div>
              </FormSection>


              <FormSection
                id="contact-section-location"
                title="Location"
                description="Manage the office address and map destination displayed to visitors."
                icon={MapPin}
              >
                <div className="space-y-5">

                  <div className="space-y-2">
                    <Label htmlFor="ci-address" className="text-[12px] font-semibold">
                      Address
                    </Label>

                    <div className="group relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground/45 transition-colors group-focus-within:text-foreground" strokeWidth={1.8} />

                      <Textarea
                        id="ci-address"
                        rows={3}
                        placeholder="Enter the full office address"
                        aria-invalid={!!form.formState.errors.address}
                        {...form.register('address')}
                        className="min-h-[100px] rounded-xl pl-10"
                      />
                    </div>

                    <FieldError message={form.formState.errors.address?.message} />
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="ci-mapUrl" className="text-[12px] font-semibold">
                      Map URL
                    </Label>

                    <div className="group relative">
                      <Globe2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground" strokeWidth={1.8} />

                      <Input
                        id="ci-mapUrl"
                        type="url"
                        placeholder="https://maps.google.com/..."
                        aria-invalid={!!form.formState.errors.mapUrl}
                        {...form.register('mapUrl')}
                        className="h-11 rounded-xl pl-10"
                      />
                    </div>

                    <FieldError message={form.formState.errors.mapUrl?.message} />
                  </div>

                </div>
              </FormSection>


              <FormSection
                id="contact-section-details"
                title="Contact Details"
                description="Manage the public phone numbers, primary phone, and email address."
                icon={Phone}
              >
                <div className="space-y-6">

                  <div className="rounded-2xl border border-border/70 bg-muted/[0.08] p-4">

                    <div className="mb-4 flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                        <Phone className="size-4" strokeWidth={1.8} />
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-foreground">
                          Phone numbers
                        </p>

                        <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                          Add all phone numbers that should be available to website visitors.
                        </p>
                      </div>
                    </div>


                    <StringListField
                      id="ci-phones"
                      label="Phone numbers"
                      values={watchedPhones}
                      onChange={handlePhonesChange}
                      error={form.formState.errors.phones?.message}
                    />

                  </div>


                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                    <div className="space-y-2">
                      <Label htmlFor="ci-primaryPhone" className="text-[12px] font-semibold">
                        Primary phone
                      </Label>

                      <Select
                        value={primaryPhone}
                        onValueChange={handlePrimaryPhoneChange}
                      >
                        <SelectTrigger
                          id="ci-primaryPhone"
                          className="h-11 w-full rounded-xl"
                          aria-invalid={!!form.formState.errors.primaryPhone}
                        >
                          <SelectValue placeholder="Select the primary phone number" />
                        </SelectTrigger>

                        <SelectContent>
                          {phones.map((phone) => (
                            <SelectItem key={phone} value={phone}>
                              {phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <FieldError message={form.formState.errors.primaryPhone?.message} />

                      <p className="text-[10px] leading-4 text-muted-foreground">
                        The primary phone must be one of the phone numbers listed above.
                      </p>
                    </div>


                    <div className="space-y-2">
                      <Label htmlFor="ci-email" className="text-[12px] font-semibold">
                        Email
                      </Label>

                      <div className="group relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground" strokeWidth={1.8} />

                        <Input
                          id="ci-email"
                          type="email"
                          placeholder="info@example.com"
                          aria-invalid={!!form.formState.errors.email}
                          {...form.register('email')}
                          className="h-11 rounded-xl pl-10"
                        />
                      </div>

                      <FieldError message={form.formState.errors.email?.message} />
                    </div>

                  </div>


                  <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/[0.08] p-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                      <Phone className="size-4" strokeWidth={1.8} />
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-foreground">
                        Primary contact channels
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                        The selected primary phone and email are used as the main public contact channels throughout the website.
                      </p>
                    </div>
                  </div>

                </div>
              </FormSection>


              <FormSection
                id="contact-section-hours"
                title="Business Hours"
                description="Define normal office hours and emergency availability."
                icon={Clock3}
              >
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                  <div className="space-y-2">
                    <Label htmlFor="ci-workingHours" className="text-[12px] font-semibold">
                      Working hours
                    </Label>

                    <div className="group relative">
                      <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground" strokeWidth={1.8} />

                      <Input
                        id="ci-workingHours"
                        placeholder="Sun - Thu, 8am - 5pm"
                        aria-invalid={!!form.formState.errors.workingHours}
                        {...form.register('workingHours')}
                        className="h-11 rounded-xl pl-10"
                      />
                    </div>

                    <FieldError message={form.formState.errors.workingHours?.message} />
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="ci-emergencyHours" className="text-[12px] font-semibold">
                      Emergency hours
                    </Label>

                    <div className="group relative">
                      <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45 transition-colors group-focus-within:text-foreground" strokeWidth={1.8} />

                      <Input
                        id="ci-emergencyHours"
                        placeholder="e.g. 24/7 emergency support"
                        {...form.register('emergencyHours')}
                        className="h-11 rounded-xl pl-10"
                      />
                    </div>
                  </div>

                </div>
              </FormSection>


              <FormSection
                id="contact-section-social"
                title="Social Media"
                description="Manage the public social media links displayed across the website."
                icon={Share2}
              >
                <div className="space-y-5">

                  <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/[0.08] p-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                      <Share2 className="size-4" strokeWidth={1.8} />
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-foreground">
                        Social channels
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                        Add only the channels that should be available publicly. Leave unused fields empty.
                      </p>
                    </div>
                  </div>


                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    <div className="space-y-2">
                      <Label htmlFor="ci-facebook" className="text-[12px] font-semibold">
                        Facebook
                      </Label>

                      <Input
                        id="ci-facebook"
                        type="url"
                        placeholder="https://facebook.com/..."
                        aria-invalid={!!form.formState.errors.facebook}
                        {...form.register('facebook')}
                        className="h-11 rounded-xl"
                      />

                      <FieldError message={form.formState.errors.facebook?.message} />
                    </div>


                    <div className="space-y-2">
                      <Label htmlFor="ci-instagram" className="text-[12px] font-semibold">
                        Instagram
                      </Label>

                      <Input
                        id="ci-instagram"
                        type="url"
                        placeholder="https://instagram.com/..."
                        aria-invalid={!!form.formState.errors.instagram}
                        {...form.register('instagram')}
                        className="h-11 rounded-xl"
                      />

                      <FieldError message={form.formState.errors.instagram?.message} />
                    </div>


                    <div className="space-y-2">
                      <Label htmlFor="ci-linkedin" className="text-[12px] font-semibold">
                        LinkedIn
                      </Label>

                      <Input
                        id="ci-linkedin"
                        type="url"
                        placeholder="https://linkedin.com/company/..."
                        aria-invalid={!!form.formState.errors.linkedin}
                        {...form.register('linkedin')}
                        className="h-11 rounded-xl"
                      />

                      <FieldError message={form.formState.errors.linkedin?.message} />
                    </div>


                    <div className="space-y-2">
                      <Label htmlFor="ci-whatsapp" className="text-[12px] font-semibold">
                        WhatsApp
                      </Label>

                      <Input
                        id="ci-whatsapp"
                        placeholder="e.g. +964..."
                        aria-invalid={!!form.formState.errors.whatsapp}
                        {...form.register('whatsapp')}
                        className="h-11 rounded-xl"
                      />

                      <FieldError message={form.formState.errors.whatsapp?.message} />
                    </div>

                  </div>

                </div>
              </FormSection>


              <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">

                <p className="hidden text-[10px] text-muted-foreground sm:block">
                  Changes will update the contact information displayed on the public website.
                </p>


                <Button
                  type="submit"
                  size="lg"
                  disabled={saveMutation.isPending}
                >
                  <Save className="size-4" strokeWidth={1.8} />

                  {saveMutation.isPending
                    ? 'Saving…'
                    : 'Save changes'}
                </Button>

              </div>

            </div>

          </div>

        </form>

      </div>
    </PageContainer>
  )
}