import { TrendingUp } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import { marketSignals, industryTrends, hiringTrends, fundingData } from '@/data/marketSignals'
import { useToast } from '@/contexts/ToastContext'

const signalColors = {
  HIGH_SIGNAL: { bg: 'bg-warning-dim', border: 'border-warning/30', text: 'text-warning', dot: 'bg-warning' },
  RISING:      { bg: 'bg-success/5',   border: 'border-success/30', text: 'text-success', dot: 'bg-success' },
  OPPORTUNITY: { bg: 'bg-amber-500/5', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' },
  ALERT:       { bg: 'bg-danger-dim',  border: 'border-danger/30', text: 'text-danger-bright', dot: 'bg-danger' },
  TRENDING:    { bg: 'bg-info-dim',    border: 'border-info/30', text: 'text-info-bright', dot: 'bg-info' },
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="text-2xs text-text-muted mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span style={{ color: p.color }}>■</span>
          <span className="text-text-secondary">{p.name}</span>
          <span className="font-mono font-bold text-text-primary ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function MarketIntelligence() {
  const { showToast } = useToast()

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-amber-400" />
        <h1 className="text-sm font-bold text-text-primary">Market Intelligence</h1>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Hiring Trends */}
        <div className="panel">
          <div className="section-header"><span className="section-title">AI Hiring Trends — By Role</span></div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hiringTrends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: '#545f72', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#545f72', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="aiEngineers" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="AI Engineers" />
                <Line type="monotone" dataKey="salesOps" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Sales Ops" />
                <Line type="monotone" dataKey="dataScientists" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Data Scientists" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funding Activity */}
        <div className="panel">
          <div className="section-header"><span className="section-title">Funding Activity — By Stage ($M)</span></div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fundingData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: '#545f72', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#545f72', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="seedAmount"    fill="#6b7280" name="Seed"     radius={[2,2,0,0]} />
                <Bar dataKey="seriesAAmount" fill="#3b82f6" name="Series A" radius={[2,2,0,0]} />
                <Bar dataKey="seriesBAmount" fill="#f59e0b" name="Series B" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Industry Demand Index */}
        <div className="panel">
          <div className="section-header"><span className="section-title">Industry Demand Index</span></div>
          <div className="p-3 space-y-2">
            {industryTrends.map(t => (
              <div key={t.industry} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-28 shrink-0">{t.industry}</span>
                <div className="flex-1 progress-track">
                  <div className="progress-fill-amber" style={{ width: `${t.demandIndex}%` }} />
                </div>
                <span className="text-2xs font-mono text-text-primary w-6">{t.demandIndex}</span>
                <span className={`text-2xs font-semibold w-10 text-right ${t.change >= 0 ? 'text-success' : 'text-danger-bright'}`}>
                  {t.change > 0 ? '+' : ''}{t.change}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="panel">
          <div className="section-header"><span className="section-title">Top Opportunity Sectors</span></div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={industryTrends.slice(0, 6)} cx="50%" cy="50%" outerRadius={80}>
                <PolarGrid stroke="#252b38" />
                <PolarAngleAxis dataKey="industry" tick={{ fill: '#545f72', fontSize: 9 }} />
                <Radar name="Demand" dataKey="demandIndex" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={1.5} />
                <Radar name="Hiring" dataKey="hiringScore" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Market Signals Feed */}
      <div className="panel">
        <div className="section-header">
          <span className="section-title">Market Signals Feed</span>
          <button onClick={() => showToast('info','Refreshing signals...','Scanning public market data')} className="btn-secondary text-xs">Refresh</button>
        </div>
        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {marketSignals.map(signal => {
            const colors = signalColors[signal.type]
            return (
              <div key={signal.id} className={`p-3 rounded border ${colors.bg} ${colors.border}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />
                    <span className={`text-2xs font-bold uppercase tracking-wide ${colors.text}`}>{signal.type.replace('_',' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {signal.count && <span className="font-mono text-xs font-bold text-text-primary">{signal.count} companies</span>}
                    {signal.change && <span className={`text-2xs font-bold ${signal.change > 0 ? 'text-success' : 'text-danger-bright'}`}>{signal.change > 0 ? '+' : ''}{signal.change}%</span>}
                  </div>
                </div>
                <div className="text-xs font-semibold text-text-primary mt-1.5">{signal.title}</div>
                <div className="text-2xs text-text-secondary mt-1 leading-relaxed">{signal.description}</div>
                <div className="flex items-center gap-2 mt-2">
                  {signal.tags.slice(0, 3).map(tag => <span key={tag} className="badge-blue text-2xs">{tag}</span>)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
