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

const severityColors = {
  info:    'text-info-bright',
  success: 'text-success',
  warning: 'text-warning',
  error:   'text-danger-bright',
}

const severityDots = {
  info:    'status-dot-blue',
  success: 'status-dot-green',
  warning: 'status-dot-amber',
  error:   'status-dot-red',
}

export function ActivityStream({ events, maxHeight = '320px', live }: ActivityStreamProps) {
  return (
    <div className="relative overflow-y-auto scrollbar-thin" style={{ maxHeight }}>
      {live && (
        <div className="sticky top-0 flex items-center gap-2 px-3 py-1.5 bg-bg-panel border-b border-bg-border z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-2xs text-success font-medium">LIVE</span>
        </div>
      )}
      {events.length === 0 ? (
        <div className="text-center py-8 text-text-muted text-xs">No activity yet</div>
      ) : events.map((evt, idx) => (
        <div key={evt.id} className={`event-row px-3 ${idx % 2 === 0 ? '' : ''} animate-stream-in`}>
          <div className="flex items-start gap-2 min-w-0 w-full">
            <div className="mt-0.5 shrink-0">
              <span className={severityDots[evt.severity ?? 'info']} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-2xs text-text-muted shrink-0">{formatTimestamp(evt.timestamp)}</span>
                <span className={`text-2xs font-bold uppercase tracking-wide ${severityColors[evt.severity ?? 'info']}`}>{evt.type}</span>
                {evt.source && <span className="badge-blue text-2xs">{evt.source}</span>}
              </div>
              <div className="text-xs text-text-primary mt-0.5">{evt.title}</div>
              {evt.detail && <div className="text-2xs text-text-muted mt-0.5 truncate">{evt.detail}</div>}
            </div>
            <span className="text-2xs text-text-muted shrink-0 mt-0.5">{timeAgo(evt.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
