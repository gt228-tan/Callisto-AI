import { useState } from 'react'
import { PhoneCall, Phone, Circle, X, MessageSquare, Calendar, FileText } from 'lucide-react'
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

const recentCalls = calls.filter(c => c.transcript.length > 3).slice(0, 5)

export function AIVoiceAgent() {
  const { showToast } = useToast()
  const [selectedCall, setSelectedCall] = useState<typeof calls[0] | null>(null)

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
          <button onClick={() => showToast('success', 'Configuration Saved', 'Agent settings updated')} className="btn-primary text-xs">Configure Agent</button>
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
            <button key={call.id} onClick={() => { const c = recentCalls[0]; setSelectedCall(c) }}
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
    </div>
  )
}
