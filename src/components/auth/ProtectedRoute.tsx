import React from 'react'
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAudit } from '@/contexts/AuditContext'
import { type UserRole, ROLE_PRIVILEGES } from '@/lib/security'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole = 'ADMIN' }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()
  const { logAction } = useAudit()
  const navigate = useNavigate()

  if (!isAuthenticated || !user) {
    return null
  }

  // Check if role satisfies requiredRole
  const hasAccess = requiredRole === 'ADMIN' ? user.role === 'ADMIN' : true

  if (!hasAccess) {
    // Record unauthorized access attempt in audit log
    logAction({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: 'UNAUTHORIZED_ACCESS_BLOCKED',
      resource: `Protected Route (${window.location.pathname})`,
      status: 'BLOCKED',
      details: `Role ${user.role} attempted to access route requiring ${requiredRole}. Access Denied.`,
      ip: user.ip,
    }).catch(() => {})

    return (
      <div className="flex-1 min-h-[calc(100vh-120px)] flex items-center justify-center p-6 select-none">
        <div className="panel max-w-md w-full p-6 border border-danger/40 bg-bg-card shadow-2xl text-center">
          <div className="w-12 h-12 rounded-full bg-danger-dim border border-danger/40 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6 text-danger-bright" />
          </div>

          <div className="inline-block px-2.5 py-0.5 rounded bg-danger-dim border border-danger/40 text-danger-bright text-2xs font-mono font-bold mb-2">
            HTTP 403 — FORBIDDEN
          </div>

          <h2 className="text-base font-bold text-text-primary mb-2">
            Insufficient Role Privileges
          </h2>

          <p className="text-xs text-text-secondary mb-4 leading-relaxed">
            Your current security clearance (<strong className="text-text-primary">{ROLE_PRIVILEGES[user.role].title}</strong>) does not have authorization to view this administrative terminal.
          </p>

          <div className="p-3 rounded bg-bg-panel border border-bg-border text-2xs text-text-muted mb-5 text-left font-mono">
            <div><span className="text-text-secondary">Required Role:</span> {requiredRole}</div>
            <div><span className="text-text-secondary">Current Role:</span> {user.role}</div>
            <div><span className="text-text-secondary">Audit Event:</span> BLOCKED & LOGGED TO TAMPER CHAIN</div>
          </div>

          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={() => navigate('/')}
              className="btn-primary text-xs gap-1.5 py-2 px-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
