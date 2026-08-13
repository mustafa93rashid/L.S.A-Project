import { useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormSection } from '@/components/forms/FormSection'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { VerificationCodeInput } from '@/components/forms/VerificationCodeInput'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { applyServerErrors } from '@/lib/form-errors'
import {
  useRequestPasswordChangeMutation,
  useVerifyPasswordChangeMutation,
} from '@/features/auth/queries'
import {
  requestPasswordChangeSchema,
  verifyPasswordChangeSchema,
  type RequestPasswordChangeInput,
  type VerifyPasswordChangeInput,
} from '@/features/auth/schema'
import { ShieldCheck } from 'lucide-react'

type Phase = 'idle' | 'request' | 'verify'

/** Extra client-side floor on top of the backend's own 5-per-15-minute
 * limiter — stops accidental rapid double-clicks on Resend without
 * pretending to own the real rate limit (the server response is still
 * authoritative and surfaced as-is if it's hit first). */
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

/**
 * Security section: static "Password ••••••••••••" state that expands,
 * inline, into a two-step change-password stepper — never a drawer or a
 * separate page. Step 1 collects only `currentPassword` (that's all
 * `POST /auth/change-password/request` accepts); step 2 collects the
 * verification code plus the new password (`POST /auth/change-password/verify`).
 *
 * The verified current password is held in local state (never persisted,
 * never in Zustand/localStorage) for the lifetime of the flow only, so
 * Resend can re-call step 1 without asking the user to retype it.
 */
export function SecurityCard() {
  const navigate = useNavigate()
  const requestMutation = useRequestPasswordChangeMutation()
  const verifyMutation = useVerifyPasswordChangeMutation()

  const [phase, setPhase] = useState<Phase>('idle')
  const [currentPassword, setCurrentPassword] = useState('')
  const [requestError, setRequestError] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null)
  const resendSecondsRemaining = useCountdown(resendAvailableAt)

  const codeLabelId = useId()

  const requestForm = useForm<RequestPasswordChangeInput>({
    resolver: zodResolver(requestPasswordChangeSchema),
    defaultValues: { currentPassword: '' },
  })

  const verifyForm = useForm<VerifyPasswordChangeInput>({
    resolver: zodResolver(verifyPasswordChangeSchema),
    defaultValues: { verificationCode: '', newPassword: '', confirmPassword: '' },
  })

  // Belt-and-suspenders: React Query never caches these mutations' inputs
  // (mutation variables aren't persisted anywhere), but explicitly
  // clearing local state on unmount guarantees nothing sensitive survives
  // a navigation away mid-flow.
  useEffect(() => {
    return () => {
      setCurrentPassword('')
    }
  }, [])

  function resetToIdle() {
    setPhase('idle')
    setCurrentPassword('')
    setRequestError(null)
    setVerifyError(null)
    setResendAvailableAt(null)
    requestForm.reset({ currentPassword: '' })
    verifyForm.reset({ verificationCode: '', newPassword: '', confirmPassword: '' })
  }

  const submitRequest = requestForm.handleSubmit((values) => {
    setRequestError(null)
    requestMutation.mutate(values, {
      onSuccess: (message) => {
        toast.success(message)
        setCurrentPassword(values.currentPassword)
        requestForm.reset({ currentPassword: '' })
        setResendAvailableAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000)
        setPhase('verify')
      },
      onError: (error) => setRequestError(applyServerErrors(requestForm, error)),
    })
  })

  function handleResend() {
    if (!currentPassword || resendSecondsRemaining > 0 || requestMutation.isPending)
      return

    setVerifyError(null)
    requestMutation.mutate(
      { currentPassword },
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
      onSuccess: (message) => {
        resetToIdle()
        toast.success(message)
        navigate('/login', { replace: true })
      },
      onError: (error) => setVerifyError(applyServerErrors(verifyForm, error)),
    })
  })

  return (
    <FormSection title="Security" description="Manage your account password." icon={ShieldCheck}>
      {phase === 'idle' ? (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Password
            </span>
            <p className="text-sm tracking-widest text-foreground">••••••••••••</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setPhase('request')}>
            Change password
          </Button>
        </div>
      ) : null}

      {phase === 'request' ? (
        <form className="flex flex-col gap-4" onSubmit={submitRequest} noValidate>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Step 1 of 2 — Verify your current password
          </p>

          {requestError ? (
            <Alert variant="destructive">
              <AlertDescription>{requestError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex max-w-sm flex-col gap-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <PasswordInput
              id="currentPassword"
              fieldLabel="current password"
              autoComplete="current-password"
              aria-invalid={!!requestForm.formState.errors.currentPassword}
              aria-describedby={
                requestForm.formState.errors.currentPassword
                  ? 'currentPassword-error'
                  : undefined
              }
              {...requestForm.register('currentPassword')}
            />
            {requestForm.formState.errors.currentPassword ? (
              <p id="currentPassword-error" className="text-xs text-destructive">
                {requestForm.formState.errors.currentPassword.message}
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
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {phase === 'verify' ? (
        <form className="flex flex-col gap-4" onSubmit={submitVerify} noValidate>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Step 2 of 2 — Enter the code and choose a new password
          </p>

          <p aria-live="polite" className="text-sm text-muted-foreground">
            We sent a 6-digit verification code to your email address. Enter it below
            along with your new password. The code expires in 10 minutes.
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

          <div className="grid max-w-sm gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput
                id="newPassword"
                fieldLabel="new password"
                autoComplete="new-password"
                aria-invalid={!!verifyForm.formState.errors.newPassword}
                aria-describedby={
                  verifyForm.formState.errors.newPassword
                    ? 'newPassword-error'
                    : undefined
                }
                {...verifyForm.register('newPassword')}
              />
              {verifyForm.formState.errors.newPassword ? (
                <p id="newPassword-error" className="text-xs text-destructive">
                  {verifyForm.formState.errors.newPassword.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  8+ characters, upper &amp; lowercase, a number, and a special character.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <PasswordInput
                id="confirmPassword"
                fieldLabel="confirm new password"
                autoComplete="new-password"
                aria-invalid={!!verifyForm.formState.errors.confirmPassword}
                aria-describedby={
                  verifyForm.formState.errors.confirmPassword
                    ? 'confirmPassword-error'
                    : undefined
                }
                {...verifyForm.register('confirmPassword')}
              />
              {verifyForm.formState.errors.confirmPassword ? (
                <p id="confirmPassword-error" className="text-xs text-destructive">
                  {verifyForm.formState.errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" disabled={verifyMutation.isPending}>
              {verifyMutation.isPending ? 'Verifying…' : 'Verify & change password'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={resetToIdle}
              disabled={verifyMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </FormSection>
  )
}
