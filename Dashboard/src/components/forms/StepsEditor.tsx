import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface TitledStep {
  title: string
  description: string
  icon: string
}

interface StepsEditorProps {
  label: string
  itemLabel: string
  values: TitledStep[]
  onChange: (values: TitledStep[]) => void
  error?: string
}

const emptyStep: TitledStep = { title: '', description: '', icon: '' }

/** Editable list of {title, description, icon} entries — Services'
 * delivery-process steps and Projects' detailed-scope items share this
 * exact shape, so it lives here rather than duplicated per feature. */
export function StepsEditor({
  label,
  itemLabel,
  values,
  onChange,
  error,
}: StepsEditorProps) {
  const updateStep = (index: number, patch: Partial<TitledStep>) => {
    const next = [...values]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <Label>{label}</Label>
      {values.map((step, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-lg border border-border p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {itemLabel} {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
              onClick={() => onChange(values.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder={`${itemLabel} title`}
              value={step.title}
              onChange={(event) => updateStep(index, { title: event.target.value })}
            />
            <Input
              placeholder="Icon (e.g. FaTruck)"
              value={step.icon}
              onChange={(event) => updateStep(index, { icon: event.target.value })}
            />
          </div>
          <Textarea
            rows={2}
            placeholder={`${itemLabel} description`}
            value={step.description}
            onChange={(event) => updateStep(index, { description: event.target.value })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => onChange([...values, { ...emptyStep }])}
      >
        <Plus className="size-4" />
        Add {itemLabel.toLowerCase()}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
