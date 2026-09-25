import React, { useEffect, useState, useRef } from 'react'
import {
  Compass, Radio, Sparkles, Orbit, ArrowRight, ShieldCheck,
  Volume2, VolumeX, Eye, Info, Database, Activity, Globe,
  Cpu, Layers, Zap
} from 'lucide-react'

interface CallistoPreloaderProps {
  onComplete: () => void
  durationSeconds?: number
}

// Authentic NASA Galileo & Callisto scientific facts from NASA Science
const CALLISTO_LANDMARKS = [
  {
    name: 'Valhalla Basin',
    type: 'Multi-Ring Impact Structure',
    diameter: '4,000 km across',
    desc: 'The single largest multi-ring impact basin in the solar system, with concentric bright ice ridges extending over 2,000 km from the central bright impact zone.',
    coords: '16.0°N 57.0°W',
    x: 42,
    y: 36,
  },
  {
    name: 'Asgard Multi-Ring Basin',
    type: 'Second Largest Jovian Basin',
    diameter: '1,600 km diameter',
    desc: 'Heavily weathered impact feature flanked by concentric tectonic fault scarps and younger frost-rimmed craters.',
    coords: '32.0°N 140.0°W',
    x: 65,
    y: 52,
  },
  {
    name: 'Subsurface Saline Ocean',
    type: 'Hydrological Reservoir',
    diameter: '~150–200 km deep',
    desc: 'Galileo magnetometer data proved Callisto induces an electrical current against Jupiter’s magnetic field, confirming a conductive liquid water ocean beneath its thick icy crust.',
    coords: 'Sub-Crustal Horizon',
    x: 50,
    y: 75,
  },
  {
    name: 'Gipul Catena',
    type: 'Impact Crater Chain',
    diameter: '620 km length',
    desc: 'Linear series of 17 aligned craters created by a tidally disrupted comet heading toward Jupiter.',
    coords: '68.5°N 54.6°W',
    x: 28,
    y: 25,
  }
]

const LOADING_STAGES = [
  { at: 0, text: 'INITIALIZING DEEP-SPACE TELEMETRY LINK', detail: 'Connecting to Deep Space Network (Goldstone, Madrid, Canberra)...' },
  { at: 18, text: 'ACQUIRING NASA GALILEO SURFACE MOSAIC', detail: 'Calibrating high-resolution multi-spectral crater topography...' },
  { at: 42, text: 'MAPPING VALHALLA MULTI-RING IMPACT BASIN', detail: 'Resolving concentric ice ridges & ancient Jovian impact scars...' },
  { at: 68, text: 'ANALYZING SUBSURFACE LIQUID OCEAN HORIZON', detail: 'Magnetometer induction readings confirm conductive salty reservoir...' },
  { at: 88, text: 'ESTABLISHING ZERO-TRUST QUANTUM TLS 1.3', detail: 'Arming role-based security clearance & enterprise mission control...' },
  { at: 100, text: 'CALLISTO AI MISSION TERMINAL READY', detail: 'Session encryption keys validated. Launching workspace...' },
]

export function CallistoPreloader({ onComplete, durationSeconds = 5 }: CallistoPreloaderProps) {
  const [progress, setProgress] = useState(0)
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const [activeLandmark, setActiveLandmark] = useState(0)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const starsRef = useRef<Array<{ x: number; y: number; r: number; speed: number; opacity: number }>>([])
  const audioCtxRef = useRef<AudioContext | null>(null)

  const totalDurationMs = durationSeconds * 1000

  // Handle subtle sci-fi ambient / beep sound via Web Audio API
  const playChime = (frequency: number, duration: number = 0.15) => {
    if (!isAudioEnabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(frequency, ctx.currentTime)
      gain.gain.setValueAtTime(0.04, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Preloader Timer Engine (Runs for exactly 5 seconds)
  useEffect(() => {
    const startTime = performance.now()

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime
      const currentProgress = Math.min(100, (elapsed / totalDurationMs) * 100)
      const remaining = Math.max(0, (totalDurationMs - elapsed) / 1000)

      setProgress(currentProgress)
      setTimeLeft(remaining)

      // Cycle landmarks according to progress
      if (currentProgress < 30) setActiveLandmark(0)
      else if (currentProgress < 60) setActiveLandmark(1)
      else if (currentProgress < 85) setActiveLandmark(2)
      else setActiveLandmark(3)

      if (elapsed >= totalDurationMs) {
        clearInterval(interval)
        triggerFinish()
      }
    }, 20)

    // Keydown skip handler (Esc key)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        triggerFinish()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearInterval(interval)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [totalDurationMs])

  const triggerFinish = () => {
    playChime(880, 0.3)
    setIsExiting(true)
    setTimeout(() => {
      onComplete()
    }, 600) // Allow smooth fade out
  }

  // Initialize interactive twinkling starfield
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Generate 220 twinkling cosmic stars
      const stars = []
      for (let i = 0; i < 220; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 0.3,
          speed: Math.random() * 0.02 + 0.005,
          opacity: Math.random() * 0.8 + 0.2,
        })
      }
      starsRef.current = stars
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let angle = 0
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      angle += 0.015

      // Draw starry depth
      for (let i = 0; i < starsRef.current.length; i++) {
        const star = starsRef.current[i]
        const currentOpacity = Math.abs(Math.sin(angle * star.speed * 8 + i)) * 0.7 + 0.3
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        ctx.fillStyle = i % 8 === 0 ? `rgba(56, 189, 248, ${currentOpacity})` :
                        i % 12 === 0 ? `rgba(245, 158, 11, ${currentOpacity})` :
                        `rgba(241, 245, 249, ${currentOpacity * 0.8})`
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Parallax mouse movement
  const handleMouseMove = (e: React.MouseEvent) => {
    const { innerWidth, innerHeight } = window
    const x = (e.clientX - innerWidth / 2) / 35
    const y = (e.clientY - innerHeight / 2) / 35
    setMouseOffset({ x, y })
  }

  // Current stage info based on progress
  const currentStage = [...LOADING_STAGES].reverse().find(s => progress >= s.at) || LOADING_STAGES[0]

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-[#04070d] text-slate-100 select-none overflow-hidden transition-all duration-700 ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Atmospheric Jovian Nebula Glow (Amber & Ice Blue gradients) */}
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-sky-500/[0.08] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[700px] h-[700px] bg-amber-500/[0.08] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-indigo-950/20 rounded-full blur-[180px] pointer-events-none" />

      {/* Futuristic Telemetry Grid Lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ================= TOP HUD HEADER ================= */}
      <header className="relative z-20 px-6 py-5 flex items-center justify-between border-b border-sky-500/10 backdrop-blur-sm bg-[#04070d]/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            {/* NASA Galileo & Callisto Badge */}
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <Orbit className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-widest text-sm text-slate-100 uppercase">
                  CALLISTO<span className="text-sky-400">.</span><span className="text-amber-400">AI</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  JUPITER IV
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hidden sm:inline">
                  NASA GALILEO RECON
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider mt-0.5">
                AUTONOMOUS SALES INTELLIGENCE & ZERO-TRUST TERMINAL
              </p>
            </div>
          </div>
        </div>

        {/* Right HUD metrics & Audio / Skip controls */}
        <div className="flex items-center gap-3 text-xs">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => {
              setIsAudioEnabled(!isAudioEnabled)
              if (!isAudioEnabled) playChime(520, 0.2)
            }}
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 transition-all flex items-center gap-1.5"
            title={isAudioEnabled ? 'Mute ambient sound' : 'Enable telemetry sound'}
          >
            {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span className="text-[10px] font-mono hidden md:inline">{isAudioEnabled ? 'AUDIO ON' : 'AUDIO OFF'}</span>
          </button>

          {/* 5-Second Countdown Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-950/40 border border-sky-500/30 font-mono text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.15)]">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider">
              LAUNCH IN {timeLeft.toFixed(1)}s
            </span>
          </div>

          {/* Skip directly to Login */}
          <button
            onClick={triggerFinish}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold font-mono transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
          >
            <span>SKIP INTRO</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* ================= MAIN CINEMATIC MOON STAGE ================= */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-4 lg:p-8 max-w-7xl mx-auto w-full gap-8">
        
        {/* LEFT COLUMN: Authentic NASA Callisto Astronomical Telemetry */}
        <div className="w-full lg:w-72 flex flex-col gap-3 order-2 lg:order-1 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase tracking-wider mb-2 pb-2 border-b border-slate-800/70">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Database className="w-3 h-3" /> NASA Telemetry
              </span>
              <span>Galileo SSI</span>
            </div>

            <div className="space-y-2.5 font-mono text-[11px]">
              <div>
                <div className="text-[9px] text-slate-400 uppercase">Parent Planet</div>
                <div className="text-slate-200 font-bold flex items-center justify-between">
                  <span>Jupiter (Sol V)</span>
                  <span className="text-amber-400 text-[10px]">1,883,000 km</span>
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-400 uppercase">Equatorial Diameter</div>
                <div className="text-slate-200 font-bold flex items-center justify-between">
                  <span>4,821 km</span>
                  <span className="text-sky-300 text-[10px]">99% Mercury</span>
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-400 uppercase">Surface Impact Density</div>
                <div className="text-slate-200 font-bold flex items-center justify-between">
                  <span>Sat. Crater Limit</span>
                  <span className="text-rose-400 text-[10px]">Solar System High</span>
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-400 uppercase">Subsurface Ocean Horizon</div>
                <div className="text-slate-200 font-bold flex items-center justify-between">
                  <span>Salty H₂O Mantle</span>
                  <span className="text-emerald-400 text-[10px]">Conductive Layer</span>
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-400 uppercase">Radiation Exposure</div>
                <div className="text-slate-200 font-bold flex items-center justify-between">
                  <span>0.01 rem/day</span>
                  <span className="text-sky-400 text-[10px]">Safe Outpost Zone</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/70 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ORBIT STABLE
              </span>
              <span>Tidally Locked</span>
            </div>
          </div>

          {/* NASA Quote Callout */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-sky-950/30 to-slate-900/40 border border-sky-500/20 backdrop-blur-md">
            <div className="text-[9px] font-mono text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Info className="w-2.5 h-2.5" /> NASA Science Insight
            </div>
            <p className="text-[11px] text-slate-300 italic leading-relaxed">
              &ldquo;Callisto is the most heavily cratered object in our solar system. Data from NASA’s Galileo reveals it may harbor a salty ocean beneath its ancient ice.&rdquo;
            </p>
            <div className="mt-1.5 text-[9px] font-mono text-slate-400 text-right">
              — NASA Jet Propulsion Laboratory
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Ultra-Detailed 3D Animated Callisto Moon Sphere */}
        <div className="relative flex-1 flex flex-col items-center justify-center order-1 lg:order-2">
          
          {/* Orbital Celestial Rings (Dynamic SVG) */}
          <div
            className="relative flex items-center justify-center"
            style={{
              transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
              transition: 'transform 0.15s ease-out',
            }}
          >
            {/* Outer Giant Ring Track */}
            <svg
              className="absolute w-[440px] h-[440px] sm:w-[560px] sm:h-[560px] pointer-events-none animate-spin-slow opacity-60"
              viewBox="0 0 400 400"
            >
              <ellipse
                cx="200"
                cy="200"
                rx="185"
                ry="75"
                fill="none"
                stroke="url(#preloaderOrbitGrad)"
                strokeWidth="1.2"
                strokeDasharray="4 6"
                transform="rotate(-28 200 200)"
              />
              <ellipse
                cx="200"
                cy="200"
                rx="155"
                ry="60"
                fill="none"
                stroke="rgba(56, 189, 248, 0.25)"
                strokeWidth="0.8"
                transform="rotate(35 200 200)"
              />
              {/* Telemetry Target reticle */}
              <circle cx="340" cy="140" r="3" fill="#38bdf8" className="animate-ping" />
              <defs>
                <linearGradient id="preloaderOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#1e293b" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>

            {/* Back Glow Behind Callisto */}
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-sky-500/20 via-amber-500/15 to-transparent blur-[50px] pointer-events-none" />

            {/* Moon Globe Container with Authentic NASA Galileo Surface Relief */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full shadow-[0_0_80px_rgba(56,189,248,0.3),inset_-30px_-30px_70px_rgba(0,0,0,0.85),inset_15px_15px_40px_rgba(125,211,252,0.35)] overflow-hidden border border-sky-400/50 bg-[#090e17]">
              
              {/* NASA Galileo Full Moon Disk Image Texture */}
              <div
                className="absolute inset-0 bg-cover bg-center rounded-full transition-transform duration-300"
                style={{
                  backgroundImage: `url('https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/2023/09/p/i/a/0/PIA03456-1.jpg?w=740&h=753')`,
                  transform: `rotate(${progress * 0.4}deg) scale(1.08)`,
                  filter: 'contrast(1.15) brightness(1.02) saturate(1.1)',
                }}
              />

              {/* Jovian Atmospheric Sunlight & Celestial Terminator Shadow */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(4, 7, 13, 0.4) 70%, rgba(3, 6, 12, 0.95) 95%)',
                }}
              />

              {/* Subsurface Ocean Magnetic Field Ionization Pulse */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none mix-blend-color-dodge transition-opacity duration-1000"
                style={{
                  opacity: progress > 50 && progress < 85 ? 0.35 : 0.08,
                  background: 'radial-gradient(circle at 45% 50%, rgba(56, 189, 248, 0.5) 0%, transparent 60%)',
                }}
              />

              {/* Atmospheric Limb Rim Light (Cyan ice glow + subtle amber Jovian reflection) */}
              <div className="absolute inset-0 rounded-full border-[2px] border-sky-400/40 pointer-events-none shadow-[inset_0_0_30px_rgba(56,189,248,0.45)]" />

              {/* Interactive Telemetry HUD Pins on the Moon Surface */}
              {CALLISTO_LANDMARKS.map((landmark, idx) => {
                const isSelected = activeLandmark === idx
                return (
                  <div
                    key={landmark.name}
                    className="absolute cursor-pointer transition-all duration-500"
                    style={{
                      left: `${landmark.x}%`,
                      top: `${landmark.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => setActiveLandmark(idx)}
                  >
                    <div className="relative flex items-center justify-center">
                      <span
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          isSelected
                            ? 'bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.9)] scale-125'
                            : 'bg-sky-400/80 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                        }`}
                      />
                      {isSelected && (
                        <span className="absolute w-6 h-6 rounded-full border border-amber-400/70 animate-ping pointer-events-none" />
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Scanner Grid Scanline beam traveling down */}
              <div
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/80 to-transparent pointer-events-none shadow-[0_0_15px_rgba(56,189,248,0.9)]"
                style={{
                  top: `${progress}%`,
                  transition: 'top 0.05s linear',
                }}
              />
            </div>

            {/* Target Reticle Crosshairs around the Globe */}
            <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-sky-400/60 pointer-events-none" />
            <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-sky-400/60 pointer-events-none" />
            <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-sky-400/60 pointer-events-none" />
            <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-sky-400/60 pointer-events-none" />
          </div>

          {/* Central Active Landmark HUD Tag */}
          <div className="mt-5 px-4 py-2 rounded-xl bg-slate-900/80 border border-sky-500/30 backdrop-blur-md max-w-md text-center shadow-xl">
            <div className="flex items-center justify-center gap-2 text-2xs font-mono text-sky-400 mb-0.5">
              <Compass className="w-3 h-3 text-amber-400" />
              <span>ACTIVE SURFACE TARGET: {CALLISTO_LANDMARKS[activeLandmark].coords}</span>
            </div>
            <div className="text-xs font-bold text-slate-100">
              {CALLISTO_LANDMARKS[activeLandmark].name} ({CALLISTO_LANDMARKS[activeLandmark].diameter})
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              {CALLISTO_LANDMARKS[activeLandmark].desc}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Mission System Diagnostics */}
        <div className="w-full lg:w-72 flex flex-col gap-3 order-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase tracking-wider mb-2 pb-2 border-b border-slate-800/70">
              <span className="flex items-center gap-1.5 text-amber-400">
                <ShieldCheck className="w-3 h-3" /> Core Security Matrix
              </span>
              <span>ZERO-TRUST</span>
            </div>

            <div className="space-y-2.5 font-mono text-[11px]">
              <div>
                <div className="text-[9px] text-slate-400 uppercase">Cryptographic Engine</div>
                <div className="text-slate-200 font-bold flex items-center justify-between">
                  <span>TLS 1.3 / AES-256</span>
                  <span className="text-emerald-400 text-[10px]">Active Handshake</span>
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-400 uppercase">Multi-Factor Auth (MFA)</div>
                <div className="text-slate-200 font-bold flex items-center justify-between">
                  <span>TOTP Time-Sync</span>
                  <span className="text-amber-400 text-[10px]">6-Digit Challenge</span>
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-400 uppercase">Role-Based Access</div>
                <div className="text-slate-200 font-bold flex items-center justify-between">
                  <span>ADMIN · MANAGER · SDR</span>
                  <span className="text-sky-300 text-[10px]">Strict RBAC</span>
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-400 uppercase">Inactivity Sentry</div>
                <div className="text-slate-200 font-bold flex items-center justify-between">
                  <span>15-Min Heartbeat</span>
                  <span className="text-emerald-400 text-[10px]">Auto-Logout Guard</span>
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-400 uppercase">Tamper-Proof Audit</div>
                <div className="text-slate-200 font-bold flex items-center justify-between">
                  <span>SHA-256 Ledger</span>
                  <span className="text-sky-400 text-[10px]">Zero Overwrite</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/70 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-sky-400">
                <Cpu className="w-3 h-3" /> AI Voice Engine
              </span>
              <span className="text-amber-300">ElevenLabs / Twilio</span>
            </div>
          </div>

          {/* Interactive Feature Selectors */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-1">
            {CALLISTO_LANDMARKS.map((item, i) => (
              <button
                key={item.name}
                onClick={() => setActiveLandmark(i)}
                className={`flex-1 py-1.5 px-1 rounded text-[10px] font-mono transition-all truncate text-center ${
                  activeLandmark === i
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* ================= BOTTOM LOADING ENGINE FOOTER ================= */}
      <footer className="relative z-20 px-6 py-5 border-t border-sky-500/10 backdrop-blur-md bg-[#04070d]/80">
        <div className="max-w-4xl mx-auto w-full">
          
          {/* Status Text & Progress Percentage */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span className="text-xs font-mono font-bold tracking-wider text-sky-300">
                {currentStage.text}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400 text-[10px] hidden sm:inline">
                {currentStage.detail}
              </span>
              <span className="font-bold text-amber-400 text-sm">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* High-Tech Glowing Progress Bar with Stage Segment Ticks */}
          <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/60 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-sky-500 via-sky-400 to-amber-400 rounded-full transition-all duration-75 shadow-[0_0_15px_rgba(56,189,248,0.8)]"
              style={{ width: `${progress}%` }}
            />
            {/* Stage Divider Markers */}
            <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5">
              <div className="w-0.5 h-full bg-black/40" />
              <div className="w-0.5 h-full bg-black/40" />
              <div className="w-0.5 h-full bg-black/40" />
              <div className="w-0.5 h-full bg-black/40" />
              <div className="w-0.5 h-full bg-black/40" />
            </div>
          </div>

          {/* Stage steps indicators */}
          <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>NASA Galileo Imagery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Valhalla Crater Topography</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Subsurface Saline Ocean</span>
            </div>
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Zero-Trust Enterprise Terminal</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  )
}
