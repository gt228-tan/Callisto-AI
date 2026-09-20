// Admin pages - all in one file for speed
import { useState } from 'react'
import { Shield, UserCog, CreditCard, Volume2, Receipt, ScrollText, AlertTriangle, Activity, Sliders, CheckCircle, XCircle, Clock, AlertOctagon, Download, FileText, Check, X, ExternalLink, Search, Sparkles, Filter } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { adminUsers, auditLogs, fraudAlerts, type AdminUser, type AuditLog } from '@/data/users'
import { formatDate, formatDateTime, formatDuration } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { exportToCSV } from '@/lib/exportCsv'
import { campaigns } from '@/data/campaigns'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      {payload.map((p: any) => (
        <div key={p.name} className="flex gap-2 text-xs">
          <span style={{ color: p.color ?? p.stroke }}>■</span>
          <span className="text-text-secondary">{p.name}</span>
          <span className="font-mono font-bold ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Admin Dashboard Overview
// ============================================================
export function AdminDashboard() {
  const activeUsers = adminUsers.filter(u => u.status === 'ACTIVE').length
  const totalVoice  = adminUsers.reduce((s, u) => s + u.voiceUsed, 0)
  const revenue     = (adminUsers.filter(u=>u.plan==='ENTERPRISE').length * 899 + adminUsers.filter(u=>u.plan==='GROWTH').length * 299 + adminUsers.filter(u=>u.plan==='STARTER').length * 99)

  const activityData = Array.from({length:30},(_,i)=>({ day:`${i+1}`, calls: Math.floor(Math.random()*200)+50, leads: Math.floor(Math.random()*100)+30 }))

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-blue-400 shrink-0" />
        <h1 className="text-sm font-bold text-text-primary">Admin Dashboard</h1>
        <span className="badge-blue">ADMIN</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <MetricCard label="Total Users"     value={adminUsers.length} delta={8.3} icon={<UserCog className="w-3.5 h-3.5" />} />
        <MetricCard label="Active Users"    value={activeUsers}       delta={5.1} accent />
        <MetricCard label="Monthly Revenue" value={`$${revenue}`}     delta={14.2} />
        <MetricCard label="Voice Used"      value={totalVoice}        unit="min"  />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="panel">
          <div className="section-header"><span className="section-title">Platform Activity (30 Days)</span></div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={activityData} margin={{top:5,right:5,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="gCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{fill:'#545f72',fontSize:9}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'#545f72',fontSize:9}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="calls" stroke="#3b82f6" fill="url(#gCalls)" strokeWidth={1.5} dot={false} name="Calls" />
                <Area type="monotone" dataKey="leads" stroke="#f59e0b" fill="url(#gLeads)" strokeWidth={1.5} dot={false} name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="section-header"><span className="section-title">Recent Fraud Alerts</span></div>
          <div className="divide-y divide-bg-border">
            {fraudAlerts.slice(0, 4).map(alert => (
              <div key={alert.id} className="flex items-start gap-3 px-3 py-2.5">
                <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'text-danger-bright' : alert.severity === 'MEDIUM' ? 'text-warning' : 'text-text-muted'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xs font-bold ${alert.severity === 'CRITICAL' ? 'text-danger-bright' : alert.severity === 'HIGH' ? 'text-warning' : 'text-text-muted'}`}>{alert.severity}</span>
                    <span className="text-xs text-text-primary">{alert.type}</span>
                  </div>
                  <div className="text-2xs text-text-muted">{alert.user} · {alert.ip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// User Management
// ============================================================
export function AdminUsers() {
  const { showToast } = useToast()
  const [users, setUsers] = useState(adminUsers)

  function toggleSuspend(id: string) {
    setUsers(prev => prev.map(u => u.id === id ? {...u, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'} : u))
    const u = users.find(u => u.id === id)
    showToast('info', u?.status === 'ACTIVE' ? 'User Suspended' : 'User Reactivated', u?.name ?? '')
  }

  const planColor = (p: string) => p === 'ENTERPRISE' ? 'badge-amber' : p === 'GROWTH' ? 'badge-blue' : 'badge'
  const statusColor = (s: string) => s === 'ACTIVE' ? 'badge-success' : s === 'SUSPENDED' ? 'badge-danger' : s === 'TRIAL' ? 'badge-amber' : 'badge'

  const columns: Column<AdminUser>[] = [
    { key: 'name',      header: 'User',    sortable: true, render: r => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xs font-bold text-amber-400">
          {r.name.charAt(0)}
        </div>
        <div><div className="text-xs font-medium text-text-primary">{r.name}</div><div className="text-2xs text-text-muted">{r.email}</div></div>
      </div>
    )},
    { key: 'company',   header: 'Company', render: r => <span className="text-text-secondary">{r.company}</span> },
    { key: 'role',      header: 'Role',    render: r => <span className="badge-blue">{r.role}</span> },
    { key: 'plan',      header: 'Plan',    render: r => <span className={planColor(r.plan)}>{r.plan}</span> },
    { key: 'status',    header: 'Status',  render: r => <span className={statusColor(r.status)}>{r.status}</span> },
    { key: 'voiceUsed', header: 'Voice', render: r => (
      <div><div className="text-xs font-mono text-text-primary">{r.voiceUsed}/{r.voiceLimit}</div>
      <div className="progress-track mt-0.5 w-16"><div className="progress-fill-amber" style={{width:`${(r.voiceUsed/r.voiceLimit)*100}%`}} /></div></div>
    )},
    { key: 'lastActive',header: 'Last Active', sortable: true, render: r => <span className="text-2xs text-text-muted font-mono">{formatDateTime(r.lastActive)}</span> },
    { key: 'actions',   header: '', render: r => (
      <div className="flex gap-1">
        <button onClick={e => { e.stopPropagation(); toggleSuspend(r.id) }}
          className={`text-2xs px-2 py-0.5 rounded border ${r.status === 'ACTIVE' ? 'border-danger/30 text-danger-bright hover:bg-danger-dim' : 'border-success/30 text-success hover:bg-success/10'}`}>
          {r.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
        </button>
      </div>
    )},
  ]

  function handleExportUsers() {
    exportToCSV('admin_users_export.csv', users, [
      { key: 'id', label: 'User ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'company', label: 'Company' },
      { key: 'role', label: 'Role' },
      { key: 'plan', label: 'Plan' },
      { key: 'status', label: 'Status' },
      { key: 'voiceUsed', label: 'Voice Used (mins)' },
      { key: 'voiceLimit', label: 'Voice Limit' },
      { key: 'apiCalls', label: 'API Calls' },
      { key: 'lastActive', label: 'Last Active' },
    ])
    showToast('success', 'Export Complete', `${users.length} user records exported to CSV`)
  }

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserCog className="w-4 h-4 text-blue-400 shrink-0" />
          <h1 className="text-sm font-bold text-text-primary">User Management</h1>
          <span className="badge-blue">ADMIN</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleExportUsers} className="btn-secondary text-xs gap-1.5 flex-1 sm:flex-initial justify-center">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => showToast('info','Invite Sent','User invite email sent')} className="btn-primary text-xs flex-1 sm:flex-initial justify-center">+ Invite User</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <MetricCard label="Total Users"    value={users.length} />
        <MetricCard label="Active"         value={users.filter(u=>u.status==='ACTIVE').length} accent />
        <MetricCard label="Trial"          value={users.filter(u=>u.status==='TRIAL').length} />
        <MetricCard label="Suspended"      value={users.filter(u=>u.status==='SUSPENDED').length} />
      </div>
      <div className="panel flex flex-col">
        <DataTable data={users} columns={columns} keyExtractor={r => r.id} pageSize={10} searchable searchPlaceholder="Search users..." searchKeys={['name','email','company','role','plan']} />
      </div>
    </div>
  )
}

// ============================================================
// Audit Logs
// ============================================================
export function AdminAuditLogs() {
  const { showToast } = useToast()
  const statusIcon = (s: string) => s === 'SUCCESS' ? <CheckCircle className="w-3 h-3 text-success" /> : s === 'FAILED' ? <XCircle className="w-3 h-3 text-danger-bright" /> : <AlertOctagon className="w-3 h-3 text-warning" />

  function handleExportAuditLogs() {
    exportToCSV('audit_logs.csv', auditLogs, [
      { key: 'id', label: 'Log ID' },
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'user', label: 'User' },
      { key: 'userEmail', label: 'User Email' },
      { key: 'action', label: 'Action' },
      { key: 'resource', label: 'Resource' },
      { key: 'ip', label: 'IP Address' },
      { key: 'status', label: 'Status' },
      { key: 'details', label: 'Details' },
    ])
    showToast('success', 'Export Complete', `${auditLogs.length} audit log entries exported to CSV`)
  }

  const columns: Column<AuditLog>[] = [
    { key: 'timestamp', header: 'Timestamp', sortable: true, render: r => <span className="text-2xs font-mono text-text-muted">{formatDateTime(r.timestamp)}</span> },
    { key: 'user',      header: 'User',      render: r => <div><div className="text-xs text-text-primary">{r.user}</div><div className="text-2xs text-text-muted">{r.userEmail}</div></div> },
    { key: 'action',    header: 'Action',    render: r => <span className="font-mono text-2xs text-amber-400">{r.action}</span> },
    { key: 'resource',  header: 'Resource',  render: r => <span className="text-xs text-text-secondary">{r.resource}</span> },
    { key: 'ip',        header: 'IP',        render: r => <span className="font-mono text-2xs text-text-muted">{r.ip}</span> },
    { key: 'status',    header: 'Status',    render: r => <div className="flex items-center gap-1">{statusIcon(r.status)}<span className={`text-2xs ${r.status === 'SUCCESS' ? 'text-success' : r.status === 'FAILED' ? 'text-danger-bright' : 'text-warning'}`}>{r.status}</span></div> },
    { key: 'details',   header: 'Details',   render: r => <span className="text-2xs text-text-muted">{r.details}</span> },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-blue-400" />
          <h1 className="text-sm font-bold text-text-primary">Audit Logs</h1>
          <span className="badge-blue">ADMIN</span>
        </div>
        <button onClick={handleExportAuditLogs} className="btn-secondary text-xs gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      <div className="panel flex flex-col">
        <DataTable data={auditLogs} columns={columns} keyExtractor={r => r.id} pageSize={15} searchable searchPlaceholder="Search logs..." searchKeys={['user','action','resource','ip']} />
      </div>
    </div>
  )
}

// ============================================================
// Fraud Detection
// ============================================================
export function AdminFraud() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-blue-400" />
        <h1 className="text-sm font-bold text-text-primary">Fraud Detection</h1>
        <span className="badge-blue">ADMIN</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Critical Alerts" value={fraudAlerts.filter(f=>f.severity==='CRITICAL').length} />
        <MetricCard label="High Alerts"     value={fraudAlerts.filter(f=>f.severity==='HIGH').length} accent />
        <MetricCard label="Medium Alerts"   value={fraudAlerts.filter(f=>f.severity==='MEDIUM').length} />
        <MetricCard label="Resolved Today"  value={12} />
      </div>

      <div className="panel">
        <div className="section-header"><span className="section-title">Active Fraud Alerts</span></div>
        <div className="divide-y divide-bg-border">
          {fraudAlerts.map(alert => (
            <div key={alert.id} className={`px-4 py-3 hover:bg-bg-hover transition-colors ${alert.severity === 'CRITICAL' ? 'border-l-2 border-danger' : alert.severity === 'HIGH' ? 'border-l-2 border-warning' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${alert.severity === 'CRITICAL' ? 'text-danger-bright' : alert.severity === 'HIGH' ? 'text-warning' : 'text-text-muted'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xs font-bold ${alert.severity === 'CRITICAL' ? 'text-danger-bright' : alert.severity === 'HIGH' ? 'text-warning' : alert.severity === 'MEDIUM' ? 'text-amber-400' : 'text-text-muted'}`}>{alert.severity}</span>
                      <span className="text-xs font-semibold text-text-primary">{alert.type}</span>
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">{alert.description}</div>
                    <div className="text-2xs text-text-muted mt-1">User: {alert.user} · IP: {alert.ip} · {formatDateTime(alert.timestamp)}</div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="btn-secondary text-2xs py-1">Investigate</button>
                  <button className="btn-primary text-2xs py-1">Resolve</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// System Monitoring
// ============================================================
export function AdminSystem() {
  const systemMetrics = [
    { label: 'API Gateway',    status: 'UP', latency: '28ms', uptime: '99.97%' },
    { label: 'AI Engine',      status: 'UP', latency: '145ms', uptime: '99.89%' },
    { label: 'Voice Service',  status: 'UP', latency: '62ms',  uptime: '99.95%' },
    { label: 'Database',       status: 'UP', latency: '8ms',   uptime: '99.99%' },
    { label: 'CRM Connector',  status: 'UP', latency: '92ms',  uptime: '99.81%' },
    { label: 'Email Service',  status: 'DEGRADED', latency: '840ms', uptime: '98.14%' },
    { label: 'Webhook Worker', status: 'UP', latency: '18ms',  uptime: '99.93%' },
    { label: 'Scheduler',      status: 'UP', latency: '5ms',   uptime: '100%' },
  ]

  const perfData = Array.from({length:24},(_,i)=>({
    h: `${i}h`,
    cpu: Math.floor(Math.random()*30)+20,
    memory: Math.floor(Math.random()*20)+50,
    rps: Math.floor(Math.random()*500)+200,
  }))

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-blue-400" />
        <h1 className="text-sm font-bold text-text-primary">System Monitoring</h1>
        <span className="badge-blue">ADMIN</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Services Online"  value="7/8"   accent />
        <MetricCard label="Avg Latency"      value="52ms"  />
        <MetricCard label="Requests/min"     value={3842}  />
        <MetricCard label="System Uptime"    value="99.93%" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="panel">
          <div className="section-header"><span className="section-title">Service Health</span></div>
          <div className="divide-y divide-bg-border">
            {systemMetrics.map(m => (
              <div key={m.label} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${m.status === 'UP' ? 'bg-success' : 'bg-warning'} ${m.status === 'UP' ? 'animate-pulse' : ''}`} />
                  <span className="text-xs text-text-primary">{m.label}</span>
                </div>
                <div className="flex items-center gap-4 text-2xs text-text-muted">
                  <span className="font-mono">{m.latency}</span>
                  <span className={m.status === 'UP' ? 'text-success' : 'text-warning'}>{m.uptime}</span>
                  <span className={`badge ${m.status === 'UP' ? 'badge-success' : 'badge-amber'}`}>{m.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-header"><span className="section-title">CPU & Memory (24h)</span></div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={perfData} margin={{top:5,right:5,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="gCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="h" tick={{fill:'#545f72',fontSize:9}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'#545f72',fontSize:9}} axisLine={false} tickLine={false} domain={[0,100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cpu"    stroke="#f59e0b" fill="url(#gCpu)" strokeWidth={1.5} dot={false} name="CPU %" />
                <Area type="monotone" dataKey="memory" stroke="#3b82f6" fill="url(#gMem)" strokeWidth={1.5} dot={false} name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Voice Usage
// ============================================================
export function AdminVoiceUsage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-blue-400" />
        <h1 className="text-sm font-bold text-text-primary">Voice Usage</h1>
        <span className="badge-blue">ADMIN</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total Minutes"  value={adminUsers.reduce((s,u)=>s+u.voiceUsed,0)} unit="min" />
        <MetricCard label="Total Capacity" value={adminUsers.reduce((s,u)=>s+u.voiceLimit,0)} unit="min" />
        <MetricCard label="Active Users"   value={adminUsers.filter(u=>u.voiceUsed>0).length} />
        <MetricCard label="Usage Rate"     value={`${Math.round(adminUsers.reduce((s,u)=>s+u.voiceUsed,0)/adminUsers.reduce((s,u)=>s+u.voiceLimit,0)*100)}%`} />
      </div>
      <div className="panel">
        <div className="section-header"><span className="section-title">Voice Usage by User</span></div>
        <div className="divide-y divide-bg-border">
          {[...adminUsers].sort((a,b) => b.voiceUsed - a.voiceUsed).map(u => (
            <div key={u.id} className="flex items-center gap-4 px-4 py-2.5">
              <div className="w-36 shrink-0"><div className="text-xs text-text-primary">{u.name}</div><div className="text-2xs text-text-muted">{u.company}</div></div>
              <div className="flex-1"><div className="progress-track"><div className="progress-fill-amber" style={{width:`${(u.voiceUsed/u.voiceLimit)*100}%`}} /></div></div>
              <div className="text-xs font-mono text-text-primary shrink-0 w-24 text-right">{u.voiceUsed}/{u.voiceLimit} min</div>
              <div className={`text-2xs font-semibold shrink-0 w-10 text-right ${(u.voiceUsed/u.voiceLimit) > 0.9 ? 'text-danger-bright' : 'text-text-muted'}`}>
                {Math.round((u.voiceUsed/u.voiceLimit)*100)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Subscriptions
// ============================================================
export function AdminSubscriptions() {
  const { showToast } = useToast()
  const plans = [
    { name: 'Starter', price: 99, count: adminUsers.filter(u=>u.plan==='STARTER').length, color: 'text-text-muted', leads: 500, voice: 500 },
    { name: 'Growth',  price: 299, count: adminUsers.filter(u=>u.plan==='GROWTH').length, color: 'text-info-bright', leads: 5000, voice: 2000 },
    { name: 'Enterprise', price: 899, count: adminUsers.filter(u=>u.plan==='ENTERPRISE').length, color: 'text-amber-400', leads: 50000, voice: 10000 },
  ]
  const monthlyRevenue = plans.reduce((s, p) => s + p.price * p.count, 0)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-blue-400" />
        <h1 className="text-sm font-bold text-text-primary">Subscriptions</h1>
        <span className="badge-blue">ADMIN</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Monthly Revenue" value={`$${monthlyRevenue}`} delta={14.2} accent />
        <MetricCard label="Total Subscribers" value={adminUsers.length} />
        <MetricCard label="ARR" value={`$${(monthlyRevenue * 12).toLocaleString()}`} />
        <MetricCard label="Churn Rate" value="2.1%" delta={-0.3} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {plans.map(plan => (
          <div key={plan.name} className="panel p-5">
            <div className={`text-lg font-bold ${plan.color}`}>{plan.name}</div>
            <div className="text-3xl font-bold text-text-primary mt-1">${plan.price}<span className="text-sm text-text-muted">/mo</span></div>
            <div className="text-sm text-text-muted mt-2">{plan.count} subscribers</div>
            <div className="text-sm font-bold text-text-primary mt-1">${(plan.price * plan.count).toLocaleString()}/mo</div>
            <div className="mt-3 space-y-1 text-xs text-text-muted">
              <div>Leads: {plan.leads.toLocaleString()}</div>
              <div>Voice Minutes: {plan.voice.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Billing
// ============================================================
export function AdminBilling() {
  const invoices = [
    { id: 'INV-2026-009', date: new Date(), amount: 3281, status: 'PAID' },
    { id: 'INV-2026-008', date: new Date(Date.now()-30*86400000), amount: 2982, status: 'PAID' },
    { id: 'INV-2026-007', date: new Date(Date.now()-60*86400000), amount: 2588, status: 'PAID' },
    { id: 'INV-2026-006', date: new Date(Date.now()-90*86400000), amount: 2191, status: 'PAID' },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Receipt className="w-4 h-4 text-blue-400" />
        <h1 className="text-sm font-bold text-text-primary">Billing</h1>
        <span className="badge-blue">ADMIN</span>
      </div>
      <div className="panel">
        <div className="section-header"><span className="section-title">Invoice History</span></div>
        <table className="data-table w-full">
          <thead><tr><th>Invoice ID</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td><span className="font-mono text-text-primary">{inv.id}</span></td>
                <td><span className="text-text-secondary">{formatDate(inv.date)}</span></td>
                <td><span className="font-mono font-bold text-text-primary">${inv.amount.toLocaleString()}</span></td>
                <td><span className="badge-success">{inv.status}</span></td>
                <td><button className="btn-ghost text-2xs">Download PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// Platform Settings
// ============================================================
export function AdminPlatformSettings() {
  const { showToast } = useToast()
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sliders className="w-4 h-4 text-blue-400" />
        <h1 className="text-sm font-bold text-text-primary">Platform Settings</h1>
        <span className="badge-blue">ADMIN</span>
      </div>
      <div className="panel p-6 space-y-5">
        {[
          { section: 'Global AI Settings', items: [
            {l:'Default discovery frequency', type:'select', opts:['Every hour','Every 6 hours','Daily']},
            {l:'Min AI intent score to flag HIGH', type:'range', val:80},
            {l:'Auto-enrich new leads', type:'toggle', val:true},
          ]},
          { section: 'Voice Infrastructure', items: [
            {l:'Default voice speed', type:'select', opts:['0.85x','1.0x','1.1x']},
            {l:'Max concurrent calls per tenant', type:'input', val:'50'},
            {l:'Recording retention (days)', type:'input', val:'90'},
          ]},
          { section: 'Security', items: [
            {l:'Force 2FA for all admin users', type:'toggle', val:true},
            {l:'Session timeout (minutes)', type:'input', val:'120'},
            {l:'IP allowlist enabled', type:'toggle', val:false},
          ]},
        ].map(section => (
          <div key={section.section}>
            <div className="text-xs font-semibold text-text-primary mb-3 border-b border-bg-border pb-2">{section.section}</div>
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between max-w-lg">
                  <label className="text-xs text-text-secondary">{item.l}</label>
                  {item.type === 'toggle' && (
                    <div className={`w-10 h-5 rounded-full cursor-pointer relative ${item.val ? 'bg-amber-500' : 'bg-bg-border'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-all ${item.val ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  )}
                  {item.type === 'select' && (
                    <select className="input w-36 text-xs">{(item as any).opts.map((o: string) => <option key={o}>{o}</option>)}</select>
                  )}
                  {item.type === 'range' && (
                    <div className="flex items-center gap-2">
                      <input type="range" min={50} max={99} defaultValue={(item as any).val} className="accent-amber-500 w-24" />
                      <span className="text-xs text-amber-400 font-mono w-6">{(item as any).val}</span>
                    </div>
                  )}
                  {item.type === 'input' && (
                    <input className="input w-24 text-xs" defaultValue={(item as any).val} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={() => showToast('success','Settings Saved','Platform settings updated')} className="btn-primary text-xs">Save Platform Settings</button>
      </div>
    </div>
  )
}

// ============================================================
// Product AI Suitability Approvals (User Journey Step 6)
// ============================================================
export interface ProductApprovalItem {
  id: string
  company: string
  productName: string
  industry: string
  category: string
  submittedAt: Date
  suitabilityScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  riskFlags: string[]
  catalogDoc: string
  description: string
  targetMarket: string
  reviewerNotes?: string
}

const initialProductApprovals: ProductApprovalItem[] = [
  {
    id: 'PRD-101',
    company: 'FinTech Matrix Labs',
    productName: 'Algorithmic Crypto Trading Bot',
    industry: 'Financial Technology',
    category: 'SaaS Software',
    submittedAt: new Date(Date.now() - 3 * 3600000),
    suitabilityScore: 48,
    riskLevel: 'HIGH',
    status: 'PENDING',
    riskFlags: ['High-risk financial investment solicitation', 'SEC/regulatory compliance disclaimer required', 'Price guarantee assertions'],
    catalogDoc: 'Matrix_Crypto_Bot_Whitepaper_v2.pdf',
    description: 'Autonomous trading algorithms offering high-yield liquidity management for retail and hedge funds.',
    targetMarket: 'Retail traders, Family offices, Crypto investment funds',
    reviewerNotes: 'Automated scan flagged potential financial non-compliance. Human compliance sign-off required before AI calling allowed.',
  },
  {
    id: 'PRD-102',
    company: 'BioHealth Analytics',
    productName: 'AI Radiology Diagnostic Assist',
    industry: 'Healthcare & Life Sciences',
    category: 'Medical Device Software',
    submittedAt: new Date(Date.now() - 14 * 3600000),
    suitabilityScore: 64,
    riskLevel: 'MEDIUM',
    status: 'PENDING',
    riskFlags: ['Requires HIPAA compliance disclosure', 'Must clarify non-diagnostic assistive nature'],
    catalogDoc: 'BioHealth_Clinical_Brochure.pdf',
    description: 'Deep learning imaging pipeline aiding hospital radiologists in CT scan anomaly triage.',
    targetMarket: 'Hospital networks, Private diagnostic clinics, Radiology labs',
    reviewerNotes: 'Inconclusive rating due to medical claims. Approved pending script constraint that AI Voice Agent states it is for physician triage only.',
  },
  {
    id: 'PRD-103',
    company: 'Acme Digital Solutions',
    productName: 'Enterprise Cloud Migration Suite',
    industry: 'IT & Cloud Services',
    category: 'Consulting & Implementation',
    submittedAt: new Date(Date.now() - 28 * 3600000),
    suitabilityScore: 95,
    riskLevel: 'LOW',
    status: 'APPROVED',
    riskFlags: ['None - standard B2B enterprise service'],
    catalogDoc: 'Acme_Cloud_Migration_Framework.pdf',
    description: 'End-to-end workload migration from on-premise VMware to AWS and Microsoft Azure.',
    targetMarket: 'Mid-market to Enterprise CTOs, Heads of Infrastructure',
    reviewerNotes: 'Fully compliant with autonomous outbound B2B voice selling guidelines.',
  },
  {
    id: 'PRD-104',
    company: 'Callisto Software Group',
    productName: 'B2B Customer Support AI Voicebot',
    industry: 'Enterprise SaaS',
    category: 'Customer Experience Software',
    submittedAt: new Date(Date.now() - 48 * 3600000),
    suitabilityScore: 98,
    riskLevel: 'LOW',
    status: 'APPROVED',
    riskFlags: ['None - standard customer support product'],
    catalogDoc: 'Callisto_Voice_Spec_Sheet.pdf',
    description: 'Voice AI agents that handle Tier-1 incoming support queries and CRM ticket logging.',
    targetMarket: 'E-commerce, Telecom, SaaS support directors',
    reviewerNotes: 'Approved for automated voice outreach across all global regions.',
  },
  {
    id: 'PRD-105',
    company: 'Apex Capital Partners',
    productName: 'Pre-IPO Secondary Share Syndication',
    industry: 'Investment Banking',
    category: 'Financial Securities',
    submittedAt: new Date(Date.now() - 72 * 3600000),
    suitabilityScore: 32,
    riskLevel: 'HIGH',
    status: 'REJECTED',
    riskFlags: ['Strict securities solicitation rules (SEC Reg D)', 'Unaccredited investor risk', 'Prohibited for automated cold voice solicitation'],
    catalogDoc: 'Apex_Secondary_Offering_Memo.pdf',
    description: 'Cold outreach offering shares in late-stage private unicorns to high-net-worth individuals.',
    targetMarket: 'HNIs and family office investment managers',
    reviewerNotes: 'Rejected. Violates telemarketing and financial securities compliance guidelines for autonomous cold calling.',
  },
]

export function AdminProductApprovals() {
  const { showToast } = useToast()
  const [items, setItems] = useState<ProductApprovalItem[]>(initialProductApprovals)
  const [selectedItem, setSelectedItem] = useState<ProductApprovalItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = items.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
    if (searchQuery && !item.productName.toLowerCase().includes(searchQuery.toLowerCase()) && !item.company.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const pendingCount = items.filter(i => i.status === 'PENDING').length
  const approvedCount = items.filter(i => i.status === 'APPROVED').length
  const rejectedCount = items.filter(i => i.status === 'REJECTED').length

  function handleAction(id: string, newStatus: 'APPROVED' | 'REJECTED', notes?: string) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus, reviewerNotes: notes || item.reviewerNotes } : item))
    const item = items.find(i => i.id === id)
    if (newStatus === 'APPROVED') {
      showToast('success', 'Product Approved for AI Selling', `${item?.productName} by ${item?.company} is now active for AI voice campaigns`)
    } else {
      showToast('error', 'Product Disqualified / Rejected', `${item?.productName} has been restricted from AI voice selling`)
    }
    if (selectedItem?.id === id) {
      setSelectedItem(null)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-amber-400" />
          <h1 className="text-sm font-bold text-text-primary">Product AI Suitability Approvals</h1>
          <span className="badge-blue">JOURNEY STEP 6</span>
        </div>
        <div className="text-2xs text-text-muted">
          AI Validation Engine: <span className="text-success font-medium">Active (Automated Risk Scoring)</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Pending Approvals" value={pendingCount} accent icon={<Clock className="w-3.5 h-3.5" />} />
        <MetricCard label="Approved for AI"    value={approvedCount} delta={12.5} icon={<CheckCircle className="w-3.5 h-3.5" />} />
        <MetricCard label="Restricted / Disqualified" value={rejectedCount} icon={<XCircle className="w-3.5 h-3.5" />} />
        <MetricCard label="Avg Review Time"   value="1.4h" />
      </div>

      {/* Filter and Search Bar */}
      <div className="panel p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${statusFilter === tab ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}`}
            >
              {tab === 'ALL' ? 'All Submissions' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              {tab === 'PENDING' && pendingCount > 0 && (
                <span className="ml-1.5 px-1 py-0.2 rounded-full text-2xs bg-amber-500/30 text-amber-300 font-mono">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company or product..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input pl-8 text-xs w-64"
          />
        </div>
      </div>

      {/* Review Table */}
      <div className="panel overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Company & Product</th>
              <th>Industry / Category</th>
              <th>AI Suitability</th>
              <th>Risk Assessment</th>
              <th>Catalog Doc</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-bg-hover transition-colors">
                <td>
                  <div>
                    <div className="font-semibold text-text-primary flex items-center gap-1.5">
                      {item.productName}
                    </div>
                    <div className="text-2xs text-text-muted">{item.company} · ID: {item.id}</div>
                  </div>
                </td>
                <td>
                  <div className="text-text-secondary text-xs">{item.industry}</div>
                  <div className="text-2xs text-text-muted">{item.category}</div>
                </td>
                <td>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${item.suitabilityScore >= 80 ? 'text-success' : item.suitabilityScore >= 60 ? 'text-warning' : 'text-danger-bright'}`}>
                        {item.suitabilityScore}%
                      </span>
                      <span className="text-2xs text-text-muted">viable</span>
                    </div>
                    <div className="progress-track w-24">
                      <div
                        className={item.suitabilityScore >= 80 ? 'progress-fill-success' : item.suitabilityScore >= 60 ? 'progress-fill-amber' : 'bg-red-500 h-full rounded'}
                        style={{ width: `${item.suitabilityScore}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="space-y-0.5 max-w-xs">
                    <span className={`badge text-2xs ${item.riskLevel === 'LOW' ? 'badge-success' : item.riskLevel === 'MEDIUM' ? 'badge-amber' : 'badge-danger'}`}>
                      {item.riskLevel} RISK
                    </span>
                    <div className="text-2xs text-text-muted truncate" title={item.riskFlags.join(', ')}>
                      {item.riskFlags[0]}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="flex items-center gap-1 text-2xs text-amber-400 font-mono hover:underline cursor-pointer">
                    <FileText className="w-3 h-3" /> {item.catalogDoc}
                  </span>
                </td>
                <td>
                  {item.status === 'APPROVED' && <span className="badge-success">APPROVED</span>}
                  {item.status === 'PENDING' && <span className="badge-amber animate-pulse">PENDING REVIEW</span>}
                  {item.status === 'REJECTED' && <span className="badge-danger">RESTRICTED</span>}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="btn-ghost text-2xs"
                    >
                      Review Details
                    </button>
                    {item.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleAction(item.id, 'APPROVED')}
                          className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded text-2xs font-semibold transition-colors flex items-center gap-1"
                          title="Approve for AI Voice Selling"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(item.id, 'REJECTED')}
                          className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded text-2xs font-semibold transition-colors flex items-center gap-1"
                          title="Reject / Restrict"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Review Modal / Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel max-w-xl w-full p-6 space-y-4 border border-amber-500/30 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-bg-border pb-3">
              <div>
                <div className="text-base font-bold text-text-primary">{selectedItem.productName}</div>
                <div className="text-xs text-text-muted">{selectedItem.company} · Submitted {formatDateTime(selectedItem.submittedAt)}</div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-bg-card rounded border border-bg-border">
                <div className="text-text-muted text-2xs uppercase">AI Viability Score</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">{selectedItem.suitabilityScore}%</div>
                <div className="text-2xs text-text-secondary mt-1">Autonomous selling suitability</div>
              </div>
              <div className="p-3 bg-bg-card rounded border border-bg-border">
                <div className="text-text-muted text-2xs uppercase">Risk Classification</div>
                <div className={`text-base font-bold mt-1 ${selectedItem.riskLevel === 'LOW' ? 'text-success' : selectedItem.riskLevel === 'MEDIUM' ? 'text-warning' : 'text-danger-bright'}`}>
                  {selectedItem.riskLevel} RISK
                </div>
                <div className="text-2xs text-text-secondary mt-1">{selectedItem.riskFlags.length} flagged compliance signal(s)</div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-2xs text-text-muted uppercase font-bold block mb-1">Product Description</label>
                <div className="p-2.5 bg-bg-card rounded text-text-secondary">{selectedItem.description}</div>
              </div>

              <div>
                <label className="text-2xs text-text-muted uppercase font-bold block mb-1">Target Market & Audience</label>
                <div className="p-2.5 bg-bg-card rounded text-text-secondary">{selectedItem.targetMarket}</div>
              </div>

              <div>
                <label className="text-2xs text-text-muted uppercase font-bold block mb-1">Automated AI Risk Signals</label>
                <div className="space-y-1">
                  {selectedItem.riskFlags.map((flag, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-300 text-2xs">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-2xs text-text-muted uppercase font-bold block mb-1">Uploaded Business Catalog Document</label>
                <div className="flex items-center justify-between p-2.5 bg-bg-card border border-bg-border rounded">
                  <span className="flex items-center gap-2 text-text-primary font-mono text-xs">
                    <FileText className="w-4 h-4 text-amber-400" />
                    {selectedItem.catalogDoc}
                  </span>
                  <button className="btn-ghost text-2xs flex items-center gap-1">
                    <Download className="w-3 h-3" /> Preview Document
                  </button>
                </div>
              </div>

              <div>
                <label className="text-2xs text-text-muted uppercase font-bold block mb-1">Reviewer Governance Notes</label>
                <div className="p-2.5 bg-bg-card rounded text-text-secondary italic">
                  "{selectedItem.reviewerNotes}"
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-bg-border">
              <span className="text-2xs text-text-muted">User Journey Step 6: Product AI Suitability Validation</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="btn-secondary text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => handleAction(selectedItem.id, 'REJECTED')}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded text-xs font-semibold"
                >
                  Restrict / Reject
                </button>
                <button
                  onClick={() => handleAction(selectedItem.id, 'APPROVED')}
                  className="btn-primary text-xs"
                >
                  Approve for AI Outreach
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
