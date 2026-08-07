import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FormActionsProps {
  onCancel: () => void
  submitLabel: string
  pendingLabel?: string
  isSubmitting: boolean
  /** Long forms (Services/Projects) keep this pinned to the viewport
   * bottom so Save/Cancel stay reachable without scrolling back up. */
  sticky?: boolean
}

/** Save/Cancel action bar shared by every Create/Edit page. */
export function FormActions({
  onCancel,
  submitLabel,
  pendingLabel = 'Saving…',
  isSubmitting,
  sticky = false,
}: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 border-t border-border bg-background py-4',
        sticky && 'sticky bottom-0 z-10 -mx-4 px-4 lg:-mx-6 lg:px-6',
      )}
    >
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? pendingLabel : submitLabel}
      </Button>
    </div>
  )
}
