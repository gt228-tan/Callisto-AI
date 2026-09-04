interface IntentScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function IntentScore({ score, size = 'md', showLabel = true }: IntentScoreProps) {
  const color = score >= 80 ? '#f59e0b' : score >= 65 ? '#3b82f6' : '#6b7280'
  const bgColor = score >= 80 ? 'bg-warning/10' : score >= 65 ? 'bg-info/10' : 'bg-bg-border'
  const textColor = score >= 80 ? 'text-warning' : score >= 65 ? 'text-info-bright' : 'text-text-muted'
  const sizes = { sm: 32, md: 40, lg: 52 }
  const r = sizes[size] / 2 - 4
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const dim = sizes[size]

  return (
    <div className="flex items-center gap-1.5">
      <div className={`relative flex items-center justify-center rounded-full ${bgColor}`} style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="absolute inset-0 -rotate-90" viewBox={`0 0 ${dim} ${dim}`}>
          <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke="#252b38" strokeWidth="2.5" />
          <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <span className={`text-2xs font-bold ${textColor} z-10`}>{score}</span>
      </div>
      {showLabel && (
        <span className={`text-2xs font-semibold ${textColor}`}>
          {score >= 80 ? 'HIGH' : score >= 65 ? 'MED' : 'LOW'}
        </span>
      )}
    </div>
  )
}

interface ScoreBarProps {
  label: string
  value: number
  color?: 'amber' | 'green' | 'blue' | 'red'
}

export function ScoreBar({ label, value, color = 'amber' }: ScoreBarProps) {
  const fillClass = color === 'amber' ? 'progress-fill-amber' : color === 'green' ? 'progress-fill-green' : color === 'blue' ? 'progress-fill-blue' : 'progress-fill-red'
  const textClass = color === 'amber' ? 'text-amber-400' : color === 'green' ? 'text-success' : color === 'blue' ? 'text-info-bright' : 'text-danger-bright'
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xs text-text-secondary w-28 shrink-0">{label}</span>
      <div className="flex-1 progress-track">
        <div className={fillClass} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-2xs font-mono font-semibold ${textClass} w-6 text-right`}>{value}</span>
    </div>
  )
}
