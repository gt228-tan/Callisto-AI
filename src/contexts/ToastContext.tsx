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
  success: <CheckCircle className="w-4 h-4 text-success" />,
  error:   <XCircle    className="w-4 h-4 text-danger"   />,
  warning: <AlertTriangle className="w-4 h-4 text-warning" />,
  info:    <Info       className="w-4 h-4 text-info"     />,
}

const borderColors = {
  success: 'border-success/40',
  error:   'border-danger/40',
  warning: 'border-warning/40',
  info:    'border-info/40',
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${borderColors[toast.type]}`}>
          {icons[toast.type]}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-text-primary">{toast.title}</div>
            {toast.message && <div className="text-text-secondary mt-0.5">{toast.message}</div>}
          </div>
          <button onClick={() => removeToast(toast.id)} className="text-text-muted hover:text-text-primary ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
