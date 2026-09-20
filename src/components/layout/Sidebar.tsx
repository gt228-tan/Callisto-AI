import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Radar, Users, Brain, Megaphone, PhoneCall,
  TrendingUp, Kanban, BarChart3, Link, Settings,
  Shield, UserCog, CreditCard, Volume2, Receipt, ScrollText,
  AlertTriangle, Activity, Sliders, ChevronLeft, ChevronRight,
  Sparkles, CheckCircle, X, Globe, Workflow
} from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { cn } from '@/lib/utils'

interface NavDef {
  to: string
  labelKey: string
  icon: React.ReactNode
  admin?: boolean
  badge?: string
}

const mainNavDefs: NavDef[] = [
  { to: '/',                    labelKey: 'nav.overview',           icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { to: '/pipeline-journey',    labelKey: 'nav.pipelineJourney',    icon: <Workflow className="w-3.5 h-3.5 text-amber-400" />, badge: 'E2E' },
  { to: '/business-onboarding', labelKey: 'nav.businessOnboarding', icon: <Globe className="w-3.5 h-3.5 text-blue-400" /> },
  { to: '/lead-discovery',      labelKey: 'nav.leadDiscovery',      icon: <Radar className="w-3.5 h-3.5" /> },
  { to: '/leads',               labelKey: 'nav.leads',              icon: <Users className="w-3.5 h-3.5" /> },
  { to: '/ai-qualification',    labelKey: 'nav.aiQualification',    icon: <Brain className="w-3.5 h-3.5" /> },
  { to: '/campaigns',           labelKey: 'nav.campaigns',          icon: <Megaphone className="w-3.5 h-3.5" /> },
  { to: '/ai-voice-agent',      labelKey: 'nav.aiVoiceAgent',       icon: <PhoneCall className="w-3.5 h-3.5 text-amber-400" /> },
  { to: '/call-history',        labelKey: 'nav.callHistory',        icon: <ScrollText className="w-3.5 h-3.5" /> },
  { to: '/market-intelligence', labelKey: 'nav.marketIntel',        icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { to: '/pipeline',            labelKey: 'nav.pipeline',           icon: <Kanban className="w-3.5 h-3.5" /> },
  { to: '/analytics',           labelKey: 'nav.analytics',          icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { to: '/crm',                 labelKey: 'nav.crm',                icon: <Link className="w-3.5 h-3.5" /> },
  { to: '/settings',            labelKey: 'nav.settings',           icon: <Settings className="w-3.5 h-3.5" /> },
]

const adminNavDefs: NavDef[] = [
  { to: '/admin',                   labelKey: 'nav.adminOverview',    icon: <Shield className="w-3.5 h-3.5" />,     admin: true },
  { to: '/admin/users',             labelKey: 'nav.users',            icon: <UserCog className="w-3.5 h-3.5" />,    admin: true },
  { to: '/admin/product-approvals', labelKey: 'nav.productApprovals', icon: <CheckCircle className="w-3.5 h-3.5" />, admin: true },
  { to: '/admin/subscriptions',     labelKey: 'nav.subscriptions',    icon: <CreditCard className="w-3.5 h-3.5" />, admin: true },
  { to: '/admin/voice-usage',       labelKey: 'nav.voiceUsage',       icon: <Volume2 className="w-3.5 h-3.5" />,    admin: true },
  { to: '/admin/billing',           labelKey: 'nav.billing',          icon: <Receipt className="w-3.5 h-3.5" />,    admin: true },
  { to: '/admin/audit-logs',        labelKey: 'nav.auditLogs',        icon: <ScrollText className="w-3.5 h-3.5" />, admin: true },
  { to: '/admin/fraud',             labelKey: 'nav.fraudDetection',   icon: <AlertTriangle className="w-3.5 h-3.5" />, admin: true },
  { to: '/admin/system',            labelKey: 'nav.systemMonitoring', icon: <Activity className="w-3.5 h-3.5" />,   admin: true },
  { to: '/admin/platform',          labelKey: 'nav.platformSettings', icon: <Sliders className="w-3.5 h-3.5" />,   admin: true },
]

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, mobileNavOpen, setMobileNavOpen, t } = useAppContext()
  const location = useLocation()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col bg-bg-secondary border-r border-bg-border transition-all duration-200 z-30 h-full shrink-0',
        sidebarCollapsed ? 'w-14' : 'w-[220px]'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 py-3 border-b border-bg-border min-h-[48px]">
          <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-text-primary leading-tight">Callisto AI</span>
              <span className="text-2xs text-text-muted leading-tight">Sales Intelligence</span>
            </div>
          )}
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {/* Main nav */}
          {!sidebarCollapsed && (
            <div className="px-3 py-1">
              <span className="text-2xs uppercase tracking-widest text-text-muted font-medium">{t('nav.workspace', 'Workspace')}</span>
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

          {/* Admin nav */}
          <div className={cn('mt-3 pt-2 border-t border-bg-border')}>
            {!sidebarCollapsed && (
              <div className="px-3 py-1">
                <span className="text-2xs uppercase tracking-widest text-blue-400/70 font-medium">{t('nav.admin', 'Admin')}</span>
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
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex items-center justify-center h-9 border-t border-bg-border hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Slide-out Panel */}
          <div className="relative w-72 max-w-[82vw] bg-bg-secondary border-r border-bg-border h-full flex flex-col z-50 animate-slide-in-left shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-bg-border min-h-[52px]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-primary leading-tight">Callisto AI</span>
                  <span className="text-2xs text-text-muted leading-tight">Sales Intelligence</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
              <div className="px-3 py-1 mb-1">
                <span className="text-2xs uppercase tracking-widest text-text-muted font-semibold">{t('nav.workspace', 'Workspace')}</span>
              </div>
              {mainNavDefs.map(item => (
                <NavItemRow
                  key={item.to}
                  item={item}
                  label={t(item.labelKey)}
                  collapsed={false}
                  currentPath={location.pathname}
                  onItemClick={() => setMobileNavOpen(false)}
                />
              ))}

              <div className="mt-4 pt-3 border-t border-bg-border">
                <div className="px-3 py-1 mb-1">
                  <span className="text-2xs uppercase tracking-widest text-blue-400 font-semibold">{t('nav.admin', 'Admin')}</span>
                </div>
                {adminNavDefs.map(item => (
                  <NavItemRow
                    key={item.to}
                    item={item}
                    label={t(item.labelKey)}
                    collapsed={false}
                    currentPath={location.pathname}
                    onItemClick={() => setMobileNavOpen(false)}
                  />
                ))}
              </div>
            </nav>

            {/* User Info Card in Drawer */}
            <div className="p-3 border-t border-bg-border bg-bg-card/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xs font-bold text-amber-400 shrink-0">
                  TM
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-text-primary truncate">Tanishq Mehta</span>
                  <span className="text-2xs text-text-muted truncate">Admin · Enterprise</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NavItemRow({
  item,
  label,
  collapsed,
  currentPath,
  onItemClick,
}: {
  item: NavDef
  label: string
  collapsed: boolean
  currentPath: string
  onItemClick?: () => void
}) {
  const isActive = item.to === '/'
    ? currentPath === '/'
    : currentPath.startsWith(item.to)

  const baseClass = item.admin
    ? cn('nav-item admin py-2 sm:py-1.5', isActive && 'active', collapsed && 'justify-center px-0 mx-2')
    : cn('nav-item py-2 sm:py-1.5', isActive && 'active', collapsed && 'justify-center px-0 mx-2')

  return (
    <NavLink
      to={item.to}
      className={baseClass}
      title={collapsed ? label : undefined}
      onClick={onItemClick}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate text-xs">{label}</span>}
      {!collapsed && item.badge && (
        <span className="ml-auto px-1.5 py-0.2 rounded text-3xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          {item.badge}
        </span>
      )}
      {!collapsed && isActive && item.admin && !item.badge && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
      )}
      {!collapsed && isActive && !item.admin && !item.badge && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}
    </NavLink>
  )
}
