'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'

interface LowStockPoint {
  day: string
  low_stock_count: number
}

interface Props {
  data: LowStockPoint[]
}

function formatDay(day: string) {
  const parsed = new Date(day)
  if (Number.isNaN(parsed.getTime())) return day
  return format(parsed, 'MMM d')
}

interface ChartTooltipDatum {
  value?: number | string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipDatum[]
  label?: string | number
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload || payload.length === 0 || typeof label !== 'string') return null
  return (
    <div className="rounded-md border border-border bg-zinc-950/90 px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-bone">{formatDay(label)}</div>
      <div className="mt-1 text-slate-300">{payload[0]?.value ?? 0} variants at low stock</div>
    </div>
  )
}

export default function LowStockChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="lowStockGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fda4af" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#fda4af" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(248, 113, 113, 0.18)" />
        <XAxis dataKey="day" stroke="rgba(248, 250, 252, 0.6)" tickLine={false} axisLine={false} tickFormatter={formatDay} minTickGap={27} />
        <YAxis stroke="rgba(248, 250, 252, 0.6)" tickLine={false} axisLine={false} allowDecimals={false} width={36} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(251, 113, 133, 0.35)', strokeWidth: 1 }} />
        <Area type="monotone" dataKey="low_stock_count" stroke="#fda4af" fill="url(#lowStockGradient)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
