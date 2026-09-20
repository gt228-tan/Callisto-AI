import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Radar, Users, Brain, Megaphone, PhoneCall,
  TrendingUp, Kanban, BarChart3, Link, Settings,
  Shield, UserCog, CreditCard, Volume2, Receipt, ScrollText,
  AlertTriangle, Activity, Sliders, ChevronLeft, ChevronRight,
  Sparkles, CheckCircle
} from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  admin?: boolean
}

const mainNav: NavItem[] = [
  { to: '/',                  label: 'Overview',          icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { to: '/lead-discovery',    label: 'Lead Discovery',    icon: <Radar className="w-3.5 h-3.5" /> },
  { to: '/leads',             label: 'Leads',             icon: <Users className="w-3.5 h-3.5" /> },
  { to: '/ai-qualification',  label: 'AI Qualification',  icon: <Brain className="w-3.5 h-3.5" /> },
  { to: '/campaigns',         label: 'Campaigns',         icon: <Megaphone className="w-3.5 h-3.5" /> },
  { to: '/ai-voice-agent',    label: 'AI Voice Agent',    icon: <PhoneCall className="w-3.5 h-3.5" /> },
  { to: '/call-history',      label: 'Call History',      icon: <ScrollText className="w-3.5 h-3.5" /> },
  { to: '/market-intelligence', label: 'Market Intel',    icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { to: '/pipeline',          label: 'Sales Pipeline',    icon: <Kanban className="w-3.5 h-3.5" /> },
  { to: '/analytics',         label: 'Analytics',         icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { to: '/crm',               label: 'CRM',               icon: <Link className="w-3.5 h-3.5" /> },
  { to: '/settings',          label: 'Settings',          icon: <Settings className="w-3.5 h-3.5" /> },
]

const adminNav: NavItem[] = [
  { to: '/admin',             label: 'Admin Overview',    icon: <Shield className="w-3.5 h-3.5" />,     admin: true },
  { to: '/admin/users',       label: 'Users',             icon: <UserCog className="w-3.5 h-3.5" />,    admin: true },
  { to: '/admin/product-approvals', label: 'Product Approvals', icon: <CheckCircle className="w-3.5 h-3.5" />, admin: true },
  { to: '/admin/subscriptions', label: 'Subscriptions',  icon: <CreditCard className="w-3.5 h-3.5" />, admin: true },
  { to: '/admin/voice-usage', label: 'Voice Usage',       icon: <Volume2 className="w-3.5 h-3.5" />,    admin: true },
  { to: '/admin/billing',     label: 'Billing',           icon: <Receipt className="w-3.5 h-3.5" />,    admin: true },
  { to: '/admin/audit-logs',  label: 'Audit Logs',        icon: <ScrollText className="w-3.5 h-3.5" />, admin: true },
  { to: '/admin/fraud',       label: 'Fraud Detection',   icon: <AlertTriangle className="w-3.5 h-3.5" />, admin: true },
  { to: '/admin/system',      label: 'System Monitoring', icon: <Activity className="w-3.5 h-3.5" />,   admin: true },
  { to: '/admin/platform',    label: 'Platform Settings', icon: <Sliders className="w-3.5 h-3.5" />,   admin: true },
]

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppContext()
  const location = useLocation()

  return (
    <aside className={cn(
      'flex flex-col bg-bg-secondary border-r border-bg-border transition-all duration-200 z-30 h-full shrink-0',
      sidebarCollapsed ? 'w-14' : 'w-[220px]'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-b border-bg-border min-h-[48px]">
        <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-text-primary leading-tight">NexusAI</span>
            <span className="text-2xs text-text-muted leading-tight">Sales Intelligence</span>
          </div>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {/* Main nav */}
        {!sidebarCollapsed && (
          <div className="px-3 py-1">
            <span className="text-2xs uppercase tracking-widest text-text-muted font-medium">Workspace</span>
          </div>
        )}
        {mainNav.map(item => (
          <NavItem key={item.to} item={item} collapsed={sidebarCollapsed} currentPath={location.pathname} />
        ))}

        {/* Admin nav */}
        <div className={cn('mt-3 pt-2 border-t border-bg-border')}>
          {!sidebarCollapsed && (
            <div className="px-3 py-1">
              <span className="text-2xs uppercase tracking-widest text-blue-400/60 font-medium">Admin</span>
            </div>
          )}
          {adminNav.map(item => (
            <NavItem key={item.to} item={item} collapsed={sidebarCollapsed} currentPath={location.pathname} />
          ))}
        </div>
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="flex items-center justify-center h-9 border-t border-bg-border hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  )
}

function NavItem({ item, collapsed, currentPath }: { item: NavItem; collapsed: boolean; currentPath: string }) {
  const isActive = item.to === '/'
    ? currentPath === '/'
    : currentPath.startsWith(item.to)

  const baseClass = item.admin
    ? cn('nav-item admin', isActive && 'active', collapsed && 'justify-center px-0 mx-2')
    : cn('nav-item', isActive && 'active', collapsed && 'justify-center px-0 mx-2')

  return (
    <NavLink to={item.to} className={baseClass} title={collapsed ? item.label : undefined}>
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && isActive && item.admin && (
        <span className="ml-auto w-1 h-1 rounded-full bg-blue-400" />
      )}
    </NavLink>
  )
}
