import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormSection } from '@/components/forms/FormSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { applyServerErrors } from '@/lib/form-errors'
import { buildFormData } from '@/lib/form-data'
import { useUpdateProfileMutation } from '@/features/profile/queries'
import { personalInfoSchema, type PersonalInfoInput } from '@/features/profile/schema'
import type { ProfileUser } from '@/features/profile/types'

interface PersonalInfoCardProps {
  profile: ProfileUser
}

/** Editable identity/contact fields — exactly what `PATCH /users/profile`
 * accepts (see `personalInfoSchema`, mirrored from the backend's
 * `updateProfileValidation`). Email is deliberately NOT here — it's a
 * verified account field with its own flow (`EmailChangeField`); this
 * endpoint now rejects an `email` key outright. Save stays disabled until
 * the form is actually dirty, and the dirty baseline resets to the saved
 * values on success so a second edit is required before Save re-enables. */
export function PersonalInfoCard({ profile }: PersonalInfoCardProps) {
  const updateMutation = useUpdateProfileMutation()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: profile.fullName,
      phone: profile.phone ?? '',
      department: profile.department ?? '',
    },
  })

  useEffect(() => {
    form.reset({
      fullName: profile.fullName,
      phone: profile.phone ?? '',
      department: profile.department ?? '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    const formData = buildFormData({ ...values })
    updateMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Profile updated successfully')
        // Resets the dirty baseline to the just-saved values so Save
        // Changes goes back to disabled until the next real edit.
        form.reset(values)
      },
      onError: (error) => setFormError(applyServerErrors(form, error)),
    })
  })

  return (
    <FormSection
      title="Personal Information"
      description="Update your name, contact details, and department."
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              aria-invalid={!!form.formState.errors.fullName}
              aria-describedby={
                form.formState.errors.fullName ? 'fullName-error' : undefined
              }
              {...form.register('fullName')}
            />
            {form.formState.errors.fullName ? (
              <p id="fullName-error" className="text-xs text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              aria-invalid={!!form.formState.errors.phone}
              aria-describedby={form.formState.errors.phone ? 'phone-error' : undefined}
              {...form.register('phone')}
            />
            {form.formState.errors.phone ? (
              <p id="phone-error" className="text-xs text-destructive">
                {form.formState.errors.phone.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              aria-invalid={!!form.formState.errors.department}
              aria-describedby={
                form.formState.errors.department ? 'department-error' : undefined
              }
              {...form.register('department')}
            />
            {form.formState.errors.department ? (
              <p id="department-error" className="text-xs text-destructive">
                {form.formState.errors.department.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={!form.formState.isDirty || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </FormSection>
  )
}
