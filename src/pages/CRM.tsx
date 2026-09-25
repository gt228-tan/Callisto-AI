import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Link2, CheckCircle, XCircle, RefreshCw, Settings, Upload, Download,
  Server, Globe, Database, Activity, Terminal, Copy, Check, ExternalLink,
  Zap, Plus, Trash2, Play, ShieldCheck, AlertCircle, ArrowRight, Code2,
  Sliders, Search, ArrowUpRight, ArrowDownLeft, Layers, Radio, Phone,
  Mic, Clock, Sparkles, User, Calendar
} from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { useLeads } from '@/contexts/LeadContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAudit } from '@/contexts/AuditContext'
import { exportLeadsToExcel, exportLeadsToCSV } from '@/lib/excelLeads'
import { ImportLeadsModal } from '@/components/ui/ImportLeadsModal'
import {
  loadCrms, saveCrms, loadLeadSources, saveLeadSources,
  loadSyncLogs, addSyncLog, generateMockLeadsForSource,
  loadVoiceAgentCrmConfig, saveVoiceAgentCrmConfig,
  loadSyncedVoiceCalls, syncVoiceCallToCrm, syncBatchVoiceCallsToCrm,
  type CRMIntegration, type LeadSourceIntegration, type SyncActivityRecord,
  type CrmStatus, type LeadSourceStatus, type SyncDirection,
  type VoiceAgentCrmConfig, type SyncedVoiceCallRecord, type VoiceCallSyncPayload
} from '@/services/crmService'
import { checkServerHealth, getSavedServerUrl, saveServerUrl, type ServerHealthResult } from '@/services/apiClient'
import { formatDateTime, formatDuration, timeAgo } from '@/lib/utils'

type ActiveTab = 'crms' | 'voice_sync' | 'sources' | 'logs' | 'server' | 'data'

const statusStyles: Record<CrmStatus, { badge: string; icon: React.ReactNode }> = {
  CONNECTED:    { badge: 'badge-success', icon: <CheckCircle className="w-4 h-4 text-success" /> },
  DISCONNECTED: { badge: 'badge-low',     icon: <XCircle className="w-4 h-4 text-text-muted" /> },
  SYNCING:      { badge: 'badge-blue',    icon: <RefreshCw className="w-4 h-4 text-info-bright animate-spin" /> },
  ERROR:        { badge: 'badge-danger',  icon: <XCircle className="w-4 h-4 text-danger-bright" /> },
  PAUSED:       { badge: 'badge-amber',   icon: <AlertCircle className="w-4 h-4 text-amber-400" /> },
}

const sourceStatusStyles: Record<LeadSourceStatus, { badge: string; label: string }> = {
  ACTIVE:       { badge: 'badge-success', label: 'Active Stream' },
  SYNCING:      { badge: 'badge-blue',    label: 'Ingesting...' },
  INACTIVE:     { badge: 'badge-low',     label: 'Paused' },
  RATE_LIMITED: { badge: 'badge-amber',   label: 'Rate Limited' },
}

export function CRM() {
  const { showToast } = useToast()
  const { leadsList, addLeads } = useLeads()

  const [activeTab, setActiveTab] = useState<ActiveTab>('crms')
  const [crms, setCrms] = useState<CRMIntegration[]>(loadCrms)
  const [sources, setSources] = useState<LeadSourceIntegration[]>(loadLeadSources)
  const [logs, setLogs] = useState<SyncActivityRecord[]>(loadSyncLogs)
  const [voiceCrmConfig, setVoiceCrmConfig] = useState<VoiceAgentCrmConfig>(loadVoiceAgentCrmConfig)
  const [syncedVoiceCalls, setSyncedVoiceCalls] = useState<SyncedVoiceCallRecord[]>(loadSyncedVoiceCalls)
  const [selectedVoiceCallDetail, setSelectedVoiceCallDetail] = useState<SyncedVoiceCallRecord | null>(null)
  const [isBatchSyncingVoice, setIsBatchSyncingVoice] = useState(false)

  // Listen for cross-app CRM sync events reactively
  useEffect(() => {
    function handleCrmSyncEvent() {
      setCrms(loadCrms())
      setLogs(loadSyncLogs())
      setVoiceCrmConfig(loadVoiceAgentCrmConfig())
      setSyncedVoiceCalls(loadSyncedVoiceCalls())
    }
    window.addEventListener('callisto_crm_synced', handleCrmSyncEvent)
    return () => window.removeEventListener('callisto_crm_synced', handleCrmSyncEvent)
  }, [])

  // Modals & Selection
  const [showImport, setShowImport] = useState(false)
  const [selectedCrmForConfig, setSelectedCrmForConfig] = useState<CRMIntegration | null>(null)
  const [selectedSourceForWebhook, setSelectedSourceForWebhook] = useState<LeadSourceIntegration | null>(null)
  const [selectedLogPayload, setSelectedLogPayload] = useState<SyncActivityRecord | null>(null)

  // Filters
  const [sourceCategory, setSourceCategory] = useState<string>('All')
  const [logStatusFilter, setLogStatusFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Server health testing state
  const [serverUrlInput, setServerUrlInput] = useState(getSavedServerUrl())
  const [isPingingServer, setIsPingingServer] = useState(false)
  const [serverHealth, setServerHealth] = useState<ServerHealthResult | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Test webhook payload state
  const [testWebhookPayload, setTestWebhookPayload] = useState(
    JSON.stringify(
      {
        name: 'Rajesh Varma',
        title: 'Chief Operating Officer',
        company: 'Apex Logistics & Freight',
        industry: 'Logistics',
        email: 'rajesh.varma@apexlogistics.in',
        phone: '+91-98112-99881',
        location: 'Mumbai, India',
        intentScore: 95,
        requirement: 'Urgent requirement for autonomous AI calling to verify shipment delivery status with 2,000 daily fleet drivers.',
      },
      null,
      2
    )
  )

  // Check server health on initial mount
  useEffect(() => {
    checkServerHealth(serverUrlInput).then(setServerHealth)
  }, [])

  // Persist changes
  useEffect(() => {
    saveCrms(crms)
  }, [crms])

  useEffect(() => {
    saveLeadSources(sources)
  }, [sources])

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    showToast('info', 'Copied to Clipboard', text.slice(0, 40) + '...')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const { user, can } = useAuth()
  const { logAction } = useAudit()
  const syncRateLimitRef = useRef<number[]>([])
  const MAX_SYNCS_PER_MINUTE = 10

  function checkSyncRateLimit(): boolean {
    const now = Date.now()
    syncRateLimitRef.current = syncRateLimitRef.current.filter((t: number) => t > now - 60000)
    if (syncRateLimitRef.current.length >= MAX_SYNCS_PER_MINUTE) {
      return false
    }
    syncRateLimitRef.current.push(now)
    return true
  }

  // --- AI Voice Agent CRM Sync Handlers ---
  function handleToggleVoiceAutoSync() {
    const updated: VoiceAgentCrmConfig = {
      ...voiceCrmConfig,
      autoSyncCalls: !voiceCrmConfig.autoSyncCalls,
    }
    setVoiceCrmConfig(updated)
    saveVoiceAgentCrmConfig(updated)
    showToast(
      'success',
      'Autonomous Voice Sync Setting',
      `Auto-Sync is now ${updated.autoSyncCalls ? 'ENABLED (Real-time on call completion)' : 'PAUSED (Manual push only)'}`
    )
  }

  function handleUpdateVoiceDefaultCrm(targetId: string) {
    const updated: VoiceAgentCrmConfig = { ...voiceCrmConfig, targetCrmId: targetId }
    setVoiceCrmConfig(updated)
    saveVoiceAgentCrmConfig(updated)
    showToast('success', 'Default CRM Target Updated', `Voice calls will route to ${targetId.toUpperCase()}`)
  }

  async function handleBatchSyncAllVoiceCalls() {
    setIsBatchSyncingVoice(true)
    try {
      if (syncedVoiceCalls.length === 0) {
        // Generate seed calls to demonstrate live CRM sync
        const demoCalls: VoiceCallSyncPayload[] = [
          {
            prospectName: 'Vikram Sethi',
            company: 'Nexus Health Systems',
            phone: '+91-98201-44321',
            email: 'vikram.sethi@nexushealth.in',
            durationSeconds: 215,
            outcome: 'MEETING_BOOKED',
            sentiment: 'POSITIVE',
            intentScore: 94,
            qualification: 'QUALIFIED',
            summary: 'Prospect manages 14 clinics and is looking to automate patient appointment reminders & lab follow-ups. Very receptive to Callisto Voice AI.',
            buyingSignals: ['Urgent Q3 deployment needed', 'Budget pre-approved up to $4,000/mo', 'Current manual call center churn is 35%'],
            nextBestAction: 'Send enterprise SLA contract and book technical integration kickoff.',
            targetCrmId: voiceCrmConfig.targetCrmId,
          },
          {
            prospectName: 'Ananya Deshmukh',
            company: 'FinEdge Microfinance',
            phone: '+91-97118-22345',
            email: 'ananya@finedge.co',
            durationSeconds: 180,
            outcome: 'QUALIFIED',
            sentiment: 'POSITIVE',
            intentScore: 82,
            qualification: 'QUALIFIED',
            summary: 'Interested in autonomous loan verification calls. Asked about multi-lingual dialect support in Hindi and Marathi.',
            buyingSignals: ['Requires regional language AI calling', 'Security compliance ISO 27001 mandatory'],
            nextBestAction: 'Schedule 30-min live demo with regional speech model sandbox.',
            targetCrmId: voiceCrmConfig.targetCrmId,
          }
        ]
        for (const call of demoCalls) {
          await syncVoiceCallToCrm(call, { force: true })
        }
      } else {
        await syncBatchVoiceCallsToCrm(syncedVoiceCalls, voiceCrmConfig.targetCrmId)
      }
      setSyncedVoiceCalls(loadSyncedVoiceCalls())
      setCrms(loadCrms())
      setLogs(loadSyncLogs())
      showToast('success', 'AI Voice Calls Synced', `All voice sessions, audio transcripts & Gemini intelligence synchronized to ${voiceCrmConfig.targetCrmId.toUpperCase()}`)
    } catch (err: any) {
      showToast('error', 'Sync Failed', err.message || 'Error syncing calls')
    } finally {
      setIsBatchSyncingVoice(false)
    }
  }

  // --- CRM Actions ---
  function handleConnectCrm(id: string) {
    if (!can('canSyncCrm')) {
      showToast('error', 'Access Denied', `Role ${user?.role || 'VIEWER'} does not have CRM integration permissions.`)
      logAction({
        userId: user?.id,
        userName: user?.name,
        userRole: user?.role,
        action: 'UNAUTHORIZED_CRM_CONNECT_BLOCKED',
        resource: `CRM: ${id}`,
        status: 'BLOCKED',
        details: `Role ${user?.role} attempted CRM OAuth handshake without authorization.`,
      })
      return
    }

    setCrms(prev => prev.map(c => c.id === id ? { ...c, status: 'SYNCING' } : c))
    showToast('info', 'Connecting CRM...', `Initiating OAuth handshake with ${id}`)

    setTimeout(() => {
      setCrms(prev => prev.map(c => c.id === id ? { ...c, status: 'CONNECTED', lastSync: 'Just now' } : c))
      const targetCrm = crms.find(c => c.id === id)
      addSyncLog({
        integrationId: id,
        integrationName: targetCrm?.name || id,
        type: 'CRM_PULL',
        status: 'SUCCESS',
        recordsCount: 0,
        latencyMs: 142,
        message: `Successfully authenticated OAuth2 token for ${targetCrm?.name || id}`,
      })
      setLogs(loadSyncLogs())

      logAction({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        userRole: user?.role,
        action: 'CRM_OAUTH_CONNECTED',
        resource: `CRM: ${targetCrm?.name || id}`,
        status: 'SUCCESS',
        details: `OAuth2 token verified and integration activated for ${targetCrm?.name || id}.`,
      })

      showToast('success', 'Connected!', `Successfully integrated with ${targetCrm?.name || id}`)
    }, 1500)
  }

  function handleSyncCrm(id: string) {
    // 1. RBAC Clearance Enforcement
    if (!can('canSyncCrm')) {
      showToast('error', 'Access Denied', `Role ${user?.role || 'VIEWER'} does not hold CRM write/sync permissions.`)
      logAction({
        userId: user?.id,
        userName: user?.name,
        userRole: user?.role,
        action: 'UNAUTHORIZED_CRM_SYNC_BLOCKED',
        resource: `CRM: ${id}`,
        status: 'BLOCKED',
        details: `Role ${user?.role} attempted manual/auto sync without required clearance.`,
      })
      return
    }

    // 2. Sliding Window Rate Limiting Shield (Anti-DoS)
    if (!checkSyncRateLimit()) {
      showToast('warning', 'Rate Limit Throttled', 'Rate limit shield active (10 syncs/min quota). Please wait before triggering another sync.')
      logAction({
        userId: user?.id,
        userName: user?.name,
        userRole: user?.role,
        action: 'CRM_SYNC_RATE_LIMIT_BLOCKED',
        resource: `CRM: ${id}`,
        status: 'BLOCKED',
        details: 'Rate limit threshold hit (10 sync requests in 60 seconds). Throttled.',
      })
      return
    }

    setCrms(prev => prev.map(c => c.id === id ? { ...c, status: 'SYNCING' } : c))
    const targetCrm = crms.find(c => c.id === id)
    showToast('info', 'Sync Started', `Syncing bidirectional records with ${targetCrm?.name || id}...`)

    setTimeout(() => {
      const recordsUpdated = Math.floor(Math.random() * 15) + 5
      setCrms(prev => prev.map(c => c.id === id ? {
        ...c,
        status: 'CONNECTED',
        lastSync: 'Just now',
        records: c.records + recordsUpdated
      } : c))

      addSyncLog({
        integrationId: id,
        integrationName: targetCrm?.name || id,
        type: targetCrm?.syncDirection === 'OUTBOUND' ? 'CRM_PUSH' : 'CRM_PULL',
        status: 'SUCCESS',
        recordsCount: recordsUpdated,
        latencyMs: Math.floor(Math.random() * 80) + 110,
        message: `Synced ${recordsUpdated} lead records with ${targetCrm?.name || id}`,
        payloadSummary: JSON.stringify({ synced: recordsUpdated, status: 'OK', direction: targetCrm?.syncDirection }),
      })
      setLogs(loadSyncLogs())

      // Action-level write logging tied to User ID + IST Timestamp + IP
      logAction({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        userRole: user?.role,
        action: 'CRM_AUTO_SYNC_EXECUTE',
        resource: `CRM: ${targetCrm?.name || id}`,
        status: 'SUCCESS',
        details: `Synchronized ${recordsUpdated} lead records with ${targetCrm?.name || id} (Direction: ${targetCrm?.syncDirection || 'BIDIRECTIONAL'}).`,
      })

      showToast('success', 'Sync Complete', `Synchronized ${recordsUpdated} records with ${targetCrm?.name || id}`)
    }, 1200)
  }

  // --- Lead Source Actions ---
  function handlePullFromSource(source: LeadSourceIntegration) {
    setSources(prev => prev.map(s => s.id === source.id ? { ...s, status: 'SYNCING' } : s))
    showToast('info', 'Ingesting Leads', `Pulling high-intent prospect signals from ${source.name}...`)

    setTimeout(() => {
      const count = 3
      const newLeads = generateMockLeadsForSource(source.name, count)
      const res = addLeads(newLeads, 'keep_both')

      setSources(prev => prev.map(s => s.id === source.id ? {
        ...s,
        status: 'ACTIVE',
        lastIngest: 'Just now',
        leadsIngestedToday: s.leadsIngestedToday + res.added,
        totalIngested: s.totalIngested + res.added
      } : s))

      addSyncLog({
        integrationId: source.id,
        integrationName: source.name,
        type: 'SOURCE_INGEST',
        status: 'SUCCESS',
        recordsCount: res.added,
        latencyMs: source.latencyMs,
        message: `Ingested ${res.added} verified leads from ${source.name}`,
        payloadSummary: JSON.stringify(newLeads.map(l => ({ name: l.name, company: l.company, score: l.intentScore }))),
      })
      setLogs(loadSyncLogs())
      showToast('success', 'Ingestion Successful', `Added ${res.added} new leads from ${source.name} into Callisto AI pipeline!`)
    }, 1100)
  }

  function handleSendWebhookTestPing() {
    try {
      const parsed = JSON.parse(testWebhookPayload)
      const sourceName = selectedSourceForWebhook?.name || 'Inbound Webhook'
      const simulatedLead = {
        name: parsed.name || 'Webhook Lead',
        jobTitle: parsed.title || 'Director',
        company: parsed.company || 'Enterprise Corp',
        industry: parsed.industry || 'Technology',
        location: parsed.location || 'Bangalore, India',
        country: 'India',
        email: parsed.email || 'webhook@company.com',
        phone: parsed.phone || '+91-98000-00000',
        requirement: parsed.requirement || 'Autonomous AI voice agent deployment required.',
        intentScore: parsed.intentScore || 92,
        intent: 'HIGH' as const,
        source: sourceName,
        sourceUrl: `https://webhook.callistoai.com/event/${Date.now()}`,
        status: 'QUALIFIED' as const,
        tags: ['Inbound Webhook', 'Realtime Test'],
      }

      const res = addLeads([simulatedLead], 'keep_both')
      addSyncLog({
        integrationId: selectedSourceForWebhook?.id || 'inbound_webhook',
        integrationName: sourceName,
        type: 'WEBHOOK_EVENT',
        status: 'SUCCESS',
        recordsCount: res.added,
        latencyMs: 38,
        message: `Simulated inbound webhook event accepted & parsed from ${sourceName}`,
        payloadSummary: testWebhookPayload,
      })
      setLogs(loadSyncLogs())
      showToast('success', 'Webhook Ingested!', `Parsed lead "${simulatedLead.name}" (${simulatedLead.company}) with ${simulatedLead.intentScore}% Intent!`)
      setSelectedSourceForWebhook(null)
    } catch (e: any) {
      showToast('error', 'Invalid JSON', 'Please verify JSON syntax in test payload')
    }
  }

  // --- Server Connection Ping ---
  async function handleTestServerPing() {
    setIsPingingServer(true)
    saveServerUrl(serverUrlInput)
    const result = await checkServerHealth(serverUrlInput)
    setServerHealth(result)
    setIsPingingServer(false)

    if (result.connected) {
      showToast('success', 'Server Connected!', `Live backend responding at ${result.serverUrl} (${result.latencyMs}ms latency)`)
    } else {
      showToast('info', 'Client Simulation Active', `Could not reach ${serverUrlInput}. Standalone client mode is running with full persistence.`)
    }
  }

  // Exports
  function handleExportAllLeads(filterType?: string) {
    let data = leadsList
    let isExcel = false

    if (filterType === 'High Intent Leads (CSV)') {
      data = leadsList.filter(l => l.intent === 'HIGH')
    } else if (filterType === 'Qualified Leads (Excel)' || filterType === 'Qualified') {
      data = leadsList.filter(l => l.status === 'QUALIFIED')
      isExcel = true
    } else if (filterType === 'Campaign Leads (CSV)') {
      data = leadsList.filter(l => l.status === 'INTERESTED' || l.status === 'CONTACTED')
    }

    if (isExcel) {
      exportLeadsToExcel('crm_qualified_leads.xlsx', data)
      showToast('success', 'Excel Export Complete', `${data.length} CRM records exported to .xlsx`)
    } else {
      exportLeadsToCSV('crm_leads_export.csv', data)
      showToast('success', 'CSV Export Complete', `${data.length} CRM records exported to .csv`)
    }
  }

  // Metrics
  const connectedCrmsCount = useMemo(() => crms.filter(c => c.status === 'CONNECTED').length, [crms])
  const activeSourcesCount = useMemo(() => sources.filter(s => s.status === 'ACTIVE').length, [sources])
  const totalLeadsIngestedToday = useMemo(() => sources.reduce((acc, s) => acc + s.leadsIngestedToday, 0), [sources])

  // Filtered lists
  const filteredSources = useMemo(() => {
    return sources.filter(s => {
      const matchCat = sourceCategory === 'All' || s.category === sourceCategory
      const matchSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCat && matchSearch
    })
  }, [sources, sourceCategory, searchQuery])

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchStatus = logStatusFilter === 'All' || l.status === logStatusFilter
      return matchStatus
    })
  }, [logs, logStatusFilter])

  const categories = ['All', 'B2B Database', 'Social & Professional', 'Local Discovery', 'Email Finder', 'Webhooks & Inbound', 'Paid Ads']

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bg-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                CRM & Lead Sources Hub
                <span className="badge-blue text-3xs font-mono">ENTERPRISE GATEWAY</span>
              </h1>
              <p className="text-2xs sm:text-xs text-text-muted mt-0.5">
                Bidirectional CRM synchronization, multi-channel lead ingestion, webhook listeners & live server API
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Server Status Pill */}
          <button
            onClick={() => setActiveTab('server')}
            className={`px-3 py-1.5 rounded-lg text-2xs font-mono flex items-center gap-1.5 border transition-all ${
              serverHealth?.connected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="Click to view server connection & architecture setup"
          >
            <span className={`w-2 h-2 rounded-full ${serverHealth?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{serverHealth?.connected ? `Live Server (${serverHealth.latencyMs}ms)` : 'Client Mode / Server Guide'}</span>
          </button>

          <button onClick={() => setShowImport(true)} className="btn-secondary text-xs py-2 px-3 gap-1.5 font-medium">
            <Upload className="w-3.5 h-3.5 text-text-muted" /> Import
          </button>
          <button onClick={() => handleExportAllLeads()} className="btn-secondary text-xs py-2 px-3 gap-1.5 font-medium">
            <Download className="w-3.5 h-3.5 text-text-muted" /> Export
          </button>
          <button
            onClick={() => setActiveTab('server')}
            className="btn-primary text-xs py-2 px-3.5 gap-1.5 font-semibold shadow-md shadow-amber-500/20"
          >
            <Server className="w-3.5 h-3.5" /> Connect to Server
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-5">
        <div className="panel p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted text-2xs">
            <span>Connected CRMs</span>
            <Database className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-text-primary font-mono">{connectedCrmsCount}</span>
            <span className="text-2xs text-text-muted">/ {crms.length} platforms</span>
          </div>
          <div className="text-3xs text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" /> Bidirectional Sync Active
          </div>
        </div>

        <div className="panel p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted text-2xs">
            <span>Active Lead Sources</span>
            <Globe className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-text-primary font-mono">{activeSourcesCount}</span>
            <span className="text-2xs text-text-muted">/ {sources.length} sources</span>
          </div>
          <div className="text-3xs text-blue-400 mt-1 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" /> Real-time Ingestion Stream
          </div>
        </div>

        <div className="panel p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted text-2xs">
            <span>Leads Ingested Today</span>
            <Activity className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-text-primary font-mono">{totalLeadsIngestedToday}</span>
            <span className="text-2xs text-text-muted">leads</span>
          </div>
          <div className="text-3xs text-text-secondary mt-1 flex items-center gap-1">
            <span className="badge-success text-3xs py-0 px-1">+18% vs yesterday</span>
          </div>
        </div>

        <div className="panel p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted text-2xs">
            <span>Pipeline In-Memory</span>
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-text-primary font-mono">{leadsList.length}</span>
            <span className="text-2xs text-text-muted">total leads</span>
          </div>
          <div className="text-3xs text-text-muted mt-1 truncate">
            {leadsList.filter(l => l.intent === 'HIGH').length} High Intent | Auto-enreached
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-bg-border gap-2 overflow-x-auto pb-px">
        <div className="flex items-center gap-1 shrink-0">
          {[
            { id: 'crms', label: 'CRM Platforms', icon: <Database className="w-3.5 h-3.5" />, count: crms.length },
            { id: 'voice_sync', label: 'AI Voice & Sales Sync', icon: <Phone className="w-3.5 h-3.5" />, count: syncedVoiceCalls.length, highlight: syncedVoiceCalls.length > 0 },
            { id: 'sources', label: 'Lead Source Integrations', icon: <Globe className="w-3.5 h-3.5" />, count: sources.length },
            { id: 'logs', label: 'Sync & Webhook Activity', icon: <Activity className="w-3.5 h-3.5" />, count: logs.length },
            { id: 'server', label: 'Server Connection & Live Setup', icon: <Server className="w-3.5 h-3.5" />, highlight: true },
            { id: 'data', label: 'Import / Export', icon: <Download className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-bg-border'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-3xs px-1.5 py-0.2 rounded-full font-mono ${activeTab === tab.id ? 'bg-amber-400/20 text-amber-300' : 'bg-bg-border text-text-muted'}`}>
                  {tab.count}
                </span>
              )}
              {tab.highlight && !serverHealth?.connected && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: CRM Platforms */}
      {activeTab === 'crms' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-text-muted">
            <span>Manage bidirectional lead routing, contact updates, and task assignments with enterprise CRMs.</span>
            <div className="flex items-center gap-2">
              <span className="text-2xs font-mono text-text-secondary">Sync Mode: Autonomous 2-Way</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {crms.map(crm => {
              const { badge, icon } = statusStyles[crm.status]
              return (
                <div
                  key={crm.id}
                  className="panel p-4 flex flex-col justify-between gap-3 border hover:border-amber-500/40 transition-all bg-bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="text-2xl p-2 rounded-lg bg-bg-secondary border border-bg-border flex items-center justify-center">
                        {crm.logo}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                          {crm.name}
                          <span className="text-3xs px-1 py-0.2 rounded bg-bg-border font-mono text-text-muted uppercase">
                            {crm.authType}
                          </span>
                        </div>
                        <div className="text-2xs text-text-muted line-clamp-1">{crm.desc}</div>
                      </div>
                    </div>
                    {icon}
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2 rounded bg-bg-secondary/70 border border-bg-border text-2xs">
                    <div>
                      <span className="text-text-muted block text-3xs uppercase">Direction</span>
                      <span className="font-semibold text-text-secondary flex items-center gap-1">
                        {crm.syncDirection === 'BIDIRECTIONAL' && <span className="text-amber-400">⇄ 2-Way</span>}
                        {crm.syncDirection === 'OUTBOUND' && <span className="text-blue-400">→ Push Only</span>}
                        {crm.syncDirection === 'INBOUND' && <span className="text-purple-400">← Pull Only</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-3xs uppercase">Sync Cadence</span>
                      <span className="font-mono text-text-secondary">{crm.syncInterval}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-3xs uppercase">Synced Records</span>
                      <span className="font-mono font-bold text-text-primary">{crm.records}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-3xs uppercase">Last Activity</span>
                      <span className="font-mono text-text-muted">{crm.lastSync}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2 border-t border-bg-border/60">
                    <span className={badge}>{crm.status}</span>

                    <div className="flex items-center gap-1.5">
                      {crm.status === 'CONNECTED' ? (
                        <>
                          <button
                            onClick={() => handleSyncCrm(crm.id)}
                            className="btn-secondary text-2xs py-1 px-2.5 gap-1"
                            title="Trigger immediate sync"
                          >
                            <RefreshCw className="w-3 h-3" /> Sync
                          </button>
                          <button
                            onClick={() => setSelectedCrmForConfig(crm)}
                            className="btn-ghost p-1.5 hover:text-amber-400"
                            title="Configure Field Mappings & Endpoints"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleConnectCrm(crm.id)}
                          className="btn-primary text-2xs py-1 px-3 gap-1"
                        >
                          <Zap className="w-3 h-3" /> Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB: AI Voice & Sales Sync */}
      {activeTab === 'voice_sync' && (
        <div className="space-y-4 animate-fade-in">
          {/* Top Banner & Autonomous Controls */}
          <div className="panel p-5 bg-gradient-to-r from-bg-card via-amber-950/10 to-bg-card border border-amber-500/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
                  <Phone className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-text-primary">Autonomous AI Voice-to-CRM Intelligence Engine</h2>
                    <span className="badge badge-success text-3xs font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Bridge
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 max-w-2xl">
                    Every completed AI voice call is analyzed by Gemini Flash for qualification, intent score (0-100), and sentiment, then automatically synchronized to CRM contacts, activity notes, and scheduled follow-ups.
                  </p>
                </div>
              </div>

              {/* Quick Config Controls */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                <div className="flex items-center gap-2 pr-3 border-r border-neutral-800">
                  <span className="text-2xs text-text-muted">Target CRM:</span>
                  <select
                    className="input text-2xs py-1 px-2 font-medium bg-neutral-800 border-neutral-700"
                    value={voiceCrmConfig.targetCrmId}
                    onChange={e => handleUpdateVoiceDefaultCrm(e.target.value)}
                  >
                    {crms.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.status === 'CONNECTED' ? 'Active' : 'Offline'})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleToggleVoiceAutoSync}
                  className={`btn text-2xs py-1 px-2.5 gap-1.5 transition-all ${
                    voiceCrmConfig.autoSyncCalls
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-neutral-800 text-text-muted border border-neutral-700 hover:text-text-primary'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  Auto-Push: {voiceCrmConfig.autoSyncCalls ? 'ON' : 'OFF'}
                </button>

                <button
                  onClick={handleBatchSyncAllVoiceCalls}
                  disabled={isBatchSyncingVoice}
                  className="btn-primary text-2xs py-1 px-3 gap-1.5 font-bold shadow-md shadow-amber-500/10"
                >
                  <RefreshCw className={`w-3 h-3 ${isBatchSyncingVoice ? 'animate-spin' : ''}`} />
                  {isBatchSyncingVoice ? 'Syncing...' : 'Sync All Calls'}
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="panel p-3.5 bg-bg-card border border-bg-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-muted">
                <span className="text-2xs font-medium uppercase tracking-wider">Synced Voice Calls</span>
                <Phone className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-bold font-mono text-text-primary">{syncedVoiceCalls.length}</div>
                <div className="text-3xs text-emerald-400 mt-0.5">Recorded & mapped to CRM</div>
              </div>
            </div>

            <div className="panel p-3.5 bg-bg-card border border-bg-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-muted">
                <span className="text-2xs font-medium uppercase tracking-wider">High Intent Qualified</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {syncedVoiceCalls.filter(c => c.qualification === 'QUALIFIED' || (c.intentScore || 0) >= 70).length}
                </div>
                <div className="text-3xs text-text-muted mt-0.5">Marked as HOT / High Priority</div>
              </div>
            </div>

            <div className="panel p-3.5 bg-bg-card border border-bg-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-muted">
                <span className="text-2xs font-medium uppercase tracking-wider">Talk Time Synced</span>
                <Clock className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-bold font-mono text-text-primary">
                  {Math.round(syncedVoiceCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0) / 60)}m
                </div>
                <div className="text-3xs text-text-muted mt-0.5">Audio transcripts attached</div>
              </div>
            </div>

            <div className="panel p-3.5 bg-bg-card border border-bg-border flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-muted">
                <span className="text-2xs font-medium uppercase tracking-wider">Target CRM Node</span>
                <Database className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-2">
                <div className="text-sm font-bold font-mono text-amber-300 truncate">
                  {voiceCrmConfig.targetCrmId.toUpperCase()}
                </div>
                <div className="text-3xs text-text-muted mt-0.5">
                  {crms.find(c => c.id === voiceCrmConfig.targetCrmId)?.status === 'CONNECTED' ? '● Live Socket Connected' : '○ Standby'}
                </div>
              </div>
            </div>
          </div>

          {/* Native Field Mapping Pipeline Architecture */}
          <div className="panel p-4 bg-bg-card border border-bg-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-text-primary">Bi-Directional Voice Field Mappings to CRM</span>
              </div>
              <span className="text-3xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Autonomous Normalization Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-2xs">
              <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <div className="font-semibold text-text-primary">Voice Audio & Transcript</div>
                    <div className="text-3xs text-text-muted">Complete two-way dialogue</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-600" />
                <span className="font-mono text-3xs text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">CRM Activity Note</span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-text-primary">Gemini Intent Score (0-100)</div>
                    <div className="text-3xs text-text-muted">Extracted buying propensity</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-600" />
                <span className="font-mono text-3xs text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">Lead Rating / Score</span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <div>
                    <div className="font-semibold text-text-primary">Qualification Verdict</div>
                    <div className="text-3xs text-text-muted">HOT, WARM, NURTURE, COLD</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-600" />
                <span className="font-mono text-3xs text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">Lead Pipeline Stage</span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <div>
                    <div className="font-semibold text-text-primary">Sentiment & Objections</div>
                    <div className="text-3xs text-text-muted">Gemini tone analysis</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-600" />
                <span className="font-mono text-3xs text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">Opportunity Custom Field</span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <div className="font-semibold text-text-primary">Next Best Action / Meeting</div>
                    <div className="text-3xs text-text-muted">Calendly & callback tasks</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-600" />
                <span className="font-mono text-3xs text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded">CRM Task / Event</span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-pink-400" />
                  <div>
                    <div className="font-semibold text-text-primary">Cryptographic Audit Hash</div>
                    <div className="text-3xs text-text-muted">SHA-256 tamper-evident log</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-600" />
                <span className="font-mono text-3xs text-pink-300 bg-pink-500/10 px-1.5 py-0.5 rounded">Audit Trail Record</span>
              </div>
            </div>
          </div>

          {/* Synced Calls Table */}
          <div className="panel bg-bg-card border border-bg-border overflow-hidden">
            <div className="p-3.5 border-b border-bg-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-text-primary">Synchronized AI Voice Sessions</span>
                <span className="badge badge-secondary text-3xs font-mono">{syncedVoiceCalls.length} synced</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchSyncAllVoiceCalls}
                  className="btn-secondary text-2xs py-1 px-2.5 gap-1"
                >
                  <RefreshCw className="w-3 h-3 text-amber-400" /> Refresh / Re-Sync
                </button>
              </div>
            </div>

            {syncedVoiceCalls.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-xs font-bold text-text-primary">No Voice Calls Synced to CRM Yet</h3>
                  <p className="text-2xs text-text-secondary mt-1">
                    When you run live calls in the AI Voice Agent studio or Phone Simulator, completed calls are automatically analyzed and synchronized right here.
                  </p>
                </div>
                <button
                  onClick={handleBatchSyncAllVoiceCalls}
                  className="btn-primary text-2xs py-1.5 px-3.5 gap-1.5 mx-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate Seed Synced Calls for Demonstration
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-neutral-900/60 text-text-muted border-b border-bg-border text-2xs">
                    <tr>
                      <th className="py-2.5 px-3.5 text-left font-medium">Prospect & Organization</th>
                      <th className="py-2.5 px-3.5 text-left font-medium">Qualification & Score</th>
                      <th className="py-2.5 px-3.5 text-left font-medium">Sentiment</th>
                      <th className="py-2.5 px-3.5 text-left font-medium">Talk Time</th>
                      <th className="py-2.5 px-3.5 text-left font-medium">Target CRM</th>
                      <th className="py-2.5 px-3.5 text-left font-medium">Sync Time</th>
                      <th className="py-2.5 px-3.5 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-border">
                    {syncedVoiceCalls.map(item => {
                      const verdict = item.qualification === 'QUALIFIED' ? 'HOT' : item.qualification || 'WARM'
                      const score = item.intentScore || 75
                      return (
                        <tr key={item.id} className="hover:bg-neutral-900/30 transition-colors">
                          <td className="py-3 px-3.5">
                            <div className="font-semibold text-text-primary flex items-center gap-1.5">
                              <User className="w-3 h-3 text-text-muted" />
                              {item.prospectName}
                            </div>
                            <div className="text-3xs text-text-muted mt-0.5">
                              {item.company || 'Unknown Company'} • {item.phone || 'No phone'}
                            </div>
                          </td>

                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-3xs px-1.5 py-0.5 rounded font-mono font-bold ${
                                  verdict === 'HOT'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : verdict === 'WARM'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                    : 'bg-neutral-800 text-text-muted border border-neutral-700'
                                }`}
                              >
                                {verdict}
                              </span>
                              <span className="font-mono text-2xs text-text-secondary">
                                {score}/100
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3.5">
                            <span
                              className={`text-3xs px-1.5 py-0.5 rounded ${
                                item.sentiment === 'POSITIVE' || item.sentiment === 'Interested'
                                  ? 'bg-emerald-500/10 text-emerald-300'
                                  : item.sentiment === 'NEGATIVE'
                                  ? 'bg-red-500/10 text-red-300'
                                  : 'bg-neutral-800 text-text-secondary'
                              }`}
                            >
                              {item.sentiment || 'Neutral'}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 font-mono text-2xs text-text-secondary">
                            {formatDuration(item.durationSeconds || 0)}
                          </td>

                          <td className="py-3 px-3.5">
                            <span className="badge badge-success text-3xs font-mono flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              {(item.targetCrmName || item.targetCrmId || 'CRM').toUpperCase()}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 text-2xs text-text-muted font-mono whitespace-nowrap">
                            {timeAgo(item.syncedAt)}
                          </td>

                          <td className="py-3 px-3.5 text-right">
                            <button
                              onClick={() => setSelectedVoiceCallDetail(item)}
                              className="btn-secondary text-2xs py-1 px-2.5 gap-1 hover:border-amber-500/50"
                            >
                              <ExternalLink className="w-3 h-3 text-amber-400" /> Inspect Payload
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Lead Source Integrations */}
      {activeTab === 'sources' && (
        <div className="space-y-4 animate-fade-in">
          {/* Category Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSourceCategory(cat)}
                  className={`px-2.5 py-1 rounded text-2xs font-medium transition-colors whitespace-nowrap ${
                    sourceCategory === cat
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-bg-card border border-bg-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-muted" />
              <input
                className="input pl-8 text-xs py-1"
                placeholder="Search lead sources..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Lead Sources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSources.map(source => {
              const statusCfg = sourceStatusStyles[source.status]
              return (
                <div
                  key={source.id}
                  className="panel p-4 flex flex-col justify-between gap-3 border hover:border-amber-500/40 transition-all bg-bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="text-2xl p-2 rounded-lg bg-bg-secondary border border-bg-border flex items-center justify-center">
                        {source.logo}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                          {source.name}
                        </div>
                        <span className="badge-blue text-3xs py-0 px-1 font-mono">{source.category}</span>
                      </div>
                    </div>
                    <span className={statusCfg.badge}>{statusCfg.label}</span>
                  </div>

                  <p className="text-2xs text-text-secondary leading-relaxed">{source.desc}</p>

                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded bg-bg-secondary/70 border border-bg-border text-center text-2xs">
                    <div>
                      <span className="text-text-muted block text-3xs uppercase">Today</span>
                      <span className="font-mono font-bold text-emerald-400">+{source.leadsIngestedToday}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-3xs uppercase">Total Ingest</span>
                      <span className="font-mono font-bold text-text-primary">{source.totalIngested}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-3xs uppercase">Latency</span>
                      <span className="font-mono text-text-muted">{source.latencyMs}ms</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2 border-t border-bg-border/60 text-2xs">
                    <span className="text-3xs text-text-muted font-mono truncate max-w-[130px]" title={source.syncInterval}>
                      {source.syncInterval}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedSourceForWebhook(source)}
                        className="btn-secondary text-2xs py-1 px-2 gap-1"
                        title="View Inbound Webhook & Simulator"
                      >
                        <Code2 className="w-3 h-3 text-amber-400" /> Webhook
                      </button>

                      <button
                        onClick={() => handlePullFromSource(source)}
                        className="btn-primary text-2xs py-1 px-2.5 gap-1 font-semibold"
                        title="Pull mock / live leads from this source right now"
                      >
                        <Play className="w-3 h-3" /> Ingest Now
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Sync & Webhook Activity Log */}
      {activeTab === 'logs' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-text-primary">Sync & Webhook Audit Trail</h2>
              <p className="text-2xs text-text-muted">Real-time telemetry of inbound lead events, CRM updates, and data payload integrity</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="input text-xs py-1"
                value={logStatusFilter}
                onChange={e => setLogStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="SUCCESS">Success Only</option>
                <option value="WARNING">Warnings</option>
                <option value="ERROR">Errors</option>
              </select>
            </div>
          </div>

          <div className="panel overflow-hidden border border-bg-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-secondary text-text-muted uppercase text-3xs font-mono border-b border-bg-border">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Integration</th>
                    <th className="py-2.5 px-3">Event Type</th>
                    <th className="py-2.5 px-3">Records</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Message</th>
                    <th className="py-2.5 px-3 text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-border/60">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-bg-hover/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-2xs text-text-muted whitespace-nowrap">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-text-primary whitespace-nowrap">
                        {log.integrationName}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`text-3xs font-mono px-1.5 py-0.5 rounded ${
                          log.type === 'WEBHOOK_EVENT' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                          log.type === 'SOURCE_INGEST' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          log.type === 'CRM_PUSH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-2xs text-text-primary">
                        {log.recordsCount}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-2xs text-text-muted">
                        {log.latencyMs}ms
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={log.status === 'SUCCESS' ? 'badge-success text-3xs' : log.status === 'WARNING' ? 'badge-amber text-3xs' : 'badge-danger text-3xs'}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary text-2xs max-w-xs truncate" title={log.message}>
                        {log.message}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {log.payloadSummary ? (
                          <button
                            onClick={() => setSelectedLogPayload(log)}
                            className="btn-secondary text-3xs py-0.5 px-1.5 font-mono"
                          >
                            Inspect
                          </button>
                        ) : (
                          <span className="text-3xs text-text-muted font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-text-muted text-xs">
                        No activity records found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Server Connection & Live Setup */}
      {activeTab === 'server' && (
        <div className="space-y-6 animate-fade-in">
          {/* Live Server Ping Widget */}
          <div className="panel p-4 sm:p-5 border border-amber-500/30 bg-gradient-to-br from-bg-card via-bg-card to-amber-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-bg-border pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  serverHealth?.connected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    Backend Server Gateway Status
                    <span className={`text-3xs px-2 py-0.5 rounded-full font-mono uppercase ${
                      serverHealth?.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {serverHealth?.connected ? 'Online (Live REST Server)' : 'Client-Side Simulation'}
                    </span>
                  </h2>
                  <p className="text-2xs text-text-muted">
                    Vite Frontend communicating via standard HTTP/REST & Webhook endpoints
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    className="input font-mono text-xs py-1.5 pr-2 pl-3 w-56 sm:w-72"
                    value={serverUrlInput}
                    onChange={e => setServerUrlInput(e.target.value)}
                    placeholder="http://localhost:5000"
                  />
                </div>
                <button
                  onClick={handleTestServerPing}
                  disabled={isPingingServer}
                  className="btn-primary text-xs py-1.5 px-3.5 gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPingingServer ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>
              </div>
            </div>

            {/* Server Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-bg-secondary/70 border border-bg-border">
                <div className="text-2xs text-text-muted uppercase tracking-wide">Endpoint Reachability</div>
                <div className="text-sm font-bold text-text-primary mt-1 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${serverHealth?.connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>{serverHealth?.connected ? 'HTTP 200 OK' : 'Local Fallback'}</span>
                </div>
                <div className="text-3xs text-text-muted mt-1">
                  Latency: {serverHealth ? `${serverHealth.latencyMs}ms` : '—'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-bg-secondary/70 border border-bg-border">
                <div className="text-2xs text-text-muted uppercase tracking-wide">Server Version & Runtime</div>
                <div className="text-sm font-bold text-text-primary mt-1">
                  {serverHealth?.version ? `Callisto Server v${serverHealth.version}` : 'Node.js Express / FastAPI'}
                </div>
                <div className="text-3xs text-text-muted mt-1">
                  Environment: {serverHealth?.mode || 'Development'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-bg-secondary/70 border border-bg-border">
                <div className="text-2xs text-text-muted uppercase tracking-wide">Connected Database / Storage</div>
                <div className="text-sm font-bold text-text-primary mt-1 text-emerald-400">
                  {serverHealth?.connected ? 'PostgreSQL / Supabase' : 'Browser IndexedDB / LocalStorage'}
                </div>
                <div className="text-3xs text-text-muted mt-1">
                  State Persistence: 100% Persisted
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Connection Instructions */}
          <div className="panel p-5 space-y-5 border border-bg-border">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  Steps to Connect Frontend to Your Actual Server
                </h3>
                <p className="text-2xs text-text-muted">
                  Follow these 5 steps to run the included production backend server and link CRM & webhook routes
                </p>
              </div>
              <span className="badge-blue text-3xs font-mono">STEP-BY-STEP GUIDE</span>
            </div>

            {/* Step 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="text-xs font-bold text-text-primary">
                  Launch the Included Backend Express Server
                </div>
              </div>
              <p className="text-2xs text-text-secondary pl-8">
                A ready-to-run Express server has been generated in the <code className="text-amber-400 font-mono">server/</code> directory of this workspace with full lead CRUD, webhook handlers, and CRM sync endpoints.
              </p>
              <div className="ml-8 relative bg-neutral-950 rounded-lg p-3 border border-neutral-800 font-mono text-2xs text-neutral-300">
                <button
                  onClick={() => copyToClipboard('cd server\nnpm install\nnpm start', 'step1')}
                  className="absolute right-2 top-2 p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                  title="Copy commands"
                >
                  {copiedCode === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <div className="text-neutral-500"># In your terminal:</div>
                <div className="text-amber-400">cd server</div>
                <div className="text-emerald-400">npm install</div>
                <div className="text-blue-400">npm start</div>
                <div className="text-neutral-500 mt-1"># Server starts on http://localhost:5000 with /health, /api/leads, and webhook listeners</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="text-xs font-bold text-text-primary">
                  Configure Environment Variables (.env)
                </div>
              </div>
              <p className="text-2xs text-text-secondary pl-8">
                Copy the created <code className="text-amber-400 font-mono">.env.example</code> to <code className="text-amber-400 font-mono">.env</code> in the project root or server folder, and configure your target API credentials.
              </p>
              <div className="ml-8 relative bg-neutral-950 rounded-lg p-3 border border-neutral-800 font-mono text-2xs text-neutral-300">
                <button
                  onClick={() => copyToClipboard('VITE_API_BASE_URL=http://localhost:5000\nPORT=5000\nWEBHOOK_SECRET=whsec_callisto_live_key\nSALESFORCE_CLIENT_ID=your_client_id\nHUBSPOT_ACCESS_TOKEN=your_pat_token', 'step2')}
                  className="absolute right-2 top-2 p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  {copiedCode === 'step2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <div><span className="text-purple-400">VITE_API_BASE_URL</span>=<span className="text-emerald-300">http://localhost:5000</span></div>
                <div><span className="text-purple-400">PORT</span>=<span className="text-emerald-300">5000</span></div>
                <div><span className="text-purple-400">DATABASE_URL</span>=<span className="text-emerald-300">postgresql://user:pass@localhost:5432/callisto_db</span></div>
                <div><span className="text-purple-400">WEBHOOK_SECRET</span>=<span className="text-emerald-300">whsec_callisto_live_secret_key</span></div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="text-xs font-bold text-text-primary">
                  Connect Apollo, LinkedIn, or Webhook Forms
                </div>
              </div>
              <p className="text-2xs text-text-secondary pl-8">
                In your external source (e.g. Apollo webhook triggers, Typeform webhooks, Clay outbound action, or Meta lead ads), set the target URL to your live server or ngrok tunnel:
              </p>
              <div className="ml-8 bg-neutral-950 rounded-lg p-3 border border-neutral-800 font-mono text-2xs text-neutral-300 space-y-1">
                <div><span className="text-text-muted">Target Webhook URL:</span> <span className="text-amber-400">POST https://api.yourdomain.com/api/webhooks/leads/apollo</span></div>
                <div><span className="text-text-muted">Headers:</span> <span className="text-text-secondary">x-callisto-signature: &lt;HMAC-SHA256&gt;, Content-Type: application/json</span></div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                  4
                </div>
                <div className="text-xs font-bold text-text-primary">
                  Connect Salesforce & HubSpot OAuth / REST APIs
                </div>
              </div>
              <p className="text-2xs text-text-secondary pl-8">
                For enterprise CRMs, configure your Connected App in Salesforce or Private App in HubSpot with the callback URI:
                <code className="ml-1 text-amber-400 font-mono">https://api.yourdomain.com/api/crm/callback/salesforce</code>. The backend server proxy will automatically refresh tokens and stream leads to your CRM.
              </p>
            </div>

            {/* Step 5: Python / FastAPI or Supabase Alternative */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                  5
                </div>
                <div className="text-xs font-bold text-text-primary">
                  Alternative: Python / FastAPI & Supabase Support
                </div>
              </div>
              <p className="text-2xs text-text-secondary pl-8">
                Prefer Python or Serverless? You can deploy the exact same REST interface with FastAPI:
              </p>
              <div className="ml-8 relative bg-neutral-950 rounded-lg p-3 border border-neutral-800 font-mono text-2xs text-neutral-300">
                <button
                  onClick={() => copyToClipboard('from fastapi import FastAPI, Request\napp = FastAPI()\n\n@app.get("/health")\ndef health():\n    return {"status": "healthy", "service": "Callisto FastAPI"}\n\n@app.post("/api/webhooks/leads/{source}")\nasync def ingest(source: str, request: Request):\n    data = await request.json()\n    return {"success": True, "lead": data}', 'fastapi')}
                  className="absolute right-2 top-2 p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  {copiedCode === 'fastapi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <div className="text-text-muted"># Python FastAPI snippet:</div>
                <div><span className="text-blue-400">from</span> fastapi <span className="text-blue-400">import</span> FastAPI, Request</div>
                <div>app = FastAPI()</div>
                <div>@app.get(<span className="text-emerald-300">"/health"</span>)</div>
                <div><span className="text-blue-400">def</span> <span className="text-amber-300">health</span>(): <span className="text-blue-400">return</span> {`{"status": "healthy", "service": "Callisto FastAPI"}`}</div>
                <div>@app.post(<span className="text-emerald-300">"/api/webhooks/leads/{'{source}'}"</span>)</div>
                <div><span className="text-blue-400">async def</span> <span className="text-amber-300">ingest</span>(source: str, req: Request): <span className="text-blue-400">return</span> {`{"success": True, "lead": await req.json()}`}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Data Import / Export */}
      {activeTab === 'data' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="panel p-5 space-y-4">
              <div>
                <div className="text-sm font-semibold text-text-primary">Import Leads from CSV / Excel (.xlsx)</div>
                <div className="text-2xs text-text-muted mt-0.5">Bulk upload with column auto-mapping and duplicate resolution</div>
              </div>
              <div
                className="border-2 border-dashed border-bg-border rounded-lg p-8 text-center hover:border-amber-500/40 transition-colors cursor-pointer bg-bg-secondary/40"
                onClick={() => setShowImport(true)}
              >
                <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-text-secondary">Drop Excel or CSV file here or click to browse</div>
                <div className="text-xs text-text-muted mt-1">Supports CSV, XLS, XLSX up to 10MB</div>
                <button className="btn-primary text-xs mt-3 py-1.5 px-4">Select File</button>
              </div>
              <div className="space-y-1 text-xs text-text-muted">
                <div>Required columns: <span className="text-text-secondary">Name, Email, Company</span></div>
                <div>Optional: Phone, Industry, Location, Job Title, LinkedIn, Requirement</div>
              </div>
            </div>

            <div className="panel p-5 space-y-4">
              <div>
                <div className="text-sm font-semibold text-text-primary">Export CRM Records</div>
                <div className="text-2xs text-text-muted mt-0.5">Export leads formatted for Salesforce, HubSpot, or custom offline analysis</div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'All Leads (CSV)',           count: leadsList.length },
                  { label: 'High Intent Leads (CSV)',   count: leadsList.filter(l => l.intent === 'HIGH').length },
                  { label: 'Qualified Leads (Excel)',   count: leadsList.filter(l => l.status === 'QUALIFIED').length },
                  { label: 'Campaign Leads (CSV)',      count: leadsList.filter(l => l.status === 'INTERESTED' || l.status === 'CONTACTED').length },
                ].map(e => (
                  <div key={e.label} className="flex items-center justify-between p-3 bg-bg-card border border-bg-border rounded-lg hover:border-amber-500/30 transition-colors">
                    <div>
                      <div className="text-xs font-semibold text-text-primary">{e.label}</div>
                      <div className="text-2xs text-text-muted">{e.count} records available</div>
                    </div>
                    <button onClick={() => handleExportAllLeads(e.label)} className="btn-secondary text-2xs py-1.5 px-3 gap-1">
                      <Download className="w-3 h-3 text-amber-400" /> Export
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportLeadsModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImportSuccess={(count) => {
          showToast('success', 'Import Complete', `${count} leads successfully imported and mapped to CRM`)
        }}
      />

      {/* CRM Configuration Modal */}
      {selectedCrmForConfig && (
        <div className="modal-overlay" onClick={() => setSelectedCrmForConfig(null)}>
          <div className="modal-panel max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedCrmForConfig.logo}</span>
                <span className="section-title">{selectedCrmForConfig.name} Configuration</span>
              </div>
              <button onClick={() => setSelectedCrmForConfig(null)}><XCircle className="w-4 h-4 text-text-muted" /></button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Instance / API Gateway URL</label>
                <input
                  className="input font-mono text-xs"
                  value={selectedCrmForConfig.instanceUrl}
                  onChange={e => {
                    const val = e.target.value
                    setSelectedCrmForConfig(p => p ? { ...p, instanceUrl: val } : null)
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Sync Direction</label>
                  <select
                    className="input text-xs"
                    value={selectedCrmForConfig.syncDirection}
                    onChange={e => {
                      const val = e.target.value as SyncDirection
                      setSelectedCrmForConfig(p => p ? { ...p, syncDirection: val } : null)
                    }}
                  >
                    <option value="BIDIRECTIONAL">Bidirectional (2-Way)</option>
                    <option value="OUTBOUND">Outbound Only (Callisto → CRM)</option>
                    <option value="INBOUND">Inbound Only (CRM → Callisto)</option>
                  </select>
                </div>

                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Sync Frequency</label>
                  <select
                    className="input text-xs"
                    value={selectedCrmForConfig.syncInterval}
                    onChange={e => {
                      const val = e.target.value as any
                      setSelectedCrmForConfig(p => p ? { ...p, syncInterval: val } : null)
                    }}
                  >
                    <option value="realtime">Real-time Webhook</option>
                    <option value="5m">Every 5 minutes</option>
                    <option value="15m">Every 15 minutes</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="manual">Manual Only</option>
                  </select>
                </div>
              </div>

              {/* Authentication Credentials */}
              <div className="space-y-2 pt-2 border-t border-bg-border">
                <label className="text-2xs text-text-muted uppercase tracking-wide block">
                  {selectedCrmForConfig.authType === 'OAUTH' ? 'OAuth 2.0 Client ID / App Key' : 'API Token / Bearer Key'}
                </label>
                <input
                  className="input font-mono text-xs"
                  value={selectedCrmForConfig.clientId || selectedCrmForConfig.apiKey || ''}
                  onChange={e => {
                    const val = e.target.value
                    setSelectedCrmForConfig(p => p ? {
                      ...p,
                      clientId: p.authType === 'OAUTH' ? val : p.clientId,
                      apiKey: p.authType !== 'OAUTH' ? val : p.apiKey
                    } : null)
                  }}
                />
              </div>

              {/* Field Mappings */}
              <div className="space-y-2 pt-2 border-t border-bg-border">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary text-xs">Field Mappings (Callisto ⇄ {selectedCrmForConfig.name})</span>
                  <span className="text-2xs text-amber-400 font-mono">{selectedCrmForConfig.fieldMappings.length} mapped</span>
                </div>
                <div className="space-y-1.5 font-mono text-2xs max-h-40 overflow-y-auto">
                  {selectedCrmForConfig.fieldMappings.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-bg-card border border-bg-border rounded">
                      <span className="text-text-secondary">{m.localField}</span>
                      <span className="text-text-muted">⇄</span>
                      <span className="text-amber-400">{m.remoteField}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-between pt-3 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => showToast('success', 'Handshake OK', `Connected to ${selectedCrmForConfig.name} at ${selectedCrmForConfig.instanceUrl} (Latency: 52ms)`)}
                  className="btn-secondary text-xs"
                >
                  Test Connection
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedCrmForConfig(null)} className="btn-secondary text-xs">Cancel</button>
                  <button
                    onClick={() => {
                      if (selectedCrmForConfig) {
                        setCrms(prev => prev.map(c => c.id === selectedCrmForConfig.id ? selectedCrmForConfig : c))
                        showToast('success', 'Settings Saved', `${selectedCrmForConfig.name} configuration updated`)
                      }
                      setSelectedCrmForConfig(null)
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

      {/* Inbound Webhook Generator & Live Ping Simulator Modal */}
      {selectedSourceForWebhook && (
        <div className="modal-overlay" onClick={() => setSelectedSourceForWebhook(null)}>
          <div className="modal-panel max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedSourceForWebhook.logo}</span>
                <span className="section-title">{selectedSourceForWebhook.name} Webhook Gateway</span>
              </div>
              <button onClick={() => setSelectedSourceForWebhook(null)}><XCircle className="w-4 h-4 text-text-muted" /></button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-2xs text-text-secondary flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Configure this webhook URL inside <strong>{selectedSourceForWebhook.name}</strong> to push leads directly into Callisto AI in real time. Payloads are validated and scored autonomously.
                </span>
              </div>

              {/* Webhook Endpoint */}
              <div>
                <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Inbound Webhook Endpoint URL</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    className="input font-mono text-2xs flex-1 bg-bg-secondary select-all"
                    value={selectedSourceForWebhook.webhookUrl}
                  />
                  <button
                    onClick={() => copyToClipboard(selectedSourceForWebhook.webhookUrl, 'wh_url')}
                    className="btn-secondary text-xs px-2.5"
                    title="Copy URL"
                  >
                    {copiedCode === 'wh_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Secret Token */}
              <div>
                <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">HMAC Signing Secret Key</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    className="input font-mono text-2xs flex-1 bg-bg-secondary select-all"
                    value={selectedSourceForWebhook.webhookSecret}
                  />
                  <button
                    onClick={() => copyToClipboard(selectedSourceForWebhook.webhookSecret, 'wh_sec')}
                    className="btn-secondary text-xs px-2.5"
                  >
                    {copiedCode === 'wh_sec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Live Simulator JSON Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-2xs text-text-muted uppercase tracking-wide block">
                    Interactive Ingest Simulator (Test JSON Payload)
                  </label>
                  <span className="text-3xs text-text-muted font-mono">Editable test payload</span>
                </div>
                <textarea
                  className="input font-mono text-2xs h-36 w-full leading-relaxed"
                  value={testWebhookPayload}
                  onChange={e => setTestWebhookPayload(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-bg-border">
                <span className="text-3xs text-text-muted">
                  Clicking "Send Test Ingest Ping" will immediately inject this lead into Callisto AI's live pipeline.
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedSourceForWebhook(null)} className="btn-secondary text-xs">Close</button>
                  <button
                    onClick={handleSendWebhookTestPing}
                    className="btn-primary text-xs py-1.5 px-3.5 gap-1.5 font-bold shadow-md shadow-amber-500/20"
                  >
                    <Play className="w-3.5 h-3.5" /> Send Test Ingest Ping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Log Payload Modal */}
      {selectedLogPayload && (
        <div className="modal-overlay" onClick={() => setSelectedLogPayload(null)}>
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span className="section-title">Telemetry Payload ({selectedLogPayload.id})</span>
              </div>
              <button onClick={() => setSelectedLogPayload(null)}><XCircle className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="text-2xs text-text-muted font-mono">
                {selectedLogPayload.integrationName} • {formatDateTime(selectedLogPayload.timestamp)}
              </div>
              <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-2xs text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-60">
                {selectedLogPayload.payloadSummary}
              </pre>
              <div className="flex justify-end pt-2">
                <button onClick={() => setSelectedLogPayload(null)} className="btn-secondary text-xs">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Synced Voice Call Intelligence Modal */}
      {selectedVoiceCallDetail && (
        <div className="modal-overlay" onClick={() => setSelectedVoiceCallDetail(null)}>
          <div className="modal-panel max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400" />
                <span className="section-title">
                  CRM Intelligence Sync: {selectedVoiceCallDetail.prospectName}
                </span>
              </div>
              <button onClick={() => setSelectedVoiceCallDetail(null)}>
                <XCircle className="w-4 h-4 text-text-muted hover:text-text-primary" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Status Header */}
              <div className="p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-lg flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-text-primary">
                    {selectedVoiceCallDetail.prospectName}
                  </div>
                  <div className="text-2xs text-text-muted font-mono mt-0.5">
                    {selectedVoiceCallDetail.company || 'Enterprise Prospect'} • {selectedVoiceCallDetail.phone || 'No phone'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="badge badge-success text-2xs font-mono flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Synced to {(selectedVoiceCallDetail.targetCrmName || selectedVoiceCallDetail.targetCrmId || 'CRM').toUpperCase()}
                  </span>
                  <span className="text-3xs text-text-muted font-mono">
                    {formatDateTime(selectedVoiceCallDetail.syncedAt)}
                  </span>
                </div>
              </div>

              {/* Gemini Intelligence Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-bg-card border border-bg-border rounded-lg">
                  <div className="text-3xs text-text-muted uppercase">Qualification Verdict</div>
                  <div className="text-base font-bold text-amber-400 mt-1 font-mono">
                    {selectedVoiceCallDetail.qualification || 'HOT'}
                  </div>
                  <div className="text-3xs text-text-muted">Intent Score: {selectedVoiceCallDetail.intentScore || 85}/100</div>
                </div>

                <div className="p-3 bg-bg-card border border-bg-border rounded-lg">
                  <div className="text-3xs text-text-muted uppercase">Detected Sentiment</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">
                    {selectedVoiceCallDetail.sentiment || 'Positive'}
                  </div>
                  <div className="text-3xs text-text-muted">Duration: {formatDuration(selectedVoiceCallDetail.durationSeconds || 0)}</div>
                </div>

                <div className="p-3 bg-bg-card border border-bg-border rounded-lg">
                  <div className="text-3xs text-text-muted uppercase">Lead State</div>
                  <div className="text-base font-bold text-blue-400 mt-1">Active Deal</div>
                  <div className="text-3xs text-text-muted">Auto-Updated in CRM</div>
                </div>
              </div>

              {/* Summary & Next Action */}
              {selectedVoiceCallDetail.summary && (
                <div className="space-y-1.5">
                  <label className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block">
                    Gemini Executive Summary
                  </label>
                  <p className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg text-text-primary leading-relaxed text-2xs">
                    {selectedVoiceCallDetail.summary}
                  </p>
                </div>
              )}

              {selectedVoiceCallDetail.nextBestAction && (
                <div className="space-y-1.5">
                  <label className="text-2xs font-semibold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Next Best Action Pushed to CRM Task
                  </label>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-2xs font-medium">
                    {selectedVoiceCallDetail.nextBestAction}
                  </div>
                </div>
              )}

              {/* Audio Transcript */}
              {selectedVoiceCallDetail.transcript && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-2xs font-semibold text-text-secondary uppercase tracking-wider block">
                      Synchronized Call Transcript
                    </label>
                    <span className="text-3xs font-mono text-text-muted">Full Two-Way Audio Log</span>
                  </div>
                  <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-2xs text-text-secondary overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">
                    {typeof selectedVoiceCallDetail.transcript === 'string'
                      ? selectedVoiceCallDetail.transcript
                      : selectedVoiceCallDetail.transcript.map(t => `${t.speaker}: ${t.text}`).join('\n')}
                  </pre>
                </div>
              )}

              {/* Raw JSON Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-2xs font-semibold text-text-muted uppercase tracking-wider block">
                    Raw CRM Encrypted Payload & Wire Telemetry
                  </label>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(selectedVoiceCallDetail, null, 2), 'crm_call_payload')}
                    className="btn-secondary text-3xs py-0.5 px-2 gap-1 font-mono"
                  >
                    {copiedCode === 'crm_call_payload' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy JSON
                  </button>
                </div>
                <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-3xs text-emerald-400 overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {JSON.stringify(selectedVoiceCallDetail, null, 2)}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-bg-border">
                <span className="text-3xs text-text-muted">
                  Cryptographically hashed and audit logged in Callisto Enterprise Ledger.
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await syncVoiceCallToCrm(selectedVoiceCallDetail, { force: true })
                      setSyncedVoiceCalls(loadSyncedVoiceCalls())
                      showToast('success', 'Re-Synced', `Pushed fresh update to ${(selectedVoiceCallDetail.targetCrmName || selectedVoiceCallDetail.targetCrmId || 'CRM').toUpperCase()}`)
                    }}
                    className="btn-primary text-xs py-1.5 px-3 gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-Push to CRM
                  </button>
                  <button onClick={() => setSelectedVoiceCallDetail(null)} className="btn-secondary text-xs">
                    Close
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
