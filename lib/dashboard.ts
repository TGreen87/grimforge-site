export interface RevenueSeriesRow {
  day: string
  paid_total?: number | null
  pending_total?: number | null
}

export interface LowStockTrendRow {
  day: string
  low_stock_count?: number | null
}

export type NormalizedRevenuePoint = { day: string; paid_total: number; pending_total: number }
export type NormalizedLowStockPoint = { day: string; low_stock_count: number }

export function mapRevenueSeries(rows: RevenueSeriesRow[] = []): NormalizedRevenuePoint[] {
  return rows.map((row) => ({
    day: row.day,
    paid_total: Number(row.paid_total ?? 0),
    pending_total: Number(row.pending_total ?? 0),
  }))
}

export function mapLowStockTrend(rows: LowStockTrendRow[] = []): NormalizedLowStockPoint[] {
  return rows.map((row) => ({
    day: row.day,
    low_stock_count: Number(row.low_stock_count ?? 0),
  }))
}
