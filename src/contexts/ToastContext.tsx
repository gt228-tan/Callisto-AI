import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (type: ToastType, title: string, message?: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, title, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
  error:   <XCircle    className="w-4 h-4 text-rose-400 shrink-0"   />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
  info:    <Info       className="w-4 h-4 text-sky-400 shrink-0"     />,
}

const badgeStyles = {
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  error:   'bg-rose-500/15 text-rose-300 border-rose-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  info:    'bg-sky-500/15 text-sky-300 border-sky-500/30',
}

const borderColors = {
  success: 'border-emerald-500/40 shadow-emerald-500/10',
  error:   'border-rose-500/40 shadow-rose-500/10',
  warning: 'border-amber-500/40 shadow-amber-500/10',
  info:    'border-sky-500/40 shadow-sky-500/10',
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="toast-container" id="activity-alert-bar" role="region" aria-label="Activity Alerts">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast ${borderColors[toast.type]} flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-xl bg-bg-panel/95 shadow-2xl transition-all duration-300 animate-slide-in-left`}
        >
          <div className="mt-0.5">
            {icons[toast.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-3xs uppercase font-mono font-bold px-1.5 py-0.2 rounded border ${badgeStyles[toast.type]}`}>
                {toast.type === 'success' ? 'ACTIVITY COMPLETE' : toast.type === 'warning' ? 'SYSTEM ALERT' : toast.type === 'error' ? 'ALERT ERROR' : 'TELEMETRY'}
              </span>
              <span className="text-3xs font-mono text-text-muted">Just now</span>
            </div>
            <div className="font-semibold text-xs text-text-primary leading-tight">{toast.title}</div>
            {toast.message && (
              <div className="text-2xs text-text-secondary mt-1 leading-relaxed">
                {toast.message}
              </div>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-bg-hover transition-colors shrink-0 ml-1"
            title="Dismiss alert"
            aria-label="Dismiss alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
