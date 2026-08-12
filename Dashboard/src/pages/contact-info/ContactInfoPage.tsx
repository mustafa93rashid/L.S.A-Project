import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Clock3, Globe2, Mail, MapPin, Phone, Save, Share2 } from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { FormSection } from '@/components/forms/FormSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StringListField } from '@/components/forms/StringListField'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'

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
  const savedPrimaryPhone = contactInfo.primaryPhone?.trim() ?? ''

  const validPrimaryPhone = normalizedPhones.includes(savedPrimaryPhone)
    ? savedPrimaryPhone
    : ''

  form.reset({
    title: contactInfo.title ?? '',
    description: contactInfo.description ?? '',
    address: contactInfo.location?.address ?? contactInfo.address ?? '',
    mapUrl: contactInfo.location?.mapUrl ?? '',
    phones: normalizedPhones.length > 0 ? normalizedPhones : [''],
    primaryPhone: validPrimaryPhone,
    email: contactInfo.email ?? '',
    workingHours: contactInfo.workingHours ?? '',
    emergencyHours: contactInfo.emergencyHours ?? '',
    facebook: contactInfo.socialLinks?.facebook ?? '',
    instagram: contactInfo.socialLinks?.instagram ?? '',
    linkedin: contactInfo.socialLinks?.linkedin ?? '',
    whatsapp: contactInfo.socialLinks?.whatsapp ?? '',
    isActive: contactInfo.isActive,
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [contactInfo])

  const watchedPhones = form.watch('phones')
  const primaryPhone = form.watch('primaryPhone')

  const phones = watchedPhones.map((phone) => phone.trim()).filter(Boolean)

  useEffect(() => {
    if (!primaryPhone) return

    const normalizedPrimaryPhone = primaryPhone.trim()

    if (normalizedPrimaryPhone !== primaryPhone) {
      form.setValue('primaryPhone', normalizedPrimaryPhone, {
        shouldDirty: false,
        shouldValidate: false,
      })
    }
  }, [primaryPhone, form])

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)

    const normalizedPhones = values.phones.map((phone) => phone.trim()).filter(Boolean)
    const normalizedPrimaryPhone = values.primaryPhone.trim()

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
    <PageContainer>
      <div className="space-y-7">
        <PageHeader title="Contact Information" description="Manage the location, contact channels, working hours and social links displayed on the public website." />

        {isError ? (
          <div className="rounded-[22px] border border-border/70 bg-card px-6 py-10">
            <ErrorState description="Contact information could not be loaded." onRetry={() => refetch()} />
          </div>
        ) : null}

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          {formError ? <div className="rounded-xl border border-destructive/20 bg-destructive-subtle px-4 py-3 text-sm font-medium text-destructive">{formError}</div> : null}

          <FormSection title="General Information">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ci-title">Title</Label>
                  <Input id="ci-title" placeholder="e.g. Basra Headquarters" className="h-11" aria-invalid={!!form.formState.errors.title} {...form.register('title')} />
                  {form.formState.errors.title ? <p className="text-xs text-destructive">{form.formState.errors.title.message}</p> : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ci-description">Description</Label>
                  <Textarea id="ci-description" rows={4} placeholder="Short description displayed with the contact information." aria-invalid={!!form.formState.errors.description} {...form.register('description')} />
                  {form.formState.errors.description ? <p className="text-xs text-destructive">{form.formState.errors.description.message}</p> : null}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-[18px] border border-border/70 bg-muted/[0.12] px-4 py-4">
                <div className="pr-6">
                  <Label htmlFor="ci-active">Public visibility</Label>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Controls whether this contact information is visible on the public website.</p>
                </div>

                <Switch id="ci-active" checked={form.watch('isActive')} onCheckedChange={(checked) => form.setValue('isActive', checked, { shouldDirty: true, shouldValidate: true })} />
              </div>
            </div>
          </FormSection>

          <FormSection title="Location">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <Label htmlFor="ci-address">Address</Label>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground/45" strokeWidth={1.8} />
                  <Textarea id="ci-address" rows={3} className="pl-10" placeholder="Enter the full office address" aria-invalid={!!form.formState.errors.address} {...form.register('address')} />
                </div>

                {form.formState.errors.address ? <p className="text-xs text-destructive">{form.formState.errors.address.message}</p> : null}
              </div>

              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <Label htmlFor="ci-mapUrl">Map URL</Label>

                <div className="relative">
                  <Globe2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45" strokeWidth={1.8} />
                  <Input id="ci-mapUrl" type="url" placeholder="https://maps.google.com/..." className="h-11 pl-10" aria-invalid={!!form.formState.errors.mapUrl} {...form.register('mapUrl')} />
                </div>

                {form.formState.errors.mapUrl ? <p className="text-xs text-destructive">{form.formState.errors.mapUrl.message}</p> : null}
              </div>
            </div>
          </FormSection>

          <FormSection title="Contact Details">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="flex flex-col gap-5">
                <StringListField
                  id="ci-phones"
                  label="Phone numbers"
                  values={watchedPhones}
                  onChange={(values) => {
                    const normalizedValues = values.map((phone) => phone.trimStart())

                    form.setValue('phones', normalizedValues, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })

                    const currentPrimaryPhone = form.getValues('primaryPhone')?.trim()

                    if (currentPrimaryPhone && !normalizedValues.map((phone) => phone.trim()).includes(currentPrimaryPhone)) {
                      form.setValue('primaryPhone', '', {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  }}
                  error={form.formState.errors.phones?.message}
                />

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ci-primaryPhone">Primary phone</Label>

                  <Select
                    value={primaryPhone?.trim() ?? ''}
                    onValueChange={(value) => {
                      form.setValue('primaryPhone', value.trim(), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }}
                  >
                    <SelectTrigger id="ci-primaryPhone" className="h-11 w-full" aria-invalid={!!form.formState.errors.primaryPhone}>
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

                  {form.formState.errors.primaryPhone ? <p className="text-xs text-destructive">{form.formState.errors.primaryPhone.message}</p> : null}

                  <p className="text-[11px] leading-5 text-muted-foreground">The primary phone must be one of the phone numbers listed above.</p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ci-email">Email</Label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45" strokeWidth={1.8} />
                    <Input id="ci-email" type="email" placeholder="info@example.com" className="h-11 pl-10" aria-invalid={!!form.formState.errors.email} {...form.register('email')} />
                  </div>

                  {form.formState.errors.email ? <p className="text-xs text-destructive">{form.formState.errors.email.message}</p> : null}
                </div>

                <div className="rounded-[18px] border border-border/70 bg-muted/[0.12] px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                      <Phone className="size-4" strokeWidth={1.8} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-foreground">Primary contact channel</p>
                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">The selected primary phone and email will be used as the main public contact details.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Business Hours">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ci-workingHours">Working hours</Label>

                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45" strokeWidth={1.8} />
                  <Input id="ci-workingHours" placeholder="Sun - Thu, 8am - 5pm" className="h-11 pl-10" aria-invalid={!!form.formState.errors.workingHours} {...form.register('workingHours')} />
                </div>

                {form.formState.errors.workingHours ? <p className="text-xs text-destructive">{form.formState.errors.workingHours.message}</p> : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ci-emergencyHours">Emergency hours</Label>

                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45" strokeWidth={1.8} />
                  <Input id="ci-emergencyHours" placeholder="e.g. 24/7 emergency support" className="h-11 pl-10" {...form.register('emergencyHours')} />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Social Media">
            <div className="mb-1 flex items-start gap-3 rounded-[16px] border border-border/70 bg-muted/[0.12] px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                <Share2 className="size-4" strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground">Social channels</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Add the public social media links that should appear across the website.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ci-facebook">Facebook</Label>
                <Input id="ci-facebook" type="url" placeholder="https://facebook.com/..." className="h-11" aria-invalid={!!form.formState.errors.facebook} {...form.register('facebook')} />
                {form.formState.errors.facebook ? <p className="text-xs text-destructive">{form.formState.errors.facebook.message}</p> : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ci-instagram">Instagram</Label>
                <Input id="ci-instagram" type="url" placeholder="https://instagram.com/..." className="h-11" aria-invalid={!!form.formState.errors.instagram} {...form.register('instagram')} />
                {form.formState.errors.instagram ? <p className="text-xs text-destructive">{form.formState.errors.instagram.message}</p> : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ci-linkedin">LinkedIn</Label>
                <Input id="ci-linkedin" type="url" placeholder="https://linkedin.com/company/..." className="h-11" aria-invalid={!!form.formState.errors.linkedin} {...form.register('linkedin')} />
                {form.formState.errors.linkedin ? <p className="text-xs text-destructive">{form.formState.errors.linkedin.message}</p> : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ci-whatsapp">WhatsApp</Label>
                <Input id="ci-whatsapp" placeholder="e.g. +964..." className="h-11" aria-invalid={!!form.formState.errors.whatsapp} {...form.register('whatsapp')} />
                {form.formState.errors.whatsapp ? <p className="text-xs text-destructive">{form.formState.errors.whatsapp.message}</p> : null}
              </div>
            </div>
          </FormSection>

          <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-5">
            <p className="hidden text-[11px] text-muted-foreground sm:block">Changes will update the contact information displayed on the public website.</p>

            <Button type="submit" size="lg" disabled={saveMutation.isPending}>
              <Save className="size-4" strokeWidth={1.8} />
              {saveMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}
