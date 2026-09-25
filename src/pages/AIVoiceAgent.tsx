import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  PhoneCall, Phone, Circle, X, Calendar, Server,
  Sliders, CheckCircle, Volume2, Sparkles, Star,
  Mic, ArrowRight, User, FastForward, RotateCcw,
  Zap, PhoneOff, Send, MessageSquare, ShieldCheck,
  PhoneIncoming, PhoneOutgoing, Voicemail, Clock,
  HelpCircle, Check, MessageCircle, FileText,
  Link2, RefreshCw, AlertTriangle, UserCheck, Smartphone, ExternalLink,
  PhoneForwarded, Radio, Mail
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
import {
  startMicRecognition,
  stopMicRecognition,
  speakText,
  cancelSpeech,
  toVoiceLanguage,
  isSpeechRecognitionSupported,
} from '@/services/voiceEngine'
import { callHistoryStore } from '@/services/callHistoryStore'
import {
  detectHumanTransferIntent,
  sendCalendlySms,
  sendCalendlyEmail,
  sendCalendlyDispatch,
  buildCalendlyEmail,
  getCalendlyBookings,
  getCalendlyStats,
  scheduleFollowUpCall,
  simulateCalendlyEvent,
  getCustomCalendlyLink,
  setCustomCalendlyLink,
  type CalendlyBookingRecord,
} from '@/services/calendlyService'
import { PhoneCallPanel } from '@/components/voice/PhoneCallPanel'
import { getGeminiApiKey } from '@/services/geminiService'
import {
  syncVoiceCallToCrm,
  syncActivityToCrm,
  loadVoiceAgentCrmConfig,
  saveVoiceAgentCrmConfig,
  loadCrms,
  type CRMIntegration,
  type VoiceAgentCrmConfig,
} from '@/services/crmService'

export function AIVoiceAgent() {
  const { showToast } = useToast()
  const { language, t, businessProfile } = useAppContext()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const leadParam = searchParams.get('lead')

  // Context leads for seamless integration with other pages
  let leadsList: Lead[] = leads
  let updateLeadFn: ((id: string, updates: Partial<Lead>) => void) | undefined
  try {
    const leadsCtx = useLeads()
    if (leadsCtx && leadsCtx.leadsList && leadsCtx.leadsList.length > 0) {
      leadsList = leadsCtx.leadsList
    }
    updateLeadFn = leadsCtx?.updateLead
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

  // Calendly Mail / SMS Dispatch & Human-Transfer state
  const [showCalendlySmsModal, setShowCalendlySmsModal] = useState<boolean>(false)
  const [calendlySmsSending, setCalendlySmsSending] = useState<boolean>(false)
  const [calendlySmsSent, setCalendlySmsSent] = useState<boolean>(false)
  const [calendlyDispatchChannel, setCalendlyDispatchChannel] = useState<'EMAIL' | 'SMS' | 'BOTH'>('EMAIL')
  const [lastDispatchedChannel, setLastDispatchedChannel] = useState<'EMAIL' | 'SMS' | 'BOTH'>('EMAIL')
  const [humanTransferDetected, setHumanTransferDetected] = useState<boolean>(false)
  const [calendlyBookings, setCalendlyBookings] = useState<CalendlyBookingRecord[]>(() => getCalendlyBookings())
  const [calendlyStats, setCalendlyStats] = useState(() => getCalendlyStats())
  const [showCalendlyTracker, setShowCalendlyTracker] = useState<boolean>(false)
  const [followUpModal, setFollowUpModal] = useState<{ open: boolean; recordId: string; leadName: string }>({ open: false, recordId: '', leadName: '' })
  const [customCalendlyUrl, setCustomCalendlyUrl] = useState<string>(() => getCustomCalendlyLink())
  const [isEditingCalendlyUrl, setIsEditingCalendlyUrl] = useState<boolean>(false)
  const [calendlyUrlInput, setCalendlyUrlInput] = useState<string>(() => getCustomCalendlyLink())

  // Prospect Contact details (Phone & Mail) - editable with persistent memory
  const [prospectPhone, setProspectPhone] = useState<string>(() => {
    const saved = localStorage.getItem('callisto_phone_' + initialProspectName)
    if (saved) return saved
    const match = leadsList.find(l => l.name === initialProspectName)
    if (match?.phone && match.phone !== '+91 98XXX XXXXX') return match.phone
    return '+91 98201 44892'
  })
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false)
  const [phoneInput, setPhoneInput] = useState<string>(prospectPhone)

  const [prospectEmail, setProspectEmail] = useState<string>(() => {
    const saved = localStorage.getItem('callisto_email_' + initialProspectName)
    if (saved) return saved
    return 'tanishqgt32@gmail.com'
  })
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false)
  const [emailInput, setEmailInput] = useState<string>(prospectEmail)


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

  // Microphone / voice input state
  const [micActive, setMicActive] = useState(false)
  const [interimText, setInterimText] = useState('')   // live streamed partial words
  const [micError, setMicError] = useState<string | null>(null)
  const micEnabledRef = useRef(false)                  // tracks if mic should be running

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

  // CRM Sync State & Configuration
  const [crmConfig, setCrmConfig] = useState<VoiceAgentCrmConfig>(loadVoiceAgentCrmConfig)
  const [availableCrms] = useState<CRMIntegration[]>(loadCrms)
  const [isSyncingCrm, setIsSyncingCrm] = useState(false)
  const [lastSyncedCrmName, setLastSyncedCrmName] = useState<string | null>('Salesforce CRM')
  const [syncedProspectMap, setSyncedProspectMap] = useState<Record<string, { crmName: string; time: string }>>({
    'IP-1': { crmName: 'Salesforce CRM', time: '12m ago' },
    'IP-2': { crmName: 'Salesforce CRM', time: '34m ago' },
  })

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

  // Sync phone and email when prospectName changes
  useEffect(() => {
    const savedPhone = localStorage.getItem('callisto_phone_' + prospectName)
    const match = leadsList.find(l => l.name === prospectName)
    const effectivePhone = savedPhone || (match?.phone && match.phone !== '+91 98XXX XXXXX' ? match.phone : '+91 98201 44892')
    setProspectPhone(effectivePhone)
    setPhoneInput(effectivePhone)

    const savedEmail = localStorage.getItem('callisto_email_' + prospectName)
    const effectiveEmail = savedEmail || 'tanishqgt32@gmail.com'
    setProspectEmail(effectiveEmail)
    setEmailInput(effectiveEmail)
  }, [prospectName, leadsList])

  function handleSavePhone() {
    const trimmed = phoneInput.trim()
    if (trimmed) {
      setProspectPhone(trimmed)
      localStorage.setItem('callisto_phone_' + prospectName, trimmed)
      const match = leadsList.find(l => l.name === prospectName)
      if (match && updateLeadFn) {
        updateLeadFn(match.id, { phone: trimmed })
      }
      showToast('success', 'Phone Number Updated', `Contact number set to ${trimmed}`)
    }
    setIsEditingPhone(false)
  }

  function handleSaveEmail() {
    const trimmed = emailInput.trim()
    if (trimmed) {
      setProspectEmail(trimmed)
      localStorage.setItem('callisto_email_' + prospectName, trimmed)
      const match = leadsList.find(l => l.name === prospectName)
      if (match && updateLeadFn) {
        updateLeadFn(match.id, { email: trimmed })
      }
      showToast('success', 'Mail Address Updated', `Address set to ${trimmed}`)
    }
    setIsEditingEmail(false)
  }

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

  // ── Speech synthesis (delegates to voiceEngine) ────────────────────────────
  async function speakTurn(text: string, onComplete?: () => void) {
    lastSpokenTextRef.current = text
    setSpeechActive(true)
    // Pause mic while AI speaks to avoid feedback loop
    if (micEnabledRef.current) stopMicRecognition()
    await speakText(text, toVoiceLanguage(simLanguage), {
      onStart: () => setSpeechActive(true),
      onEnd: () => {
        setSpeechActive(false)
        // Restart mic after AI finishes speaking
        if (micEnabledRef.current) startMic()
        onComplete?.()
      }
    })
  }

  // ── Start microphone ────────────────────────────────────────────────────────
  function startMic() {
    if (!isSpeechRecognitionSupported()) {
      setMicError('Speech recognition not supported in this browser. Use Chrome or Edge.')
      return
    }
    setMicError(null)
    setMicActive(true)
    startMicRecognition(toVoiceLanguage(simLanguage), {
      onStart: () => setMicActive(true),
      onInterim: (text) => setInterimText(text),
      onFinal: (text) => {
        setInterimText('')
        // Auto-send the spoken text as prospect message
        if (text.trim()) handleSendMessage(text.trim())
      },
      onDisconnect: () => {
        // Prospect said "disconnect" / "end call" — hang up
        setMicActive(false)
        micEnabledRef.current = false
        stopMicRecognition()
        handleEndCallAndAnalyze()
      },
      onError: (err) => {
        if (!err.includes('no-speech')) setMicError(err)
      },
      onStop: () => setMicActive(false),
    })
  }

  // ── Stop microphone ─────────────────────────────────────────────────────────
  function stopMic() {
    micEnabledRef.current = false
    stopMicRecognition()
    setMicActive(false)
    setInterimText('')
  }

  // Cleanup microphone and speech on unmount
  useEffect(() => {
    return () => {
      micEnabledRef.current = false
      stopMicRecognition()
      cancelSpeech()
    }
  }, [])

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

  // Refresh calendly bookings from store
  const refreshCalendlyData = useCallback(() => {
    setCalendlyBookings(getCalendlyBookings())
    setCalendlyStats(getCalendlyStats())
  }, [])

  // Handle sending Calendly Link via Email, SMS, or Both to current prospect
  async function handleSendCalendlyDispatch() {
    setCalendlySmsSending(true)
    const effectivePhone = prospectPhone.trim() || '+91 98201 44892'
    const effectiveEmail = prospectEmail.trim() || 'tanishqgt32@gmail.com'
    const prospectMatch = leadsList.find(l => l.name === prospectName)
    const company = prospectMatch?.company || businessProfile.companyName || 'Enterprise'

    try {
      await sendCalendlyDispatch({
        channel: calendlyDispatchChannel,
        prospectName,
        prospectPhone: effectivePhone,
        prospectEmail: effectiveEmail,
        company,
        agentName: cleanAgentName,
        companyName: businessProfile.companyName || 'Callisto AI Solutions',
        triggeredBy: 'HUMAN_TRANSFER_REQUEST',
        calendlyLink: customCalendlyUrl,
      })
      setCalendlySmsSent(true)
      setLastDispatchedChannel(calendlyDispatchChannel)
      refreshCalendlyData()

      // Add AI transcript turn acknowledging the dispatch
      let aiText = ''
      let tag = ''
      if (calendlyDispatchChannel === 'EMAIL') {
        aiText = `Absolutely! I've just sent an email with our Calendly booking link to ${effectiveEmail}. All meeting slots are pre-approved, and our senior engineering team will confirm as soon as you select a time. Is there anything else you'd like to discuss?`
        tag = `[✉️ Calendly Link Emailed to ${effectiveEmail}]`
      } else if (calendlyDispatchChannel === 'SMS') {
        aiText = `Absolutely! I've just sent you a text message with a direct Calendly link to ${effectivePhone}. Once you book, our team will confirm within minutes. Is there anything else I can help you with in the meantime?`
        tag = `[📱 Calendly SMS Dispatched via Twilio to ${effectivePhone}]`
      } else {
        aiText = `Done! I've sent the Calendly booking link to both your email ${effectiveEmail} and your phone ${effectivePhone}. You can reserve any convenient slot instantly!`
        tag = `[🚀 Calendly Link Dispatched via Mail (${effectiveEmail}) & SMS (${effectivePhone})]`
      }

      const aiTime = formatTurnTime(callDurationSec + 3)
      setTranscript(prev => [
        ...prev,
        { speaker: 'AI', text: `${tag} ${aiText}`, time: aiTime, isGemini: true }
      ])
      speakTurn(aiText)

      const toastTitle =
        calendlyDispatchChannel === 'EMAIL'
          ? 'Calendly Link Emailed'
          : calendlyDispatchChannel === 'SMS'
          ? 'Calendly SMS Dispatched'
          : 'Calendly Link Dispatched'
      const toastDesc =
        calendlyDispatchChannel === 'EMAIL'
          ? `Dispatched to ${effectiveEmail}`
          : calendlyDispatchChannel === 'SMS'
          ? `Dispatched to ${effectivePhone}`
          : `Dispatched to ${effectiveEmail} & ${effectivePhone}`
      showToast('success', toastTitle, toastDesc)
    } catch {
      showToast('info', 'Dispatch Recorded', 'Calendly link recorded and added to Booking Tracker')
      setCalendlySmsSent(true)
      setLastDispatchedChannel(calendlyDispatchChannel)
      refreshCalendlyData()
    }
    setCalendlySmsSending(false)
  }

  // Backward-compatibility alias
  const handleSendCalendlySms = handleSendCalendlyDispatch

  // Send prospect message and trigger Gemini AI response
  async function handleSendMessage(customMsg?: string) {
    const msgToSend = (customMsg !== undefined ? customMsg : userInput).trim()
    if (!msgToSend || isAiResponding || callStatus !== 'IN_PROGRESS') return

    setUserInput('')
    const currentTime = formatTurnTime(callDurationSec)

    // ── Human-Transfer Intent Detection ────────────────────────────────────
    if (!humanTransferDetected && detectHumanTransferIntent(msgToSend)) {
      setHumanTransferDetected(true)
      setShowCalendlySmsModal(true)
    }
    // ───────────────────────────────────────────────────────────────────────

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

      // If human transfer was detected, override the AI response to send Calendly context
      let responseText = result.text
      if (humanTransferDetected && !calendlySmsSent) {
        responseText = `Of course! I completely understand — I'll send you a text message right now with a direct link to book a time with our team. You can choose any slot that works best for you. Is the number ${leadsList.find(l => l.name === prospectName)?.phone || 'we have on file'} the best one to reach you?`
      }

      const finalTurns: ConversationTurn[] = [
        ...updatedTurns,
        {
          speaker: 'AI',
          text: responseText,
          time: aiTime,
          isGemini: result.isGemini
        }
      ]
      setTranscript(finalTurns)
      setIsAiResponding(false)

      // Speak aloud
      speakTurn(responseText)
    } catch (err) {
      setIsAiResponding(false)
    }
  }

  // End Call & Analyze (Screenshot 4)
  async function handleEndCallAndAnalyze() {
    stopMic()
    cancelSpeech()
    setSpeechActive(false)
    setCallStatus('COMPLETED')
    if (callTimerRef.current) clearInterval(callTimerRef.current)

    // Run analysis
    const analysis = await generateGeminiCallAnalysis(transcript, prospectName, callDurationSec)
    setAnalysisResult(analysis)

    // Persist session to callHistoryStore
    try {
      const liveSession = callHistoryStore.startSession({
        prospectName,
        company: businessProfile.companyName || 'Acme Digital Solutions',
        agentName: cleanAgentName,
        language: simLanguage === 'Hindi' ? 'hi' : simLanguage === 'Gujarati' ? 'gu' : 'en',
        scenario: 'INTERESTED',
        isAIGenerated: true,
      })
      transcript.forEach(t => {
        callHistoryStore.addTranscriptTurn(liveSession.sessionId, {
          speaker: t.speaker,
          text: t.text,
          timestamp: t.time,
          isGeminiGenerated: t.isGemini,
        })
      })
      callHistoryStore.endSession(liveSession.sessionId, {
        outcome: analysis.verdict === 'QUALIFIED' ? 'QUALIFIED' : 'ANSWERED',
        sentiment: analysis.sentiment,
        intent: analysis.intent,
        qualification: analysis.verdict as any,
        buyingSignals: analysis.buyingSignals,
        objections: [],
        summary: analysis.summaryText,
        nextBestAction: analysis.nextAction,
        engagementScore: analysis.score,
        durationSeconds: callDurationSec,
      })
    } catch (e) {
      console.warn('Could not persist to callHistoryStore:', e)
    }

    showToast('info', 'Call Ended', `Analysis ready for ${prospectName}`)

    // Auto-sync session to CRM if enabled
    if (crmConfig.autoSyncCalls) {
      setIsSyncingCrm(true)
      try {
        const syncRes = await syncVoiceCallToCrm({
          callId: `CALL-STUDIO-${Date.now()}`,
          prospectName,
          company: businessProfile.companyName || 'Acme Digital Solutions',
          agentName: cleanAgentName,
          language: simLanguage === 'Hindi' ? 'hi' : simLanguage === 'Gujarati' ? 'gu' : 'en',
          durationSeconds: callDurationSec,
          outcome: analysis.verdict === 'QUALIFIED' ? 'QUALIFIED' : 'ANSWERED',
          sentiment: analysis.sentiment,
          qualification: analysis.verdict as any,
          intentScore: analysis.score,
          summary: analysis.summaryText,
          nextBestAction: analysis.nextAction,
          buyingSignals: analysis.buyingSignals,
          objections: [],
          transcript: transcript.map(t => ({ speaker: t.speaker, text: t.text, time: t.time })),
          targetCrmId: crmConfig.targetCrmId,
        })
        if (syncRes.success) {
          setLastSyncedCrmName(syncRes.crmName)
          showToast('success', 'Synced to CRM', `Auto-pushed call recording & intelligence to ${syncRes.crmName}`)
        }
      } catch (err) {
        console.warn('CRM sync error:', err)
      } finally {
        setIsSyncingCrm(false)
      }
    }
  }

  // Manual Trigger to sync current call studio session to CRM
  async function handleManualSyncCurrentCall() {
    if (!analysisResult) return
    setIsSyncingCrm(true)
    try {
      const syncRes = await syncVoiceCallToCrm({
        callId: `CALL-STUDIO-${Date.now()}`,
        prospectName,
        company: businessProfile.companyName || 'Acme Digital Solutions',
        agentName: cleanAgentName,
        language: simLanguage === 'Hindi' ? 'hi' : simLanguage === 'Gujarati' ? 'gu' : 'en',
        durationSeconds: callDurationSec,
        outcome: analysisResult.verdict === 'QUALIFIED' ? 'QUALIFIED' : 'ANSWERED',
        sentiment: analysisResult.sentiment,
        qualification: analysisResult.verdict as any,
        intentScore: analysisResult.score,
        summary: analysisResult.summaryText,
        nextBestAction: analysisResult.nextAction,
        buyingSignals: analysisResult.buyingSignals,
        objections: [],
        transcript: transcript.map(t => ({ speaker: t.speaker, text: t.text, time: t.time })),
        targetCrmId: crmConfig.targetCrmId,
      }, { force: true })
      if (syncRes.success) {
        setLastSyncedCrmName(syncRes.crmName)
        showToast('success', 'Synced to CRM', `Call recording & intelligence pushed to ${syncRes.crmName}!`)
      }
    } catch (err) {
      showToast('error', 'Sync Failed', 'Failed to sync call with CRM')
    } finally {
      setIsSyncingCrm(false)
    }
  }

  // Push interested prospect directly into CRM
  async function handleSyncInterestedProspect(item: typeof interestedProspectsList[0]) {
    try {
      const res = await syncVoiceCallToCrm({
        callId: item.id,
        prospectName: item.name,
        company: item.company,
        phone: item.phone,
        email: item.email,
        durationSeconds: 210,
        outcome: 'QUALIFIED',
        sentiment: item.sentiment,
        qualification: 'QUALIFIED',
        intentScore: item.score,
        summary: `Call Result: ${item.outcome}`,
        nextBestAction: item.nextAction,
        buyingSignals: item.signals,
        targetCrmId: crmConfig.targetCrmId,
      }, { force: true })

      setSyncedProspectMap(prev => ({
        ...prev,
        [item.id]: { crmName: res.crmName, time: 'Just now' },
      }))
      showToast('success', 'Synced to CRM', `${item.name} (${item.company}) pushed into ${res.crmName}`)
    } catch (e) {
      showToast('error', 'Sync Failed', 'Could not sync prospect to CRM')
    }
  }

  // Batch sync all interested prospects into CRM
  async function handleSyncAllInterestedProspects() {
    showToast('info', 'Syncing Prospects...', 'Batch pushing all interested leads to connected CRM')
    for (const item of interestedProspectsList) {
      await handleSyncInterestedProspect(item)
    }
    showToast('success', 'Batch Sync Complete', 'All interested prospects synced to CRM')
  }

  // Start a new call in studio
  function handleStartNewCall() {
    stopMic()
    cancelSpeech()
    setSpeechActive(false)
    setCallStatus('IN_PROGRESS')
    setCallDurationSec(0)
    setAnalysisResult(null)
    setMicError(null)
    setInterimText('')

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
    // Speak greeting, then enable mic so prospect can respond
    micEnabledRef.current = true
    speakTurn(initialTurn.text)
  }

  // Voicemail Drop action
  function handleVoicemailDrop() {
    stopMic()
    cancelSpeech()
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
    stopMic()
    cancelSpeech()
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
    'We need this for Q4',
    'Can I speak to a human?',
    'I want to book a call with your team'
  ]

  const sentimentColor = (s: string) => s === 'POSITIVE' ? 'text-success' : s === 'NEGATIVE' ? 'text-danger-bright' : 'text-text-muted'
  const qualColor = (q: string) => q === 'QUALIFIED' ? 'badge-success' : q === 'LIKELY' ? 'badge-amber' : q === 'NEEDS_REVIEW' ? 'badge-blue' : 'badge-low'

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bg-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <PhoneCall className="w-5 h-5 text-sky-400 shrink-0" />
            <h1 className="text-lg font-bold text-slate-100 tracking-wide font-sans">{t('voice.title', 'AI Voice Telephony & Speech Agent')}</h1>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold ml-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              {t('voice.online', 'ONLINE')}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
              Agent: {cleanAgentName}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Multilingual outbound voice AI with speech recognition, dynamic objection handling & Calendly SMS dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setCallStudioOpen(true)
              if (callStatus === 'IDLE') handleStartNewCall()
            }}
            className="btn-primary text-xs py-2 px-3.5 flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <Mic className="w-3.5 h-3.5" />
            Live Call Studio & Speech
          </button>
          <button
            onClick={() => setConfigOpen(true)}
            className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            Configure Agent
          </button>
        </div>
      </div>

      {/* Real-time CRM Sync Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-bg-secondary rounded-lg border border-bg-border text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Link2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-2xs font-semibold text-text-primary flex items-center gap-2">
              Enterprise CRM Synchronization
              <span className="badge-success text-3xs font-mono">LIVE 2-WAY SYNC</span>
            </div>
            <div className="text-3xs text-text-muted">
              Every completed call, transcript, sentiment score & next action auto-pushes to {availableCrms.filter(c => c.status === 'CONNECTED').map(c => c.name).join(', ') || 'Salesforce CRM'} within 5 seconds.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/crm')}
            className="btn-secondary text-3xs py-1 px-2.5 font-semibold flex items-center gap-1 text-amber-400 hover:border-amber-500/50"
          >
            Manage CRM Integrations <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard label={t('voice.activeCalls', 'Active Telephony')} value={liveCalls.length} accent icon={<Phone className="w-4 h-4" />} />
        <MetricCard label={t('metric.callsToday', 'Calls Dispatched')} value={845} delta={21.3} />
        <MetricCard label={t('voice.avgDuration', 'Avg Talk Time')} value="3m 12s" delta={12.5} />
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
            <span className="badge-blue text-3xs font-mono hidden sm:inline-flex">
              SYNC TARGET: {crmConfig.targetCrmId.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAllInterestedProspects}
              className="btn-secondary text-3xs py-1 px-2.5 font-semibold gap-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 flex items-center"
              title="Push all interested leads to connected CRM at once"
            >
              <RefreshCw className="w-3 h-3" /> Sync All to CRM
            </button>
            <span className="text-2xs text-text-muted font-mono hidden md:inline">Real-time intent captured from voice outreach</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {interestedProspectsList.map(item => {
            const syncedInfo = syncedProspectMap[item.id]
            return (
              <div key={item.id} className="p-3 bg-bg-card rounded-lg border border-bg-border space-y-2.5 hover:border-emerald-500/40 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      {item.name}
                      <span className="badge-high text-3xs">HOT</span>
                      {syncedInfo && (
                        <span className="badge-success text-3xs py-0 px-1 font-mono flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> CRM
                        </span>
                      )}
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
                    onClick={() => {
                      syncActivityToCrm({
                        type: 'CALENDLY_MEETING',
                        title: `Demo Scheduled: ${item.name}`,
                        prospectName: item.name,
                        company: item.company,
                        details: `Executive demo slot confirmed: ${item.outcome}`,
                        score: item.score,
                        targetCrmId: crmConfig.targetCrmId,
                      })
                      showToast('success', 'Demo Booked & CRM Updated', `Executive demo slot confirmed for ${item.name} and synced to CRM`)
                    }}
                    className="btn-primary text-3xs py-1.5 px-2.5 flex-1 justify-center gap-1 font-semibold"
                  >
                    <Calendar className="w-3 h-3" /> Book Demo
                  </button>
                  <button
                    onClick={() => handleSyncInterestedProspect(item)}
                    className={`btn-secondary text-3xs py-1.5 px-2.5 flex-1 justify-center font-semibold flex items-center gap-1 ${
                      syncedInfo ? 'text-emerald-400 border-emerald-500/30' : 'hover:border-amber-500/40'
                    }`}
                    title={syncedInfo ? `Synced to ${syncedInfo.crmName} (${syncedInfo.time})` : 'Push lead & call notes to CRM'}
                  >
                    {syncedInfo ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                    {syncedInfo ? `Synced (${syncedInfo.crmName.split(' ')[0]})` : 'Sync CRM'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Calendly Booking Tracker Panel */}
      <div className="panel p-4 bg-gradient-to-r from-violet-500/10 via-bg-card to-blue-500/5 border border-violet-500/25 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bg-border pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="text-xs font-bold text-text-primary">Calendly Booking Tracker</span>
            <span className="badge-blue text-3xs font-mono flex items-center gap-1">
              <Smartphone className="w-2.5 h-2.5" /> SMS + CALENDLY
            </span>
            {calendlyStats.followUpScheduled > 0 && (
              <span className="badge-amber text-3xs font-mono flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5" /> {calendlyStats.followUpScheduled} FOLLOW-UP DUE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshCalendlyData}
              className="btn-ghost p-1.5 text-text-muted hover:text-violet-400 transition-colors"
              title="Refresh booking status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowCalendlyTracker(!showCalendlyTracker)}
              className="text-2xs text-violet-400 underline font-mono hover:no-underline"
            >
              {showCalendlyTracker ? 'Collapse' : 'Show Details'}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'SMS Sent', value: calendlyStats.total, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/25' },
            { label: 'Booked ✓', value: calendlyStats.booked, color: 'text-success', bg: 'bg-emerald-500/10 border-emerald-500/25' },
            { label: 'Link Opened', value: calendlyStats.opened, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25' },
            { label: 'Booking Rate', value: `${calendlyStats.bookingRate}%`, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/25' },
          ].map(s => (
            <div key={s.label} className={`p-2.5 rounded-lg border ${s.bg} text-center`}>
              <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
              <div className="text-3xs text-text-muted uppercase font-semibold mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Detailed list */}
        {showCalendlyTracker && (
          <div className="space-y-2 animate-fade-in">
            {calendlyBookings.length === 0 ? (
              <div className="text-center text-2xs text-text-muted py-4">
                No Calendly links sent yet. Links are dispatched automatically when a prospect requests to speak with a human.
              </div>
            ) : (
              calendlyBookings.map(record => (
                <div
                  key={record.id}
                  className={`p-3 rounded-lg border space-y-2 transition-colors ${
                    record.bookingStatus === 'BOOKED'
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : record.bookingStatus === 'LINK_OPENED'
                      ? 'bg-amber-500/5 border-amber-500/25'
                      : record.bookingStatus === 'CANCELLED'
                      ? 'bg-red-500/5 border-red-500/25'
                      : 'bg-bg-card border-bg-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-text-primary">{record.leadName}</span>
                        <span className="text-2xs text-text-muted">· {record.company}</span>
                        <span className={`text-3xs font-bold px-1.5 py-0.5 rounded font-mono ${
                          record.bookingStatus === 'BOOKED' ? 'bg-emerald-500/20 text-emerald-300'
                          : record.bookingStatus === 'LINK_OPENED' ? 'bg-amber-500/20 text-amber-300'
                          : record.bookingStatus === 'CANCELLED' ? 'bg-red-500/20 text-red-300'
                          : record.bookingStatus === 'EMAIL_SENT' ? 'bg-sky-500/20 text-sky-300'
                          : record.bookingStatus === 'DISPATCHED' ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {record.bookingStatus === 'SMS_SENT'
                            ? '📱 SMS SENT'
                            : record.bookingStatus === 'EMAIL_SENT'
                            ? '✉️ EMAIL SENT'
                            : record.bookingStatus === 'DISPATCHED'
                            ? '🚀 EMAIL + SMS'
                            : record.bookingStatus === 'LINK_OPENED'
                            ? '👀 LINK OPENED'
                            : record.bookingStatus === 'BOOKED'
                            ? '✅ BOOKED'
                            : '❌ CANCELLED'}
                        </span>
                        {record.followUpCallScheduled && record.bookingStatus !== 'BOOKED' && (
                          <span className="text-3xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                            🔁 FOLLOW-UP: {record.followUpCallAt}
                          </span>
                        )}
                      </div>
                      <div className="text-3xs text-text-muted mt-0.5 font-mono">
                        {record.dispatchChannel === 'EMAIL'
                          ? `✉️ Mail: ${record.leadEmail}`
                          : record.dispatchChannel === 'BOTH'
                          ? `🚀 Mail: ${record.leadEmail} · Phone: ${record.leadPhone}`
                          : `📱 SMS: ${record.leadPhone}`} · {record.emailSentAtIST || record.smsSentAtIST} · Agent: {record.agentName}
                      </div>
                      {record.bookedSlot && (
                        <div className="text-2xs text-success font-semibold mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {record.bookedSlot}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 shrink-0">
                      {record.bookingStatus !== 'BOOKED' && (
                        <>
                          <button
                            onClick={() => {
                              simulateCalendlyEvent(record.id, 'booked')
                              refreshCalendlyData()
                              syncActivityToCrm({
                                type: 'CALENDLY_MEETING',
                                title: `Meeting Confirmed: ${record.leadName}`,
                                prospectName: record.leadName,
                                company: record.company || 'Enterprise Partner',
                                details: `Prospect confirmed Calendly demo via SMS link (${record.calendlyLink}). Booked slot: ${record.bookedSlot || 'Tomorrow 3:00 PM IST'}`,
                                score: 95,
                                targetCrmId: crmConfig.targetCrmId,
                              })
                              showToast('success', 'Booking Confirmed & Synced', `${record.leadName} booked slot via Calendly — Pushed to CRM Calendar!`)
                            }}
                            className="text-3xs px-1.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 font-semibold transition-colors"
                            title="Simulate: Calendly booking confirmed"
                          >
                            Sim. Book
                          </button>
                          <button
                            onClick={() => {
                              simulateCalendlyEvent(record.id, 'opened')
                              refreshCalendlyData()
                              showToast('info', 'Link Opened', `${record.leadName} opened the Calendly link`)
                            }}
                            className="text-3xs px-1.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 font-semibold transition-colors"
                            title="Simulate: Calendly link opened"
                          >
                            Sim. Open
                          </button>
                          <button
                            onClick={() => setFollowUpModal({ open: true, recordId: record.id, leadName: record.leadName })}
                            className="text-3xs px-1.5 py-1 rounded bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30 font-semibold transition-colors"
                            title="Schedule follow-up re-call"
                          >
                            Re-call
                          </button>
                        </>
                      )}
                      <a
                        href={record.calendlyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-3xs px-1.5 py-1 rounded bg-bg-secondary text-text-muted hover:text-blue-400 border border-bg-border font-semibold transition-colors flex items-center gap-0.5"
                        title="Open Calendly link"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-3xs text-text-muted pt-1 border-t border-bg-border/50">
          <span className="font-mono">Webhook: POST /api/webhooks/calendly · SMS via Twilio</span>
          <button
            onClick={() => {
              setShowCalendlyTracker(true)
              setShowCalendlySmsModal(true)
              setCalendlySmsSent(false)
            }}
            className="btn-secondary text-3xs py-1 px-2.5 gap-1 text-violet-400 border-violet-500/30 hover:bg-violet-500/10 font-medium"
          >
            <Smartphone className="w-3 h-3" /> Send Manual SMS
          </button>
        </div>
      </div>

      {/* ── Real Phone Call Integration (Twilio Voice + WebSocket + Gemini 2.0) ── */}
      <PhoneCallPanel />

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
                  stopMic()
                  cancelSpeech()
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

            {/* Automation Actions Toolbar (Voicemail, Callback, FAQs, Calendly SMS, Retries) */}
            {callStatus === 'IN_PROGRESS' && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-bg-card rounded-lg border border-bg-border text-2xs">
                <div className="flex items-center gap-2 flex-wrap">
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

                  {/* Calendly Mail / SMS Dispatch Button */}
                  <button
                    type="button"
                    onClick={() => { setShowCalendlySmsModal(true); setCalendlySmsSent(false) }}
                    className={`btn-secondary text-3xs py-1 px-2.5 gap-1 font-medium transition-all ${
                      humanTransferDetected
                        ? 'text-violet-300 border-violet-400 bg-violet-500/15 animate-pulse'
                        : 'text-violet-400 border-violet-500/30 hover:bg-violet-500/10'
                    }`}
                    title="Send Calendly booking link via Mail or SMS"
                  >
                    <Mail className="w-3 h-3 text-sky-400" />
                    {humanTransferDetected ? '⚡ Send Calendly Link' : 'Send Calendly Link'}
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

            {/* Neural Speech Engine Standby Banner */}
            <div className="p-2.5 bg-bg-card rounded-lg border border-bg-border flex items-center justify-between font-mono text-2xs">
              <div className="flex items-center gap-1.5">
                {micActive ? (
                  <span className="flex items-center gap-1.5 text-red-400 animate-pulse">
                    <Mic className="w-3 h-3" />
                    <span className="font-sans font-medium">Mic Live — Listening to {prospectName}…</span>
                  </span>
                ) : speechActive ? (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Volume2 className="w-3 h-3" />
                    <span className="font-sans font-medium">{cleanAgentName} Voice Synthesizer Active</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-text-muted">
                    <span className="tracking-widest text-amber-400">•••••••••••••</span>
                    <span className="font-sans">Neural Speech Engine Standby</span>
                  </span>
                )}
              </div>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-emerald-400" /> @ {DISPLAY_ENGINE_LABEL}
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

            {/* Prospect Voice Input + Text Fallback */}
            {callStatus === 'IN_PROGRESS' && (
              <div className="space-y-3 pt-1">
                {/* Live Interim Transcript (what mic is hearing) */}
                {interimText && (
                  <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-2xs text-blue-200 italic animate-pulse">
                    <span className="text-blue-400 font-semibold not-italic">{prospectName}: </span>
                    {interimText}<span className="animate-ping ml-0.5">▌</span>
                  </div>
                )}

                {/* Mic error */}
                {micError && (
                  <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-2xs text-red-300">
                    ⚠ {micError}
                  </div>
                )}

                {/* Big Mic Button Row */}
                <div className="flex items-center gap-3">
                  {/* Mic toggle button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (micActive) {
                        micEnabledRef.current = false
                        stopMic()
                        showToast('info', 'Mic Paused', 'Click the mic again to resume listening')
                      } else {
                        micEnabledRef.current = true
                        startMic()
                        showToast('success', 'Mic Active', `Listening to ${prospectName} — speak now`)
                      }
                    }}
                    disabled={isAiResponding || speechActive}
                    title={micActive ? 'Click to pause mic' : 'Click to activate microphone'}
                    className={`relative flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-40 ${
                      micActive
                        ? 'bg-red-500 shadow-red-500/40 scale-110 animate-pulse'
                        : 'bg-bg-card border-2 border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/10'
                    }`}
                  >
                    <Mic className={`w-6 h-6 ${micActive ? 'text-white' : 'text-amber-400'}`} />
                    {micActive && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full border-2 border-bg-primary animate-ping" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1.5">
                    <div className="text-3xs uppercase font-bold text-text-muted flex items-center gap-1.5">
                      <Mic className="w-3 h-3 text-red-400" />
                      {micActive
                        ? `LISTENING — speak as ${prospectName} · say "disconnect" to end call`
                        : 'CLICK MIC OR TYPE BELOW — Gemini AI will respond'}
                    </div>

                    {/* Text input fallback */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input text-xs flex-1 py-2 px-3 border-bg-border focus:border-amber-400"
                        placeholder={micActive ? "Also type here if mic isn't picking up…" : `Type what ${prospectName} says…`}
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSendMessage() }}
                        disabled={isAiResponding}
                      />
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!userInput.trim() || isAiResponding}
                        className="btn-primary text-xs py-2 px-3 gap-1.5 font-bold disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" /> Send
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick-chip suggestions */}
                <div className="flex flex-wrap gap-1.5">
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

                {/* Dedicated CRM Intelligence Sync Box */}
                <div className="p-2.5 bg-bg-secondary rounded border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-3xs font-semibold text-emerald-400">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>CRM Timeline Hand-off</span>
                    </div>
                    {lastSyncedCrmName ? (
                      <span className="badge-success text-3xs py-0.5 px-1.5 font-mono flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Synced to {lastSyncedCrmName}
                      </span>
                    ) : (
                      <span className="badge-amber text-3xs py-0.5 px-1.5 font-mono">
                        Ready to Sync
                      </span>
                    )}
                  </div>
                  <div className="text-3xs text-text-muted leading-tight">
                    Audio recording, full conversation transcript, buying signals, and {analysisResult.score}% qualification score mapped to {crmConfig.targetCrmId.toUpperCase()} Contact & Activity records.
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-3xs text-text-secondary">
                      <span>Target:</span>
                      <select
                        className="bg-bg-card border border-bg-border rounded px-1.5 py-0.5 text-3xs text-text-primary focus:outline-none focus:border-amber-400"
                        value={crmConfig.targetCrmId}
                        onChange={e => {
                          const updated = saveVoiceAgentCrmConfig({ targetCrmId: e.target.value })
                          setCrmConfig(updated)
                        }}
                      >
                        {availableCrms.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleManualSyncCurrentCall}
                        disabled={isSyncingCrm}
                        className="btn-primary text-3xs py-1 px-2.5 font-semibold flex items-center gap-1 disabled:opacity-50"
                      >
                        {isSyncingCrm ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                        {isSyncingCrm ? 'Syncing...' : lastSyncedCrmName ? 'Re-Sync CRM' : 'Push to CRM'}
                      </button>
                      <button
                        onClick={() => {
                          setCallStudioOpen(false)
                          navigate('/crm')
                        }}
                        className="btn-secondary text-3xs py-1 px-2 font-semibold flex items-center gap-1 text-amber-400"
                        title="Open CRM Hub"
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> CRM Hub
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        syncActivityToCrm({
                          type: 'CALENDLY_MEETING',
                          title: `Executive Demo: ${prospectName}`,
                          prospectName,
                          company: businessProfile.companyName || 'Enterprise Partner',
                          details: `Demo meeting scheduled following AI Voice qualification call. Next action: ${analysisResult.nextAction}`,
                          score: analysisResult.score,
                          targetCrmId: crmConfig.targetCrmId,
                        })
                        showToast('success', 'Demo Booked & Synced', `Demo slot scheduled for ${prospectName} and pushed to CRM!`)
                      }}
                      className="btn-secondary text-3xs py-1.5 px-3 font-semibold flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3 text-amber-400" /> Book Demo
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
      {/* Calendly SMS Dispatch Modal */}
      {showCalendlySmsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel max-w-md w-full p-5 space-y-4 border border-violet-500/40 shadow-2xl animate-fade-in max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0">
                  {calendlyDispatchChannel === 'EMAIL' ? (
                    <Mail className="w-4 h-4 text-sky-400" />
                  ) : calendlyDispatchChannel === 'SMS' ? (
                    <Smartphone className="w-4 h-4 text-violet-400" />
                  ) : (
                    <Send className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-text-primary flex items-center gap-2">
                    Send Calendly Booking Link
                    {humanTransferDetected && (
                      <span className="badge-amber text-3xs font-mono">🤖 AI DETECTED</span>
                    )}
                  </div>
                  <div className="text-3xs text-text-muted">
                    {humanTransferDetected
                      ? `${prospectName} requested to speak with a human — send them a booking link`
                      : calendlyDispatchChannel === 'EMAIL'
                      ? `Dispatch direct Calendly booking invitation via Mail to ${prospectName}`
                      : calendlyDispatchChannel === 'SMS'
                      ? `Dispatch direct Calendly booking SMS to ${prospectName}`
                      : `Dispatch Calendly booking link via Mail & SMS to ${prospectName}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setShowCalendlySmsModal(false); setCalendlySmsSent(false) }}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!calendlySmsSent ? (
              <>
                {/* Channel Selector Pills */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-bg-secondary rounded-lg border border-bg-border text-2xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCalendlyDispatchChannel('EMAIL')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded transition-all ${
                      calendlyDispatchChannel === 'EMAIL'
                        ? 'bg-violet-600 text-white shadow-sm font-bold'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Mail className="w-3 h-3" /> Mail (Email)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendlyDispatchChannel('SMS')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded transition-all ${
                      calendlyDispatchChannel === 'SMS'
                        ? 'bg-violet-600 text-white shadow-sm font-bold'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" /> SMS (Twilio)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendlyDispatchChannel('BOTH')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded transition-all ${
                      calendlyDispatchChannel === 'BOTH'
                        ? 'bg-violet-600 text-white shadow-sm font-bold'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Zap className="w-3 h-3" /> Email + SMS
                  </button>
                </div>

                {/* Prospect Contact Info */}
                <div className="p-3 bg-bg-secondary rounded-lg border border-bg-border space-y-2 text-xs">
                  {/* Prospect Name */}
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Prospect:</span>
                    <span className="font-bold text-text-primary">{prospectName}</span>
                  </div>

                  {/* Mail Address (Editable - default tanishqgt32@gmail.com) */}
                  <div className="flex flex-col gap-1 pt-1.5 border-t border-bg-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted flex items-center gap-1">
                        <Mail className="w-3 h-3 text-sky-400" /> Mail Address:
                      </span>
                      {!isEditingEmail ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sky-300 font-semibold truncate max-w-[200px]" title={prospectEmail}>
                            {prospectEmail}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEmailInput(prospectEmail)
                              setIsEditingEmail(true)
                            }}
                            className="text-3xs text-violet-400 hover:text-violet-300 underline font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleSaveEmail}
                            className="text-3xs px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-500 text-white font-semibold"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEmailInput(prospectEmail)
                              setIsEditingEmail(false)
                            }}
                            className="text-3xs text-text-muted hover:text-text-primary px-1"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditingEmail && (
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="e.g. tanishqgt32@gmail.com"
                        className="w-full text-xs font-mono bg-bg-card border border-violet-500/50 rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-violet-400"
                        autoFocus
                      />
                    )}
                  </div>

                  {/* Phone Number (Editable) */}
                  <div className="flex flex-col gap-1 pt-1.5 border-t border-bg-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-violet-400" /> Phone Number:
                      </span>
                      {!isEditingPhone ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-violet-300 font-semibold">{prospectPhone}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setPhoneInput(prospectPhone)
                              setIsEditingPhone(true)
                            }}
                            className="text-3xs text-violet-400 hover:text-violet-300 underline font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleSavePhone}
                            className="text-3xs px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-500 text-white font-semibold"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPhoneInput(prospectPhone)
                              setIsEditingPhone(false)
                            }}
                            className="text-3xs text-text-muted hover:text-text-primary px-1"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditingPhone && (
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="e.g. +91 98201 44892"
                        className="w-full text-xs font-mono bg-bg-card border border-violet-500/50 rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-violet-400"
                        autoFocus
                      />
                    )}
                  </div>

                  {/* Calendly Link */}
                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-bg-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-400" /> Calendly Link:
                      </span>
                      {!isEditingCalendlyUrl ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={customCalendlyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline text-2xs font-mono flex items-center gap-0.5 truncate max-w-[200px]"
                            title={customCalendlyUrl}
                          >
                            {customCalendlyUrl.replace(/^https?:\/\//, '')} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setCalendlyUrlInput(customCalendlyUrl)
                              setIsEditingCalendlyUrl(true)
                            }}
                            className="text-3xs text-violet-400 hover:text-violet-300 underline font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = calendlyUrlInput.trim()
                              if (trimmed) {
                                setCustomCalendlyLink(trimmed)
                                setCustomCalendlyUrl(trimmed)
                              }
                              setIsEditingCalendlyUrl(false)
                            }}
                            className="text-3xs px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-500 text-white font-semibold"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCalendlyUrlInput(customCalendlyUrl)
                              setIsEditingCalendlyUrl(false)
                            }}
                            className="text-3xs text-text-muted hover:text-text-primary px-1"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditingCalendlyUrl && (
                      <input
                        type="url"
                        value={calendlyUrlInput}
                        onChange={(e) => setCalendlyUrlInput(e.target.value)}
                        placeholder="https://calendly.com/your-username/30min"
                        className="w-full text-xs font-mono bg-bg-card border border-violet-500/50 rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-violet-400"
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                {/* Email Preview */}
                {(calendlyDispatchChannel === 'EMAIL' || calendlyDispatchChannel === 'BOTH') && (
                  <div className="p-3 bg-violet-500/5 border border-violet-500/25 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between text-3xs">
                      <span className="text-violet-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Mail className="w-3 h-3 text-sky-400" /> EMAIL PREVIEW
                      </span>
                      <span className="text-text-muted font-mono truncate max-w-[190px]">
                        To: <strong className="text-sky-400">{prospectEmail}</strong>
                      </span>
                    </div>
                    <div className="text-3xs text-text-muted pb-1 border-b border-violet-500/10 font-mono">
                      Subject: <span className="text-text-secondary">Invitation: Strategy Call & Calendly Booking with {businessProfile.companyName || 'Callisto AI Solutions'}</span>
                    </div>
                    <div className="text-2xs text-text-secondary leading-relaxed space-y-1">
                      <div>Hi <strong className="text-text-primary">{prospectName.split(' ')[0]}</strong>,</div>
                      <div>
                        This is <strong className="text-text-primary">{cleanAgentName}</strong> from{' '}
                        <strong className="text-text-primary">{businessProfile.companyName || 'Callisto AI Solutions'}</strong>.
                        As requested during our call, here is your direct link to book a time with our team:
                      </div>
                      <div className="p-1.5 bg-violet-500/10 rounded border border-violet-500/20 text-center my-1">
                        <a href={customCalendlyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-mono underline font-bold text-2xs inline-flex items-center gap-1">
                          📅 {customCalendlyUrl.replace(/^https?:\/\//, '')} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <div className="text-3xs text-text-muted">
                        All meeting slots are pre-approved. Book now and we'll confirm within minutes! 🗓️
                      </div>
                    </div>
                  </div>
                )}

                {/* SMS Preview */}
                {calendlyDispatchChannel === 'SMS' && (
                  <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between text-3xs">
                      <span className="text-violet-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Smartphone className="w-3 h-3" /> SMS PREVIEW
                      </span>
                      <span className="text-text-muted font-mono">
                        To: <strong className="text-violet-300">{prospectPhone}</strong>
                      </span>
                    </div>
                    <div className="text-2xs text-text-secondary leading-relaxed">
                      Hi <strong className="text-text-primary">{prospectName.split(' ')[0]}</strong>! This is{' '}
                      <strong className="text-text-primary">{cleanAgentName}</strong> from{' '}
                      <strong className="text-text-primary">{businessProfile.companyName || 'Callisto AI Solutions'}</strong>.
                      As requested, here is a direct link to book a time with our team:
                      {' '}<span className="text-blue-400 underline">{customCalendlyUrl.replace(/^https?:\/\//, '')}</span>
                      {' '}All meeting slots are pre-approved. Book now and we'll confirm within minutes! 🗓️
                    </div>
                  </div>
                )}

                {/* What happens next */}
                <div className="space-y-1.5 text-2xs text-text-muted">
                  {[
                    {
                      icon: calendlyDispatchChannel === 'EMAIL' ? <Mail className="w-3 h-3 text-sky-400" /> : <Smartphone className="w-3 h-3 text-violet-400" />,
                      text:
                        calendlyDispatchChannel === 'EMAIL'
                          ? `Email sent via Callisto Mail Gateway to ${prospectEmail}`
                          : calendlyDispatchChannel === 'SMS'
                          ? `SMS sent via Twilio to ${prospectPhone}`
                          : `Dispatched to ${prospectEmail} & ${prospectPhone}`,
                    },
                    { icon: <Calendar className="w-3 h-3 text-emerald-400" />, text: 'Calendly shows your pre-configured available slots' },
                    { icon: <UserCheck className="w-3 h-3 text-blue-400" />, text: 'Booking tracked in real-time in the Booking Tracker' },
                    { icon: <AlertTriangle className="w-3 h-3 text-amber-400" />, text: 'If not booked in 24h, AI will auto follow-up' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-bg-border">
                  <button onClick={() => { setShowCalendlySmsModal(false); setCalendlySmsSent(false) }} className="btn-secondary text-xs">
                    Cancel
                  </button>
                  <button
                    onClick={handleSendCalendlyDispatch}
                    disabled={calendlySmsSending}
                    className="btn-primary text-xs gap-1.5 font-semibold bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 border-violet-400 disabled:opacity-60 shadow-lg"
                  >
                    {calendlySmsSending ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                    ) : calendlyDispatchChannel === 'EMAIL' ? (
                      <><Mail className="w-3.5 h-3.5" /> Send Calendly Email Now</>
                    ) : calendlyDispatchChannel === 'SMS' ? (
                      <><Smartphone className="w-3.5 h-3.5" /> Send Calendly SMS Now</>
                    ) : (
                      <><Send className="w-3.5 h-3.5" /> Send via Mail & SMS Now</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="space-y-4 py-2">
                <div className="flex flex-col items-center gap-3 py-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-sm font-bold text-text-primary">
                      {lastDispatchedChannel === 'EMAIL'
                        ? 'Calendly Email Dispatched!'
                        : lastDispatchedChannel === 'SMS'
                        ? 'Calendly SMS Dispatched!'
                        : 'Calendly Link Dispatched (Mail & SMS)!'}
                    </div>
                    <div className="text-2xs text-text-muted max-w-xs mx-auto">
                      Booking link delivered to{' '}
                      {lastDispatchedChannel === 'EMAIL' || lastDispatchedChannel === 'BOTH' ? (
                        <strong className="text-sky-300">{prospectEmail}</strong>
                      ) : null}
                      {lastDispatchedChannel === 'BOTH' ? ' and ' : ''}
                      {lastDispatchedChannel === 'SMS' || lastDispatchedChannel === 'BOTH' ? (
                        <strong className="text-violet-300">{prospectPhone}</strong>
                      ) : null}.
                      Tracking is now active in the Calendly Booking Tracker.
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-bg-secondary rounded-lg border border-bg-border space-y-1.5 text-2xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Status:</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {lastDispatchedChannel === 'EMAIL'
                        ? '✉️ EMAIL DELIVERED'
                        : lastDispatchedChannel === 'SMS'
                        ? '📱 SMS DELIVERED'
                        : '🚀 EMAIL + SMS DELIVERED'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Recipient:</span>
                    <span className="text-text-primary font-mono truncate max-w-[200px]">
                      {lastDispatchedChannel === 'EMAIL' ? prospectEmail : lastDispatchedChannel === 'SMS' ? prospectPhone : `${prospectEmail} · ${prospectPhone}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Auto Follow-up:</span>
                    <span className="text-amber-400">If no booking in 24h → AI re-calls</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 flex-wrap">
                  {calendlyBookings[0]?.previewUrl && (
                    <a
                      href={calendlyBookings[0].previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Sent Email
                    </a>
                  )}
                  {(lastDispatchedChannel === 'EMAIL' || lastDispatchedChannel === 'BOTH') && (
                    <a
                      href={`mailto:${prospectEmail}?subject=${encodeURIComponent(`Invitation: Strategy Call & Calendly Booking with ${businessProfile.companyName || 'Callisto AI Solutions'}`)}&body=${encodeURIComponent(
                        `Hi ${prospectName.split(' ')[0]},\n\nHere is your direct link to book a time with our team:\n${customCalendlyUrl}\n\nAll meeting slots are pre-approved. Book now and we'll confirm within minutes!`
                      )}`}
                      className="btn-secondary text-xs gap-1.5 text-sky-400 border-sky-500/30 hover:bg-sky-500/10"
                    >
                      <Mail className="w-3.5 h-3.5" /> Open in Mail App
                    </a>
                  )}
                  <button
                    onClick={() => { setShowCalendlySmsModal(false); setShowCalendlyTracker(true) }}
                    className="btn-primary text-xs gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" /> View Booking Tracker
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow-up Re-call Scheduling Modal */}
      {followUpModal.open && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel max-w-md w-full p-5 space-y-4 border border-amber-500/40 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-text-primary">Schedule Follow-up Re-call</span>
              </div>
              <button onClick={() => setFollowUpModal({ open: false, recordId: '', leadName: '' })} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-2xs text-text-secondary leading-relaxed">
              <strong className="text-text-primary">{followUpModal.leadName}</strong> has not booked via the Calendly link.
              Schedule an AI re-call to follow up and re-send the booking link.
            </p>

            <div className="space-y-2">
              {[
                { slot: 'In 2 hours (today)', label: 'Quick Follow-up · In 2 Hours' },
                { slot: 'Tomorrow, 10:00 AM IST', label: 'Tomorrow Morning · 10:00 AM IST' },
                { slot: 'Tomorrow, 3:00 PM IST', label: 'Tomorrow Afternoon · 3:00 PM IST' },
                { slot: 'Next Monday, 11:00 AM IST', label: 'Next Week · Monday 11:00 AM IST' },
              ].map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    scheduleFollowUpCall(followUpModal.recordId, opt.slot)
                    refreshCalendlyData()
                    setFollowUpModal({ open: false, recordId: '', leadName: '' })
                    showToast('success', 'Follow-up Scheduled', `AI will re-call ${followUpModal.leadName} — ${opt.slot}`)
                  }}
                  className="w-full text-left p-2.5 rounded bg-bg-card hover:bg-amber-500/10 border border-bg-border hover:border-amber-500/40 transition-colors flex items-center justify-between group"
                >
                  <span className="text-xs text-text-primary group-hover:text-amber-300">{opt.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-amber-400" />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-bg-border text-3xs text-text-muted">
              <span>Follow-up re-calls re-send the Calendly SMS automatically</span>
              <button onClick={() => setFollowUpModal({ open: false, recordId: '', leadName: '' })} className="btn-secondary text-xs">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
