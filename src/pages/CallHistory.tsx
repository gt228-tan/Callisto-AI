import { useState } from 'react'
import { ScrollText, Download, Filter, X } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { outcomeBadge } from '@/components/ui/StatusBadge'
import { calls, type Call } from '@/data/calls'
import { formatDateTime, formatDuration, formatTimestamp } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { exportToCSV } from '@/lib/exportCsv'

export function CallHistory() {
  const { showToast } = useToast()
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)

  function handleExportCalls() {
    exportToCSV('call_history.csv', calls, [
      { key: 'prospect', label: 'Prospect' },
      { key: 'company', label: 'Company' },
      { key: 'phone', label: 'Phone' },
      { key: 'agent', label: 'Agent' },
      { key: 'duration', label: 'Duration (s)' },
      { key: 'outcome', label: 'Outcome' },
      { key: 'sentiment', label: 'Sentiment' },
      { key: 'intent', label: 'Intent' },
      { key: 'qualification', label: 'Qualification' },
      { key: 'summary', label: 'AI Call Summary' },
      { key: 'timestamp', label: 'Timestamp' },
    ])
    showToast('success', 'Export Complete', `${calls.length} call logs exported to CSV`)
  }

  const columns: Column<Call>[] = [
    { key: 'timestamp',     header: 'Timestamp',     sortable: true, render: r => <span className="font-mono text-2xs text-text-muted">{formatDateTime(r.timestamp)}</span> },
    { key: 'prospect',      header: 'Prospect',      sortable: true, render: r => (
      <div><div className="font-medium text-text-primary">{r.prospect}</div><div className="text-2xs text-text-muted">{r.company}</div></div>
    )},
    { key: 'agent',         header: 'Agent',         render: r => <span className="text-text-secondary">{r.agent}</span> },
    { key: 'duration',      header: 'Duration',      sortable: true, render: r => <span className="font-mono text-text-primary">{formatDuration(r.duration)}</span> },
    { key: 'outcome',       header: 'Outcome',       render: r => outcomeBadge(r.outcome) },
    { key: 'sentiment',     header: 'Sentiment',     render: r => (
      <span className={r.sentiment === 'POSITIVE' ? 'text-success text-xs' : r.sentiment === 'NEGATIVE' ? 'text-danger-bright text-xs' : 'text-text-muted text-xs'}>{r.sentiment}</span>
    )},
    { key: 'intent',        header: 'Intent',        render: r => (
      <span className={`badge text-2xs ${r.intent === 'HIGH' ? 'badge-high' : r.intent === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>{r.intent}</span>
    )},
    { key: 'qualification', header: 'Qualification', render: r => (
      <span className={`badge text-2xs ${r.qualification === 'QUALIFIED' ? 'badge-success' : r.qualification === 'LIKELY' ? 'badge-amber' : r.qualification === 'NEEDS_REVIEW' ? 'badge-blue' : 'badge-low'}`}>
        {r.qualification.replace('_',' ')}
      </span>
    )},
    { key: 'recording',     header: 'Recording',     render: r => r.recording ? <span className="badge-success text-2xs">● REC</span> : <span className="text-text-muted text-2xs">—</span> },
    { key: 'transcript',    header: 'Transcript',    render: r => r.transcript.length > 0
      ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setSelectedCall(r) }}
          className="badge-blue text-2xs cursor-pointer hover:bg-blue-500/20 font-medium"
        >
          View
        </button>
      )
      : <span className="text-text-muted text-2xs">—</span>
    },
  ]

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-amber-400 shrink-0" />
          <h1 className="text-sm font-bold text-text-primary">Call History</h1>
          <span className="text-2xs text-text-muted">({calls.length} calls)</span>
        </div>
        <button onClick={handleExportCalls} className="btn-secondary text-xs gap-1.5 w-full sm:w-auto justify-center">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: 'Total Calls', value: calls.length },
          { label: 'Answered', value: calls.filter(c => c.outcome !== 'NO_ANSWER' && c.outcome !== 'VOICEMAIL').length },
          { label: 'Meetings Booked', value: calls.filter(c => c.outcome === 'MEETING_BOOKED').length },
          { label: 'Qualified', value: calls.filter(c => c.outcome === 'QUALIFIED' || c.qualification === 'QUALIFIED').length },
          { label: 'Avg Duration', value: `${Math.floor(calls.reduce((s,c)=>s+c.duration,0)/calls.length / 60)}m ${Math.floor(calls.reduce((s,c)=>s+c.duration,0)/calls.length % 60)}s` },
        ].map(m => (
          <div key={m.label} className="panel-card p-2.5 sm:p-3">
            <div className="text-2xs text-text-muted uppercase tracking-wide truncate">{m.label}</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-text-primary mt-0.5 truncate">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="panel flex flex-col">
        <DataTable
          data={calls}
          columns={columns}
          keyExtractor={r => r.id}
          onRowClick={r => setSelectedCall(r)}
          pageSize={15}
          searchable
          searchPlaceholder="Search by prospect, company, agent..."
          searchKeys={['prospect', 'company', 'agent', 'outcome']}
          emptyMessage="No calls in history."
        />
      </div>

      {/* Transcript Modal */}
      {selectedCall && (
        <div className="modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="modal-panel max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <div>
                <span className="section-title">{selectedCall.prospect} — Call Transcript</span>
                <div className="text-2xs text-text-muted mt-0.5">{selectedCall.company} · {selectedCall.agent} · {formatDuration(selectedCall.duration)}</div>
              </div>
              <button onClick={() => setSelectedCall(null)}><X className="w-4 h-4 text-text-muted hover:text-text-primary" /></button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              {/* Transcript list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedCall.transcript.length === 0 ? (
                  <div className="text-xs text-text-muted text-center py-8">No audio transcript recorded for this call.</div>
                ) : (
                  selectedCall.transcript.map((line, i) => (
                    <div key={i} className={`flex gap-3 ${line.speaker === 'AI' ? '' : 'flex-row-reverse'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold shrink-0 ${line.speaker === 'AI' ? 'bg-amber-500/20 text-amber-400' : 'bg-info-dim text-info-bright'}`}>
                        {line.speaker === 'AI' ? 'AI' : 'P'}
                      </div>
                      <div className={`max-w-[75%] p-2.5 rounded text-xs leading-relaxed ${line.speaker === 'AI' ? 'bg-bg-card border border-bg-border text-text-primary' : 'bg-info-dim border border-info/20 text-info-bright'}`}>
                        <div className="text-2xs text-text-muted mb-1">{line.speaker === 'AI' ? 'AI Agent' : selectedCall.prospect} · {line.timestamp}</div>
                        {line.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* AI Intelligence Panel */}
              <div className="w-64 border-l border-bg-border p-4 space-y-4 overflow-y-auto bg-bg-secondary shrink-0">
                <div className="text-2xs text-amber-400 font-semibold uppercase tracking-wide">AI Call Intelligence</div>
                {[
                  { label: 'Call Outcome', value: selectedCall.outcome.replace('_', ' '), color: selectedCall.outcome === 'MEETING_BOOKED' || selectedCall.outcome === 'QUALIFIED' ? 'text-success' : 'text-text-primary' },
                  { label: 'Sentiment', value: selectedCall.sentiment, color: selectedCall.sentiment === 'POSITIVE' ? 'text-success' : selectedCall.sentiment === 'NEGATIVE' ? 'text-danger-bright' : 'text-text-muted' },
                  { label: 'Intent Level', value: selectedCall.intent, color: 'text-amber-400' },
                  { label: 'Qualification', value: selectedCall.qualification.replace('_', ' '), color: 'text-success' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-2xs text-text-muted mb-0.5">{item.label}</div>
                    <div className={`text-xs font-semibold ${item.color}`}>{item.value}</div>
                  </div>
                ))}

                {selectedCall.summary && (
                  <div>
                    <div className="text-2xs text-text-muted mb-1 font-medium">Summary</div>
                    <div className="text-2xs text-text-secondary leading-relaxed bg-bg-card p-2 rounded border border-bg-border/60">{selectedCall.summary}</div>
                  </div>
                )}

                {selectedCall.buyingSignals?.length > 0 && (
                  <div>
                    <div className="text-2xs text-success font-semibold mb-1">Buying Signals</div>
                    {selectedCall.buyingSignals.map((s, i) => <div key={i} className="text-2xs text-text-secondary">· {s}</div>)}
                  </div>
                )}

                {selectedCall.nextBestAction && (
                  <div>
                    <div className="text-2xs text-amber-400 font-semibold mb-1">Next Best Action</div>
                    <div className="text-xs text-text-primary">{selectedCall.nextBestAction}</div>
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-bg-border">
                  {['Schedule Follow-up Meeting', 'Export Call Record', 'Add CRM Note'].map(a => (
                    <button
                      key={a}
                      onClick={() => {
                        showToast('success', a, `Action saved for call with ${selectedCall.prospect}`)
                        setSelectedCall(null)
                      }}
                      className="w-full btn-secondary text-2xs py-1"
                    >
                      {a}
                    </button>
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
