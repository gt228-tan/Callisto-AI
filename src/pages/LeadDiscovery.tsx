import { useState } from 'react'
import { Radar, Play, CheckSquare, Square, ExternalLink, X, Building2, Globe, Phone, Mail, Linkedin, Star, Megaphone } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { IntentScore, ScoreBar } from '@/components/ui/IntentScore'
import { intentBadge, leadStatusBadge } from '@/components/ui/StatusBadge'
import { AIProgressSteps } from '@/components/ui/States'
import { leads, type Lead } from '@/data/leads'
import { discoverLeads } from '@/services/aiService'
import { useToast } from '@/contexts/ToastContext'
import { formatDateTime, timeAgo } from '@/lib/utils'

const INDUSTRIES = ['All','IT Services','FinTech','SaaS','Healthcare','Manufacturing','Retail','Education','Insurance','Logistics','Real Estate']
const LOCATIONS   = ['All','India','USA','UK','UAE','Singapore','Germany','France','Brazil','Australia']
const SOURCES     = ['LinkedIn','X / Twitter','Company Websites','Public Directories','Freelance Platforms','CRM']
const SIZES       = ['All','1-10','11-50','51-200','201-500','501-1000','1000+']

const aiSteps = [
  'Initializing AI discovery engine...',
  'Scanning LinkedIn for relevant posts...',
  'Crawling public directories and websites...',
  'Analyzing requirements with NLP...',
  'Extracting prospect contact signals...',
  'Enriching company data...',
  'Calculating intent scores...',
  'Deduplicating and ranking results...',
  'Discovery complete!',
]

export function LeadDiscovery() {
  const { showToast } = useToast()
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(SOURCES))
  const [industry, setIndustry]     = useState('All')
  const [location, setLocation]     = useState('All')
  const [companySize, setCompanySize] = useState('All')
  const [keywords, setKeywords]     = useState('')
  const [running, setRunning]       = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  const [hasResults, setHasResults] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const filtered = leads.filter(l =>
    (industry === 'All' || l.industry === industry) &&
    (location === 'All' || l.country === location) &&
    (companySize === 'All' || l.companySize === companySize) &&
    (!keywords || l.name.toLowerCase().includes(keywords.toLowerCase()) ||
      l.company.toLowerCase().includes(keywords.toLowerCase()) ||
      l.requirement.toLowerCase().includes(keywords.toLowerCase()))
  )

  async function runDiscovery() {
    setRunning(true)
    setHasResults(false)
    for (const step of aiSteps) {
      setCurrentStep(step)
      await new Promise(r => setTimeout(r, 500 + Math.random() * 400))
    }
    setRunning(false)
    setHasResults(true)
    showToast('success', `AI Discovery Complete`, `Found ${filtered.length} prospects matching your criteria`)
  }

  function toggleSource(src: string) {
    const next = new Set(selectedSources)
    if (next.has(src)) next.delete(src)
    else next.add(src)
    setSelectedSources(next)
  }

  const columns: Column<Lead>[] = [
    { key: 'name', header: 'Lead Name', sortable: true, render: r => (
      <div>
        <div className="font-medium text-text-primary">{r.name}</div>
        <div className="text-2xs text-text-muted">{r.jobTitle}</div>
      </div>
    )},
    { key: 'company', header: 'Company', sortable: true, render: r => (
      <div>
        <div className="text-text-primary">{r.company}</div>
        <div className="text-2xs text-text-muted">{r.industry}</div>
      </div>
    )},
    { key: 'location',     header: 'Location',     render: r => <span className="text-text-secondary">{r.location}</span> },
    { key: 'requirement',  header: 'Requirement',  render: r => <span className="truncate-2 text-text-secondary" title={r.requirement}>{r.requirement.slice(0,70)}…</span> },
    { key: 'intentScore',  header: 'Intent',       sortable: true, render: r => <IntentScore score={r.intentScore} size="sm" /> },
    { key: 'source',       header: 'Source',       sortable: true, render: r => <span className="badge-blue">{r.source}</span> },
    { key: 'email',        header: 'Email',        render: r => <span className="text-text-muted font-mono text-2xs">{r.email}</span> },
    { key: 'discoveredAt', header: 'Discovered',   render: r => <span className="font-mono text-2xs text-text-muted">{formatDateTime(r.discoveredAt)}</span> },
    { key: 'status',       header: 'Status',       render: r => leadStatusBadge(r.status) },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Radar className="w-4 h-4 text-amber-400" />
        <h1 className="text-sm font-bold text-text-primary">AI Lead Discovery</h1>
      </div>

      {/* Query Builder */}
      <div className="panel p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Keywords</label>
            <input className="input" placeholder="AI implementation, cloud migration..." value={keywords} onChange={e => setKeywords(e.target.value)} />
          </div>
          <div>
            <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Industry</label>
            <select className="input" value={industry} onChange={e => setIndustry(e.target.value)}>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Location</label>
            <select className="input" value={location} onChange={e => setLocation(e.target.value)}>
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Company Size</label>
            <select className="input" value={companySize} onChange={e => setCompanySize(e.target.value)}>
              {SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Sources */}
        <div>
          <label className="text-2xs text-text-muted uppercase tracking-wide mb-2 block">Sources</label>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map(src => {
              const on = selectedSources.has(src)
              return (
                <button key={src} onClick={() => toggleSource(src)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs transition-all ${on ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'border-bg-border text-text-muted hover:border-bg-hover'}`}>
                  {on ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />} {src}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={runDiscovery} disabled={running}
            className="btn-primary gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            <Play className="w-3.5 h-3.5" />
            {running ? 'AI RUNNING...' : 'RUN AI DISCOVERY'}
          </button>
          <span className="text-2xs text-text-muted">{filtered.length} matching leads in database</span>
        </div>

        {/* AI Progress */}
        {running && (
          <AIProgressSteps currentStep={currentStep} steps={aiSteps} />
        )}
      </div>

      {/* Results */}
      {hasResults && (
        <div className="panel flex flex-col">
          <div className="section-header">
            <div className="flex items-center gap-3">
              <span className="section-title">Discovery Results</span>
              <span className="badge-success">{filtered.length} PROSPECTS</span>
              <span className="text-2xs text-text-muted">{filtered.filter(l => l.intent === 'HIGH').length} high intent</span>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-2xs">Export CSV</button>
              <button className="btn-primary text-2xs">Add to Campaign</button>
            </div>
          </div>
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={r => r.id}
            pageSize={10}
            searchable
            searchPlaceholder="Filter results..."
            searchKeys={['name', 'company', 'industry', 'location', 'requirement']}
            onRowClick={row => setSelectedLead(row)}
            emptyMessage="No leads match current filters. Try broadening your search."
          />
        </div>
      )}

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedLead(null)} />
          <div className="drawer-panel p-0 flex flex-col">
            <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
          </div>
        </>
      )}
    </div>
  )
}

export function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { showToast } = useToast()
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-bg-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-sm font-bold text-amber-400">
            {lead.name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">{lead.name}</div>
            <div className="text-xs text-text-muted">{lead.jobTitle} · {lead.company}</div>
          </div>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Score */}
        <div className="flex items-center justify-between p-3 bg-bg-card border border-bg-border rounded">
          <div>
            <div className="text-2xs text-text-muted uppercase tracking-wide mb-1">AI Lead Score</div>
            <IntentScore score={lead.intentScore} size="lg" />
          </div>
          <div className="text-right">
            <div className="text-2xs text-text-muted uppercase tracking-wide mb-1">Intent Level</div>
            {intentBadge(lead.intent)}
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded">
          <div className="text-2xs text-amber-400 font-semibold uppercase tracking-wide mb-2">AI Reasoning</div>
          <p className="text-xs text-text-primary leading-relaxed">{lead.aiReasoning}</p>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-1.5">
          <div className="text-2xs text-text-muted uppercase tracking-wide font-medium mb-2">BANT Score Breakdown</div>
          <ScoreBar label="Need Clarity"       value={lead.needClarity}    color="amber" />
          <ScoreBar label="Urgency"            value={lead.urgency}        color="amber" />
          <ScoreBar label="Budget Signal"      value={lead.budgetScore}    color={lead.budgetScore >= 80 ? 'green' : 'blue'} />
          <ScoreBar label="Decision Authority" value={lead.authorityScore} color={lead.decisionMaker ? 'green' : 'blue'} />
          <ScoreBar label="Fit Score"          value={lead.fitScore}       color="green" />
        </div>

        {/* Contact */}
        <div className="space-y-1.5">
          <div className="text-2xs text-text-muted uppercase tracking-wide font-medium mb-2">Contact Information</div>
          {[
            { icon: <Mail className="w-3.5 h-3.5" />, label: lead.email },
            { icon: <Phone className="w-3.5 h-3.5" />, label: lead.phone },
            { icon: <Linkedin className="w-3.5 h-3.5" />, label: lead.linkedin },
            { icon: <Globe className="w-3.5 h-3.5" />, label: lead.website },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="text-text-muted">{item.icon}</span>
              <span className="font-mono">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Company Intelligence */}
        <div className="p-3 bg-bg-card border border-bg-border rounded space-y-2">
          <div className="flex items-center gap-2 text-2xs text-text-muted uppercase tracking-wide font-medium mb-2">
            <Building2 className="w-3 h-3" /> Company Intelligence
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-text-muted">Employees:</span> <span className="text-text-primary">{lead.employees.toLocaleString()}</span></div>
            <div><span className="text-text-muted">Funding:</span> <span className="text-text-primary">{lead.funding}</span></div>
            <div><span className="text-text-muted">Hiring:</span> <span className="text-text-primary">{lead.hiringStatus}</span></div>
            <div><span className="text-text-muted">Size:</span> <span className="text-text-primary">{lead.companySize}</span></div>
          </div>
          <div className="mt-2">
            <div className="text-2xs text-text-muted mb-1">Tech Stack</div>
            <div className="flex flex-wrap gap-1">
              {lead.techStack.map(t => <span key={t} className="badge-blue">{t}</span>)}
            </div>
          </div>
        </div>

        {/* Original Requirement */}
        <div className="p-3 bg-bg-card border border-bg-border rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xs text-text-muted uppercase tracking-wide font-medium">Original Requirement</div>
            <span className="badge-blue">{lead.source}</span>
          </div>
          <p className="text-xs text-text-primary leading-relaxed">{lead.requirement}</p>
          <a href={lead.sourceUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-2xs text-amber-400 hover:underline mt-2">
            <ExternalLink className="w-3 h-3" /> View Original Post
          </a>
        </div>

        {/* AI Recommendations */}
        <div className="p-3 bg-info-dim border border-info/20 rounded">
          <div className="text-2xs text-info-bright font-semibold uppercase tracking-wide mb-2">AI Recommendations</div>
          <ul className="space-y-1">
            {lead.aiRecommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-primary">
                <Star className="w-3 h-3 text-info-bright shrink-0 mt-0.5" /> {rec}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-2xs text-text-muted">
          Discovered {timeAgo(lead.discoveredAt)} · Source: {lead.source}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-bg-border grid grid-cols-2 gap-2">
        <button className="btn-primary text-xs" onClick={() => showToast('success', 'Call Initiated', `Connecting to ${lead.name}...`)}>
          <Phone className="w-3.5 h-3.5" /> Call Now
        </button>
        <button className="btn-secondary text-xs" onClick={() => showToast('info', 'Added to Campaign', `${lead.name} added to active campaign`)}>
          <Megaphone className="w-3.5 h-3.5" /> Add to Campaign
        </button>
        <button className="btn-info text-xs" onClick={() => showToast('success', 'Added to CRM', `${lead.name} synced to Salesforce`)}>
          Add to CRM
        </button>
        <button className="btn-success text-xs" onClick={() => showToast('success', 'Lead Qualified', `${lead.name} marked as Qualified`)}>
          Mark Qualified
        </button>
      </div>
    </div>
  )
}

