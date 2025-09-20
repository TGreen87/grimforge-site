import { describe, it, expect } from 'vitest'
import { mapRevenueSeries, mapLowStockTrend } from '@/lib/dashboard'

describe('dashboard mappers', () => {
  it('maps revenue series with numeric coercion', () => {
    const result = mapRevenueSeries([
      { day: '2025-09-18', paid_total: '1200' as unknown as number, pending_total: null },
      { day: '2025-09-19', paid_total: undefined, pending_total: 300 },
    ])

    expect(result).toEqual([
      { day: '2025-09-18', paid_total: 1200, pending_total: 0 },
      { day: '2025-09-19', paid_total: 0, pending_total: 300 },
    ])
  })

  it('maps low stock trend with fallback values', () => {
    const result = mapLowStockTrend([
      { day: '2025-09-18', low_stock_count: null },
      { day: '2025-09-19', low_stock_count: 4 },
    ])

    expect(result).toEqual([
      { day: '2025-09-18', low_stock_count: 0 },
      { day: '2025-09-19', low_stock_count: 4 },
    ])
  })
})
