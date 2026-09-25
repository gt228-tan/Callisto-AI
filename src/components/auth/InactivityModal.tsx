import { AlertTriangle, Clock, RefreshCw, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function InactivityModal() {
  const { inactivityWarning, remainingSeconds, keepSessionAlive, logout } = useAuth()

  if (!inactivityWarning) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="panel max-w-sm w-full p-6 border border-amber-500/50 bg-bg-card shadow-2xl rounded-xl text-center ring-2 ring-amber-500/20">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Clock className="w-6 h-6 text-amber-400" />
        </div>

        <div className="inline-block px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-2xs font-mono font-bold mb-2">
          24/7 SHIFT INACTIVITY ALERT
        </div>

        <h3 className="text-base font-bold text-text-primary mb-2">
          Session Expiring Soon
        </h3>

        <p className="text-xs text-text-secondary mb-4 leading-relaxed">
          Due to 24/7 shift terminal security compliance, idle sessions are automatically locked to prevent unauthorized physical terminal access.
        </p>

        <div className="my-4 p-3 rounded-lg bg-bg-panel border border-bg-border flex items-center justify-center gap-2">
          <span className="text-2xs text-text-muted">Auto-logout in:</span>
          <span className="text-lg font-mono font-bold text-amber-400 tracking-wider">
            {remainingSeconds}s
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 mt-5">
          <button
            onClick={keepSessionAlive}
            className="btn-primary w-full py-2.5 text-xs font-bold gap-2 justify-center"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Keep Session Active
          </button>
          <button
            onClick={() => logout('User confirmed termination from inactivity prompt')}
            className="btn-secondary w-full py-2.5 text-xs gap-1.5 justify-center text-danger-bright hover:bg-danger-dim border-danger/30"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
