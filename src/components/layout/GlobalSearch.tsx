import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, TrendingUp, Users, Megaphone, Phone, Radar, ArrowRight } from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { leads } from '@/data/leads'
import { campaigns } from '@/data/campaigns'
import { getRecentCalls } from '@/data/calls'
import { intentBadge } from '@/components/ui/StatusBadge'

const recentCalls = getRecentCalls(5)

const quickActions = [
  { label: 'Lead Discovery', icon: <Radar className="w-3.5 h-3.5" />, to: '/lead-discovery' },
  { label: 'AI Voice Agent', icon: <Phone className="w-3.5 h-3.5" />, to: '/ai-voice-agent' },
  { label: 'Active Campaigns', icon: <Megaphone className="w-3.5 h-3.5" />, to: '/campaigns' },
  { label: 'Analytics', icon: <TrendingUp className="w-3.5 h-3.5" />, to: '/analytics' },
]

export function GlobalSearch() {
  const { globalSearchOpen, setGlobalSearchOpen } = useAppContext()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setGlobalSearchOpen(true)
      }
      if (e.key === 'Escape') setGlobalSearchOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setGlobalSearchOpen])

  if (!globalSearchOpen) return null

  const q = query.toLowerCase().trim()
  const filteredLeads = q
    ? leads.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.requirement.toLowerCase().includes(q) ||
        l.industry.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q)
      ).slice(0, 5)
    : leads.filter(l => l.intent === 'HIGH').slice(0, 5)

  const filteredCampaigns = q
    ? campaigns.filter(c => c.name.toLowerCase().includes(q) || c.target.toLowerCase().includes(q)).slice(0, 3)
    : campaigns.filter(c => c.status === 'ACTIVE').slice(0, 3)

  function navigate_to(path: string) {
    navigate(path)
    setGlobalSearchOpen(false)
    setQuery('')
  }

  return (
    <>
      <div className="modal-overlay" onClick={() => setGlobalSearchOpen(false)}>
        <div className="modal-panel max-w-2xl" onClick={e => e.stopPropagation()}>
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-bg-border">
            <Search className="w-4 h-4 text-text-muted shrink-0" />
            <input
              autoFocus
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none font-mono"
              placeholder="Search leads, companies, campaigns, calls..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-text-muted hover:text-text-primary">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="text-2xs border border-bg-border rounded px-1.5 py-0.5 bg-bg-panel text-text-muted">Esc</kbd>
          </div>

          <div className="max-h-[500px] overflow-y-auto p-3 space-y-4">
            {/* Quick actions (shown when no query) */}
            {!q && (
              <div>
                <div className="text-2xs uppercase tracking-wider text-text-muted px-1 mb-2 font-medium">Quick Navigation</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {quickActions.map(a => (
                    <button key={a.label} onClick={() => navigate_to(a.to)}
                      className="flex items-center gap-2 px-3 py-2.5 bg-bg-card hover:bg-bg-hover rounded border border-bg-border text-xs text-text-secondary hover:text-text-primary transition-colors">
                      {a.icon} {a.label}
                      <ArrowRight className="w-3 h-3 ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Leads */}
            {filteredLeads.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="text-2xs uppercase tracking-wider text-text-muted font-medium">
                    {q ? 'Matching Leads' : 'High Intent Leads'}
                  </div>
                  <button onClick={() => navigate_to('/leads')} className="text-2xs text-amber-400 hover:underline">View all</button>
                </div>
                {filteredLeads.map(lead => (
                  <button key={lead.id} onClick={() => navigate_to('/leads')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-bg-hover transition-colors text-left group">
                    <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xs font-bold text-amber-400 shrink-0">
                      {lead.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-text-primary">{lead.name}</span>
                        {intentBadge(lead.intent)}
                      </div>
                      <div className="text-2xs text-text-muted truncate">{lead.jobTitle} · {lead.company}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-amber-400">{lead.intentScore}</div>
                      <div className="text-2xs text-text-muted">{lead.source}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Campaigns */}
            {filteredCampaigns.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="text-2xs uppercase tracking-wider text-text-muted font-medium">
                    {q ? 'Matching Campaigns' : 'Active Campaigns'}
                  </div>
                  <button onClick={() => navigate_to('/campaigns')} className="text-2xs text-amber-400 hover:underline">View all</button>
                </div>
                {filteredCampaigns.map(camp => (
                  <button key={camp.id} onClick={() => navigate_to('/campaigns')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-bg-hover transition-colors text-left">
                    <Megaphone className="w-4 h-4 text-text-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-text-primary">{camp.name}</div>
                      <div className="text-2xs text-text-muted">{camp.leads} leads · {camp.conversion}% conversion</div>
                    </div>
                    <span className={`badge text-2xs ${camp.status === 'ACTIVE' ? 'badge-success' : 'badge-blue'}`}>{camp.status}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Empty */}
            {q && filteredLeads.length === 0 && filteredCampaigns.length === 0 && (
              <div className="text-center py-8 text-text-muted text-xs">
                No results found for "<span className="text-text-primary">{query}</span>"
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-bg-border px-4 py-2 flex items-center gap-4 text-2xs text-text-muted">
            <span><kbd className="border border-bg-border rounded px-1">↑↓</kbd> Navigate</span>
            <span><kbd className="border border-bg-border rounded px-1">↵</kbd> Select</span>
            <span><kbd className="border border-bg-border rounded px-1">Esc</kbd> Close</span>
            <span className="ml-auto">{leads.length} leads indexed</span>
          </div>
        </div>
      </div>
    </>
  )
}
