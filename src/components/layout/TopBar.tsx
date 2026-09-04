import { useState } from 'react'
import { Search, Bell, ChevronDown, Circle, Globe } from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { getInitials } from '@/lib/utils'
import type { Language } from '@/lib/i18n'

const currentUser = { name: 'Tanishq Mehta', email: 'tanishq@demo-nexusai.com', role: 'Admin' }

const systemStatus = [
  { label: 'API', status: 'Operational' },
  { label: 'AI Processing', status: 'Operational' },
  { label: 'Voice Infrastructure', status: 'Operational' },
  { label: 'CRM Integrations', status: 'Operational' },
  { label: 'Database', status: 'Operational' },
]

const notifications = [
  { id: 1, text: 'Campaign "Q4 Enterprise AI" completed 241 calls', time: '2m ago', type: 'success' },
  { id: 2, text: 'New high-intent lead: Kavitha Reddy (Score: 95)', time: '8m ago', type: 'info' },
  { id: 3, text: 'Meeting booked with Rahul Mehta — Tuesday 11 AM', time: '15m ago', type: 'success' },
  { id: 4, text: 'Fraud alert: Unusual API activity detected', time: '1h ago', type: 'warning' },
  { id: 5, text: 'Voice usage at 82% — 870 minutes remaining', time: '2h ago', type: 'warning' },
]

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'gu', label: 'ગુજરાતી' },
]

export function TopBar() {
  const { setGlobalSearchOpen, language, setLanguage } = useAppContext()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  return (
    <header className="h-[48px] flex items-center gap-3 px-4 bg-bg-secondary border-b border-bg-border shrink-0 relative z-20">
      {/* Global Search */}
      <button
        onClick={() => setGlobalSearchOpen(true)}
        className="flex-1 flex items-center gap-2 bg-bg-card border border-bg-border rounded px-3 h-7 text-xs text-text-muted hover:border-amber-500/40 transition-colors max-w-md"
        id="global-search-trigger"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs font-mono">Search leads, companies, campaigns, calls...</span>
        <kbd className="ml-auto text-2xs border border-bg-border rounded px-1 py-0.5 bg-bg-panel">⌘K</kbd>
      </button>

      <div className="flex items-center gap-2 ml-auto">
        {/* System Status */}
        <div className="relative">
          <button
            onClick={() => { setStatusOpen(!statusOpen); setNotifOpen(false); setUserOpen(false); setLangOpen(false) }}
            className="flex items-center gap-1.5 px-2 h-7 rounded hover:bg-bg-hover text-2xs text-success font-medium border border-bg-border transition-colors"
            id="system-status-btn"
          >
            <Circle className="w-2 h-2 fill-success text-success" />
            All Systems Operational
          </button>
          {statusOpen && (
            <div className="absolute right-0 top-9 w-56 panel border rounded shadow-2xl z-50 animate-fade-in">
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

        {/* Language */}
        <div className="relative">
          <button
            onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setUserOpen(false); setStatusOpen(false) }}
            className="flex items-center gap-1 px-2 h-7 rounded hover:bg-bg-hover text-text-muted border border-bg-border transition-colors"
            id="lang-switcher-btn"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="text-2xs font-medium">{language.toUpperCase()}</span>
          </button>
          {langOpen && (
            <div className="absolute right-0 top-9 w-36 panel border rounded shadow-2xl z-50 animate-fade-in">
              {languages.map(l => (
                <button key={l.code} onClick={() => { setLanguage(l.code); setLangOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-hover flex items-center justify-between ${language === l.code ? 'text-amber-400' : 'text-text-secondary'}`}>
                  {l.label}
                  {language === l.code && <span className="text-2xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); setStatusOpen(false); setLangOpen(false) }}
            className="relative flex items-center justify-center w-7 h-7 rounded hover:bg-bg-hover text-text-muted border border-bg-border transition-colors"
            id="notifications-btn"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full text-2xs text-black font-bold flex items-center justify-center">5</span>
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-9 w-80 panel border rounded shadow-2xl z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-bg-border flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary">Notifications</span>
                <span className="text-2xs text-amber-400">Mark all read</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="px-3 py-2.5 border-b border-bg-border/50 hover:bg-bg-hover cursor-pointer">
                    <div className="text-xs text-text-primary">{n.text}</div>
                    <div className="text-2xs text-text-muted mt-1">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); setStatusOpen(false); setLangOpen(false) }}
            className="flex items-center gap-2 h-7 px-2 rounded hover:bg-bg-hover border border-bg-border transition-colors"
            id="user-menu-btn"
          >
            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xs font-bold text-amber-400">
              {getInitials(currentUser.name)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-2xs font-medium text-text-primary leading-tight">{currentUser.name.split(' ')[0]}</span>
              <span className="text-2xs text-text-muted leading-tight">{currentUser.role}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-9 w-52 panel border rounded shadow-2xl z-50 animate-fade-in">
              <div className="px-3 py-3 border-b border-bg-border">
                <div className="text-xs font-semibold text-text-primary">{currentUser.name}</div>
                <div className="text-2xs text-text-muted">{currentUser.email}</div>
                <div className="mt-1"><span className="badge-amber">Enterprise Plan</span></div>
              </div>
              {['Profile', 'Account Settings', 'Billing', 'API Keys', 'Help & Docs'].map(item => (
                <button key={item} className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors">
                  {item}
                </button>
              ))}
              <div className="border-t border-bg-border">
                <button className="w-full text-left px-3 py-2 text-xs text-danger-bright hover:bg-danger-dim transition-colors">
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
