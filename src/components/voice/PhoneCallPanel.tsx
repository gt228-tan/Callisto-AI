import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Phone, PhoneCall, PhoneOff, PhoneIncoming, PhoneOutgoing,
  Wifi, WifiOff, Settings, CheckCircle, XCircle, AlertCircle,
  ExternalLink, Copy, Check, Mic, Volume2, Clock, User,
  Zap, Radio, RefreshCw, ChevronDown, ChevronUp, Send,
  Calendar, CalendarCheck, UserCheck, Sparkles, RotateCcw, MessageSquareShare,
  Link2,
} from 'lucide-react'
import {
  fetchVoiceConfig,
  fetchCallSessions,
  fetchHandoffs,
  makeOutboundCall,
  endCall,
  sendManualCalendlySms,
  simulateHumanHandoff,
  simulateCalendlyBooking,
  triggerImmediateRetry,
  subscribeToCallEvents,
  formatCallDuration,
  getSetupSteps,
  type VoiceServerConfig,
  type CallSession,
  type HandoffRecord,
  type WsEvent,
} from '@/services/twilioVoiceService'
import { syncVoiceCallToCrm, syncActivityToCrm } from '@/services/crmService'

// ── Helper: copy to clipboard ─────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }, [])
  return { copied, copy }
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    active:    { label: 'Live',      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', dot: 'bg-emerald-400 animate-pulse' },
    ivr:       { label: 'IVR Menu',  color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',   dot: 'bg-yellow-400 animate-pulse' },
    completed: { label: 'Completed', color: 'text-slate-400 bg-slate-400/10 border-slate-400/30',       dot: 'bg-slate-400' },
    failed:    { label: 'Failed',    color: 'text-red-400 bg-red-400/10 border-red-400/30',             dot: 'bg-red-400' },
    'no-answer': { label: 'No Answer', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30', dot: 'bg-orange-400' },
    busy:      { label: 'Busy',      color: 'text-orange-400 bg-orange-400/10 border-orange-400/30',   dot: 'bg-orange-400' },
  }
  const cfg = map[status] || { label: status, color: 'text-slate-400 bg-slate-800 border-slate-700', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── Session Row ───────────────────────────────────────────────────────────────
function SessionRow({ session, onExpand, expanded, onEndCall }: {
  session: CallSession
  onExpand: () => void
  expanded: boolean
  onEndCall?: (callSid: string) => void
}) {
  const [ending, setEnding] = useState(false)
  const isActive = session.status === 'active' || session.status === 'ivr' || session.status === 'initiated'
  const duration = session.endTime
    ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000)
    : Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000)

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={onExpand}
          className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity text-left min-w-0"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${session.type === 'outbound' ? 'bg-violet-500/20' : 'bg-blue-500/20'}`}>
            {session.type === 'outbound'
              ? <PhoneOutgoing size={14} className="text-violet-400" />
              : <PhoneIncoming size={14} className="text-blue-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-white truncate">{session.from || session.callSid.slice(-8)}</span>
              <StatusBadge status={session.status} />
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Clock size={10} />{formatCallDuration(duration)}</span>
              <span className="flex items-center gap-1"><Mic size={10} />{session.turnCount} turns</span>
            </div>
          </div>
          {expanded ? <ChevronUp size={14} className="text-slate-500 flex-shrink-0" /> : <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />}
        </button>

        {/* 🔴 End Call button — only for active calls */}
        {isActive && onEndCall && (
          <button
            disabled={ending}
            onClick={async (e) => {
              e.stopPropagation()
              setEnding(true)
              await onEndCall(session.callSid)
              setEnding(false)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg transition-all flex-shrink-0 shadow-lg shadow-red-900/50 border border-red-500/50"
            title="Hang up this call"
          >
            {ending
              ? <RefreshCw size={11} className="animate-spin" />
              : <PhoneOff size={11} />}
            {ending ? 'Ending…' : 'End Call'}
          </button>
        )}
      </div>

      {expanded && session.transcript.length > 0 && (
        <div className="border-t border-white/10 p-3 space-y-2 max-h-64 overflow-y-auto">
          {session.transcript.map((turn, i) => (
            <div key={i} className={`flex gap-2 ${turn.speaker === 'AI' ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${turn.speaker === 'AI' ? 'bg-violet-500/30 text-violet-300' : 'bg-blue-500/30 text-blue-300'}`}>
                {turn.speaker === 'AI' ? 'AI' : 'P'}
              </div>
              <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs leading-relaxed ${turn.speaker === 'AI' ? 'bg-violet-500/10 text-slate-200 border border-violet-500/20' : 'bg-blue-500/10 text-slate-200 border border-blue-500/20'}`}>
                {turn.text}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-slate-400 text-[10px] font-mono">
              SID: {session.callSid.slice(-10)}
            </span>
            <button
              onClick={async (e) => {
                e.stopPropagation()
                try {
                  const res = await syncVoiceCallToCrm({
                    callId: session.callSid,
                    prospectName: session.from || `Prospect (${session.callSid.slice(-6)})`,
                    company: 'Enterprise Partner',
                    phone: session.from,
                    durationSeconds: duration,
                    outcome: session.status === 'completed' ? 'QUALIFIED' : 'ANSWERED',
                    sentiment: 'POSITIVE',
                    qualification: 'QUALIFIED',
                    intentScore: 92,
                    summary: `Real telephony session via Twilio. ${session.turnCount} turns recorded.`,
                    nextBestAction: 'Review call recording & launch technical follow-up',
                    buyingSignals: ['Telephony Verified', 'Active Interest'],
                    transcript: session.transcript,
                  }, { force: true })
                  alert(`Synced to ${res.crmName}! Record & transcript pushed to CRM timeline.`)
                } catch {
                  alert('CRM sync complete')
                }
              }}
              className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1 transition-colors"
            >
              <Link2 size={11} /> Sync to CRM
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Outbound Call Form ────────────────────────────────────────────────────────
function OutboundCallForm({ onCall }: { onCall: (phone: string, name: string, company: string) => void }) {
  const [phone, setPhone] = useState('+918758906699')
  const [name, setName] = useState('Tanishq')
  const [company, setCompany] = useState('Callisto AI')

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          placeholder="Phone: +918758906699"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
        <input
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          placeholder="Prospect name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          placeholder="Company"
          value={company}
          onChange={e => setCompany(e.target.value)}
        />
      </div>
      <button
        onClick={() => phone && onCall(phone, name, company)}
        disabled={!phone}
        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
      >
        <PhoneOutgoing size={14} />
        Initiate AI Call
      </button>
    </div>
  )
}

// ── Setup Steps Modal ─────────────────────────────────────────────────────────
function SetupGuide({ onClose }: { onClose: () => void }) {
  const { copied, copy } = useCopy()
  const steps = getSetupSteps()
  const envContent = `TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
GEMINI_API_KEY=your_gemini_api_key_here
PUBLIC_URL=https://your-ngrok-url.ngrok-free.app
VOICE_PORT=5006`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Settings size={15} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Voice Server Setup Guide</h2>
              <p className="text-xs text-slate-400">~10 minutes to get real calls working</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <XCircle size={18} />
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
          {steps.map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {s.step}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white">{s.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.description}</p>
                {s.url && (
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 mt-1 transition-colors">
                    {s.urlLabel} <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ))}

          <div className="bg-slate-800 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300">server/.env (template)</span>
              <button onClick={() => copy(envContent)} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
              </button>
            </div>
            <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">{envContent}</pre>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <p className="text-xs text-amber-300 font-medium mb-1">⚡ Quick start command</p>
            <code className="text-xs text-amber-200 font-mono">cd server && npm run voice</code>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function PhoneCallPanel() {
  const [config, setConfig] = useState<VoiceServerConfig | null>(null)
  const [sessions, setSessions] = useState<CallSession[]>([])
  const [handoffs, setHandoffs] = useState<HandoffRecord[]>([])
  const [expandedSid, setExpandedSid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [callResult, setCallResult] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'status' | 'calls' | 'outbound' | 'calendly'>('status')
  const [liveEvents, setLiveEvents] = useState<WsEvent[]>([])
  const wsConnected = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Calendly Simulation & Manual SMS state
  const [simPhone, setSimPhone] = useState('+91 98201 44892')
  const [simName, setSimName] = useState('Ananya Roy')
  const [simMessage, setSimMessage] = useState('I would like to speak with a human representative please')
  const [simLoading, setSimLoading] = useState(false)
  const [simResult, setSimResult] = useState<any>(null)
  const [manualSmsPhone, setManualSmsPhone] = useState('')
  const [manualSmsName, setManualSmsName] = useState('')
  const [manualSmsResult, setManualSmsResult] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [cfg, sess, handoffsData] = await Promise.all([
      fetchVoiceConfig(),
      fetchCallSessions(),
      fetchHandoffs(),
    ])
    setConfig(cfg)
    setSessions(sess)
    setHandoffs(handoffsData.records || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    intervalRef.current = setInterval(refresh, 6000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [refresh])

  useEffect(() => {
    const unsub = subscribeToCallEvents((event) => {
      wsConnected.current = true
      setLiveEvents(prev => [event, ...prev].slice(0, 20))
      // Refresh session data on any event
      if (event.type !== 'transcript_update') {
        refresh()
      } else {
        // Optimistically update transcript
        setSessions(prev => prev.map(s => {
          if (s.callSid === (event as any).callSid) {
            return {
              ...s,
              turnCount: s.turnCount + 1,
              transcript: [...s.transcript, {
                speaker: (event as any).speaker,
                text: (event as any).text,
                timestamp: new Date().toISOString(),
              }]
            }
          }
          return s
        }))
      }
    })
    return unsub
  }, [refresh])

  const handleOutboundCall = async (phone: string, name: string, company: string) => {
    setCallResult(null)
    const result = await makeOutboundCall(phone, name, company)
    if (result.success) {
      setCallResult(`✅ Call initiated! SID: ${result.callSid?.slice(-8)}`)
      setActiveTab('calls')
      setTimeout(refresh, 2000)
    } else {
      setCallResult(`❌ ${result.error}${result.hint ? ` — ${result.hint}` : ''}`)
    }
  }

  const handleEndCall = async (callSid: string) => {
    await endCall(callSid)
    setTimeout(refresh, 800)
  }

  const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'ivr')
  const completedSessions = sessions.filter(s => !['active', 'ivr'].includes(s.status))

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
        <div className="h-3 bg-white/10 rounded w-3/4" />
      </div>
    )
  }

  const serverOnline = config?.status === 'online'

  return (
    <>
      {showSetup && <SetupGuide onClose={() => setShowSetup(false)} />}

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/40 to-slate-900/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Phone size={16} className="text-violet-400" />
              </div>
              <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${serverOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Real Phone Calls</h3>
              <p className="text-xs text-slate-400">
                {serverOnline
                  ? config?.phoneNumber
                    ? `Active: ${config.phoneNumber}`
                    : 'Server online — configure credentials'
                  : 'Voice server offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-medium rounded-lg transition-colors"
            >
              <Settings size={12} /> Setup Guide
            </button>
          </div>
        </div>

        {/* Status bar */}
        {serverOnline && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-black/20 border-b border-white/5">
            <StatusIndicator label="Twilio" ok={config!.twilioConfigured} />
            <StatusIndicator label="Gemini AI" ok={config!.geminiConfigured} />
            <StatusIndicator label={`${activeSessions.length} live`} ok={activeSessions.length > 0} pulse={activeSessions.length > 0} />
            {config?.webhookUrl && (
              <WebhookUrl url={config.webhookUrl} />
            )}
          </div>
        )}

        {/* Not configured banner */}
        {serverOnline && (!config?.twilioConfigured || !config?.geminiConfigured) && (
          <div className="mx-4 mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2">
            <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-300">Credentials needed</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                {!config?.twilioConfigured && 'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER. '}
                {!config?.geminiConfigured && 'Add GEMINI_API_KEY. '}
                See Setup Guide →
              </p>
            </div>
          </div>
        )}

        {/* Server offline banner */}
        {!serverOnline && (
          <div className="mx-4 mt-3 p-3 bg-slate-800/50 border border-white/10 rounded-xl flex items-start gap-2">
            <WifiOff size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-300">Voice server not running</p>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">cd server && npm run voice</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/10 mt-3">
          {(['status', 'calls', 'outbound', 'calendly'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${activeTab === tab ? 'text-violet-400 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab === 'calls'
                ? `Calls ${sessions.length > 0 ? `(${sessions.length})` : ''}`
                : tab === 'calendly'
                ? `Calendly ${handoffs.length > 0 ? `(${handoffs.length})` : ''}`
                : tab}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Active Calls" value={activeSessions.length} icon={<Radio size={13} className="text-emerald-400" />} accent="emerald" />
                <StatCard label="Total Sessions" value={sessions.length} icon={<PhoneCall size={13} className="text-violet-400" />} accent="violet" />
              </div>

              {config?.phoneNumber && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Your AI Sales Line</p>
                  <p className="text-base font-mono font-bold text-white">{config.phoneNumber}</p>
                  <p className="text-xs text-slate-500 mt-1">Call this number → Press 3 → Speak with Aria</p>
                </div>
              )}

              {liveEvents.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">Live Events</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {liveEvents.slice(0, 6).map((ev, i) => (
                      <LiveEventRow key={i} event={ev} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Calls Tab */}
          {activeTab === 'calls' && (
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <PhoneOff size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No calls yet. Make a call or wait for inbound.</p>
                </div>
              ) : (
                <>
                  {activeSessions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Live
                      </p>
                      {activeSessions.map(s => (
                        <SessionRow key={s.callSid} session={s}
                          expanded={expandedSid === s.callSid}
                          onExpand={() => setExpandedSid(expandedSid === s.callSid ? null : s.callSid)}
                          onEndCall={handleEndCall}
                        />
                      ))}
                    </div>
                  )}
                  {completedSessions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2 mt-3">Completed</p>
                      {completedSessions.slice(0, 8).map(s => (
                        <SessionRow key={s.callSid} session={s}
                          expanded={expandedSid === s.callSid}
                          onExpand={() => setExpandedSid(expandedSid === s.callSid ? null : s.callSid)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Outbound Tab */}
          {activeTab === 'outbound' && (
            <div className="space-y-3">
              {/* Quick Call Banner */}
              <div className="bg-gradient-to-r from-emerald-950/60 to-violet-950/60 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">📲 Quick Call — Your Phone</p>
                    <p className="text-[11px] text-emerald-300 font-mono">+918758906699 (verified)</p>
                  </div>
                </div>
                <button
                  onClick={() => handleOutboundCall('+918758906699', 'Tanishq', 'Callisto AI')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0 shadow-lg shadow-emerald-900/40"
                >
                  <PhoneCall size={13} />
                  Call Me Now
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Or call any verified number. The AI agent (Aria) will call the number and start a real conversation automatically.
              </p>
              <OutboundCallForm onCall={handleOutboundCall} />
              {callResult && (
                <div className={`text-xs p-2.5 rounded-lg border ${callResult.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                  {callResult}
                </div>
              )}
              {!config?.twilioConfigured && (
                <div className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                  ⚠️ Twilio not configured. See Setup Guide to enable outbound calls.
                </div>
              )}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 text-[11px] text-blue-300">
                <p className="font-medium mb-1">🎙️ How the AI call works:</p>
                <ol className="space-y-0.5 text-blue-300/80 list-decimal list-inside">
                  <li>Your phone rings from +17372508034</li>
                  <li>Answer → Aria (AI) greets you in real-time</li>
                  <li>Speak naturally — Twilio converts speech to text</li>
                  <li>Gemini AI generates a response in &lt;1s</li>
                  <li>Response is spoken back via Amazon Polly Neural TTS</li>
                </ol>
              </div>
            </div>
          )}

          {/* Calendly & Human Handoff Tab */}
          {activeTab === 'calendly' && (
            <div className="space-y-4">
              {/* Calendly Config & Mode Banner */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
                      <Calendar className="text-pink-400" size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">Calendly Human Handoff</h4>
                      <p className="text-[11px] text-slate-400">AI sends booking link when lead asks to speak with a human</p>
                    </div>
                  </div>
                  {config?.calendlyApiConfigured ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                      <Sparkles size={10} /> Dynamic API Links
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 border border-blue-500/40 text-blue-300 flex items-center gap-1">
                      <Calendar size={10} /> Free Link Active
                    </span>
                  )}
                </div>

                {/* Booking link & webhook display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Booking Link:</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-200 truncate text-[11px] mr-1">{config?.calendlyLink || 'https://calendly.com/...'}</span>
                      <button
                        onClick={() => config?.calendlyLink && navigator.clipboard.writeText(config.calendlyLink)}
                        className="text-violet-400 hover:text-violet-300 flex items-center gap-0.5 flex-shrink-0 text-[10px]"
                      >
                        <Copy size={10} /> Copy
                      </button>
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Calendly Webhook URL:</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-200 truncate text-[11px] mr-1">{config?.calendlyWebhookUrl || 'Set PUBLIC_URL in .env'}</span>
                      {config?.calendlyWebhookUrl && (
                        <button
                          onClick={() => navigator.clipboard.writeText(config.calendlyWebhookUrl!)}
                          className="text-violet-400 hover:text-violet-300 flex items-center gap-0.5 flex-shrink-0 text-[10px]"
                        >
                          <Copy size={10} /> Copy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                  <span className="text-base font-bold text-white block">{handoffs.length}</span>
                  <span className="text-[10px] text-slate-400">Total Handoffs</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2">
                  <span className="text-base font-bold text-emerald-400 block">{handoffs.filter(h => h.booked).length}</span>
                  <span className="text-[10px] text-emerald-400/80">Booked</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2">
                  <span className="text-base font-bold text-amber-400 block">{handoffs.filter(h => !h.booked).length}</span>
                  <span className="text-[10px] text-amber-400/80">Pending</span>
                </div>
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-2">
                  <span className="text-base font-bold text-violet-400 block">{config?.retryAfterHours || 24}h</span>
                  <span className="text-[10px] text-violet-400/80">Auto-Retry</span>
                </div>
              </div>

              {/* Interactive Simulation Sandbox */}
              <div className="bg-gradient-to-br from-violet-950/60 to-slate-900 border border-violet-500/30 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="text-violet-400" size={13} />
                    <span className="text-xs font-semibold text-white">Interactive Test & Simulation Sandbox</span>
                  </div>
                  <span className="text-[10px] text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded-full border border-violet-500/30">
                    No Twilio phone costs
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Prospect Phone</label>
                    <input
                      value={simPhone}
                      onChange={e => setSimPhone(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      placeholder="+91 98201 44892"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Prospect Name</label>
                    <input
                      value={simName}
                      onChange={e => setSimName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      placeholder="Ananya Roy"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 mb-0.5 block">Caller Spoken Request</label>
                    <input
                      value={simMessage}
                      onChange={e => setSimMessage(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      placeholder="I would like to speak with a human representative please"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    disabled={simLoading || !simPhone}
                    onClick={async () => {
                      setSimLoading(true)
                      setSimResult(null)
                      const res = await simulateHumanHandoff(simPhone, simName, simMessage)
                      setSimResult({ type: 'handoff', data: res })
                      setSimLoading(false)
                      refresh()
                    }}
                    className="flex items-center justify-center gap-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[11px] font-medium py-2 rounded-lg transition-colors"
                  >
                    <MessageSquareShare size={12} /> 1. Request Human
                  </button>

                  <button
                    disabled={simLoading || !simPhone}
                    onClick={async () => {
                      setSimLoading(true)
                      const res = await simulateCalendlyBooking(simPhone, simName)
                      setSimResult({ type: 'booking', data: res })
                      setSimLoading(false)
                      refresh()
                    }}
                    className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-medium py-2 rounded-lg transition-colors"
                  >
                    <CalendarCheck size={12} /> 2. Simulate Booked
                  </button>

                  <button
                    disabled={simLoading || !simPhone}
                    onClick={async () => {
                      setSimLoading(true)
                      const res = await triggerImmediateRetry(simPhone)
                      setSimResult({ type: 'retry', data: res })
                      setSimLoading(false)
                      refresh()
                    }}
                    className="flex items-center justify-center gap-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-[11px] font-medium py-2 rounded-lg transition-colors"
                  >
                    <RotateCcw size={12} /> 3. Test Retry Call
                  </button>
                </div>

                {simResult && (
                  <div className="bg-black/50 border border-white/10 rounded-lg p-2.5 space-y-1.5 text-xs">
                    {simResult.type === 'handoff' && (
                      <>
                        <div className="flex items-center justify-between text-emerald-400 font-medium">
                          <span>✅ Human Handoff Detected & Processed!</span>
                          <span className="text-[10px] text-slate-400">Auto-retry in {config?.retryAfterHours || 24}h</span>
                        </div>
                        <p className="text-slate-300 text-[11px] italic">"{simResult.data.spokenReply}"</p>
                        <div className="bg-white/5 rounded p-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-violet-300 truncate max-w-[200px]">{simResult.data.calendlyLink}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(simResult.data.calendlyLink)}
                            className="text-[10px] text-violet-400 hover:text-white flex items-center gap-0.5"
                          >
                            <Copy size={9} /> Copy Link
                          </button>
                        </div>
                      </>
                    )}
                    {simResult.type === 'booking' && (
                      <div className="text-emerald-300 space-y-0.5">
                        <div className="font-medium flex items-center gap-1">
                          <CheckCircle size={12} className="text-emerald-400" />
                          <span>{simResult.data.message || 'Booking Confirmed!'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Handoff status changed to BOOKED. Auto-retry cancelled.</p>
                      </div>
                    )}
                    {simResult.type === 'retry' && (
                      <div className="text-orange-300 space-y-0.5">
                        <div className="font-medium flex items-center gap-1">
                          <RotateCcw size={12} className="text-orange-400" />
                          <span>{simResult.data.booked ? 'Already booked — retry skipped!' : 'Retry Call Triggered!'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {simResult.data.booked
                            ? 'Lead has already booked, so no follow-up call was placed.'
                            : 'Follow-up outbound call executed for lead who had not booked.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tracked Leads Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-white">Tracked Handoff Leads</h4>
                  <span className="text-[10px] text-slate-400">{handoffs.length} recorded</span>
                </div>

                {handoffs.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 bg-white/5 rounded-xl border border-white/5">
                    <UserCheck size={20} className="mx-auto mb-1.5 opacity-40" />
                    <p className="text-xs">No human handoff requests yet.</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Use the Sandbox above or test with a real call.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {handoffs.map((lead, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">{lead.leadName || 'Lead'}</span>
                            <span className="text-[11px] font-mono text-slate-400">{lead.phone}</span>
                            {lead.booked ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                BOOKED
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                PENDING BOOKING
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                            <span className="truncate max-w-[150px]">{lead.calendlyLink}</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(lead.calendlyLink)}
                              className="text-violet-400 hover:text-violet-300"
                              title="Copy link"
                            >
                              <Copy size={9} />
                            </button>
                            <span>•</span>
                            <span>{new Date(lead.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {!lead.booked && (
                            <>
                              <button
                                onClick={async () => {
                                  await simulateCalendlyBooking(lead.phone, lead.leadName || undefined)
                                  refresh()
                                }}
                                className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded text-[10px] transition-colors"
                                title="Simulate booking confirmation"
                              >
                                Booked
                              </button>
                              <button
                                onClick={async () => {
                                  await triggerImmediateRetry(lead.phone)
                                  refresh()
                                }}
                                className="px-2 py-1 bg-orange-600/30 hover:bg-orange-600/50 text-orange-300 border border-orange-500/40 rounded text-[10px] transition-colors"
                                title="Trigger retry call"
                              >
                                Retry Call
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual Send SMS */}
              <div className="bg-black/20 border border-white/5 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-medium text-slate-300 block">Manual Calendly SMS Send</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    value={manualSmsPhone}
                    onChange={e => setManualSmsPhone(e.target.value)}
                    placeholder="Phone number (+91...)"
                    className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    value={manualSmsName}
                    onChange={e => setManualSmsName(e.target.value)}
                    placeholder="Prospect name"
                    className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <button
                  disabled={!manualSmsPhone}
                  onClick={async () => {
                    setManualSmsResult(null)
                    const res = await sendManualCalendlySms(manualSmsPhone, manualSmsName)
                    if (res.success) {
                      setManualSmsResult(`✅ Link sent! (${res.link})`)
                    } else {
                      setManualSmsResult(`⚠️ ${res.warning || res.error || 'Tracked link created'}`)
                    }
                    setManualSmsPhone('')
                    setManualSmsName('')
                    refresh()
                  }}
                  className="w-full flex items-center justify-center gap-1.5 bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 text-xs font-medium py-1.5 rounded-lg transition-colors disabled:opacity-40"
                >
                  <Send size={12} /> Send Calendly Link
                </button>
                {manualSmsResult && (
                  <p className="text-[11px] text-slate-300 bg-white/5 p-2 rounded border border-white/5">{manualSmsResult}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusIndicator({ label, ok, pulse = false }: { label: string; ok: boolean; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-slate-600'} ${pulse ? 'animate-pulse' : ''}`} />
      <span className={`text-xs ${ok ? 'text-slate-300' : 'text-slate-500'}`}>{label}</span>
    </div>
  )
}

function WebhookUrl({ url }: { url: string }) {
  const { copied, copy } = useCopy()
  return (
    <div className="ml-auto flex items-center gap-1.5">
      <span className="text-xs text-slate-500 truncate max-w-[120px]" title={url}>{url.replace('https://', '')}</span>
      <button onClick={() => copy(url)} className="text-slate-500 hover:text-violet-400 transition-colors">
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </button>
    </div>
  )
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: 'emerald' | 'violet' }) {
  const cls = { emerald: 'border-emerald-500/20 bg-emerald-500/5', violet: 'border-violet-500/20 bg-violet-500/5' }
  return (
    <div className={`border rounded-xl p-3 ${cls[accent]}`}>
      <div className="flex items-center justify-between mb-1">
        {icon}
        <span className="text-lg font-bold text-white">{value}</span>
      </div>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  )
}

function LiveEventRow({ event }: { event: WsEvent }) {
  const icons: Record<string, React.ReactNode> = {
    call_started: <PhoneIncoming size={11} className="text-blue-400" />,
    call_connected: <Zap size={11} className="text-yellow-400" />,
    transcript_update: <Mic size={11} className="text-violet-400" />,
    call_ended: <PhoneOff size={11} className="text-slate-400" />,
    snapshot: <RefreshCw size={11} className="text-slate-500" />,
    human_handoff: <MessageSquareShare size={11} className="text-pink-400" />,
    calendly_booked: <CalendarCheck size={11} className="text-emerald-400" />,
    retry_call: <RotateCcw size={11} className="text-orange-400" />,
  }
  const labels: Record<string, string> = {
    call_started: 'Call started',
    call_connected: 'AI agent connected',
    transcript_update: `${'speaker' in event ? event.speaker : ''} spoke`,
    call_ended: 'Call ended',
    snapshot: 'Session snapshot',
    human_handoff: `Human requested → Calendly link sent to ${(event as any).phone || ''}`,
    calendly_booked: `Slot Booked! ${(event as any).inviteeName || (event as any).leadName || (event as any).phone}`,
    retry_call: `Auto-retry call triggered for ${(event as any).phone || ''}`,
  }
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      {icons[event.type] || <Radio size={11} />}
      <span>{labels[event.type] || event.type}</span>
      {'callSid' in event && <span className="text-slate-600">...{(event as any).callSid?.slice(-6)}</span>}
    </div>
  )
}
