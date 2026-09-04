import { cn } from '@/lib/utils'

type Variant = 'high' | 'medium' | 'low' | 'success' | 'danger' | 'amber' | 'blue' | 'purple' | 'default'

interface StatusBadgeProps {
  variant?: Variant
  children: React.ReactNode
  dot?: boolean
  className?: string
}

const variantMap: Record<Variant, string> = {
  high:    'badge-high',
  medium:  'badge-medium',
  low:     'badge-low',
  success: 'badge-success',
  danger:  'badge-danger',
  amber:   'badge-amber',
  blue:    'badge-blue',
  purple:  'badge-purple',
  default: 'badge bg-bg-card text-text-secondary border border-bg-border',
}

const dotMap: Record<Variant, string> = {
  high:    'status-dot-amber',
  medium:  'status-dot-blue',
  low:     'status-dot-red',
  success: 'status-dot-green',
  danger:  'status-dot-red',
  amber:   'status-dot-amber',
  blue:    'status-dot-blue',
  purple:  'bg-purple-500 w-1.5 h-1.5 rounded-full',
  default: 'status-dot-blue',
}

export function StatusBadge({ variant = 'default', children, dot, className }: StatusBadgeProps) {
  return (
    <span className={cn(variantMap[variant], className)}>
      {dot && <span className={cn(dotMap[variant], 'animate-pulse')} />}
      {children}
    </span>
  )
}

// Convenience helpers
export function intentBadge(intent: string) {
  const v = intent === 'HIGH' ? 'high' : intent === 'MEDIUM' ? 'medium' : 'low'
  return <StatusBadge variant={v}>{intent}</StatusBadge>
}

export function outcomeBadge(outcome: string) {
  const map: Record<string, Variant> = {
    MEETING_BOOKED: 'success',
    QUALIFIED: 'success',
    ANSWERED: 'amber',
    CALLBACK: 'blue',
    VOICEMAIL: 'default',
    NO_ANSWER: 'danger',
    NOT_INTERESTED: 'danger',
    CALL_BACK: 'blue',
  }
  const label: Record<string, string> = {
    MEETING_BOOKED: 'Meeting Booked',
    QUALIFIED: 'Qualified',
    ANSWERED: 'Answered',
    CALLBACK: 'Callback',
    VOICEMAIL: 'Voicemail',
    NO_ANSWER: 'No Answer',
    NOT_INTERESTED: 'Not Interested',
    CALL_BACK: 'Call Back',
  }
  return <StatusBadge variant={map[outcome] ?? 'default'}>{label[outcome] ?? outcome}</StatusBadge>
}

export function verdictBadge(verdict: string) {
  const map: Record<string, Variant> = {
    QUALIFIED: 'success',
    LIKELY: 'amber',
    NEEDS_REVIEW: 'blue',
    NOT_QUALIFIED: 'danger',
  }
  const label: Record<string, string> = {
    QUALIFIED: 'Qualified',
    LIKELY: 'Likely',
    NEEDS_REVIEW: 'Needs Review',
    NOT_QUALIFIED: 'Not Qualified',
  }
  return <StatusBadge variant={map[verdict] ?? 'default'}>{label[verdict] ?? verdict}</StatusBadge>
}

export function campaignStatusBadge(status: string) {
  const map: Record<string, Variant> = {
    ACTIVE: 'success',
    SCHEDULED: 'blue',
    PAUSED: 'amber',
    COMPLETED: 'default',
    DRAFT: 'purple',
  }
  return <StatusBadge variant={map[status] ?? 'default'} dot={status === 'ACTIVE'}>{status}</StatusBadge>
}

export function leadStatusBadge(status: string) {
  const map: Record<string, Variant> = {
    NEW: 'blue',
    ENRICHED: 'purple',
    QUALIFIED: 'success',
    CONTACTED: 'amber',
    INTERESTED: 'success',
    MEETING: 'success',
    OPPORTUNITY: 'amber',
    WON: 'success',
    LOST: 'danger',
    NOT_QUALIFIED: 'danger',
  }
  return <StatusBadge variant={map[status] ?? 'default'}>{status.replace('_', ' ')}</StatusBadge>
}
