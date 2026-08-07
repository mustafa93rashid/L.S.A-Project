import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { StringListField } from '@/components/forms/StringListField'
import { PageLoader } from '@/components/feedback/PageLoader'
import { applyServerErrors } from '@/lib/form-errors'
import {
  useContactInfoQuery,
  useSaveContactInfoMutation,
} from '@/features/contact-info/queries'
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
    if (contactInfo) {
      form.reset({
        title: contactInfo.title ?? '',
        description: contactInfo.description ?? '',
        // Falls back to the legacy top-level `address` for records
        // created before the `location` sub-object existed.
        address: contactInfo.location?.address ?? contactInfo.address ?? '',
        mapUrl: contactInfo.location?.mapUrl ?? '',
        phones: contactInfo.phones.length > 0 ? contactInfo.phones : [''],
        primaryPhone: contactInfo.primaryPhone,
        email: contactInfo.email,
        workingHours: contactInfo.workingHours,
        emergencyHours: contactInfo.emergencyHours ?? '',
        facebook: contactInfo.socialLinks?.facebook ?? '',
        instagram: contactInfo.socialLinks?.instagram ?? '',
        linkedin: contactInfo.socialLinks?.linkedin ?? '',
        whatsapp: contactInfo.socialLinks?.whatsapp ?? '',
        isActive: contactInfo.isActive,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactInfo])

  const phones = form.watch('phones').filter((phone) => phone.trim().length > 0)

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)

    saveMutation.mutate(
      {
        title: values.title,
        description: values.description,
        location: { address: values.address, mapUrl: values.mapUrl },
        phones: values.phones.map((phone) => phone.trim()).filter(Boolean),
        primaryPhone: values.primaryPhone,
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
        onSuccess: () => toast.success('Contact information saved successfully'),
        onError: (error) => setFormError(applyServerErrors(form, error)),
      },
    )
  })

  if (isLoading) return <PageLoader />

  return (
    <PageContainer>
      <PageHeader
        title="Contact Information"
        description="Location, phone, email, and social links shown on the public site."
      />

      {isError ? (
        <p className="text-sm text-destructive">
          Failed to load contact information.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        <Card>
          <CardContent className="flex flex-col gap-4 py-6">
            <SectionHeader title="General" />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ci-title">Title</Label>
              <Input
                id="ci-title"
                placeholder="Basra Headquarters"
                {...form.register('title')}
              />
              {form.formState.errors.title ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ci-description">Description</Label>
              <Textarea id="ci-description" rows={2} {...form.register('description')} />
              {form.formState.errors.description ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ci-active">Active (shown on public site)</Label>
              <Switch
                id="ci-active"
                checked={form.watch('isActive')}
                onCheckedChange={(checked) => form.setValue('isActive', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 py-6">
            <SectionHeader title="Location" />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ci-address">Address</Label>
              <Textarea
                id="ci-address"
                rows={2}
                aria-invalid={!!form.formState.errors.address}
                {...form.register('address')}
              />
              {form.formState.errors.address ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.address.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ci-mapUrl">Map URL</Label>
              <Input
                id="ci-mapUrl"
                type="url"
                placeholder="https://maps.google.com/…"
                aria-invalid={!!form.formState.errors.mapUrl}
                {...form.register('mapUrl')}
              />
              {form.formState.errors.mapUrl ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.mapUrl.message}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 py-6">
            <SectionHeader title="Phone & Email" />
            <StringListField
              id="ci-phones"
              label="Phone numbers"
              values={form.watch('phones')}
              onChange={(values) =>
                form.setValue('phones', values, { shouldValidate: true })
              }
              error={form.formState.errors.phones?.message}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ci-primaryPhone">Primary phone</Label>
              <Select
                value={form.watch('primaryPhone')}
                onValueChange={(value) =>
                  form.setValue('primaryPhone', value, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  id="ci-primaryPhone"
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
              {form.formState.errors.primaryPhone ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.primaryPhone.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ci-email">Email</Label>
              <Input
                id="ci-email"
                type="email"
                aria-invalid={!!form.formState.errors.email}
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 py-6">
            <SectionHeader title="Hours" />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ci-workingHours">Working hours</Label>
                <Input
                  id="ci-workingHours"
                  placeholder="Sun - Thu, 8am - 5pm"
                  aria-invalid={!!form.formState.errors.workingHours}
                  {...form.register('workingHours')}
                />
                {form.formState.errors.workingHours ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.workingHours.message}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ci-emergencyHours">Emergency hours</Label>
                <Input id="ci-emergencyHours" {...form.register('emergencyHours')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 py-6">
            <SectionHeader title="Social Links" />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ci-facebook">Facebook</Label>
                <Input
                  id="ci-facebook"
                  type="url"
                  aria-invalid={!!form.formState.errors.facebook}
                  {...form.register('facebook')}
                />
                {form.formState.errors.facebook ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.facebook.message}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ci-instagram">Instagram</Label>
                <Input
                  id="ci-instagram"
                  type="url"
                  aria-invalid={!!form.formState.errors.instagram}
                  {...form.register('instagram')}
                />
                {form.formState.errors.instagram ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.instagram.message}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ci-linkedin">LinkedIn</Label>
                <Input
                  id="ci-linkedin"
                  type="url"
                  aria-invalid={!!form.formState.errors.linkedin}
                  {...form.register('linkedin')}
                />
                {form.formState.errors.linkedin ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.linkedin.message}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ci-whatsapp">WhatsApp</Label>
                <Input
                  id="ci-whatsapp"
                  aria-invalid={!!form.formState.errors.whatsapp}
                  {...form.register('whatsapp')}
                />
                {form.formState.errors.whatsapp ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.whatsapp.message}
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saveMutation.isPending} className="self-start">
          {saveMutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </PageContainer>
  )
}
