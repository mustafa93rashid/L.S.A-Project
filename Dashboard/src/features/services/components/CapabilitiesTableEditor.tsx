import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CapabilityTableRow } from '@/features/services/types'

interface CapabilitiesTable {
  headers: string[]
  rows: CapabilityTableRow[]
}

interface CapabilitiesTableEditorProps {
  table: CapabilitiesTable
  onChange: (table: CapabilitiesTable) => void
  error?: string
}

/** Feature-local — only the Services capabilities section needs an
 * editable comparison table. Every row's cell count is kept in sync with
 * the header count automatically (adding/removing a column pads or
 * truncates every existing row), since the backend requires
 * `row.cells.length === headers.length` for every row. */
export function CapabilitiesTableEditor({
  table,
  onChange,
  error,
}: CapabilitiesTableEditorProps) {
  const resizeRowCells = (
    headers: string[],
    rows: CapabilityTableRow[],
  ): CapabilityTableRow[] =>
    rows.map((row) => ({
      cells: headers.map((_, index) => row.cells[index] ?? ''),
    }))

  const updateHeader = (index: number, value: string) => {
    const headers = [...table.headers]
    headers[index] = value
    onChange({ headers, rows: table.rows })
  }

  const addColumn = () => {
    const headers = [...table.headers, '']
    onChange({ headers, rows: resizeRowCells(headers, table.rows) })
  }

  const removeColumn = (index: number) => {
    const headers = table.headers.filter((_, i) => i !== index)
    onChange({ headers, rows: resizeRowCells(headers, table.rows) })
  }

  const addRow = () => {
    onChange({
      headers: table.headers,
      rows: [...table.rows, { cells: table.headers.map(() => '') }],
    })
  }

  const removeRow = (rowIndex: number) => {
    onChange({
      headers: table.headers,
      rows: table.rows.filter((_, i) => i !== rowIndex),
    })
  }

  const updateCell = (rowIndex: number, cellIndex: number, value: string) => {
    const rows = table.rows.map((row, i) => {
      if (i !== rowIndex) return row
      const cells = [...row.cells]
      cells[cellIndex] = value
      return { cells }
    })
    onChange({ headers: table.headers, rows })
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Capabilities comparison table</Label>

      <div className="flex flex-col gap-2 overflow-x-auto rounded-lg border border-border p-3">
        <div className="flex items-center gap-2">
          {table.headers.map((header, index) => (
            <div key={index} className="flex min-w-40 items-center gap-1">
              <Input
                placeholder={`Column ${index + 1}`}
                value={header}
                onChange={(event) => updateHeader(index, event.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove column ${index + 1}`}
                onClick={() => removeColumn(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addColumn}>
            <Plus className="size-4" />
            Column
          </Button>
        </div>

        {table.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-2">
            {row.cells.map((cell, cellIndex) => (
              <Input
                key={cellIndex}
                className="min-w-40"
                placeholder={table.headers[cellIndex] || `Column ${cellIndex + 1}`}
                value={cell}
                onChange={(event) => updateCell(rowIndex, cellIndex, event.target.value)}
              />
            ))}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove row ${rowIndex + 1}`}
              onClick={() => removeRow(rowIndex)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={addRow}
        disabled={table.headers.length === 0}
      >
        <Plus className="size-4" />
        Add row
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
