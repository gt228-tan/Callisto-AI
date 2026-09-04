import { useState } from 'react'
import { Link2, CheckCircle, XCircle, RefreshCw, Settings, Upload, Download } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

const crms = [
  { id: 'salesforce', name: 'Salesforce', desc: 'CRM & Sales Cloud integration', logo: '⚡', status: 'CONNECTED' as const, lastSync: '2m ago', records: 234 },
  { id: 'hubspot',    name: 'HubSpot',    desc: 'Marketing & Sales Hub integration', logo: '🟠', status: 'SYNCING' as const,  lastSync: 'Syncing...', records: 187 },
  { id: 'zoho',       name: 'Zoho CRM',   desc: 'Full Zoho CRM integration',         logo: '🔴', status: 'DISCONNECTED' as const, lastSync: 'Never', records: 0 },
  { id: 'pipedrive',  name: 'Pipedrive',  desc: 'Sales pipeline integration',        logo: '🟢', status: 'ERROR' as const,  lastSync: '3h ago', records: 89 },
]

type CrmStatus = 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR'

const statusStyles: Record<CrmStatus, { badge: string; icon: React.ReactNode }> = {
  CONNECTED:    { badge: 'badge-success', icon: <CheckCircle className="w-4 h-4 text-success" /> },
  DISCONNECTED: { badge: 'badge-low',     icon: <XCircle className="w-4 h-4 text-text-muted" /> },
  SYNCING:      { badge: 'badge-blue',    icon: <RefreshCw className="w-4 h-4 text-info-bright animate-spin" /> },
  ERROR:        { badge: 'badge-danger',  icon: <XCircle className="w-4 h-4 text-danger-bright" /> },
}

export function CRM() {
  const { showToast } = useToast()
  const [statuses, setStatuses] = useState<Record<string, CrmStatus>>({
    salesforce: 'CONNECTED', hubspot: 'SYNCING', zoho: 'DISCONNECTED', pipedrive: 'ERROR'
  })
  const [showImport, setShowImport] = useState(false)

  function handleConnect(id: string) {
    setStatuses(s => ({...s, [id]: 'SYNCING'}))
    setTimeout(() => {
      setStatuses(s => ({...s, [id]: 'CONNECTED'}))
      showToast('success', 'CRM Connected', `${crms.find(c=>c.id===id)?.name} connected successfully`)
    }, 2000)
  }

  function handleSync(id: string) {
    showToast('info', 'Sync Started', `Syncing ${crms.find(c=>c.id===id)?.name}...`)
    setStatuses(s => ({...s, [id]: 'SYNCING'}))
    setTimeout(() => { setStatuses(s => ({...s, [id]: 'CONNECTED'})); showToast('success','Sync Complete',`Records updated`) }, 2000)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-amber-400" />
          <h1 className="text-sm font-bold text-text-primary">CRM Integration</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary text-xs gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Import Leads
          </button>
          <button onClick={() => showToast('success','Export Complete','Leads exported to CSV')} className="btn-secondary text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export Leads
          </button>
        </div>
      </div>

      {/* CRM Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {crms.map(crm => {
          const status = statuses[crm.id] as CrmStatus
          const { badge, icon } = statusStyles[status]
          return (
            <div key={crm.id} className="panel p-5 flex flex-col gap-4 hover:border-amber-500/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="text-3xl">{crm.logo}</div>
                {icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">{crm.name}</div>
                <div className="text-xs text-text-muted mt-0.5">{crm.desc}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className={badge}>{status}</span>
                {status === 'CONNECTED' && <span className="text-2xs text-text-muted font-mono">{crm.records} records</span>}
              </div>
              <div className="text-2xs text-text-muted">Last sync: {crm.lastSync}</div>
              <div className="flex gap-2 mt-auto">
                {status === 'DISCONNECTED' || status === 'ERROR' ? (
                  <button onClick={() => handleConnect(crm.id)} className="btn-primary text-xs flex-1">Connect</button>
                ) : (
                  <>
                    <button onClick={() => handleSync(crm.id)} className="btn-secondary text-xs flex-1 gap-1">
                      <RefreshCw className="w-3 h-3" /> Sync
                    </button>
                    <button className="btn-ghost p-1.5"><Settings className="w-3.5 h-3.5" /></button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Data Management */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="panel p-5">
          <div className="text-sm font-semibold text-text-primary mb-3">Import Leads from CSV / Excel</div>
          <div className="border-2 border-dashed border-bg-border rounded-lg p-8 text-center hover:border-amber-500/40 transition-colors cursor-pointer"
            onClick={() => setShowImport(true)}>
            <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <div className="text-sm text-text-secondary">Drop file here or click to browse</div>
            <div className="text-xs text-text-muted mt-1">Supports CSV, XLS, XLSX up to 10MB</div>
          </div>
          <div className="mt-3 space-y-1 text-xs text-text-muted">
            <div>Required columns: <span className="text-text-secondary">Name, Email, Company</span></div>
            <div>Optional: Phone, Industry, Location, Job Title, LinkedIn</div>
          </div>
        </div>

        <div className="panel p-5">
          <div className="text-sm font-semibold text-text-primary mb-3">Export Leads</div>
          <div className="space-y-3">
            {[
              { label: 'All Leads (CSV)',           count: 50 },
              { label: 'High Intent Leads (CSV)',   count: 22 },
              { label: 'Qualified Leads (Excel)',   count: 14 },
              { label: 'Campaign Leads (CSV)',      count: 38 },
            ].map(e => (
              <div key={e.label} className="flex items-center justify-between p-2.5 bg-bg-card border border-bg-border rounded hover:border-amber-500/30 transition-colors">
                <div>
                  <div className="text-xs text-text-primary">{e.label}</div>
                  <div className="text-2xs text-text-muted">{e.count} records</div>
                </div>
                <button onClick={() => showToast('success','Export Started',`Downloading ${e.label}`)} className="btn-secondary text-2xs py-1 px-2">
                  <Download className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal-panel max-w-md" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <span className="section-title">Import Leads</span>
              <button onClick={() => setShowImport(false)}><XCircle className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-amber-500/40 rounded-lg p-8 text-center bg-amber-500/5">
                <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <div className="text-sm text-text-secondary">Drop your CSV file here</div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowImport(false)} className="btn-secondary text-xs">Cancel</button>
                <button onClick={() => { setShowImport(false); showToast('success','Import Complete','120 leads imported successfully') }} className="btn-primary text-xs">
                  Import 120 Leads
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
