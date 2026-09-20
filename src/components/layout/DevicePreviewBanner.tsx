import { Smartphone, Monitor, Apple, Check } from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'

export function DevicePreviewBanner() {
  const { deviceMode, setDeviceMode } = useAppContext()

  return (
    <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-bg-card/90 border border-bg-border rounded-full text-2xs shadow-sm">
      <span className="text-3xs font-semibold text-text-muted uppercase tracking-wider px-1">Device Preview:</span>
      <button
        onClick={() => setDeviceMode('desktop')}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
          deviceMode === 'desktop'
            ? 'bg-amber-500 text-black font-bold'
            : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
        }`}
        title="Web Desktop View"
      >
        <Monitor className="w-3 h-3" />
        <span>Web</span>
      </button>

      <button
        onClick={() => setDeviceMode('android')}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
          deviceMode === 'android'
            ? 'bg-emerald-500 text-black font-bold'
            : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
        }`}
        title="Android Mobile View"
      >
        <Smartphone className="w-3 h-3" />
        <span>Android</span>
      </button>

      <button
        onClick={() => setDeviceMode('ios')}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
          deviceMode === 'ios'
            ? 'bg-blue-500 text-white font-bold'
            : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
        }`}
        title="iOS iPhone View"
      >
        <Apple className="w-3 h-3" />
        <span>iOS</span>
      </button>
    </div>
  )
}
