import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Zap, CheckCircle, Megaphone, Phone, Calendar, TrendingUp, Mic, LayoutDashboard, ExternalLink, Workflow, Globe, ArrowRight, Sparkles } from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts'
import { MetricCard } from '@/components/ui/MetricCard'
import { ActivityStream } from '@/components/ui/ActivityStream'
import type { ActivityEvent } from '@/components/ui/ActivityStream'
import { DataTable } from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { intentBadge, leadStatusBadge } from '@/components/ui/StatusBadge'
import { IntentScore } from '@/components/ui/IntentScore'
import { leads, type Lead } from '@/data/leads'
import { formatDateTime } from '@/lib/utils'

const timeRanges = ['1H', '6H', '24H', '7D', '30D'] as const
type TimeRange = typeof timeRanges[number]

function generateTimeData(range: TimeRange) {
  const points = { '1H': 12, '6H': 12, '24H': 24, '7D': 7, '30D': 30 }[range]
  return Array.from({ length: points }, (_, i) => ({
    time: i,
    discovered: Math.floor(Math.random() * 120) + 30,
    qualified:  Math.floor(Math.random() * 60)  + 10,
    enriched:   Math.floor(Math.random() * 90)  + 20,
  }))
}

const sourceData = [
  { name: 'LinkedIn',          value: 42, color: '#3b82f6' },
  { name: 'X / Twitter',       value: 18, color: '#f59e0b' },
  { name: 'Company Websites',  value: 20, color: '#22c55e' },
  { name: 'Public Directories',value: 12, color: '#a855f7' },
  { name: 'Freelance Platforms',value: 5, color: '#f97316' },
  { name: 'CRM',               value: 3,  color: '#6b7280' },
]

const funnelData = [
  { name: 'Discovered',  value: 24681, fill: '#3b82f6' },
  { name: 'Enriched',   value: 18420, fill: '#6366f1' },
  { name: 'High Intent', value: 3842,  fill: '#f59e0b' },
  { name: 'Qualified',  value: 1426,  fill: '#22c55e' },
  { name: 'Contacted',  value: 987,   fill: '#10b981' },
  { name: 'Meeting',    value: 287,   fill: '#84cc16' },
  { name: 'Opportunity',value: 142,   fill: '#eab308' },
]

function generateActivityEvents(): ActivityEvent[] {
  const templates = [
    { type: 'LEAD_DISCOVERED',   title: 'New high-intent lead discovered',                 detail: 'Rahul Mehta · Acme Digital Solutions · LinkedIn',  severity: 'info'    as const },
    { type: 'AI_QUALIFICATION',  title: 'Lead qualified — Score: 94',                      detail: 'Kavitha Reddy · Bharat Insurance Group',           severity: 'success' as const },
    { type: 'MEETING_BOOKED',    title: 'Meeting booked with prospect',                    detail: 'Tuesday 11 AM IST — Technical Discussion',         severity: 'success' as const },
    { type: 'CAMPAIGN_CALL',     title: 'Voice campaign call completed',                   detail: 'Campaign: Q4 Enterprise AI · Outcome: Qualified',  severity: 'info'    as const },
    { type: 'LEAD_ENRICHED',     title: 'Company data enriched',                           detail: 'Sarah Johnson · NexaFinance Corp · Series C $45M', severity: 'info'    as const },
    { type: 'HIGH_INTENT',       title: 'Prospect classified as HIGH INTENT',              detail: 'Naveen Krishnaswamy · Matrix NBFC · Score: 93',    severity: 'warning' as const },
    { type: 'MARKET_SIGNAL',     title: 'New market signal: FinTech AI surge',             detail: '18 companies hiring AI engineers in Mumbai/Bangalore', severity: 'info' as const },
    { type: 'CAMPAIGN_LAUNCH',   title: 'Campaign launched: UAE & GCC Market Pilot',       detail: 'Ahmad (Arabic) · 85 leads · Starting in 5 days',   severity: 'info'    as const },
    { type: 'API_SYNC',          title: 'Salesforce CRM sync completed',                   detail: '234 records updated · 12 new leads imported',      severity: 'success' as const },
    { type: 'VOICE_CALL_LIVE',   title: 'Active call — Sentiment: Positive',               detail: 'Aria (Enterprise) → Prospect · 2m 14s elapsed',    severity: 'success' as const },
  ]

  const now = Date.now()
  return templates.map((t, i) => ({
    id: `evt-${i}`,
    timestamp: new Date(now - i * 87_000 - Math.random() * 30_000),
    source: ['LinkedIn', 'System', 'AI Engine', 'Voice Agent', 'CRM'][i % 5],
    ...t,
  }))
}

const highIntentLeads = leads.filter(l => l.intent === 'HIGH').slice(0, 8)

const getTableColumns = (navigate: (path: string) => void): Column<Lead>[] => [
  { key: 'name',        header: 'Lead',          render: r => (
    <div>
      <div className="font-medium text-text-primary">{r.name}</div>
      <div className="text-2xs text-text-muted">{r.jobTitle}</div>
    </div>
  )},
  { key: 'company',     header: 'Company',       render: r => (
    <div>
      <div className="text-text-primary">{r.company}</div>
      <div className="text-2xs text-text-muted">{r.industry}</div>
    </div>
  )},
  { key: 'requirement', header: 'Requirement',   render: r => <span className="truncate-2 text-text-secondary" title={r.requirement}>{r.requirement.slice(0, 80)}…</span> },
  { key: 'intentScore', header: 'Intent',        render: r => <IntentScore score={r.intentScore} size="sm" /> },
  { key: 'source',      header: 'Source',        render: r => <span className="badge-blue">{r.source}</span> },
  { key: 'discoveredAt',header: 'Discovered',    render: r => <span className="text-text-muted font-mono text-2xs">{formatDateTime(r.discoveredAt)}</span> },
  { key: 'status',      header: 'Status',        render: r => leadStatusBadge(r.status) },
  { key: 'action',      header: 'Action',        render: _r => (
    <button onClick={(e) => { e.stopPropagation(); navigate('/leads') }} className="btn-primary text-2xs py-0.5 px-2">
      <ExternalLink className="w-2.5 h-2.5" /> View
    </button>
  )},
]

const RADIAN = Math.PI / 180
function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, value }: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (value < 5) return null
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={9}>
      {value}%
    </text>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="font-mono text-text-muted text-2xs mb-1">t={label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span style={{ color: p.color }}>■</span>
          <span className="text-text-secondary capitalize">{p.name}</span>
          <span className="font-mono font-bold text-text-primary ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { t } = useAppContext()
  const tableColumns = getTableColumns(navigate)
  const [timeRange, setTimeRange] = useState<TimeRange>('24H')
  const [chartData, setChartData] = useState(() => generateTimeData('24H'))
  const [events, setEvents] = useState<ActivityEvent[]>(() => generateActivityEvents())
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    setChartData(generateTimeData(timeRange))
  }, [timeRange])

  // Simulate live stream
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setEvents(prev => [{
        id: `evt-live-${Date.now()}`,
        timestamp: new Date(),
        type: ['LEAD_DISCOVERED','AI_QUALIFICATION','CAMPAIGN_CALL','LEAD_ENRICHED'][Math.floor(Math.random()*4)],
        title: ['New lead discovered from LinkedIn', 'AI scored prospect 89/100', 'Voice call completed — Positive sentiment', 'Company intelligence enriched'][Math.floor(Math.random()*4)],
        severity: ['info','success','warning','info'][Math.floor(Math.random()*4)] as ActivityEvent['severity'],
        source: ['LinkedIn','AI Engine','Voice Agent','System'][Math.floor(Math.random()*4)],
      }, ...prev.slice(0, 19)])
    }, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4 text-amber-400 shrink-0" />
          <h1 className="text-sm font-bold text-text-primary">{t('dash.title', 'AI Sales Intelligence')}</h1>
          <span className="text-text-muted">/</span>
          <span className="text-xs text-text-muted">{t('nav.overview', 'Overview')}</span>
        </div>
        <div className="text-2xs text-text-muted font-mono hidden sm:block">
          {t('dash.subtitle', 'Real-time sales intelligence and AI-powered outreach')}
        </div>
      </div>

      {/* Autonomous Sales Pipeline Banner */}
      <div className="p-3.5 sm:p-4 rounded-lg bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-transparent border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-3xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase">
              {t('dash.pipelineJourneyBanner', 'Autonomous Sales Pipeline')}
            </span>
            <span className="text-xs font-bold text-text-primary flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 9-Stage Autonomous Engine
            </span>
          </div>
          <p className="text-2xs text-text-secondary leading-relaxed max-w-3xl">
            {t('dash.pipelineJourneyDesc', 'Understand Business → Discover → Enrich → Qualify → AI Call → Insights → Follow-up')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/business-onboarding')}
            className="btn-secondary text-2xs gap-1.5 py-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            {t('dash.onboardingBanner', 'Onboard Business')}
          </button>
          <button
            onClick={() => navigate('/pipeline-journey')}
            className="btn-primary text-2xs gap-1.5 py-1.5 shadow-lg shadow-amber-500/10"
          >
            <Workflow className="w-3.5 h-3.5" />
            {t('dash.launchPipeline', 'Launch Pipeline Journey')}
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3">
        <MetricCard label={t('metric.totalLeads', 'Total Leads')}       value={24681} delta={12.8} icon={<Users className="w-3.5 h-3.5" />} />
        <MetricCard label={t('metric.highIntent', 'High Intent')}       value={3842}  delta={18.4} icon={<Zap className="w-3.5 h-3.5" />} accent />
        <MetricCard label={t('metric.qualified', 'Qualified')}         value={1426}  delta={9.7}  icon={<CheckCircle className="w-3.5 h-3.5" />} />
        <MetricCard label={t('metric.activeCampaigns', 'Active Campaigns')}  value={3}     delta={0}    icon={<Megaphone className="w-3.5 h-3.5" />} subtitle="campaigns" />
        <MetricCard label={t('metric.callsToday', 'Calls Today')}       value={842}   delta={21.3} icon={<Phone className="w-3.5 h-3.5" />} />
        <MetricCard label={t('metric.meetingsBooked', 'Meetings Booked')}   value={287}   delta={14.2} icon={<Calendar className="w-3.5 h-3.5" />} />
        <MetricCard label={t('metric.conversionRate', 'Conversion Rate')}   value="12.8%" delta={2.1}  icon={<TrendingUp className="w-3.5 h-3.5" />} />
        <MetricCard label={t('metric.voiceMinutes', 'Voice Minutes')}     value={4820}  delta={-3.2} icon={<Mic className="w-3.5 h-3.5" />} unit="min" subtitle="of 10k" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Lead Discovery Activity */}
        <div className="xl:col-span-2 panel">
          <div className="section-header">
            <span className="section-title">{t('dash.leadDiscovery', 'Lead Discovery Activity')}</span>
            <div className="flex gap-1">
              {timeRanges.map(r => (
                <button key={r} onClick={() => setTimeRange(r)}
                  className={`text-2xs px-2 py-0.5 rounded transition-colors ${timeRange === r ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-text-muted hover:text-text-primary'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradDisc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradQual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradEnr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fill: '#545f72', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#545f72', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="discovered" stroke="#3b82f6" fill="url(#gradDisc)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="enriched"   stroke="#f59e0b" fill="url(#gradEnr)"  strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="qualified"  stroke="#22c55e" fill="url(#gradQual)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              {[['#3b82f6','Discovered'],['#f59e0b','Enriched'],['#22c55e','Qualified']].map(([c,l]) => (
                <span key={l as string} className="flex items-center gap-1 text-2xs text-text-muted">
                  <span className="w-2 h-0.5 rounded" style={{ background: c as string }} />{l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Lead Sources */}
        <div className="panel">
          <div className="section-header">
            <span className="section-title">{t('dash.leadSources', 'Lead Sources')}</span>
          </div>
          <div className="p-3 flex flex-col items-center gap-3">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} dataKey="value"
                  labelLine={false} label={<CustomPieLabel />}>
                  {sourceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: '#1c2130', border: '1px solid #252b38', borderRadius: 4, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1">
              {sourceData.map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-2xs text-text-secondary flex-1">{s.name}</span>
                  <span className="text-2xs font-mono text-text-primary">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Funnel + Activity Stream */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* AI Qualification Funnel */}
        <div className="panel">
          <div className="section-header">
            <span className="section-title">{t('dash.aiFunnel', 'AI Qualification Funnel')}</span>
          </div>
          <div className="p-3 space-y-1">
            {funnelData.map((stage, i) => {
              const pct = Math.round((stage.value / funnelData[0].value) * 100)
              return (
                <div key={stage.name} className="group">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-2xs text-text-secondary">{stage.name}</span>
                    <span className="text-2xs font-mono text-text-primary">{stage.value.toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-bg-border rounded-sm overflow-hidden">
                    <div className="h-full rounded-sm transition-all duration-700" style={{ width: `${pct}%`, background: stage.fill }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Activity Stream */}
        <div className="xl:col-span-2 panel flex flex-col">
          <div className="section-header">
            <span className="section-title">{t('dash.activityStream', 'AI Activity Stream')}</span>
            <span className="text-2xs text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />LIVE
            </span>
          </div>
          <ActivityStream events={events} maxHeight="280px" live />
        </div>
      </div>

      {/* High-Intent Opportunities Table */}
      <div className="panel flex flex-col">
        <div className="section-header flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div>
            <span className="section-title">{t('dash.highIntentOpp', 'Recent High-Intent Opportunities')}</span>
            <span className="text-2xs text-text-muted ml-2 sm:ml-3">{highIntentLeads.length} prospects</span>
          </div>
          <button onClick={() => navigate('/leads')} className="btn-primary text-2xs w-full sm:w-auto text-center justify-center">
            {t('dash.viewAllLeads', 'View All Leads')}
          </button>
        </div>
        <DataTable
          data={highIntentLeads}
          columns={tableColumns}
          keyExtractor={r => r.id}
          onRowClick={() => navigate('/leads')}
          pageSize={8}
          className="flex-1"
        />
      </div>
    </div>
  )
}
