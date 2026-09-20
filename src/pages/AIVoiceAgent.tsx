import { useState, useRef, useEffect } from 'react'
import {
  PhoneCall, Phone, Circle, X, MessageSquare, Calendar, FileText, Server,
  Sliders, CheckCircle, Volume2, ShieldCheck, Check, Sparkles, Star,
  Mic, Clock, RefreshCw, Send, ArrowRight, CornerDownRight, Play, User,
  FastForward, RotateCcw
} from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { calls, type Call } from '@/data/calls'
import { formatDuration, formatTimestamp } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import { useAppContext } from '@/contexts/AppContext'

const liveCalls = [
  { id: 'LC1', prospect: 'Rahul Mehta',        company: 'Acme Digital Solutions',   location: 'Bangalore, India',   duration: 247, sentiment: 'POSITIVE', qualification: 'QUALIFIED', stage: 'Presenting solution', lang: 'English' },
  { id: 'LC2', prospect: 'Sarah Johnson',      company: 'NexaFinance Corp',         location: 'New York, USA',      duration: 183, sentiment: 'POSITIVE', qualification: 'QUALIFIED', stage: 'Scheduling meeting', lang: 'English' },
  { id: 'LC3', prospect: 'Mohammed Al-Rashidi',company: 'Emirates Future Tech',     location: 'Dubai, UAE',         duration: 94,  sentiment: 'NEUTRAL',  qualification: 'LIKELY',    stage: 'Needs assessment',   lang: 'Arabic' },
  { id: 'LC4', prospect: 'Kavitha Reddy',      company: 'Bharat Insurance Group',  location: 'Hyderabad, India',   duration: 312, sentiment: 'POSITIVE', qualification: 'QUALIFIED', stage: 'Demo in progress',   lang: 'Hindi' },
  { id: 'LC5', prospect: 'Oliver Schmidt',     company: 'Deutech Manufacturing',   location: 'Munich, Germany',    duration: 61,  sentiment: 'NEUTRAL',  qualification: 'NEEDS_REVIEW', stage: 'Objection handling', lang: 'German' },
  { id: 'LC6', prospect: 'Priya Sharma',       company: 'TechVenture Labs',         location: 'Mumbai, India',      duration: 142, sentiment: 'POSITIVE', qualification: 'LIKELY',    stage: 'Qualification Q&A',  lang: 'Hindi' },
]

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

function getScenarioScript(
  scenario: 'INTERESTED' | 'VOICEMAIL' | 'CALLBACK' | 'FAQ' | 'RETRY',
  lang: 'en' | 'hi' | 'gu',
  name: string
): Array<{ speaker: 'AI' | 'PROSPECT'; text: string; time: string }> {
  if (lang === 'hi') {
    if (scenario === 'INTERESTED') {
      return [
        { speaker: 'AI', text: `नमस्ते राहुल जी, मैं Callisto AI से ${name} बात कर रही हूँ। क्या आप अपनी सेल्स टीम के लिए AI वॉइस कॉलिंग का समाधान ढूंढ रहे हैं?`, time: '00:03' },
        { speaker: 'PROSPECT', text: `हाँ ${name} जी, हम निश्चित रूप से अगले महीने से ऐसा सिस्टम शुरू करना चाहते हैं। क्या यह सेल्सफ़ोर्स से जुड़ सकता है?`, time: '00:11' },
        { speaker: 'AI', text: 'जी बिल्कुल! हमारा सिस्टम सेल्सफ़ोर्स CRM से सीधे जुड़ता है और सभी कॉल्स का रीयल-टाइम रिकॉर्ड रखता है। क्या हम मंगलवार सुबह 11 बजे का डेमो तय कर सकते हैं?', time: '00:22' },
        { speaker: 'PROSPECT', text: 'बिल्कुल ठीक है, मंगलवार 11 बजे का समय बुक कर दीजिए।', time: '00:30' },
        { speaker: 'AI', text: `बहुत बढ़िया! डेमो आमंत्रण rahul.mehta@acmedigital.com पर भेज दिया गया है। ${name} और Callisto AI टीम की तरफ से धन्यवाद!`, time: '00:38' },
      ]
    } else if (scenario === 'VOICEMAIL') {
      return [
        { speaker: 'AI', text: 'बीप टोन का पता चला — वॉइसमेल रिकॉर्डिंग शुरू...', time: '00:04' },
        { speaker: 'AI', text: `नमस्ते राहुल जी, यह Callisto AI से ${name} का संदेश है। हमने आपकी AI सेल्स आउटरीच आवश्यकता देखी। कृपया सुविधा अनुसार +91 80 4912 0000 पर कॉल करें।`, time: '00:12' },
        { speaker: 'AI', text: 'वॉइसमेल सफलतापूर्वक भेज दिया गया। कॉलबैक का इंतज़ार है।', time: '00:22' },
      ]
    } else if (scenario === 'CALLBACK') {
      return [
        { speaker: 'AI', text: `नमस्ते, क्या मैं राहुल जी से बात कर सकती हूँ? मैं Callisto AI से ${name} बोल रही हूँ।`, time: '00:02' },
        { speaker: 'PROSPECT', text: 'नमस्ते, मैं अभी एक मीटिंग में व्यस्त हूँ। क्या आप कल दोपहर 2 बजे कॉल कर सकते हैं?', time: '00:08' },
        { speaker: 'AI', text: `बिल्कुल राहुल जी, मैंने कल दोपहर 2:00 बजे के लिए स्वचालित कॉलबैक सेट कर दिया है। धन्यवाद!`, time: '00:16' },
        { speaker: 'AI', text: 'कॉलबैक सिस्टम में शेड्यूल्ड: कल दोपहर 2:00 बजे IST।', time: '00:22' },
      ]
    } else if (scenario === 'FAQ') {
      return [
        { speaker: 'AI', text: `नमस्ते राहुल जी! मैं Callisto AI से ${name} बोल रही हूँ। क्या आपके पास हमारे AI वॉइस एजेंट को लेकर कोई सवाल हैं?`, time: '00:02' },
        { speaker: 'PROSPECT', text: 'हाँ, क्या आपका AI वॉइस एजेंट हिंदी और गुजराती में भी बिना किसी रुकावट के वास्तविक समय में बात कर सकता है?', time: '00:10' },
        { speaker: 'AI', text: 'जी हाँ! हम बहुभाषी न्यूरल इंजन का उपयोग करते हैं जिससे बातचीत बिना किसी रुकावट के हिंदी, गुजराती और अंग्रेज़ी में 400ms से कम लैटेंसी के साथ होती है।', time: '00:22' },
        { speaker: 'PROSPECT', text: 'शानदार! हमें इसका एंटरप्राइज ट्रायल शुरू करना है।', time: '00:29' },
        { speaker: 'AI', text: `शानदार! ऑनबोर्डिंग लिंक और API क्रेडेंशियल्स तैयार कर दिए गए हैं।`, time: '00:36' },
      ]
    } else {
      return [
        { speaker: 'AI', text: 'आउटबाउंड कॉल शुरू... डायल कर रहे हैं (+91 98201 44892)...', time: '00:03' },
        { speaker: 'AI', text: '30 सेकंड तक कोई जवाब नहीं मिला (रिंगिंग समाप्त)।', time: '00:30' },
        { speaker: 'AI', text: 'पुनः प्रयास नियम सक्रिय: प्रयास 1/3 दर्ज। अगला कॉल 4 घंटे में स्वचालित रूप से होगा।', time: '00:33' },
      ]
    }
  } else if (lang === 'gu') {
    if (scenario === 'INTERESTED') {
      return [
        { speaker: 'AI', text: `નમસ્તે રાહુલભાઈ, હું Callisto AI માંથી ${name} બોલું છું. શું આપ સેલ્સ ઓટોમેશન માટે વાત કરવા માટે 2 મિનિટ ફાળવી શકશો?`, time: '00:03' },
        { speaker: 'PROSPECT', text: `હા ${name}બહેન, અમે અમારી સેલ્સ ટીમ માટે AI વૉઇસ કૉલિંગ પ્લેટફોર્મ શોધી રહ્યા છીએ. શું આ CRM સાથે સિંક થાય છે?`, time: '00:10' },
        { speaker: 'AI', text: 'ઉત્તમ! અમારું સિસ્ટમ ગુજરાતી, હિન્દી અને અંગ્રેજીમાં વાતચીત કરી શકે છે અને આપના CRM સાથે રીયલ-ટાઇમ જોડાય છે. શું આપણે મંગળવારે ડેમો રાખી શકીએ?', time: '00:22' },
        { speaker: 'PROSPECT', text: 'ચોક્કસ, મંગળવારે 11 વાગ્યે મીટિંગ રાખી દો.', time: '00:29' },
        { speaker: 'AI', text: `ડેમો કન્ફર્મ થઈ ગયો છે અને કેલેન્ડર ઇન્વાઇટ મોકલી દેવાયું છે. ${name} અને Callisto AI તરફથી આભાર!`, time: '00:37' },
      ]
    } else if (scenario === 'VOICEMAIL') {
      return [
        { speaker: 'AI', text: 'બીપ અવાજ ડિટેક્ટ થયો — વોઇસમેલ રેકોર્ડિંગ શરૂ...', time: '00:03' },
        { speaker: 'AI', text: `નમસ્તે રાહુલભાઈ, આ Callisto AI માંથી ${name} નો સંદેશ છે. અમે આપના સેલ્સ પ્રોજેક્ટ માટે કૉલ કર્યો હતો. કૃપા કરીને +91 80 4912 0000 પર સંપર્ક કરો.`, time: '00:12' },
        { speaker: 'AI', text: 'વોઇસમેલ સફળતાપૂર્વક મોકલવામાં આવ્યો.', time: '00:22' },
      ]
    } else if (scenario === 'CALLBACK') {
      return [
        { speaker: 'AI', text: `નમસ્તે રાહુલભાઈ, હું Callisto AI માંથી ${name} કૉલ કરું છું.`, time: '00:02' },
        { speaker: 'PROSPECT', text: 'હું અત્યારે એક મહત્વપૂર્ણ મીટિંગમાં છું, શું તમે આવતીકાલે બપોરે 3 વાગ્યે કૉલ કરી શકો?', time: '00:08' },
        { speaker: 'AI', text: `ચોક્કસ રાહુલભાઈ! મેં આવતીકાલે બપોરે 3:00 વાગ્યા માટે કોલબેક શેડ્યૂલ કરી દીધું છે. આભાર!`, time: '00:16' },
        { speaker: 'AI', text: 'કોલબેક સિસ્ટમમાં કતારબદ્ધ: આવતીકાલે બપોરે 3:00 વાગ્યે IST.', time: '00:22' },
      ]
    } else if (scenario === 'FAQ') {
      return [
        { speaker: 'AI', text: `નમસ્તે રાહુલભાઈ! હું Callisto AI માંથી ${name} છું. આપની કંપની માટે કોઈ પ્રશ્ન હોય તો જણાવો.`, time: '00:02' },
        { speaker: 'PROSPECT', text: 'શું તમારું સિસ્ટમ ગુજરાતી ભાષામાં લાઈવ વાંધા નિવારણ કરી શકે છે?', time: '00:08' },
        { speaker: 'AI', text: 'હા બિલકુલ! Callisto AI ગુજરાતીમાં સંપૂર્ણ ચોકસાઈ સાથે વાર્તાલાપ અને ક્વાલિફિકેશન કરી શકે છે.', time: '00:18' },
        { speaker: 'PROSPECT', text: 'ખૂબ સરસ! અમે ટ્રાયલ શરૂ કરવા માંગીએ છીએ.', time: '00:25' },
        { speaker: 'AI', text: `સરસ! આપનું ટ્રાયલ એકાઉન્ટ એક્ટિવેટ થઈ ગયું છે.`, time: '00:32' },
      ]
    } else {
      return [
        { speaker: 'AI', text: 'આઉટબાઉન્ડ કોલિંગ પ્રક્રિયા ચાલુ... (+91 98201 44892)...', time: '00:03' },
        { speaker: 'AI', text: '30 સેકન્ડ સુધી કોઈ ઉત્તર મળ્યો નથી (રીંગિંગ સમાપ્ત).', time: '00:30' },
        { speaker: 'AI', text: 'રીટ્રાય નિયમ સક્રિય: પ્રથમ પ્રયાસ પૂર્ણ, આગામી કોલ 4 કલાક પછી થશે.', time: '00:33' },
      ]
    }
  } else {
    // English
    if (scenario === 'INTERESTED') {
      return [
        { speaker: 'AI', text: `Hello Rahul, this is ${name} from Callisto AI Solutions. We noticed your active requirement for automated AI voice calling. Do you have 2 minutes?`, time: '00:03' },
        { speaker: 'PROSPECT', text: `Hi ${name}, yes we are actively evaluating solutions for Q4. Does your agent handle live objection handling and CRM sync?`, time: '00:12' },
        { speaker: 'AI', text: 'Yes, absolutely! We ground on your corporate pitch decks to handle live technical FAQs and sync with Salesforce in under 5 seconds. Can we schedule a 20-minute executive demo on Tuesday at 11 AM?', time: '00:24' },
        { speaker: 'PROSPECT', text: 'That sounds perfect. Please send the calendar invite to my email.', time: '00:33' },
        { speaker: 'AI', text: `Done! Calendar invite and briefing deck dispatched to rahul.mehta@acmedigital.com. Have a great day from ${name} and the Callisto AI team!`, time: '00:41' },
      ]
    } else if (scenario === 'VOICEMAIL') {
      return [
        { speaker: 'AI', text: 'Tone detected. Automated Voicemail Drop initiated.', time: '00:04' },
        { speaker: 'AI', text: `Hi Rahul, this is ${name} from Callisto AI following up on your sales automation project. Please return our call at +1 (415) 800-2931 or visit callistoai.com. Thank you!`, time: '00:13' },
        { speaker: 'AI', text: 'Voicemail successfully delivered. Call status tagged as VOICEMAIL_LEFT in CRM.', time: '00:24' },
      ]
    } else if (scenario === 'CALLBACK') {
      return [
        { speaker: 'AI', text: `Hello Rahul, this is ${name} calling from Callisto AI Solutions.`, time: '00:03' },
        { speaker: 'PROSPECT', text: `Hey ${name}, I am stepping into a board meeting right now. Can you call me back tomorrow at 3 PM?`, time: '00:09' },
        { speaker: 'AI', text: 'Certainly! I have scheduled an automated callback for tomorrow at 3:00 PM your local time. Speak with you then!', time: '00:17' },
        { speaker: 'AI', text: 'Callback queued in system: Tomorrow @ 15:00 IST. Notification sent to account executive.', time: '00:23' },
      ]
    } else if (scenario === 'FAQ') {
      return [
        { speaker: 'AI', text: `Hello Rahul! ${name} here from Callisto AI Solutions. How can I assist your sales team today?`, time: '00:02' },
        { speaker: 'PROSPECT', text: `Hi ${name}! Quick question: is your calling infrastructure SOC-2 certified and what is the roundtrip latency?`, time: '00:10' },
        { speaker: 'AI', text: 'Great question! Callisto AI is SOC-2 Type II and HIPAA compliant with TLS 1.3 encryption. Our roundtrip voice latency is under 420ms globally, making conversations feel completely human.', time: '00:23' },
        { speaker: 'PROSPECT', text: 'Impressive! Let us set up a trial account and test the enterprise tier.', time: '00:31' },
        { speaker: 'AI', text: `Excellent! Onboarding link and API keys generated for Acme Digital. Thank you Rahul!`, time: '00:38' },
      ]
    } else {
      return [
        { speaker: 'AI', text: 'Initiating outbound carrier route... Ringing (+91 98201 44892)...', time: '00:04' },
        { speaker: 'AI', text: 'No answer after 30 seconds (Ringing timed out).', time: '00:30' },
        { speaker: 'AI', text: 'Retry Rule Triggered: Attempt 1 of 3 recorded. Next retry scheduled in 4 hours.', time: '00:33' },
      ]
    }
  }
}

export function AIVoiceAgent() {
  const { showToast } = useToast()
  const { language, t } = useAppContext()

  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [callStudioOpen, setCallStudioOpen] = useState(false)

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

  // Clean agent name for natural spoken dialogues and badges
  const cleanAgentName = agentName.replace(/\s*\(.*\)/, '').trim() || agentName.trim() || 'Aria'

  // Interactive Call Studio Simulator State
  const [simDirection, setSimDirection] = useState<'OUTBOUND' | 'INBOUND'>('OUTBOUND')
  const [simLanguage, setSimLanguage] = useState<'en' | 'hi' | 'gu'>('en')
  const [simScenario, setSimScenario] = useState<'INTERESTED' | 'VOICEMAIL' | 'CALLBACK' | 'FAQ' | 'RETRY'>('INTERESTED')
  const [callStatus, setCallStatus] = useState<'IDLE' | 'CONNECTED' | 'COMPLETED'>('IDLE')
  const [currentTurn, setCurrentTurn] = useState<number>(-1)
  const [activeSpeaker, setActiveSpeaker] = useState<'AI' | 'PROSPECT' | 'NONE'>('NONE')
  const [isCalling, setIsCalling] = useState(false)
  const [callDurationSec, setCallDurationSec] = useState(0)
  const [speechActive, setSpeechActive] = useState(false)

  const callTimerRef = useRef<number | null>(null)
  const turnTimeoutRef = useRef<number | null>(null)
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null)
  const currentScriptRef = useRef<Array<{ speaker: 'AI' | 'PROSPECT'; text: string; time: string }>>([])

  // Initialize and update preview transcript when scenario, language, or agent name changes in IDLE state
  const [simTranscript, setSimTranscript] = useState<Array<{ speaker: 'AI' | 'PROSPECT'; text: string; time: string }>>(() =>
    getScenarioScript('INTERESTED', 'en', 'Aria').slice(0, 2)
  )

  useEffect(() => {
    if (callStatus === 'IDLE' && !isCalling) {
      const script = getScenarioScript(simScenario, simLanguage, cleanAgentName)
      setSimTranscript(script.slice(0, 2))
    }
  }, [simScenario, simLanguage, cleanAgentName, callStatus, isCalling])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
      if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  function speakTurn(text: string, langCode: 'en' | 'hi' | 'gu', onComplete: () => void) {
    let completed = false
    const finish = () => {
      if (!completed) {
        completed = true
        setSpeechActive(false)
        onComplete()
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        if (langCode === 'hi') utterance.lang = 'hi-IN'
        else if (langCode === 'gu') utterance.lang = 'gu-IN'
        else utterance.lang = 'en-US'
        utterance.rate = 1.05

        utterance.onstart = () => setSpeechActive(true)
        utterance.onend = finish
        utterance.onerror = finish
        window.speechSynthesis.speak(utterance)

        // Safety fallback timeout in case TTS onend is delayed or muted in headless environments
        const safetyDuration = Math.max(2800, Math.min(8500, text.length * 60))
        setTimeout(finish, safetyDuration)
      } catch {
        finish()
      }
    } else {
      setTimeout(finish, 2000)
    }
  }

  function executeTurn(turnIdx: number, script: Array<{ speaker: 'AI' | 'PROSPECT'; text: string; time: string }>) {
    if (turnIdx >= script.length) {
      // Completed all turns in full transcript
      setCallStatus('COMPLETED')
      setIsCalling(false)
      setActiveSpeaker('NONE')
      setSpeechActive(false)
      if (callTimerRef.current) clearInterval(callTimerRef.current)
      showToast('success', 'Call Completed', `Full transcript finished. Outcome recorded for Rahul Mehta.`)
      return
    }

    const turn = script[turnIdx]
    setCurrentTurn(turnIdx)
    setSimTranscript(script.slice(0, turnIdx + 1))

    setTimeout(() => {
      if (transcriptContainerRef.current) {
        transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight
      }
    }, 80)

    if (turn.speaker === 'AI') {
      setActiveSpeaker('AI')
      speakTurn(turn.text, simLanguage, () => {
        // Wait natural pause before prospect answers
        turnTimeoutRef.current = window.setTimeout(() => {
          executeTurn(turnIdx + 1, script)
        }, 1200)
      })
    } else {
      // Prospect turn
      setActiveSpeaker('PROSPECT')
      setSpeechActive(false)
      turnTimeoutRef.current = window.setTimeout(() => {
        executeTurn(turnIdx + 1, script)
      }, 2600)
    }
  }

  function startLiveSimulation() {
    if (callTimerRef.current) clearInterval(callTimerRef.current)
    if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()

    const fullScript = getScenarioScript(simScenario, simLanguage, cleanAgentName)
    currentScriptRef.current = fullScript

    setIsCalling(true)
    setCallStatus('CONNECTED')
    setCallDurationSec(1)
    setSimTranscript([])
    setCurrentTurn(0)

    callTimerRef.current = window.setInterval(() => {
      setCallDurationSec(s => s + 1)
    }, 1000)

    showToast('success', 'Call Connected', `Running full transcript with ${cleanAgentName} (${simLanguage.toUpperCase()})`)

    executeTurn(0, fullScript)
  }

  function nextTurn() {
    if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    setSpeechActive(false)
    const script = currentScriptRef.current.length > 0 ? currentScriptRef.current : getScenarioScript(simScenario, simLanguage, cleanAgentName)
    const nextIdx = currentTurn + 1
    if (nextIdx < script.length) {
      executeTurn(nextIdx, script)
    } else {
      executeTurn(script.length, script)
    }
  }

  function fastForwardAll() {
    if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    setSpeechActive(false)
    const script = currentScriptRef.current.length > 0 ? currentScriptRef.current : getScenarioScript(simScenario, simLanguage, cleanAgentName)
    setSimTranscript(script)
    setCurrentTurn(script.length - 1)
    setCallStatus('COMPLETED')
    setIsCalling(false)
    setActiveSpeaker('NONE')
    if (callTimerRef.current) clearInterval(callTimerRef.current)
    showToast('info', 'Fast-Forwarded', 'Full call transcript loaded and completed.')
    setTimeout(() => {
      if (transcriptContainerRef.current) {
        transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight
      }
    }, 80)
  }

  function endLiveSimulation() {
    setIsCalling(false)
    setCallStatus('IDLE')
    setActiveSpeaker('NONE')
    setSpeechActive(false)
    if (callTimerRef.current) clearInterval(callTimerRef.current)
    if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    showToast('info', 'Call Ended', `Simulation stopped at ${formatDuration(callDurationSec)}.`)
  }

  function getCallOutcomeSummary() {
    if (simScenario === 'INTERESTED') {
      return {
        outcome: 'MEETING_BOOKED',
        badge: 'badge-success',
        title: 'Executive Demo Confirmed',
        desc: 'Prospect agreed to 20-minute executive demo on Tuesday at 11:00 AM IST. Calendar invitation and technical proposal dispatched to rahul.mehta@acmedigital.com.',
        signals: ['Budget allocated for Q4', 'Active vendor evaluation', 'Decision maker confirmed'],
        nextStep: 'Send custom enterprise security deck & sync with CRM pipeline'
      }
    } else if (simScenario === 'VOICEMAIL') {
      return {
        outcome: 'VOICEMAIL_LEFT',
        badge: 'badge-amber',
        title: 'Automated Voicemail Delivered',
        desc: 'Answering machine tone detected. Customized AI voicemail dropped with return phone number (+91 80 4912 0000) and portal link. Status tagged as VOICEMAIL_LEFT in CRM.',
        signals: ['Active corporate line', 'Answering machine active'],
        nextStep: 'Automated follow-up retry queued in 24 hours'
      }
    } else if (simScenario === 'CALLBACK') {
      return {
        outcome: 'CALLBACK_REQUESTED',
        badge: 'badge-blue',
        title: 'Callback Scheduled for Tomorrow @ 15:00',
        desc: 'Prospect currently in board meeting. AI successfully captured callback slot for tomorrow at 3:00 PM local time and created a calendar task.',
        signals: ['High prospect responsiveness', 'Clear time commitment given'],
        nextStep: 'Automated dialer set to trigger callback at 15:00 IST'
      }
    } else if (simScenario === 'FAQ') {
      return {
        outcome: 'QUALIFIED_TRIAL',
        badge: 'badge-success',
        title: 'Technical FAQs Answered & Trial Requested',
        desc: 'Prospect inquired about multilingual support, SOC-2 certification and roundtrip latency (<420ms). Prospect impressed with answers and requested enterprise trial credentials.',
        signals: ['Technical evaluation active', 'Security compliance required', 'Trial ready'],
        nextStep: 'Dispatch trial onboarding link and API documentation'
      }
    } else {
      return {
        outcome: 'UNANSWERED_RETRY',
        badge: 'badge-danger',
        title: 'Call Unanswered — Retry 1/3 Queued',
        desc: 'Ringing timed out after 30 seconds. System automatically recorded Attempt 1 of 3 according to automated retry rules. Next retry scheduled in 4 hours.',
        signals: ['Ring duration 30s', 'No answer'],
        nextStep: 'Retry attempt 2 scheduled in 4 hours'
      }
    }
  }

  const sentimentColor = (s: string) => s === 'POSITIVE' ? 'text-success' : s === 'NEGATIVE' ? 'text-danger-bright' : 'text-text-muted'
  const qualColor = (q: string) => q === 'QUALIFIED' ? 'badge-success' : q === 'LIKELY' ? 'badge-amber' : q === 'NEEDS_REVIEW' ? 'badge-blue' : 'badge-low'

  const outcomeInfo = getCallOutcomeSummary()

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
            onClick={() => setCallStudioOpen(true)}
            className="btn-primary text-xs flex items-center justify-center gap-1.5 flex-1 sm:flex-initial shadow-lg shadow-amber-500/10"
          >
            <Mic className="w-3.5 h-3.5 text-amber-300" />
            {t('voice.simulateCall', 'Live Call Studio & Speech')}
          </button>
          <button onClick={() => setConfigOpen(true)} className="btn-secondary text-xs flex items-center justify-center gap-1.5 flex-1 sm:flex-initial">
            <Sliders className="w-3.5 h-3.5" /> {t('voice.configureAgent', 'Configure Agent')}
          </button>
        </div>
      </div>

      {/* Agent Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <MetricCard label={t('voice.activeCalls', 'Active Calls')} value={liveCalls.length} accent icon={<Phone className="w-3.5 h-3.5" />} />
        <MetricCard label={t('metric.callsToday', 'Calls Today')} value={842} delta={21.3} />
        <MetricCard label={t('voice.avgDuration', 'Avg Duration')} value="3m 42s" />
        <MetricCard label={t('voice.qualRate', 'Qualification Rate')} value="31%" delta={4.2} />
      </div>

      {/* Interested Prospects for Follow-up Banner */}
      <div className="panel p-4 bg-gradient-to-r from-emerald-500/15 via-bg-card to-amber-500/5 border border-emerald-500/30 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bg-border pb-2.5">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-emerald-400 fill-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-text-primary">
              {t('voice.interestedProspects', 'Interested Prospects for Follow-up')}
            </span>
            <span className="badge-success text-3xs font-mono">{interestedProspectsList.length} ACTION REQUIRED</span>
          </div>
          <span className="text-2xs text-text-muted font-mono">Real-time intent captured from voice outreach</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {interestedProspectsList.map(item => (
            <div key={item.id} className="p-3 bg-bg-card rounded-lg border border-bg-border space-y-2 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    {item.name}
                    <span className="badge-high text-3xs">HOT</span>
                  </div>
                  <div className="text-3xs text-text-muted">{item.company}</div>
                </div>
                <span className="font-mono text-xs font-bold text-success">{item.score}/100</span>
              </div>

              <div className="p-2 bg-success/10 rounded border border-success/20 text-3xs text-success leading-relaxed">
                <strong>Call Result:</strong> {item.outcome}
              </div>

              <div className="text-3xs text-text-secondary">
                <span className="text-text-muted font-semibold">Next Step: </span>
                {item.nextAction}
              </div>

              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={() => showToast('success', 'Meeting Scheduled', `Demo invite confirmed for ${item.name}`)}
                  className="btn-primary text-3xs py-1 px-2 flex-1 justify-center gap-1"
                >
                  <Calendar className="w-2.5 h-2.5" /> Book Demo
                </button>
                <button
                  onClick={() => showToast('success', 'Synced to CRM', `${item.name} pushed to Salesforce pipeline`)}
                  className="btn-secondary text-3xs py-1 px-2 flex-1 justify-center"
                >
                  Sync CRM
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Call Monitor */}
      <div className="panel">
        <div className="section-header">
          <span className="section-title">{t('voice.liveMonitor', 'Live Call Monitor')}</span>
          <span className="flex items-center gap-1.5 text-2xs text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> {liveCalls.length} active calls
          </span>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {liveCalls.map(call => (
            <button key={call.id} onClick={() => setSelectedCall(getCallForLiveCall(call, agentName))}
              className="kanban-card text-left hover:border-amber-500/40 p-3 space-y-2">
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

      {/* Recent Completed Calls */}
      <div className="panel">
        <div className="section-header">
          <span className="section-title">{t('voice.recentCalls', 'Recent Calls')}</span>
        </div>
        <div className="divide-y divide-bg-border">
          {calls.slice(0, 8).map(call => (
            <div key={call.id} onClick={() => call.transcript.length > 0 && setSelectedCall(call)}
              className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 hover:bg-bg-hover transition-colors cursor-pointer">
              <div className="text-2xs font-mono text-text-muted w-14 sm:w-16 shrink-0">{formatTimestamp(call.timestamp)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-text-primary truncate">{call.prospect}</div>
                <div className="text-2xs text-text-muted truncate">{call.company} · {call.agent}</div>
              </div>
              <span className="font-mono text-2xs text-text-muted shrink-0">{formatDuration(call.duration)}</span>
              <span className={`badge text-2xs shrink-0 ${call.outcome === 'MEETING_BOOKED' || call.outcome === 'QUALIFIED' ? 'badge-success' : call.outcome === 'NOT_INTERESTED' || call.outcome === 'NO_ANSWER' ? 'badge-danger' : 'badge-blue'}`}>
                {call.outcome.replace('_',' ')}
              </span>
              <span className={sentimentColor(call.sentiment) + ' text-2xs shrink-0 hidden sm:inline'}>{call.sentiment}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Call Studio Modal */}
      {callStudioOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="panel max-w-3xl w-full p-5 space-y-4 border border-amber-500/40 shadow-2xl animate-fade-in max-h-[94vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-bg-border pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-sm font-bold text-text-primary flex items-center gap-2">
                    Interactive AI Voice Call Studio
                    <span className="badge-amber text-3xs font-mono">Agent: {cleanAgentName}</span>
                  </div>
                  <div className="text-3xs text-text-muted">
                    Test live multilingual speech, dynamic full transcript turns, objection handling & CRM sync
                  </div>
                </div>
              </div>
              <button onClick={() => { endLiveSimulation(); setCallStudioOpen(false) }} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Studio Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs p-3 bg-bg-card rounded-lg border border-bg-border">
              {/* Agent Name Input */}
              <div>
                <label className="text-3xs text-text-muted uppercase font-bold block mb-1">
                  Voice Agent Name
                </label>
                <input
                  type="text"
                  className="input text-xs w-full font-semibold text-amber-400 border-amber-500/30 focus:border-amber-400"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  placeholder="e.g. Maya, Vikram, Aria"
                />
              </div>

              {/* Call Direction */}
              <div>
                <label className="text-3xs text-text-muted uppercase font-bold block mb-1">Call Direction</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSimDirection('OUTBOUND')}
                    className={`flex-1 py-1.5 px-2 rounded border text-3xs font-semibold transition-colors ${simDirection === 'OUTBOUND' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-bg-secondary border-bg-border text-text-muted'}`}
                  >
                    Outbound
                  </button>
                  <button
                    onClick={() => setSimDirection('INBOUND')}
                    className={`flex-1 py-1.5 px-2 rounded border text-3xs font-semibold transition-colors ${simDirection === 'INBOUND' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-bg-secondary border-bg-border text-text-muted'}`}
                  >
                    Inbound
                  </button>
                </div>
              </div>

              {/* Speech Language */}
              <div>
                <label className="text-3xs text-text-muted uppercase font-bold block mb-1">Speech Language</label>
                <select
                  className="input text-xs w-full"
                  value={simLanguage}
                  onChange={e => setSimLanguage(e.target.value as any)}
                  disabled={isCalling}
                >
                  <option value="en">English (US / Global)</option>
                  <option value="hi">हिंदी (Hindi Neural)</option>
                  <option value="gu">ગુજરાતી (Gujarati Neural)</option>
                </select>
              </div>

              {/* Call Scenario */}
              <div>
                <label className="text-3xs text-text-muted uppercase font-bold block mb-1">Call Scenario</label>
                <select
                  className="input text-xs w-full"
                  value={simScenario}
                  onChange={e => setSimScenario(e.target.value as any)}
                  disabled={isCalling}
                >
                  <option value="INTERESTED">Engaged & Interested (Demo)</option>
                  <option value="VOICEMAIL">Voicemail Drop Triggered</option>
                  <option value="CALLBACK">Callback Requested</option>
                  <option value="FAQ">Technical FAQ Answering</option>
                  <option value="RETRY">Unanswered (Retry Queue)</option>
                </select>
              </div>
            </div>

            {/* Simulator Action Trigger & Live Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-bg-card border border-bg-border rounded-lg gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full shrink-0 ${isCalling ? 'bg-success animate-ping' : callStatus === 'COMPLETED' ? 'bg-amber-400' : 'bg-text-muted'}`} />
                <div>
                  <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                    {isCalling ? (
                      <>
                        <span>Call In Progress ({formatDuration(callDurationSec)})</span>
                        <span className="text-3xs font-mono text-text-muted">
                          · Turn {currentTurn + 1} of {currentScriptRef.current.length || 5}
                        </span>
                        {activeSpeaker === 'AI' && (
                          <span className="badge-amber text-3xs animate-pulse">
                            {cleanAgentName} Speaking...
                          </span>
                        )}
                        {activeSpeaker === 'PROSPECT' && (
                          <span className="badge-blue text-3xs animate-pulse">
                            Prospect Responding...
                          </span>
                        )}
                      </>
                    ) : callStatus === 'COMPLETED' ? (
                      <span className="text-success flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-success" /> Call Completed ({formatDuration(callDurationSec)}) — Outcome Captured
                      </span>
                    ) : (
                      'Ready to Connect'
                    )}
                  </div>
                  <div className="text-3xs text-text-muted mt-0.5">
                    Agent: <strong className="text-amber-400">{cleanAgentName}</strong> · Target: Rahul Mehta (+91 98201 44892) · Language: {simLanguage.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {!isCalling ? (
                  <>
                    <button onClick={startLiveSimulation} className="btn-primary text-xs gap-1.5 py-1.5 px-3.5 shadow-md shadow-amber-500/20">
                      <PhoneCall className="w-3.5 h-3.5" /> Start Call
                    </button>
                    {callStatus === 'COMPLETED' && (
                      <button onClick={startLiveSimulation} className="btn-secondary text-xs gap-1 py-1.5 px-2.5" title="Restart simulation">
                        <RotateCcw className="w-3 h-3 text-text-muted" /> Restart
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={nextTurn}
                      className="btn-secondary text-xs gap-1 py-1 px-2.5 hover:border-amber-500/50"
                      title="Advance to next turn immediately"
                    >
                      <ArrowRight className="w-3 h-3 text-amber-400" /> Next Turn
                    </button>
                    <button
                      onClick={fastForwardAll}
                      className="btn-secondary text-xs gap-1 py-1 px-2.5 hover:border-emerald-500/50"
                      title="Instantly process full transcript"
                    >
                      <FastForward className="w-3 h-3 text-emerald-400" /> Fast Forward
                    </button>
                    <button onClick={endLiveSimulation} className="btn-danger text-xs gap-1 py-1 px-3">
                      <Phone className="w-3.5 h-3.5" /> Hang Up
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Waveform & Speech Playback */}
            <div className="p-3 bg-gradient-to-r from-amber-500/10 via-bg-card to-amber-500/10 rounded-lg border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5 h-6">
                {[30, 60, 90, 40, 75, 100, 60, 85, 40, 70, 50, 95].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-amber-400 rounded-full transition-all duration-200"
                    style={{ height: `${speechActive ? h : 20}%` }}
                  />
                ))}
                <span className="text-3xs text-text-muted font-mono ml-2">
                  {speechActive ? `${cleanAgentName} Voice Synthesizer Active` : 'Neural Speech Engine Standby'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const speech = simTranscript[0]?.text || `Hello, this is ${cleanAgentName} from Callisto AI Solutions.`
                  speakTurn(speech, simLanguage, () => {})
                }}
                className="btn-secondary text-2xs gap-1 py-1 px-2.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Listen Voice Audio
              </button>
            </div>

            {/* Live Turn-by-Turn Transcript Log */}
            <div className="space-y-2 border border-bg-border rounded-lg p-3 bg-bg-secondary/60 max-h-64 overflow-y-auto" ref={transcriptContainerRef}>
              <div className="flex items-center justify-between text-3xs uppercase font-bold text-text-muted pb-1 border-b border-bg-border/60">
                <span>Live Turn-by-Turn Conversation Transcript</span>
                <span>
                  {simTranscript.length} {simTranscript.length === 1 ? 'Turn' : 'Turns'} Displayed
                </span>
              </div>

              {simTranscript.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded text-2xs leading-relaxed animate-fade-in ${
                    t.speaker === 'AI'
                      ? 'bg-amber-500/10 border border-amber-500/30 text-text-primary'
                      : 'bg-blue-500/10 border border-blue-500/30 text-blue-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-3xs text-text-muted mb-1">
                    <div className="flex items-center gap-1.5">
                      {t.speaker === 'AI' ? (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span className="font-semibold text-amber-300">
                            {cleanAgentName} (AI Voice Agent)
                          </span>
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 text-blue-400" />
                          <span className="font-semibold text-blue-300">
                            Rahul Mehta (Prospect)
                          </span>
                        </>
                      )}
                    </div>
                    <span className="font-mono text-3xs text-text-muted">{t.time}</span>
                  </div>
                  <div>{t.text}</div>
                </div>
              ))}

              {/* In-flight Typing / Speaking Indicator */}
              {isCalling && (
                <div className="p-2 rounded bg-bg-card/50 border border-bg-border/40 text-3xs flex items-center gap-2">
                  {activeSpeaker === 'AI' ? (
                    <div className="text-amber-400 flex items-center gap-1.5 animate-pulse font-medium">
                      <Volume2 className="w-3 h-3" /> {cleanAgentName} is speaking...
                    </div>
                  ) : activeSpeaker === 'PROSPECT' ? (
                    <div className="text-blue-400 flex items-center gap-1.5 animate-pulse font-medium">
                      <Mic className="w-3 h-3" /> Rahul Mehta is responding...
                    </div>
                  ) : (
                    <div className="text-text-muted">Connecting audio stream...</div>
                  )}
                </div>
              )}
            </div>

            {/* Post-Call Outcome Card (Displayed upon Completion) */}
            {callStatus === 'COMPLETED' && (
              <div className="p-3.5 bg-gradient-to-r from-emerald-500/15 via-bg-card to-amber-500/10 border border-emerald-500/30 rounded-lg space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-text-primary">{outcomeInfo.title}</span>
                  </div>
                  <span className={`badge text-3xs ${outcomeInfo.badge}`}>{outcomeInfo.outcome}</span>
                </div>

                <p className="text-2xs text-text-secondary leading-relaxed">
                  {outcomeInfo.desc}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-3xs text-text-muted font-semibold">Signals Detected:</span>
                  {outcomeInfo.signals.map((sig, i) => (
                    <span key={i} className="text-3xs bg-bg-card px-2 py-0.5 rounded border border-bg-border text-emerald-300">
                      ✓ {sig}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-bg-border/60">
                  <div className="text-3xs text-text-muted">
                    <span className="font-semibold text-text-secondary">Next Best Action: </span>
                    {outcomeInfo.nextStep}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => showToast('success', 'Synced to CRM', 'Meeting & full call transcript pushed to Salesforce')}
                      className="btn-primary text-3xs py-1 px-2.5"
                    >
                      Sync CRM
                    </button>
                    <button
                      onClick={() => showToast('success', 'Calendar Invite Sent', 'Google Calendar demo slot confirmed with Rahul Mehta')}
                      className="btn-secondary text-3xs py-1 px-2.5"
                    >
                      Confirm Calendar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-bg-border text-2xs text-text-muted">
              <span>All call recordings are encrypted with AES-256 and synchronized to CRM</span>
              <button onClick={() => { endLiveSimulation(); setCallStudioOpen(false) }} className="btn-secondary text-xs">Close Studio</button>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Modal */}
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
              {/* Transcript */}
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

              {/* AI Intelligence Panel */}
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

      {/* Agent Configuration Modal */}
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

            {/* Calling Infrastructure */}
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

            {/* Persona Settings */}
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
                    <option>Spanish (ES)</option>
                    <option>French (FR)</option>
                    <option>German (DE)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Automation Controls */}
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

            {/* Footer Actions */}
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
    </div>
  )
}
