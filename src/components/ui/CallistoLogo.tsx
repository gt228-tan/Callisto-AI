import React from 'react'

interface CallistoLogoProps {
  size?: number | string
  className?: string
  showText?: boolean
  subtitle?: string
}

export function CallistoLogo({ size = 32, className = '', showText = false, subtitle = 'Sales Intelligence' }: CallistoLogoProps) {
  const numSize = typeof size === 'number' ? size : parseInt(size) || 32

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Callisto Moon SVG Sphere */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-full"
        style={{ width: numSize, height: numSize }}
      >
        {/* Soft Ambient Jovian & Ice Aura */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-500/20 via-amber-500/15 to-transparent blur-[6px] pointer-events-none" />

        <svg
          viewBox="0 0 100 100"
          width={numSize}
          height={numSize}
          className="relative z-10 drop-shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-transform duration-300 hover:scale-105"
        >
          <defs>
            {/* Callisto Base Body: Ancient rock-ice crust */}
            <radialGradient id="callistoBody" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="35%" stopColor="#475569" />
              <stop offset="70%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#090d16" />
            </radialGradient>

            {/* Jovian Atmospheric Horizon Reflection */}
            <linearGradient id="jovianGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </linearGradient>

            {/* Valhalla Basin multi-ring gradient */}
            <radialGradient id="valhallaRing" cx="42%" cy="38%" r="40%">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.9" />
              <stop offset="18%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="45%" stopColor="#64748b" stopOpacity="0.4" />
              <stop offset="85%" stopColor="#1e293b" stopOpacity="0.1" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            {/* Orbital Arc Gradient */}
            <linearGradient id="orbitArc" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Outer Orbital Trajectory Ring */}
          <ellipse
            cx="50"
            cy="50"
            rx="46"
            ry="22"
            fill="none"
            stroke="url(#orbitArc)"
            strokeWidth="1.2"
            strokeDasharray="2 3"
            transform="rotate(-25 50 50)"
            opacity="0.8"
          />

          {/* Callisto Moon Body */}
          <circle cx="50" cy="50" r="38" fill="url(#callistoBody)" />

          {/* Callisto Surface Ice Scars & Crater Basins (NASA Galileo / Valhalla inspired) */}
          {/* Valhalla Multi-ring Basin */}
          <ellipse cx="40" cy="38" rx="16" ry="12" fill="none" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.6" strokeDasharray="3 2" />
          <ellipse cx="40" cy="38" rx="11" ry="8" fill="none" stroke="#e2e8f0" strokeWidth="0.9" opacity="0.75" />
          <circle cx="40" cy="38" r="4" fill="url(#valhallaRing)" />

          {/* Asgard Basin & Secondary Craters */}
          <ellipse cx="64" cy="55" rx="8" ry="6" fill="none" stroke="#94a3b8" strokeWidth="0.7" opacity="0.5" />
          <circle cx="64" cy="55" r="2.5" fill="#f1f5f9" opacity="0.7" />

          {/* Ancient Impact Ice Rays */}
          <circle cx="32" cy="62" r="2" fill="#bae6fd" opacity="0.8" />
          <circle cx="26" cy="42" r="1.8" fill="#e2e8f0" opacity="0.6" />
          <circle cx="58" cy="28" r="2.2" fill="#7dd3fc" opacity="0.75" />
          <circle cx="70" cy="40" r="1.5" fill="#94a3b8" opacity="0.6" />
          <circle cx="48" cy="72" r="2" fill="#38bdf8" opacity="0.6" />

          {/* Limb lighting / Jovian atmospheric edge bounce */}
          <path
            d="M 50 12 A 38 38 0 0 1 88 50 A 38 38 0 0 1 50 88 A 38 38 0 0 0 50 12"
            fill="black"
            opacity="0.38"
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="url(#jovianGlow)"
            strokeWidth="1.6"
            opacity="0.9"
          />

          {/* Telemetry Micro Satellite Node */}
          <circle cx="84" cy="32" r="2" fill="#f59e0b" className="animate-pulse" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-sm font-bold tracking-wider text-slate-100 uppercase font-sans">
              Callisto<span className="text-sky-400">.</span><span className="text-amber-400">AI</span>
            </span>
            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
              JUPITER-IV
            </span>
          </div>
          <span className="text-[10px] text-slate-400 tracking-wide font-mono mt-0.5 leading-tight truncate">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  )
}
