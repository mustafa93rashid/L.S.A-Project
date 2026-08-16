// components/forms/FormStepNavigation.tsx

import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FormStepNavigationProps {
  currentStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
  isSubmitting?: boolean
  submitLabel: string
  submittingLabel?: string
}

export function FormStepNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  submittingLabel = 'Saving…',
}: FormStepNavigationProps) {
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 rounded-[20px] border border-border/70 bg-card p-3 shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
      <div className="min-w-0 flex-1">
        {currentStep > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="gap-1.5"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
        ) : null}
      </div>

      <div className="hidden shrink-0 text-center sm:block">
        <p className="text-[8px] font-semibold tracking-[0.1em] text-muted-foreground/50 uppercase">
          Current step
        </p>

        <p className="mt-0.5 text-[10px] font-semibold text-foreground tabular-nums">
          {currentStep + 1} of {totalSteps}
        </p>
      </div>

      <div className="flex min-w-0 flex-1 justify-end">
        {!isLastStep ? (
          <Button type="button" onClick={onNext} className="gap-1.5">
            Continue
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onSubmit}
            className="gap-1.5"
          >
            {isSubmitting ? submittingLabel : submitLabel}

            {!isSubmitting ? <Check className="size-4" /> : null}
          </Button>
        )}
      </div>
    </div>
  )
}