export type UserRole   = 'ADMIN' | 'MANAGER' | 'SALES_AGENT' | 'VIEWER'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'INACTIVE'
export type UserPlan   = 'STARTER' | 'GROWTH' | 'ENTERPRISE'

export interface AdminUser {
  id: string
  name: string
  email: string
  company: string
  role: UserRole
  plan: UserPlan
  status: UserStatus
  voiceUsed: number   // minutes
  voiceLimit: number
  apiCalls: number
  lastActive: Date
  createdAt: Date
  avatar?: string
}

export interface AuditLog {
  id: string
  timestamp: Date
  user: string
  userEmail: string
  action: string
  resource: string
  ip: string
  status: 'SUCCESS' | 'FAILED' | 'WARNING'
  details: string
}

const now = new Date()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000)
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000)
const minsAgo  = (m: number) => new Date(now.getTime() - m * 60_000)

export const adminUsers: AdminUser[] = [
  { id: 'U001', name: 'Tanishq Mehta',    email: 'tanishq@demo-nexusai.com',   company: 'NexusAI Solutions', role: 'ADMIN',       plan: 'ENTERPRISE', status: 'ACTIVE',    voiceUsed: 4820, voiceLimit: 10000, apiCalls: 18420, lastActive: minsAgo(5),    createdAt: daysAgo(180) },
  { id: 'U002', name: 'Riya Kapoor',      email: 'riya@demo-nexusai.com',      company: 'NexusAI Solutions', role: 'MANAGER',     plan: 'ENTERPRISE', status: 'ACTIVE',    voiceUsed: 2140, voiceLimit: 5000,  apiCalls: 8920,  lastActive: minsAgo(30),   createdAt: daysAgo(150) },
  { id: 'U003', name: 'Aryan Shah',       email: 'aryan@demo-nexusai.com',     company: 'NexusAI Solutions', role: 'SALES_AGENT', plan: 'GROWTH',     status: 'ACTIVE',    voiceUsed: 980,  voiceLimit: 2000,  apiCalls: 3210,  lastActive: hoursAgo(2),   createdAt: daysAgo(90)  },
  { id: 'U004', name: 'Sneha Patel',      email: 'sneha@demo-techventure.in',  company: 'TechVenture Labs',  role: 'SALES_AGENT', plan: 'GROWTH',     status: 'ACTIVE',    voiceUsed: 1420, voiceLimit: 2000,  apiCalls: 4820,  lastActive: hoursAgo(1),   createdAt: daysAgo(60)  },
  { id: 'U005', name: 'Rohit Verma',      email: 'rohit@demo-acme.com',        company: 'Acme Digital',      role: 'MANAGER',     plan: 'ENTERPRISE', status: 'ACTIVE',    voiceUsed: 3680, voiceLimit: 5000,  apiCalls: 12400, lastActive: hoursAgo(4),   createdAt: daysAgo(120) },
  { id: 'U006', name: 'Pooja Nair',       email: 'pooja@demo-finpro.in',       company: 'FinPro Advisors',   role: 'SALES_AGENT', plan: 'STARTER',    status: 'TRIAL',     voiceUsed: 180,  voiceLimit: 500,   apiCalls: 620,   lastActive: hoursAgo(8),   createdAt: daysAgo(14)  },
  { id: 'U007', name: 'Kiran Reddy',      email: 'kiran@demo-retailedge.io',   company: 'RetailEdge Tech',   role: 'MANAGER',     plan: 'GROWTH',     status: 'ACTIVE',    voiceUsed: 1820, voiceLimit: 2000,  apiCalls: 6140,  lastActive: daysAgo(1),    createdAt: daysAgo(75)  },
  { id: 'U008', name: 'Anjali Singh',     email: 'anjali@demo-healthsync.ai',  company: 'HealthSync AI',     role: 'SALES_AGENT', plan: 'STARTER',    status: 'ACTIVE',    voiceUsed: 340,  voiceLimit: 500,   apiCalls: 1280,  lastActive: hoursAgo(6),   createdAt: daysAgo(45)  },
  { id: 'U009', name: 'Vikrant Joshi',    email: 'vikrant@demo-logichain.in',  company: 'LogiChain Systems', role: 'VIEWER',      plan: 'STARTER',    status: 'INACTIVE',  voiceUsed: 0,    voiceLimit: 500,   apiCalls: 42,    lastActive: daysAgo(14),   createdAt: daysAgo(30)  },
  { id: 'U010', name: 'Meena Thomas',     email: 'meena@demo-wealthgrow.in',   company: 'WealthGrow Capital', role: 'MANAGER',    plan: 'GROWTH',     status: 'ACTIVE',    voiceUsed: 1120, voiceLimit: 2000,  apiCalls: 3820,  lastActive: hoursAgo(3),   createdAt: daysAgo(55)  },
  { id: 'U011', name: 'Shiv Agarwal',     email: 'shiv@demo-solarmax.in',      company: 'SolarMax Energy',   role: 'SALES_AGENT', plan: 'STARTER',    status: 'TRIAL',     voiceUsed: 82,   voiceLimit: 500,   apiCalls: 240,   lastActive: hoursAgo(12),  createdAt: daysAgo(7)   },
  { id: 'U012', name: 'Divya Menon',      email: 'divya@demo-edureach.in',     company: 'EduReach Platforms', role: 'MANAGER',    plan: 'GROWTH',     status: 'SUSPENDED', voiceUsed: 1950, voiceLimit: 2000,  apiCalls: 5420,  lastActive: daysAgo(5),    createdAt: daysAgo(80)  },
  { id: 'U013', name: 'Rahul Sharma',     email: 'rahul2@demo-apexinfo.in',    company: 'Apex InfoTech',     role: 'SALES_AGENT', plan: 'GROWTH',     status: 'ACTIVE',    voiceUsed: 1640, voiceLimit: 2000,  apiCalls: 5820,  lastActive: hoursAgo(5),   createdAt: daysAgo(65)  },
  { id: 'U014', name: 'Neha Bhat',        email: 'neha@demo-cloudscale.io',    company: 'CloudScale Inc',    role: 'SALES_AGENT', plan: 'ENTERPRISE', status: 'ACTIVE',    voiceUsed: 2840, voiceLimit: 5000,  apiCalls: 9120,  lastActive: hoursAgo(1),   createdAt: daysAgo(100) },
  { id: 'U015', name: 'Suresh Pillai',    email: 'suresh@demo-matrixnbfc.in',  company: 'Matrix NBFC',       role: 'MANAGER',     plan: 'ENTERPRISE', status: 'ACTIVE',    voiceUsed: 4180, voiceLimit: 5000,  apiCalls: 14200, lastActive: minsAgo(45),   createdAt: daysAgo(110) },
]

export const auditLogs: AuditLog[] = [
  { id: 'AL001', timestamp: minsAgo(5),   user: 'Tanishq Mehta',  userEmail: 'tanishq@demo-nexusai.com', action: 'CAMPAIGN_CREATE',      resource: 'Campaign: BFSI Compliance Outreach', ip: '192.168.1.101', status: 'SUCCESS', details: 'Created campaign C004 with 150 leads' },
  { id: 'AL002', timestamp: minsAgo(12),  user: 'Riya Kapoor',    userEmail: 'riya@demo-nexusai.com',    action: 'LEAD_EXPORT',          resource: 'Leads: 45 records',                  ip: '192.168.1.102', status: 'SUCCESS', details: 'Exported 45 high-intent leads to CSV' },
  { id: 'AL003', timestamp: minsAgo(28),  user: 'Aryan Shah',     userEmail: 'aryan@demo-nexusai.com',   action: 'CRM_CONNECT',          resource: 'CRM: Salesforce',                    ip: '192.168.1.103', status: 'SUCCESS', details: 'Connected Salesforce account — 234 records synced' },
  { id: 'AL004', timestamp: hoursAgo(1),  user: 'Sneha Patel',    userEmail: 'sneha@demo-techventure.in',action: 'AI_AGENT_UPDATE',      resource: 'Agent: Sam (SMB)',                    ip: '10.0.0.45',     status: 'SUCCESS', details: 'Updated greeting script and FAQ knowledge base' },
  { id: 'AL005', timestamp: hoursAgo(1),  user: 'System',         userEmail: 'system@nexusai.internal',  action: 'SUBSCRIPTION_RENEW',   resource: 'User: Kiran Reddy — Growth Plan',     ip: 'SYSTEM',        status: 'SUCCESS', details: 'Auto-renewed Growth subscription — $299/month' },
  { id: 'AL006', timestamp: hoursAgo(2),  user: 'Tanishq Mehta',  userEmail: 'tanishq@demo-nexusai.com', action: 'USER_SUSPEND',         resource: 'User: Divya Menon',                   ip: '192.168.1.101', status: 'SUCCESS', details: 'Suspended account — exceeded voice limit by 150 minutes' },
  { id: 'AL007', timestamp: hoursAgo(3),  user: 'Rohit Verma',    userEmail: 'rohit@demo-acme.com',      action: 'ADMIN_LOGIN',          resource: 'Admin Portal',                        ip: '202.88.12.45',  status: 'SUCCESS', details: 'Admin login from new IP — location: Mumbai' },
  { id: 'AL008', timestamp: hoursAgo(4),  user: 'Unknown',        userEmail: 'unknown@external.com',     action: 'API_KEY_INVALID',      resource: 'API: /v1/leads',                      ip: '45.33.87.21',   status: 'FAILED',  details: 'Invalid API key attempted — IP blocked' },
  { id: 'AL009', timestamp: hoursAgo(5),  user: 'System',         userEmail: 'system@nexusai.internal',  action: 'FRAUD_ALERT',          resource: 'User: Vikrant Joshi',                 ip: 'SYSTEM',        status: 'WARNING', details: 'Unusual API call pattern detected — flagged for review' },
  { id: 'AL010', timestamp: hoursAgo(6),  user: 'Meena Thomas',   userEmail: 'meena@demo-wealthgrow.in', action: 'LEAD_IMPORT',          resource: 'Leads: 120 records from CSV',         ip: '10.0.1.22',     status: 'SUCCESS', details: 'Imported 120 leads — 8 duplicates skipped' },
  { id: 'AL011', timestamp: hoursAgo(8),  user: 'Neha Bhat',      userEmail: 'neha@demo-cloudscale.io',  action: 'CAMPAIGN_PAUSE',       resource: 'Campaign: RetailTech South India',    ip: '172.16.0.55',   status: 'SUCCESS', details: 'Campaign C006 paused — voice budget 80% consumed' },
  { id: 'AL012', timestamp: hoursAgo(10), user: 'Tanishq Mehta',  userEmail: 'tanishq@demo-nexusai.com', action: 'PLATFORM_SETTING',     resource: 'Settings: Global voice speed',        ip: '192.168.1.101', status: 'SUCCESS', details: 'Updated default voice speed from 1.0 to 0.95' },
  { id: 'AL013', timestamp: daysAgo(1),   user: 'Suresh Pillai',  userEmail: 'suresh@demo-matrixnbfc.in',action: 'SUBSCRIPTION_UPGRADE', resource: 'User: Suresh Pillai — Growth → Enterprise', ip: '59.144.23.11', status: 'SUCCESS', details: 'Upgraded to Enterprise plan — $899/month' },
  { id: 'AL014', timestamp: daysAgo(1),   user: 'System',         userEmail: 'system@nexusai.internal',  action: 'BACKUP_COMPLETE',      resource: 'Database Backup',                     ip: 'SYSTEM',        status: 'SUCCESS', details: 'Daily backup completed — 2.4 GB encrypted and stored' },
  { id: 'AL015', timestamp: daysAgo(2),   user: 'Unknown',        userEmail: 'brute@malicious.net',      action: 'LOGIN_FAILED',         resource: 'Auth: Admin Portal',                  ip: '185.220.101.47',status: 'FAILED',  details: '5 failed login attempts — account locked and IP reported' },
]

export const fraudAlerts = [
  { id: 'FA001', severity: 'HIGH' as const,     type: 'Unusual API Volume',       user: 'Vikrant Joshi',   ip: '45.33.87.21', timestamp: hoursAgo(5),  description: '1,240 API calls in 10 minutes — 50x normal rate. Account flagged.' },
  { id: 'FA002', severity: 'CRITICAL' as const, type: 'Brute Force Attempt',      user: 'Unknown',         ip: '185.220.101.47', timestamp: daysAgo(2), description: '5 consecutive failed admin login attempts from Tor exit node.' },
  { id: 'FA003', severity: 'MEDIUM' as const,   type: 'Geo Anomaly',              user: 'Rohit Verma',     ip: '202.88.12.45', timestamp: hoursAgo(3), description: 'Login from Mumbai — account\'s usual location is Bangalore. Notified.' },
  { id: 'FA004', severity: 'LOW' as const,       type: 'Voice Limit Approaching', user: 'Divya Menon',     ip: 'SYSTEM',         timestamp: hoursAgo(6), description: 'Voice usage reached 97.5% of Growth plan limit. Account suspended.' },
  { id: 'FA005', severity: 'MEDIUM' as const,   type: 'Bulk Export Anomaly',      user: 'Riya Kapoor',     ip: '192.168.1.102', timestamp: minsAgo(12), description: 'Exported 45 leads in one batch — above normal export pattern.' },
]
