import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Megaphone, PhoneCall, Workflow, Menu } from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { cn } from '@/lib/utils'

export function BottomNav({ embedded = false }: { embedded?: boolean }) {
  const { setMobileNavOpen, t, deviceMode } = useAppContext()
  const location = useLocation()
  const isEmbedded = embedded || deviceMode === 'android' || deviceMode === 'ios'

  const navItems = [
    { to: '/', labelKey: 'nav.overview', icon: LayoutDashboard },
    { to: '/pipeline-journey', labelKey: 'nav.pipelineJourney', icon: Workflow },
    { to: '/leads', labelKey: 'nav.leads', icon: Users },
    { to: '/campaigns', labelKey: 'nav.campaigns', icon: Megaphone },
    { to: '/ai-voice-agent', labelKey: 'nav.aiVoiceAgent', icon: PhoneCall },
  ]

  return (
    <nav
      className={cn(
        'bg-bg-secondary/95 backdrop-blur-2xl border-t border-bg-border/80 z-30 flex items-center justify-around px-2 shadow-2xl',
        isEmbedded
          ? 'relative shrink-0 h-14'
          : 'fixed bottom-0 left-0 right-0 h-16 md:hidden safe-bottom'
      )}
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
              'flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-all select-none',
              isActive
                ? 'text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <div className={cn(
              'relative p-1.5 rounded-xl transition-all',
              isActive && 'bg-sky-500/15 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)] border border-sky-500/30'
            )}>
              <Icon className={cn('w-4 h-4 transition-transform', isActive && 'scale-110')} />
            </div>
            <span className="leading-tight mt-1 truncate max-w-[56px] text-center font-sans tracking-tight">
              {t(item.labelKey)}
            </span>
          </NavLink>
        )
      })}

      {/* Menu / Drawer Trigger */}
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors select-none"
        aria-label="Open Full Navigation Menu"
      >
        <div className="p-1.5 rounded-xl hover:bg-bg-hover transition-colors">
          <Menu className="w-4 h-4 text-slate-400" />
        </div>
        <span className="leading-tight mt-1 text-center font-sans">Menu</span>
      </button>
    </nav>
  )
}
