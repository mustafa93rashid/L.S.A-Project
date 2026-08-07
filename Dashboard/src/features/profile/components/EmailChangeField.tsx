import { useEffect, useId, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormSection } from '@/components/forms/FormSection'
import { VerificationCodeInput } from '@/components/forms/VerificationCodeInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { applyServerErrors } from '@/lib/form-errors'
import {
  useRequestEmailChangeMutation,
  useVerifyEmailChangeMutation,
} from '@/features/profile/queries'
import {
  requestEmailChangeSchema,
  verifyEmailChangeSchema,
  type RequestEmailChangeInput,
  type VerifyEmailChangeInput,
} from '@/features/profile/schema'
import type { ProfileUser } from '@/features/profile/types'

type Phase = 'idle' | 'request' | 'verify'

/** Same client-side floor as SecurityCard's Resend — the backend's own
 * 5-per-15-minute limiter is still authoritative. */
const RESEND_COOLDOWN_SECONDS = 30

function useCountdown(targetTimestamp: number | null): number {
  const [secondsRemaining, setSecondsRemaining] = useState(0)

  useEffect(() => {
    if (targetTimestamp === null) {
      setSecondsRemaining(0)
      return
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000))
      setSecondsRemaining(remaining)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [targetTimestamp])

  return secondsRemaining
}

interface EmailChangeFieldProps {
  profile: ProfileUser
}

/**
 * Email is a verified account field, not a plain profile input — it lives
 * in its own card (same pattern as `SecurityCard`), never inside
 * `PersonalInfoCard`'s form. The current email stays active for the
 * entire flow; only a successful verify (step 2) replaces it.
 */
export function EmailChangeField({ profile }: EmailChangeFieldProps) {
  const requestMutation = useRequestEmailChangeMutation()
  const verifyMutation = useVerifyEmailChangeMutation()

  const [phase, setPhase] = useState<Phase>('idle')
  const [pendingEmail, setPendingEmail] = useState('')
  const [requestError, setRequestError] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null)
  const resendSecondsRemaining = useCountdown(resendAvailableAt)

  const codeLabelId = useId()

  const requestForm = useForm<RequestEmailChangeInput>({
    resolver: zodResolver(requestEmailChangeSchema),
    defaultValues: { newEmail: '' },
  })

  const verifyForm = useForm<VerifyEmailChangeInput>({
    resolver: zodResolver(verifyEmailChangeSchema),
    defaultValues: { verificationCode: '' },
  })

  function resetToIdle() {
    setPhase('idle')
    setPendingEmail('')
    setRequestError(null)
    setVerifyError(null)
    setResendAvailableAt(null)
    requestForm.reset({ newEmail: '' })
    verifyForm.reset({ verificationCode: '' })
  }

  const submitRequest = requestForm.handleSubmit((values) => {
    setRequestError(null)
    requestMutation.mutate(values, {
      onSuccess: (message) => {
        toast.success(message)
        setPendingEmail(values.newEmail)
        setResendAvailableAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000)
        setPhase('verify')
      },
      onError: (error) => setRequestError(applyServerErrors(requestForm, error)),
    })
  })

  function handleResend() {
    if (!pendingEmail || resendSecondsRemaining > 0 || requestMutation.isPending) return

    setVerifyError(null)
    requestMutation.mutate(
      { newEmail: pendingEmail },
      {
        onSuccess: (message) => {
          toast.success(message)
          setResendAvailableAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000)
        },
        onError: (error) => {
          const message = applyServerErrors(verifyForm, error)
          if (message) setVerifyError(message)
        },
      },
    )
  }

  const submitVerify = verifyForm.handleSubmit((values) => {
    setVerifyError(null)
    verifyMutation.mutate(values, {
      onSuccess: ({ message }) => {
        toast.success(message)
        resetToIdle()
      },
      onError: (error) => setVerifyError(applyServerErrors(verifyForm, error)),
    })
  })

  return (
    <FormSection
      title="Email Address"
      description="Manage the email address used to sign in."
    >
      {phase === 'idle' ? (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Current email
            </span>
            <p className="text-sm text-foreground">{profile.email}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setPhase('request')}>
            Change email
          </Button>
        </div>
      ) : null}

      {phase === 'request' ? (
        <form className="flex flex-col gap-4" onSubmit={submitRequest} noValidate>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Step 1 of 2 — Enter your new email
          </p>

          <Alert variant="info">
            <AlertDescription>
              Your new email address must be verified before it becomes active. Your
              current email ({profile.email}) stays active until then.
            </AlertDescription>
          </Alert>

          {requestError ? (
            <Alert variant="destructive">
              <AlertDescription>{requestError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex max-w-sm flex-col gap-1.5">
            <Label htmlFor="newEmail">New email</Label>
            <Input
              id="newEmail"
              type="email"
              autoComplete="email"
              aria-invalid={!!requestForm.formState.errors.newEmail}
              aria-describedby={
                requestForm.formState.errors.newEmail ? 'newEmail-error' : undefined
              }
              {...requestForm.register('newEmail')}
            />
            {requestForm.formState.errors.newEmail ? (
              <p id="newEmail-error" className="text-xs text-destructive">
                {requestForm.formState.errors.newEmail.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" disabled={requestMutation.isPending}>
              {requestMutation.isPending ? 'Sending…' : 'Send verification code'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={resetToIdle}
              disabled={requestMutation.isPending}
            >
              Cancel email change
            </Button>
          </div>
        </form>
      ) : null}

      {phase === 'verify' ? (
        <form className="flex flex-col gap-4" onSubmit={submitVerify} noValidate>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Step 2 of 2 — Verify your new email
          </p>

          <p aria-live="polite" className="text-sm text-muted-foreground">
            We sent a 6-digit verification code to <strong>{pendingEmail}</strong>. Enter
            it below to confirm this address. Your current email ({profile.email}) stays
            active until you do. The code expires in 10 minutes.
          </p>

          {verifyError ? (
            <Alert variant="destructive">
              <AlertDescription>{verifyError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label id={codeLabelId}>Verification code</Label>
            <Controller
              control={verifyForm.control}
              name="verificationCode"
              render={({ field }) => (
                <VerificationCodeInput
                  labelledBy={codeLabelId}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!verifyForm.formState.errors.verificationCode}
                  disabled={verifyMutation.isPending}
                />
              )}
            />
            {verifyForm.formState.errors.verificationCode ? (
              <p className="text-xs text-destructive">
                {verifyForm.formState.errors.verificationCode.message}
              </p>
            ) : null}

            <Button
              type="button"
              variant="link"
              size="sm"
              className="w-fit px-0"
              onClick={handleResend}
              disabled={requestMutation.isPending || resendSecondsRemaining > 0}
            >
              {resendSecondsRemaining > 0
                ? `Resend code (${resendSecondsRemaining}s)`
                : requestMutation.isPending
                  ? 'Resending…'
                  : 'Resend code'}
            </Button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" disabled={verifyMutation.isPending}>
              {verifyMutation.isPending ? 'Verifying…' : 'Verify email'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={resetToIdle}
              disabled={verifyMutation.isPending}
            >
              Cancel email change
            </Button>
          </div>
        </form>
      ) : null}
    </FormSection>
  )
}
