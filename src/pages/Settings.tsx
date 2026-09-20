import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Settings, User, Building2, Brain, Volume2, Globe, Bell, Link2, Shield, CreditCard,
  CheckCircle, RefreshCw, Key, ExternalLink, Mail, MessageSquare, AlertCircle,
  FileText, Upload, Trash2, CheckCircle2, PhoneCall, Server, Sparkles, Plus, Play, Check
} from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { useAppContext } from '@/contexts/AppContext'

const tabs = [
  { id: 'profile',       label: 'Profile',        icon: <User className="w-3.5 h-3.5" /> },
  { id: 'company',       label: 'Company',        icon: <Building2 className="w-3.5 h-3.5" /> },
  { id: 'knowledge',     label: 'Business Knowledge & Docs', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'ai',            label: 'AI Preferences', icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'voice',         label: 'Voice & Telephony', icon: <Volume2 className="w-3.5 h-3.5" /> },
  { id: 'languages',     label: 'Languages',      icon: <Globe className="w-3.5 h-3.5" /> },
  { id: 'notifications', label: 'Notifications',  icon: <Bell className="w-3.5 h-3.5" /> },
  { id: 'integrations',  label: 'Integrations',   icon: <Link2 className="w-3.5 h-3.5" /> },
  { id: 'security',      label: 'Security',       icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'billing',       label: 'Billing & Plans',icon: <CreditCard className="w-3.5 h-3.5" /> },
]

function ToggleSwitch({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id?: string }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer focus:outline-none shrink-0 ${checked ? 'bg-amber-500' : 'bg-bg-border'}`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-all duration-200 ${checked ? 'right-0.5' : 'left-0.5'}`}
      />
    </button>
  )
}

export function SettingsPage() {
  const { showToast } = useToast()
  const { language, setLanguage } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTabState] = useState(tabParam && tabs.some(t => t.id === tabParam) ? tabParam : 'profile')

  useEffect(() => {
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActiveTabState(tabParam)
    }
  }, [tabParam])

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab)
    setSearchParams({ tab })
  }

  // Profile Form State
  const [profile, setProfile] = useState({
    name: 'Tanishq Mehta',
    email: 'tanishq@demo-callistoai.com',
    phone: '+91-98765-00001',
    company: 'Callisto AI Solutions',
    timezone: 'Asia/Kolkata',
  })

  // Company Form State
  const [company, setCompany] = useState({
    name: 'Callisto AI Solutions Private Limited',
    website: 'https://callistoai.com',
    industry: 'Enterprise Software & Artificial Intelligence',
    size: '50-200 Employees',
    address: 'Callisto Cyber Park, Level 4, Outer Ring Road, Bangalore, India - 560103',
    taxId: '29AABCN8492K1Z9',
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST)',
  })

  // AI Preferences State (Controlled)
  const [minIntentScore, setMinIntentScore] = useState(75)
  const [autoQualify, setAutoQualify] = useState(true)
  const [autoEnrich, setAutoEnrich] = useState(true)
  const [discoveryFreq, setDiscoveryFreq] = useState('Every hour')

  // Notification Preferences State
  const [notifPreferences, setNotifPreferences] = useState({
    emailQualified: true,
    pushLiveCalls: true,
    highIntentAlerts: true,
    campaignSummary: true,
    meetingBooked: true,
    securityAlerts: true,
    dailyDigest: true,
    smsAlerts: false,
  })

  // Integrations State
  const [integrationStates, setIntegrationStates] = useState<Record<string, boolean>>({
    salesforce: true,
    hubspot: true,
    slack: true,
    twilio: true,
    sendgrid: true,
    zapier: false,
  })

  // Business Knowledge Documents State (User Journey Step 2)
  const [documents, setDocuments] = useState([
    { id: 'DOC-1', name: 'CallistoAI_Enterprise_Pitch_Deck.pdf', size: '3.4 MB', uploadedAt: '2 days ago', status: 'INDEXED', type: 'PDF' },
    { id: 'DOC-2', name: 'Product_Catalog_and_Pricing_Q4.docx', size: '1.2 MB', uploadedAt: 'Yesterday', status: 'INDEXED', type: 'DOCX' },
    { id: 'DOC-3', name: 'Technical_Security_FAQ_2026.pdf', size: '840 KB', uploadedAt: '4 hours ago', status: 'INDEXED', type: 'PDF' },
  ])
  const [isUploading, setIsUploading] = useState(false)

  // Telephony Infrastructure State (User Journey Step 5)
  const [telephonyMode, setTelephonyMode] = useState<'BUILTIN' | 'BYO'>('BUILTIN')
  const [byoProvider, setByoProvider] = useState('Twilio')
  const [byoSid, setByoSid] = useState('AC98b472e34fa981275d8209841f')
  const [byoToken, setByoToken] = useState('••••••••••••••••••••••••••••••••')
  const [byoPhone, setByoPhone] = useState('+1 (415) 800-2931')
  const [byoSipDomain, setByoSipDomain] = useState('callisto-voice.sip.twilio.com')
  const [isTestingCarrier, setIsTestingCarrier] = useState(false)

  // Modular Subscription State (User Journey Step 4)
  const [modularPlan, setModularPlan] = useState<'LEAD_GEN' | 'VOICE_CALLING' | 'BOTH'>('BOTH')
  const [planTier, setPlanTier] = useState<'STARTER' | 'GROWTH' | 'ENTERPRISE'>('ENTERPRISE')

  function handleSimulatedUpload(e?: React.ChangeEvent<HTMLInputElement>) {
    const file = e?.target?.files?.[0]
    const fileName = file ? file.name : 'New_Product_Catalog_2026.pdf'
    const fileSize = file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '2.1 MB'
    const fileExt = fileName.split('.').pop()?.toUpperCase() || 'PDF'

    setIsUploading(true)
    showToast('info', 'Uploading Document', `Analyzing ${fileName} for AI Voice grounding...`)
    setTimeout(() => {
      setDocuments(prev => [
        { id: `DOC-${Date.now()}`, name: fileName, size: fileSize, uploadedAt: 'Just now', status: 'INDEXED', type: fileExt },
        ...prev
      ])
      setIsUploading(false)
      showToast('success', 'Document Indexed', `${fileName} successfully processed into AI Voice persona knowledge`)
    }, 1000)
  }

  function deleteDocument(id: string) {
    const doc = documents.find(d => d.id === id)
    setDocuments(prev => prev.filter(d => d.id !== id))
    showToast('info', 'Document Removed', `${doc?.name} removed from AI knowledge base`)
  }

  function testCarrier() {
    setIsTestingCarrier(true)
    showToast('info', 'Pinging Telephony Trunk', `Connecting to ${byoProvider} SIP gateway...`)
    setTimeout(() => {
      setIsTestingCarrier(false)
      showToast('success', 'Carrier Route Operational', `Verified 28ms roundtrip latency with ${byoProvider}. Outbound Caller ID ${byoPhone} active.`)
    }, 1200)
  }

  function save(sectionName = 'Settings') {
    showToast('success', `${sectionName} Saved`, 'Your preferences have been successfully updated')
  }

  return (
    <div className="p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Settings className="w-4 h-4 text-amber-400 shrink-0" />
        <h1 className="text-sm font-bold text-text-primary">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
        {/* Sidebar tabs */}
        <div className="w-full md:w-48 shrink-0 panel p-1.5 sm:p-2 h-fit flex md:flex-col overflow-x-auto md:overflow-x-visible gap-1 scrollbar-thin">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`whitespace-nowrap shrink-0 md:shrink flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded text-xs transition-colors ${activeTab === t.id ? 'bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/30 md:border-transparent' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}`}
            >
              {t.icon} <span className="text-xs">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 panel p-3.5 sm:p-6 space-y-5 min-h-96 min-w-0">
          {/* 1. Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">Profile</div>
              {[
                { l: 'Full Name', k: 'name' },
                { l: 'Email Address', k: 'email' },
                { l: 'Phone', k: 'phone' },
                { l: 'Timezone', k: 'timezone' },
              ].map(f => (
                <div key={f.k}>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">{f.l}</label>
                  <input
                    className="input max-w-md"
                    value={(profile as any)[f.k]}
                    onChange={e => setProfile(p => ({ ...p, [f.k]: e.target.value }))}
                  />
                </div>
              ))}
              <button onClick={() => save('Profile')} className="btn-primary text-xs">Save Profile</button>
            </div>
          )}

          {/* 2. Company */}
          {activeTab === 'company' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">Company Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Company Legal Name</label>
                  <input
                    className="input"
                    value={company.name}
                    onChange={e => setCompany(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Corporate Website</label>
                  <input
                    className="input"
                    value={company.website}
                    onChange={e => setCompany(p => ({ ...p, website: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Industry</label>
                  <input
                    className="input"
                    value={company.industry}
                    onChange={e => setCompany(p => ({ ...p, industry: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Company Size</label>
                  <select
                    className="input text-xs"
                    value={company.size}
                    onChange={e => setCompany(p => ({ ...p, size: e.target.value }))}
                  >
                    <option>1-10 Employees</option>
                    <option>11-50 Employees</option>
                    <option>50-200 Employees</option>
                    <option>201-500 Employees</option>
                    <option>500+ Employees</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Headquarters Address</label>
                  <input
                    className="input"
                    value={company.address}
                    onChange={e => setCompany(p => ({ ...p, address: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Tax Registration / GSTIN</label>
                  <input
                    className="input font-mono"
                    value={company.taxId}
                    onChange={e => setCompany(p => ({ ...p, taxId: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Primary Currency</label>
                  <select
                    className="input text-xs"
                    value={company.currency}
                    onChange={e => setCompany(p => ({ ...p, currency: e.target.value }))}
                  >
                    <option>INR (₹)</option>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>AED (AED)</option>
                  </select>
                </div>
              </div>
              <button onClick={() => save('Company Information')} className="btn-primary text-xs">Save Company Details</button>
            </div>
          )}

          {/* 3. Business Knowledge & Document Upload (User Journey Step 2) */}
          {activeTab === 'knowledge' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-bg-border pb-2">
                <div>
                  <div className="text-sm font-semibold text-text-primary">Business Knowledge & Training Materials</div>
                  <div className="text-2xs text-text-muted">User Journey Step 2: Upload business documents, pitch decks, and catalogs to ground the AI Voice Agent</div>
                </div>
                <span className="badge-blue">JOURNEY STEP 2</span>
              </div>

              {/* Upload Dropzone */}
              <div className="panel p-5 border-2 border-dashed border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 text-center rounded-lg transition-colors cursor-pointer relative">
                <input
                  type="file"
                  id="knowledge-file-input"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  accept=".pdf,.docx,.doc,.txt,.csv"
                  onChange={handleSimulatedUpload}
                  disabled={isUploading}
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Upload className={`w-5 h-5 ${isUploading ? 'animate-bounce' : ''}`} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-text-primary">
                      {isUploading ? 'Extracting business entities & FAQ embeddings...' : 'Click to upload or drag & drop business files'}
                    </span>
                    <p className="text-2xs text-text-muted mt-0.5">Supports PDF, DOCX, CSV, TXT (Pitch Decks, Product Catalogs, FAQs, Pricing Sheets up to 50MB)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSimulatedUpload()}
                    className="btn-primary text-2xs mt-2 pointer-events-auto"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Processing Document...' : 'Upload Sample Document'}
                  </button>
                </div>
              </div>

              {/* AI Knowledge Extraction Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-bg-card rounded border border-bg-border">
                  <div className="text-2xs text-text-muted uppercase font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Detected Products
                  </div>
                  <div className="mt-2 space-y-1">
                    {['Enterprise Cloud Migration', 'AI Support Voicebot', 'Pipeline Intelligence'].map(p => (
                      <span key={p} className="inline-block badge text-2xs mr-1 mb-1">{p}</span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-bg-card rounded border border-bg-border">
                  <div className="text-2xs text-text-muted uppercase font-semibold flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-blue-400" /> Target Buyer Personas
                  </div>
                  <div className="mt-2 space-y-1">
                    {['CTO / VP Engineering', 'Head of Customer Support', 'VP Sales Operations'].map(p => (
                      <span key={p} className="inline-block badge-blue text-2xs mr-1 mb-1">{p}</span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-bg-card rounded border border-bg-border">
                  <div className="text-2xs text-text-muted uppercase font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> AI Grounding Status
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-bold text-success font-mono">100% Ready</div>
                    <p className="text-2xs text-text-muted mt-0.5">Voice agent grounded on 3 indexed business documents</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="panel overflow-hidden">
                <div className="section-header">
                  <span className="section-title">Indexed Business Documents ({documents.length})</span>
                  <span className="text-2xs text-text-muted">Synchronized with AI Voice Agent Persona</span>
                </div>
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Type</th>
                      <th>File Size</th>
                      <th>Uploaded</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map(doc => (
                      <tr key={doc.id} className="hover:bg-bg-hover transition-colors">
                        <td>
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-semibold text-text-primary text-xs font-mono">{doc.name}</span>
                          </div>
                        </td>
                        <td><span className="badge text-2xs">{doc.type}</span></td>
                        <td><span className="text-text-muted font-mono text-2xs">{doc.size}</span></td>
                        <td><span className="text-text-secondary text-2xs">{doc.uploadedAt}</span></td>
                        <td>
                          <span className="badge-success flex items-center gap-1 w-fit text-2xs">
                            <Check className="w-3 h-3" /> Indexed
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="p-1 text-text-muted hover:text-danger transition-colors rounded hover:bg-bg-hover"
                            title="Remove document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. AI Preferences */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">AI Preferences</div>
              <div className="max-w-md space-y-3">
                {/* Controlled Slider */}
                <div className="flex items-center justify-between py-2 border-b border-bg-border/50">
                  <div>
                    <label className="text-xs text-text-primary block font-medium">Min Intent Score Threshold</label>
                    <span className="text-2xs text-text-muted">Leads scoring above this will trigger autonomous actions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={50}
                      max={99}
                      value={minIntentScore}
                      onChange={e => setMinIntentScore(Number(e.target.value))}
                      className="accent-amber-500 w-24 cursor-pointer"
                      id="intent-threshold-slider"
                    />
                    <span className="text-xs text-amber-400 font-mono font-bold w-6 text-right">{minIntentScore}</span>
                  </div>
                </div>

                {/* Controlled Toggle 1 */}
                <div className="flex items-center justify-between py-2 border-b border-bg-border/50">
                  <div>
                    <label className="text-xs text-text-primary block font-medium">Auto-qualify leads above score</label>
                    <span className="text-2xs text-text-muted">Automatically convert leads with high AI confidence</span>
                  </div>
                  <ToggleSwitch checked={autoQualify} onChange={setAutoQualify} id="auto-qualify-toggle" />
                </div>

                {/* Controlled Toggle 2 */}
                <div className="flex items-center justify-between py-2 border-b border-bg-border/50">
                  <div>
                    <label className="text-xs text-text-primary block font-medium">Enrich leads automatically</label>
                    <span className="text-2xs text-text-muted">Retrieve funding, tech stack, and LinkedIn profile data</span>
                  </div>
                  <ToggleSwitch checked={autoEnrich} onChange={setAutoEnrich} id="auto-enrich-toggle" />
                </div>

                {/* Select */}
                <div className="flex items-center justify-between py-2 border-b border-bg-border/50">
                  <div>
                    <label className="text-xs text-text-primary block font-medium">Discovery frequency</label>
                    <span className="text-2xs text-text-muted">Background crawling and radar scanning interval</span>
                  </div>
                  <select
                    className="input w-36 text-xs"
                    value={discoveryFreq}
                    onChange={e => setDiscoveryFreq(e.target.value)}
                  >
                    {['Every hour', 'Every 6 hours', 'Daily', 'Weekly'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => save('AI Preferences')} className="btn-primary text-xs">Save AI Settings</button>
            </div>
          )}

          {/* 5. Voice Agent & Telephony (User Journey Step 5) */}
          {activeTab === 'voice' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-bg-border pb-2">
                <div>
                  <div className="text-sm font-semibold text-text-primary">Voice Agent & Telephony Infrastructure</div>
                  <div className="text-2xs text-text-muted">User Journey Step 5: Configure calling infrastructure (Built-in vs. BYO Telephony) & AI voice persona</div>
                </div>
                <span className="badge-blue">JOURNEY STEP 5</span>
              </div>

              {/* Calling Infrastructure Selector */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-text-primary block">Calling Infrastructure Provider</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                  {/* Built-in Calling Option */}
                  <div
                    onClick={() => setTelephonyMode('BUILTIN')}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${telephonyMode === 'BUILTIN' ? 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30' : 'border-bg-border hover:border-amber-500/30 bg-bg-card'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-text-primary">Platform Built-in Calling</span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${telephonyMode === 'BUILTIN' ? 'border-amber-400 bg-amber-400' : 'border-bg-border'}`}>
                        {telephonyMode === 'BUILTIN' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                    </div>
                    <p className="text-2xs text-text-secondary mt-2">
                      Zero configuration required. Uses high-deliverability platform carrier routes with pre-allocated phone numbers. Metered via platform voice minutes.
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-2xs font-mono text-text-muted">
                      <span className="badge-success text-2xs">Ready to Call</span>
                      <span>10,000 mins allocated</span>
                    </div>
                  </div>

                  {/* BYO Telephony Option */}
                  <div
                    onClick={() => setTelephonyMode('BYO')}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${telephonyMode === 'BYO' ? 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30' : 'border-bg-border hover:border-amber-500/30 bg-bg-card'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-text-primary">Bring Your Own (BYO) Telephony</span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${telephonyMode === 'BYO' ? 'border-amber-400 bg-amber-400' : 'border-bg-border'}`}>
                        {telephonyMode === 'BYO' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                    </div>
                    <p className="text-2xs text-text-secondary mt-2">
                      Connect your existing Twilio, Plivo, Vonage, or Asterisk SIP trunks. Use your company caller IDs and billing directly with your carrier.
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-2xs font-mono text-text-muted">
                      <span className="badge-blue text-2xs">Custom SIP Trunk</span>
                      <span>Zero minute markup</span>
                    </div>
                  </div>
                </div>

                {/* BYO Telephony Configuration Fields */}
                {telephonyMode === 'BYO' && (
                  <div className="p-4 bg-bg-card border border-bg-border rounded-lg space-y-4 max-w-2xl animate-fade-in">
                    <div className="text-xs font-semibold text-text-primary border-b border-bg-border pb-2 flex items-center justify-between">
                      <span>BYO Telephony Credentials & SIP Routing</span>
                      <span className="text-2xs text-text-muted">Direct Carrier Handshake</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Telephony Carrier Provider</label>
                        <select
                          className="input text-xs"
                          value={byoProvider}
                          onChange={e => setByoProvider(e.target.value)}
                        >
                          <option>Twilio</option>
                          <option>Plivo</option>
                          <option>Vonage / Nexmo</option>
                          <option>Custom SIP Trunk / Asterisk</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Outbound Caller ID Number</label>
                        <input
                          className="input font-mono text-xs"
                          value={byoPhone}
                          onChange={e => setByoPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Account SID / API Key</label>
                        <input
                          className="input font-mono text-xs"
                          value={byoSid}
                          onChange={e => setByoSid(e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">Auth Token / Secret</label>
                        <input
                          type="password"
                          className="input font-mono text-xs"
                          value={byoToken}
                          onChange={e => setByoToken(e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">SIP Gateway Domain URI</label>
                        <input
                          className="input font-mono text-xs"
                          value={byoSipDomain}
                          onChange={e => setByoSipDomain(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-bg-border/50">
                      <span className="text-2xs text-text-muted">Encrypted TLS SIP Handshake</span>
                      <button
                        type="button"
                        onClick={testCarrier}
                        disabled={isTestingCarrier}
                        className="btn-secondary text-xs flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3 text-amber-400" />
                        {isTestingCarrier ? 'Testing Latency...' : 'Test Carrier Connection'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Voice Persona Parameters */}
              <div className="space-y-4 pt-2 border-t border-bg-border">
                <div className="text-xs font-semibold text-text-primary">AI Voice Persona Parameters</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                  {[
                    { l: 'Default Agent Persona Name', type: 'input', val: 'Aria (Enterprise SDR)' },
                    { l: 'Default Outbound Language', type: 'select', opts: ['English (US)', 'English (India)', 'Hindi (हिंदी)', 'Gujarati (ગુજરાતી)', 'Spanish (ES)', 'German (DE)'] },
                    { l: 'Voice Style & Timbre', type: 'select', opts: ['Professional Female (Natural Neural)', 'Warm Professional Male', 'Expressive Native Hindi Female', 'British Corporate Male'] },
                    { l: 'Conversational Pacing & Speed', type: 'select', opts: ['0.85x (Calm & Slower)', '1.0x (Natural Conversational)', '1.1x (Energetic)'] },
                    { l: 'Max Call Duration (Minutes)', type: 'input', val: '10' },
                    { l: 'Unanswered Ring Timeout (Sec)', type: 'input', val: '28' },
                  ].map((f, i) => (
                    <div key={i}>
                      <label className="text-2xs text-text-muted uppercase tracking-wide mb-1 block">{f.l}</label>
                      {f.type === 'select'
                        ? <select className="input text-xs w-full">{(f as any).opts.map((o: string) => <option key={o}>{o}</option>)}</select>
                        : <input className="input text-xs w-full" defaultValue={(f as any).val} />
                      }
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => save('Voice & Telephony Infrastructure')} className="btn-primary text-xs">Save Telephony & Voice Settings</button>
            </div>
          )}

          {/* 5. Languages */}
          {activeTab === 'languages' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">Interface Language</div>
              <div className="text-xs text-text-muted">Select the language for the platform interface</div>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {[
                  { code: 'en', label: 'English', native: 'English' },
                  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
                  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
                ].map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code as any)
                      showToast('success', 'Language Changed', `Interface language set to ${l.label}`)
                    }}
                    className={`p-4 rounded border text-center transition-colors ${language === l.code ? 'bg-amber-500/10 border-amber-500/40' : 'border-bg-border hover:border-amber-500/30 bg-bg-card'}`}
                  >
                    <div className="text-lg mb-1">{l.native}</div>
                    <div className="text-2xs text-text-muted">{l.label}</div>
                    {language === l.code && <div className="text-2xs text-amber-400 mt-1">✓ Active</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">Notification Preferences</div>
              <div className="max-w-xl space-y-3">
                {[
                  { key: 'emailQualified', label: 'Qualified Lead Email Alerts', desc: 'Receive instant email when AI scores a prospect >= 90' },
                  { key: 'pushLiveCalls', label: 'Live Call Activity Push Alerts', desc: 'Browser notifications when live voice agents begin calls' },
                  { key: 'highIntentAlerts', label: 'High Intent Lead Alerts', desc: 'Immediate notification when strong buying signals detected' },
                  { key: 'meetingBooked', label: 'Meeting Booked Confirmations', desc: 'Calendar invite and email confirmation on scheduled demos' },
                  { key: 'campaignSummary', label: 'Campaign Milestones', desc: 'Batch completion and daily metrics digest' },
                  { key: 'dailyDigest', label: 'Daily Executive Digest', desc: 'Summary of daily calls, conversions, and pipeline growth' },
                  { key: 'securityAlerts', label: 'Security & Audit Alerts', desc: 'Critical alerts on logins, credential changes, and rate limits' },
                  { key: 'smsAlerts', label: 'SMS Urgent Alerts', desc: 'SMS text for immediate hot lead callbacks' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-bg-border/50">
                    <div className="pr-4">
                      <div className="text-xs font-medium text-text-primary">{item.label}</div>
                      <div className="text-2xs text-text-muted mt-0.5">{item.desc}</div>
                    </div>
                    <ToggleSwitch
                      checked={(notifPreferences as any)[item.key]}
                      onChange={val => setNotifPreferences(p => ({ ...p, [item.key]: val }))}
                    />
                  </div>
                ))}
              </div>
              <button onClick={() => save('Notification Preferences')} className="btn-primary text-xs">Save Notification Preferences</button>
            </div>
          )}

          {/* 7. Integrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">Connected Platforms & APIs</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                {[
                  { id: 'salesforce', name: 'Salesforce CRM', desc: 'Bidirectional lead & contact synchronization', badge: 'Connected', icon: '⚡' },
                  { id: 'hubspot', name: 'HubSpot', desc: 'Marketing contacts & deals integration', badge: 'Connected', icon: '🟠' },
                  { id: 'slack', name: 'Slack Alerts', desc: 'Real-time sales alerts in #sales-feed', badge: 'Connected', icon: '💬' },
                  { id: 'twilio', name: 'Twilio Voice API', desc: 'Telephony infrastructure for AI voice agents', badge: 'Connected', icon: '📞' },
                  { id: 'sendgrid', name: 'SendGrid Email', desc: 'Transactional follow-ups and calendar invites', badge: 'Connected', icon: '✉️' },
                  { id: 'zapier', name: 'Zapier Webhooks', desc: 'Connect with 5,000+ external apps', badge: 'Available', icon: '⚡' },
                ].map(tool => {
                  const isConnected = integrationStates[tool.id]
                  return (
                    <div key={tool.id} className="p-3 bg-bg-card border border-bg-border rounded flex flex-col justify-between gap-3 hover:border-amber-500/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{tool.icon}</span>
                          <div>
                            <div className="text-xs font-semibold text-text-primary">{tool.name}</div>
                            <div className="text-2xs text-text-muted">{tool.desc}</div>
                          </div>
                        </div>
                        <span className={`text-2xs px-1.5 py-0.5 rounded font-mono ${isConnected ? 'bg-success/20 text-success border border-success/30' : 'bg-bg-border text-text-muted'}`}>
                          {isConnected ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-bg-border/50 text-2xs">
                        <button
                          type="button"
                          onClick={() => showToast('info', `${tool.name} Settings`, 'Opening API credentials dialog')}
                          className="text-text-muted hover:text-text-primary flex items-center gap-1"
                        >
                          <Key className="w-3 h-3" /> Credentials
                        </button>
                        <ToggleSwitch
                          checked={isConnected}
                          onChange={val => {
                            setIntegrationStates(p => ({ ...p, [tool.id]: val }))
                            showToast('info', tool.name, val ? 'Integration enabled' : 'Integration disabled')
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => save('Integrations')} className="btn-primary text-xs">Save Integrations</button>
            </div>
          )}

          {/* 8. Security */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">Security</div>
              {[
                { l: 'Two-Factor Authentication', desc: 'Add extra security to your account', btn: 'Enable 2FA', variant: 'btn-primary' },
                { l: 'Change Password', desc: 'Update your account password', btn: 'Change Password', variant: 'btn-secondary' },
                { l: 'Active Sessions', desc: '2 active sessions (this device + 1 other)', btn: 'View Sessions', variant: 'btn-secondary' },
                { l: 'API Keys', desc: '3 active API keys', btn: 'Manage Keys', variant: 'btn-secondary' },
              ].map(item => (
                <div key={item.l} className="flex items-center justify-between py-3 border-b border-bg-border/50">
                  <div>
                    <div className="text-xs font-medium text-text-primary">{item.l}</div>
                    <div className="text-2xs text-text-muted">{item.desc}</div>
                  </div>
                  <button onClick={() => showToast('info', item.l, 'Action initiated')} className={`${item.variant} text-xs`}>{item.btn}</button>
                </div>
              ))}
            </div>
          )}

          {/* 10. Billing & Plans (User Journey Step 4) */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-bg-border pb-2">
                <div>
                  <div className="text-sm font-semibold text-text-primary">Subscription Plans & Modular Services</div>
                  <div className="text-2xs text-text-muted">User Journey Step 4: Choose between Lead Generation, AI Voice Calling, or Both based on business needs</div>
                </div>
                <span className="badge-blue">JOURNEY STEP 4</span>
              </div>

              {/* Modular Service Selection */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-text-primary block">Active Platform Service Modules</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'LEAD_GEN',
                      title: 'Lead Generation Only',
                      price: '$149',
                      badge: 'Intent Discovery',
                      desc: 'AI Lead Discovery across LinkedIn, X, directories, email/phone enrichment & CSV/Excel export.',
                      features: ['Continuous Requirement Scraping', 'Intent & BANT Scoring', 'Full Contact Enrichment', 'CSV/Excel Unlimited Export'],
                    },
                    {
                      id: 'VOICE_CALLING',
                      title: 'AI Voice Calling Only',
                      price: '$199',
                      badge: 'Autonomous Calling',
                      desc: 'Autonomous multilingual voice outreach, FAQ handling, voicemail drops & transcript generation.',
                      features: ['Inbound & Outbound Calling', 'Multilingual Neural Agents', 'Voicemail & Callback Logic', 'Transcripts & Next-Best Action'],
                    },
                    {
                      id: 'BOTH',
                      title: 'Unified Suite (Both)',
                      price: '$299',
                      badge: 'Recommended · Full Pipeline',
                      desc: 'End-to-end autonomous sales pipeline: from public intent detection directly to qualified CRM hand-off.',
                      features: ['Full AI Lead Discovery', 'Lead Enrichment & Market Intel', 'Multilingual AI Voice Agent', 'Automated CRM Hand-off'],
                    },
                  ].map(mod => {
                    const isSelected = modularPlan === mod.id
                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          setModularPlan(mod.id as any)
                          showToast('success', 'Module Updated', `Active service set to: ${mod.title}`)
                        }}
                        className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${isSelected ? 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30' : 'border-bg-border hover:border-amber-500/30 bg-bg-card'}`}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="badge-blue text-2xs">{mod.badge}</span>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-amber-400 bg-amber-400' : 'border-bg-border'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-text-primary mt-2">{mod.title}</div>
                          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{mod.price}<span className="text-2xs text-text-muted font-normal">/mo base</span></div>
                          <p className="text-2xs text-text-secondary mt-2 leading-relaxed">{mod.desc}</p>
                        </div>
                        <ul className="mt-3 pt-3 border-t border-bg-border/60 space-y-1">
                          {mod.features.map(f => (
                            <li key={f} className="flex items-center gap-1.5 text-2xs text-text-muted">
                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Subscription Tiers */}
              <div className="space-y-3 pt-2 border-t border-bg-border">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-text-primary block">Subscription Tier</label>
                    <span className="text-2xs text-text-muted">Scale capacity for verified leads and AI voice minutes</span>
                  </div>
                  <span className="badge-success text-2xs">Active Plan: {planTier}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { tier: 'STARTER', price: '$99', leads: '500 leads', voice: '500 mins', target: 'Early-stage startups' },
                    { tier: 'GROWTH', price: '$299', leads: '5,000 leads', voice: '2,000 mins', target: 'Scaling sales teams' },
                    { tier: 'ENTERPRISE', price: '$899', leads: '50,000 leads', voice: '10,000 mins', target: 'Large enterprise sales' },
                  ].map(t => {
                    const isActive = planTier === t.tier
                    return (
                      <div
                        key={t.tier}
                        onClick={() => {
                          setPlanTier(t.tier as any)
                          showToast('success', 'Plan Tier Selected', `Switched to ${t.tier} Tier`)
                        }}
                        className={`p-3.5 rounded border cursor-pointer transition-all ${isActive ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/20' : 'bg-bg-card border-bg-border hover:border-amber-500/30'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-text-primary">{t.tier}</span>
                          {isActive && <span className="badge-amber text-2xs">CURRENT</span>}
                        </div>
                        <div className="text-lg font-bold font-mono text-text-primary mt-1">{t.price}<span className="text-2xs text-text-muted">/mo</span></div>
                        <div className="text-2xs text-text-muted mt-1 space-y-0.5 font-mono">
                          <div>• {t.leads} / month</div>
                          <div>• {t.voice} / month</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Usage This Month */}
              <div className="space-y-3 pt-2 border-t border-bg-border">
                <div className="text-xs font-semibold text-text-primary">Current Metered Usage (Usage-Based Pricing)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { l: 'Discovered Contacts', u: 24681, m: 50000, unit: 'leads' },
                    { l: 'AI Voice Minutes', u: 4820, m: 10000, unit: 'mins' },
                    { l: 'API Integration Calls', u: 18420, m: 100000, unit: 'reqs' },
                    { l: 'Document Vector Storage', u: 2.4, m: 50, unit: 'MB' },
                  ].map(r => (
                    <div key={r.l} className="p-3 bg-bg-card border border-bg-border rounded">
                      <div className="flex justify-between text-2xs mb-1">
                        <span className="text-text-muted font-medium">{r.l}</span>
                        <span className="text-text-primary font-mono font-semibold">{r.u.toLocaleString()} / {r.m.toLocaleString()} {r.unit}</span>
                      </div>
                      <div className="progress-track"><div className="progress-fill-amber" style={{ width: `${(r.u / r.m) * 100}%` }} /></div>
                      <div className="text-right text-2xs text-text-muted font-mono mt-1">{Math.round((r.u / r.m) * 100)}% utilized</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

