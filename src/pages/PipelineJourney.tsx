import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Workflow, Globe, Radar, Zap, CheckCircle, PhoneCall, MessageSquare,
  Sparkles, Star, Calendar, ExternalLink, ArrowRight, Play, Pause,
  RotateCcw, Volume2, ShieldCheck, Mail, Building2, User, Phone, Check, Link
} from 'lucide-react'
import { useAppContext } from '@/contexts/AppContext'
import { useToast } from '@/contexts/ToastContext'

interface PipelineStep {
  number: number
  id: string
  title: string
  shortTitle: string
  desc: string
  icon: any
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
}

const pipelineSteps: PipelineStep[] = [
  { number: 1, id: 'understand', title: 'Understand Business & Products', shortTitle: '1. Understand', desc: 'Scan company URL, offerings, documents & ICP personas', icon: Globe, status: 'COMPLETED' },
  { number: 2, id: 'discover',   title: 'Discover Public Requirements & Leads', shortTitle: '2. Discover', desc: 'Crawl LinkedIn & public directories with source transparency', icon: Radar, status: 'COMPLETED' },
  { number: 3, id: 'enrich',     title: 'Automated Lead Enrichment', shortTitle: '3. Enrich', desc: 'Verify email, phone, company size, tech stack & funding', icon: Zap, status: 'COMPLETED' },
  { number: 4, id: 'qualify',    title: 'AI BANT Qualification', shortTitle: '4. Qualify', desc: 'Evaluate Budget, Authority, Need, and Timeline fit', icon: CheckCircle, status: 'COMPLETED' },
  { number: 5, id: 'call',       title: 'Multilingual AI Voice Call', shortTitle: '5. AI Call', desc: 'Autonomous outbound voice agent with speech synthesis', icon: PhoneCall, status: 'IN_PROGRESS' },
  { number: 6, id: 'response',   title: 'Capture Live Response & FAQs', shortTitle: '6. Capture Response', desc: 'Handle prospect replies, objection FAQs & voicemail drop', icon: MessageSquare, status: 'IN_PROGRESS' },
  { number: 7, id: 'transcript', title: 'Live Transcript & Insights', shortTitle: '7. Transcript', desc: 'Sentiment classification, buying signals & next-best action', icon: Sparkles, status: 'PENDING' },
  { number: 8, id: 'identify',   title: 'Identify Interested Prospects', shortTitle: '8. Highlight Lead', desc: 'Tag high-intent prospects who expressed buying interest', icon: Star, status: 'PENDING' },
  { number: 9, id: 'followup',   title: 'Enable Seamless Follow-up', shortTitle: '9. Follow-up', desc: 'One-click calendar demo booking & CRM synchronization', icon: Calendar, status: 'PENDING' },
]

export function PipelineJourney() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { language, t } = useAppContext()

  const [activeStep, setActiveStep] = useState(5)
  const [isPlayingAuto, setIsPlayingAuto] = useState(false)
  const [speechActive, setSpeechActive] = useState(false)
  const autoPlayTimerRef = useRef<number | null>(null)

  // Demo prospect details
  const prospect = {
    name: 'Rahul Mehta',
    jobTitle: 'VP of Technology & Inside Sales',
    company: 'Acme Digital Solutions',
    country: 'India',
    location: 'Bangalore, India',
    email: 'rahul.mehta@acmedigital.com',
    phone: '+91 98201 44892',
    source: 'LinkedIn Public Post',
    sourceUrl: 'https://linkedin.com/feed/update/urn:li:activity:78921094821',
    requirement: 'Urgent: Looking to implement AI conversational calling for our SDR pipeline by next quarter. Need solution with CRM integration and low latency.',
    intentScore: 94,
    techStack: ['Salesforce', 'Twilio', 'AWS', 'Python'],
    funding: 'Series B — $18M',
    employees: 340,
    sentiment: 'POSITIVE',
    callOutcome: 'MEETING_BOOKED',
    nextBestAction: 'Schedule technical discovery demo with Solution Architect within 24h.',
    buyingSignals: [
      'Confirmed budget allocated for enterprise sales automation',
      'Expressed urgency to launch outbound pilot next quarter',
      'Requested technical calendar demonstration for sales team',
    ],
    objections: ['Asked about CRM sync latency with Salesforce'],
    dialogue: [
      { speaker: 'AI', text: 'Hello Rahul, this is Aria calling from Callisto AI Solutions. Am I speaking with the VP of Technology at Acme Digital?' },
      { speaker: 'PROSPECT', text: 'Yes, Rahul here. What is this regarding?' },
      { speaker: 'AI', text: 'I noticed your public requirement regarding deploying AI conversational voice calling for your sales pipeline. We help teams like Acme Digital automate outbound qualification with 30%+ conversion. Do you have 2 minutes?' },
      { speaker: 'PROSPECT', text: 'Sure! We are actively looking at options. Does your voice agent support live FAQ handling and direct Salesforce sync?' },
      { speaker: 'AI', text: 'Absolutely! Our voice agent grounds directly on your product docs to answer technical FAQs in real-time, and bi-directionally syncs all call transcripts and meeting notes into Salesforce within 5 seconds.' },
      { speaker: 'PROSPECT', text: 'That sounds impressive. Can we schedule a 20-minute technical demonstration this Tuesday at 11 AM IST?' },
      { speaker: 'AI', text: 'Perfect! I have reserved Tuesday at 11:00 AM IST for your executive demo. A calendar invite and summary have been dispatched to rahul.mehta@acmedigital.com.' },
    ],
  }

  // Web Speech API execution
  function speakSentence(text: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      if (language === 'hi') utterance.lang = 'hi-IN'
      else if (language === 'gu') utterance.lang = 'gu-IN'
      else utterance.lang = 'en-US'

      utterance.rate = 1.05
      utterance.onstart = () => setSpeechActive(true)
      utterance.onend = () => setSpeechActive(false)
      utterance.onerror = () => setSpeechActive(false)
      window.speechSynthesis.speak(utterance)
    }
  }

  function handleAutoPlayToggle() {
    if (isPlayingAuto) {
      setIsPlayingAuto(false)
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    } else {
      setIsPlayingAuto(true)
      showToast('info', 'Autonomous Pipeline Started', 'Auto-executing 9-step sales engine journey...')
      autoPlayTimerRef.current = window.setInterval(() => {
        setActiveStep(prev => {
          if (prev >= 9) {
            setIsPlayingAuto(false)
            if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current)
            showToast('success', 'Pipeline Completed!', 'Prospect qualified, meeting booked & synced to CRM')
            return 9
          }
          return prev + 1
        })
      }, 3500)
    }
  }

  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  return (
    <div className="p-3 sm:p-4 space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-amber-400 shrink-0" />
            <h1 className="text-sm font-bold text-text-primary">
              Autonomous Sales Pipeline Journey (9-Stage Engine)
            </h1>
            <span className="badge-success text-2xs animate-pulse">AUTONOMOUS</span>
          </div>
          <p className="text-2xs text-text-muted mt-0.5">
            Understand Business → Discover Requirements & Leads → Enrich → Qualify → AI Call → Capture Response → Transcript & Insights → Identify Interested Prospects → Enable Follow-up
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoPlayToggle}
            className={`btn-primary text-xs gap-1.5 py-1.5 ${isPlayingAuto ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
          >
            {isPlayingAuto ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlayingAuto ? 'Pause Simulation' : 'Run Full Autonomous Pipeline'}
          </button>
          <button
            onClick={() => { setActiveStep(1); setIsPlayingAuto(false) }}
            className="btn-secondary text-xs gap-1 p-2"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stepper Navigation Bar */}
      <div className="panel p-2.5 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1.5 min-w-[720px]">
          {pipelineSteps.map(step => {
            const Icon = step.icon
            const isCurrent = activeStep === step.number
            const isDone = activeStep > step.number

            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.number)}
                className={`flex-1 flex items-center gap-2 p-2 rounded text-left transition-all border ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-400'
                    : isDone
                    ? 'bg-bg-card border-success/30 text-success'
                    : 'bg-bg-secondary border-bg-border text-text-muted hover:border-bg-hover'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold shrink-0 ${
                  isCurrent
                    ? 'bg-amber-500 text-black'
                    : isDone
                    ? 'bg-success text-black'
                    : 'bg-bg-border text-text-muted'
                }`}>
                  {isDone ? <Check className="w-3 h-3" /> : step.number}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{step.shortTitle}</div>
                  <div className="text-3xs text-text-muted truncate">{isDone ? 'Completed' : isCurrent ? 'Active Now' : 'Upcoming'}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Stage Detail & Live Experience */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Step Visual Workspace */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stage 1: Understand Business */}
          {activeStep === 1 && (
            <div className="panel p-5 space-y-4 animate-fade-in border-amber-500/30">
              <div className="flex items-center justify-between border-b border-bg-border pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-text-primary">Step 1: Understand Business & Ideal Customer Profile</span>
                </div>
                <span className="badge-success text-2xs">ANALYZED</span>
              </div>
              <div className="p-3 bg-bg-card rounded-lg border border-bg-border space-y-2">
                <div className="text-xs font-semibold text-text-primary">Corporate Website Analyzed</div>
                <p className="text-xs font-mono text-amber-400">https://callistoai.com</p>
                <p className="text-2xs text-text-secondary leading-relaxed">
                  AI crawler successfully ingested value propositions, pricing tiers, pitch decks, and technical FAQs.
                  Grounded the AI Voice Agent to represent your company with high domain fidelity.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                  <div className="text-2xs text-text-muted uppercase font-bold">Target Personas Identified</div>
                  <div className="mt-1 text-xs font-semibold text-text-primary">VP Sales, CTO, Head of Revenue Ops</div>
                </div>
                <div className="p-3 bg-bg-secondary rounded border border-bg-border">
                  <div className="text-2xs text-text-muted uppercase font-bold">Search Keywords Synthesized</div>
                  <div className="mt-1 text-xs font-semibold text-text-primary">AI calling, automated sales SDR, pipeline qualification</div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => setActiveStep(2)} className="btn-primary text-xs gap-1">
                  Next: Discover Public Leads <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Stage 2: Discover Public Leads */}
          {activeStep === 2 && (
            <div className="panel p-5 space-y-4 animate-fade-in border-amber-500/30">
              <div className="flex items-center justify-between border-b border-bg-border pb-3">
                <div className="flex items-center gap-2">
                  <Radar className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-text-primary">Step 2: Discover Requirements & Leads (Source Transparency)</span>
                </div>
                <span className="badge-blue text-2xs">PUBLIC PROVENANCE</span>
              </div>
              <div className="p-4 bg-bg-card rounded-lg border border-bg-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="badge-blue text-3xs font-mono">{prospect.source}</span>
                    <span className="text-2xs text-text-muted font-mono">Discovered 2 hours ago</span>
                  </div>
                  <a href={prospect.sourceUrl} target="_blank" rel="noreferrer" className="text-2xs text-amber-400 hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> View Public Post
                  </a>
                </div>
                <div className="p-3 bg-bg-secondary rounded border border-bg-border/60 text-xs italic text-text-primary leading-relaxed">
                  "{prospect.requirement}"
                </div>
                <div className="flex items-center justify-between text-2xs text-text-muted">
                  <span>Author: <strong className="text-text-primary">{prospect.name}</strong> ({prospect.jobTitle})</span>
                  <span>Company: <strong className="text-text-primary">{prospect.company}</strong></span>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setActiveStep(1)} className="btn-secondary text-xs">Back</button>
                <button onClick={() => setActiveStep(3)} className="btn-primary text-xs gap-1">
                  Next: Enrich Lead Data <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Stage 3: Lead Enrichment */}
          {activeStep === 3 && (
            <div className="panel p-5 space-y-4 animate-fade-in border-amber-500/30">
              <div className="flex items-center justify-between border-b border-bg-border pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-text-primary">Step 3: Automated Lead Enrichment</span>
                </div>
                <span className="badge-success text-2xs">100% VERIFIED</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-bg-card rounded border border-bg-border space-y-1">
                  <span className="text-2xs text-text-muted">Verified Business Email</span>
                  <div className="font-mono text-text-primary">{prospect.email}</div>
                </div>
                <div className="p-3 bg-bg-card rounded border border-bg-border space-y-1">
                  <span className="text-2xs text-text-muted">Direct Telephony Number</span>
                  <div className="font-mono text-text-primary">{prospect.phone}</div>
                </div>
                <div className="p-3 bg-bg-card rounded border border-bg-border space-y-1">
                  <span className="text-2xs text-text-muted">Funding Stage</span>
                  <div className="text-text-primary">{prospect.funding}</div>
                </div>
                <div className="p-3 bg-bg-card rounded border border-bg-border space-y-1">
                  <span className="text-2xs text-text-muted">Company Size</span>
                  <div className="text-text-primary">{prospect.employees} Employees</div>
                </div>
              </div>
              <div className="p-3 bg-bg-card rounded border border-bg-border space-y-1">
                <span className="text-2xs text-text-muted">Detected Tech Stack</span>
                <div className="flex gap-1.5 pt-1">
                  {prospect.techStack.map(t => (
                    <span key={t} className="badge-blue text-2xs font-mono">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setActiveStep(2)} className="btn-secondary text-xs">Back</button>
                <button onClick={() => setActiveStep(4)} className="btn-primary text-xs gap-1">
                  Next: AI BANT Qualification <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Stage 4: AI Qualification */}
          {activeStep === 4 && (
            <div className="panel p-5 space-y-4 animate-fade-in border-amber-500/30">
              <div className="flex items-center justify-between border-b border-bg-border pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-text-primary">Step 4: AI BANT Qualification</span>
                </div>
                <span className="badge-success text-2xs">SCORE: {prospect.intentScore}/100</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-bg-card rounded border border-bg-border">
                  <div className="text-2xs text-text-muted">Budget</div>
                  <div className="text-sm font-bold text-success font-mono">92/100</div>
                </div>
                <div className="p-2.5 bg-bg-card rounded border border-bg-border">
                  <div className="text-2xs text-text-muted">Authority</div>
                  <div className="text-sm font-bold text-success font-mono">96/100</div>
                </div>
                <div className="p-2.5 bg-bg-card rounded border border-bg-border">
                  <div className="text-2xs text-text-muted">Need Clarity</div>
                  <div className="text-sm font-bold text-amber-400 font-mono">95/100</div>
                </div>
                <div className="p-2.5 bg-bg-card rounded border border-bg-border">
                  <div className="text-2xs text-text-muted">Timeline</div>
                  <div className="text-sm font-bold text-success font-mono">94/100</div>
                </div>
              </div>
              <div className="p-3 bg-success/10 border border-success/30 rounded text-xs text-text-primary leading-relaxed">
                <strong>AI Recommendation:</strong> High-intent buyer confirmed. Senior VP decision maker with urgent project timeline. Immediate AI voice call recommended.
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setActiveStep(3)} className="btn-secondary text-xs">Back</button>
                <button onClick={() => setActiveStep(5)} className="btn-primary text-xs gap-1">
                  Next: Initiate AI Voice Call <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Stage 5 & 6: AI Voice Call & Live Response Handling */}
          {(activeStep === 5 || activeStep === 6) && (
            <div className="panel p-5 space-y-4 animate-fade-in border-amber-500/40">
              <div className="flex items-center justify-between border-b border-bg-border pb-3">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span className="text-xs font-bold text-text-primary">
                    {activeStep === 5 ? 'Step 5: Multilingual AI Voice Call Active' : 'Step 6: Live Response Handling & Grounded FAQs'}
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-2xs text-success font-mono">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> LIVE CALL (02:18)
                </span>
              </div>

              {/* Audio Waveform Simulator */}
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-bg-card to-amber-500/10 rounded-lg border border-amber-500/30 flex flex-col items-center justify-center space-y-3">
                <div className="flex items-center gap-1 h-8">
                  {[40, 70, 90, 30, 80, 100, 60, 45, 85, 95, 40, 70, 90, 60, 30, 80].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-amber-400 rounded-full transition-all duration-300"
                      style={{ height: `${speechActive ? h : Math.max(15, h * 0.3)}%` }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => speakSentence('Hello Rahul, this is Aria calling from Callisto AI Solutions. We help automate SDR pipeline qualification. Can we schedule a 20-minute demonstration?')}
                    className="btn-primary text-2xs gap-1.5 py-1 px-3"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Listen to AI Voice Agent
                  </button>
                  <span className="text-3xs text-text-muted font-mono">Neural Voice: Aria (Natural Conversational)</span>
                </div>
              </div>

              {/* Live transcript snippet */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {prospect.dialogue.slice(0, activeStep === 5 ? 4 : 7).map((line, i) => (
                  <div key={i} className={`p-2.5 rounded text-2xs leading-relaxed ${line.speaker === 'AI' ? 'bg-amber-500/10 border border-amber-500/30 text-text-primary' : 'bg-blue-500/10 border border-blue-500/30 text-blue-200'}`}>
                    <span className="font-bold text-text-muted mr-1.5">{line.speaker === 'AI' ? 'AI Voice Agent:' : `${prospect.name}:`}</span>
                    {line.text}
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setActiveStep(activeStep - 1)} className="btn-secondary text-xs">Back</button>
                <button onClick={() => setActiveStep(activeStep + 1)} className="btn-primary text-xs gap-1">
                  Next: {activeStep === 5 ? 'Capture Response' : 'View Insights & Sentiment'} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Stage 7: Transcript & Insights */}
          {activeStep === 7 && (
            <div className="panel p-5 space-y-4 animate-fade-in border-amber-500/30">
              <div className="flex items-center justify-between border-b border-bg-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-text-primary">Step 7: AI Call Transcript & NLP Insights</span>
                </div>
                <span className="badge-success text-2xs">SENTIMENT: POSITIVE</span>
              </div>
              <div className="p-3 bg-bg-card rounded-lg border border-bg-border space-y-2">
                <div className="text-2xs uppercase tracking-wide text-text-muted font-bold">Extracted Buying Signals</div>
                <ul className="space-y-1">
                  {prospect.buyingSignals.map((s, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-success">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-text-primary space-y-1">
                <div className="text-2xs text-amber-400 font-bold uppercase tracking-wider">Next Best Action</div>
                <div>{prospect.nextBestAction}</div>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setActiveStep(6)} className="btn-secondary text-xs">Back</button>
                <button onClick={() => setActiveStep(8)} className="btn-primary text-xs gap-1">
                  Next: Highlight Interested Prospect <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Stage 8: Identify Interested Prospects */}
          {activeStep === 8 && (
            <div className="panel p-5 space-y-4 animate-fade-in border-emerald-500/40">
              <div className="flex items-center justify-between border-b border-bg-border pb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span className="text-xs font-bold text-text-primary">Step 8: Identify & Highlight Interested Prospects</span>
                </div>
                <span className="badge-success text-2xs">PRIORITY 1 — READY TO CLOSE</span>
              </div>
              <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-bg-card to-emerald-500/10 rounded-lg border border-emerald-500/40 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-text-primary flex items-center gap-2">
                      {prospect.name}
                      <span className="badge-high text-3xs">HOT LEAD</span>
                    </div>
                    <div className="text-xs text-text-muted">{prospect.jobTitle} · {prospect.company}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-success">98%</div>
                    <div className="text-3xs text-text-muted">Conversion Fit</div>
                  </div>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Prospect demonstrated urgent buyer intent during outbound AI voice consultation. Budget confirmed. Calendar meeting agreed for Tuesday 11:00 AM IST.
                </p>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setActiveStep(7)} className="btn-secondary text-xs">Back</button>
                <button onClick={() => setActiveStep(9)} className="btn-primary text-xs gap-1">
                  Next: Enable Follow-up & CRM Sync <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Stage 9: Enable Follow-up */}
          {activeStep === 9 && (
            <div className="panel p-5 space-y-4 animate-fade-in border-success/40">
              <div className="flex items-center justify-between border-b border-bg-border pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-success" />
                  <span className="text-xs font-bold text-text-primary">Step 9: Enable Seamless Follow-up & CRM Handoff</span>
                </div>
                <span className="badge-success text-2xs">COMPLETED</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-bg-card rounded-lg border border-bg-border space-y-1 text-center">
                  <Calendar className="w-5 h-5 text-amber-400 mx-auto" />
                  <div className="text-xs font-bold text-text-primary mt-1">Calendar Demo Booked</div>
                  <div className="text-2xs text-text-muted">Tuesday 11:00 AM IST</div>
                </div>
                <div className="p-3 bg-bg-card rounded-lg border border-bg-border space-y-1 text-center">
                  <Link className="w-5 h-5 text-blue-400 mx-auto" />
                  <div className="text-xs font-bold text-text-primary mt-1">Salesforce CRM Synced</div>
                  <div className="text-2xs text-text-muted">Opportunity #OPP-8921</div>
                </div>
                <div className="p-3 bg-bg-card rounded-lg border border-bg-border space-y-1 text-center">
                  <Mail className="w-5 h-5 text-success mx-auto" />
                  <div className="text-xs font-bold text-text-primary mt-1">Proposal Dispatched</div>
                  <div className="text-2xs text-text-muted">To {prospect.email}</div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-bg-border">
                <button onClick={() => setActiveStep(1)} className="btn-secondary text-xs">Restart Pipeline</button>
                <div className="flex gap-2">
                  <button onClick={() => navigate('/pipeline')} className="btn-secondary text-xs">View In Pipeline</button>
                  <button onClick={() => navigate('/crm')} className="btn-primary text-xs">View in CRM</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Prospect Profile & Live Telemetry */}
        <div className="space-y-4">
          <div className="panel p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-bg-border pb-2.5">
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" /> Current Prospect
              </span>
              <span className="badge-high text-3xs font-mono">HIGH INTENT</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                RM
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-text-primary truncate">{prospect.name}</div>
                <div className="text-3xs text-text-muted truncate">{prospect.jobTitle}</div>
                <div className="text-3xs text-text-secondary truncate">{prospect.company} · {prospect.location}</div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-bg-border text-2xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Email:</span>
                <span className="font-mono text-text-primary">{prospect.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Phone:</span>
                <span className="font-mono text-text-primary">{prospect.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Public Source:</span>
                <span className="badge-blue text-3xs">{prospect.source}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Intent Score:</span>
                <span className="font-mono font-bold text-amber-400">{prospect.intentScore}/100</span>
              </div>
            </div>
          </div>

          <div className="panel p-4 space-y-2.5">
            <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Autonomous Guardrails
            </div>
            <div className="space-y-1.5 text-2xs text-text-secondary">
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-success shrink-0" /> Grounded on corporate catalog
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-success shrink-0" /> Public data source transparency
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-success shrink-0" /> Automated callback scheduling
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-success shrink-0" /> Answering machine voicemail drop
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-success shrink-0" /> TLS 1.3 & AES-256 encrypted logs
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
