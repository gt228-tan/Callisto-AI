import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { GlobalSearch } from './GlobalSearch'
import { useAppContext } from '@/contexts/AppContext'
import { Wifi, Battery, Signal, X } from 'lucide-react'

export function AppShell() {
  const { deviceMode, setDeviceMode } = useAppContext()

  if (deviceMode === 'android' || deviceMode === 'ios') {
    const isIos = deviceMode === 'ios'
    return (
      <div className="flex flex-col h-screen bg-neutral-950 overflow-hidden">
        {/* Device Mode Floating Indicator Header */}
        <div className="h-10 bg-bg-secondary border-b border-bg-border px-4 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${isIos ? 'bg-blue-400' : 'bg-emerald-400'} animate-pulse`} />
            <span className="font-bold text-text-primary">
              {isIos ? 'Apple iOS (iPhone 16 Pro) Device Simulation' : 'Google Android (Pixel 9 Pro) Device Simulation'}
            </span>
            <span className="text-2xs text-text-muted hidden sm:inline">— Testing touch responsive layout & bottom navigation</span>
          </div>
          <button
            onClick={() => setDeviceMode('desktop')}
            className="btn-secondary text-2xs py-1 px-2 gap-1"
          >
            <X className="w-3 h-3" /> Exit Mobile Preview (Web Desktop)
          </button>
        </div>

        {/* Centered Device Canvas */}
        <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden bg-neutral-900/60">
          <div className={`relative flex flex-col overflow-hidden bg-bg-primary shadow-2xl border ${
            isIos
              ? 'w-[393px] h-[830px] max-h-[calc(100vh-60px)] rounded-[48px] border-neutral-700 ring-8 ring-neutral-800/80'
              : 'w-[412px] h-[840px] max-h-[calc(100vh-60px)] rounded-[32px] border-neutral-700 ring-8 ring-neutral-800/80'
          }`}>
            {/* Status Bar */}
            <div className="h-10 bg-bg-secondary/90 backdrop-blur px-6 flex items-center justify-between text-3xs font-medium text-text-primary shrink-0 select-none z-40 border-b border-bg-border/30">
              <span>9:41</span>
              {isIos ? (
                <div className="w-24 h-4 bg-black rounded-full mx-auto" />
              ) : (
                <div className="w-3 h-3 bg-neutral-900 border border-neutral-700 rounded-full mx-auto" />
              )}
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Signal className="w-2.5 h-2.5" />
                <Wifi className="w-2.5 h-2.5" />
                <Battery className="w-3.5 h-3.5 text-text-primary" />
              </div>
            </div>

            {/* Mobile Header */}
            <TopBar />

            {/* Viewport Content */}
            <main className="flex-1 overflow-y-auto bg-bg-primary pb-20 scrollbar-thin">
              <Outlet />
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <BottomNav />

            {/* Home Indicator bar */}
            <div className="h-4 bg-bg-secondary flex items-center justify-center shrink-0 z-40">
              <div className="w-32 h-1 bg-neutral-500/50 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto bg-bg-primary pb-16 md:pb-0">
          <Outlet />
        </main>
        <BottomNav />
      </div>
      <GlobalSearch />
    </div>
  )
}
