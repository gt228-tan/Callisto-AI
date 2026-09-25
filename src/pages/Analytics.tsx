import { useState } from 'react'
import { BarChart3, Calendar } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, FunnelChart, Funnel } from 'recharts'
import { leads } from '@/data/leads'
import { campaigns } from '@/data/campaigns'
import { calls } from '@/data/calls'

type DateFilter = 'Today' | '7 Days' | '30 Days' | '90 Days'

const dateFilters: DateFilter[] = ['Today', '7 Days', '30 Days', '90 Days']

function generate(n: number, base: number, variance: number) {
  return Array.from({ length: n }, (_, i) => base + Math.floor(Math.sin(i * 0.5) * variance + Math.random() * variance))
}

const labels7   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const labels30  = Array.from({ length: 30 }, (_, i) => `${i+1}`)
const labels90  = Array.from({ length: 90 }, (_, i) => `${i+1}`)
const labelsToday = Array.from({ length: 24 }, (_, i) => `${i}h`)

function getChartData(filter: DateFilter) {
  const n = filter === 'Today' ? 24 : filter === '7 Days' ? 7 : filter === '30 Days' ? 30 : 90
  const labels = filter === 'Today' ? labelsToday : filter === '7 Days' ? labels7 : filter === '30 Days' ? labels30 : labels90
  return labels.map((l, i) => ({
    label: l,
    leads: Math.floor(Math.random() * 80) + 20,
    qualified: Math.floor(Math.random() * 30) + 5,
    calls: Math.floor(Math.random() * 60) + 10,
    meetings: Math.floor(Math.random() * 8) + 1,
    conversion: (Math.random() * 8 + 8).toFixed(1),
  }))
}

const sourcePerf = [
  { source: 'LinkedIn',     leads: 1840, qualified: 712, conversion: 38.7, color: '#3b82f6' },
  { source: 'X / Twitter',  leads: 620,  qualified: 187, conversion: 30.2, color: '#f59e0b' },
  { source: 'Websites',     leads: 940,  qualified: 310, conversion: 33.0, color: '#22c55e' },
  { source: 'Directories',  leads: 480,  qualified: 134, conversion: 27.9, color: '#a855f7' },
  { source: 'Freelance',    leads: 310,  qualified: 78,  conversion: 25.2, color: '#f97316' },
]

const geoData = [
  { country: 'India',     leads: 1240, color: '#f59e0b' },
  { country: 'USA',       leads: 820,  color: '#3b82f6' },
  { country: 'UK',        leads: 380,  color: '#22c55e' },
  { country: 'UAE',       leads: 290,  color: '#a855f7' },
  { country: 'Singapore', leads: 180,  color: '#f97316' },
  { country: 'Germany',   leads: 140,  color: '#6b7280' },
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="text-2xs text-text-muted mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex gap-2 text-xs">
          <span style={{ color: p.color ?? p.stroke }}>■</span>
          <span className="text-text-secondary capitalize">{p.name}</span>
          <span className="font-mono font-bold ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function Analytics() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30 Days')
  const chartData = getChartData(dateFilter)

  const totalLeads     = leads.length
  const highIntent     = leads.filter(l => l.intent === 'HIGH').length
  const qualified      = leads.filter(l => l.intentScore >= 88).length
  const totalCalls     = calls.length
  const answered       = calls.filter(c => c.outcome !== 'NO_ANSWER' && c.outcome !== 'VOICEMAIL').length
  const meetings       = calls.filter(c => c.outcome === 'MEETING_BOOKED').length
  const convRate       = ((meetings / totalCalls) * 100).toFixed(1)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-bg-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">Analytics & Intelligence</h1>
            <p className="text-2xs text-text-muted font-mono hidden sm:block">Cross-channel funnel velocity, speech duration & deal conversions</p>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {dateFilters.map(f => (
            <button key={f} onClick={() => setDateFilter(f)}
              className={`text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded border transition-colors shrink-0 ${dateFilter === f ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'border-bg-border text-text-muted hover:border-bg-hover'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
        {[
          {l:'Lead Discovery', v:totalLeads},
          {l:'High Intent',    v:highIntent},
          {l:'Qualified',      v:qualified},
          {l:'Total Calls',    v:totalCalls},
          {l:'Answer Rate',    v:`${((answered/totalCalls)*100).toFixed(0)}%`},
          {l:'Qual Rate',      v:`31%`},
          {l:'Meetings',       v:meetings},
          {l:'Conv Rate',      v:`${convRate}%`},
        ].map(m => (
          <div key={m.l} className="panel-card p-2.5 sm:p-3">
            <div className="text-2xs text-text-muted uppercase tracking-wide truncate">{m.l}</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-text-primary mt-0.5 truncate">{m.v}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="panel">
          <div className="section-header"><span className="section-title">Leads Over Time</span></div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{top:5,right:5,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="aLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="aQual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{fill:'#545f72',fontSize:9}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'#545f72',fontSize:9}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="leads"    stroke="#f59e0b" fill="url(#aLeads)" strokeWidth={1.5} dot={false} name="Leads" />
                <Area type="monotone" dataKey="qualified" stroke="#22c55e" fill="url(#aQual)"  strokeWidth={1.5} dot={false} name="Qualified" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="section-header"><span className="section-title">Calls & Meetings Over Time</span></div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{top:5,right:5,left:-20,bottom:0}}>
                <XAxis dataKey="label" tick={{fill:'#545f72',fontSize:9}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'#545f72',fontSize:9}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="calls"    fill="#3b82f6" radius={[2,2,0,0]} name="Calls" />
                <Bar dataKey="meetings" fill="#22c55e" radius={[2,2,0,0]} name="Meetings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Source Performance */}
        <div className="xl:col-span-2 panel">
          <div className="section-header"><span className="section-title">Source Performance</span></div>
          <div className="overflow-auto">
            <table className="data-table w-full">
              <thead><tr>
                <th>Source</th><th>Total Leads</th><th>Qualified</th><th>Conversion</th><th>Performance</th>
              </tr></thead>
              <tbody>
                {sourcePerf.map(s => (
                  <tr key={s.source}>
                    <td><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{background:s.color}} />{s.source}</div></td>
                    <td><span className="font-mono">{s.leads.toLocaleString()}</span></td>
                    <td><span className="font-mono text-success">{s.qualified}</span></td>
                    <td><span className="font-mono font-bold text-amber-400">{s.conversion}%</span></td>
                    <td>
                      <div className="w-24 progress-track"><div className="progress-fill-amber" style={{width:`${s.conversion}%`}} /></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="panel">
          <div className="section-header"><span className="section-title">Geographic Distribution</span></div>
          <div className="p-3 flex flex-col items-center gap-3">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={geoData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="leads">
                  {geoData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={{background:'#1c2130',border:'1px solid #252b38',borderRadius:4,fontSize:11}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1">
              {geoData.map(g => (
                <div key={g.country} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{background:g.color}} />
                  <span className="text-2xs text-text-secondary flex-1">{g.country}</span>
                  <span className="text-2xs font-mono">{g.leads}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
