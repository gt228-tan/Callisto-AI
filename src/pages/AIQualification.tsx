import { useState } from 'react'
import { Brain, Play, X, CheckCircle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { IntentScore, ScoreBar } from '@/components/ui/IntentScore'
import { verdictBadge, intentBadge } from '@/components/ui/StatusBadge'
import { MetricCard } from '@/components/ui/MetricCard'
import { AIProgressSteps } from '@/components/ui/States'
import { leads, type Lead } from '@/data/leads'
import { qualifyLead } from '@/services/aiService'
import { useToast } from '@/contexts/ToastContext'

type Verdict = 'QUALIFIED' | 'LIKELY' | 'NEEDS_REVIEW' | 'NOT_QUALIFIED' | 'All'

const qualifySteps = [
  'AI Analysis: Loading requirement context...',
  'Extracting intent signals...',
  'Evaluating company fit...',
  'Assessing budget indicators...',
  'Checking decision-maker authority...',
  'Generating BANT qualification score...',
  'Generating recommendation...',
  'Qualification complete!',
]

function getVerdict(l: Lead): string {
  if (l.intentScore >= 90) return 'QUALIFIED'
  if (l.intentScore >= 78) return 'LIKELY'
  if (l.intentScore >= 65) return 'NEEDS_REVIEW'
  return 'NOT_QUALIFIED'
}

export function AIQualification() {
  const { showToast } = useToast()
  const [verdictFilter, setVerdictFilter] = useState<Verdict>('All')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [qualifying, setQualifying]     = useState(false)
  const [qualStep, setQualStep]         = useState('')
  const [qualResult, setQualResult]     = useState<any | null>(null)

  const total     = leads.length
  const qualified = leads.filter(l => l.intentScore >= 90).length
  const likely    = leads.filter(l => l.intentScore >= 78 && l.intentScore < 90).length
  const review    = leads.filter(l => l.intentScore >= 65 && l.intentScore < 78).length
  const rejected  = leads.filter(l => l.intentScore < 65).length
  const avgScore  = Math.round(leads.reduce((s, l) => s + l.intentScore, 0) / leads.length)

  const filtered = leads.filter(l => verdictFilter === 'All' || getVerdict(l) === verdictFilter)

  async function runQualify(lead: Lead) {
    setSelectedLead(lead)
    setQualResult(null)
    setQualifying(true)
    for (const step of qualifySteps) {
      setQualStep(step)
      await new Promise(r => setTimeout(r, 350 + Math.random() * 250))
    }
    const result = await qualifyLead(lead)
    setQualResult(result)
    setQualifying(false)
    showToast('success', 'Qualification Complete', `${lead.name}: ${result.verdict}`)
  }

  const columns: Column<Lead>[] = [
    { key: 'name', header: 'Lead', sortable: true, render: r => (
      <div><div className="font-medium text-text-primary">{r.name}</div><div className="text-2xs text-text-muted">{r.jobTitle}</div></div>
    )},
    { key: 'company',     header: 'Company',       render: r => <div><div>{r.company}</div><div className="text-2xs text-text-muted">{r.industry}</div></div> },
    { key: 'requirement', header: 'Requirement',   render: r => <span className="truncate-2 text-text-secondary">{r.requirement.slice(0,60)}…</span> },
    { key: 'budgetSignal',header: 'Budget Signal', render: r => <span className={`badge ${r.budgetSignal === 'HIGH' ? 'badge-success' : r.budgetSignal === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>{r.budgetSignal}</span> },
    { key: 'timeline',    header: 'Timeline',      render: r => <span className="text-text-secondary text-xs">{r.timeline}</span> },
    { key: 'decisionMaker', header: 'Decision Maker', render: r => r.decisionMaker ? <span className="badge-success">Yes</span> : <span className="badge-low">Unknown</span> },
    { key: 'intentScore', header: 'Score',         sortable: true, render: r => <IntentScore score={r.intentScore} size="sm" /> },
    { key: 'verdict',     header: 'AI Verdict',    render: r => verdictBadge(getVerdict(r)) },
    { key: 'qualify',     header: '',              render: r => (
      <button onClick={e => { e.stopPropagation(); runQualify(r) }} className="btn-secondary text-2xs py-0.5 px-2 gap-1">
        <Play className="w-2.5 h-2.5" /> Re-qualify
      </button>
    )},
  ]

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-amber-400 shrink-0" />
          <h1 className="text-sm font-bold text-text-primary">AI Qualification</h1>
        </div>
        <button onClick={() => showToast('info', 'Bulk Qualify Running', 'Qualifying all unqualified leads...')} className="btn-primary text-xs w-full sm:w-auto justify-center">
          <Play className="w-3.5 h-3.5" /> Run Bulk Qualification
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <MetricCard label="Total Analyzed" value={total}     icon={<Brain className="w-3.5 h-3.5" />} />
        <MetricCard label="Qualified"      value={qualified} icon={<CheckCircle className="w-3.5 h-3.5" />} delta={9.7} accent />
        <MetricCard label="Likely"         value={likely}    />
        <MetricCard label="Needs Review"   value={review}    />
        <MetricCard label="Avg AI Score"   value={`${avgScore}`} subtitle="/ 100" />
      </div>

      {/* Verdict Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        {(['All', 'QUALIFIED', 'LIKELY', 'NEEDS_REVIEW', 'NOT_QUALIFIED'] as Verdict[]).map(v => {
          const isActive = verdictFilter === v
          const count = v === 'All' ? total : v === 'QUALIFIED' ? qualified : v === 'LIKELY' ? likely : v === 'NEEDS_REVIEW' ? review : rejected
          return (
            <button
              key={v}
              onClick={() => setVerdictFilter(v)}
              className={`text-xs px-3 py-1.5 rounded-md border flex items-center gap-2 transition-all duration-150 ${
                isActive
                  ? 'bg-amber-500 text-black border-amber-500 shadow-sm font-semibold'
                  : 'bg-bg-card border-bg-border text-text-secondary hover:text-text-primary hover:border-amber-500/30'
              }`}
            >
              <span>{v === 'All' ? 'All Leads' : v.replace('_', ' ')}</span>
              <span
                className={`text-2xs px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-black/20 text-black' : 'bg-bg-panel text-text-muted'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="panel flex flex-col">
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          onRowClick={r => setSelectedLead(r)}
          pageSize={12}
          searchable
          searchPlaceholder="Search leads..."
          searchKeys={['name','company','industry']}
          emptyMessage="No leads match current filter."
        />
      </div>

      {/* Lead Detail / Qualification Modal */}
      {selectedLead && (
        <div className="modal-overlay" onClick={() => { if (!qualifying) setSelectedLead(null) }}>
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <span className="section-title">{selectedLead.name} — AI Qualification</span>
              {!qualifying && <button onClick={() => setSelectedLead(null)}><X className="w-4 h-4 text-text-muted" /></button>}
            </div>
            <div className="p-6 space-y-4">
              {qualifying && (
                <AIProgressSteps currentStep={qualStep} steps={qualifySteps} />
              )}
              {!qualifying && !qualResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <IntentScore score={selectedLead.intentScore} size="lg" />
                    <div>
                      <div className="text-xs text-text-muted">{selectedLead.company} · {selectedLead.industry}</div>
                      <div className="text-sm font-semibold text-text-primary mt-0.5">{verdictBadge(getVerdict(selectedLead))}</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <ScoreBar label="Need Clarity"       value={selectedLead.needClarity} />
                    <ScoreBar label="Urgency"            value={selectedLead.urgency} />
                    <ScoreBar label="Budget Signal"      value={selectedLead.budgetScore} color="green" />
                    <ScoreBar label="Decision Authority" value={selectedLead.authorityScore} color={selectedLead.decisionMaker ? 'green' : 'blue'} />
                    <ScoreBar label="Fit Score"          value={selectedLead.fitScore} color="green" />
                  </div>
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded text-xs text-text-primary">
                    {selectedLead.aiReasoning}
                  </div>
                  <button onClick={() => runQualify(selectedLead)} className="btn-primary w-full text-xs">
                    <Play className="w-3.5 h-3.5" /> Re-run AI Qualification
                  </button>
                </div>
              )}
              {qualResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <IntentScore score={qualResult.score} size="lg" />
                    <div>
                      <div className="text-xs text-text-muted mb-1">AI Verdict</div>
                      {verdictBadge(qualResult.verdict)}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <ScoreBar label="Need Clarity"       value={qualResult.needClarity} />
                    <ScoreBar label="Urgency"            value={qualResult.urgency} />
                    <ScoreBar label="Budget Signal"      value={qualResult.budgetScore} color="green" />
                    <ScoreBar label="Decision Authority" value={qualResult.authorityScore} color="blue" />
                    <ScoreBar label="Fit Score"          value={qualResult.fitScore} color="green" />
                  </div>
                  <div className="p-3 bg-info-dim border border-info/20 rounded text-xs text-text-primary">
                    {qualResult.reasoning}
                  </div>
                  <div className="space-y-1">
                    {qualResult.recommendations.map((r: string, i: number) => (
                      <div key={i} className="text-xs text-text-secondary flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-success shrink-0 mt-0.5" /> {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
