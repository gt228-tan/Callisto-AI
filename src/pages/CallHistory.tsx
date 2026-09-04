import { ScrollText, Download, Filter } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { outcomeBadge } from '@/components/ui/StatusBadge'
import { calls, type Call } from '@/data/calls'
import { formatDateTime, formatDuration, formatTimestamp } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { exportToCSV } from '@/lib/exportCsv'

export function CallHistory() {
  const { showToast } = useToast()

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
      ? <span className="badge-blue text-2xs cursor-pointer hover:underline">View</span>
      : <span className="text-text-muted text-2xs">—</span>
    },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-amber-400" />
          <h1 className="text-sm font-bold text-text-primary">Call History</h1>
          <span className="text-2xs text-text-muted">({calls.length} calls)</span>
        </div>
        <button onClick={handleExportCalls} className="btn-secondary text-xs gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Calls', value: calls.length },
          { label: 'Answered', value: calls.filter(c => c.outcome !== 'NO_ANSWER' && c.outcome !== 'VOICEMAIL').length },
          { label: 'Meetings Booked', value: calls.filter(c => c.outcome === 'MEETING_BOOKED').length },
          { label: 'Qualified', value: calls.filter(c => c.outcome === 'QUALIFIED' || c.qualification === 'QUALIFIED').length },
          { label: 'Avg Duration', value: `${Math.floor(calls.reduce((s,c)=>s+c.duration,0)/calls.length / 60)}m ${Math.floor(calls.reduce((s,c)=>s+c.duration,0)/calls.length % 60)}s` },
        ].map(m => (
          <div key={m.label} className="panel-card p-3">
            <div className="text-2xs text-text-muted uppercase tracking-wide">{m.label}</div>
            <div className="text-xl font-bold font-mono text-text-primary mt-0.5">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="panel flex flex-col">
        <DataTable
          data={calls}
          columns={columns}
          keyExtractor={r => r.id}
          pageSize={15}
          searchable
          searchPlaceholder="Search by prospect, company, agent..."
          searchKeys={['prospect', 'company', 'agent', 'outcome']}
          emptyMessage="No calls in history."
        />
      </div>
    </div>
  )
}
