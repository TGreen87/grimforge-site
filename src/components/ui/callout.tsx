import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react'

const icons = {
  info: Info,
  warn: AlertTriangle,
  success: CheckCircle2,
}

export type CalloutProps = {
  variant?: 'info' | 'warn' | 'success'
  title?: string
  children?: ReactNode
  className?: string
}

export function Callout({ variant = 'info', title, children, className }: CalloutProps) {
  const Icon = icons[variant]
  const colorMap = {
    info: 'border-blue-500/40 bg-blue-500/5 text-blue-100',
    warn: 'border-amber-500/40 bg-amber-500/5 text-amber-100',
    success: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-100',
  }[variant]

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', colorMap, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        {title ? <div className="font-semibold text-foreground">{title}</div> : null}
        {children ? <div className="text-foreground/90 leading-relaxed">{children}</div> : null}
      </div>
    </div>
  )
}
