import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, Circle, Globe, Menu, Sparkles } from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { useToast } from '@/contexts/ToastContext'
import { DevicePreviewBanner } from './DevicePreviewBanner'
import { getInitials } from '@/lib/utils'
import type { Language } from '@/lib/i18n'
import { LANGUAGE_LIST, SUPPORTED_LANGUAGES } from '@/lib/languages'

const currentUser = { name: 'Tanishq Mehta', email: 'tanishq@demo-callistoai.com', role: 'Admin' }

const systemStatus = [
  { label: 'API', status: 'Operational' },
  { label: 'AI Processing', status: 'Operational' },
  { label: 'Voice Infrastructure', status: 'Operational' },
  { label: 'CRM Integrations', status: 'Operational' },
  { label: 'Database', status: 'Operational' },
]

const initialNotifications = [
  { id: 1, text: 'Campaign "Q4 Enterprise AI" completed 241 calls', time: '2m ago', type: 'success', path: '/campaigns' },
  { id: 2, text: 'New high-intent lead: Kavitha Reddy (Score: 95)', time: '8m ago', type: 'info', path: '/leads' },
  { id: 3, text: 'Meeting booked with Rahul Mehta — Tuesday 11 AM', time: '15m ago', type: 'success', path: '/pipeline' },
  { id: 4, text: 'Fraud alert: Unusual API activity detected', time: '1h ago', type: 'warning', path: '/admin/fraud' },
  { id: 5, text: 'Voice usage at 82% — 870 minutes remaining', time: '2h ago', type: 'warning', path: '/admin/voice-usage' },
]



export function TopBar() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { setGlobalSearchOpen, language, setLanguage, setMobileNavOpen, t } = useAppContext()
  const [notifList, setNotifList] = useState(initialNotifications)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  return (
    <header className="h-[48px] flex items-center gap-2 sm:gap-3 px-2 sm:px-4 bg-bg-secondary border-b border-bg-border shrink-0 relative z-20">
      {/* Mobile Menu Button & Brand */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="p-1.5 rounded hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
          id="mobile-menu-trigger"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>
      </div>

      {/* Global Search */}
      <button
        onClick={() => setGlobalSearchOpen(true)}
        className="flex-1 flex items-center gap-2 bg-bg-card border border-bg-border rounded px-2 sm:px-3 h-7 text-xs text-text-muted hover:border-amber-500/40 transition-colors max-w-md min-w-0"
        id="global-search-trigger"
        aria-label="Open search dialog"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs font-mono truncate hidden sm:inline">{t('common.search', 'Search leads, companies, campaigns, calls...')}</span>
        <span className="text-xs font-mono text-text-muted sm:hidden">{t('common.search', 'Search...')}</span>
        <kbd className="hidden sm:inline ml-auto text-2xs border border-bg-border rounded px-1 py-0.5 bg-bg-panel">⌘K</kbd>
      </button>

      <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
        {/* System Status */}
        <div className="relative">
          <button
            onClick={() => { setStatusOpen(!statusOpen); setNotifOpen(false); setUserOpen(false); setLangOpen(false) }}
            className="flex items-center gap-1.5 px-2 h-7 rounded hover:bg-bg-hover text-2xs text-success font-medium border border-bg-border transition-colors"
            id="system-status-btn"
            title="System Status: All Operational"
          >
            <Circle className="w-2 h-2 fill-success text-success shrink-0" />
            <span className="hidden lg:inline">{t('common.allSystems', 'All Systems Operational')}</span>
            <span className="hidden sm:inline lg:hidden">Operational</span>
          </button>
          {statusOpen && (
            <div className="absolute right-0 top-9 w-56 max-w-[calc(100vw-24px)] panel border rounded shadow-2xl z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-bg-border text-2xs text-text-muted font-medium uppercase tracking-wide">System Health</div>
              {systemStatus.map(s => (
                <div key={s.label} className="flex items-center justify-between px-3 py-2 hover:bg-bg-hover">
                  <span className="text-xs text-text-secondary">{s.label}</span>
                  <span className="flex items-center gap-1 text-2xs text-success">
                    <Circle className="w-1.5 h-1.5 fill-success" /> {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Device Preview Switcher (Web, Android, iOS) */}
        <DevicePreviewBanner />

        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setUserOpen(false); setStatusOpen(false) }}
            className="flex items-center gap-1.5 px-2 h-7 rounded hover:bg-bg-hover text-text-muted border border-bg-border transition-colors cursor-pointer"
            id="lang-switcher-btn"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-2xs font-semibold text-text-primary uppercase flex items-center gap-1">
              <span>{SUPPORTED_LANGUAGES[language]?.flag || '🌐'}</span>
              <span>{language}</span>
            </span>
          </button>
          {langOpen && (
            <div className="absolute right-0 top-9 w-48 max-w-[calc(100vw-24px)] panel border rounded shadow-2xl z-50 animate-fade-in divide-y divide-bg-border">
              <div className="px-3 py-1.5 text-3xs font-semibold text-text-muted uppercase tracking-wider bg-bg-card">
                Select Platform Language
              </div>
              {LANGUAGE_LIST.map(l => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code)
                    setLangOpen(false)
                    showToast('info', 'Language Updated', `Interface switched to ${l.nativeName} (${l.name})`)
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-hover flex items-center justify-between transition-colors ${language === l.code ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-text-secondary'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{l.flag}</span>
                    <div>
                      <div className="font-medium text-text-primary leading-tight">{l.nativeName}</div>
                      <div className="text-3xs text-text-muted">{l.name}</div>
                    </div>
                  </div>
                  {language === l.code && <span className="text-xs font-bold text-amber-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); setStatusOpen(false); setLangOpen(false) }}
            className="relative flex items-center justify-center w-7 h-7 rounded hover:bg-bg-hover text-text-muted border border-bg-border transition-colors shrink-0"
            id="notifications-btn"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {notifList.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full text-2xs text-black font-bold flex items-center justify-center">
                {notifList.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-9 w-[calc(100vw-24px)] sm:w-80 max-w-sm panel border rounded shadow-2xl z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-bg-border flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary">{t('common.notifications', 'Notifications')}</span>
                {notifList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setNotifList([])
                      showToast('info', 'Notifications Cleared', 'All notifications marked as read')
                    }}
                    className="text-2xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                  >
                    {t('common.markAllRead', 'Mark all read')}
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifList.length === 0 ? (
                  <div className="p-4 text-center text-xs text-text-muted">No unread notifications</div>
                ) : (
                  notifList.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setNotifList(prev => prev.filter(item => item.id !== n.id))
                        setNotifOpen(false)
                        if (n.path) navigate(n.path)
                        showToast('info', 'Notification Opened', n.text)
                      }}
                      className="px-3 py-2.5 border-b border-bg-border/50 hover:bg-bg-hover cursor-pointer transition-colors"
                    >
                      <div className="text-xs text-text-primary">{n.text}</div>
                      <div className="text-2xs text-text-muted mt-1">{n.time}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); setStatusOpen(false); setLangOpen(false) }}
            className="flex items-center gap-2 h-7 px-2 rounded hover:bg-bg-hover border border-bg-border transition-colors shrink-0"
            id="user-menu-btn"
            title={`${currentUser.name} (${currentUser.role})`}
            aria-label="User account menu"
          >
            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xs font-bold text-amber-400 shrink-0">
              {getInitials(currentUser.name)}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-2xs font-medium text-text-primary leading-tight max-w-[70px] sm:max-w-none truncate">{currentUser.name.split(' ')[0]}</span>
              <span className="text-2xs text-text-muted leading-tight hidden sm:inline">{currentUser.role}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-text-muted shrink-0" />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-9 w-52 max-w-[calc(100vw-24px)] panel border rounded shadow-2xl z-50 animate-fade-in">
              <div className="px-3 py-3 border-b border-bg-border">
                <div className="text-xs font-semibold text-text-primary">{currentUser.name}</div>
                <div className="text-2xs text-text-muted">{currentUser.email}</div>
                <div className="mt-1"><span className="badge-amber">Enterprise Plan</span></div>
              </div>
              {[
                { label: 'Profile', path: '/settings?tab=profile' },
                { label: 'Account Settings', path: '/settings?tab=company' },
                { label: 'Billing', path: '/settings?tab=billing' },
                { label: 'API Keys', path: '/settings?tab=security' },
                {
                  label: 'Help & Docs',
                  action: () => showToast('info', 'Help & Documentation', 'Callisto AI Documentation and API guides are available at docs.callistoai.com'),
                },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => {
                    setUserOpen(false)
                    if (item.path) {
                      navigate(item.path)
                    } else if (item.action) {
                      item.action()
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <div className="border-t border-bg-border">
                <button
                  onClick={() => {
                    setUserOpen(false)
                    showToast('success', 'Signed Out', 'You have been safely signed out')
                    navigate('/')
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-danger-bright hover:bg-danger-dim transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for dropdowns */}
      {(notifOpen || userOpen || statusOpen || langOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setNotifOpen(false); setUserOpen(false); setStatusOpen(false); setLangOpen(false) }} />
      )}
    </header>
  )
}
