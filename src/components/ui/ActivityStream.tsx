import { formatTimestamp, timeAgo } from '@/lib/utils'

export interface ActivityEvent {
  id: string
  timestamp: Date
  type: string
  title: string
  detail?: string
  severity?: 'info' | 'success' | 'warning' | 'error'
  source?: string
}

interface ActivityStreamProps {
  events: ActivityEvent[]
  maxHeight?: string
  live?: boolean
}

const severityText = {
  info:    'text-sky-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error:   'text-rose-400',
}

const severityDots = {
  info:    'status-dot-blue',
  success: 'status-dot-green',
  warning: 'status-dot-amber',
  error:   'status-dot-red',
}

export function ActivityStream({ events, maxHeight = '340px', live }: ActivityStreamProps) {
  return (
    <div className="relative overflow-y-auto scrollbar-thin divide-y divide-bg-border/30" style={{ maxHeight }}>
      {live && (
        <div className="sticky top-0 flex items-center justify-between px-4 py-2 bg-bg-secondary/95 border-b border-bg-border/70 z-10 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[11px] text-emerald-400 font-mono font-bold tracking-wider uppercase">
              LIVE TELEMETRY FEED
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">CALLISTO STREAM: NOMINAL</span>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">No active telemetry events recorded</div>
      ) : events.map((evt) => (
        <div key={evt.id} className="event-row px-4 py-3 hover:bg-sky-500/[0.04] transition-colors">
          <div className="flex items-start gap-3 min-w-0 w-full">
            <div className="mt-1 shrink-0">
              <span className={severityDots[evt.severity ?? 'info']} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-mono text-[11px] text-slate-400 font-medium shrink-0">
                  {formatTimestamp(evt.timestamp)}
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-bg-card border border-bg-border ${severityText[evt.severity ?? 'info']}`}>
                  {evt.type}
                </span>
                {evt.source && (
                  <span className="text-[10px] font-mono text-sky-300 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.2 rounded">
                    {evt.source}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-100 font-medium mt-0.5">{evt.title}</div>
              {evt.detail && (
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono truncate">
                  {evt.detail}
                </div>
              )}
            </div>
            <span className="text-[11px] font-mono text-slate-400 shrink-0 mt-0.5">
              {timeAgo(evt.timestamp)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
