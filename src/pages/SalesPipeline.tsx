import { useState } from 'react'
import { Kanban, GripVertical, DollarSign } from 'lucide-react'
import { leads, type Lead } from '@/data/leads'
import { intentBadge } from '@/components/ui/StatusBadge'
import { timeAgo } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'

type PipelineStage = 'DISCOVERED' | 'QUALIFIED' | 'CONTACTED' | 'INTERESTED' | 'MEETING' | 'OPPORTUNITY' | 'WON' | 'LOST'

const stages: { id: PipelineStage; label: string; color: string }[] = [
  { id: 'DISCOVERED',  label: 'Discovered',  color: 'border-t-blue-500' },
  { id: 'QUALIFIED',   label: 'Qualified',   color: 'border-t-amber-500' },
  { id: 'CONTACTED',   label: 'Contacted',   color: 'border-t-purple-500' },
  { id: 'INTERESTED',  label: 'Interested',  color: 'border-t-yellow-500' },
  { id: 'MEETING',     label: 'Meeting',     color: 'border-t-orange-500' },
  { id: 'OPPORTUNITY', label: 'Opportunity', color: 'border-t-green-500' },
  { id: 'WON',         label: 'Won',         color: 'border-t-emerald-500' },
  { id: 'LOST',        label: 'Lost',        color: 'border-t-red-500' },
]

function mapStatus(s: string): PipelineStage {
  if (s === 'NEW' || s === 'ENRICHED') return 'DISCOVERED'
  if (s === 'QUALIFIED') return 'QUALIFIED'
  if (s === 'CONTACTED') return 'CONTACTED'
  if (s === 'INTERESTED') return 'INTERESTED'
  if (s === 'MEETING') return 'MEETING'
  if (s === 'OPPORTUNITY') return 'OPPORTUNITY'
  if (s === 'WON') return 'WON'
  if (s === 'LOST' || s === 'NOT_QUALIFIED') return 'LOST'
  return 'DISCOVERED'
}

export function SalesPipeline() {
  const { showToast } = useToast()
  const [pipeline, setPipeline] = useState<Record<PipelineStage, Lead[]>>(() => {
    const map = {} as Record<PipelineStage, Lead[]>
    stages.forEach(s => { map[s.id] = [] })
    leads.forEach(l => { const s = mapStatus(l.status); map[s].push(l) })
    return map
  })
  const [dragging, setDragging] = useState<{ leadId: string; fromStage: PipelineStage } | null>(null)
  const [dragOver, setDragOver] = useState<PipelineStage | null>(null)

  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({})

  const totalValue = (pipeline['OPPORTUNITY']?.length ?? 0) * 850000 + (pipeline['WON']?.length ?? 0) * 1200000

  const toggleExpand = (stageId: string) => {
    setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }))
  }

  function onDrop(toStage: PipelineStage) {
    if (!dragging) return
    const { leadId, fromStage } = dragging
    if (fromStage === toStage) { setDragging(null); setDragOver(null); return }
    setPipeline(prev => {
      const next = { ...prev }
      const lead = next[fromStage].find(l => l.id === leadId)
      if (!lead) return prev
      next[fromStage] = next[fromStage].filter(l => l.id !== leadId)
      next[toStage] = [lead, ...next[toStage]]
      return next
    })
    const stageName = stages.find(s => s.id === toStage)?.label
    showToast('success', 'Lead Moved', `Lead moved to ${stageName}`)
    setDragging(null)
    setDragOver(null)
  }

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Kanban className="w-4 h-4 text-amber-400 shrink-0" />
          <h1 className="text-sm font-bold text-text-primary">Sales Pipeline</h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <DollarSign className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-text-muted">Pipeline Value:</span>
          <span className="font-bold font-mono text-amber-400">₹{(totalValue / 100000).toFixed(0)}L</span>
        </div>
      </div>

      {/* Pipeline stats */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {stages.map(stage => (
          <div key={stage.id} className="panel-card px-3 py-2 shrink-0 text-center">
            <div className="text-xl font-bold font-mono text-text-primary">{pipeline[stage.id]?.length ?? 0}</div>
            <div className="text-2xs text-text-muted">{stage.label}</div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map(stage => {
          const stageLeads = pipeline[stage.id] ?? []
          const isExpanded = !!expandedStages[stage.id]
          const displayedLeads = isExpanded ? stageLeads : stageLeads.slice(0, 6)
          return (
            <div key={stage.id}
              className={`kanban-column shrink-0 transition-colors ${dragOver === stage.id ? 'bg-bg-hover rounded' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(stage.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => onDrop(stage.id)}>
              {/* Column header */}
              <div className={`panel border-t-2 ${stage.color} px-3 py-2 flex items-center justify-between`}>
                <span className="text-2xs font-semibold text-text-secondary uppercase tracking-wide">{stage.label}</span>
                <span className="text-2xs font-mono text-text-muted bg-bg-border px-1.5 rounded">{stageLeads.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-32">
                {displayedLeads.map(lead => (
                  <div key={lead.id}
                    draggable
                    onDragStart={() => setDragging({ leadId: lead.id, fromStage: stage.id })}
                    onDragEnd={() => { setDragging(null); setDragOver(null) }}
                    className={`kanban-card cursor-grab active:cursor-grabbing ${dragging?.leadId === lead.id ? 'opacity-40' : ''}`}>
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="text-xs font-semibold text-text-primary leading-tight">{lead.name}</div>
                        <div className="text-2xs text-text-muted">{lead.company}</div>
                      </div>
                      <GripVertical className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      {intentBadge(lead.intent)}
                      <span className="text-2xs font-mono text-amber-400">{lead.intentScore}</span>
                    </div>
                    <div className="text-2xs text-text-muted mt-1">{lead.source}</div>
                    <div className="text-2xs text-text-muted">{timeAgo(lead.lastActivity)}</div>
                    <div className="text-2xs text-info-bright mt-1">→ {lead.nextAction}</div>
                  </div>
                ))}
                {stageLeads.length > 6 && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(stage.id)}
                    className="w-full text-2xs text-center text-amber-400 hover:text-amber-300 bg-bg-card hover:bg-bg-hover py-1.5 px-2 rounded border border-bg-border hover:border-amber-500/30 transition-colors font-medium cursor-pointer"
                  >
                    {isExpanded ? '▲ Show less' : `+${stageLeads.length - 6} more (Show all)`}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
