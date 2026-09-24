import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Megaphone, Plus, Pause, Play, Eye, BarChart2, X, Check, Download,
  RotateCcw, Clock, Globe, PhoneCall, Upload, FileSpreadsheet, Users,
  Search, Filter, ChevronDown, Sparkles, ExternalLink
} from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { MetricCard } from '@/components/ui/MetricCard'
import { campaignStatusBadge, leadStatusBadge } from '@/components/ui/StatusBadge'
import { type Campaign } from '@/data/campaigns'
import { type Lead, getLeadLanguage } from '@/data/leads'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { useCampaigns } from '@/contexts/CampaignContext'
import { useLeads } from '@/contexts/LeadContext'
import { useAppContext } from '@/contexts/AppContext'
import { exportLeadsToExcel, exportLeadsToCSV } from '@/lib/excelLeads'
import { exportToCSV } from '@/lib/exportCsv'
import { ImportLeadsModal } from '@/components/ui/ImportLeadsModal'
import { SUPPORTED_LANGUAGES } from '@/lib/languages'

const WIZARD_STEPS = ['Campaign Mode & Details', 'Select Leads', 'Voice Agent', 'Objectives', 'Schedule & Location', 'Review & Launch']

export function Campaigns() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { language, t } = useAppContext()
  const { campaignList, addCampaign, togglePause: togglePauseCampaign, updateCampaign } = useCampaigns()
  const { leadsList } = useLeads()

  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep]   = useState(0)
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [leadSelectTab, setLeadSelectTab] = useState<'table' | 'segment'>('table')
  const [leadSearchQuery, setLeadSearchQuery] = useState('')
  const [selectedCampaignForDrawer, setSelectedCampaignForDrawer] = useState<Campaign | null>(null)
  const [showDirectUploadModal, setShowDirectUploadModal] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const [wizardData, setWizardData] = useState({
    name: '',
    target: '',
    type: 'AI_CALLING_ONLY' as 'AI_CALLING_ONLY' | 'AI_DISCOVERY_CALLING',
    language: 'English',
    voice: 'Professional Female',
    tone: 'Consultative',
    objective: '',
    greeting: '',
    scheduleStart: 'Immediately',
    timezone: 'Prospect Local Time (09:00 - 17:00)',
    region: 'India & South Asia (IST)',
    maxRetries: '3',
    retryInterval: '24 hours',
    onlyBusinessHours: true,
  })

  const active    = campaignList.filter(c => c.status === 'ACTIVE').length
  const scheduled = campaignList.filter(c => c.status === 'SCHEDULED').length
  const totalCalls = campaignList.reduce((s, c) => s + c.calls, 0)
  const totalAnswered = campaignList.reduce((s, c) => s + c.answered, 0)
  const totalQualified = campaignList.reduce((s, c) => s + c.qualified, 0)
  const totalMeetings = campaignList.reduce((s, c) => s + c.meetings, 0)
  const avgConversion = campaignList.length > 0
    ? (campaignList.reduce((s, c) => s + c.conversion, 0) / campaignList.length).toFixed(1)
    : '0'

  function togglePause(id: string) {
    const camp = campaignList.find(c => c.id === id)
    togglePauseCampaign(id)
    showToast('info', camp?.status === 'ACTIVE' ? 'Campaign Paused' : 'Campaign Resumed', camp?.name ?? '')
  }

  function repeatCampaign(camp: Campaign) {
    const repeated = addCampaign({
      name: `[Repeat] ${camp.name}`,
      target: camp.target,
      agent: camp.agent,
      status: 'ACTIVE',
      language: camp.language,
      voice: camp.voice,
      tone: camp.tone,
      type: camp.type,
      leadIds: camp.leadIds,
      leads: camp.leadIds?.length || camp.leads,
      objective: `Re-dialing unanswered and high-intent leads from ${camp.name}`,
      greeting: `Hello, this is follow-up outreach regarding our earlier discussion.`,
    })
    showToast('success', 'Campaign Repeated!', `"${repeated.name}" is launched with automated retry schedule.`)
  }

  function launchCampaign() {
    const assignedIds = Array.from(selectedLeadIds)
    const effectiveLeadsCount = assignedIds.length > 0 ? assignedIds.length : Math.floor(Math.random() * 50) + 10

    const newCamp = addCampaign({
      name: wizardData.name || (wizardData.type === 'AI_CALLING_ONLY' ? 'AI Calling Only Campaign' : 'Enterprise Outreach Campaign'),
      target: wizardData.target || `${effectiveLeadsCount} Selected Contacts`,
      agent: `${wizardData.voice} Agent`,
      status: 'ACTIVE',
      language: wizardData.language,
      voice: wizardData.voice,
      tone: wizardData.tone,
      type: wizardData.type,
      leadIds: assignedIds,
      leads: effectiveLeadsCount,
      sourceType: assignedIds.length > 0 ? 'SELECTED_LEADS' : 'AI_DISCOVERED',
      objective: wizardData.objective,
      greeting: wizardData.greeting,
    })

    setShowWizard(false)
    setWizardStep(0)
    setSelectedLeadIds(new Set())
    setWizardData({
      name: '', target: '', type: 'AI_CALLING_ONLY', language: 'English', voice: 'Professional Female',
      tone: 'Consultative', objective: '', greeting: '',
      scheduleStart: 'Immediately', timezone: 'Prospect Local Time (09:00 - 17:00)',
      region: 'India & South Asia (IST)',
      maxRetries: '3', retryInterval: '24 hours',
      onlyBusinessHours: true,
    })

    showToast('success', 'Campaign Launched!', `"${newCamp.name}" is now active with ${effectiveLeadsCount} leads.`)

    if (assignedIds.length > 0) {
      navigate(`/ai-voice-agent?campaign=${newCamp.id}&lead=${assignedIds[0]}`)
    }
  }

  // Filter leads for selection step in wizard
  const selectableLeads = useMemo(() => {
    if (!leadSearchQuery) return leadsList
    const q = leadSearchQuery.toLowerCase()
    return leadsList.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q) ||
      l.jobTitle.toLowerCase().includes(q) ||
      l.location.toLowerCase().includes(q) ||
      l.industry.toLowerCase().includes(q)
    )
  }, [leadsList, leadSearchQuery])

  const columns: Column<Campaign>[] = [
    { key: 'name', header: 'Campaign', sortable: true, render: r => (
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-text-primary">{r.name}</span>
          {r.type === 'AI_CALLING_ONLY' && (
            <span className="badge-amber text-3xs font-mono px-1 py-0.5 rounded flex items-center gap-1">
              <PhoneCall className="w-2.5 h-2.5" /> Calling Only
            </span>
          )}
        </div>
        <div className="text-2xs text-text-muted">{r.target}</div>
      </div>
    )},
    { key: 'agent', header: 'Agent', render: r => (
      <div>
        <div className="text-text-primary text-xs font-medium">{r.agent}</div>
        <div className="text-3xs text-text-muted">{r.language} · {r.tone}</div>
      </div>
    )},
    { key: 'status', header: 'Status', render: r => campaignStatusBadge(r.status) },
    { key: 'leads', header: 'Leads', sortable: true, render: r => {
      const count = r.leadIds && r.leadIds.length > 0 ? r.leadIds.length : r.leads
      return (
        <button
          onClick={e => {
            e.stopPropagation()
            setSelectedCampaignForDrawer(r)
          }}
          className="font-mono text-amber-400 hover:underline flex items-center gap-1 font-semibold"
          title="Click to view assigned leads in this campaign"
        >
          <span>{count}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
        </button>
      )
    }},
    { key: 'calls', header: 'Calls', sortable: true, render: r => <span className="font-mono">{r.calls}</span> },
    { key: 'answered', header: 'Answered', render: r => <span className="font-mono text-success">{r.answered}</span> },
    { key: 'qualified', header: 'Qualified', render: r => <span className="font-mono text-amber-400">{r.qualified}</span> },
    { key: 'meetings', header: 'Meetings', render: r => <span className="font-mono text-info-bright">{r.meetings}</span> },
    { key: 'conversion', header: 'Conv %', sortable: true, render: r => (
      <span className={`font-mono font-bold ${r.conversion >= 12 ? 'text-success' : 'text-text-muted'}`}>
        {r.conversion}%
      </span>
    )},
    { key: 'createdAt', header: 'Created', render: r => <span className="text-2xs text-text-muted font-mono">{formatDate(r.createdAt)}</span> },
    { key: 'actions', header: 'Actions', render: r => (
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        {(r.status === 'ACTIVE' || r.status === 'PAUSED') && (
          <button onClick={() => togglePause(r.id)} className="btn-ghost p-1" title={r.status === 'ACTIVE' ? 'Pause' : 'Resume'}>
            {r.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        )}
        <button
          onClick={() => setSelectedCampaignForDrawer(r)}
          className="btn-ghost p-1 hover:text-amber-400"
          title="View Campaign Leads & Dial Queue"
        >
          <Users className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => repeatCampaign(r)}
          className="btn-ghost p-1 hover:text-amber-400"
          title="Repeat Campaign"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => navigate('/analytics')} className="btn-ghost p-1 hover:text-amber-400" title="Analytics">
          <BarChart2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )},
  ]

  function handleExportCampaigns(format: 'csv' | 'xlsx') {
    const data = campaignList.map(c => ({
      'Campaign Name': c.name,
      'Type': c.type === 'AI_CALLING_ONLY' ? 'AI Calling Only' : 'AI Discovery & Calling',
      'Target Audience': c.target,
      'Voice Agent': c.agent,
      'Language': c.language,
      'Status': c.status,
      'Total Leads': c.leadIds?.length || c.leads,
      'Calls Made': c.calls,
      'Answered': c.answered,
      'Qualified': c.qualified,
      'Meetings Booked': c.meetings,
      'Conversion Rate (%)': `${c.conversion}%`,
      'Created Date': formatDate(c.createdAt),
    }))

    if (format === 'xlsx') {
      exportLeadsToExcel('campaigns_summary.xlsx', data as any)
    } else {
      exportToCSV('campaigns_summary.csv', data as any)
    }
    setShowExportMenu(false)
    showToast('success', 'Export Complete', `${campaignList.length} campaigns exported to ${format.toUpperCase()}`)
  }

  // Leads belonging to the currently inspected campaign drawer
  const drawerLeads = useMemo(() => {
    if (!selectedCampaignForDrawer) return []
    if (selectedCampaignForDrawer.leadIds && selectedCampaignForDrawer.leadIds.length > 0) {
      const idSet = new Set(selectedCampaignForDrawer.leadIds)
      const matched = leadsList.filter(l => idSet.has(l.id))
      if (matched.length > 0) return matched
    }
    // Fallback: take slice of leads for demonstration
    return leadsList.slice(0, Math.min(10, selectedCampaignForDrawer.leads))
  }, [selectedCampaignForDrawer, leadsList])

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />
          <h1 className="text-sm font-bold text-text-primary">{t('campaigns.title', 'Campaigns')}</h1>
          <span className="text-2xs text-text-muted font-mono">({campaignList.length} total)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(p => !p)}
              className="btn-secondary text-xs gap-1.5 flex-1 sm:flex-initial justify-center"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-bg-card border border-bg-border rounded-xl shadow-2xl p-1 z-30 text-xs animate-fade-in space-y-1">
                  <button
                    onClick={() => handleExportCampaigns('xlsx')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-bg-hover text-text-primary flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export as Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleExportCampaigns('csv')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-bg-hover text-text-primary flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-info-bright" />
                    <span>Export as CSV (.csv)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Direct AI Calling Only Campaign Button */}
          <button
            onClick={() => {
              setWizardData(p => ({
                ...p,
                name: 'Direct AI Calling Campaign',
                type: 'AI_CALLING_ONLY',
                target: 'Uploaded & Selected Prospects',
              }))
              setShowWizard(true)
            }}
            className="btn-secondary text-xs gap-1.5 flex-1 sm:flex-initial justify-center border-amber-500/40 text-amber-400 bg-amber-500/10"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>AI Calling Only Campaign</span>
          </button>

          <button onClick={() => setShowWizard(true)} className="btn-primary text-xs gap-1.5 flex-1 sm:flex-initial justify-center">
            <Plus className="w-3.5 h-3.5" /> {t('campaigns.create', 'Create Campaign')}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
        <MetricCard label={t('campaigns.active', 'Active')} value={active} accent />
        <MetricCard label={t('campaigns.scheduled', 'Scheduled')} value={scheduled} />
        <MetricCard label={t('campaigns.totalCalls', 'Total Calls')} value={totalCalls} />
        <MetricCard label={t('campaigns.answered', 'Answered')} value={totalAnswered} />
        <MetricCard label={t('metric.qualified', 'Qualified')} value={totalQualified} />
        <MetricCard label={t('metric.meetingsBooked', 'Meetings')} value={totalMeetings} />
        <MetricCard label={t('campaigns.convRate', 'Conv Rate')} value={`${avgConversion}%`} delta={2.1} />
      </div>

      {/* Campaign List Table */}
      <div className="panel flex flex-col">
        <DataTable
          data={campaignList}
          columns={columns}
          keyExtractor={r => r.id}
          pageSize={10}
          searchable
          searchPlaceholder="Search campaigns by name, target, language, agent..."
          searchKeys={['name', 'target', 'agent', 'language']}
          emptyMessage="No campaigns found."
        />
      </div>

      {/* Campaign Leads Drawer */}
      {selectedCampaignForDrawer && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedCampaignForDrawer(null)} />
          <div className="drawer-panel max-w-xl w-full p-0 flex flex-col">
            <div className="p-4 border-b border-bg-border flex items-center justify-between bg-bg-secondary/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">{selectedCampaignForDrawer.name}</span>
                  {selectedCampaignForDrawer.type === 'AI_CALLING_ONLY' && (
                    <span className="badge-amber text-3xs font-mono">AI Calling Only</span>
                  )}
                </div>
                <div className="text-2xs text-text-muted mt-0.5">
                  {selectedCampaignForDrawer.agent} · {drawerLeads.length} leads assigned
                </div>
              </div>
              <button
                onClick={() => setSelectedCampaignForDrawer(null)}
                className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xs uppercase font-bold text-text-muted tracking-wider">
                  Assigned Campaign Leads:
                </span>
                {drawerLeads.length > 0 && (
                  <button
                    onClick={() => {
                      const first = drawerLeads[0]
                      navigate(`/ai-voice-agent?campaign=${selectedCampaignForDrawer.id}&lead=${first.id}`)
                    }}
                    className="btn-primary text-2xs py-1 px-2.5 gap-1"
                  >
                    <PhoneCall className="w-3 h-3" /> Start Voice Dialer
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {drawerLeads.map((lead, i) => {
                  const leadLang = getLeadLanguage(lead)
                  const langInfo = SUPPORTED_LANGUAGES[leadLang]
                  return (
                    <div
                      key={lead.id}
                      className="p-3 rounded-lg border border-bg-border bg-bg-card flex items-center justify-between hover:border-amber-500/40 transition-all text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-text-primary flex items-center gap-1.5">
                          <span>{lead.name}</span>
                          <span className="text-3xs text-text-muted">({lead.jobTitle})</span>
                        </div>
                        <div className="text-3xs text-text-secondary">
                          {lead.company} · {lead.location}
                        </div>
                        <div className="flex items-center gap-2 text-3xs font-mono text-text-muted">
                          <span>📞 {lead.phone || 'No phone'}</span>
                          {langInfo && (
                            <span className="flex items-center gap-0.5 text-text-primary">
                              <span>{langInfo.flag}</span>
                              <span>{langInfo.nativeName}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {leadStatusBadge(lead.status)}
                        <button
                          onClick={() => {
                            navigate(`/ai-voice-agent?campaign=${selectedCampaignForDrawer.id}&lead=${lead.id}`)
                          }}
                          className="btn-secondary text-2xs py-1 px-2 hover:border-amber-500/60 hover:text-amber-400"
                          title="Dial this lead in AI Voice Agent"
                        >
                          Dial Now
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Direct Upload Leads Modal (called from wizard) */}
      <ImportLeadsModal
        isOpen={showDirectUploadModal}
        onClose={() => setShowDirectUploadModal(false)}
        onImportSuccess={(count, parsedLeads) => {
          const ids = parsedLeads.map(l => l.id as string).filter(Boolean)
          ids.forEach(id => selectedLeadIds.add(id))
          setSelectedLeadIds(new Set(selectedLeadIds))
          showToast('success', 'Leads Assigned to Wizard', `${ids.length} uploaded leads selected for this campaign!`)
          setShowDirectUploadModal(false)
        }}
      />

      {/* Campaign Wizard */}
      {showWizard && (
        <div className="modal-overlay" onClick={() => setShowWizard(false)}>
          <div className="modal-panel max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <span className="section-title">
                {wizardData.type === 'AI_CALLING_ONLY' ? 'Create AI Calling Only Campaign' : 'Create Location-Aware Campaign'}
              </span>
              <button onClick={() => setShowWizard(false)}><X className="w-4 h-4 text-text-muted" /></button>
            </div>

            {/* Wizard Steps */}
            <div className="flex items-center gap-1 px-4 sm:px-6 py-3 border-b border-bg-border overflow-x-auto scrollbar-thin">
              {WIZARD_STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-1 shrink-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold ${i < wizardStep ? 'bg-success text-black' : i === wizardStep ? 'bg-amber-500 text-black' : 'bg-bg-border text-text-muted'}`}>
                    {i < wizardStep ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className={`text-2xs ${i === wizardStep ? 'text-amber-400 font-medium' : 'text-text-muted'}`}>{s}</span>
                  {i < WIZARD_STEPS.length - 1 && <span className="text-text-muted mx-1">›</span>}
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-6 space-y-4 min-h-[300px] max-h-[60vh] overflow-y-auto">
              {/* STEP 0: MODE & DETAILS */}
              {wizardStep === 0 && (
                <div className="space-y-4">
                  {/* Mode Picker */}
                  <div className="space-y-1.5">
                    <label className="text-2xs text-text-muted uppercase tracking-wide block font-semibold">
                      Outreach Pipeline Mode *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div
                        onClick={() => setWizardData(p => ({ ...p, type: 'AI_CALLING_ONLY' }))}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          wizardData.type === 'AI_CALLING_ONLY'
                            ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/10'
                            : 'border-bg-border bg-bg-card hover:border-bg-border/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <PhoneCall className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-xs text-text-primary">AI Calling Only</span>
                          <span className="text-3xs font-mono text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">
                            Bypass Discovery
                          </span>
                        </div>
                        <p className="text-3xs text-text-muted mt-1.5 leading-relaxed">
                          Directly upload or select your own leads from Excel, CSV, or CRM. AI Voice SDR starts dialing immediately without scraping web leads.
                        </p>
                      </div>

                      <div
                        onClick={() => setWizardData(p => ({ ...p, type: 'AI_DISCOVERY_CALLING' }))}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          wizardData.type === 'AI_DISCOVERY_CALLING'
                            ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/10'
                            : 'border-bg-border bg-bg-card hover:border-bg-border/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <Globe className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-xs text-text-primary">AI Discovery & Calling</span>
                        </div>
                        <p className="text-3xs text-text-muted mt-1.5 leading-relaxed">
                          Let AI discover requirements on LinkedIn and public directories, enrich data, and then initiate voice qualification.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Campaign Name *</label>
                      <input
                        className="input text-xs"
                        placeholder="e.g. Q4 High-Value Inbound Leads"
                        value={wizardData.name}
                        onChange={e => setWizardData(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Target Audience / Segment</label>
                      <input
                        className="input text-xs"
                        placeholder="e.g. Uploaded Decision Makers in Bangalore & Mumbai"
                        value={wizardData.target}
                        onChange={e => setWizardData(p => ({ ...p, target: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1: SELECT LEADS */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-text-muted">
                      Select leads for this campaign ({selectedLeadIds.size} selected):
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowDirectUploadModal(true)}
                      className="btn-secondary text-2xs py-1 px-2.5 gap-1 text-amber-400 border-amber-500/40 bg-amber-500/10"
                    >
                      <Upload className="w-3 h-3" /> Upload Spreadsheet (.xlsx / .csv)
                    </button>
                  </div>

                  {/* Search and Select All controls */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        className="input text-xs pl-8 w-full"
                        placeholder="Search leads by name, company, location, role..."
                        value={leadSearchQuery}
                        onChange={e => setLeadSearchQuery(e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedLeadIds.size === selectableLeads.length) {
                          setSelectedLeadIds(new Set())
                        } else {
                          setSelectedLeadIds(new Set(selectableLeads.map(l => l.id)))
                        }
                      }}
                      className="btn-ghost text-2xs py-1 px-2 text-text-secondary hover:text-text-primary whitespace-nowrap"
                    >
                      {selectedLeadIds.size === selectableLeads.length ? 'Deselect All' : `Select All (${selectableLeads.length})`}
                    </button>
                  </div>

                  {/* Scrollable Leads Table with Checkboxes */}
                  <div className="border border-bg-border rounded-lg overflow-hidden max-h-56 overflow-y-auto bg-bg-secondary/30 text-2xs">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 bg-bg-card border-b border-bg-border text-3xs text-text-muted text-left font-semibold">
                        <tr>
                          <th className="p-2 w-8"></th>
                          <th className="p-2">Lead</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Language</th>
                          <th className="p-2">Intent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-bg-border">
                        {selectableLeads.map(lead => {
                          const isSelected = selectedLeadIds.has(lead.id)
                          const leadLang = getLeadLanguage(lead)
                          const langInfo = SUPPORTED_LANGUAGES[leadLang]
                          return (
                            <tr
                              key={lead.id}
                              onClick={() => {
                                const next = new Set(selectedLeadIds)
                                if (next.has(lead.id)) next.delete(lead.id)
                                else next.add(lead.id)
                                setSelectedLeadIds(next)
                              }}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-amber-500/10' : 'hover:bg-bg-hover/50'
                              }`}
                            >
                              <td className="p-2 text-center" onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    const next = new Set(selectedLeadIds)
                                    if (next.has(lead.id)) next.delete(lead.id)
                                    else next.add(lead.id)
                                    setSelectedLeadIds(next)
                                  }}
                                  className="rounded border-bg-border text-amber-500"
                                />
                              </td>
                              <td className="p-2">
                                <div className="font-semibold text-text-primary">{lead.name}</div>
                                <div className="text-3xs text-text-muted">{lead.company} · {lead.jobTitle}</div>
                              </td>
                              <td className="p-2 font-mono text-3xs text-text-secondary">{lead.phone || '—'}</td>
                              <td className="p-2 text-3xs">
                                {langInfo ? `${langInfo.flag} ${langInfo.nativeName}` : leadLang}
                              </td>
                              <td className="p-2">
                                <span className={`text-3xs font-mono font-bold ${lead.intent === 'HIGH' ? 'text-danger-bright' : lead.intent === 'MEDIUM' ? 'text-amber-400' : 'text-text-muted'}`}>
                                  {lead.intentScore} ({lead.intent})
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STEP 2: VOICE AGENT */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Primary Language</label>
                      <select
                        className="input text-xs"
                        value={wizardData.language}
                        onChange={e => {
                          const lang = e.target.value
                          let defaultGreeting = wizardData.greeting
                          if (lang === 'Gujarati') defaultGreeting = 'નમસ્તે, હું Callisto AI Solutions માંથી બોલું છું. શું આપની પાસે 2 મિનિટનો સમય છે?'
                          else if (lang === 'Hindi') defaultGreeting = 'नमस्ते, मैं Callisto AI Solutions से बात कर रही हूँ। क्या आपके पास 2 मिनट का समय है?'
                          else defaultGreeting = "Hello, I'm calling from Callisto AI Solutions. Do you have 2 minutes to discuss sales automation?"
                          setWizardData(p => ({ ...p, language: lang, greeting: defaultGreeting }))
                        }}
                      >
                        <option value="English">English (Global / US)</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Voice Profile</label>
                      <select
                        className="input text-xs"
                        value={wizardData.voice}
                        onChange={e => setWizardData(p => ({ ...p, voice: e.target.value }))}
                      >
                        <option value="Gaurav (Native Gujarati Male)">Gaurav (Native Gujarati Male)</option>
                        <option value="Swara (Native Hindi Female)">Swara (Native Hindi Female)</option>
                        <option value="Aria (Professional English Female)">Aria (Professional English Female)</option>
                        <option value="Alex (Professional English Male)">Alex (Professional English Male)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Tone</label>
                      <select
                        className="input text-xs"
                        value={wizardData.tone}
                        onChange={e => setWizardData(p => ({ ...p, tone: e.target.value }))}
                      >
                        <option>Consultative</option>
                        <option>Friendly</option>
                        <option>Professional</option>
                        <option>Formal</option>
                        <option>Energetic</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-2xs text-text-muted uppercase tracking-wide">Greeting Script ({wizardData.language})</label>
                      <div className="flex items-center gap-1.5 text-2xs">
                        <button
                          type="button"
                          onClick={() => setWizardData(p => ({ ...p, language: 'Gujarati', voice: 'Gaurav (Native Gujarati Male)', greeting: 'નમસ્તે, હું Callisto AI Solutions માંથી બોલું છું. શું આપની પાસે 2 મિનિટનો સમય છે?' }))}
                          className="px-1.5 py-0.5 rounded bg-bg-card border border-bg-border hover:border-amber-500/50 text-text-secondary"
                        >
                          🇮🇳 Gujarati Preset
                        </button>
                        <button
                          type="button"
                          onClick={() => setWizardData(p => ({ ...p, language: 'Hindi', voice: 'Swara (Native Hindi Female)', greeting: 'नमस्ते, मैं Callisto AI Solutions से बात कर रही हूँ। क्या आपके पास 2 मिनट का समय है?' }))}
                          className="px-1.5 py-0.5 rounded bg-bg-card border border-bg-border hover:border-amber-500/50 text-text-secondary"
                        >
                          🇮🇳 Hindi Preset
                        </button>
                        <button
                          type="button"
                          onClick={() => setWizardData(p => ({ ...p, language: 'English', voice: 'Aria (Professional English Female)', greeting: "Hello, I'm calling from Callisto AI Solutions. Do you have 2 minutes to discuss sales automation?" }))}
                          className="px-1.5 py-0.5 rounded bg-bg-card border border-bg-border hover:border-amber-500/50 text-text-secondary"
                        >
                          🇺🇸 English Preset
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      className="input text-xs resize-none"
                      placeholder="Hello, I'm calling from..."
                      value={wizardData.greeting}
                      onChange={e => setWizardData(p => ({ ...p, greeting: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: OBJECTIVES */}
              {wizardStep === 3 && (
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Call Objective & Agenda</label>
                  <textarea
                    rows={4}
                    className="input text-xs resize-none"
                    placeholder="Qualify the prospect, answer technical FAQs about the platform, identify buying timeline, and schedule a calendar demo..."
                    value={wizardData.objective}
                    onChange={e => setWizardData(p => ({ ...p, objective: e.target.value }))}
                  />
                </div>
              )}

              {/* STEP 4: SCHEDULE & LOCATION */}
              {wizardStep === 4 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Target Geographic Region</label>
                      <select
                        className="input text-xs w-full"
                        value={wizardData.region}
                        onChange={e => setWizardData(p => ({ ...p, region: e.target.value }))}
                      >
                        <option>India & South Asia (IST)</option>
                        <option>North America (EST / PST)</option>
                        <option>Europe & UK (CET / GMT)</option>
                        <option>Middle East & GCC (GST)</option>
                        <option>Asia Pacific & Australia (SGT / AEST)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Calling Window</label>
                      <select
                        className="input text-xs w-full"
                        value={wizardData.timezone}
                        onChange={e => setWizardData(p => ({ ...p, timezone: e.target.value }))}
                      >
                        <option>Prospect Local Time (09:00 - 17:00)</option>
                        <option>Morning Batch (09:30 - 12:30)</option>
                        <option>Afternoon Batch (14:00 - 17:30)</option>
                        <option>Immediate Continuous Dial</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Max Retries</label>
                      <select
                        className="input text-xs w-full"
                        value={wizardData.maxRetries}
                        onChange={e => setWizardData(p => ({ ...p, maxRetries: e.target.value }))}
                      >
                        <option value="1">1 Attempt</option>
                        <option value="2">2 Attempts</option>
                        <option value="3">3 Attempts (Recommended)</option>
                        <option value="5">5 Attempts</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Retry Interval</label>
                      <select
                        className="input text-xs w-full"
                        value={wizardData.retryInterval}
                        onChange={e => setWizardData(p => ({ ...p, retryInterval: e.target.value }))}
                      >
                        <option>4 hours</option>
                        <option>12 hours</option>
                        <option>24 hours (Next Day)</option>
                        <option>48 hours</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-bg-card rounded border border-bg-border text-2xs text-text-secondary flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Compliance Guardrail: AI only dials during local business hours (09:00 - 17:00).</span>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & LAUNCH */}
              {wizardStep === 5 && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-success/5 border border-success/20 rounded-xl space-y-2 text-xs">
                    <div className="font-semibold text-success flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>Campaign Configuration Verified</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-text-secondary text-2xs pt-1">
                      <div><span className="text-text-muted">Name:</span> {wizardData.name || 'New Campaign'}</div>
                      <div>
                        <span className="text-text-muted">Mode:</span>{' '}
                        <span className="text-amber-400 font-semibold font-mono">
                          {wizardData.type === 'AI_CALLING_ONLY' ? 'AI Calling Only' : 'Discovery & Calling'}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted">Assigned Leads:</span>{' '}
                        <strong className="text-text-primary">{selectedLeadIds.size > 0 ? selectedLeadIds.size : 'Auto-batch'} leads</strong>
                      </div>
                      <div><span className="text-text-muted">Language:</span> {wizardData.language}</div>
                      <div><span className="text-text-muted">Agent Voice:</span> {wizardData.voice}</div>
                      <div><span className="text-text-muted">Calling Window:</span> {wizardData.timezone}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Controls */}
            <div className="flex justify-between px-6 py-4 border-t border-bg-border">
              <button
                onClick={() => wizardStep > 0 ? setWizardStep(s => s - 1) : setShowWizard(false)}
                className="btn-secondary text-xs"
              >
                {wizardStep === 0 ? 'Cancel' : '← Back'}
              </button>
              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <button onClick={() => setWizardStep(s => s + 1)} className="btn-primary text-xs">
                  Next →
                </button>
              ) : (
                <button onClick={launchCampaign} className="btn-primary text-xs gap-2">
                  <Play className="w-3.5 h-3.5" /> Launch Campaign
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
