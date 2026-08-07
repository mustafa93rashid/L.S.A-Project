import { Badge } from '@/components/ui/badge'

export type StatusTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

interface StatusBadgeProps {
  label: string
  tone: StatusTone
}

const TONE_VARIANT = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
  neutral: 'secondary',
} as const

/**
 * Deliberately generic — takes a semantic tone, not a raw backend status
 * string. Mapping e.g. "contacted" -> warning or "published" -> success is
 * feature-module logic (status enums differ per resource) and belongs in
 * each feature module later, not here — keeps this component reusable
 * across every module rather than coupled to one resource's status enum.
 */
export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return <Badge variant={TONE_VARIANT[tone]}>{label}</Badge>
}
