import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  placeholder?: string
  className?: string
  disabled?: boolean
  ariaLabel?: string
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search…',
  className,
  disabled = false,
  ariaLabel = 'Search',
}: SearchInputProps) {
  const handleClear = () => {
    if (onClear) {
      onClear()
      return
    }

    onChange('')
  }

  return (
    <div className={cn('relative min-w-0 w-full', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/45" strokeWidth={1.8} aria-hidden="true" />

      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} aria-label={ariaLabel} className="h-11 w-full rounded-xl border-border/70 bg-background pl-11 pr-11 text-[13px] shadow-none" />

      {value ? (
        <button type="button" aria-label="Clear search" onClick={handleClear} disabled={disabled} className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/45 transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50">
          <X className="size-3.5" strokeWidth={1.8} />
        </button>
      ) : null}
    </div>
  )
}