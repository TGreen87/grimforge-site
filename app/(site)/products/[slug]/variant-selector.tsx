'use client'

import { useMemo, useState, useEffect } from 'react'
import type { VariantWithInventory } from './metadata'

interface Props {
  variants: VariantWithInventory[]
  onChange: (variant: VariantWithInventory | null) => void
  initialVariantId?: string
}

export default function VariantSelector({ variants, onChange, initialVariantId }: Props) {
  const [selectedId, setSelectedId] = useState<string | undefined>(initialVariantId)

  const current = useMemo(
    () => variants.find((variant) => variant.id === selectedId) || variants[0] || null,
    [variants, selectedId],
  )

  useEffect(() => {
    onChange(current || null)
  }, [current, onChange])

  if (!variants || variants.length === 0) return null

  return (
    <div className="space-y-2">
      <label className="text-sm text-bone">Stock Unit</label>
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
          {(current.inventory?.available ?? 0) > 0
            ? `${current.inventory?.available ?? 0} available`
            : 'Out of stock'}
        </p>
      )}
    </div>
  )
}
