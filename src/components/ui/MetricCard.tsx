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
      <div className="panel p-4 flex flex-col gap-2.5">
        <div className="h-3 bg-bg-border/60 rounded w-2/3 animate-pulse" />
        <div className="h-7 bg-bg-border/60 rounded w-1/2 animate-pulse" />
        <div className="h-3 bg-bg-border/60 rounded w-1/3 animate-pulse" />
      </div>
    )
  }

  const displayValue = typeof value === 'number' ? formatNumber(value) : value

  return (
    <div className={`relative panel p-3.5 sm:p-4 flex flex-col justify-between gap-1.5 overflow-hidden group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/10 ${
      accent
        ? 'border-sky-500/40 bg-gradient-to-br from-sky-500/10 via-bg-panel to-bg-panel'
        : 'hover:border-sky-500/30'
    }`}>
      {/* Top Hairline Telemetry Glow Accent */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] transition-opacity ${
        accent ? 'bg-gradient-to-r from-sky-400 via-amber-400 to-sky-400 opacity-90' : 'bg-slate-700/50 group-hover:bg-sky-400/80'
      }`} />

      {/* Label & Icon Header */}
      <div className="flex items-center justify-between gap-1 pt-0.5">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-medium truncate">
          {label}
        </span>
        {icon && (
          <span className={`shrink-0 transition-colors ${
            accent ? 'text-sky-400' : 'text-slate-400 group-hover:text-sky-300'
          }`}>
            {icon}
          </span>
        )}
      </div>

      {/* Primary Value */}
      <div className="my-0.5">
        <div className={`text-xl sm:text-2xl font-bold font-mono tracking-tight truncate ${
          accent ? 'text-sky-200 drop-shadow-[0_0_10px_rgba(56,189,248,0.2)]' : 'text-slate-100'
        }`}>
          {displayValue}
          {unit && <span className="text-xs font-mono text-slate-400 ml-1 font-normal">{unit}</span>}
        </div>
      </div>

      {/* Trend & Subtitle Footer */}
      <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
        {delta !== undefined && (
          <span className={`flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded ${
            delta > 0
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
              : delta < 0
              ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
              : 'text-slate-400 bg-slate-800/40 border border-slate-700/40'
          }`}>
            {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {formatDelta(delta)}
          </span>
        )}
        {subtitle && (
          <span className="text-slate-400 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}
