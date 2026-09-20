import { useState } from 'react'
import { PhoneCall, Phone, Circle, X, MessageSquare, Calendar, FileText, Server, Sliders, CheckCircle, Volume2, ShieldCheck, Check } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { intentBadge } from '@/components/ui/StatusBadge'
import { calls, type Call } from '@/data/calls'
import { formatDuration, formatTimestamp } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'

const liveCalls = [
  { id: 'LC1', prospect: 'Rahul Mehta',       company: 'Acme Digital Solutions',   location: 'Bangalore, India',   duration: 247, sentiment: 'POSITIVE', qualification: 'LIKELY',    stage: 'Presenting solution' },
  { id: 'LC2', prospect: 'Sarah Johnson',      company: 'NexaFinance Corp',         location: 'New York, USA',      duration: 183, sentiment: 'POSITIVE', qualification: 'QUALIFIED', stage: 'Scheduling meeting' },
  { id: 'LC3', prospect: 'Mohammed Al-Rashidi',company: 'Emirates Future Tech',     location: 'Dubai, UAE',         duration: 94,  sentiment: 'NEUTRAL',  qualification: 'LIKELY',    stage: 'Needs assessment' },
  { id: 'LC4', prospect: 'Kavitha Reddy',      company: 'Bharat Insurance Group',  location: 'Hyderabad, India',   duration: 312, sentiment: 'POSITIVE', qualification: 'QUALIFIED', stage: 'Demo in progress' },
  { id: 'LC5', prospect: 'Oliver Schmidt',     company: 'Deutech Manufacturing',   location: 'Munich, Germany',    duration: 61,  sentiment: 'NEUTRAL',  qualification: 'NEEDS_REVIEW', stage: 'Objection handling' },
  { id: 'LC6', prospect: 'Priya Sharma',       company: 'TechVenture Labs',         location: 'Mumbai, India',      duration: 142, sentiment: 'POSITIVE', qualification: 'LIKELY',    stage: 'Qualification Q&A' },
]

function getCallForLiveCall(call: typeof liveCalls[0]): Call {
  const existing = calls.find(c => c.prospect.toLowerCase() === call.prospect.toLowerCase())
  if (existing) {
    return {
      ...existing,
      duration: call.duration,
      sentiment: call.sentiment as any,
      qualification: call.qualification as any,
    }
  }
  return {
    id: call.id,
    timestamp: new Date(),
    prospect: call.prospect,
    company: call.company,
    agent: 'Aria (Enterprise)',
    campaignId: 'C001',
    duration: call.duration,
    outcome: 'ANSWERED',
    sentiment: call.sentiment as any,
    intent: 'HIGH',
    qualification: call.qualification as any,
    recording: true,
    summary: `Live AI qualification call in progress with ${call.prospect} from ${call.company}. Current stage: ${call.stage}. Sentiment is ${call.sentiment}.`,
    nextBestAction: `Continue guided qualification. Current stage: ${call.stage}.`,
    buyingSignals: ['Engaged prospect', 'Confirmed active requirement', 'Reviewing timeline and budget'],
    objections: call.sentiment === 'NEGATIVE' ? ['Timeline constraints'] : [],
    transcript: [
      { speaker: 'AI', text: `Hello, am I speaking with ${call.prospect}?`, timestamp: '00:00:03' },
      { speaker: 'PROSPECT', text: `Yes, this is ${call.prospect}. What is this regarding?`, timestamp: '00:00:08', sentiment: 'NEUTRAL' },
      { speaker: 'AI', text: `Hi! I'm Aria calling from NexusAI Solutions. We help companies like ${call.company} automate sales qualification and pipeline growth. Do you have 2 minutes?`, timestamp: '00:00:15' },
      { speaker: 'PROSPECT', text: `Sure, we actually have an active evaluation around this.`, timestamp: '00:00:26', sentiment: call.sentiment as any },
      { speaker: 'AI', text: `That's great! Current focus is ${call.stage.toLowerCase()} — let me walk you through our platform highlights.`, timestamp: '00:00:35' },
    ],
  }
}

export function AIVoiceAgent() {
  const { showToast } = useToast()
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [telephonyMode, setTelephonyMode] = useState<'BUILTIN' | 'BYO'>('BUILTIN')
  const [carrierProvider, setCarrierProvider] = useState('Twilio')
  const [agentName, setAgentName] = useState('Aria (Enterprise SDR)')
  const [outboundLang, setOutboundLang] = useState('English (US)')
  const [voiceStyle, setVoiceStyle] = useState('Professional Female (Natural Neural)')
  const [voiceSpeed, setVoiceSpeed] = useState('1.0x (Natural)')
  const [voicemailDrop, setVoicemailDrop] = useState(true)
  const [autoCallback, setAutoCallback] = useState(true)
  const [maxRetries, setMaxRetries] = useState('3')

  const sentimentColor = (s: string) => s === 'POSITIVE' ? 'text-success' : s === 'NEGATIVE' ? 'text-danger-bright' : 'text-text-muted'
  const qualColor = (q: string) => q === 'QUALIFIED' ? 'badge-success' : q === 'LIKELY' ? 'badge-amber' : q === 'NEEDS_REVIEW' ? 'badge-blue' : 'badge-low'

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-amber-400" />
          <h1 className="text-sm font-bold text-text-primary">AI Voice Agent</h1>
          <span className="flex items-center gap-1.5 text-2xs text-success font-medium ml-2">
            <Circle className="w-2 h-2 fill-success animate-pulse" /> ONLINE
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => showToast('info', 'Agent Paused', 'AI Voice Agent paused. New calls will queue.')} className="btn-secondary text-xs">Pause Agent</button>
          <button onClick={() => setConfigOpen(true)} className="btn-primary text-xs flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> Configure Agent
          </button>
        </div>
      </div>

      {/* Agent Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Active Calls"      value={liveCalls.length} accent icon={<Phone className="w-3.5 h-3.5" />} />
        <MetricCard label="Calls Today"       value={842}   delta={21.3} />
        <MetricCard label="Avg Duration"      value="3m 42s" />
        <MetricCard label="Qualification Rate" value="31%"  delta={4.2} />
      </div>

      {/* Live Call Monitor */}
      <div className="panel">
        <div className="section-header">
          <span className="section-title">Live Call Monitor</span>
          <span className="flex items-center gap-1.5 text-2xs text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> {liveCalls.length} active calls
          </span>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {liveCalls.map(call => (
            <button key={call.id} onClick={() => setSelectedCall(getCallForLiveCall(call))}
              className="kanban-card text-left hover:border-amber-500/40 p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-text-primary">{call.prospect}</div>
                  <div className="text-2xs text-text-muted">{call.company}</div>
                  <div className="text-2xs text-text-muted">{call.location}</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-success animate-pulse mt-1" />
              </div>
              <div className="flex items-center justify-between text-2xs">
                <span className="font-mono text-amber-400">{formatDuration(call.duration)}</span>
                <span className={sentimentColor(call.sentiment)}>{call.sentiment}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`badge text-2xs ${qualColor(call.qualification)}`}>{call.qualification.replace('_',' ')}</span>
                <span className="text-2xs text-text-muted">{call.stage}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Completed Calls */}
      <div className="panel">
        <div className="section-header">
          <span className="section-title">Recent Calls</span>
        </div>
        <div className="divide-y divide-bg-border">
          {calls.slice(0, 8).map(call => (
            <div key={call.id} onClick={() => call.transcript.length > 0 && setSelectedCall(call)}
              className="flex items-center gap-4 px-4 py-2.5 hover:bg-bg-hover transition-colors cursor-pointer">
              <div className="text-2xs font-mono text-text-muted w-16 shrink-0">{formatTimestamp(call.timestamp)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-text-primary">{call.prospect}</div>
                <div className="text-2xs text-text-muted">{call.company} · {call.agent}</div>
              </div>
              <span className="font-mono text-2xs text-text-muted">{formatDuration(call.duration)}</span>
              <span className={`badge text-2xs ${call.outcome === 'MEETING_BOOKED' || call.outcome === 'QUALIFIED' ? 'badge-success' : call.outcome === 'NOT_INTERESTED' || call.outcome === 'NO_ANSWER' ? 'badge-danger' : 'badge-blue'}`}>
                {call.outcome.replace('_',' ')}
              </span>
              <span className={sentimentColor(call.sentiment) + ' text-2xs'}>{call.sentiment}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transcript Modal */}
      {selectedCall && (
        <div className="modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="modal-panel max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <div>
                <span className="section-title">{selectedCall.prospect} — Call Transcript</span>
                <div className="text-2xs text-text-muted mt-0.5">{selectedCall.company} · {formatDuration(selectedCall.duration)}</div>
              </div>
              <button onClick={() => setSelectedCall(null)}><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              {/* Transcript */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedCall.transcript.map((line, i) => (
                  <div key={i} className={`flex gap-3 ${line.speaker === 'AI' ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold shrink-0 ${line.speaker === 'AI' ? 'bg-amber-500/20 text-amber-400' : 'bg-info-dim text-info-bright'}`}>
                      {line.speaker === 'AI' ? 'AI' : 'P'}
                    </div>
                    <div className={`max-w-[75%] p-2.5 rounded text-xs leading-relaxed ${line.speaker === 'AI' ? 'bg-bg-card border border-bg-border text-text-primary' : 'bg-info-dim border border-info/20 text-info-bright'}`}>
                      <div className="text-2xs text-text-muted mb-1">{line.speaker === 'AI' ? 'AI Agent' : 'Prospect'} · {line.timestamp}</div>
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Intelligence Panel */}
              <div className="w-56 border-l border-bg-border p-4 space-y-4 overflow-y-auto bg-bg-secondary">
                <div className="text-2xs text-amber-400 font-semibold uppercase tracking-wide">AI Call Intelligence</div>
                {[
                  { label: 'Sentiment', value: selectedCall.sentiment, color: selectedCall.sentiment === 'POSITIVE' ? 'text-success' : 'text-danger-bright' },
                  { label: 'Intent', value: selectedCall.intent, color: 'text-amber-400' },
                  { label: 'Qualification', value: selectedCall.qualification.replace('_',' '), color: 'text-success' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-2xs text-text-muted mb-0.5">{item.label}</div>
                    <div className={`text-xs font-semibold ${item.color}`}>{item.value}</div>
                  </div>
                ))}

                {selectedCall.buyingSignals.length > 0 && (
                  <div>
                    <div className="text-2xs text-success font-semibold mb-1">Buying Signals</div>
                    {selectedCall.buyingSignals.map((s, i) => <div key={i} className="text-2xs text-text-secondary">· {s}</div>)}
                  </div>
                )}
                {selectedCall.objections.length > 0 && (
                  <div>
                    <div className="text-2xs text-danger-bright font-semibold mb-1">Objections</div>
                    {selectedCall.objections.map((s, i) => <div key={i} className="text-2xs text-text-secondary">· {s}</div>)}
                  </div>
                )}

                <div>
                  <div className="text-2xs text-amber-400 font-semibold mb-1">Next Best Action</div>
                  <div className="text-xs text-text-primary">{selectedCall.nextBestAction}</div>
                </div>

                <div className="space-y-1.5">
                  {['Call Back','Schedule Meeting','Add to CRM','Add Note'].map(a => (
                    <button key={a} onClick={() => { showToast('success', a, `Action recorded for ${selectedCall.prospect}`); setSelectedCall(null) }}
                      className="w-full btn-secondary text-2xs py-1">{a}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Configuration Modal (User Journey Steps 5 & 11) */}
      {configOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel max-w-xl w-full p-6 space-y-4 border border-amber-500/30 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-bg-border pb-3">
              <div>
                <div className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Configure AI Voice Agent
                </div>
                <div className="text-2xs text-text-muted mt-0.5">User Journey Steps 5 & 11: Calling infrastructure, persona, voicemail drops & retry rules</div>
              </div>
              <button onClick={() => setConfigOpen(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Calling Infrastructure Selector */}
            <div className="space-y-2">
              <label className="text-2xs text-text-muted uppercase font-bold tracking-wide block">Calling Telephony Provider</label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setTelephonyMode('BUILTIN')}
                  className={`p-3 rounded border cursor-pointer transition-all ${telephonyMode === 'BUILTIN' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-bg-card border-bg-border hover:border-amber-500/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-amber-400" /> Platform Built-in
                    </span>
                    {telephonyMode === 'BUILTIN' && <span className="text-2xs text-amber-400 font-bold">✓ Active</span>}
                  </div>
                  <p className="text-2xs text-text-muted mt-1">Pre-configured global SIP routes. Metered per voice minute.</p>
                </div>

                <div
                  onClick={() => setTelephonyMode('BYO')}
                  className={`p-3 rounded border cursor-pointer transition-all ${telephonyMode === 'BYO' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-bg-card border-bg-border hover:border-amber-500/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-blue-400" /> BYO Telephony (SIP)
                    </span>
                    {telephonyMode === 'BYO' && <span className="text-2xs text-amber-400 font-bold">✓ Active</span>}
                  </div>
                  <p className="text-2xs text-text-muted mt-1">Direct carrier integration (Twilio / Plivo / Custom SIP Trunk).</p>
                </div>
              </div>

              {telephonyMode === 'BYO' && (
                <div className="p-3 bg-bg-card border border-bg-border rounded space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-2xs text-text-muted block mb-0.5">Carrier</label>
                      <select className="input text-xs w-full" value={carrierProvider} onChange={e => setCarrierProvider(e.target.value)}>
                        <option>Twilio</option>
                        <option>Plivo</option>
                        <option>Vonage</option>
                        <option>Custom SIP</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-2xs text-text-muted block mb-0.5">Caller ID Phone</label>
                      <input className="input text-xs w-full font-mono" defaultValue="+1 (415) 800-2931" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Persona Settings */}
            <div className="space-y-3 pt-2 border-t border-bg-border text-xs">
              <label className="text-2xs text-text-muted uppercase font-bold tracking-wide block">Voice Persona & Language</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-2xs text-text-muted block mb-1">Agent Name</label>
                  <input className="input text-xs w-full" value={agentName} onChange={e => setAgentName(e.target.value)} />
                </div>
                <div>
                  <label className="text-2xs text-text-muted block mb-1">Outbound Primary Language</label>
                  <select className="input text-xs w-full" value={outboundLang} onChange={e => setOutboundLang(e.target.value)}>
                    <option>English (US)</option>
                    <option>English (India)</option>
                    <option>Hindi (हिंदी)</option>
                    <option>Gujarati (ગુજરાતી)</option>
                    <option>Spanish (ES)</option>
                    <option>French (FR)</option>
                    <option>German (DE)</option>
                  </select>
                </div>
                <div>
                  <label className="text-2xs text-text-muted block mb-1">Voice Timbre</label>
                  <select className="input text-xs w-full" value={voiceStyle} onChange={e => setVoiceStyle(e.target.value)}>
                    <option>Professional Female (Natural Neural)</option>
                    <option>Warm Professional Male</option>
                    <option>Native Hindi Female</option>
                    <option>British Corporate Male</option>
                  </select>
                </div>
                <div>
                  <label className="text-2xs text-text-muted block mb-1">Pacing Speed</label>
                  <select className="input text-xs w-full" value={voiceSpeed} onChange={e => setVoiceSpeed(e.target.value)}>
                    <option>0.85x (Slower & Deliberate)</option>
                    <option>1.0x (Natural Conversational)</option>
                    <option>1.1x (Energetic)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Outbound Journey Step 11 Automation Controls */}
            <div className="space-y-3 pt-2 border-t border-bg-border text-xs">
              <label className="text-2xs text-text-muted uppercase font-bold tracking-wide block">Outreach Automation & Retry Rules</label>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-bg-card border border-bg-border rounded">
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Voicemail Drop on Machine Detection</div>
                    <div className="text-2xs text-text-muted">Leave AI customized audio voicemail when answering machine answers</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoicemailDrop(!voicemailDrop)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${voicemailDrop ? 'bg-amber-500' : 'bg-bg-border'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${voicemailDrop ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-bg-card border border-bg-border rounded">
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Automated Callback Scheduling</div>
                    <div className="text-2xs text-text-muted">Schedule callback when prospect requests another time (retried till answered)</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoCallback(!autoCallback)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${autoCallback ? 'bg-amber-500' : 'bg-bg-border'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${autoCallback ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-bg-card border border-bg-border rounded">
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Max Unanswered Call Retries</div>
                    <div className="text-2xs text-text-muted">Maximum number of automated retry attempts for unanswered calls</div>
                  </div>
                  <select
                    className="input text-xs w-20"
                    value={maxRetries}
                    onChange={e => setMaxRetries(e.target.value)}
                  >
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>5</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Knowledge Base Grounding Summary */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-semibold text-text-primary">3 Business Knowledge Docs Synchronized</span>
                  <p className="text-2xs text-text-muted">Grounded on corporate pitch deck, catalog, and security FAQs</p>
                </div>
              </div>
              <span className="badge-success text-2xs">Active</span>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-bg-border">
              <span className="text-2xs text-text-muted">All changes apply to upcoming campaign batches</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setConfigOpen(false)} className="btn-secondary text-xs">Cancel</button>
                <button
                  onClick={() => {
                    showToast('success', 'Voice Agent Configured', `Agent ${agentName} updated with ${telephonyMode === 'BUILTIN' ? 'Platform Built-in' : carrierProvider} telephony`)
                    setConfigOpen(false)
                  }}
                  className="btn-primary text-xs"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
