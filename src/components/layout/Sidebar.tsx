import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Radar, Users, Brain, Megaphone, PhoneCall,
  TrendingUp, Kanban, BarChart3, Link, Settings,
  Shield, UserCog, CreditCard, Volume2, Receipt, ScrollText,
  AlertTriangle, Activity, Sliders, ChevronLeft, ChevronRight,
  CheckCircle, X, Globe, Workflow, Radio
} from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { CallistoLogo } from '@/components/ui/CallistoLogo'

interface NavDef {
  to: string
  labelKey: string
  icon: React.ReactNode
  admin?: boolean
  badge?: string
}

const mainNavDefs: NavDef[] = [
  { to: '/',                    labelKey: 'nav.overview',           icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: '/pipeline-journey',    labelKey: 'nav.pipelineJourney',    icon: <Workflow className="w-4 h-4 text-amber-400" />, badge: 'E2E' },
  { to: '/business-onboarding', labelKey: 'nav.businessOnboarding', icon: <Globe className="w-4 h-4 text-sky-400" /> },
  { to: '/lead-discovery',      labelKey: 'nav.leadDiscovery',      icon: <Radar className="w-4 h-4" /> },
  { to: '/leads',               labelKey: 'nav.leads',              icon: <Users className="w-4 h-4" /> },
  { to: '/ai-qualification',    labelKey: 'nav.aiQualification',    icon: <Brain className="w-4 h-4" /> },
  { to: '/campaigns',           labelKey: 'nav.campaigns',          icon: <Megaphone className="w-4 h-4" /> },
  { to: '/ai-voice-agent',      labelKey: 'nav.aiVoiceAgent',       icon: <PhoneCall className="w-4 h-4 text-sky-400" /> },
  { to: '/call-history',        labelKey: 'nav.callHistory',        icon: <ScrollText className="w-4 h-4" /> },
  { to: '/market-intelligence', labelKey: 'nav.marketIntel',        icon: <TrendingUp className="w-4 h-4" /> },
  { to: '/pipeline',            labelKey: 'nav.pipeline',           icon: <Kanban className="w-4 h-4" /> },
  { to: '/analytics',           labelKey: 'nav.analytics',          icon: <BarChart3 className="w-4 h-4" /> },
  { to: '/crm',                 labelKey: 'nav.crm',                icon: <Link className="w-4 h-4" /> },
  { to: '/settings',            labelKey: 'nav.settings',           icon: <Settings className="w-4 h-4" /> },
]

const adminNavDefs: NavDef[] = [
  { to: '/admin',                   labelKey: 'nav.adminOverview',    icon: <Shield className="w-4 h-4" />,     admin: true },
  { to: '/admin/users',             labelKey: 'nav.users',            icon: <UserCog className="w-4 h-4" />,    admin: true },
  { to: '/admin/product-approvals', labelKey: 'nav.productApprovals', icon: <CheckCircle className="w-4 h-4" />, admin: true },
  { to: '/admin/subscriptions',     labelKey: 'nav.subscriptions',    icon: <CreditCard className="w-4 h-4" />, admin: true },
  { to: '/admin/voice-usage',       labelKey: 'nav.voiceUsage',       icon: <Volume2 className="w-4 h-4" />,    admin: true },
  { to: '/admin/billing',           labelKey: 'nav.billing',          icon: <Receipt className="w-4 h-4" />,    admin: true },
  { to: '/admin/audit-logs',        labelKey: 'nav.auditLogs',        icon: <ScrollText className="w-4 h-4" />, admin: true },
  { to: '/admin/fraud',             labelKey: 'nav.fraudDetection',   icon: <AlertTriangle className="w-4 h-4" />, admin: true },
  { to: '/admin/system',            labelKey: 'nav.systemMonitoring', icon: <Activity className="w-4 h-4" />,   admin: true },
  { to: '/admin/platform',          labelKey: 'nav.platformSettings', icon: <Sliders className="w-4 h-4" />,   admin: true },
]

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, mobileNavOpen, setMobileNavOpen, t } = useAppContext()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const location = useLocation()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col bg-bg-secondary/95 backdrop-blur-xl border-r border-bg-border/80 transition-all duration-200 z-30 h-full shrink-0 shadow-xl',
        sidebarCollapsed ? 'w-16' : 'w-[230px]'
      )}>
        {/* Brand Header with Callisto Crater Moon */}
        <div className="flex items-center gap-3 px-3.5 py-3.5 border-b border-bg-border/80 min-h-[52px]">
          <CallistoLogo size={28} showText={!sidebarCollapsed} />
        </div>

        {/* Telemetry Orbit Badge */}
        {!sidebarCollapsed && (
          <div className="mx-3 mt-2.5 px-2.5 py-1.5 rounded-lg bg-bg-card/70 border border-bg-border/60 flex items-center justify-between text-3xs font-mono">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Radio className="w-2.5 h-2.5 animate-pulse text-sky-400" />
              <span>ORBIT: JUPITER-IV</span>
            </span>
            <span className="text-emerald-400 font-bold">100% ONLINE</span>
          </div>
        )}

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto py-2.5 px-2 space-y-1 scrollbar-thin">
          {!sidebarCollapsed && (
            <div className="px-2 pt-1 pb-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-semibold">
                // Workspace Modules
              </span>
            </div>
          )}
          {mainNavDefs.map(item => (
            <NavItemRow
              key={item.to}
              item={item}
              label={t(item.labelKey)}
              collapsed={sidebarCollapsed}
              currentPath={location.pathname}
            />
          ))}

          {/* Admin nav — Restricted to ADMIN role per Zero-Trust RBAC */}
          {isAdmin && (
            <div className="mt-4 pt-3 border-t border-bg-border/70 space-y-1">
              {!sidebarCollapsed && (
                <div className="px-2 pb-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-sky-400/80 font-mono font-semibold">
                    // Mission Telemetry & Admin
                  </span>
                  <span className="text-3xs font-mono px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    ROOT
                  </span>
                </div>
              )}
              {adminNavDefs.map(item => (
                <NavItemRow
                  key={item.to}
                  item={item}
                  label={t(item.labelKey)}
                  collapsed={sidebarCollapsed}
                  currentPath={location.pathname}
                />
              ))}
            </div>
          )}
        </nav>

        {/* Telemetry & Activity Alert Message Bar at Bottom Left Corner */}
        <div className="border-t border-bg-border/80 bg-bg-panel/60 p-2 space-y-1.5" id="sidebar-activity-bar">
          {!sidebarCollapsed ? (
            <>
              <div className="px-2 py-1.5 rounded-lg bg-bg-card/80 border border-bg-border/70 flex items-center justify-between text-3xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span>ACTIVITY: NOMINAL</span>
                </span>
                <span className="text-sky-400 font-medium">0 ALERTS</span>
              </div>
              <div className="px-2 text-[10px] font-mono text-text-muted flex items-center justify-between">
                <span>SECURITY: TLS 1.3</span>
                <span className="text-amber-400/90 font-medium">IST +05:30</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-1" title="Telemetry Activity: All Systems Nominal">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center h-8 rounded-md hover:bg-bg-hover text-slate-400 hover:text-slate-100 transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Slide-out Panel */}
          <div className="relative w-76 max-w-[85vw] bg-bg-secondary/95 backdrop-blur-xl border-r border-bg-border h-full flex flex-col z-50 animate-slide-in-left shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-bg-border/80 min-h-[52px]">
              <CallistoLogo size={28} showText={true} />
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-bg-hover"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav list */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
              <div className="px-2 pb-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-semibold">
                  // Navigation
                </span>
              </div>
              {mainNavDefs.map(item => (
                <NavItemRow
                  key={item.to}
                  item={item}
                  label={t(item.labelKey)}
                  collapsed={false}
                  currentPath={location.pathname}
                  onClick={() => setMobileNavOpen(false)}
                />
              ))}

              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-bg-border/70 space-y-1">
                  <div className="px-2 pb-1 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-sky-400/80 font-mono font-semibold">
                      // Admin & Security
                    </span>
                    <span className="text-3xs font-mono px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      ROOT
                    </span>
                  </div>
                  {adminNavDefs.map(item => (
                    <NavItemRow
                      key={item.to}
                      item={item}
                      label={t(item.labelKey)}
                      collapsed={false}
                      currentPath={location.pathname}
                      onClick={() => setMobileNavOpen(false)}
                    />
                  ))}
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

function NavItemRow({ item, label, collapsed, currentPath, onClick }: {
  item: NavDef
  label: string
  collapsed: boolean
  currentPath: string
  onClick?: () => void
}) {
  const isActive = item.to === '/'
    ? currentPath === '/'
    : currentPath.startsWith(item.to)

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        'nav-item',
        isActive && 'active',
        item.admin && 'admin',
        item.admin && isActive && 'admin-active',
        collapsed ? 'justify-center px-0 h-10 w-10 mx-auto' : ''
      )}
    >
      <span className={cn('shrink-0 transition-transform', isActive && 'scale-105')}>
        {item.icon}
      </span>
      {!collapsed && (
        <span className="truncate flex-1 font-medium">{label}</span>
      )}
      {!collapsed && item.badge && (
        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
          {item.badge}
        </span>
      )}
    </NavLink>
  )
}
