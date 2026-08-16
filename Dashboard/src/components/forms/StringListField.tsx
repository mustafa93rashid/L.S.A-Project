import {
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'


interface StringListFieldProps {
  id: string
  label: string
  values: string[]
  onChange: (values: string[]) => void

  /**
   * General array-level error:
   * e.g. "At least one highlight is required."
   */
  error?: string

  /**
   * Error for each individual item.
   */
  itemErrors?: Array<string | undefined>

  placeholder?: string

  addLabel?: string

  maxItems?: number
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


export function StringListField({
  id,
  label,
  values,
  onChange,
  error,
  itemErrors = [],
  placeholder = 'Enter item',
  addLabel = 'Add item',
  maxItems,
}: StringListFieldProps) {
  const canAdd =
    maxItems === undefined ||
    values.length < maxItems


  const updateItem = (
    index: number,
    value: string,
  ) => {
    const next = [...values]

    next[index] = value

    onChange(next)
  }


  const removeItem = (
    index: number,
  ) => {
    const next =
      values.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      )

    onChange(next)
  }


  const addItem = () => {
    if (!canAdd) return

    onChange([
      ...values,
      '',
    ])
  }


  return (
    <div className="space-y-3">

      <div className="flex items-center justify-between gap-3">

        <Label
          htmlFor={id}
          className="text-[11px] font-semibold"
        >
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
          (value, index) => {
            const itemError =
              itemErrors[index]

            return (
              <div
                key={index}
                className="space-y-1.5"
              >

                <div className="flex items-center gap-2">

                  <div className="min-w-0 flex-1">

                    <Input
                      id={
                        index === 0
                          ? id
                          : undefined
                      }
                      value={value}
                      placeholder={`${placeholder} ${index + 1}`}
                      aria-invalid={
                        Boolean(
                          itemError,
                        )
                      }
                      onChange={(
                        event,
                      ) =>
                        updateItem(
                          index,
                          event.target
                            .value,
                        )
                      }
                      className={`h-11 rounded-xl ${
                        itemError
                          ? 'border-destructive/40 focus-visible:ring-destructive/15'
                          : ''
                      }`}
                    />

                  </div>


                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${label.toLowerCase()} item ${index + 1}`}
                    onClick={() =>
                      removeItem(
                        index,
                      )
                    }
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2
                      className="size-4"
                      strokeWidth={
                        1.8
                      }
                    />
                  </Button>

                </div>


                <FieldError
                  message={
                    itemError
                  }
                />

              </div>
            )
          },
        )}

      </div>


      <FieldError
        message={error}
      />


      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canAdd}
        onClick={addItem}
        className="h-9 gap-1.5 rounded-xl"
      >
        <Plus
          className="size-3.5"
          strokeWidth={1.8}
        />

        {addLabel}
      </Button>

    </div>
  )
}