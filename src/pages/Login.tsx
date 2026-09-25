import { useState, useEffect } from 'react'
import {
  Shield, KeyRound, Lock, Sparkles, CheckCircle, AlertTriangle,
  ArrowRight, RefreshCw, Smartphone, Eye, EyeOff, Check, AlertCircle,
  FileCheck, Globe, Activity, Terminal
} from 'lucide-react'
import { useAuth, PRESET_USERS } from '@/contexts/AuthContext'
import { ROLE_PRIVILEGES, type UserRole, formatISTDateTime } from '@/lib/security'
import { useToast } from '@/contexts/ToastContext'

export function Login() {
  const {
    login,
    verifyOtp,
    isMfaStep,
    pendingUser,
    demoOtp,
    resendOtp,
    autoLogoutReason,
    clearAutoLogoutReason,
  } = useAuth()
  const { showToast } = useToast()

  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN')
  const [email, setEmail] = useState(PRESET_USERS.ADMIN.user.email)
  const [password, setPassword] = useState(PRESET_USERS.ADMIN.pass)
  const [showPassword, setShowPassword] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(45)

  // Sync email & password when selectedRole changes
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role)
    setEmail(PRESET_USERS[role].user.email)
    setPassword(PRESET_USERS[role].pass)
    setErrorMsg(null)
  }

  // Handle Step 1 Login
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsLoading(true)

    try {
      const result = await login(email, password, selectedRole)
      if (!result.success) {
        setErrorMsg(result.error || 'Authentication failed. Please verify credentials.')
      } else if (result.requiresMfa) {
        showToast('info', 'MFA Code Dispatched', `A 6-digit verification code has been dispatched. (Demo Code: ${demoOtp})`)
      } else {
        showToast('success', 'Access Granted', `Welcome back! Signed in with ${selectedRole} privileges.`)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unexpected login error')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Step 2 MFA Verification
  const handleSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsLoading(true)

    try {
      const result = await verifyOtp(otpInput)
      if (!result.success) {
        setErrorMsg(result.error || 'Invalid OTP code')
      } else {
        showToast('success', 'MFA Verified', `Cryptographic session initialized for ${pendingUser?.name}. TLS 1.3 Active.`)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification error')
    } finally {
      setIsLoading(false)
    }
  }

  // Resend cooldown timer
  useEffect(() => {
    if (!isMfaStep || resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [isMfaStep, resendCooldown])

  const handleResend = () => {
    if (resendCooldown > 0) return
    resendOtp()
    setResendCooldown(45)
    showToast('info', 'New OTP Generated', `New verification code generated: ${demoOtp}`)
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="h-14 border-b border-bg-border/60 bg-bg-secondary/70 backdrop-blur px-4 sm:px-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-text-primary tracking-wide">Callisto AI</div>
            <div className="text-3xs text-text-muted">Zero-Trust Sales & Voice Intelligence Platform</div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-2xs text-text-muted">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-bg-panel border border-bg-border">
            <Lock className="w-3 h-3 text-success" />
            <span className="font-mono text-text-secondary">TLS 1.3 / AES-256</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-bg-panel border border-bg-border">
            <Activity className="w-3 h-3 text-amber-400" />
            <span className="font-mono text-text-secondary">IST Sync: {formatISTDateTime(new Date()).split(',')[1]?.trim()}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Role & Privilege Level Matrix */}
          <div className="lg:col-span-5 flex flex-col justify-between panel border border-bg-border bg-bg-secondary/60 p-5 rounded-xl shadow-xl">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Shield className="w-4 h-4" /> Role-Based Access Control (RBAC)
              </div>
              <h2 className="text-sm font-bold text-text-primary mb-1">Select Security Clearance</h2>
              <p className="text-2xs text-text-muted mb-4 leading-relaxed">
                Callisto AI enforces zero-trust permission boundaries at both UI and API levels. Select a role below to explore privilege variations:
              </p>

              {/* Role Cards */}
              <div className="space-y-2">
                {(Object.keys(ROLE_PRIVILEGES) as UserRole[]).map(roleKey => {
                  const priv = ROLE_PRIVILEGES[roleKey]
                  const isSelected = selectedRole === roleKey
                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => handleSelectRole(roleKey)}
                      disabled={isMfaStep}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-amber-500/60 bg-amber-500/10 shadow-md ring-1 ring-amber-500/30'
                          : 'border-bg-border bg-bg-card/60 hover:bg-bg-hover hover:border-bg-border/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            roleKey === 'ADMIN' ? 'bg-blue-400' :
                            roleKey === 'MANAGER' ? 'bg-amber-400' :
                            roleKey === 'SALES_AGENT' ? 'bg-emerald-400' : 'bg-neutral-400'
                          }`} />
                          <span className="font-bold text-text-primary">{priv.title.split('/')[0].trim()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {priv.mfaRequired && (
                            <span className="text-3xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                              MFA Required
                            </span>
                          )}
                          <span className="text-3xs font-mono text-text-muted">Lvl {priv.level}</span>
                        </div>
                      </div>

                      <p className="text-3xs text-text-secondary leading-normal">
                        {priv.description}
                      </p>

                      <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-bg-border/40 text-3xs text-text-muted flex-wrap">
                        <span className={priv.canAccessAdmin ? 'text-success font-medium' : 'text-text-muted line-through'}>Admin Panel</span>
                        <span>•</span>
                        <span className={priv.canSyncCrm ? 'text-success font-medium' : 'text-text-muted line-through'}>CRM Sync</span>
                        <span>•</span>
                        <span className={priv.canDialVoiceAgent ? 'text-success font-medium' : 'text-text-muted line-through'}>AI Voice SDR</span>
                        <span>•</span>
                        <span className={priv.canExportUnmasked ? 'text-blue-400 font-medium' : 'text-text-muted'}>Masked CSV</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Security Assurance Footnote */}
            <div className="mt-4 pt-3 border-t border-bg-border/60 text-3xs text-text-muted flex items-center justify-between">
              <span className="flex items-center gap-1 text-success">
                <CheckCircle className="w-3 h-3" /> Append-Only Audit Log
              </span>
              <span>24/7 Shift Terminal</span>
            </div>
          </div>

          {/* Right Column: Authentication Form / MFA Challenge */}
          <div className="lg:col-span-7 panel border border-bg-border bg-bg-card p-6 sm:p-8 rounded-xl shadow-2xl flex flex-col justify-center">
            
            {/* Auto-logout notification banner if triggered by inactivity */}
            {autoLogoutReason && (
              <div className="mb-5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div className="flex-1">
                  <div className="font-semibold">Terminal Inactivity Auto-Logout</div>
                  <div className="text-2xs text-amber-200/80 mt-0.5">{autoLogoutReason}</div>
                </div>
                <button
                  onClick={clearAutoLogoutReason}
                  className="text-text-muted hover:text-text-primary text-2xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-5 p-3 rounded-lg bg-danger-dim border border-danger/40 text-xs text-danger-bright flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!isMfaStep ? (
              /* ================= STEP 1: CREDENTIALS ================= */
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-2xs font-mono text-amber-400 mb-1">
                    <KeyRound className="w-3.5 h-3.5" /> STEP 1 OF 2 — IDENTITY VERIFICATION
                  </div>
                  <h1 className="text-xl font-bold text-text-primary">Sign in to Enterprise Terminal</h1>
                  <p className="text-xs text-text-muted mt-1">
                    Authenticating as <span className="text-amber-400 font-semibold">{ROLE_PRIVILEGES[selectedRole].title}</span>
                  </p>
                </div>

                <form onSubmit={handleSubmitLogin} className="space-y-4">
                  <div>
                    <label className="block text-2xs uppercase tracking-wider text-text-secondary font-medium mb-1.5">
                      Enterprise Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="input-field w-full text-xs font-mono py-2.5"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-2xs uppercase tracking-wider text-text-secondary font-medium">
                        Terminal Security Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-3xs text-text-muted hover:text-text-primary flex items-center gap-1"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="input-field w-full text-xs font-mono py-2.5"
                    />
                  </div>

                  {/* High Impact Role MFA Notice */}
                  {ROLE_PRIVILEGES[selectedRole].mfaRequired && (
                    <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20 text-3xs text-blue-300 flex items-start gap-2">
                      <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Highest-Impact Security Policy:</strong> {selectedRole} login triggers an OTP-based Multi-Factor Authentication challenge.
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full py-2.5 text-xs font-bold gap-2 justify-center shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying Credentials...
                      </>
                    ) : (
                      <>
                        Continue to {ROLE_PRIVILEGES[selectedRole].mfaRequired ? 'MFA Challenge' : 'Dashboard'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Auto-Fill Helper for Evaluation */}
                <div className="mt-6 pt-4 border-t border-bg-border/60">
                  <div className="text-3xs uppercase tracking-wider text-text-muted font-medium mb-2">
                    Quick Preset Credentials for Testing:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(Object.keys(PRESET_USERS) as UserRole[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleSelectRole(r)}
                        className={`text-3xs py-1.5 px-2 rounded border font-mono transition-all text-center ${
                          selectedRole === r
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                            : 'border-bg-border hover:bg-bg-hover text-text-muted'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ================= STEP 2: OTP-BASED MFA ================= */
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-2xs font-mono text-emerald-400 mb-1">
                    <Smartphone className="w-3.5 h-3.5" /> STEP 2 OF 2 — MULTI-FACTOR AUTHENTICATION (MFA)
                  </div>
                  <h1 className="text-xl font-bold text-text-primary">Enter 6-Digit Verification OTP</h1>
                  <p className="text-xs text-text-muted mt-1">
                    An OTP challenge was generated for <span className="text-text-primary font-medium">{pendingUser?.email}</span> ({pendingUser?.role})
                  </p>
                </div>

                {/* Interactive Demo Code Helper */}
                <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-2xs text-emerald-400/80 font-mono uppercase tracking-wider">Simulated Authenticator Token:</div>
                      <div className="text-sm font-mono font-bold tracking-widest text-emerald-300">{demoOtp}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpInput(demoOtp)}
                    className="text-3xs px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 font-semibold transition-colors"
                  >
                    Fill Demo OTP
                  </button>
                </div>

                <form onSubmit={handleSubmitOtp} className="space-y-4">
                  <div>
                    <label className="block text-2xs uppercase tracking-wider text-text-secondary font-medium mb-1.5">
                      6-Digit Security Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="input-field w-full text-center text-xl font-mono tracking-widest py-3 font-bold border-amber-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpInput.length < 6}
                    className="btn-primary w-full py-2.5 text-xs font-bold gap-2 justify-center shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying Cryptographic Token...
                      </>
                    ) : (
                      <>
                        Verify OTP & Launch Session <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-2xs text-text-muted">
                    <button
                      type="button"
                      onClick={() => handleSelectRole(selectedRole)}
                      className="hover:text-text-primary transition-colors"
                    >
                      ← Back to credential login
                    </button>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className={`${resendCooldown > 0 ? 'text-text-muted cursor-not-allowed' : 'text-amber-400 hover:underline'}`}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer Audit Guarantee */}
      <footer className="h-10 border-t border-bg-border/40 bg-bg-secondary/40 px-4 sm:px-8 flex items-center justify-between text-3xs text-text-muted z-10">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-amber-400" />
          <span>Callisto AI Enterprise Security Engine · ISO 27001 & SOC-2 Compliant</span>
        </div>
        <div>
          Session Inactivity Timeout: <span className="font-mono text-text-secondary">15 Minutes (Active)</span>
        </div>
      </footer>
    </div>
  )
}
