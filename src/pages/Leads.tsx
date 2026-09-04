import { useState } from 'react'
import { Users, Download, Upload, Filter, X } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { IntentScore } from '@/components/ui/IntentScore'
import { intentBadge, leadStatusBadge } from '@/components/ui/StatusBadge'
import { leads, type Lead, type LeadStatus, type IntentLevel } from '@/data/leads'
import { formatDate, timeAgo } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { LeadDrawer } from './LeadDiscovery'

const ALL_INDUSTRIES = ['All', ...Array.from(new Set(leads.map(l => l.industry))).sort()]
const ALL_STATUSES: (LeadStatus | 'All')[] = ['All','NEW','ENRICHED','QUALIFIED','CONTACTED','INTERESTED','MEETING','OPPORTUNITY','WON','LOST','NOT_QUALIFIED']
const ALL_INTENTS: (IntentLevel | 'All')[] = ['All','HIGH','MEDIUM','LOW']
const ALL_SOURCES = ['All', ...Array.from(new Set(leads.map(l => l.source))).sort()]

export function Leads() {
  const { showToast } = useToast()
  const [industry, setIndustry]   = useState<string>('All')
  const [status,   setStatus]     = useState<string>('All')
  const [intent,   setIntent]     = useState<string>('All')
  const [source,   setSource]     = useState<string>('All')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showImport, setShowImport] = useState(false)

  const filtered = leads.filter(l =>
    (industry === 'All' || l.industry === industry) &&
    (status   === 'All' || l.status   === status) &&
    (intent   === 'All' || l.intent   === intent) &&
    (source   === 'All' || l.source   === source)
  )

  const columns: Column<Lead>[] = [
    { key: 'name', header: 'Lead Name', sortable: true, render: r => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xs font-bold text-amber-400 shrink-0">
          {r.name.charAt(0)}
        </div>
        <div>
          <div className="font-medium text-text-primary">{r.name}</div>
          <div className="text-2xs text-text-muted">{r.jobTitle}</div>
        </div>
      </div>
    )},
    { key: 'company',  header: 'Company',   sortable: true, render: r => <div><div className="text-text-primary">{r.company}</div><div className="text-2xs text-text-muted">{r.industry}</div></div> },
    { key: 'location', header: 'Location',  render: r => <span className="text-text-secondary">{r.location}</span> },
    { key: 'intentScore', header: 'Intent', sortable: true, render: r => <IntentScore score={r.intentScore} size="sm" /> },
    { key: 'source',   header: 'Source',   render: r => <span className="badge-blue">{r.source}</span> },
    { key: 'status',   header: 'Status',   render: r => leadStatusBadge(r.status) },
    { key: 'discoveredAt', header: 'Discovered', sortable: true, render: r => <span className="text-2xs text-text-muted font-mono">{timeAgo(r.discoveredAt)}</span> },
    { key: 'nextAction', header: 'Next Action', render: r => <span className="text-xs text-text-secondary">{r.nextAction}</span> },
  ]

  function handleExport() {
    const csv = [
      ['Name','Company','Industry','Location','Intent Score','Intent','Source','Status','Email','Phone'],
      ...leads.map(l => [l.name,l.company,l.industry,l.location,l.intentScore,l.intent,l.source,l.status,l.email,l.phone])
    ].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'leads_export.csv'; a.click()
    showToast('success', 'Export Complete', `${leads.length} leads exported to CSV`)
  }

  function clearFilters() {
    setIndustry('All'); setStatus('All'); setIntent('All'); setSource('All')
  }

  const hasFilters = industry !== 'All' || status !== 'All' || intent !== 'All' || source !== 'All'

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <h1 className="text-sm font-bold text-text-primary">Leads</h1>
          <span className="text-2xs text-text-muted">({leads.length} total)</span>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <span className="text-2xs text-amber-400 self-center">{selectedIds.size} selected</span>
          )}
          <button onClick={() => setShowImport(true)} className="btn-secondary text-xs gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
          <button onClick={handleExport} className="btn-secondary text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button className="btn-primary text-xs">Add Lead</button>
        </div>
      </div>

      {/* Filters */}
      <div className="panel p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-1 text-2xs text-text-muted">
            <Filter className="w-3 h-3" /> Filters
          </div>
          {([
            { label: 'Industry', value: industry, setter: setIndustry, options: ALL_INDUSTRIES },
            { label: 'Status',   value: status,   setter: setStatus,   options: ALL_STATUSES },
            { label: 'Intent',   value: intent,   setter: setIntent,   options: ALL_INTENTS },
            { label: 'Source',   value: source,   setter: setSource,   options: ALL_SOURCES },
          ] as const).map(f => (
            <div key={f.label}>
              <label className="text-2xs text-text-muted mb-1 block">{f.label}</label>
              <select className="input w-36" value={f.value} onChange={e => f.setter(e.target.value)}>
                {f.options.map((o: string) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 btn-ghost text-xs mt-4">
              <X className="w-3 h-3" /> Clear Filters
            </button>
          )}
          <div className="ml-auto self-end text-2xs text-text-muted">{filtered.length} records</div>
        </div>
      </div>

      {/* Table */}
      <div className="panel flex flex-col min-h-96">
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          onRowClick={r => setSelectedLead(r)}
          pageSize={15}
          searchable
          searchPlaceholder="Search leads..."
          searchKeys={['name', 'company', 'industry', 'location']}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          emptyMessage="No leads match current filters."
        />
      </div>

      {/* Lead Drawer */}
      {selectedLead && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedLead(null)} />
          <div className="drawer-panel">
            <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
          </div>
        </>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal-panel max-w-md" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <span className="section-title">Import Leads</span>
              <button onClick={() => setShowImport(false)}><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-bg-border rounded-lg p-8 text-center hover:border-amber-500/40 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <div className="text-sm text-text-secondary">Drop CSV or Excel file here</div>
                <div className="text-xs text-text-muted mt-1">or click to browse</div>
              </div>
              <div className="text-xs text-text-muted">
                Supported columns: Name, Email, Phone, Company, Industry, Location, Job Title
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowImport(false)} className="btn-secondary text-xs">Cancel</button>
                <button onClick={() => { setShowImport(false); showToast('success', 'Import Simulated', '45 leads imported successfully') }} className="btn-primary text-xs">Import</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
