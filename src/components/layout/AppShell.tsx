import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { GlobalSearch } from './GlobalSearch'
import { useAppContext } from '@/contexts/AppContext'
import { Wifi, Battery, Signal, X, Smartphone, Monitor } from 'lucide-react'

export function AppShell() {
  const { deviceMode, setDeviceMode } = useAppContext()

  if (deviceMode === 'android' || deviceMode === 'ios') {
    const isIos = deviceMode === 'ios'
    return (
      <div className="flex flex-col h-screen bg-[#05070d] text-slate-100 overflow-hidden select-none">
        {/* Device Mode Floating Indicator Header */}
        <div className="h-11 bg-bg-secondary/95 backdrop-blur-md border-b border-bg-border/80 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 shadow-md">
          <div className="flex items-center gap-2.5 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isIos ? 'bg-sky-400' : 'bg-emerald-400'} animate-pulse shadow-[0_0_8px_currentColor]`} />
            <span className="font-semibold text-slate-100">
              {isIos ? 'Apple iOS (iPhone 16 Pro) Telemetry View' : 'Google Android (Pixel 9 Pro) Telemetry View'}
            </span>
            <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
              — Callisto Mobile Responsive Touch Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeviceMode(isIos ? 'android' : 'ios')}
              className="btn-secondary text-[11px] py-1 px-2.5 gap-1.5 font-mono text-slate-300"
            >
              <Smartphone className="w-3 h-3 text-sky-400" />
              Switch to {isIos ? 'Android' : 'iOS'}
            </button>
            <button
              onClick={() => setDeviceMode('desktop')}
              className="btn-primary text-[11px] py-1 px-3 gap-1.5 font-sans"
            >
              <Monitor className="w-3 h-3" />
              Exit to Desktop Web
            </button>
          </div>
        </div>

        {/* Centered Device Canvas with Cosmic Callisto Background */}
        <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden bg-gradient-to-b from-[#060912] via-[#090e1c] to-[#04070e] relative">
          {/* Subtle Ambient Cosmic Glow */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-sky-500/5 blur-[100px] pointer-events-none" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[80px] pointer-events-none translate-x-32 translate-y-32" />

          {/* Smartphone Frame */}
          <div className={`relative flex flex-col overflow-hidden bg-[#090d16] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] border ${
            isIos
              ? 'w-[400px] h-[840px] max-h-[calc(100vh-64px)] rounded-[50px] border-slate-700/80 ring-[10px] ring-slate-800/90'
              : 'w-[412px] h-[850px] max-h-[calc(100vh-64px)] rounded-[38px] border-slate-700/80 ring-[10px] ring-slate-800/90'
          }`}>
            {/* Status Bar */}
            <div className="h-11 bg-bg-secondary/95 backdrop-blur-xl px-7 flex items-center justify-between text-[11px] font-mono font-medium text-slate-200 shrink-0 select-none z-40 border-b border-bg-border/40">
              <span className="font-semibold tracking-tight">09:41</span>
              {isIos ? (
                /* Dynamic Island */
                <div className="w-28 h-5 bg-black rounded-full mx-auto flex items-center justify-center shadow-inner">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 mr-2" />
                  <div className="w-2 h-2 rounded-full bg-sky-500/40" />
                </div>
              ) : (
                /* Android Hole Punch */
                <div className="w-3.5 h-3.5 bg-black border border-slate-800 rounded-full mx-auto" />
              )}
              <div className="flex items-center gap-1.5 text-slate-300">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-4 h-4 text-slate-100" />
              </div>
            </div>

            {/* Mobile Header */}
            <TopBar />

            {/* Mobile Viewport Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-bg-primary pb-6 scrollbar-thin">
              <Outlet />
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <BottomNav embedded={true} />

            {/* Home Indicator bar */}
            <div className="h-5 bg-bg-secondary/90 backdrop-blur-md flex items-center justify-center shrink-0 z-40 border-t border-bg-border/30">
              <div className="w-32 h-1 bg-slate-500/40 rounded-full" />
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
        <main className="flex-1 overflow-auto bg-bg-primary pb-20 md:pb-0 scrollbar-thin">
          <Outlet />
        </main>
        <BottomNav />
      </div>
      <GlobalSearch />
    </div>
  )
}
