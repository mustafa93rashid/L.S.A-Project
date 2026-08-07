import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface VerificationCodeInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  invalid?: boolean
  /** Associates the group with the visible <Label>, same contract as a
   * regular input's `id` — points a screen reader at the field's label. */
  labelledBy: string
  id?: string
}

const DIGITS_ONLY = /\D/g

/**
 * Six visually-separated digit slots that behave as one field — no OTP
 * dependency, just plain inputs wired for auto-advance, backspace-back,
 * arrow-key navigation, and pasting a full code into any slot. Each slot
 * is a real, individually-labelled <input> (never a non-semantic div), so
 * screen readers announce "Digit 1 of 6" etc. and the whole thing is fully
 * keyboard-operable.
 */
export function VerificationCodeInput({
  length = 6,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  labelledBy,
  id,
}: VerificationCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length }, (_, index) => value[index] ?? '')

  function setDigitAt(index: number, char: string) {
    const next = digits.slice()
    next[index] = char
    onChange(next.join(''))
  }

  function handleChange(index: number, rawInput: string) {
    const cleaned = rawInput.replace(DIGITS_ONLY, '')
    if (!cleaned) {
      setDigitAt(index, '')
      return
    }
    // Take the last digit typed (covers the "replace selected char" case)
    // and advance focus — a full paste is handled separately in onPaste.
    const char = cleaned[cleaned.length - 1] ?? ''
    setDigitAt(index, char)
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      inputRefs.current[index - 1]?.focus()
      setDigitAt(index - 1, '')
      return
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      inputRefs.current[index - 1]?.focus()
      return
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(DIGITS_ONLY, '')
    if (!pasted) return
    event.preventDefault()
    const next = pasted.slice(0, length)
    onChange(next)
    const focusIndex = Math.min(next.length, length - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="flex items-center gap-2"
      id={id}
    >
      {digits.map((digit, index) => (
        <input
          // Fixed-length slots — index is a genuinely stable position, not
          // a list identity being reused across reorders.
          key={index}
          ref={(node) => {
            inputRefs.current[index] = node
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-label={`Digit ${index + 1} of ${length}`}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onBlur={onBlur}
          className={cn(
            'h-12 w-10 rounded-lg border border-input bg-card text-center text-lg font-semibold text-foreground shadow-xs transition-colors outline-none hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
          )}
        />
      ))}
    </div>
  )
}
