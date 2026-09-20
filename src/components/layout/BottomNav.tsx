import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Megaphone, PhoneCall, Workflow, Menu } from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const { setMobileNavOpen, t } = useAppContext()
  const location = useLocation()

  const navItems = [
    { to: '/', labelKey: 'nav.overview', icon: LayoutDashboard },
    { to: '/pipeline-journey', labelKey: 'nav.pipelineJourney', icon: Workflow },
    { to: '/leads', labelKey: 'nav.leads', icon: Users },
    { to: '/campaigns', labelKey: 'nav.campaigns', icon: Megaphone },
    { to: '/ai-voice-agent', labelKey: 'nav.aiVoiceAgent', icon: PhoneCall },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-14 bg-bg-secondary/95 backdrop-blur-md border-t border-bg-border z-30 md:hidden flex items-center justify-around px-1 safe-bottom"
      aria-label="Mobile Navigation"
    >
      {navItems.map(item => {
        const Icon = item.icon
        const isActive = item.to === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.to)

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full py-1 text-2xs font-medium transition-colors select-none',
              isActive
                ? 'text-amber-400 font-semibold'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            <div className={cn(
              'relative p-1 rounded-md transition-all',
              isActive && 'bg-amber-500/10'
            )}>
              <Icon className={cn('w-4 h-4 transition-transform', isActive && 'scale-110 text-amber-400')} />
            </div>
            <span className="leading-tight mt-0.5 truncate max-w-[56px] text-center">{t(item.labelKey)}</span>
          </NavLink>
        )
      })}

      {/* Menu / Drawer Trigger */}
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        className="flex flex-col items-center justify-center flex-1 h-full py-1 text-2xs font-medium text-text-muted hover:text-text-primary transition-colors select-none"
        aria-label="Open Full Navigation Menu"
      >
        <div className="p-1 rounded-md hover:bg-bg-hover">
          <Menu className="w-4 h-4" />
        </div>
        <span className="leading-tight mt-0.5">{t('nav.more', 'More')}</span>
      </button>
    </nav>
  )
}
