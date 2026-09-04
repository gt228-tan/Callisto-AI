import { useState } from 'react'
import { Megaphone, Plus, Pause, Play, Eye, BarChart2, X, Check } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { MetricCard } from '@/components/ui/MetricCard'
import { campaignStatusBadge } from '@/components/ui/StatusBadge'
import { campaigns, type Campaign } from '@/data/campaigns'
import { leads, type Lead } from '@/data/leads'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'

const WIZARD_STEPS = ['Campaign Details','Select Leads','Voice Agent','Objectives','Schedule','Review & Launch']

export function Campaigns() {
  const { showToast } = useToast()
  const [campaignList, setCampaignList] = useState(campaigns)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep]   = useState(0)
  const [wizardData, setWizardData]   = useState({
    name: '', target: '', language: 'English', voice: 'Professional Female',
    tone: 'Consultative', objective: '', greeting: '',
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
    setCampaignList(prev => prev.map(c =>
      c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : c
    ))
    const camp = campaignList.find(c => c.id === id)
    showToast('info', camp?.status === 'ACTIVE' ? 'Campaign Paused' : 'Campaign Resumed', camp?.name ?? '')
  }

  function launchCampaign() {
    const newCamp: Campaign = {
      id: `C00${campaignList.length + 1}`,
      name: wizardData.name || 'New AI Campaign',
      target: wizardData.target || 'Selected Leads',
      agent: `${wizardData.voice} Agent`,
      status: 'ACTIVE',
      language: wizardData.language,
      voice: wizardData.voice,
      tone: wizardData.tone,
      leads: Math.floor(Math.random() * 100) + 20,
      calls: 0, answered: 0, qualified: 0, meetings: 0, conversion: 0,
      createdAt: new Date(),
      scheduledAt: new Date(),
      completedAt: null,
      objective: wizardData.objective,
      greeting: wizardData.greeting,
      maxRetries: 3,
      retryInterval: '24 hours',
    }
    setCampaignList(prev => [newCamp, ...prev])
    setShowWizard(false)
    setWizardStep(0)
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
    { key: 'actions',    header: '',           render: r => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        {(r.status === 'ACTIVE' || r.status === 'PAUSED') && (
          <button onClick={() => togglePause(r.id)} className="btn-ghost p-1" title={r.status === 'ACTIVE' ? 'Pause' : 'Resume'}>
            {r.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        )}
        <button className="btn-ghost p-1" title="Analytics"><BarChart2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-400" />
          <h1 className="text-sm font-bold text-text-primary">Campaigns</h1>
        </div>
        <button onClick={() => setShowWizard(true)} className="btn-primary text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard label="Active"     value={active}        accent />
        <MetricCard label="Scheduled"  value={scheduled}     />
        <MetricCard label="Total Calls" value={totalCalls}   />
        <MetricCard label="Answered"   value={totalAnswered}  />
        <MetricCard label="Qualified"  value={totalQualified} />
        <MetricCard label="Meetings"   value={totalMeetings}  />
        <MetricCard label="Conv Rate"  value={`${avgConversion}%`} delta={2.1} />
      </div>

      <div className="panel flex flex-col">
        <DataTable
          data={campaignList}
          columns={columns}
          keyExtractor={r => r.id}
          pageSize={10}
          searchable
          searchPlaceholder="Search campaigns..."
          searchKeys={['name','target','agent','language']}
          emptyMessage="No campaigns found."
        />
      </div>

      {/* Campaign Wizard */}
      {showWizard && (
        <div className="modal-overlay" onClick={() => setShowWizard(false)}>
          <div className="modal-panel max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <span className="section-title">Create New Campaign</span>
              <button onClick={() => setShowWizard(false)}><X className="w-4 h-4 text-text-muted" /></button>
            </div>

            {/* Wizard Steps */}
            <div className="flex items-center gap-1 px-6 py-3 border-b border-bg-border overflow-x-auto">
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

            <div className="p-6 space-y-4 min-h-[280px]">
              {wizardStep === 0 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Campaign Name *</label>
                    <input className="input" placeholder="e.g. Q4 Enterprise AI Outreach" value={wizardData.name} onChange={e => setWizardData(p => ({...p, name: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Target Audience</label>
                    <input className="input" placeholder="e.g. IT Decision Makers in India" value={wizardData.target} onChange={e => setWizardData(p => ({...p, target: e.target.value}))} />
                  </div>
                </div>
              )}
              {wizardStep === 1 && (
                <div className="space-y-2">
                  <div className="text-xs text-text-muted mb-3">Select leads to include in this campaign. {leads.filter(l => l.intent === 'HIGH').length} high-intent leads available.</div>
                  <div className="grid grid-cols-3 gap-2">
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
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {label:'Language',key:'language',options:['English','Hindi','Gujarati','Spanish','French','German','Arabic','Tamil','Telugu']},
                      {label:'Voice',key:'voice',options:['Professional Female','Professional Male','Native Hindi Female','Native Arabic Male','British Male','Youthful Female']},
                      {label:'Tone',key:'tone',options:['Consultative','Friendly','Professional','Formal','Energetic']},
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">{f.label}</label>
                        <select className="input" value={(wizardData as any)[f.key]} onChange={e => setWizardData(p => ({...p, [f.key]: e.target.value}))}>
                          {f.options.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Greeting Script</label>
                    <textarea rows={3} className="input resize-none" placeholder="Hello, I'm calling from..." value={wizardData.greeting} onChange={e => setWizardData(p => ({...p, greeting: e.target.value}))} />
                  </div>
                </div>
              )}
              {wizardStep === 3 && (
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Call Objective</label>
                  <textarea rows={4} className="input resize-none" placeholder="Qualify the prospect, identify pain points, and schedule a technical demo..." value={wizardData.objective} onChange={e => setWizardData(p => ({...p, objective: e.target.value}))} />
                </div>
              )}
              {wizardStep === 4 && (
                <div className="space-y-3">
                  {[{l:'Start',opts:['Immediately','Scheduled Date/Time','Business Hours Only']},{l:'Timezone',opts:['Prospect Local Time','IST','EST','GST']},{l:'Max Retries',opts:['1','2','3','4']},{l:'Retry Interval',opts:['12 hours','24 hours','48 hours','72 hours']}].map(f=>(
                    <div key={f.l}>
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">{f.l}</label>
                      <select className="input">{f.opts.map(o=><option key={o}>{o}</option>)}</select>
                    </div>
                  ))}
                </div>
              )}
              {wizardStep === 5 && (
                <div className="space-y-3">
                  <div className="p-3 bg-success/5 border border-success/20 rounded">
                    <div className="text-xs font-semibold text-success mb-2">Campaign Ready to Launch</div>
                    <div className="space-y-1 text-xs text-text-secondary">
                      <div><span className="text-text-muted">Name:</span> {wizardData.name || 'New Campaign'}</div>
                      <div><span className="text-text-muted">Language:</span> {wizardData.language}</div>
                      <div><span className="text-text-muted">Voice:</span> {wizardData.voice}</div>
                      <div><span className="text-text-muted">Tone:</span> {wizardData.tone}</div>
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
