import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Zap, CheckCircle, Megaphone, Phone, Calendar, TrendingUp, Mic,
  LayoutDashboard, ExternalLink, Workflow, Globe, ArrowRight, Sparkles,
  Shield, ShieldAlert, ShieldCheck, Lock, Activity, AlertTriangle, ScrollText,
  Radio, Compass
} from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { useAudit } from '@/contexts/AuditContext'
import { useAuth } from '@/contexts/AuthContext'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { MetricCard } from '@/components/ui/MetricCard'
import { ActivityStream } from '@/components/ui/ActivityStream'
import type { ActivityEvent } from '@/components/ui/ActivityStream'
import { DataTable } from '@/components/ui/DataTable'
import type { Column } from '@/components/ui/DataTable'
import { intentBadge, leadStatusBadge } from '@/components/ui/StatusBadge'
import { IntentScore } from '@/components/ui/IntentScore'
import { CallistoLogo } from '@/components/ui/CallistoLogo'
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
  { name: 'LinkedIn Prospecting',  value: 42, color: '#38bdf8' },
  { name: 'X / Twitter Signals',   value: 18, color: '#f59e0b' },
  { name: 'Company Domains',       value: 20, color: '#10b981' },
  { name: 'Public Registries',     value: 12, color: '#818cf8' },
  { name: 'Contract Platforms',    value: 5,  color: '#fb923c' },
  { name: 'CRM Bi-directional',    value: 3,  color: '#64748b' },
]

const funnelData = [
  { name: 'Discovered',  value: 24681, fill: '#38bdf8' },
  { name: 'Enriched',   value: 18420, fill: '#60a5fa' },
  { name: 'High Intent', value: 3842,  fill: '#f59e0b' },
  { name: 'Qualified',  value: 1426,  fill: '#10b981' },
  { name: 'Contacted',  value: 987,   fill: '#34d399' },
  { name: 'Demo Booked',value: 287,   fill: '#a3e635' },
  { name: 'Opportunity',value: 142,   fill: '#eab308' },
]

function generateActivityEvents(): ActivityEvent[] {
  const templates = [
    { type: 'LEAD_DISCOVERED',   title: 'New high-intent prospect identified',             detail: 'Rahul Mehta · Acme Digital Solutions · LinkedIn Crawl', severity: 'info'    as const },
    { type: 'AI_QUALIFICATION',  title: 'Lead qualified by BANT agent — Score: 94',       detail: 'Kavitha Reddy · Bharat Insurance Group · Enterprise ICP', severity: 'success' as const },
    { type: 'MEETING_BOOKED',    title: 'Executive demo confirmed & calendar invite sent',  detail: 'Tuesday 11:00 AM IST — Technical Evaluation',           severity: 'success' as const },
    { type: 'CAMPAIGN_CALL',     title: 'Voice campaign outbound completed',               detail: 'Campaign: Q4 Enterprise AI · Outcome: Qualified Lead',   severity: 'info'    as const },
    { type: 'LEAD_ENRICHED',     title: 'Prospect dossier telemetry enriched',             detail: 'Sarah Johnson · NexaFinance Corp · Series C $45M',      severity: 'info'    as const },
    { type: 'HIGH_INTENT',       title: 'Prospect elevated to HIGH INTENT priority',       detail: 'Naveen Krishnaswamy · Matrix NBFC · Score: 93',         severity: 'warning' as const },
    { type: 'MARKET_SIGNAL',     title: 'Market signal detected: FinTech AI surge',        detail: '18 enterprises hiring AI engineers in Mumbai/Bangalore',severity: 'info'    as const },
    { type: 'CAMPAIGN_LAUNCH',   title: 'Campaign active: UAE & GCC Market Outreach',      detail: 'Ahmad (Arabic Voice) · 85 leads queued',                severity: 'info'    as const },
    { type: 'API_SYNC',          title: 'Salesforce CRM bi-directional sync complete',     detail: '234 records updated · 12 new qualified contacts added', severity: 'success' as const },
    { type: 'VOICE_CALL_LIVE',   title: 'Autonomous call active — Positive sentiment',     detail: 'Aria (Enterprise) → Prospect · 2m 14s elapsed',         severity: 'success' as const },
  ]

  const now = Date.now()
  return templates.map((t, i) => ({
    id: `evt-${i}`,
    timestamp: new Date(now - i * 87_000 - Math.random() * 30_000),
    source: ['LinkedIn', 'Callisto Core', 'AI Voice', 'CRM Sync', 'Security'][i % 5],
    ...t,
  }))
}

const highIntentLeads = leads.filter(l => l.intent === 'HIGH').slice(0, 8)

const getTableColumns = (navigate: (path: string) => void): Column<Lead>[] => [
  { key: 'name',        header: 'Lead & Role',          render: r => (
    <div>
      <div className="font-semibold text-slate-100">{r.name}</div>
      <div className="text-[11px] font-mono text-slate-400">{r.jobTitle}</div>
    </div>
  )},
  { key: 'company',     header: 'Organization',       render: r => (
    <div>
      <div className="text-slate-200 font-medium">{r.company}</div>
      <div className="text-[11px] text-slate-400">{r.industry}</div>
    </div>
  )},
  { key: 'requirement', header: 'Requirement Signal',   render: r => (
    <span className="truncate-2 text-slate-300 max-w-xs" title={r.requirement}>
      {r.requirement.slice(0, 85)}…
    </span>
  )},
  { key: 'intentScore', header: 'Intent Score',        render: r => <IntentScore score={r.intentScore} size="sm" /> },
  { key: 'source',      header: 'Intelligence Source', render: r => (
    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
      {r.source}
    </span>
  )},
  { key: 'discoveredAt',header: 'Detected (IST)',      render: r => (
    <span className="text-slate-400 font-mono text-[11px]">{formatDateTime(r.discoveredAt)}</span>
  )},
  { key: 'status',      header: 'Status',        render: r => leadStatusBadge(r.status) },
  { key: 'action',      header: 'Dossier',        render: _r => (
    <button
      onClick={(e) => { e.stopPropagation(); navigate('/leads') }}
      className="btn-secondary text-[11px] py-1 px-2.5 gap-1 hover:border-sky-400 hover:text-sky-300"
    >
      <ExternalLink className="w-3 h-3" /> Inspect
    </button>
  )},
]

const RADIAN = Math.PI / 180
function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (value < 6) return null
  return (
    <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontSize={10} fontFamily="JetBrains Mono" fontWeight={600}>
      {value}%
    </text>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip border border-slate-700/80 bg-bg-card/95 backdrop-blur-md p-3">
      <div className="font-mono text-slate-400 text-[10px] mb-1.5 uppercase tracking-wider">T-INTERVAL: {label}</div>
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <span style={{ color: p.color }}>■</span>
            <span className="text-slate-300 capitalize">{p.name}</span>
            <span className="font-mono font-bold text-slate-100 ml-auto pl-4">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { t } = useAppContext()
  const { user } = useAuth()
  const { securityAlerts, logs, integrityStatus } = useAudit()
  const tableColumns = getTableColumns(navigate)
  const [timeRange, setTimeRange] = useState<TimeRange>('24H')
  const [chartData, setChartData] = useState(() => generateTimeData('24H'))
  const [events, setEvents] = useState<ActivityEvent[]>(() => generateActivityEvents())
  const [streamMode, setStreamMode] = useState<'operational' | 'security'>('operational')
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    setChartData(generateTimeData(timeRange))
  }, [timeRange])

  // Map immutable audit logs to ActivityEvent stream with IST timestamps
  const auditEvents: ActivityEvent[] = logs.slice(-20).reverse().map(l => ({
    id: l.id,
    timestamp: new Date(l.timestamp),
    type: l.action,
    title: `${l.userName} (${l.userRole}): ${l.resource}`,
    detail: `[IST: ${l.timestampIST}] Client IP: ${l.ip} | ${l.details}`,
    severity: l.status === 'SUCCESS' ? 'success' : l.status === 'BLOCKED' || l.status === 'FAILED' ? 'error' : 'warning',
    source: `Block #${l.sequence}`,
  }))

  // Live telemetry pulse
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setEvents(prev => [{
        id: `evt-live-${Date.now()}`,
        timestamp: new Date(),
        type: ['LEAD_DISCOVERED','AI_QUALIFICATION','CAMPAIGN_CALL','LEAD_ENRICHED'][Math.floor(Math.random()*4)],
        title: ['New lead identified from public requirement', 'AI qualified prospect with 91 intent score', 'Voice session finished — Positive sentiment', 'Prospect intelligence enriched from registry'][Math.floor(Math.random()*4)],
        severity: ['info','success','warning','info'][Math.floor(Math.random()*4)] as ActivityEvent['severity'],
        source: ['LinkedIn','AI Engine','Voice Agent','Registry'][Math.floor(Math.random()*4)],
      }, ...prev.slice(0, 19)])
    }, 6000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* ── CALLISTO MISSION CONTROL HEADER ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-bg-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <CallistoLogo size={28} showText={false} />
            <h1 className="text-lg font-bold text-slate-100 tracking-wide font-sans">
              {t('dash.title', 'Sales Intelligence & Orbital Telemetry')}
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
              VALHALLA // CALLISTO CORE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time outbound qualification, multilingual autonomous voice calling, and zero-trust sales ledger.
          </p>
        </div>

        {/* Quick Launch Mission Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => navigate('/business-onboarding')}
            className="btn-secondary text-xs py-2 px-3 gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Onboard Business</span>
          </button>
          <button
            onClick={() => navigate('/pipeline-journey')}
            className="btn-primary text-xs py-2 px-3.5 gap-1.5"
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Launch Pipeline Journey</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>

      {/* ── UNIFIED TELEMETRY & ZERO-TRUST SECURITY STATUS STRIP ─────── */}
      <div className="panel p-4 bg-gradient-to-r from-bg-panel via-bg-card to-bg-panel border border-bg-border flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-100">Zero-Trust Telemetry Active</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold border border-sky-500/30">
                ROLE: {user?.role || 'ADMIN'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> SHA-256 IMMUTABLE ({integrityStatus.blockCount} BLOCKS)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {securityAlerts.length > 0 ? (
                <span className="text-rose-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Perimeter Flag: {securityAlerts[0]?.title} ({securityAlerts[0]?.timestampIST})
                </span>
              ) : (
                <span>All orbital perimeter controls nominal. AES-256 encrypted at rest & TLS 1.3 in transit.</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="btn-secondary text-[11px] py-1.5 px-3 gap-1.5 font-mono"
          >
            <ScrollText className="w-3 h-3 text-amber-400" />
            Audit Ledger (IST)
          </button>
          <button
            onClick={() => navigate('/admin/fraud')}
            className="btn-secondary text-[11px] py-1.5 px-3 gap-1.5 text-rose-300 border-rose-500/30 hover:bg-rose-500/10 font-mono"
          >
            <ShieldAlert className="w-3 h-3" />
            Security Center ({securityAlerts.length})
          </button>
        </div>
      </div>

      {/* ── SPLUNK-STYLE METRIC TELEMETRY TILES ──────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-8 gap-3 sm:gap-4">
        <MetricCard label={t('metric.totalLeads', 'Total Leads')}       value={24681} delta={12.8} icon={<Users className="w-4 h-4" />} />
        <MetricCard label={t('metric.highIntent', 'High Intent')}       value={3842}  delta={18.4} icon={<Zap className="w-4 h-4" />} accent />
        <MetricCard label={t('metric.qualified', 'Qualified')}         value={1426}  delta={9.7}  icon={<CheckCircle className="w-4 h-4" />} />
        <MetricCard label={t('metric.activeCampaigns', 'Campaigns')}   value={3}     delta={0}    icon={<Megaphone className="w-4 h-4" />} subtitle="active" />
        <MetricCard label={t('metric.callsToday', 'Calls Today')}       value={842}   delta={21.3} icon={<Phone className="w-4 h-4" />} />
        <MetricCard label={t('metric.meetingsBooked', 'Demos Booked')}   value={287}   delta={14.2} icon={<Calendar className="w-4 h-4" />} />
        <MetricCard label={t('metric.conversionRate', 'Conversion')}    value="12.8%" delta={2.1}  icon={<TrendingUp className="w-4 h-4" />} />
        <MetricCard label={t('metric.voiceMinutes', 'Voice Minutes')}     value={4820}  delta={-3.2} icon={<Mic className="w-4 h-4" />} unit="m" subtitle="of 10k" />
      </div>

      {/* ── CHARTS ROW: LEAD DISCOVERY & SOURCES ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Discovery Trend Area Chart */}
        <div className="lg:col-span-2 panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-bg-border/60 pb-3">
            <div>
              <span className="section-title">
                <Compass className="w-4 h-4 text-sky-400" />
                {t('dash.leadDiscovery', 'Lead Discovery & Qualification Trajectory')}
              </span>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                Multi-channel inbound and outbound signal ingestion
              </div>
            </div>
            <div className="flex items-center gap-1 bg-bg-secondary p-0.5 rounded-lg border border-bg-border/80">
              {timeRanges.map(r => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-md transition-all ${
                    timeRange === r
                      ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={chartData} margin={{ top: 8, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradDisc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradQual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradEnr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="discovered" stroke="#38bdf8" fill="url(#gradDisc)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="enriched"   stroke="#f59e0b" fill="url(#gradEnr)"  strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="qualified"  stroke="#10b981" fill="url(#gradQual)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-6 mt-3 pt-3 border-t border-bg-border/40 font-mono text-[11px]">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-3 h-1 rounded bg-[#38bdf8]" /> Discovered Leads
              </span>
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-3 h-1 rounded bg-[#f59e0b]" /> Enriched Profiles
              </span>
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-3 h-1 rounded bg-[#10b981]" /> BANT Qualified
              </span>
            </div>
          </div>
        </div>

        {/* Lead Sources Donut Chart */}
        <div className="panel p-5 space-y-4 flex flex-col justify-between">
          <div className="border-b border-bg-border/60 pb-3">
            <span className="section-title">
              <PieChart className="w-4 h-4 text-amber-400" />
              {t('dash.leadSources', 'Channel Ingestion')}
            </span>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              Source telemetry distribution
            </div>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-2">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  labelLine={false}
                  label={<CustomPieLabel />}
                >
                  {sourceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  formatter={(v: number) => `${v}%`}
                  contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-full space-y-1.5 mt-2 font-mono text-[11px]">
              {sourceData.map(s => (
                <div key={s.name} className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-slate-300 font-sans text-xs">{s.name}</span>
                  </div>
                  <span className="text-slate-400 font-semibold">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECOND ROW: FUNNEL + ACTIVITY AUDIT STREAM ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Qualification Funnel */}
        <div className="panel p-5 space-y-4">
          <div className="border-b border-bg-border/60 pb-3">
            <span className="section-title">
              <Activity className="w-4 h-4 text-emerald-400" />
              {t('dash.aiFunnel', 'Autonomous Qualification Pipeline')}
            </span>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              Stage conversion drop-off & velocity
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {funnelData.map((stage) => {
              const pct = Math.round((stage.value / funnelData[0].value) * 100)
              return (
                <div key={stage.name} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">{stage.name}</span>
                    <div className="font-mono text-[11px] text-slate-400">
                      <span className="text-slate-200 font-semibold">{stage.value.toLocaleString()}</span>
                      <span className="text-slate-500 ml-1.5">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-bg-card rounded-md overflow-hidden border border-bg-border/50">
                    <div
                      className="h-full rounded-md transition-all duration-700"
                      style={{ width: `${pct}%`, background: stage.fill }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Telemetry & Security Audit Stream with Mode Switcher */}
        <div className="lg:col-span-2 panel overflow-hidden flex flex-col">
          <div className="section-header flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-bg-secondary/40">
            <div>
              <span className="section-title">
                <Radio className="w-4 h-4 text-sky-400" />
                {streamMode === 'operational'
                  ? t('dash.activityStream', 'Autonomous Agent Telemetry Stream')
                  : 'Zero-Trust Audit Chain & Ledger (IST)'}
              </span>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                Real-time event monitor with sub-second ingestion
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-bg-card border border-bg-border rounded-lg text-xs font-mono">
              <button
                type="button"
                onClick={() => setStreamMode('operational')}
                className={`px-3 py-1 rounded-md transition-all ${
                  streamMode === 'operational'
                    ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Operational Stream
              </button>
              <button
                type="button"
                onClick={() => setStreamMode('security')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  streamMode === 'security'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3 h-3" />
                Security Audit (IST)
              </button>
            </div>
          </div>

          <ActivityStream
            events={streamMode === 'operational' ? events : auditEvents}
            maxHeight="300px"
            live
          />
        </div>
      </div>

      {/* ── HIGH-INTENT RECENT OPPORTUNITIES TABLE ───────────────────── */}
      <div className="panel overflow-hidden">
        <div className="section-header flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-bg-secondary/40">
          <div>
            <span className="section-title">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {t('dash.highIntentOpp', 'High-Intent Telemetry Prospects')}
            </span>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              Priority buying signals ready for autonomous or SDR outreach
            </div>
          </div>

          <button
            onClick={() => navigate('/leads')}
            className="btn-primary text-xs py-1.5 px-3.5"
          >
            {t('dash.viewAllLeads', 'Inspect All Leads Database')}
          </button>
        </div>

        <DataTable
          data={highIntentLeads}
          columns={tableColumns}
          keyExtractor={r => r.id}
          onRowClick={() => navigate('/leads')}
          pageSize={6}
          className="flex-1"
        />
      </div>
    </div>
  )
}
