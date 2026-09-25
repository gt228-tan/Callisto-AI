import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, Circle, Globe, Menu, Sparkles, Shield, Lock, Clock, LogOut, AlertTriangle, Radio, Sun, Moon } from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { DevicePreviewBanner } from './DevicePreviewBanner'
import { CallistoLogo } from '@/components/ui/CallistoLogo'
import { getInitials } from '@/lib/utils'
import type { Language } from '@/lib/i18n'
import { LANGUAGE_LIST, SUPPORTED_LANGUAGES } from '@/lib/languages'
import { formatISTTime } from '@/lib/security'

const systemStatus = [
  { label: 'API Gateway', status: 'Operational' },
  { label: 'Gemini AI Engine', status: 'Operational' },
  { label: 'Voice & Telephony', status: 'Operational' },
  { label: 'CRM Sync Pipeline', status: 'Operational' },
  { label: 'Callisto Database', status: 'Operational' },
]

const initialNotifications = [
  { id: 1, text: 'Campaign "Q4 Enterprise AI" completed 241 calls', time: '2m ago', type: 'success', path: '/campaigns' },
  { id: 2, text: 'New high-intent lead: Kavitha Reddy (Score: 95)', time: '8m ago', type: 'info', path: '/leads' },
  { id: 3, text: 'Meeting booked with Rahul Mehta — Tuesday 11 AM', time: '15m ago', type: 'success', path: '/pipeline' },
  { id: 4, text: 'Perimeter check: Anomaly scanning complete', time: '1h ago', type: 'warning', path: '/admin/fraud' },
  { id: 5, text: 'Voice usage at 82% — 870 minutes remaining', time: '2h ago', type: 'warning', path: '/admin/voice-usage' },
]

export function TopBar() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { user, logout, triggerTestTimeout, inactivityTimeoutMinutes } = useAuth()
  const activeUser = user || { name: 'Tanishq Mehta', email: 'tanishq@demo-callistoai.com', role: 'ADMIN' }
  const { setGlobalSearchOpen, language, setLanguage, setMobileNavOpen, t, theme, toggleTheme, deviceMode } = useAppContext()
  const [notifList, setNotifList] = useState(initialNotifications)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  const isSimulator = deviceMode === 'android' || deviceMode === 'ios'

  return (
    <header className="h-[52px] flex items-center justify-between gap-1.5 sm:gap-3 px-2.5 sm:px-5 bg-bg-secondary/90 backdrop-blur-xl border-b border-bg-border/80 shrink-0 relative z-20 shadow-sm">
      {/* Left: Mobile Menu & Callisto Identifier */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 md:hidden shrink-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="p-1.5 rounded-lg hover:bg-bg-hover text-slate-400 hover:text-slate-100 transition-colors"
            id="mobile-menu-trigger"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <CallistoLogo size={24} showText={false} />
        </div>

        {/* Global Search Bar - adapts seamlessly on mobile/simulator */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className={`flex items-center gap-2 bg-bg-card/75 border border-bg-border/80 rounded-lg h-8 text-xs text-slate-400 hover:border-sky-400/50 hover:bg-bg-card transition-all ${
            isSimulator ? 'w-8 sm:w-36 justify-center sm:justify-start px-2' : 'w-8 sm:w-48 md:w-64 lg:w-72 justify-center sm:justify-start px-2 sm:px-3'
          }`}
          id="global-search-trigger"
          aria-label="Open search dialog"
          title="Search telemetry, leads, campaigns (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-sans truncate hidden sm:inline text-slate-400">
            {t('common.search', 'Search...')}
          </span>
          <kbd className="hidden md:inline ml-auto text-[10px] font-mono border border-bg-border rounded px-1.5 py-0.5 bg-bg-panel/80 text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Center/Right: Splunk Mission Telemetry, Theme Toggle & Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Callisto Mission Telemetry Orbit Status */}
        <div className="relative">
          <button
            onClick={() => { setStatusOpen(!statusOpen); setNotifOpen(false); setUserOpen(false); setLangOpen(false) }}
            className={`flex items-center gap-1.5 h-8 rounded-lg hover:bg-bg-hover text-xs text-emerald-400 font-mono font-medium border border-bg-border/70 transition-colors ${
              isSimulator ? 'px-2' : 'px-2 sm:px-2.5'
            }`}
            id="system-status-btn"
            title="System Status: All Operational"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)] shrink-0" />
            <span className="hidden xl:inline text-[11px] uppercase tracking-wider">Callisto Core: Nominal</span>
            <span className="hidden md:inline xl:hidden text-[11px]">Nominal</span>
          </button>
          {statusOpen && (
            <div className="absolute right-0 top-10 w-64 max-w-[calc(100vw-24px)] panel border rounded-xl shadow-2xl z-50 animate-fade-in p-1">
              <div className="px-3 py-2 border-b border-bg-border/70 text-[10px] text-slate-400 font-mono font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Mission Telemetry</span>
                <span className="text-emerald-400">ONLINE</span>
              </div>
              <div className="divide-y divide-bg-border/40 py-1">
                {systemStatus.map(s => (
                  <div key={s.label} className="flex items-center justify-between px-3 py-2 hover:bg-bg-hover/60 rounded-md transition-colors">
                    <span className="text-xs text-slate-300">{s.label}</span>
                    <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                      <Circle className="w-1.5 h-1.5 fill-emerald-400 text-emerald-400" /> {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Device Preview Switcher (Only visible in desktop web view) */}
        {!isSimulator && <DevicePreviewBanner />}

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-bg-hover text-slate-300 border border-bg-border/70 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
          id="theme-toggle-btn"
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-sky-500 hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setUserOpen(false); setStatusOpen(false) }}
            className="flex items-center gap-1 px-2 h-8 rounded-lg hover:bg-bg-hover text-slate-300 border border-bg-border/70 transition-colors cursor-pointer"
            id="lang-switcher-btn"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase flex items-center gap-1">
              <span>{SUPPORTED_LANGUAGES[language]?.flag || '🌐'}</span>
              <span className="hidden lg:inline">{language}</span>
            </span>
          </button>
          {langOpen && (
            <div className="absolute right-0 top-10 w-52 max-w-[calc(100vw-24px)] panel border rounded-xl shadow-2xl z-50 animate-fade-in divide-y divide-bg-border/60 p-1">
              <div className="px-3 py-1.5 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Select Platform Language
              </div>
              <div className="py-1">
                {LANGUAGE_LIST.map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code)
                      setLangOpen(false)
                      showToast('info', 'Language Updated', `Interface switched to ${l.nativeName} (${l.name})`)
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-hover flex items-center justify-between rounded-md transition-colors ${language === l.code ? 'text-sky-400 font-bold bg-sky-500/10' : 'text-slate-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{l.flag}</span>
                      <div>
                        <div className="font-medium text-slate-100 leading-tight">{l.nativeName}</div>
                        <div className="text-[10px] text-slate-400">{l.name}</div>
                      </div>
                    </div>
                    {language === l.code && <span className="text-xs font-bold text-sky-400">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); setStatusOpen(false); setLangOpen(false) }}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-bg-hover text-slate-300 border border-bg-border/70 transition-colors shrink-0"
            id="notifications-btn"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {notifList.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[10px] text-black font-mono font-bold flex items-center justify-center shadow-md">
                {notifList.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-10 w-[calc(100vw-24px)] sm:w-84 max-w-sm panel border rounded-xl shadow-2xl z-50 animate-fade-in p-1">
              <div className="px-3.5 py-2.5 border-b border-bg-border/70 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-100 font-sans">{t('common.notifications', 'Mission Alerts')}</span>
                {notifList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setNotifList([])
                      showToast('info', 'Notifications Cleared', 'All alerts marked as read')
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                  >
                    {t('common.markAllRead', 'Mark all read')}
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-bg-border/40">
                {notifList.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400">No unread alerts</div>
                ) : (
                  notifList.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setNotifList(prev => prev.filter(item => item.id !== n.id))
                        setNotifOpen(false)
                        if (n.path) navigate(n.path)
                        showToast('info', 'Alert Opened', n.text)
                      }}
                      className="px-3.5 py-2.5 hover:bg-bg-hover cursor-pointer transition-colors"
                    >
                      <div className="text-xs text-slate-200">{n.text}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">{n.time}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); setStatusOpen(false); setLangOpen(false) }}
            className="flex items-center gap-2 h-8 px-2.5 rounded-lg hover:bg-bg-hover border border-bg-border/70 transition-colors shrink-0"
            id="user-menu-btn"
            title={`${activeUser.name} (${activeUser.role})`}
            aria-label="User account menu"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500/20 to-amber-500/20 border border-sky-400/40 flex items-center justify-center text-[10px] font-mono font-bold text-sky-300 shrink-0">
              {getInitials(activeUser.name)}
            </div>
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-xs font-medium text-slate-100 leading-tight max-w-[100px] truncate">{activeUser.name}</span>
              <span className="text-[9px] text-slate-400 leading-tight font-mono">{activeUser.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-10 w-64 max-w-[calc(100vw-24px)] panel border rounded-xl shadow-2xl z-50 animate-fade-in p-1">
              <div className="px-3.5 py-3 border-b border-bg-border/70">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-100">{activeUser.name}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    activeUser.role === 'ADMIN' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                    activeUser.role === 'MANAGER' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-slate-700/40 text-slate-300 border border-slate-600'
                  }`}>
                    {activeUser.role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">{activeUser.email}</div>
                <div className="mt-2 pt-2 border-t border-bg-border/50 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Lock className="w-3 h-3" /> TLS 1.3
                  </span>
                  <span>15m Session</span>
                </div>
              </div>

              {/* Fast Inactivity Test Trigger for Reviewers */}
              <div className="p-2 border-b border-bg-border/70 bg-bg-panel/40">
                <button
                  type="button"
                  onClick={() => {
                    setUserOpen(false)
                    triggerTestTimeout()
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-[11px] text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 flex items-center justify-between font-mono transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-400" /> Test Inactivity Modal
                  </span>
                  <span className="text-[9px] bg-amber-500/20 px-1 py-0.5 rounded">DEMO</span>
                </button>
              </div>

              {/* Account Actions */}
              <div className="py-1">
                <button
                  onClick={() => { setUserOpen(false); navigate('/settings') }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:text-slate-100 hover:bg-bg-hover flex items-center gap-2 rounded transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-sky-400" /> Security & Profile
                </button>
                <button
                  onClick={() => { setUserOpen(false); logout('User logged out') }}
                  className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
