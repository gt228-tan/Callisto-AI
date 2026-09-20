import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatNumber, formatDelta } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: number | string
  delta?: number
  unit?: string
  icon?: React.ReactNode
  accent?: boolean
  loading?: boolean
  subtitle?: string
}

export function MetricCard({ label, value, delta, unit, icon, accent, loading, subtitle }: MetricCardProps) {
  if (loading) {
    return (
      <div className="panel-card p-4 flex flex-col gap-2">
        <div className="h-3 bg-bg-border rounded w-2/3 animate-pulse" />
        <div className="h-7 bg-bg-border rounded w-1/2 animate-pulse" />
        <div className="h-2.5 bg-bg-border rounded w-1/3 animate-pulse" />
      </div>
    )
  }

  const displayValue = typeof value === 'number' ? formatNumber(value) : value

  return (
    <div className={`panel-card p-3 sm:p-4 flex flex-col gap-1 hover:border-amber-500/30 transition-colors group ${accent ? 'border-amber-500/20 bg-amber-500/5' : ''}`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-2xs uppercase tracking-wider text-text-muted font-medium truncate">{label}</span>
        {icon && <span className={`shrink-0 text-text-muted group-hover:text-amber-500 transition-colors ${accent ? 'text-amber-500' : ''}`}>{icon}</span>}
      </div>
      <div className={`text-xl sm:text-2xl font-bold font-mono tracking-tight truncate ${accent ? 'text-amber-400' : 'text-text-primary'}`}>
        {displayValue}{unit && <span className="text-xs sm:text-sm text-text-muted ml-1">{unit}</span>}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {delta !== undefined && (
          <span className={`flex items-center gap-0.5 text-2xs font-semibold shrink-0 ${delta > 0 ? 'metric-up' : delta < 0 ? 'metric-down' : 'text-text-muted'}`}>
            {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {formatDelta(delta)}
          </span>
        )}
        {subtitle && <span className="text-2xs text-text-muted truncate">{subtitle}</span>}
      </div>
    </div>
  )
}
