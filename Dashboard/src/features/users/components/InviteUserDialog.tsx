import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormDialog } from '@/components/overlays/FormDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { applyServerErrors } from '@/lib/form-errors'
import { useInviteUserMutation } from '@/features/users/queries'
import {
  inviteUserSchema,
  INVITABLE_ROLES,
  type InviteUserInput,
} from '@/features/users/schema'
import { ROLE_LABELS } from '@/constants/roles'

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const inviteMutation = useInviteUserMutation()

  const form = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { fullName: '', email: '', role: INVITABLE_ROLES[2] },
  })

  useEffect(() => {
    if (open) {
      form.reset({ fullName: '', email: '', role: INVITABLE_ROLES[2] })
      setFormError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    inviteMutation.mutate(values, {
      onSuccess: () => {
        toast.success('User invited successfully. An activation email has been sent.')
        onOpenChange(false)
      },
      onError: (error) => setFormError(applyServerErrors(form, error)),
    })
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Invite user"
      description="An activation email will be sent so they can set their own password."
      onSubmit={onSubmit}
      submitLabel="Send invite"
      isSubmitting={inviteMutation.isPending}
    >
      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-fullName">Full name</Label>
        <Input
          id="invite-fullName"
          aria-invalid={!!form.formState.errors.fullName}
          {...form.register('fullName')}
        />
        {form.formState.errors.fullName ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.fullName.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-role">Role</Label>
        <Select
          value={form.watch('role')}
          onValueChange={(value) =>
            form.setValue('role', value as InviteUserInput['role'])
          }
        >
          <SelectTrigger id="invite-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INVITABLE_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  )
}
