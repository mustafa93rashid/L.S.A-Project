import {
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'


export interface TitledStep {
  title: string
  description: string
  icon: string
}


export interface TitledStepError {
  title?: string
  description?: string
  icon?: string
}


interface StepsEditorProps {
  label: string
  itemLabel: string
  values: TitledStep[]
  onChange: (
    values: TitledStep[],
  ) => void

  /**
   * Array-level error.
   */
  error?: string

  /**
   * Errors for individual step fields.
   */
  itemErrors?: TitledStepError[]

  maxItems?: number
}


const emptyStep: TitledStep = {
  title: '',
  description: '',
  icon: '',
}


function FieldError({
  message,
}: {
  message?: string
}) {
  if (!message) return null

  return (
    <p className="mt-1 flex items-center gap-1.5 text-[9px] font-medium leading-4 text-destructive/80">
      <AlertCircle
        className="size-3 shrink-0"
        strokeWidth={1.7}
      />

      {message}
    </p>
  )
}


export function StepsEditor({
  label,
  itemLabel,
  values,
  onChange,
  error,
  itemErrors = [],
  maxItems,
}: StepsEditorProps) {
  const canAdd =
    maxItems === undefined ||
    values.length < maxItems


  const updateStep = (
    index: number,
    patch: Partial<TitledStep>,
  ) => {
    const next = [...values]

    next[index] = {
      ...next[index],
      ...patch,
    }

    onChange(next)
  }


  const removeStep = (
    index: number,
  ) => {
    onChange(
      values.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    )
  }


  const addStep = () => {
    if (!canAdd) return

    onChange([
      ...values,
      {
        ...emptyStep,
      },
    ])
  }


  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between gap-3">

        <Label className="text-[11px] font-semibold">
          {label}
        </Label>


        {maxItems !== undefined ? (
          <span className="text-[9px] text-muted-foreground tabular-nums">
            {values.length}/{maxItems}
          </span>
        ) : null}

      </div>


      <div className="space-y-3">

        {values.map(
          (step, index) => {
            const stepErrors =
              itemErrors[index] ??
              {}

            return (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-border/70 bg-background"
              >

                {/* Header */}

                <div className="flex items-center justify-between border-b border-border/60 bg-muted/[0.05] px-4 py-3">

                  <div className="flex items-center gap-2">

                    <span className="flex size-6 items-center justify-center rounded-lg border border-border/70 bg-background text-[9px] font-semibold text-muted-foreground tabular-nums">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        '0',
                      )}
                    </span>


                    <span className="text-[10px] font-semibold text-foreground">
                      {itemLabel}{' '}
                      {index + 1}
                    </span>

                  </div>


                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
                    onClick={() =>
                      removeStep(
                        index,
                      )
                    }
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2
                      className="size-4"
                      strokeWidth={
                        1.8
                      }
                    />
                  </Button>

                </div>


                {/* Fields */}

                <div className="space-y-4 p-4">

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                    {/* Title */}

                    <div className="space-y-1.5">

                      <Label
                        htmlFor={`step-${index}-title`}
                        className="text-[10px] font-semibold"
                      >
                        Title
                      </Label>


                      <Input
                        id={`step-${index}-title`}
                        placeholder={`${itemLabel} title`}
                        value={
                          step.title
                        }
                        aria-invalid={
                          Boolean(
                            stepErrors.title,
                          )
                        }
                        onChange={(
                          event,
                        ) =>
                          updateStep(
                            index,
                            {
                              title:
                                event
                                  .target
                                  .value,
                            },
                          )
                        }
                        className={`h-11 rounded-xl ${
                          stepErrors.title
                            ? 'border-destructive/40 focus-visible:ring-destructive/15'
                            : ''
                        }`}
                      />


                      <FieldError
                        message={
                          stepErrors.title
                        }
                      />

                    </div>


                    {/* Icon */}

                    <div className="space-y-1.5">

                      <Label
                        htmlFor={`step-${index}-icon`}
                        className="text-[10px] font-semibold"
                      >
                        Icon
                      </Label>


                      <Input
                        id={`step-${index}-icon`}
                        placeholder="e.g. FaTruck"
                        value={
                          step.icon
                        }
                        aria-invalid={
                          Boolean(
                            stepErrors.icon,
                          )
                        }
                        onChange={(
                          event,
                        ) =>
                          updateStep(
                            index,
                            {
                              icon:
                                event
                                  .target
                                  .value,
                            },
                          )
                        }
                        className={`h-11 rounded-xl ${
                          stepErrors.icon
                            ? 'border-destructive/40 focus-visible:ring-destructive/15'
                            : ''
                        }`}
                      />


                      <FieldError
                        message={
                          stepErrors.icon
                        }
                      />

                    </div>

                  </div>


                  {/* Description */}

                  <div className="space-y-1.5">

                    <Label
                      htmlFor={`step-${index}-description`}
                      className="text-[10px] font-semibold"
                    >
                      Description
                    </Label>


                    <Textarea
                      id={`step-${index}-description`}
                      rows={3}
                      placeholder={`${itemLabel} description`}
                      value={
                        step.description
                      }
                      aria-invalid={
                        Boolean(
                          stepErrors.description,
                        )
                      }
                      onChange={(
                        event,
                      ) =>
                        updateStep(
                          index,
                          {
                            description:
                              event
                                .target
                                .value,
                          },
                        )
                      }
                      className={`min-h-[100px] resize-y rounded-xl ${
                        stepErrors.description
                          ? 'border-destructive/40 focus-visible:ring-destructive/15'
                          : ''
                      }`}
                    />


                    <FieldError
                      message={
                        stepErrors.description
                      }
                    />

                  </div>

                </div>

              </div>
            )
          },
        )}

      </div>


      {/* Array Error */}

      <FieldError
        message={error}
      />


      {/* Add */}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canAdd}
        onClick={addStep}
        className="h-9 gap-1.5 rounded-xl"
      >
        <Plus
          className="size-3.5"
          strokeWidth={1.8}
        />

        Add {itemLabel.toLowerCase()}
      </Button>

    </div>
  )
}