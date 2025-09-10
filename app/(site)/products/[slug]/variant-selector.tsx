'use client'

import { useMemo, useState, useEffect } from 'react'

interface Inventory { available?: number }
interface Variant { id: string; name?: string; price?: number; format?: string; inventory?: Inventory }

export default function VariantSelector({
  variants,
  onChange,
  initialVariantId,
}: {
  variants: Variant[]
  onChange: (variant: Variant | null) => void
  initialVariantId?: string
}) {
  const [selectedId, setSelectedId] = useState<string | undefined>(initialVariantId)

  const current = useMemo(() => variants.find(v => v.id === selectedId) || variants[0] || null, [variants, selectedId])

  useEffect(() => {
    onChange(current || null)
  }, [current, onChange])

  if (!variants || variants.length === 0) return null

  return (
    <div className="space-y-2">
      <label className="text-sm text-bone">Variant</label>
      <select
        className="bg-secondary/50 border border-border rounded px-3 py-2 text-foreground"
        value={current?.id}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {variants.map((v) => (
          <option key={v.id} value={v.id}>
            {(v.name || 'Standard')} {typeof v.price === 'number' ? `— $${v.price.toFixed(2)} AUD` : ''}
          </option>
        ))}
      </select>
      {current && (
        <p className="text-xs text-muted-foreground">
          {((current as any).inventory?.available ?? 0) > 0 ? `${(current as any).inventory.available} available` : 'Out of stock'}
        </p>
      )}
    </div>
  )
}

