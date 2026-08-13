import { useState } from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { AuthLayout } from '@/layouts/AuthLayout'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'

import { applyServerErrors } from '@/lib/form-errors'

import { useActivateAccountMutation } from '@/features/auth/queries'

import {
  activateAccountSchema,
  type ActivateAccountInput,
} from '@/features/auth/schema'

export default function ActivateAccountPage() {
  const { token } = useParams<{ token: string }>()

  const navigate = useNavigate()

  const [formError, setFormError] =
    useState<string | null>(null)

  const activateAccountMutation =
    useActivateAccountMutation()

  const form = useForm<ActivateAccountInput>({
    resolver: zodResolver(activateAccountSchema),

    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    if (!token) {
      setFormError(
        'This activation link is invalid. Ask an administrator to resend it.',
      )

      return
    }

    setFormError(null)

    activateAccountMutation.mutate(
      {
        token,
        ...values,
      },

      {
        onSuccess: (message) => {
          toast.success(message)

          navigate('/login', {
            replace: true,
          })
        },

        onError: (error) => {
          setFormError(
            applyServerErrors(form, error),
          )
        },
      },
    )
  })

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>
            Activate your account
          </CardTitle>

          <CardDescription>
            Set a password to activate your LSA
            dashboard account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!token ? (
            <Alert variant="destructive">
              <AlertDescription>
                This activation link is invalid or
                missing its token. Ask an
                administrator to resend it.
              </AlertDescription>
            </Alert>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={onSubmit}
              noValidate
            >
              {formError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {formError}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">
                  Password
                </Label>

                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={
                    !!form.formState.errors.password
                  }
                  {...form.register('password')}
                />

                {form.formState.errors.password ? (
                  <p className="text-xs text-destructive">
                    {
                      form.formState.errors.password
                        .message
                    }
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">
                  Confirm password
                </Label>

                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={
                    !!form.formState.errors
                      .confirmPassword
                  }
                  {...form.register(
                    'confirmPassword',
                  )}
                />

                {form.formState.errors
                  .confirmPassword ? (
                  <p className="text-xs text-destructive">
                    {
                      form.formState.errors
                        .confirmPassword.message
                    }
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                disabled={
                  activateAccountMutation.isPending
                }
              >
                {activateAccountMutation.isPending
                  ? 'Activating…'
                  : 'Activate account'}
              </Button>
            </form>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link
              to="/login"
              className="hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}