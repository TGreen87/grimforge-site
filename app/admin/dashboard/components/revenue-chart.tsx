'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import React from 'react'

interface RevenuePoint {
  day: string
  paid_total: number
  pending_total: number
}

interface Props {
  data: RevenuePoint[]
  highlightWindow?: RevenuePoint[]
}

const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
})

function formatDay(day: string) {
  const parsed = new Date(day)
  if (Number.isNaN(parsed.getTime())) return day
  return format(parsed, 'MMM d')
}

type ChartTooltipDatum = { dataKey?: string; value?: number | string }

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipDatum[]
  label?: string | number
}

interface HighlightDotProps {
  cx?: number
  cy?: number
  payload?: { payload?: { isRecent?: boolean } }
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload || payload.length === 0 || typeof label !== 'string') return null

  const typedPayload = payload as ChartTooltipDatum[]
  const paid = typedPayload.find((entry) => entry.dataKey === 'paid_total')
  const pending = typedPayload.find((entry) => entry.dataKey === 'pending_total')

  const toNumber = (value: number | string | undefined) => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') return Number.parseFloat(value)
    return 0
  }

  return (
    <div className="rounded-md border border-border bg-zinc-950/90 px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-bone">{formatDay(label)}</div>
      <div className="mt-1 flex flex-col gap-1">
        <span className="text-emerald-300">Paid: {currencyFormatter.format(toNumber(paid?.value))}</span>
        <span className="text-slate-300">Pending: {currencyFormatter.format(toNumber(pending?.value))}</span>
      </div>
    </div>
  )
}

export default function RevenueChart({ data, highlightWindow }: Props) {
  const highlightSet = React.useMemo(() => new Set((highlightWindow ?? []).map((point) => point.day)), [highlightWindow])
  const decorated = React.useMemo(
    () => data.map((point) => ({ ...point, isRecent: highlightSet.has(point.day) })),
    [data, highlightSet]
  )

  const renderHighlightDot = React.useCallback(
    (props: HighlightDotProps) => {
      const maybePayload = props.payload as { payload?: { isRecent?: boolean } } | undefined
      const isRecent = maybePayload?.payload?.isRecent ?? false
      const radius = isRecent ? 4 : 0

      return <circle cx={props.cx} cy={props.cy} r={radius} fill="#34d399" stroke="none" opacity={isRecent ? 1 : 0} />
    },
    []
  )

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={decorated} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#facc15" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#facc15" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
        <XAxis dataKey="day" stroke="rgba(226, 232, 240, 0.6)" tickLine={false} axisLine={false} tickFormatter={formatDay} minTickGap={32} />
        <YAxis stroke="rgba(226, 232, 240, 0.6)" tickLine={false} axisLine={false} tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : String(value))} width={48} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(125, 211, 252, 0.45)', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="pending_total"
          name="Pending"
          stroke="#facc15"
          fill="url(#pendingGradient)"
          strokeWidth={1.5}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="paid_total"
          name="Paid"
          stroke="#34d399"
          fill="url(#paidGradient)"
          strokeWidth={2}
          dot={renderHighlightDot}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
