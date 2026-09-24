import { Lead, LeadSource } from '@/data/leads'

export type CrmStatus = 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR' | 'PAUSED'
export type LeadSourceStatus = 'ACTIVE' | 'SYNCING' | 'INACTIVE' | 'RATE_LIMITED'
export type SyncDirection = 'BIDIRECTIONAL' | 'OUTBOUND' | 'INBOUND'

export interface FieldMapping {
  localField: string
  remoteField: string
  direction: 'both' | 'outbound' | 'inbound'
}

export interface CRMIntegration {
  id: string
  name: string
  desc: string
  logo: string
  status: CrmStatus
  authType: 'OAUTH' | 'API_KEY' | 'WEBHOOK'
  instanceUrl: string
  apiKey?: string
  clientId?: string
  syncDirection: SyncDirection
  syncInterval: 'realtime' | '5m' | '15m' | 'hourly' | 'daily' | 'manual'
  lastSync: string
  records: number
  fieldMappings: FieldMapping[]
  autoCreateContacts: boolean
  minIntentThreshold: number
}

export interface LeadSourceIntegration {
  id: string
  name: string
  category: 'B2B Database' | 'Social & Professional' | 'Local Discovery' | 'Email Finder' | 'Webhooks & Inbound' | 'Paid Ads'
  desc: string
  logo: string
  status: LeadSourceStatus
  autoEnrich: boolean
  minIntentScore: number
  leadsIngestedToday: number
  totalIngested: number
  latencyMs: number
  webhookUrl: string
  webhookSecret: string
  apiKey?: string
  syncInterval: string
  lastIngest: string
}

export interface SyncActivityRecord {
  id: string
  timestamp: string
  integrationId: string
  integrationName: string
  type: 'CRM_PUSH' | 'CRM_PULL' | 'SOURCE_INGEST' | 'WEBHOOK_EVENT'
  status: 'SUCCESS' | 'WARNING' | 'ERROR'
  recordsCount: number
  latencyMs: number
  message: string
  payloadSummary?: string
}

const DEFAULT_CRMS: CRMIntegration[] = [
  {
    id: 'salesforce',
    name: 'Salesforce CRM',
    desc: 'Enterprise Sales Cloud & Lead Management sync',
    logo: '⚡',
    status: 'CONNECTED',
    authType: 'OAUTH',
    instanceUrl: 'https://callistoai.my.salesforce.com',
    clientId: '3MVG9l4RdzPwuZ4.qG_callisto_prod_oauth',
    syncDirection: 'BIDIRECTIONAL',
    syncInterval: '15m',
    lastSync: '2 minutes ago',
    records: 482,
    autoCreateContacts: true,
    minIntentThreshold: 75,
    fieldMappings: [
      { localField: 'name', remoteField: 'Contact.FullName', direction: 'both' },
      { localField: 'email', remoteField: 'Contact.Email', direction: 'both' },
      { localField: 'phone', remoteField: 'Contact.Phone', direction: 'both' },
      { localField: 'company', remoteField: 'Account.Name', direction: 'both' },
      { localField: 'intentScore', remoteField: 'Lead.AI_Intent_Score__c', direction: 'outbound' },
      { localField: 'status', remoteField: 'Lead.Status', direction: 'both' },
      { localField: 'nextAction', remoteField: 'Task.Subject', direction: 'outbound' },
    ],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    desc: 'Inbound Marketing, Contacts, & Sales Deals',
    logo: '🟠',
    status: 'CONNECTED',
    authType: 'OAUTH',
    instanceUrl: 'https://api.hubapi.com/crm/v3',
    clientId: 'hs-app-callisto-ai-sync-2026',
    syncDirection: 'BIDIRECTIONAL',
    syncInterval: 'realtime',
    lastSync: '5 minutes ago',
    records: 318,
    autoCreateContacts: true,
    minIntentThreshold: 70,
    fieldMappings: [
      { localField: 'name', remoteField: 'properties.firstname_lastname', direction: 'both' },
      { localField: 'email', remoteField: 'properties.email', direction: 'both' },
      { localField: 'phone', remoteField: 'properties.phone', direction: 'both' },
      { localField: 'company', remoteField: 'properties.company', direction: 'both' },
      { localField: 'intentScore', remoteField: 'properties.ai_qualification_score', direction: 'outbound' },
    ],
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    desc: 'Full Zoho CRM omnichannel lead synchronization',
    logo: '🔴',
    status: 'CONNECTED',
    authType: 'OAUTH',
    instanceUrl: 'https://crm.zoho.com/crm/v2',
    clientId: '1000.CALLISTO_ZOHO_CLIENT_ID',
    syncDirection: 'BIDIRECTIONAL',
    syncInterval: 'hourly',
    lastSync: '42 minutes ago',
    records: 154,
    autoCreateContacts: true,
    minIntentThreshold: 75,
    fieldMappings: [
      { localField: 'name', remoteField: 'Full_Name', direction: 'both' },
      { localField: 'email', remoteField: 'Email', direction: 'both' },
      { localField: 'phone', remoteField: 'Phone', direction: 'both' },
      { localField: 'company', remoteField: 'Company', direction: 'both' },
    ],
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    desc: 'Activity-based sales CRM pipeline deal integration',
    logo: '🟢',
    status: 'CONNECTED',
    authType: 'API_KEY',
    instanceUrl: 'https://callistoai.pipedrive.com/api/v1',
    apiKey: 'pk_live_89a74b12d5e3f9a74b8891c3',
    syncDirection: 'OUTBOUND',
    syncInterval: '15m',
    lastSync: '1 hour ago',
    records: 96,
    autoCreateContacts: true,
    minIntentThreshold: 80,
    fieldMappings: [
      { localField: 'name', remoteField: 'person_name', direction: 'outbound' },
      { localField: 'email', remoteField: 'email', direction: 'outbound' },
      { localField: 'company', remoteField: 'org_name', direction: 'outbound' },
      { localField: 'intentScore', remoteField: 'deal_probability', direction: 'outbound' },
    ],
  },
  {
    id: 'dynamics',
    name: 'Microsoft Dynamics 365',
    desc: 'Enterprise CRM & Dataverse lead synchronization',
    logo: '🔷',
    status: 'DISCONNECTED',
    authType: 'OAUTH',
    instanceUrl: 'https://callistoai.crm.dynamics.com/api/data/v9.2',
    clientId: 'ms-azure-ad-callisto-client-app',
    syncDirection: 'BIDIRECTIONAL',
    syncInterval: 'hourly',
    lastSync: 'Never',
    records: 0,
    autoCreateContacts: true,
    minIntentThreshold: 75,
    fieldMappings: [
      { localField: 'name', remoteField: 'fullname', direction: 'both' },
      { localField: 'email', remoteField: 'emailaddress1', direction: 'both' },
      { localField: 'company', remoteField: 'companyname', direction: 'both' },
    ],
  },
  {
    id: 'gohighlevel',
    name: 'GoHighLevel (GHL)',
    desc: 'Agency CRM, Smart Lists, & Automations Sync',
    logo: '🔥',
    status: 'CONNECTED',
    authType: 'API_KEY',
    instanceUrl: 'https://rest.gohighlevel.com/v1',
    apiKey: 'ghl_live_token_77a4192b0c98f12a',
    syncDirection: 'BIDIRECTIONAL',
    syncInterval: '5m',
    lastSync: '12 minutes ago',
    records: 210,
    autoCreateContacts: true,
    minIntentThreshold: 70,
    fieldMappings: [
      { localField: 'name', remoteField: 'contact.name', direction: 'both' },
      { localField: 'email', remoteField: 'contact.email', direction: 'both' },
      { localField: 'phone', remoteField: 'contact.phone', direction: 'both' },
      { localField: 'company', remoteField: 'contact.companyName', direction: 'both' },
    ],
  },
  {
    id: 'monday',
    name: 'Monday.com Sales CRM',
    desc: 'Visual work OS pipeline and custom lead boards',
    logo: '🟣',
    status: 'DISCONNECTED',
    authType: 'API_KEY',
    instanceUrl: 'https://api.monday.com/v2',
    apiKey: 'monday_api_v2_callisto_sec_key',
    syncDirection: 'OUTBOUND',
    syncInterval: 'hourly',
    lastSync: 'Never',
    records: 0,
    autoCreateContacts: true,
    minIntentThreshold: 75,
    fieldMappings: [
      { localField: 'name', remoteField: 'item_name', direction: 'outbound' },
      { localField: 'email', remoteField: 'email_column', direction: 'outbound' },
      { localField: 'company', remoteField: 'company_text', direction: 'outbound' },
    ],
  },
  {
    id: 'close',
    name: 'Close CRM',
    desc: 'Inside sales CRM with integrated VoIP and SMS tracking',
    logo: '🎯',
    status: 'DISCONNECTED',
    authType: 'API_KEY',
    instanceUrl: 'https://api.close.com/api/v1',
    apiKey: 'api_498273615243_close_live',
    syncDirection: 'BIDIRECTIONAL',
    syncInterval: '15m',
    lastSync: 'Never',
    records: 0,
    autoCreateContacts: true,
    minIntentThreshold: 80,
    fieldMappings: [
      { localField: 'name', remoteField: 'contact_name', direction: 'both' },
      { localField: 'email', remoteField: 'email', direction: 'both' },
      { localField: 'phone', remoteField: 'phone', direction: 'both' },
    ],
  },
  {
    id: 'custom_rest',
    name: 'Custom REST / Webhook CRM',
    desc: 'Connect your internal CRM or custom proprietary database',
    logo: '🛠️',
    status: 'DISCONNECTED',
    authType: 'WEBHOOK',
    instanceUrl: 'https://internal-crm.yourcompany.com/api/v1/leads',
    apiKey: 'bearer_token_secret_12345',
    syncDirection: 'BIDIRECTIONAL',
    syncInterval: 'realtime',
    lastSync: 'Never',
    records: 0,
    autoCreateContacts: true,
    minIntentThreshold: 75,
    fieldMappings: [
      { localField: 'name', remoteField: 'lead_name', direction: 'both' },
      { localField: 'email', remoteField: 'lead_email', direction: 'both' },
      { localField: 'phone', remoteField: 'phone_number', direction: 'both' },
      { localField: 'intentScore', remoteField: 'ai_score', direction: 'outbound' },
    ],
  },
]

const DEFAULT_LEAD_SOURCES: LeadSourceIntegration[] = [
  {
    id: 'apollo',
    name: 'Apollo.io',
    category: 'B2B Database',
    desc: '275M+ verified B2B contacts, direct work emails & mobile numbers',
    logo: '🚀',
    status: 'ACTIVE',
    autoEnrich: true,
    minIntentScore: 80,
    leadsIngestedToday: 48,
    totalIngested: 1420,
    latencyMs: 142,
    webhookUrl: 'https://api.callistoai.com/v1/webhooks/apollo/lead-stream',
    webhookSecret: 'whsec_apollo_live_948a27b',
    apiKey: 'apl_live_981273491823791',
    syncInterval: 'Hourly Trigger',
    lastIngest: '14 minutes ago',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Sales Navigator',
    category: 'Social & Professional',
    desc: 'Public buyer requirements, hiring surges, and decision-maker signals',
    logo: '💼',
    status: 'ACTIVE',
    autoEnrich: true,
    minIntentScore: 82,
    leadsIngestedToday: 65,
    totalIngested: 2190,
    latencyMs: 185,
    webhookUrl: 'https://api.callistoai.com/v1/webhooks/linkedin/posts',
    webhookSecret: 'whsec_ln_live_8372641',
    apiKey: 'ln_oauth2_token_callisto',
    syncInterval: 'Continuous Scraping',
    lastIngest: '6 minutes ago',
  },
  {
    id: 'zoominfo',
    name: 'ZoomInfo Enterprise',
    category: 'B2B Database',
    desc: 'Organizational hierarchy, corporate funding events, and tech stack detection',
    logo: '🏢',
    status: 'ACTIVE',
    autoEnrich: true,
    minIntentScore: 85,
    leadsIngestedToday: 32,
    totalIngested: 940,
    latencyMs: 210,
    webhookUrl: 'https://api.callistoai.com/v1/webhooks/zoominfo/stream',
    webhookSecret: 'whsec_zi_78461298',
    apiKey: 'zi_client_jwt_token',
    syncInterval: 'Every 2 Hours',
    lastIngest: '35 minutes ago',
  },
  {
    id: 'google_maps',
    name: 'Google Maps & Local Places',
    category: 'Local Discovery',
    desc: 'Local business discovery, verified phone numbers, and website scraping',
    logo: '📍',
    status: 'ACTIVE',
    autoEnrich: false,
    minIntentScore: 75,
    leadsIngestedToday: 84,
    totalIngested: 1860,
    latencyMs: 98,
    webhookUrl: 'https://api.callistoai.com/v1/webhooks/gmaps/places',
    webhookSecret: 'whsec_gmaps_9938172',
    apiKey: 'AIzaSyA89347102938102938',
    syncInterval: 'On-Demand Scrape',
    lastIngest: '1 hour ago',
  },
  {
    id: 'hunter',
    name: 'Hunter.io & Email Verifier',
    category: 'Email Finder',
    desc: 'Domain search and real-time SMTP deliverability verification engine',
    logo: '🎯',
    status: 'ACTIVE',
    autoEnrich: true,
    minIntentScore: 78,
    leadsIngestedToday: 26,
    totalIngested: 620,
    latencyMs: 115,
    webhookUrl: 'https://api.callistoai.com/v1/webhooks/hunter/verify',
    webhookSecret: 'whsec_hunter_839127',
    apiKey: 'hunt_sec_89327498127394',
    syncInterval: 'Realtime Verification',
    lastIngest: '22 minutes ago',
  },
  {
    id: 'clay',
    name: 'Clay.com Waterfall Enrichment',
    category: 'B2B Database',
    desc: 'Multi-provider waterfall enrichment combining 50+ data providers',
    logo: '🧱',
    status: 'ACTIVE',
    autoEnrich: true,
    minIntentScore: 85,
    leadsIngestedToday: 54,
    totalIngested: 1180,
    latencyMs: 175,
    webhookUrl: 'https://api.callistoai.com/v1/webhooks/clay/enrichment',
    webhookSecret: 'whsec_clay_4728919',
    apiKey: 'clay_live_key_9823471',
    syncInterval: 'Webhook Push',
    lastIngest: '8 minutes ago',
  },
  {
    id: 'inbound_webhook',
    name: 'Website Inbound Webhook / Forms',
    category: 'Webhooks & Inbound',
    desc: 'Instant lead capture from Webflow, Typeform, WordPress, or custom forms',
    logo: '⚡',
    status: 'ACTIVE',
    autoEnrich: true,
    minIntentScore: 88,
    leadsIngestedToday: 41,
    totalIngested: 890,
    latencyMs: 45,
    webhookUrl: 'https://api.callistoai.com/v1/webhooks/inbound/forms',
    webhookSecret: 'whsec_inbound_pub_847291',
    syncInterval: 'Instant Realtime',
    lastIngest: '2 minutes ago',
  },
  {
    id: 'meta_ads',
    name: 'Meta (Facebook & IG) Lead Ads',
    category: 'Paid Ads',
    desc: 'Instant real-time ingestion from Facebook & Instagram lead generation campaigns',
    logo: '📱',
    status: 'INACTIVE',
    autoEnrich: true,
    minIntentScore: 70,
    leadsIngestedToday: 0,
    totalIngested: 450,
    latencyMs: 130,
    webhookUrl: 'https://api.callistoai.com/v1/webhooks/meta/leadgen',
    webhookSecret: 'whsec_meta_graph_839123',
    apiKey: 'EAAO...meta_long_lived_token',
    syncInterval: 'Webhook Push',
    lastIngest: 'Yesterday',
  },
  {
    id: 'google_ads',
    name: 'Google Ads Lead Form Extensions',
    category: 'Paid Ads',
    desc: 'Search, YouTube, and Discovery campaign lead webhook capture',
    logo: '🔍',
    status: 'INACTIVE',
    autoEnrich: true,
    minIntentScore: 75,
    leadsIngestedToday: 0,
    totalIngested: 310,
    latencyMs: 120,
    webhookUrl: 'https://api.callistoai.com/v1/webhooks/google/lead-extensions',
    webhookSecret: 'whsec_gads_sec_9934812',
    apiKey: 'gads_oauth_refresh_callisto',
    syncInterval: 'Webhook Push',
    lastIngest: '3 days ago',
  },
]

const DEFAULT_SYNC_LOGS: SyncActivityRecord[] = [
  {
    id: 'LOG-101',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    integrationId: 'inbound_webhook',
    integrationName: 'Website Inbound Webhook / Forms',
    type: 'WEBHOOK_EVENT',
    status: 'SUCCESS',
    recordsCount: 1,
    latencyMs: 42,
    message: 'Captured enterprise lead from pricing page demo request form',
    payloadSummary: '{"source":"Pricing Page Form","name":"Priya Sharma","company":"Fintech Innovations","intentScore":94}',
  },
  {
    id: 'LOG-102',
    timestamp: new Date(Date.now() - 6 * 60000).toISOString(),
    integrationId: 'linkedin',
    integrationName: 'LinkedIn Sales Navigator',
    type: 'SOURCE_INGEST',
    status: 'SUCCESS',
    recordsCount: 8,
    latencyMs: 194,
    message: 'Scraped 8 high-intent public posts mentioning AI Agent implementation',
    payloadSummary: '8 leads added with intent scores 86-96, enriched with verified email addresses',
  },
  {
    id: 'LOG-103',
    timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
    integrationId: 'salesforce',
    integrationName: 'Salesforce CRM',
    type: 'CRM_PUSH',
    status: 'SUCCESS',
    recordsCount: 12,
    latencyMs: 245,
    message: 'Bidirectional sync: Updated 12 lead qualification statuses in Salesforce Sales Cloud',
    payloadSummary: '{"synced_objects":"Lead","batch_size":12,"direction":"BIDIRECTIONAL"}',
  },
  {
    id: 'LOG-104',
    timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
    integrationId: 'apollo',
    integrationName: 'Apollo.io',
    type: 'SOURCE_INGEST',
    status: 'SUCCESS',
    recordsCount: 15,
    latencyMs: 138,
    message: 'Ingested 15 verified SaaS VP of Sales and Head of RevOps contacts',
    payloadSummary: '{"filter":"SaaS VP Sales","verified_emails":15,"direct_phones":12}',
  },
  {
    id: 'LOG-105',
    timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
    integrationId: 'hubspot',
    integrationName: 'HubSpot',
    type: 'CRM_PULL',
    status: 'SUCCESS',
    recordsCount: 24,
    latencyMs: 167,
    message: 'Pulled 24 newly registered marketing contacts into Callisto AI qualification pipeline',
    payloadSummary: '{"object":"contacts","pulled":24,"matched":24}',
  },
]

const STORAGE_KEYS = {
  CRMS: 'callisto_crm_integrations_v1',
  SOURCES: 'callisto_lead_sources_v1',
  LOGS: 'callisto_sync_activity_logs_v1',
}

// Storage helpers
export function loadCrms(): CRMIntegration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRMS)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load CRMs from storage', e)
  }
  return DEFAULT_CRMS
}

export function saveCrms(crms: CRMIntegration[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CRMS, JSON.stringify(crms))
  } catch (e) {
    console.error('Failed to save CRMs', e)
  }
}

export function loadLeadSources(): LeadSourceIntegration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SOURCES)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load Lead Sources from storage', e)
  }
  return DEFAULT_LEAD_SOURCES
}

export function saveLeadSources(sources: LeadSourceIntegration[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(sources))
  } catch (e) {
    console.error('Failed to save Lead Sources', e)
  }
}

export function loadSyncLogs(): SyncActivityRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load sync logs', e)
  }
  return DEFAULT_SYNC_LOGS
}

export function saveSyncLogs(logs: SyncActivityRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 50)))
  } catch (e) {
    console.error('Failed to save sync logs', e)
  }
}

export function addSyncLog(entry: Omit<SyncActivityRecord, 'id' | 'timestamp'>): SyncActivityRecord {
  const logs = loadSyncLogs()
  const newLog: SyncActivityRecord = {
    ...entry,
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  }
  const updated = [newLog, ...logs].slice(0, 50)
  saveSyncLogs(updated)
  return newLog
}

// Generate high-intent realistic leads based on source
export function generateMockLeadsForSource(sourceName: LeadSource, count: number = 3): Partial<Lead>[] {
  const sampleProfiles = [
    {
      name: 'Aditya Deshmukh',
      jobTitle: 'VP of Technology & Cloud Infrastructure',
      company: 'Quantron Systems Inc',
      industry: 'IT Services',
      location: 'Pune, India',
      country: 'India',
      requirement: 'Looking for enterprise-grade autonomous AI voice calling to qualify 5,000 monthly enterprise inbound leads.',
      email: 'aditya.deshmukh@quantronsys.com',
      phone: '+91-98231-55442',
      linkedin: 'https://linkedin.com/in/aditya-quantron',
      companySize: '201-500',
      employees: 340,
      intentScore: 94,
      intent: 'HIGH' as const,
      budgetSignal: 'HIGH' as const,
      timeline: 'Next 30 days',
      tags: ['Autonomous AI Calling', 'Enterprise', 'Cloud'],
    },
    {
      name: 'Elena Rostova',
      jobTitle: 'Global Head of Inside Sales & Demand Gen',
      company: 'Novus Data Cloud',
      industry: 'SaaS',
      location: 'San Francisco, USA',
      country: 'USA',
      requirement: 'Evaluating multi-lingual AI voice outbound calling solutions to scale pipeline coverage across US and EMEA timezones.',
      email: 'elena.rostova@novuscloud.io',
      phone: '+1 (415) 882-9401',
      linkedin: 'https://linkedin.com/in/elena-rostova-sales',
      companySize: '51-200',
      employees: 120,
      intentScore: 92,
      intent: 'HIGH' as const,
      budgetSignal: 'HIGH' as const,
      timeline: 'Immediate / Q4',
      tags: ['SaaS RevOps', 'High Intent', 'Apollo Verified'],
    },
    {
      name: 'Dr. Manish Kulkarni',
      jobTitle: 'Chief Digital Officer',
      company: 'Apex MedTech Solutions',
      industry: 'Healthcare',
      location: 'Bangalore, India',
      country: 'India',
      requirement: 'Seeking HIPAA & DPDP compliant automated patient outreach and telemedicine follow-up agent.',
      email: 'm.kulkarni@apexmedtech.in',
      phone: '+91-99882-11440',
      linkedin: 'https://linkedin.com/in/dr-manish-kulkarni',
      companySize: '501-1000',
      employees: 680,
      intentScore: 89,
      intent: 'HIGH' as const,
      budgetSignal: 'HIGH' as const,
      timeline: 'Within 60 days',
      tags: ['Healthcare AI', 'Compliance', 'Voice Ingest'],
    },
    {
      name: 'Marcus Vance',
      jobTitle: 'Chief Revenue Officer',
      company: 'Vance Capital & Logistics',
      industry: 'Logistics',
      location: 'Chicago, USA',
      country: 'USA',
      requirement: 'Urgent need to automate broker dispatch calls and carrier rate verification over phone.',
      email: 'marcus.v@vancecaplog.com',
      phone: '+1 (312) 554-1928',
      linkedin: 'https://linkedin.com/in/marcus-vance-cro',
      companySize: '1000+',
      employees: 1400,
      intentScore: 96,
      intent: 'HIGH' as const,
      budgetSignal: 'HIGH' as const,
      timeline: 'Immediate',
      tags: ['Freight Automation', 'Urgent', 'ZoomInfo Ingest'],
    },
    {
      name: 'Sophie Laurent',
      jobTitle: 'Director of Growth Marketing',
      company: 'Luminary Payments Europe',
      industry: 'FinTech',
      location: 'Paris, France',
      country: 'France',
      requirement: 'Need French & English AI conversational agent for merchant onboarding verification calls.',
      email: 'sophie.laurent@luminarypay.eu',
      phone: '+33 1 42 68 55 00',
      linkedin: 'https://linkedin.com/in/sophielaurent-fintech',
      companySize: '51-200',
      employees: 95,
      intentScore: 88,
      intent: 'HIGH' as const,
      budgetSignal: 'MEDIUM' as const,
      timeline: 'Next 45 days',
      tags: ['FinTech', 'Multilingual', 'Clay Waterfall'],
    },
  ]

  const selected = sampleProfiles.slice(0, Math.min(count, sampleProfiles.length))

  return selected.map((p, i) => ({
    ...p,
    id: `LEAD-${sourceName.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}-${i + 1}`,
    source: sourceName,
    sourceUrl: `https://${sourceName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/lead-signal/${Date.now()}`,
    discoveredAt: new Date(),
    enrichedAt: new Date(),
    lastActivity: new Date(),
    status: 'QUALIFIED',
    nextAction: 'Launch autonomous AI Voice Agent introductory call',
    decisionMaker: true,
    needClarity: 90,
    urgency: 92,
    budgetScore: 88,
    authorityScore: 95,
    fitScore: 91,
    aiReasoning: `Auto-ingested from ${sourceName} with verified corporate email, direct telephone, and explicit intent signal detected in buyer requirements.`,
    aiRecommendations: [
      'Trigger AI outbound discovery call highlighting autonomous agent integration',
      'Sync lead profile to connected enterprise CRM',
      'Follow up with personalized calendar invite and technical demo deck',
    ],
  }))
}
