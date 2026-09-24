import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  PhoneCall, Phone, Circle, X, Calendar, Server,
  Sliders, CheckCircle, Volume2, Sparkles, Star,
  Mic, ArrowRight, User, FastForward, RotateCcw,
  Zap, PhoneOff, Send, MessageSquare, ShieldCheck,
  PhoneIncoming, PhoneOutgoing, Voicemail, Clock,
  HelpCircle, Check, MessageCircle, FileText
} from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { calls, type Call } from '@/data/calls'
import { leads, type Lead } from '@/data/leads'
import { formatDuration, formatTimestamp } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { useAppContext } from '@/contexts/AppContext'
import { useLeads } from '@/contexts/LeadContext'

// Active calling floor items
const liveCalls = [
  { id: 'LC1', prospect: 'Rahul Mehta',         company: 'Acme Digital Solutions',    location: 'Bangalore, India', duration: 247, sentiment: 'POSITIVE', qualification: 'QUALIFIED',    stage: 'Presenting solution', lang: 'English' },
  { id: 'LC2', prospect: 'Sarah Johnson',       company: 'NexaFinance Corp',          location: 'New York, USA',     duration: 183, sentiment: 'POSITIVE', qualification: 'QUALIFIED',    stage: 'Scheduling meeting',  lang: 'English' },
  { id: 'LC3', prospect: 'Mohammed Al-Rashidi', company: 'Emirates Future Tech',      location: 'Dubai, UAE',        duration: 94,  sentiment: 'NEUTRAL',  qualification: 'LIKELY',       stage: 'Needs assessment',    lang: 'Arabic' },
  { id: 'LC4', prospect: 'Kavitha Reddy',       company: 'Bharat Insurance Group',   location: 'Hyderabad, India',  duration: 312, sentiment: 'POSITIVE', qualification: 'QUALIFIED',    stage: 'Demo in progress',    lang: 'Hindi' },
  { id: 'LC5', prospect: 'Oliver Schmidt',      company: 'Deutech Manufacturing',    location: 'Munich, Germany',   duration: 61,  sentiment: 'NEUTRAL',  qualification: 'NEEDS_REVIEW', stage: 'Objection handling',  lang: 'German' },
  { id: 'LC6', prospect: 'Priya Sharma',        company: 'TechVenture Labs',          location: 'Mumbai, India',     duration: 142, sentiment: 'POSITIVE', qualification: 'LIKELY',       stage: 'Qualification Q&A',   lang: 'Hindi' },
]

// Interested Prospects list matching Screenshot 5 exactly
const interestedProspectsList = [
  {
    id: 'IP-1',
    name: 'Rahul Mehta',
    company: 'Acme Digital Solutions',
    phone: '+91 98201 44892',
    email: 'rahul.mehta@acmedigital.com',
    sentiment: 'POSITIVE',
    score: 95,
    outcome: 'Meeting Agreed for Tuesday 11 AM IST',
    nextAction: 'Send calendar invite & technical proposal',
    signals: ['Budget allocated', 'Urgent Q4 project', 'Decision maker'],
  },
  {
    id: 'IP-2',
    name: 'Sarah Johnson',
    company: 'NexaFinance Corp',
    phone: '+1 (415) 892-0192',
    email: 'sarah.j@nexafinance.com',
    sentiment: 'POSITIVE',
    score: 93,
    outcome: 'Demo requested for executive team',
    nextAction: 'Prepare custom enterprise security deck',
    signals: ['Evaluating 3 vendors', 'High volume SDR team'],
  },
  {
    id: 'IP-3',
    name: 'Kavitha Reddy',
    company: 'Bharat Insurance Group',
    phone: '+91 94401 22819',
    email: 'kavitha.r@bharatinsure.com',
    sentiment: 'POSITIVE',
    score: 91,
    outcome: 'Requested callback with Solution Architect',
    nextAction: 'Schedule technical callback for Thursday 3 PM',
    signals: ['Enterprise migration', 'Looking for Hindi support'],
  },
]

function getCallForLiveCall(call: typeof liveCalls[0], activeAgentName: string = 'Aria (Enterprise SDR)'): Call {
  const existing = calls.find(c => c.prospect.toLowerCase() === call.prospect.toLowerCase())
  const cleanName = activeAgentName.replace(/\s*\(.*\)/, '').trim() || activeAgentName.trim() || 'Aria'

  if (existing) {
    return {
      ...existing,
      agent: activeAgentName,
      duration: call.duration,
      sentiment: call.sentiment as any,
      qualification: call.qualification as any,
    }
  }
  return {
    id: call.id,
    timestamp: new Date(),
    prospect: call.prospect,
    company: call.company,
    agent: activeAgentName,
    campaignId: 'C001',
    duration: call.duration,
    outcome: 'ANSWERED',
    sentiment: call.sentiment as any,
    intent: 'HIGH',
    qualification: call.qualification as any,
    recording: true,
    summary: `Live AI qualification call in progress with ${call.prospect} from ${call.company}. Current stage: ${call.stage}. Sentiment is ${call.sentiment}.`,
    nextBestAction: `Continue guided qualification. Current stage: ${call.stage}.`,
    buyingSignals: ['Engaged prospect', 'Confirmed active requirement', 'Reviewing timeline and budget'],
    objections: call.sentiment === 'NEGATIVE' ? ['Timeline constraints'] : [],
    transcript: [
      { speaker: 'AI', text: `Hello, am I speaking with ${call.prospect}?`, timestamp: '00:00:03' },
      { speaker: 'PROSPECT', text: `Yes, this is ${call.prospect}. What is this regarding?`, timestamp: '00:00:08', sentiment: 'NEUTRAL' },
      { speaker: 'AI', text: `Hi! I'm ${cleanName} calling from Callisto AI Solutions. We help companies like ${call.company} automate sales qualification and pipeline growth. Do you have 2 minutes?`, timestamp: '00:00:15' },
      { speaker: 'PROSPECT', text: `Sure, we actually have an active evaluation around this.`, timestamp: '00:00:26', sentiment: call.sentiment as any },
      { speaker: 'AI', text: `That's great! Current focus is ${call.stage.toLowerCase()} — let me walk you through our platform highlights.`, timestamp: '00:00:35' },
    ],
  }
}

import {
  generateGeminiSalesResponse,
  generateGeminiCallAnalysis,
  type ConversationTurn,
  type CallAnalysisResult,
  DISPLAY_ENGINE_LABEL
} from '@/services/geminiService'

export function AIVoiceAgent() {
  const { showToast } = useToast()
  const { language, t, businessProfile } = useAppContext()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const leadParam = searchParams.get('lead')

  // Context leads for seamless integration with other pages
  let leadsList: Lead[] = leads
  try {
    const leadsCtx = useLeads()
    if (leadsCtx && leadsCtx.leadsList && leadsCtx.leadsList.length > 0) {
      leadsList = leadsCtx.leadsList
    }
  } catch {
    leadsList = leads
  }

  const initialProspectName = useMemo(() => {
    if (leadParam) {
      const match = leadsList.find(l => l.id === leadParam)
      if (match) return match.name
    }
    return 'Rohan Verma'
  }, [leadParam, leadsList])

  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [callStudioOpen, setCallStudioOpen] = useState(Boolean(leadParam))

  // Configuration settings
  const [telephonyMode, setTelephonyMode] = useState<'BUILTIN' | 'BYO'>('BUILTIN')
  const [carrierProvider, setCarrierProvider] = useState('Twilio')
  const [agentName, setAgentName] = useState('Aria (Enterprise SDR)')
  const [outboundLang, setOutboundLang] = useState('English (US)')
  const [voiceStyle, setVoiceStyle] = useState('Professional Female (Natural Neural)')
  const [voiceSpeed, setVoiceSpeed] = useState('1.0x (Natural)')
  const [voicemailDrop, setVoicemailDrop] = useState(true)
  const [autoCallback, setAutoCallback] = useState(true)
  const [maxRetries, setMaxRetries] = useState('3')

  // Inbound vs Outbound mode & Automation Actions
  const [callDirection, setCallDirection] = useState<'OUTBOUND' | 'INBOUND'>('OUTBOUND')
  const [retryAttempt, setRetryAttempt] = useState<number>(1)
  const [showCallbackModal, setShowCallbackModal] = useState<boolean>(false)
  const [showFaqDrawer, setShowFaqDrawer] = useState<boolean>(false)
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false)
  const [selectedProspectForDemo, setSelectedProspectForDemo] = useState<any>(null)

  // Interactive Gemini Call Studio State
  const [geminiEnabled, setGeminiEnabled] = useState(true)
  const [prospectName, setProspectName] = useState(initialProspectName)
  const [simLanguage, setSimLanguage] = useState<'English' | 'Hindi' | 'Gujarati' | 'German' | 'Arabic'>('English')
  const [simScenario, setSimScenario] = useState('Engaged & Interested (Demo)')
  const [callStatus, setCallStatus] = useState<'IDLE' | 'IN_PROGRESS' | 'COMPLETED'>('IN_PROGRESS')
  const [callDurationSec, setCallDurationSec] = useState(37) // Initial realistic progress
  const [speechActive, setSpeechActive] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [isAiResponding, setIsAiResponding] = useState(false)

  // Clean agent name
  const cleanAgentName = agentName.replace(/\s*\(.*\)/, '').trim() || agentName.trim() || 'Aria'

  // Transcript state initialized matching Screenshot 1
  const [transcript, setTranscript] = useState<ConversationTurn[]>(() => [
    {
      speaker: 'AI',
      text: `Hi ${initialProspectName}, this is ${cleanAgentName} from ${businessProfile.companyName || 'Callisto AI Solutions'} — we help companies like Acme Digital Solutions automate sales calls with AI. Do you have 2 minutes?`,
      time: '00:00'
    }
  ])

  // Call Analysis state matching Screenshot 4
  const [analysisResult, setAnalysisResult] = useState<CallAnalysisResult | null>(null)

  const callTimerRef = useRef<number | null>(null)
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null)
  const lastSpokenTextRef = useRef<string>('')

  // Sync initial prospect name if URL lead parameter arrives
  useEffect(() => {
    if (leadParam) {
      const match = leadsList.find(l => l.id === leadParam)
      if (match) {
        setProspectName(match.name)
        setCallStudioOpen(true)
      }
    }
  }, [leadParam, leadsList])

  // Call duration timer
  useEffect(() => {
    if (callStudioOpen && callStatus === 'IN_PROGRESS') {
      callTimerRef.current = window.setInterval(() => {
        setCallDurationSec(prev => prev + 1)
      }, 1000)
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
    }
  }, [callStudioOpen, callStatus])

  // Scroll transcript to bottom when new messages arrive
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight
    }
  }, [transcript, isAiResponding])

  // Speech synthesis function
  function speakTurn(text: string, onComplete?: () => void) {
    lastSpokenTextRef.current = text
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        if (simLanguage === 'Hindi') utterance.lang = 'hi-IN'
        else if (simLanguage === 'Gujarati') utterance.lang = 'gu-IN'
        else utterance.lang = 'en-US'

        utterance.rate = 1.02
        utterance.pitch = 1.0

        utterance.onstart = () => setSpeechActive(true)
        utterance.onend = () => {
          setSpeechActive(false)
          onComplete?.()
        }
        utterance.onerror = () => {
          setSpeechActive(false)
          onComplete?.()
        }

        window.speechSynthesis.speak(utterance)
      } catch (err) {
        setSpeechActive(false)
        onComplete?.()
      }
    } else {
      onComplete?.()
    }
  }

  // Format seconds into "0m 37s" or "2m 25s" matching screenshots
  function formatStudioDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs.toString().padStart(2, '0')}s`
  }

  // Format timestamp for transcript turns ("01:18", "03:21")
  function formatTurnTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Send prospect message and trigger Gemini AI response
  async function handleSendMessage(customMsg?: string) {
    const msgToSend = (customMsg !== undefined ? customMsg : userInput).trim()
    if (!msgToSend || isAiResponding || callStatus !== 'IN_PROGRESS') return

    setUserInput('')
    const currentTime = formatTurnTime(callDurationSec)

    // Add Prospect turn
    const updatedTurns: ConversationTurn[] = [
      ...transcript,
      {
        speaker: 'PROSPECT',
        text: msgToSend,
        time: currentTime
      }
    ]
    setTranscript(updatedTurns)
    setIsAiResponding(true)

    // Generate AI response
    try {
      const result = await generateGeminiSalesResponse(
        updatedTurns,
        prospectName,
        cleanAgentName,
        msgToSend,
        simLanguage
      )

      // Advance call duration slightly for realism
      setCallDurationSec(prev => prev + Math.floor(Math.random() * 8) + 5)
      const aiTime = formatTurnTime(callDurationSec + 8)

      const finalTurns: ConversationTurn[] = [
        ...updatedTurns,
        {
          speaker: 'AI',
          text: result.text,
          time: aiTime,
          isGemini: result.isGemini
        }
      ]
      setTranscript(finalTurns)
      setIsAiResponding(false)

      // Speak aloud
      speakTurn(result.text)
    } catch (err) {
      setIsAiResponding(false)
    }
  }

  // End Call & Analyze (Screenshot 4)
  async function handleEndCallAndAnalyze() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSpeechActive(false)
    setCallStatus('COMPLETED')
    if (callTimerRef.current) clearInterval(callTimerRef.current)

    // Run analysis
    const analysis = await generateGeminiCallAnalysis(transcript, prospectName, callDurationSec)
    setAnalysisResult(analysis)
    showToast('info', 'Call Ended', `Analysis ready for ${prospectName}`)
  }

  // Start a new call in studio
  function handleStartNewCall() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSpeechActive(false)
    setCallStatus('IN_PROGRESS')
    setCallDurationSec(0)
    setAnalysisResult(null)

    let greetingText = `Hi ${prospectName}, this is ${cleanAgentName} from ${businessProfile.companyName || 'Callisto AI Solutions'} — we help companies like Acme Digital Solutions automate sales calls with AI. Do you have 2 minutes?`
    if (callDirection === 'INBOUND') {
      greetingText = `Thank you for calling ${businessProfile.companyName || 'Callisto AI Solutions'}! My name is ${cleanAgentName}. I can answer questions about our products, check pricing, or schedule a technical demo with our team. How may I assist you today?`
    }

    const initialTurn: ConversationTurn = {
      speaker: 'AI',
      text: greetingText,
      time: '00:00'
    }
    setTranscript([initialTurn])
    speakTurn(initialTurn.text)
  }

  // Voicemail Drop action
  function handleVoicemailDrop() {
    const prospectMatch = leadsList.find(l => l.name === prospectName)
    const prospectEmail = prospectMatch?.email || 'prospect@demo-acme.com'
    const vmText = `Hi ${prospectName}, this is ${cleanAgentName} calling from ${businessProfile.companyName || 'Callisto AI Solutions'}. I noticed your company's requirement regarding sales automation and AI voice infrastructure. I have sent our pricing deck and enterprise overview to ${prospectEmail}. Please feel free to reply or schedule a demo at your convenience. Have a great day!`

    const vmTurn: ConversationTurn = {
      speaker: 'AI',
      text: `[Voicemail Drop Triggered on Machine Detection] "${vmText}"`,
      time: formatTurnTime(callDurationSec)
    }
    const updatedTurns = [...transcript, vmTurn]
    setTranscript(updatedTurns)
    speakTurn(vmText)
    setCallStatus('COMPLETED')
    setAnalysisResult({
      score: 84,
      verdict: 'LIKELY',
      sentiment: 'NEUTRAL',
      intent: 'MEDIUM',
      summaryText: `Answering machine detected. AI dropped personalized voicemail for ${prospectName} and dispatched enterprise brief to ${prospectEmail}. Telephony retry rule logged for follow-up.`,
      buyingSignals: ['Verified corporate phone route', 'Active business domain verified'],
      nextAction: `Automated retry dial scheduled in 24 hours (Attempt ${retryAttempt} of 3).`,
    })
    showToast('info', 'Voicemail Dropped', `Personalized audio voicemail left for ${prospectName}`)
  }

  // Schedule Callback action
  function handleScheduleCallback(timing: string) {
    const pTurn: ConversationTurn = {
      speaker: 'PROSPECT',
      text: `Can you call me back ${timing}? I am currently in a meeting.`,
      time: formatTurnTime(callDurationSec)
    }
    const aiText = `Understood, ${prospectName}! I have reserved ${timing} for our callback and logged it in our team schedule. Have a wonderful day!`
    const aiTurn: ConversationTurn = {
      speaker: 'AI',
      text: aiText,
      time: formatTurnTime(callDurationSec + 4)
    }
    const updatedTurns = [...transcript, pTurn, aiTurn]
    setTranscript(updatedTurns)
    speakTurn(aiText)
    setCallStatus('COMPLETED')
    setAnalysisResult({
      score: 89,
      verdict: 'QUALIFIED',
      sentiment: 'POSITIVE',
      intent: 'HIGH',
      summaryText: `Prospect requested callback for ${timing}. Timezone-aligned automated reminder logged in CRM dial queue.`,
      buyingSignals: ['High engagement', 'Confirmed interest in discussing further', 'Clear availability window'],
      nextAction: `Automated callback dialer queued for ${timing}.`,
    })
    setShowCallbackModal(false)
    showToast('success', 'Callback Scheduled', `Slot confirmed for ${prospectName}: ${timing}`)
  }

  // Trigger Live FAQ answer
  function handleTriggerFaq(question: string, answer: string) {
    const currentT = formatTurnTime(callDurationSec)
    const updatedTurns: ConversationTurn[] = [
      ...transcript,
      { speaker: 'PROSPECT', text: question, time: currentT },
      { speaker: 'AI', text: answer, time: formatTurnTime(callDurationSec + 4), isGemini: true }
    ]
    setTranscript(updatedTurns)
    speakTurn(answer)
    setShowFaqDrawer(false)
    showToast('info', 'FAQ Answered', `Agent addressed: ${question.slice(0, 32)}...`)
  }

  // Dynamic FAQs grounded on onboarded business
  const dynamicFaqs = [
    {
      q: 'How does your pricing work?',
      a: `${businessProfile.products[0]?.name || 'Our platform'} offers transparent plans from $800 to $1,200 per month including concurrent dialing, plus per-second voice minutes. We also provide a 14-day fully supported enterprise pilot.`,
    },
    {
      q: 'How does Salesforce & CRM integration work?',
      a: `We provide native 2-way bi-directional sync with Salesforce, HubSpot, and Zoho. All call recordings, transcripts, BANT qualification notes, and scheduled demos are synced into your CRM within 5 seconds of call completion.`,
    },
    {
      q: 'Do you support Hindi, Gujarati, and global languages?',
      a: `Yes! Our voice engine natively supports Hindi, Gujarati, English, German, Arabic, French, and Spanish with natural accent adaptation, contextual dialect handling, and sub-400ms streaming response.`,
    },
    {
      q: 'What is your speech latency and barge-in speed?',
      a: `Our conversational AI voice architecture delivers under 400ms end-to-end latency with intelligent interruption barge-in, so prospects can speak naturally without awkward robotic delays.`,
    },
    {
      q: 'Is prospect data secure and SOC-2 compliant?',
      a: `Absolutely. All telephony audio and transcripts are encrypted with AES-256 at rest and TLS 1.3 in transit. We maintain SOC-2 Type II compliance and strict GDPR provenance.`,
    },
  ]

  // Preset suggested chips from Screenshot 1-3
  const suggestedChips = [
    'Tell me about your pricing',
    'How does the CRM integration work?',
    "We're actively evaluating vendors",
    'Can you share a case study?',
    'Is this SOC-2 certified?',
    'We need this for Q4'
  ]

  const sentimentColor = (s: string) => s === 'POSITIVE' ? 'text-success' : s === 'NEGATIVE' ? 'text-danger-bright' : 'text-text-muted'
  const qualColor = (q: string) => q === 'QUALIFIED' ? 'badge-success' : q === 'LIKELY' ? 'badge-amber' : q === 'NEEDS_REVIEW' ? 'badge-blue' : 'badge-low'

  return (
    <div className="p-3 sm:p-4 space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
          <h1 className="text-sm font-bold text-text-primary">{t('voice.title', 'AI Voice Agent')}</h1>
          <span className="flex items-center gap-1.5 text-2xs text-success font-medium ml-2">
            <Circle className="w-2 h-2 fill-success animate-pulse" /> {t('voice.online', 'ONLINE')}
          </span>
          <span className="badge-amber text-3xs font-mono ml-1">Agent: {cleanAgentName}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setCallStudioOpen(true)
              if (callStatus === 'IDLE') handleStartNewCall()
            }}
            className="btn-primary text-xs flex items-center justify-center gap-1.5 flex-1 sm:flex-initial shadow-lg shadow-amber-500/10"
          >
            <Mic className="w-3.5 h-3.5 text-amber-300" />
            Live Call Studio & Speech
          </button>
          <button onClick={() => setConfigOpen(true)} className="btn-secondary text-xs flex items-center justify-center gap-1.5 flex-1 sm:flex-initial">
            <Sliders className="w-3.5 h-3.5" /> Configure Agent
          </button>
        </div>
      </div>

      {/* Top Metrics Cards (matching Screenshot 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <MetricCard label={t('voice.activeCalls', 'Active Calls')} value={liveCalls.length} accent icon={<Phone className="w-3.5 h-3.5" />} />
        <MetricCard label={t('metric.callsToday', 'Calls Today')} value={845} delta={21.3} />
        <MetricCard label={t('voice.avgDuration', 'Avg Duration')} value="3" delta={12.5} />
        <MetricCard label={t('voice.qualRate', 'Qualification Rate')} value="31%" delta={4.2} />
      </div>

      {/* Interested Prospects for Follow-up (matching Screenshot 5) */}
      <div className="panel p-4 bg-gradient-to-r from-emerald-500/10 via-bg-card to-amber-500/5 border border-emerald-500/25 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bg-border pb-2.5">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-emerald-400 fill-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-text-primary">
              Interested Prospects for Follow-up
            </span>
            <span className="badge-success text-3xs font-mono">3 ACTION REQUIRED</span>
          </div>
          <span className="text-2xs text-text-muted font-mono">Real-time intent captured from voice outreach</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {interestedProspectsList.map(item => (
            <div key={item.id} className="p-3 bg-bg-card rounded-lg border border-bg-border space-y-2.5 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    {item.name}
                    <span className="badge-high text-3xs">HOT</span>
                  </div>
                  <div className="text-3xs text-text-muted mt-0.5">{item.company}</div>
                </div>
                <span className="font-mono text-xs font-bold text-success">{item.score}/100</span>
              </div>

              {/* Call Result Highlight Box matching Screenshot 5 */}
              <div className="p-2.5 bg-emerald-500/10 rounded border border-emerald-500/25 text-3xs text-emerald-400 leading-relaxed font-medium">
                Call Result: {item.outcome}
              </div>

              <div className="text-3xs text-text-secondary">
                <span className="text-text-muted font-semibold">Next Step: </span>
                {item.nextAction}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => showToast('success', 'Demo Booked', `Executive demo slot confirmed for ${item.name}`)}
                  className="btn-primary text-3xs py-1.5 px-2.5 flex-1 justify-center gap-1 font-semibold"
                >
                  <Calendar className="w-3 h-3" /> Book Demo
                </button>
                <button
                  onClick={() => showToast('success', 'Synced to CRM', `${item.name} updated in CRM pipeline`)}
                  className="btn-secondary text-3xs py-1.5 px-2.5 flex-1 justify-center font-semibold"
                >
                  Sync CRM
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Call Monitor (matching Screenshot 5) */}
      <div className="panel">
        <div className="section-header">
          <span className="section-title">Live Call Monitor</span>
          <span className="flex items-center gap-1.5 text-2xs text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> 6 active calls
          </span>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {liveCalls.map(call => (
            <button
              key={call.id}
              onClick={() => setSelectedCall(getCallForLiveCall(call, agentName))}
              className="kanban-card text-left hover:border-amber-500/40 p-3 space-y-2 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-text-primary">{call.prospect}</div>
                  <div className="text-2xs text-text-muted">{call.company}</div>
                  <div className="text-2xs text-text-muted">{call.location} · {call.lang}</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-success animate-pulse mt-1" />
              </div>
              <div className="flex items-center justify-between text-2xs">
                <span className="font-mono text-amber-400">{formatDuration(call.duration)}</span>
                <span className={sentimentColor(call.sentiment)}>{call.sentiment}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`badge text-2xs ${qualColor(call.qualification)}`}>{call.qualification.replace('_',' ')}</span>
                <span className="text-2xs text-text-muted">{call.stage}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive AI Voice Call Studio Modal (Screenshots 1-4) */}
      {callStudioOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="panel max-w-3xl w-full p-5 space-y-4 border border-amber-500/40 shadow-2xl animate-fade-in max-h-[94vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-bg-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-text-primary flex items-center gap-2">
                    Interactive AI Voice Call Studio
                    <span className="badge-amber text-3xs font-mono font-bold">AGENT: {cleanAgentName.toUpperCase()}</span>
                    <span className="badge-success text-3xs font-mono flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" /> GEMINI POWERED
                    </span>
                  </div>
                  <div className="text-3xs text-text-muted mt-0.5">
                    Type prospect messages — Gemini AI responds in real-time like a top-performing salesperson
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
                  setCallStudioOpen(false)
                }}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Call Direction Selector (Inbound vs Outbound) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-bg-secondary rounded-lg border border-bg-border">
              <div className="flex items-center gap-1.5">
                <span className="text-3xs text-text-muted font-bold uppercase tracking-wider mr-1">Call Mode:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCallDirection('OUTBOUND')
                    handleStartNewCall()
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-2xs font-semibold transition-colors ${
                    callDirection === 'OUTBOUND' ? 'bg-amber-500 text-black font-bold' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <PhoneOutgoing className="w-3 h-3" /> Outbound AI SDR Dialing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCallDirection('INBOUND')
                    setCallStatus('IN_PROGRESS')
                    setCallDurationSec(0)
                    const inboundGreeting = `Thank you for calling ${businessProfile.companyName || 'Callisto AI Solutions'}! My name is ${cleanAgentName}. I can answer questions about our products, check pricing, or schedule a technical demo with our team. How may I assist you today?`
                    setTranscript([{
                      speaker: 'AI',
                      text: inboundGreeting,
                      time: '00:00'
                    }])
                    speakTurn(inboundGreeting)
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-2xs font-semibold transition-colors ${
                    callDirection === 'INBOUND' ? 'bg-blue-500 text-white font-bold' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <PhoneIncoming className="w-3 h-3" /> Inbound Support Line
                </button>
              </div>

              {callDirection === 'INBOUND' ? (
                <span className="badge-blue text-3xs font-mono flex items-center gap-1 animate-pulse">
                  <PhoneIncoming className="w-3 h-3" /> INBOUND CALL RINGING (+1 415 892-0192)
                </span>
              ) : (
                <span className="badge-amber text-3xs font-mono flex items-center gap-1">
                  <PhoneOutgoing className="w-3 h-3" /> OUTBOUND TELEPHONY ROUTE ACTIVE
                </span>
              )}
            </div>

            {/* Top Control Bar Card matching Screenshots 1-3 */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 p-3 bg-bg-card rounded-lg border border-bg-border text-xs items-center">
              {/* Gemini AI toggle card */}
              <div className="sm:col-span-1 p-2 rounded bg-bg-secondary border border-bg-border flex items-center justify-between">
                <div>
                  <div className="text-2xs font-bold text-text-primary leading-tight">Gemini AI</div>
                  <div className="text-3xs text-success flex items-center gap-1 font-medium">
                    <Zap className="w-2.5 h-2.5" /> Live responses
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGeminiEnabled(!geminiEnabled)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${geminiEnabled ? 'bg-emerald-500' : 'bg-bg-border'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${geminiEnabled ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Agent Name */}
              <div className="sm:col-span-1">
                <label className="text-3xs text-text-muted uppercase font-bold block mb-1">AGENT NAME</label>
                <input
                  type="text"
                  className="input text-2xs py-1 px-2 w-full text-amber-400 font-semibold border-amber-500/40 focus:border-amber-400"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                />
              </div>

              {/* Prospect Name */}
              <div className="sm:col-span-1">
                <label className="text-3xs text-text-muted uppercase font-bold block mb-1">PROSPECT NAME</label>
                <input
                  type="text"
                  className="input text-2xs py-1 px-2 w-full font-medium"
                  value={prospectName}
                  onChange={e => setProspectName(e.target.value)}
                  placeholder="e.g. Rohan Verma"
                />
              </div>

              {/* Speech Language */}
              <div className="sm:col-span-1">
                <label className="text-3xs text-text-muted uppercase font-bold block mb-1">SPEECH LANGUAGE</label>
                <select
                  className="input text-2xs py-1 px-2 w-full"
                  value={simLanguage}
                  onChange={e => setSimLanguage(e.target.value as any)}
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिंदी (Hindi)</option>
                  <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                  <option value="German">German</option>
                  <option value="Arabic">Arabic</option>
                </select>
              </div>

              {/* Call Scenario */}
              <div className="sm:col-span-1">
                <label className="text-3xs text-text-muted uppercase font-bold block mb-1">CALL SCENARIO</label>
                <select
                  className="input text-2xs py-1 px-2 w-full truncate"
                  value={simScenario}
                  onChange={e => setSimScenario(e.target.value)}
                >
                  <option value="Engaged & Interested (Demo)">Engaged & Interested</option>
                  <option value="Voicemail Drop Triggered">Voicemail Drop</option>
                  <option value="Scheduled Callback">Scheduled Callback</option>
                  <option value="Objection / Technical FAQ">Technical FAQs & Pricing</option>
                  <option value="Unanswered (Retry Queue)">Unanswered / Retry</option>
                </select>
              </div>
            </div>

            {/* Status Bar Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-bg-card border border-bg-border rounded-lg gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${callStatus === 'IN_PROGRESS' ? 'bg-success animate-pulse' : 'bg-amber-400'}`} />
                <div>
                  <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                    {callStatus === 'IN_PROGRESS' ? (
                      `Call In Progress (${formatStudioDuration(callDurationSec)})`
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        ✓ Call Completed · Analysis Ready
                      </span>
                    )}
                  </div>
                  <div className="text-3xs text-text-muted mt-0.5">
                    Agent: <strong className="text-amber-400">{cleanAgentName}</strong> · Prospect: <strong className="text-text-primary">{prospectName}</strong> · Language: {simLanguage.slice(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {callStatus === 'IN_PROGRESS' ? (
                  <>
                    <button
                      onClick={handleEndCallAndAnalyze}
                      className="btn-danger text-xs gap-1.5 py-1 px-3 border border-red-500/50"
                    >
                      <PhoneOff className="w-3.5 h-3.5" /> End Call & Analyze
                    </button>
                    <button
                      onClick={() => speakTurn(lastSpokenTextRef.current || transcript[0]?.text || '')}
                      className="btn-secondary text-xs gap-1.5 py-1 px-2.5"
                      title="Replay last speech"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Replay Audio
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleStartNewCall}
                      className="btn-primary text-xs gap-1.5 py-1 px-3"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> New Call
                    </button>
                    <button
                      onClick={() => speakTurn(lastSpokenTextRef.current || transcript[0]?.text || '')}
                      className="btn-secondary text-xs gap-1.5 py-1 px-2.5"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Replay Audio
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Automation Actions Toolbar (Voicemail, Callback, FAQs, Retries) */}
            {callStatus === 'IN_PROGRESS' && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-bg-card rounded-lg border border-bg-border text-2xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleVoicemailDrop}
                    className="btn-secondary text-3xs py-1 px-2.5 gap-1 text-amber-400 border-amber-500/30 hover:bg-amber-500/10 font-medium"
                    title="Leave customized AI voicemail on machine detection"
                  >
                    <Voicemail className="w-3 h-3 text-amber-400" /> Drop AI Voicemail
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCallbackModal(true)}
                    className="btn-secondary text-3xs py-1 px-2.5 gap-1 text-blue-400 border-blue-500/30 hover:bg-blue-500/10 font-medium"
                    title="Schedule automated callback at prospect's requested time"
                  >
                    <Clock className="w-3 h-3 text-blue-400" /> Schedule Callback
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFaqDrawer(!showFaqDrawer)}
                    className="btn-secondary text-3xs py-1 px-2.5 gap-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 font-medium"
                    title="Open live FAQ cheat sheet"
                  >
                    <HelpCircle className="w-3 h-3 text-emerald-400" /> Live FAQs (5)
                  </button>
                </div>

                <div className="flex items-center gap-2 text-3xs text-text-muted font-mono">
                  <span>Retry Strategy: <strong>Attempt {retryAttempt} of 3</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setRetryAttempt(prev => (prev < 3 ? prev + 1 : 1))
                      showToast('info', 'Retry Strategy Updated', `Dial attempt set to ${retryAttempt < 3 ? retryAttempt + 1 : 1}`)
                    }}
                    className="btn-ghost p-1 hover:text-amber-400"
                    title="Cycle retry attempts"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Collapsible Live FAQ Drawer */}
            {showFaqDrawer && callStatus === 'IN_PROGRESS' && (
              <div className="p-3 bg-bg-card border border-emerald-500/30 rounded-lg space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-2xs font-bold text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" /> 1-Click Interactive FAQ Answers
                  </span>
                  <button onClick={() => setShowFaqDrawer(false)} className="text-text-muted hover:text-text-primary">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dynamicFaqs.map((faq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTriggerFaq(faq.q, faq.a)}
                      className="p-2 text-left bg-bg-secondary hover:bg-emerald-500/10 border border-bg-border hover:border-emerald-500/40 rounded transition-all group"
                    >
                      <div className="text-2xs font-semibold text-text-primary group-hover:text-emerald-300 flex items-center justify-between">
                        <span>{faq.q}</span>
                        <ArrowRight className="w-3 h-3 text-text-muted group-hover:text-emerald-400 shrink-0" />
                      </div>
                      <div className="text-3xs text-text-muted line-clamp-1 mt-0.5">
                        {faq.a}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Neural Speech Engine Standby Banner matching Screenshots 1-4 */}
            <div className="p-2.5 bg-bg-card rounded-lg border border-bg-border flex items-center justify-between font-mono text-2xs">
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="tracking-widest">•••••••••••••</span>
                <span className="text-text-muted ml-1 font-sans">
                  {speechActive ? `${cleanAgentName} Voice Synthesizer Active` : 'Neural Speech Engine Standby'}
                </span>
              </div>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-emerald-400" /> @ gemini-3.8-flash
              </span>
            </div>

            {/* Live Conversation Transcript */}
            <div className="space-y-2 border border-bg-border rounded-lg p-3 bg-bg-secondary/70 max-h-72 overflow-y-auto" ref={transcriptContainerRef}>
              <div className="flex items-center justify-between text-3xs uppercase font-bold text-text-muted pb-1 border-b border-bg-border/60">
                <span>LIVE CONVERSATION TRANSCRIPT</span>
                <span className="text-text-muted flex items-center gap-1 font-mono">
                  {transcript.length} {transcript.length === 1 ? 'TURNS' : 'TURNS'} · 🤖 AI-GENERATED
                </span>
              </div>

              {transcript.map((turn, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg text-2xs leading-relaxed animate-fade-in ${
                    turn.speaker === 'AI'
                      ? 'bg-amber-500/5 border border-amber-500/30 text-text-primary'
                      : 'bg-blue-500/10 border border-blue-500/30 text-blue-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-3xs text-text-muted mb-1">
                    <div className="flex items-center gap-1.5">
                      {turn.speaker === 'AI' ? (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span className="font-semibold text-amber-300">
                            {cleanAgentName} (AI Agent)
                          </span>
                          {turn.isGemini && (
                            <span className="badge-success text-3xs py-0 px-1 font-mono">
                              Gemini
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 text-blue-400" />
                          <span className="font-semibold text-blue-300">
                            {prospectName} (Prospect)
                          </span>
                        </>
                      )}
                    </div>
                    <span className="font-mono text-3xs text-text-muted">{turn.time}</span>
                  </div>
                  <div>{turn.text}</div>
                </div>
              ))}

              {isAiResponding && (
                <div className="p-2 rounded bg-bg-card border border-amber-500/30 text-3xs text-amber-400 flex items-center gap-2 animate-pulse font-medium">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  Gemini AI is crafting response for {cleanAgentName}...
                </div>
              )}
            </div>

            {/* Prospect Message Input & Suggestion Chips (Screenshots 1-3) */}
            {callStatus === 'IN_PROGRESS' && (
              <div className="space-y-2 pt-1">
                <div className="text-3xs uppercase font-bold text-text-muted flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3 text-amber-400" />
                  TYPE WHAT {prospectName.toUpperCase()} SAYS — GEMINI AI WILL RESPOND
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input text-xs flex-1 py-2 px-3 border-bg-border focus:border-amber-400"
                    placeholder={`e.g. "What's the pricing?" or "We're interested, tell me more..."`}
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSendMessage()
                    }}
                    disabled={isAiResponding}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!userInput.trim() || isAiResponding}
                    className="btn-primary text-xs py-2 px-4 gap-1.5 font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>

                {/* Suggested prompt chips matching Screenshots 1-3 */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {suggestedChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      disabled={isAiResponding}
                      className="text-3xs py-1 px-2.5 rounded-full bg-bg-card border border-bg-border text-text-muted hover:text-amber-300 hover:border-amber-500/40 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gemini AI Call Analysis Card (Screenshot 4) */}
            {callStatus === 'COMPLETED' && analysisResult && (
              <div className="p-4 bg-bg-card border border-emerald-500/30 rounded-lg space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-bg-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-text-primary">Gemini AI Call Analysis</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="badge-blue text-2xs font-semibold">{analysisResult.verdict}</span>
                    <span className="badge-success text-2xs font-mono font-bold">{analysisResult.score}/100</span>
                  </div>
                </div>

                <p className="text-2xs text-text-muted leading-relaxed">
                  {analysisResult.summaryText}
                </p>

                {/* 3 Metrics Box */}
                <div className="grid grid-cols-3 gap-2.5 p-2.5 bg-bg-secondary rounded border border-bg-border text-center">
                  <div>
                    <div className="text-3xs text-text-muted uppercase">Sentiment</div>
                    <div className="text-xs font-bold text-text-primary mt-0.5">{analysisResult.sentiment}</div>
                  </div>
                  <div>
                    <div className="text-3xs text-text-muted uppercase">Intent</div>
                    <div className="text-xs font-bold text-amber-400 mt-0.5">{analysisResult.intent}</div>
                  </div>
                  <div>
                    <div className="text-3xs text-text-muted uppercase">Duration</div>
                    <div className="text-xs font-mono font-bold text-text-primary mt-0.5">{formatStudioDuration(callDurationSec)}</div>
                  </div>
                </div>

                {/* Buying Signals */}
                <div className="space-y-1">
                  <div className="text-3xs text-emerald-400 font-semibold flex items-center gap-1">
                    ✓ Buying Signals Detected
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.buyingSignals.map((sig, i) => (
                      <span key={i} className="text-3xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded">
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Next Best Action */}
                <div className="p-2.5 bg-bg-secondary rounded border border-amber-500/30 text-2xs text-text-primary">
                  <div className="text-3xs text-amber-400 font-bold mb-0.5 flex items-center gap-1">
                    🎯 Next Best Action
                  </div>
                  {analysisResult.nextAction}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-2">
                    <button
                      onClick={() => showToast('success', 'Synced to CRM', `Call recording & transcript pushed to CRM for ${prospectName}`)}
                      className="btn-primary text-3xs py-1.5 px-3 font-semibold"
                    >
                      Sync to CRM
                    </button>
                    <button
                      onClick={() => showToast('success', 'Demo Booked', `Demo slot scheduled for ${prospectName}`)}
                      className="btn-secondary text-3xs py-1.5 px-3 font-semibold"
                    >
                      Book Demo
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setCallStudioOpen(false)
                      navigate('/call-history')
                    }}
                    className="text-3xs text-text-muted hover:text-amber-400 underline font-mono"
                  >
                    View History
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-bg-border text-3xs text-text-muted">
              <span>All call recordings are encrypted with AES-256 · Powered by Google Gemini 3.8 Flash</span>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
                  setCallStudioOpen(false)
                }}
                className="btn-secondary text-xs py-1 px-3"
              >
                Close Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Modal for Live Call Floor */}
      {selectedCall && (
        <div className="modal-overlay" onClick={() => setSelectedCall(null)}>
          <div className="modal-panel max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <div>
                <span className="section-title">{selectedCall.prospect} — Call Transcript</span>
                <div className="text-2xs text-text-muted mt-0.5">{selectedCall.company} · {formatDuration(selectedCall.duration)} · Agent: {selectedCall.agent}</div>
              </div>
              <button onClick={() => setSelectedCall(null)}><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-[200px]">
                {selectedCall.transcript.map((line, i) => (
                  <div key={i} className={`flex gap-2 sm:gap-3 ${line.speaker === 'AI' ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold shrink-0 ${line.speaker === 'AI' ? 'bg-amber-500/20 text-amber-400' : 'bg-info-dim text-info-bright'}`}>
                      {line.speaker === 'AI' ? 'AI' : 'P'}
                    </div>
                    <div className={`max-w-[85%] sm:max-w-[75%] p-2.5 rounded text-xs leading-relaxed ${line.speaker === 'AI' ? 'bg-bg-card border border-bg-border text-text-primary' : 'bg-info-dim border border-info/20 text-info-bright'}`}>
                      <div className="text-2xs text-text-muted mb-1">{line.speaker === 'AI' ? `${cleanAgentName} (AI Agent)` : 'Prospect'} · {line.timestamp}</div>
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-full md:w-56 border-t md:border-t-0 md:border-l border-bg-border p-3 sm:p-4 space-y-4 overflow-y-auto bg-bg-secondary shrink-0">
                <div className="text-2xs text-amber-400 font-semibold uppercase tracking-wide">AI Call Intelligence</div>
                {[
                  { label: 'Sentiment', value: selectedCall.sentiment, color: selectedCall.sentiment === 'POSITIVE' ? 'text-success' : 'text-danger-bright' },
                  { label: 'Intent', value: selectedCall.intent, color: 'text-amber-400' },
                  { label: 'Qualification', value: selectedCall.qualification.replace('_',' '), color: 'text-success' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-2xs text-text-muted mb-0.5">{item.label}</div>
                    <div className={`text-xs font-semibold ${item.color}`}>{item.value}</div>
                  </div>
                ))}

                {selectedCall.buyingSignals.length > 0 && (
                  <div>
                    <div className="text-2xs text-success font-semibold mb-1">Buying Signals</div>
                    {selectedCall.buyingSignals.map((s, i) => <div key={i} className="text-2xs text-text-secondary">· {s}</div>)}
                  </div>
                )}
                {selectedCall.objections.length > 0 && (
                  <div>
                    <div className="text-2xs text-danger-bright font-semibold mb-1">Objections</div>
                    {selectedCall.objections.map((s, i) => <div key={i} className="text-2xs text-text-secondary">· {s}</div>)}
                  </div>
                )}

                <div>
                  <div className="text-2xs text-amber-400 font-semibold mb-1">Next Best Action</div>
                  <div className="text-xs text-text-primary">{selectedCall.nextBestAction}</div>
                </div>

                <div className="space-y-1.5">
                  {['Call Back','Schedule Meeting','Add to CRM','Add Note'].map(a => (
                    <button key={a} onClick={() => { showToast('success', a, `Action recorded for ${selectedCall.prospect}`); setSelectedCall(null) }}
                      className="w-full btn-secondary text-2xs py-1">{a}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Telephony Configuration Modal */}
      {configOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel max-w-xl w-full p-6 space-y-4 border border-amber-500/30 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-bg-border pb-3">
              <div>
                <div className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Configure AI Voice Agent
                </div>
                <div className="text-2xs text-text-muted mt-0.5">Calling telephony, voice personas, voicemail drop & retry rules</div>
              </div>
              <button onClick={() => setConfigOpen(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Infrastructure */}
            <div className="space-y-2">
              <label className="text-2xs text-text-muted uppercase font-bold tracking-wide block">Calling Telephony Provider</label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setTelephonyMode('BUILTIN')}
                  className={`p-3 rounded border cursor-pointer transition-all ${telephonyMode === 'BUILTIN' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-bg-card border-bg-border hover:border-amber-500/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-amber-400" /> Platform Built-in
                    </span>
                    {telephonyMode === 'BUILTIN' && <span className="text-2xs text-amber-400 font-bold">✓ Active</span>}
                  </div>
                  <p className="text-2xs text-text-muted mt-1">Pre-configured global SIP routes. Metered per voice minute.</p>
                </div>

                <div
                  onClick={() => setTelephonyMode('BYO')}
                  className={`p-3 rounded border cursor-pointer transition-all ${telephonyMode === 'BYO' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-bg-card border-bg-border hover:border-amber-500/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-blue-400" /> BYO Telephony (SIP)
                    </span>
                    {telephonyMode === 'BYO' && <span className="text-2xs text-amber-400 font-bold">✓ Active</span>}
                  </div>
                  <p className="text-2xs text-text-muted mt-1">Direct carrier integration (Twilio / Plivo / Custom SIP Trunk).</p>
                </div>
              </div>
            </div>

            {/* Persona */}
            <div className="space-y-3 pt-2 border-t border-bg-border text-xs">
              <label className="text-2xs text-text-muted uppercase font-bold tracking-wide block">Voice Persona & Language</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-2xs text-text-muted block mb-1">Agent Name</label>
                  <input className="input text-xs w-full" value={agentName} onChange={e => setAgentName(e.target.value)} />
                </div>
                <div>
                  <label className="text-2xs text-text-muted block mb-1">Outbound Primary Language</label>
                  <select className="input text-xs w-full" value={outboundLang} onChange={e => setOutboundLang(e.target.value)}>
                    <option>English (US)</option>
                    <option>English (India)</option>
                    <option>Hindi (हिंदी)</option>
                    <option>Gujarati (ગુજરાતી)</option>
                    <option>German (DE)</option>
                    <option>Arabic (AR)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Automation */}
            <div className="space-y-3 pt-2 border-t border-bg-border text-xs">
              <label className="text-2xs text-text-muted uppercase font-bold tracking-wide block">Outreach Automation & Retry Rules</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-bg-card border border-bg-border rounded">
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Voicemail Drop on Machine Detection</div>
                    <div className="text-2xs text-text-muted">Leave AI customized audio voicemail when answering machine answers</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoicemailDrop(!voicemailDrop)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${voicemailDrop ? 'bg-amber-500' : 'bg-bg-border'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${voicemailDrop ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-bg-card border border-bg-border rounded">
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Automated Callback Scheduling</div>
                    <div className="text-2xs text-text-muted">Schedule callback when prospect requests another time</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoCallback(!autoCallback)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${autoCallback ? 'bg-amber-500' : 'bg-bg-border'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${autoCallback ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-bg-card border border-bg-border rounded">
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Max Unanswered Call Retries</div>
                    <div className="text-2xs text-text-muted">Maximum number of automated retry attempts for unanswered calls</div>
                  </div>
                  <select
                    className="input text-xs w-20"
                    value={maxRetries}
                    onChange={e => setMaxRetries(e.target.value)}
                  >
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>5</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-bg-border">
              <span className="text-2xs text-text-muted">All changes apply to upcoming campaign batches</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setConfigOpen(false)} className="btn-secondary text-xs">Cancel</button>
                <button
                  onClick={() => {
                    showToast('success', 'Voice Agent Configured', `Agent ${agentName} updated with ${telephonyMode === 'BUILTIN' ? 'Platform Built-in' : carrierProvider} telephony`)
                    setConfigOpen(false)
                  }}
                  className="btn-primary text-xs"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Callback Scheduling Modal */}
      {showCallbackModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel max-w-md w-full p-5 space-y-4 border border-blue-500/40 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-text-primary">Schedule Callback: {prospectName}</span>
              </div>
              <button onClick={() => setShowCallbackModal(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-2xs text-text-secondary leading-relaxed">
              Select the prospect's requested availability window. The AI Voice Agent will automatically place a prioritized outbound callback with conversation history pre-loaded.
            </p>

            <div className="space-y-2">
              {[
                { slot: 'in 2 hours (today 4:30 PM IST)', label: 'In 2 Hours · Quick Follow-up' },
                { slot: 'tomorrow morning at 10:00 AM IST', label: 'Tomorrow at 10:00 AM · Business Hours' },
                { slot: 'tomorrow afternoon at 3:00 PM IST', label: 'Tomorrow at 3:00 PM · Decision Maker Window' },
                { slot: 'next Tuesday at 11:00 AM IST', label: 'Next Week (Tuesday 11:00 AM) · Comprehensive Review' },
              ].map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleScheduleCallback(opt.slot)}
                  className="w-full text-left p-2.5 rounded bg-bg-card hover:bg-blue-500/10 border border-bg-border hover:border-blue-500/40 transition-colors flex items-center justify-between group"
                >
                  <span className="text-xs text-text-primary group-hover:text-blue-300">{opt.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-blue-400" />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-bg-border text-3xs text-text-muted">
              <span>Timezone auto-aligned with prospect location</span>
              <button onClick={() => setShowCallbackModal(false)} className="btn-secondary text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Booking Confirmation Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel max-w-md w-full p-5 space-y-4 border border-emerald-500/40 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-text-primary">Confirm Executive Demo Booking</span>
              </div>
              <button onClick={() => setShowDemoModal(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-bg-secondary rounded-lg border border-bg-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Prospect:</span>
                <span className="font-bold text-text-primary">{selectedProspectForDemo?.name || prospectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Company:</span>
                <span className="text-text-secondary">{selectedProspectForDemo?.company || 'Acme Digital Solutions'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Email:</span>
                <span className="font-mono text-2xs text-amber-400">{selectedProspectForDemo?.email || 'prospect@acmedigital.com'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Target Slot:</span>
                <span className="font-semibold text-emerald-400">Tuesday, 11:00 AM IST (20 mins)</span>
              </div>
            </div>

            <div className="space-y-1.5 text-2xs text-text-muted">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-success" />
                <span>Calendar invite automatically pushed to Google / Outlook calendar</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-success" />
                <span>Bi-directional sync to Salesforce / HubSpot pipeline</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-success" />
                <span>Executive briefing deck attached to confirmation email</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-bg-border">
              <button onClick={() => setShowDemoModal(false)} className="btn-secondary text-xs">Cancel</button>
              <button
                onClick={() => {
                  showToast('success', 'Demo Confirmed & Calendar Invite Sent', `Dispatched invitation to ${selectedProspectForDemo?.email || 'prospect@acmedigital.com'}`)
                  setShowDemoModal(false)
                }}
                className="btn-primary text-xs gap-1.5 font-semibold"
              >
                <Calendar className="w-3.5 h-3.5" /> Dispatch Calendar Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
