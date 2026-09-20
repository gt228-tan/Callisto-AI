import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, Plus, Pause, Play, Eye, BarChart2, X, Check, Download, RotateCcw, Clock, Globe } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { MetricCard } from '@/components/ui/MetricCard'
import { campaignStatusBadge } from '@/components/ui/StatusBadge'
import { type Campaign } from '@/data/campaigns'
import { leads, type Lead } from '@/data/leads'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { useCampaigns } from '@/contexts/CampaignContext'
import { useAppContext } from '@/contexts/AppContext'
import { exportToCSV } from '@/lib/exportCsv'

const WIZARD_STEPS = ['Campaign Details','Select Leads','Voice Agent','Objectives','Schedule & Location','Review & Launch']

export function Campaigns() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { language, t } = useAppContext()
  const { campaignList, addCampaign, togglePause: togglePauseCampaign } = useCampaigns()
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep]   = useState(0)
  const [wizardData, setWizardData]   = useState({
    name: '', target: '', language: 'English', voice: 'Professional Female',
    tone: 'Consultative', objective: '', greeting: '',
    scheduleStart: 'Immediately', timezone: 'Prospect Local Time (09:00 - 17:00)',
    region: 'India & South Asia (IST)',
    maxRetries: '3', retryInterval: '24 hours',
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
      objective: `Re-dialing unanswered and high-intent leads from ${camp.name}`,
      greeting: `Hello, this is follow-up outreach regarding our earlier discussion.`,
    })
    showToast('success', 'Campaign Repeated!', `"${repeated.name}" is launched with automated retry schedule.`)
  }

  function launchCampaign() {
    const newCamp = addCampaign({
      name: wizardData.name || 'New AI Campaign',
      target: wizardData.target || 'Selected Leads',
      agent: `${wizardData.voice} Agent`,
      status: 'ACTIVE',
      language: wizardData.language,
      voice: wizardData.voice,
      tone: wizardData.tone,
      objective: wizardData.objective,
      greeting: wizardData.greeting,
    })
    setShowWizard(false)
    setWizardStep(0)
    setWizardData({
      name: '', target: '', language: 'English', voice: 'Professional Female',
      tone: 'Consultative', objective: '', greeting: '',
      scheduleStart: 'Immediately', timezone: 'Prospect Local Time (09:00 - 17:00)',
      region: 'India & South Asia (IST)',
      maxRetries: '3', retryInterval: '24 hours',
      onlyBusinessHours: true,
    })
    showToast('success', 'Campaign Launched!', `"${newCamp.name}" is now active`)
  }

  const columns: Column<Campaign>[] = [
    { key: 'name',    header: 'Campaign',   sortable: true, render: r => (
      <div><div className="font-medium text-text-primary">{r.name}</div><div className="text-2xs text-text-muted">{r.target}</div></div>
    )},
    { key: 'agent',      header: 'Agent',      render: r => <span className="text-text-secondary">{r.agent}</span> },
    { key: 'status',     header: 'Status',     render: r => campaignStatusBadge(r.status) },
    { key: 'leads',      header: 'Leads',      sortable: true, render: r => <span className="font-mono">{r.leads}</span> },
    { key: 'calls',      header: 'Calls',      sortable: true, render: r => <span className="font-mono">{r.calls}</span> },
    { key: 'answered',   header: 'Answered',   render: r => <span className="font-mono text-success">{r.answered}</span> },
    { key: 'qualified',  header: 'Qualified',  render: r => <span className="font-mono text-amber-400">{r.qualified}</span> },
    { key: 'meetings',   header: 'Meetings',   render: r => <span className="font-mono text-info-bright">{r.meetings}</span> },
    { key: 'conversion', header: 'Conv %',     sortable: true, render: r => <span className={`font-mono font-bold ${r.conversion >= 12 ? 'text-success' : 'text-text-muted'}`}>{r.conversion}%</span> },
    { key: 'createdAt',  header: 'Created',    render: r => <span className="text-2xs text-text-muted font-mono">{formatDate(r.createdAt)}</span> },
    { key: 'actions',    header: 'Actions',    render: r => (
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        {(r.status === 'ACTIVE' || r.status === 'PAUSED') && (
          <button onClick={() => togglePause(r.id)} className="btn-ghost p-1" title={r.status === 'ACTIVE' ? 'Pause' : 'Resume'}>
            {r.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        )}
        <button
          onClick={() => repeatCampaign(r)}
          className="btn-ghost p-1 hover:text-amber-400"
          title="Repeat Campaign (Re-dial unanswered & clone)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => navigate('/analytics')} className="btn-ghost p-1 hover:text-amber-400" title="Analytics">
          <BarChart2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )},
  ]

  function handleExportCampaigns() {
    exportToCSV('campaigns_export.csv', campaignList, [
      { key: 'name', label: 'Campaign Name' },
      { key: 'target', label: 'Target Audience' },
      { key: 'agent', label: 'AI Voice Agent' },
      { key: 'status', label: 'Status' },
      { key: 'language', label: 'Language' },
      { key: 'voice', label: 'Voice Profile' },
      { key: 'leads', label: 'Total Leads' },
      { key: 'calls', label: 'Calls Made' },
      { key: 'answered', label: 'Answered' },
      { key: 'qualified', label: 'Qualified' },
      { key: 'meetings', label: 'Meetings Booked' },
      { key: 'conversion', label: 'Conversion %' },
      { key: 'createdAt', label: 'Created At' },
    ])
    showToast('success', 'Export Complete', `${campaignList.length} campaigns exported to CSV`)
  }

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />
          <h1 className="text-sm font-bold text-text-primary">{t('campaigns.title', 'Campaigns')}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleExportCampaigns} className="btn-secondary text-xs gap-1.5 flex-1 sm:flex-initial justify-center">
            <Download className="w-3.5 h-3.5" /> {t('common.export', 'Export CSV')}
          </button>
          <button onClick={() => setShowWizard(true)} className="btn-primary text-xs gap-1.5 flex-1 sm:flex-initial justify-center">
            <Plus className="w-3.5 h-3.5" /> {t('campaigns.create', 'Create Campaign')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
        <MetricCard label={t('campaigns.active', 'Active')}     value={active}        accent />
        <MetricCard label={t('campaigns.scheduled', 'Scheduled')}  value={scheduled}     />
        <MetricCard label={t('campaigns.totalCalls', 'Total Calls')} value={totalCalls}   />
        <MetricCard label={t('campaigns.answered', 'Answered')}   value={totalAnswered}  />
        <MetricCard label={t('metric.qualified', 'Qualified')}  value={totalQualified} />
        <MetricCard label={t('metric.meetingsBooked', 'Meetings')}   value={totalMeetings}  />
        <MetricCard label={t('campaigns.convRate', 'Conv Rate')}  value={`${avgConversion}%`} delta={2.1} />
      </div>

      <div className="panel flex flex-col">
        <DataTable
          data={campaignList}
          columns={columns}
          keyExtractor={r => r.id}
          pageSize={10}
          searchable
          searchPlaceholder="Search campaigns by name, target, language..."
          searchKeys={['name','target','agent','language']}
          emptyMessage="No campaigns found."
        />
      </div>

      {/* Campaign Wizard */}
      {showWizard && (
        <div className="modal-overlay" onClick={() => setShowWizard(false)}>
          <div className="modal-panel max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <span className="section-title">Create Location-Aware Campaign</span>
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

            <div className="p-4 sm:p-6 space-y-4 min-h-[280px]">
              {wizardStep === 0 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Campaign Name *</label>
                    <input className="input text-xs" placeholder="e.g. Q4 Enterprise AI Outreach" value={wizardData.name} onChange={e => setWizardData(p => ({...p, name: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Target Audience</label>
                    <input className="input text-xs" placeholder="e.g. IT Decision Makers in India" value={wizardData.target} onChange={e => setWizardData(p => ({...p, target: e.target.value}))} />
                  </div>
                </div>
              )}
              {wizardStep === 1 && (
                <div className="space-y-2">
                  <div className="text-xs text-text-muted mb-3">Select leads to include in this campaign. {leads.filter(l => l.intent === 'HIGH').length} high-intent leads available.</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[{l:'All High Intent',c:'badge-high',v:leads.filter(l=>l.intent==='HIGH').length},{l:'Qualified',c:'badge-success',v:leads.filter(l=>l.status==='QUALIFIED').length},{l:'Enriched',c:'badge-blue',v:leads.filter(l=>l.status==='ENRICHED').length}].map(s=>(
                      <div key={s.l} className="p-3 bg-bg-card border border-bg-border rounded hover:border-amber-500/40 cursor-pointer text-center">
                        <div className="text-lg font-bold text-text-primary font-mono">{s.v}</div>
                        <div className={`${s.c} mt-1`}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {label:'Primary Language',key:'language',options:['English','Hindi','Gujarati','Spanish','French','German','Arabic']},
                      {label:'Voice Timbre',key:'voice',options:['Professional Female','Professional Male','Native Hindi Female','Native Arabic Male','British Male']},
                      {label:'Tone',key:'tone',options:['Consultative','Friendly','Professional','Formal','Energetic']},
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">{f.label}</label>
                        <select className="input text-xs" value={(wizardData as any)[f.key]} onChange={e => setWizardData(p => ({...p, [f.key]: e.target.value}))}>
                          {f.options.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Greeting Script</label>
                    <textarea rows={3} className="input text-xs resize-none" placeholder="Hello, I'm calling from..." value={wizardData.greeting} onChange={e => setWizardData(p => ({...p, greeting: e.target.value}))} />
                  </div>
                </div>
              )}
              {wizardStep === 3 && (
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Call Objective</label>
                  <textarea rows={4} className="input text-xs resize-none" placeholder="Qualify the prospect, identify pain points, and schedule a technical demo..." value={wizardData.objective} onChange={e => setWizardData(p => ({...p, objective: e.target.value}))} />
                </div>
              )}
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
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Calling Schedule & Window</label>
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
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Max Unanswered Retries</label>
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
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Retry Backoff Interval</label>
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
                    <span>Compliance Guardrail: AI only initiates calls between 9:00 AM and 5:00 PM in the prospect's verified time zone.</span>
                  </div>
                </div>
              )}
              {wizardStep === 5 && (
                <div className="space-y-3">
                  <div className="p-3 bg-success/5 border border-success/20 rounded">
                    <div className="text-xs font-semibold text-success mb-2">Campaign Ready to Launch</div>
                    <div className="space-y-1 text-xs text-text-secondary">
                      <div><span className="text-text-muted">Name:</span> {wizardData.name || 'New Campaign'}</div>
                      <div><span className="text-text-muted">Target Region:</span> {wizardData.region}</div>
                      <div><span className="text-text-muted">Language:</span> {wizardData.language}</div>
                      <div><span className="text-text-muted">Voice:</span> {wizardData.voice} ({wizardData.tone})</div>
                      <div><span className="text-text-muted">Schedule:</span> {wizardData.timezone}</div>
                      <div><span className="text-text-muted">Retry Rule:</span> Max {wizardData.maxRetries} retries every {wizardData.retryInterval}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between px-6 py-4 border-t border-bg-border">
              <button onClick={() => wizardStep > 0 ? setWizardStep(s => s - 1) : setShowWizard(false)} className="btn-secondary text-xs">
                {wizardStep === 0 ? 'Cancel' : '← Back'}
              </button>
              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <button onClick={() => setWizardStep(s => s + 1)} className="btn-primary text-xs">Next →</button>
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
