import { useState } from 'react'
import { Link2, CheckCircle, XCircle, RefreshCw, Settings, Upload, Download } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { leads } from '@/data/leads'
import { exportToCSV } from '@/lib/exportCsv'
import { ImportLeadsModal } from '@/components/ui/ImportLeadsModal'

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
  const [selectedCrmForConfig, setSelectedCrmForConfig] = useState<typeof crms[0] | null>(null)
  const [crmConfig, setCrmConfig] = useState({
    syncInterval: '15m',
    instanceUrl: 'https://callistoai.salesforce.com',
  })

  function handleExportAllLeads(filterType?: string) {
    let data = leads
    let filename = 'crm_leads_export.csv'

    if (filterType === 'High Intent Leads (CSV)') {
      data = leads.filter(l => l.intent === 'HIGH')
      filename = 'crm_high_intent_leads.csv'
    } else if (filterType === 'Qualified Leads (Excel)' || filterType === 'Qualified') {
      data = leads.filter(l => l.status === 'QUALIFIED')
      filename = 'crm_qualified_leads.csv'
    } else if (filterType === 'Campaign Leads (CSV)') {
      data = leads.filter(l => l.status === 'INTERESTED' || l.status === 'CONTACTED')
      filename = 'crm_campaign_leads.csv'
    }

    exportToCSV(filename, data, [
      { key: 'name', label: 'Contact Name' },
      { key: 'company', label: 'Company' },
      { key: 'email', label: 'Email Address' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'industry', label: 'Industry' },
      { key: 'location', label: 'Location' },
      { key: 'status', label: 'CRM Status' },
      { key: 'intentScore', label: 'Lead Score' },
    ])
    showToast('success', 'Export Complete', `${data.length} CRM records exported to CSV`)
  }

  function handleConnect(id: string) {
    setStatuses(p => ({ ...p, [id]: 'SYNCING' }))
    showToast('info', 'Connecting...', `Initiating OAuth handshake with ${id}`)
    setTimeout(() => {
      setStatuses(p => ({ ...p, [id]: 'CONNECTED' }))
      showToast('success', 'Connected!', `Successfully integrated ${id}`)
    }, 2000)
  }

  function handleSync(id: string) {
    setStatuses(p => ({ ...p, [id]: 'SYNCING' }))
    showToast('info', 'Sync Started', `Syncing records with ${id}...`)
    setTimeout(() => {
      setStatuses(p => ({ ...p, [id]: 'CONNECTED' }))
      showToast('success', 'Sync Complete', `All records up to date with ${id}`)
    }, 1800)
  }

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-amber-400 shrink-0" />
          <h1 className="text-sm font-bold text-text-primary">CRM Integration</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary text-xs gap-1.5 flex-1 sm:flex-initial justify-center">
            <Upload className="w-3.5 h-3.5" /> Import Leads
          </button>
          <button onClick={() => handleExportAllLeads()} className="btn-secondary text-xs gap-1.5 flex-1 sm:flex-initial justify-center">
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
                    <button
                      onClick={() => setSelectedCrmForConfig(crm)}
                      className="btn-ghost p-1.5 hover:text-amber-400"
                      title="Configure CRM Settings"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
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
                <button onClick={() => handleExportAllLeads(e.label)} className="btn-secondary text-2xs py-1 px-2">
                  <Download className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <ImportLeadsModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImportSuccess={(count) => {
          showToast('success', 'Import Complete', `${count} leads successfully imported and mapped to CRM`)
        }}
      />

      {/* CRM Settings Modal */}
      {selectedCrmForConfig && (
        <div className="modal-overlay" onClick={() => setSelectedCrmForConfig(null)}>
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedCrmForConfig.logo}</span>
                <span className="section-title">{selectedCrmForConfig.name} Configuration</span>
              </div>
              <button onClick={() => setSelectedCrmForConfig(null)}><XCircle className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Instance / API URL</label>
                <input
                  className="input font-mono text-xs"
                  value={crmConfig.instanceUrl}
                  onChange={e => setCrmConfig(p => ({ ...p, instanceUrl: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Sync Frequency</label>
                  <select
                    className="input text-xs"
                    value={crmConfig.syncInterval}
                    onChange={e => setCrmConfig(p => ({ ...p, syncInterval: e.target.value }))}
                  >
                    <option value="realtime">Real-time (Webhooks)</option>
                    <option value="15m">Every 15 minutes</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Default Lead Status</label>
                  <select className="input text-xs">
                    <option>Open - Not Contacted</option>
                    <option>Working - Contacted</option>
                    <option>Qualified</option>
                  </select>
                </div>
              </div>

              {/* Field Mapping */}
              <div className="space-y-2 pt-2 border-t border-bg-border">
                <div className="font-semibold text-text-primary">Field Mappings</div>
                <div className="space-y-1.5 font-mono text-2xs">
                  {[
                    ['Prospect Name', 'Contact.FullName'],
                    ['Corporate Email', 'Contact.Email'],
                    ['Company Name', 'Account.Name'],
                    ['AI Intent Score', 'Lead.AI_Intent_Score__c'],
                    ['Next Best Action', 'Task.Subject'],
                  ].map(([local, remote]) => (
                    <div key={local} className="flex items-center justify-between p-2 bg-bg-card border border-bg-border rounded">
                      <span className="text-text-secondary">{local}</span>
                      <span className="text-text-muted">⇄</span>
                      <span className="text-amber-400">{remote}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-between pt-2 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => showToast('info', 'Testing Connection', `Connecting to ${selectedCrmForConfig.name}... Connected! (Latency: 64ms)`)}
                  className="btn-secondary text-xs"
                >
                  Test Connection
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedCrmForConfig(null)} className="btn-secondary text-xs">Cancel</button>
                  <button
                    onClick={() => {
                      setSelectedCrmForConfig(null)
                      showToast('success', 'Settings Saved', `${selectedCrmForConfig.name} configuration updated`)
                    }}
                    className="btn-primary text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
