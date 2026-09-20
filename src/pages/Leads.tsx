import { useState } from 'react'
import { Users, Download, Upload, Filter, X, Star, Sparkles } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { IntentScore } from '@/components/ui/IntentScore'
import { intentBadge, leadStatusBadge } from '@/components/ui/StatusBadge'
import { leads, type Lead, type LeadStatus, type IntentLevel } from '@/data/leads'
import { formatDate, timeAgo } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { useAppContext } from '@/contexts/AppContext'
import { exportToCSV } from '@/lib/exportCsv'
import { LeadDrawer } from './LeadDiscovery'
import { ImportLeadsModal } from '@/components/ui/ImportLeadsModal'

const ALL_INDUSTRIES = ['All', ...Array.from(new Set(leads.map(l => l.industry))).sort()]
const ALL_STATUSES: (LeadStatus | 'All')[] = ['All','NEW','ENRICHED','QUALIFIED','CONTACTED','INTERESTED','MEETING','OPPORTUNITY','WON','LOST','NOT_QUALIFIED']
const ALL_INTENTS: (IntentLevel | 'All')[] = ['All','HIGH','MEDIUM','LOW']
const ALL_SOURCES = ['All', ...Array.from(new Set(leads.map(l => l.source))).sort()]

export function Leads() {
  const { showToast } = useToast()
  const { t } = useAppContext()
  const [leadsList, setLeadsList] = useState<Lead[]>(leads)
  const [industry, setIndustry]   = useState<string>('All')
  const [status,   setStatus]     = useState<string>('All')
  const [intent,   setIntent]     = useState<string>('All')
  const [source,   setSource]     = useState<string>('All')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showAddLead, setShowAddLead] = useState(false)
  const [newLead, setNewLead] = useState({
    name: '',
    company: '',
    jobTitle: '',
    industry: 'IT Services',
    location: 'Bangalore, India',
    email: '',
    phone: '',
    source: 'LinkedIn',
    intentScore: 85,
    requirement: '',
  })

  const filtered = leadsList.filter(l =>
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
    const targetLeads = selectedIds.size > 0
      ? filtered.filter(l => selectedIds.has(l.id))
      : filtered
    exportToCSV('leads_export.csv', targetLeads, [
      { key: 'name', label: 'Name' },
      { key: 'company', label: 'Company' },
      { key: 'jobTitle', label: 'Job Title' },
      { key: 'industry', label: 'Industry' },
      { key: 'location', label: 'Location' },
      { key: 'intentScore', label: 'Intent Score' },
      { key: 'intent', label: 'Intent Level' },
      { key: 'source', label: 'Source' },
      { key: 'status', label: 'Status' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'nextAction', label: 'Next Action' },
    ])
    showToast('success', 'Export Complete', `${targetLeads.length} leads exported to CSV`)
  }

  function clearFilters() {
    setIndustry('All'); setStatus('All'); setIntent('All'); setSource('All')
  }

  const hasFilters = industry !== 'All' || status !== 'All' || intent !== 'All' || source !== 'All'

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400 shrink-0" />
          <h1 className="text-sm font-bold text-text-primary">{t('nav.leads', 'Leads')}</h1>
          <span className="text-2xs text-text-muted">({leads.length} total)</span>
          {selectedIds.size > 0 && (
            <span className="text-2xs text-amber-400 font-medium ml-1">({selectedIds.size} selected)</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setStatus('INTERESTED')
              setIntent('HIGH')
              showToast('info', 'Filtering Interested Prospects', 'Showing high-intent leads requiring immediate sales follow-up')
            }}
            className="btn-secondary text-xs gap-1.5 flex-1 sm:flex-initial justify-center border-amber-500/40 text-amber-400 bg-amber-500/10"
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Interested Prospects
          </button>
          <button onClick={() => setShowImport(true)} className="btn-secondary text-xs gap-1.5 flex-1 sm:flex-initial justify-center">
            <Upload className="w-3.5 h-3.5" /> {t('common.import', 'Import CSV')}
          </button>
          <button onClick={handleExport} className="btn-secondary text-xs gap-1.5 flex-1 sm:flex-initial justify-center">
            <Download className="w-3.5 h-3.5" /> {t('common.export', 'Export')}
          </button>
          <button onClick={() => setShowAddLead(true)} className="btn-primary text-xs w-full sm:w-auto justify-center" id="add-lead-btn">
            {t('common.create', 'Add Lead')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="panel p-3">
        <div className="flex flex-wrap items-end gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1 text-2xs text-text-muted w-full sm:w-auto mb-1 sm:mb-0">
            <Filter className="w-3 h-3" /> {t('common.filter', 'Filters')}
          </div>
          {([
            { label: 'Industry', value: industry, setter: setIndustry, options: ALL_INDUSTRIES },
            { label: 'Status',   value: status,   setter: setStatus,   options: ALL_STATUSES },
            { label: 'Intent',   value: intent,   setter: setIntent,   options: ALL_INTENTS },
            { label: 'Source',   value: source,   setter: setSource,   options: ALL_SOURCES },
          ] as const).map(f => (
            <div key={f.label} className="w-full sm:w-auto flex-1 sm:flex-initial min-w-[120px]">
              <label className="text-2xs text-text-muted mb-1 block">{f.label}</label>
              <select className="input w-full sm:w-36" value={f.value} onChange={e => f.setter(e.target.value)}>
                {f.options.map((o: string) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 btn-ghost text-xs mt-2 sm:mt-4">
              <X className="w-3 h-3" /> Clear Filters
            </button>
          )}
          <div className="w-full sm:w-auto sm:ml-auto self-end text-2xs text-text-muted text-right">{filtered.length} records</div>
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
      <ImportLeadsModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImportSuccess={(count, newLeads) => {
          if (newLeads && newLeads.length > 0) {
            setLeadsList(prev => [...(newLeads as Lead[]), ...prev])
          }
          showToast('success', 'Import Complete', `${count} leads imported successfully and added to active pipeline`)
        }}
      />

      {/* Add Lead Modal */}
      {showAddLead && (
        <div className="modal-overlay" onClick={() => setShowAddLead(false)}>
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <span className="section-title">Add New Lead</span>
              <button onClick={() => setShowAddLead(false)}><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault()
                if (!newLead.name.trim() || !newLead.company.trim()) {
                  showToast('error', 'Required Fields Missing', 'Please provide prospect name and company')
                  return
                }
                const score = Number(newLead.intentScore) || 75
                const created: Lead = {
                  id: `LEAD-${Date.now()}`,
                  name: newLead.name.trim(),
                  company: newLead.company.trim(),
                  jobTitle: newLead.jobTitle.trim() || 'Decision Maker',
                  industry: newLead.industry,
                  location: newLead.location,
                  country: newLead.location.includes('India') ? 'India' : 'USA',
                  email: newLead.email.trim() || `${newLead.name.toLowerCase().replace(/\s+/g, '.')}@${newLead.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                  phone: newLead.phone.trim() || '+91-98765-43210',
                  intentScore: score,
                  intent: score >= 85 ? 'HIGH' : score >= 65 ? 'MEDIUM' : 'LOW',
                  status: 'NEW',
                  source: (newLead.source as Lead['source']) || 'LinkedIn',
                  sourceUrl: 'https://linkedin.com',
                  linkedin: `https://linkedin.com/in/${newLead.name.toLowerCase().replace(/\s+/g, '-')}`,
                  website: `https://${newLead.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                  companySize: '51-200',
                  employees: 120,
                  funding: 'Series A ($12M)',
                  hiringStatus: 'Actively Hiring',
                  techStack: ['React', 'TypeScript', 'Node.js', 'AWS'],
                  competitors: [],
                  aiReasoning: 'Newly added inbound high-intent prospect requiring immediate AI outreach',
                  aiRecommendations: ['Queue for AI voice qualification', 'Send product intro deck'],
                  discoveredAt: new Date(),
                  enrichedAt: new Date(),
                  lastActivity: new Date(),
                  requirement: newLead.requirement.trim() || 'Expressed interest in AI sales automation and lead qualification.',
                  budgetSignal: score >= 80 ? 'HIGH' : 'MEDIUM',
                  timeline: 'Within 30 days',
                  decisionMaker: true,
                  needClarity: 85,
                  urgency: 80,
                  budgetScore: score >= 80 ? 88 : 70,
                  authorityScore: 85,
                  fitScore: score,
                  campaignId: null,
                  nextAction: 'Initiate initial AI voice qualification call',
                  tags: ['Direct Inbound', 'New Prospect'],
                }
                setLeadsList(prev => [created, ...prev])
                setShowAddLead(false)
                setNewLead({
                  name: '',
                  company: '',
                  jobTitle: '',
                  industry: 'IT Services',
                  location: 'Bangalore, India',
                  email: '',
                  phone: '',
                  source: 'LinkedIn',
                  intentScore: 85,
                  requirement: '',
                })
                showToast('success', 'Lead Added', `${created.name} (${created.company}) has been added`)
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Full Name *</label>
                  <input
                    required
                    className="input text-xs"
                    placeholder="e.g. Ramesh Varma"
                    value={newLead.name}
                    onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Company Name *</label>
                  <input
                    required
                    className="input text-xs"
                    placeholder="e.g. CloudMatrix Infotech"
                    value={newLead.company}
                    onChange={e => setNewLead(p => ({ ...p, company: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Job Title</label>
                  <input
                    className="input text-xs"
                    placeholder="e.g. VP of Engineering"
                    value={newLead.jobTitle}
                    onChange={e => setNewLead(p => ({ ...p, jobTitle: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Industry</label>
                  <select
                    className="input text-xs"
                    value={newLead.industry}
                    onChange={e => setNewLead(p => ({ ...p, industry: e.target.value }))}
                  >
                    {ALL_INDUSTRIES.filter(i => i !== 'All').map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Corporate Email</label>
                  <input
                    type="email"
                    className="input text-xs"
                    placeholder="prospect@company.com"
                    value={newLead.email}
                    onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Phone Number</label>
                  <input
                    className="input text-xs"
                    placeholder="+91-98765-00000"
                    value={newLead.phone}
                    onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Location</label>
                  <input
                    className="input text-xs"
                    placeholder="e.g. Mumbai, India"
                    value={newLead.location}
                    onChange={e => setNewLead(p => ({ ...p, location: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Lead Source</label>
                  <select
                    className="input text-xs"
                    value={newLead.source}
                    onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))}
                  >
                    {ALL_SOURCES.filter(s => s !== 'All').map(src => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Intent Score (0-100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="input text-xs font-mono"
                    value={newLead.intentScore}
                    onChange={e => setNewLead(p => ({ ...p, intentScore: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Requirement / AI Notes</label>
                <textarea
                  rows={2}
                  className="input resize-none text-xs"
                  placeholder="Details about buyer timeline, technology evaluation, pain points..."
                  value={newLead.requirement}
                  onChange={e => setNewLead(p => ({ ...p, requirement: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => setShowAddLead(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
