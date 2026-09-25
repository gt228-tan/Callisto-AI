import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Download, Upload, Filter, X, Star, Sparkles, PhoneCall,
  ChevronDown, FileSpreadsheet, Plus, CheckSquare, Trash2, Megaphone,
  Link2, CheckCircle2
} from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { IntentScore } from '@/components/ui/IntentScore'
import { intentBadge, leadStatusBadge } from '@/components/ui/StatusBadge'
import { type Lead, type LeadStatus, type IntentLevel, getLeadLanguage } from '@/data/leads'
import { SUPPORTED_LANGUAGES } from '@/lib/languages'
import { formatDate, timeAgo } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { useAppContext } from '@/contexts/AppContext'
import { useLeads } from '@/contexts/LeadContext'
import { useCampaigns } from '@/contexts/CampaignContext'
import { exportLeadsToExcel, exportLeadsToCSV, downloadCallistoTemplate } from '@/lib/excelLeads'
import { loadCrms, addSyncLog } from '@/services/crmService'
import { LeadDrawer } from './LeadDiscovery'
import { ImportLeadsModal } from '@/components/ui/ImportLeadsModal'

export function Leads() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useAppContext()
  const { leadsList, addLeads, deleteLeads } = useLeads()
  const { campaignList, addCampaign, updateCampaign } = useCampaigns()

  const [industry, setIndustry]   = useState<string>('All')
  const [status,   setStatus]     = useState<string>('All')
  const [intent,   setIntent]     = useState<string>('All')
  const [source,   setSource]     = useState<string>('All')
  const [langFilter, setLangFilter] = useState<string>('All')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showAddLead, setShowAddLead] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showAddToCampaignModal, setShowAddToCampaignModal] = useState(false)
  const [targetCampaignToAssign, setTargetCampaignToAssign] = useState<string>('')
  const [showPushToCrmModal, setShowPushToCrmModal] = useState(false)
  const [targetCrmId, setTargetCrmId] = useState<string>('salesforce')

  function handlePushSelectedToCrm() {
    const availableCrms = loadCrms()
    const targetCrm = availableCrms.find(c => c.id === targetCrmId) || availableCrms[0]
    const count = selectedIds.size
    addSyncLog({
      integrationId: targetCrm.id,
      integrationName: targetCrm.name,
      type: 'CRM_PUSH',
      status: 'SUCCESS',
      recordsCount: count,
      latencyMs: Math.floor(Math.random() * 50) + 110,
      message: `Pushed ${count} qualified leads into ${targetCrm.name}`,
      payloadSummary: JSON.stringify({ leadIds: Array.from(selectedIds), targetCrm: targetCrm.id, count })
    })
    showToast('success', 'Pushed to CRM', `Successfully pushed ${count} leads to ${targetCrm.name}`)
    setShowPushToCrmModal(false)
  }

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

  // Dynamic filter options based on active leadsList
  const allIndustries = useMemo(() => ['All', ...Array.from(new Set(leadsList.map(l => l.industry))).filter(Boolean).sort()], [leadsList])
  const allStatuses: (LeadStatus | 'All')[] = ['All','NEW','ENRICHED','QUALIFIED','CONTACTED','INTERESTED','MEETING','OPPORTUNITY','WON','LOST','NOT_QUALIFIED']
  const allIntents: (IntentLevel | 'All')[] = ['All','HIGH','MEDIUM','LOW']
  const defaultSources = ['LinkedIn', 'Apollo.io', 'ZoomInfo', 'Google Maps', 'Clay.com', 'Hunter.io', 'Inbound Webhook', 'CSV / Excel Import', 'Company Website']
  const allSources = useMemo(() => ['All', ...Array.from(new Set([...defaultSources, ...leadsList.map(l => l.source)])).filter(Boolean).sort()], [leadsList])

  const filtered = leadsList.filter(l =>
    (industry === 'All' || l.industry === industry) &&
    (status   === 'All' || l.status   === status) &&
    (intent   === 'All' || l.intent   === intent) &&
    (source   === 'All' || l.source   === source) &&
    (langFilter === 'All' || getLeadLanguage(l) === langFilter)
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
    { key: 'language', header: 'Language', render: r => {
      const l = getLeadLanguage(r)
      const info = SUPPORTED_LANGUAGES[l] || { flag: '🌐', nativeName: l }
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-3xs font-medium border border-bg-border bg-bg-card text-text-primary" title={`Detected based on ${r.location}`}>
          <span>{info.flag}</span>
          <span className="font-semibold">{info.nativeName}</span>
        </span>
      )
    }},
    { key: 'intentScore', header: 'Intent', sortable: true, render: r => <IntentScore score={r.intentScore} size="sm" /> },
    { key: 'source',   header: 'Source',   render: r => (
      <span className={r.source === 'CSV / Excel Import' ? 'badge-amber font-mono' : 'badge-blue'}>
        {r.source}
      </span>
    )},
    { key: 'status',   header: 'Status',   render: r => leadStatusBadge(r.status) },
    { key: 'discoveredAt', header: 'Discovered', sortable: true, render: r => <span className="text-2xs text-text-muted font-mono">{timeAgo(r.discoveredAt)}</span> },
    { key: 'phone', header: 'Phone', render: r => <span className="text-2xs font-mono text-text-secondary">{r.phone || '—'}</span> },
    { key: 'nextAction', header: 'Next Action', render: r => <span className="text-xs text-text-secondary">{r.nextAction}</span> },
  ]

  // Export handlers
  function handleExportExcel() {
    const targetLeads = selectedIds.size > 0
      ? filtered.filter(l => selectedIds.has(l.id))
      : filtered
    exportLeadsToExcel('callisto_leads_export.xlsx', targetLeads)
    setShowExportMenu(false)
    showToast('success', 'Excel Export Complete', `${targetLeads.length} leads exported to .xlsx`)
  }

  function handleExportCSV() {
    const targetLeads = selectedIds.size > 0
      ? filtered.filter(l => selectedIds.has(l.id))
      : filtered
    exportLeadsToCSV('callisto_leads_export.csv', targetLeads)
    setShowExportMenu(false)
    showToast('success', 'CSV Export Complete', `${targetLeads.length} leads exported to .csv`)
  }

  // Multi-lead Campaign Creation (AI Calling Only)
  function handleLaunchSelectedAiCalling() {
    const selectedList = leadsList.filter(l => selectedIds.has(l.id))
    if (selectedList.length === 0) return

    const leadIdsArray = selectedList.map(l => l.id)
    const primaryLead = selectedList[0]
    const detectedLang = getLeadLanguage(primaryLead)
    const langName = detectedLang === 'gu' ? 'Gujarati' : detectedLang === 'hi' ? 'Hindi' : 'English'

    const camp = addCampaign({
      name: `AI Calling: Batch (${selectedList.length} Leads)`,
      target: `${selectedList.length} Selected Leads (Direct AI Calling)`,
      type: 'AI_CALLING_ONLY',
      sourceType: 'SELECTED_LEADS',
      leadIds: leadIdsArray,
      leads: leadIdsArray.length,
      language: langName,
      voice: langName === 'Gujarati' ? 'Gaurav (Native Gujarati Male)' : langName === 'Hindi' ? 'Swara (Native Hindi Female)' : 'Aria (Professional English Female)',
      tone: 'Consultative',
      objective: 'Autonomous voice qualification for custom selected leads. AI lead discovery bypassed.',
      greeting: langName === 'Gujarati'
        ? 'નમસ્તે, હું Callisto AI Solutions માંથી બોલું છું. શું આપની પાસે 2 મિનિટનો સમય છે?'
        : langName === 'Hindi'
        ? 'नमस्ते, मैं Callisto AI Solutions से बात कर रही हूँ। क्या आपके पास 2 मिनट का समय है?'
        : "Hello, I'm calling from Callisto AI Solutions. Do you have 2 minutes to discuss sales automation?",
    })

    setSelectedIds(new Set())
    showToast('success', 'AI Calling Campaign Created!', `"${camp.name}" launched with ${selectedList.length} leads.`)
    navigate(`/ai-voice-agent?campaign=${camp.id}&lead=${primaryLead.id}`)
  }

  function handleAssignToCampaign() {
    if (!targetCampaignToAssign) return
    const camp = campaignList.find(c => c.id === targetCampaignToAssign)
    if (!camp) return

    const newLeadIds = Array.from(new Set([...(camp.leadIds || []), ...Array.from(selectedIds)]))
    updateCampaign(camp.id, {
      leadIds: newLeadIds,
      leads: newLeadIds.length,
    })

    showToast('success', 'Leads Assigned to Campaign', `${selectedIds.size} leads added to "${camp.name}".`)
    setSelectedIds(new Set())
    setShowAddToCampaignModal(false)
  }

  function handleDeleteSelected() {
    if (confirm(`Are you sure you want to delete ${selectedIds.size} selected leads?`)) {
      deleteLeads(Array.from(selectedIds))
      setSelectedIds(new Set())
      showToast('info', 'Leads Deleted', 'Selected leads have been removed.')
    }
  }

  function clearFilters() {
    setIndustry('All'); setStatus('All'); setIntent('All'); setSource('All'); setLangFilter('All')
  }

  const hasFilters = industry !== 'All' || status !== 'All' || intent !== 'All' || source !== 'All' || langFilter !== 'All'

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-bg-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">{t('nav.leads', 'Leads')}</h1>
              <span className="text-xs text-text-muted font-mono">({leadsList.length} total)</span>
              {selectedIds.size > 0 && (
                <span className="text-xs text-amber-400 font-semibold font-mono">({selectedIds.size} selected)</span>
              )}
            </div>
            <p className="text-2xs text-text-muted font-mono hidden sm:block">
              Qualified enterprise prospects, intent scores, and omnichannel enrichment telemetry
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => {
              setStatus('INTERESTED')
              setIntent('HIGH')
              showToast('info', 'Filtering Interested Prospects', 'Showing high-intent leads requiring immediate sales follow-up')
            }}
            className="btn-secondary text-xs py-2 px-3 gap-1.5 justify-center border-amber-500/40 text-amber-400 bg-amber-500/10 font-medium"
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Interested</span>
          </button>

          <button
            onClick={() => setShowImport(true)}
            className="btn-secondary text-xs py-2 px-3 gap-1.5 justify-center border-amber-500/30 font-medium"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Import CSV</span>
          </button>

          {/* Export Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(p => !p)}
              className="btn-secondary text-xs py-2 px-3 gap-1.5 w-full justify-center font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-1.5 w-52 bg-bg-card border border-bg-border rounded-xl shadow-2xl p-1.5 z-30 text-xs animate-fade-in space-y-1">
                  <button
                    onClick={handleExportExcel}
                    className="w-full text-left px-2.5 py-2 rounded hover:bg-bg-hover text-text-primary flex items-center gap-2 font-medium"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export as Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-2.5 py-2 rounded hover:bg-bg-hover text-text-primary flex items-center gap-2 font-medium"
                  >
                    <Download className="w-3.5 h-3.5 text-info-bright" />
                    <span>Export as CSV (.csv)</span>
                  </button>
                  <div className="border-t border-bg-border my-1" />
                  <button
                    onClick={() => {
                      downloadCallistoTemplate('xlsx')
                      setShowExportMenu(false)
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-amber-400 flex items-center gap-2 text-3xs font-mono"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download .xlsx Template</span>
                  </button>
                  <button
                    onClick={() => {
                      downloadCallistoTemplate('csv')
                      setShowExportMenu(false)
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-amber-400 flex items-center gap-2 text-3xs font-mono"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download .csv Template</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowAddLead(true)}
            className="btn-primary text-xs py-2 px-3.5 justify-center font-semibold shadow-md shadow-amber-500/20"
            id="add-lead-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('common.create', 'Add Lead')}</span>
          </button>
        </div>
      </div>

      {/* Floating Multi-Lead Action Banner */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-gradient-to-r from-amber-500/15 via-bg-card to-amber-500/10 border border-amber-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
              {selectedIds.size}
            </div>
            <div>
              <span className="text-xs font-bold text-text-primary">
                {selectedIds.size} Leads Selected
              </span>
              <span className="text-3xs text-text-muted block">
                Launch multiple-lead AI voice campaign or assign directly to existing campaigns
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={handleLaunchSelectedAiCalling}
              className="btn-primary text-xs py-1.5 px-3.5 font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5"
              title="Launch autonomous AI voice calling on selected leads without web discovery"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>🚀 AI Calling Only Campaign</span>
            </button>

            <button
              onClick={() => setShowAddToCampaignModal(true)}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Megaphone className="w-3.5 h-3.5 text-text-muted" />
              <span>Add to Campaign</span>
            </button>

            <button
              onClick={() => setShowPushToCrmModal(true)}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 hover:text-amber-400"
              title="Push selected leads to connected CRM"
            >
              <Link2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Push to CRM</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="btn-secondary text-xs py-1.5 px-2.5"
              title="Export selected leads as .xlsx"
            >
              .xlsx
            </button>

            <button
              onClick={handleExportCSV}
              className="btn-secondary text-xs py-1.5 px-2.5"
              title="Export selected leads as .csv"
            >
              .csv
            </button>

            <button
              onClick={handleDeleteSelected}
              className="btn-ghost text-xs p-1.5 text-danger-bright hover:bg-danger/10 rounded"
              title="Delete selected leads"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="btn-ghost text-3xs text-text-muted hover:text-text-primary px-2"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="panel p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 border-b border-bg-border/60 pb-2.5">
          <div className="flex items-center gap-1.5 text-xs text-text-primary font-semibold font-mono">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('common.filter', 'Telemetry Filters')}</span>
            {hasFilters && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ACTIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-2xs text-amber-400 hover:underline cursor-pointer">
                <X className="w-3 h-3" /> Clear Filters
              </button>
            )}
            <span className="text-2xs text-text-muted font-mono">{filtered.length} records</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3 sm:gap-4">
          {([
            { label: 'Industry', value: industry, setter: setIndustry, options: allIndustries },
            { label: 'Status',   value: status,   setter: setStatus,   options: allStatuses },
            { label: 'Intent',   value: intent,   setter: setIntent,   options: allIntents },
            { label: 'Source',   value: source,   setter: setSource,   options: allSources },
          ] as const).map(f => (
            <div key={f.label} className="w-full sm:w-auto flex-1 sm:flex-initial min-w-[130px]">
              <label className="text-2xs text-text-muted mb-1.5 block font-medium">{f.label}</label>
              <select className="input w-full sm:w-36 h-9" value={f.value} onChange={e => f.setter(e.target.value)}>
                {f.options.map((o: string) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="w-full sm:w-auto col-span-2 sm:col-span-1 flex-1 sm:flex-initial min-w-[140px]">
            <label className="text-2xs text-text-muted mb-1.5 block font-medium">Language</label>
            <select className="input w-full sm:w-40 h-9" value={langFilter} onChange={e => setLangFilter(e.target.value)}>
              <option value="All">All Languages</option>
              <option value="gu">🇮🇳 ગુજરાતી (Gujarati)</option>
              <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>
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
          searchPlaceholder="Search leads by name, company, email, phone, location..."
          searchKeys={['name', 'company', 'industry', 'location', 'email', 'phone']}
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
        onImportSuccess={(count) => {
          showToast('success', 'Import Complete', `${count} leads processed and added to platform`)
        }}
      />

      {/* Add To Campaign Modal */}
      {showAddToCampaignModal && (
        <div className="modal-overlay" onClick={() => setShowAddToCampaignModal(false)}>
          <div className="modal-panel max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <span className="section-title">Add {selectedIds.size} Leads to Campaign</span>
              <button onClick={() => setShowAddToCampaignModal(false)}><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="text-text-muted">
                Select an active or scheduled campaign to append these {selectedIds.size} leads into:
              </div>

              <select
                className="input w-full text-xs"
                value={targetCampaignToAssign}
                onChange={e => setTargetCampaignToAssign(e.target.value)}
              >
                <option value="">-- Choose Campaign --</option>
                {campaignList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.agent} · {c.leads} leads)
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2 pt-2 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => setShowAddToCampaignModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignToCampaign}
                  disabled={!targetCampaignToAssign}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  Assign Leads
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Lead Modal */}
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
                const created: Partial<Lead> = {
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
                addLeads([created])
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
                    {allIndustries.filter(i => i !== 'All').map(ind => (
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
                    {allSources.filter(s => s !== 'All').map(src => (
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

      {/* Push to CRM Modal */}
      {showPushToCrmModal && (
        <div className="modal-overlay" onClick={() => setShowPushToCrmModal(false)}>
          <div className="modal-panel max-w-md" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-amber-400" />
                <span className="section-title">Push {selectedIds.size} Leads to CRM</span>
              </div>
              <button onClick={() => setShowPushToCrmModal(false)}><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-2xs text-text-secondary">
                Select your connected CRM destination. Lead fields (Name, Email, Phone, Company, AI Intent Score, Qualification details) will be mapped and synchronized.
              </p>
              <div>
                <label className="text-2xs text-text-muted uppercase tracking-wide mb-1.5 block">Select Destination CRM</label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {loadCrms().map(crm => (
                    <label
                      key={crm.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        targetCrmId === crm.id ? 'bg-amber-500/10 border-amber-500/50' : 'bg-bg-card border-bg-border hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{crm.logo}</span>
                        <div>
                          <div className="font-semibold text-text-primary text-xs">{crm.name}</div>
                          <div className="text-3xs text-text-muted">{crm.desc}</div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="crmTarget"
                        value={crm.id}
                        checked={targetCrmId === crm.id}
                        onChange={() => setTargetCrmId(crm.id)}
                        className="accent-amber-400"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-bg-border">
                <button onClick={() => setShowPushToCrmModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button onClick={handlePushSelectedToCrm} className="btn-primary text-xs py-1.5 px-3.5 gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Push {selectedIds.size} Leads</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
