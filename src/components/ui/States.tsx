import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  steps?: Array<{ label: string; progress: number; active: boolean; done: boolean }>
}

export function LoadingState({ message = 'Loading...', steps }: LoadingStateProps) {
  if (steps) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6">
        <div className="flex flex-col gap-3 w-64">
          {steps.map((step, i) => (
            <div key={i} className={`flex items-center gap-3 text-xs transition-all ${step.active ? 'text-text-primary' : step.done ? 'text-success' : 'text-text-muted'}`}>
              <div className="shrink-0">
                {step.done ? (
                  <div className="w-4 h-4 rounded-full bg-success/20 border border-success flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  </div>
                ) : step.active ? (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-bg-border" />
                )}
              </div>
              <span className={step.active ? 'text-amber-400 font-medium' : ''}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      <span className="text-xs text-text-muted">{message}</span>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {icon && <div className="text-text-muted opacity-40">{icon}</div>}
      <div className="text-sm font-medium text-text-secondary">{title}</div>
      {description && <div className="text-xs text-text-muted text-center max-w-xs">{description}</div>}
      {action && (
        <button onClick={action.onClick} className="btn-secondary mt-2">{action.label}</button>
      )}
    </div>
  )
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex gap-3 px-3 py-2.5 border-b border-bg-border">
      {[...Array(cols)].map((_, i) => (
        <div key={i} className={`h-3 bg-bg-border rounded animate-pulse ${i === 0 ? 'w-24' : 'flex-1'}`} />
      ))}
    </div>
  )
}

export function AIProgressSteps({ currentStep, steps }: { currentStep: string; steps: string[] }) {
  return (
    <div className="bg-bg-card border border-amber-500/20 rounded p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        AI ANALYSIS IN PROGRESS
      </div>
      {steps.map((step, i) => {
        const idx = steps.indexOf(currentStep)
        const done = i < idx
        const active = step === currentStep
        return (
          <div key={i} className={`flex items-center gap-2 text-xs transition-all ${active ? 'text-amber-400 font-medium' : done ? 'text-success' : 'text-text-muted'}`}>
            {done ? '✓' : active ? '›' : '○'} {step}
          </div>
        )
      })}
    </div>
  )
}
