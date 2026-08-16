// components/forms/VisibilityToggle.tsx

import {
  CheckCircle2,
  EyeOff,
  type LucideIcon,
} from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface VisibilityToggleProps {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void

  title?: string
  activeDescription: string
  inactiveDescription: string

  activeLabel?: string
  inactiveLabel?: string

  activeIcon?: LucideIcon
  inactiveIcon?: LucideIcon
}

export function VisibilityToggle({
  id,
  checked,
  onCheckedChange,
  title = 'Public visibility',
  activeDescription,
  inactiveDescription,
  activeLabel = 'Visible',
  inactiveLabel = 'Hidden',
  activeIcon: ActiveIcon = CheckCircle2,
  inactiveIcon: InactiveIcon = EyeOff,
}: VisibilityToggleProps) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        checked
          ? 'border-success/20 bg-success/[0.035]'
          : 'border-border/70 bg-muted/[0.06]'
      }`}
    >
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
              checked
                ? 'border-success/15 bg-success-subtle text-success'
                : 'border-border/70 bg-background text-muted-foreground'
            }`}
          >
            {checked ? (
              <ActiveIcon className="size-4" strokeWidth={1.8} />
            ) : (
              <InactiveIcon className="size-4" strokeWidth={1.8} />
            )}
          </div>

          <div>
            <Label
              htmlFor={id}
              className="cursor-pointer text-[12px] font-semibold"
            >
              {title}
            </Label>

            <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
              {checked ? activeDescription : inactiveDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                checked ? 'bg-success' : 'bg-muted-foreground/35'
              }`}
            />

            <span className="text-[10px] font-semibold text-foreground">
              {checked ? activeLabel : inactiveLabel}
            </span>
          </div>

          <Switch
            id={id}
            checked={checked}
            onCheckedChange={onCheckedChange}
          />
        </div>
      </div>
    </div>
  )
}