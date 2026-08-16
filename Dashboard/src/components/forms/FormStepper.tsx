// components/forms/FormStepper.tsx

import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'

export interface FormStep {
  key: string
  label: string
  icon: LucideIcon
}

interface FormStepperProps {
  steps: FormStep[]
  currentStep: number
  completedStep: number
  onStepClick: (index: number) => void
}

export function FormStepper({
  steps,
  currentStep,
  completedStep,
  onStepClick,
}: FormStepperProps) {
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-w-0 overflow-hidden rounded-[22px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
      <div className="px-4 pt-4 sm:px-5 lg:px-6">
        <div className="h-1 overflow-hidden rounded-full bg-muted/70">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <div
          className="grid w-full gap-1 px-2 py-3 sm:px-3"
          style={{
            gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
          }}
        >
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep || index <= completedStep
            const canNavigate = index <= completedStep + 1 || index < currentStep

            return (
              <button
                key={step.key}
                type="button"
                disabled={!canNavigate}
                onClick={() => {
                  if (canNavigate) onStepClick(index)
                }}
                className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition-colors hover:bg-muted/30 disabled:cursor-default disabled:opacity-40 sm:px-2 lg:flex-row lg:justify-center lg:gap-2 lg:text-left"
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${
                    isActive
                      ? 'border-foreground bg-foreground text-background shadow-sm'
                      : isCompleted
                        ? 'border-success/20 bg-success-subtle text-success'
                        : 'border-border/70 bg-muted/20 text-muted-foreground'
                  }`}
                >
                  {isCompleted && !isActive ? (
                    <Check className="size-3.5" strokeWidth={2} />
                  ) : (
                    <Icon className="size-3.5" strokeWidth={1.8} />
                  )}
                </div>

                <div className="hidden min-w-0 lg:block">
                  <span
                    className={`block truncate text-[10px] font-semibold ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>

                  <span className="mt-0.5 block text-[8px] font-medium text-muted-foreground/50 tabular-nums">
                    Step {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}