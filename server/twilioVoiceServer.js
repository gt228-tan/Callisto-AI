/**
 * Callisto AI — Real Phone Call Server
 * =====================================
 * Architecture:
 *   1. Twilio calls your number -> IVR "Press 3 for AI Sales Agent"
 *   2. DTMF "3" -> Twilio Speech Recognition -> transcript text
 *   3. Transcript -> Google Gemini -> AI sales response text
 *   4. Response text -> Twilio TTS (Polly Neural) -> caller hears the AI
 *
 * Setup:
 *   1. cp .env.example .env && fill credentials
 *   2. ngrok http 5006
 *   3. Set PUBLIC_URL in .env to your ngrok URL
 *   4. node twilioVoiceServer.js
 *   5. In Twilio console set phone webhook to: https://<ngrok>/incoming-call
 */

import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import twilio from 'twilio'
import dotenv from 'dotenv'
import { createHmac } from 'crypto'

dotenv.config()

// ── Config ────────────────────────────────────────────────────────────────────
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  GEMINI_API_KEY,
  PUBLIC_URL,
  CALENDLY_LINK,            // Fallback static Calendly booking URL
  CALENDLY_API_TOKEN,       // Calendly Personal Access Token (generates unique links)
  CALENDLY_EVENT_TYPE_UUID, // UUID of the event type to book (from Calendly API)
  BOOKING_CHECK_HOURS,      // Hours before retry call (default: 24)
  CALENDLY_WEBHOOK_SECRET,  // Optional: Calendly webhook signing secret
} = process.env

// ── Calendly / Human-Handoff Config ──────────────────────────────────────────
const CALENDLY_FALLBACK_URL = CALENDLY_LINK || 'https://calendly.com/your-team/30min'
const CALENDLY_URL = CALENDLY_FALLBACK_URL
const RETRY_AFTER_HOURS = parseInt(BOOKING_CHECK_HOURS || '24', 10)

const PORT = process.env.VOICE_PORT || 5006
const VoiceResponse = twilio.twiml.VoiceResponse

// ── Twilio Client ──────────────────────────────────────────────────────────────
const twilioClient = (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN)
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null

// ── Gemini AI ─────────────────────────────────────────────────────────────────
const GEMINI_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.8-flash']

function buildVoiceSystemPrompt(session) {
  const prospectName = session?.prospectName && session.prospectName !== 'there' ? session.prospectName : null
  const company = session?.company && session.company !== 'your company' ? session.company : null
  const contextLine = prospectName || company
    ? `CURRENT CONVERSATION: You are speaking on a live phone call with ${prospectName ? prospectName : 'the prospect'}${company ? ` from ${company}` : ''}.`
    : `CURRENT CONVERSATION: You are speaking on a live inbound/outbound phone call with a prospective business client.`

  return `You are Aria, an elite, highly articulate AI sales representative for Callisto AI Solutions.

YOUR PERSONA:
- Warm, confident, professional, and deeply human in tone — NEVER sound robotic or scripted.
- Top-performing consultative salesperson: empathetic, persuasive, active listener, and curious.
- Handle objections gracefully with real evidence, empathy, and clear value propositions.
- You speak naturally with conversational cadence, occasional verbal warmth ("Glad you asked", "I completely understand", "That makes total sense").

${contextLine}

ABOUT CALLISTO AI SOLUTIONS:
- Purpose: Enterprise AI Voice Agents that engage, qualify, and book meetings with leads 24/7.
- Core Capabilities: Sub-420ms ultra-low latency response, multilingual (English, Hindi, Gujarati, Spanish, French, German), two-way sync with CRMs (Salesforce, HubSpot, Zoho, Pipedrive).
- Security & Compliance: SOC-2 Type II certified, HIPAA compliant, 256-bit end-to-end encryption.
- Proven Results: Triples qualified meetings booked, cuts SDR customer acquisition costs by 67%, never misses a lead callback.
- Pricing & Offer: Plans start from Rs 15-50 lakhs/yr ($20k-$60k enterprise), backed by an unconditional 14-day FREE pilot with full setup in under 48 hours. No credit card required.
- Integration: Seamless 2-week white-glove onboarding with a dedicated AI solutions architect.

LIVE PHONE CALL RULES:
1. BREVITY: Keep every response strictly under 50 words. This is a real voice telephone conversation — long monologues lose the listener.
2. ENGAGEMENT: Always end your response with a concise, engaging question or a clear next step to keep the dialogue flowing naturally.
3. HUMAN FEEL: Never say "As an AI language model" or "I am an artificial intelligence". Sound 100% human, professional, and composed.
4. PRICING INQUIRIES: Transparently share the starting range (Rs 15-50 lakhs/yr or $20k enterprise) and immediately offer the risk-free 14-day trial or live walkthrough.
5. OBJECTION HANDLING:
   - "Not interested": "I completely understand you're busy! Most sales leaders we speak with felt the same before seeing how our agents handle weekend follow-ups. Would a quick 2-minute overview make sense, or should I follow up later?"
   - "Too expensive": "I hear you — upfront cost is always top of mind. Most of our clients see full ROI within 60 days by saving 67% on SDR overhead. Would you be open to seeing our ROI calculator?"
   - "Already have a tool / team": "That's fantastic! Callisto doesn't replace your top closers; it acts as their 24/7 pipeline engine so they only speak to fully qualified buyers. How is your team currently handling after-hours inbound?"
6. FORMATTING: Output ONLY the exact words you are speaking out loud. Do NOT include stage directions, asterisks, brackets, or speaker tags.`
}

async function callGemini(conversationHistory, userMessage, session = null) {
  if (!GEMINI_API_KEY) {
    return getFallbackResponse(userMessage)
  }

  const systemPrompt = buildVoiceSystemPrompt(session)
  const messages = [
    ...conversationHistory,
    { role: 'user', parts: [{ text: userMessage }] }
  ]

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: messages,
          generationConfig: { temperature: 0.82, maxOutputTokens: 120 },
        })
      })

      if (!res.ok) {
        const errText = await res.text()
        console.warn(`[Gemini ${model}] Status ${res.status}: ${errText.slice(0, 100)}`)
        continue // Try next model in list
      }

      const data = await res.json()
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      if (reply) {
        return reply
      }
    } catch (err) {
      console.warn(`[Gemini ${model} Error]`, err.message)
    }
  }

  return getFallbackResponse(userMessage)
}

function getFallbackResponse(msg) {
  const lower = (msg || '').toLowerCase()
  if (lower.includes('price') || lower.includes('cost') || lower.includes('lakh'))
    return "We start at Rs 15 lakhs per year for mid-market, up to Rs 50 lakhs for enterprise — plus a 14-day free trial. Want me to walk you through the ROI calculator?"
  if (lower.includes('crm') || lower.includes('salesforce') || lower.includes('hubspot'))
    return "We offer two-way native sync with Salesforce, HubSpot, Zoho, and Pipedrive — every call sentiment auto-pushes into your CRM. Can we schedule a 15-minute demo?"
  if (lower.includes('demo') || lower.includes('trial'))
    return "Absolutely! Our 14-day free trial gets you fully set up in 48 hours. What's the best day for a kickoff call this week?"
  if (lower.includes('security') || lower.includes('compliance'))
    return "Callisto AI is SOC-2 Type II and HIPAA compliant. All data is AES-256 encrypted. Would your infosec team like our compliance whitepaper?"
  return "That's a great point. Our AI voice agents automate outbound qualification while adapting to your team's needs. Would you like to see a live demo?"
}

// ── TwiML helpers ─────────────────────────────────────────────────────────────
function getActionUrl(path) {
  const base = (PUBLIC_URL || '').trim().replace(/\/+$/, '')
  if (!base) return path
  return `${base}${path.startsWith('/') ? path : '/' + path}`
}

function speakAndListen(text) {
  const response = new VoiceResponse()
  response.say({ voice: 'Polly.Joanna-Neural', language: 'en-US' }, text)
  const gather = response.gather({
    input: 'speech',
    action: getActionUrl('/voice/speech-response'),
    method: 'POST',
    speechTimeout: 'auto',
    language: 'en-US',
    timeout: 8,
  })
  gather.pause({ length: 1 })
  // Fallback if no speech detected
  response.say({ voice: 'Polly.Joanna-Neural' }, "I didn't catch that. Are you still there?")
  response.redirect({ method: 'POST' }, getActionUrl('/voice/speech-response'))
  return response.toString()
}

// ── Express App ───────────────────────────────────────────────────────────────
const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// CORS for frontend dashboard + ngrok bypass
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  // Skip ngrok browser warning for API/webhook calls
  res.header('ngrok-skip-browser-warning', 'true')
  next()
})

// In-memory call session store
const callSessions = new Map()

// ── Human-Handoff / Calendly Booking Store ───────────────────────────────────
// Map: phone → { sentAt, booked, callSid, leadName, retryScheduled }
const handoffStore = new Map()

// ── Detect human-handoff intent ───────────────────────────────────────────────
const HUMAN_PHRASES = [
  'speak to a human', 'talk to a human', 'speak with a human', 'talk with a human',
  'real person', 'speak to someone', 'talk to someone', 'human agent',
  'speak to your team', 'talk to your team', 'connect me to a person',
  'transfer me', 'speak to a rep', 'speak with a rep', 'sales rep',
  'can i speak to', 'can i talk to', 'want to speak', 'want to talk',
  'human please', 'agent please', 'representative'
]

function detectsHumanRequest(text) {
  const lower = (text || '').toLowerCase()
  return HUMAN_PHRASES.some(p => lower.includes(p))
}

// ── Generate a unique per-lead Calendly scheduling link ───────────────────────────
// Uses Calendly REST API POST /scheduling_links to create a one-off link
// Falls back to static CALENDLY_FALLBACK_URL if API is not configured
async function generateCalendlyLink(leadName) {
  if (!CALENDLY_API_TOKEN || !CALENDLY_EVENT_TYPE_UUID) {
    console.log('[Calendly] No API token/event UUID — using fallback link')
    return CALENDLY_FALLBACK_URL
  }

  try {
    const res = await fetch('https://api.calendly.com/scheduling_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_event_count: 1,                                     // Single-use link per lead
        owner: `https://api.calendly.com/event_types/${CALENDLY_EVENT_TYPE_UUID}`,
        owner_type: 'EventType',
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(`[Calendly API] Error ${res.status}: ${errText}`)
      return CALENDLY_FALLBACK_URL
    }

    const data = await res.json()
    const link = data?.resource?.booking_url
    if (!link) {
      console.error('[Calendly API] No booking_url in response:', JSON.stringify(data))
      return CALENDLY_FALLBACK_URL
    }

    console.log(`📅 [Calendly Link Generated] ${link} for ${leadName || 'lead'}`)
    return link
  } catch (err) {
    console.error('[Calendly API] Network error:', err.message)
    return CALENDLY_FALLBACK_URL
  }
}

// ── Send SMS with generated Calendly link ──────────────────────────────────────
async function sendCalendlySms(toPhone, leadName) {
  if (!twilioClient) {
    console.warn('[SMS] Twilio not configured — skipping SMS send')
    return { sent: false, link: CALENDLY_FALLBACK_URL }
  }
  if (!toPhone) {
    console.warn('[SMS] No phone number to send to')
    return { sent: false, link: CALENDLY_FALLBACK_URL }
  }

  // Generate a unique booking link for this lead
  const bookingLink = await generateCalendlyLink(leadName)

  const name = leadName || 'there'
  const body = `Hi ${name}! 👋 Aria from Callisto AI here. As requested, here's your personal link to book a call with our team at a time that works for you: ${bookingLink} — We look forward to speaking with you!`

  try {
    const msg = await twilioClient.messages.create({
      from: TWILIO_PHONE_NUMBER,
      to: toPhone,
      body,
    })
    console.log(`📩 [SMS Sent] To: ${toPhone} | SID: ${msg.sid} | Link: ${bookingLink}`)
    return { sent: true, link: bookingLink }
  } catch (err) {
    console.error('[SMS Error]', err.message)
    return { sent: false, link: bookingLink }
  }
}

// ── Schedule a retry call if lead hasn't booked ───────────────────────────────
function scheduleBookingRetry(phone, leadName, company) {
  const delayMs = RETRY_AFTER_HOURS * 60 * 60 * 1000
  console.log(`⏰ [Retry Scheduled] Will retry ${phone} in ${RETRY_AFTER_HOURS}h if not booked`)

  setTimeout(async () => {
    const record = handoffStore.get(phone)
    if (!record || record.booked) {
      console.log(`✅ [Retry Skipped] ${phone} already booked or record gone`)
      return
    }

    console.log(`🔁 [Retry Call] ${phone} has not booked — triggering follow-up call`)
    broadcast({ type: 'retry_call', phone, leadName, reason: 'calendly_not_booked' })

    if (!twilioClient || !PUBLIC_URL) {
      console.warn('[Retry] Twilio or PUBLIC_URL not configured')
      return
    }

    try {
      const callParams = {
        from: TWILIO_PHONE_NUMBER,
        to: phone,
        url: `${PUBLIC_URL}/voice/outbound-greeting?name=${encodeURIComponent(leadName || 'there')}&company=${encodeURIComponent(company || 'your company')}&isRetry=true`,
      }
      let call
      try {
        call = await twilioClient.calls.create({
          ...callParams,
          statusCallback: `${PUBLIC_URL}/voice/status`,
          statusCallbackMethod: 'POST',
        })
      } catch (trialErr) {
        if (trialErr.code === 0 || trialErr.status === 400) {
          call = await twilioClient.calls.create(callParams)
        } else throw trialErr
      }
      console.log(`📲 [Retry Call Placed] SID: ${call.sid}`)
      record.retryScheduled = false
      record.retryCallSid = call.sid
    } catch (err) {
      console.error('[Retry Call Error]', err.message)
    }
  }, delayMs)
}

// ── Route 1: Inbound Call -> IVR ──────────────────────────────────────────────
app.all('/incoming-call', (req, res) => {
  const callSid = req.body.CallSid || req.query.CallSid || 'unknown-sid'
  const from = req.body.From || req.query.From || 'Unknown'

  console.log(`\n📞 [Incoming Call] From: ${from} | SID: ${callSid}`)

  callSessions.set(callSid, {
    callSid,
    from,
    type: 'inbound',
    startTime: new Date(),
    conversationHistory: [],
    transcript: [],
    status: 'ivr',
  })

  broadcast({ type: 'call_started', callSid, from, callType: 'inbound' })

  const response = new VoiceResponse()
  const gather = response.gather({
    numDigits: 1,
    action: getActionUrl('/voice/handle-keypress'),
    method: 'POST',
    timeout: 12,
  })
  gather.say(
    { voice: 'Polly.Joanna-Neural', language: 'en-US' },
    'Welcome to Callisto AI. Press 3 to speak with our AI sales assistant. Press 9 for support.'
  )

  response.say({ voice: 'Polly.Joanna-Neural' }, 'We did not receive your input. Please call back. Goodbye.')
  response.hangup()

  res.type('text/xml').send(response.toString())
})

// ── Route 2: DTMF Keypress ────────────────────────────────────────────────────
app.all('/voice/handle-keypress', async (req, res) => {
  const digit = req.body.Digits || req.query.Digits
  const callSid = req.body.CallSid || req.query.CallSid

  console.log(`🔢 [Keypress] Digit: "${digit}" | SID: ${callSid}`)

  if (digit === '3') {
    const session = callSessions.get(callSid)
    if (session) session.status = 'active'

    broadcast({ type: 'call_connected', callSid, digit: '3' })

    const session2 = callSessions.get(callSid)
    const opening = await callGemini(
      [],
      'Generate a warm professional opening statement. Introduce yourself as Aria from Callisto AI. Ask if they have 2 minutes to learn how we help sales teams triple qualified meetings. Under 45 words.',
      session2
    )

    if (session2) {
      session2.conversationHistory.push({ role: 'model', parts: [{ text: opening }] })
      session2.transcript.push({ speaker: 'AI', text: opening, timestamp: new Date().toISOString() })
    }

    console.log(`🤖 [AI Opening] "${opening}"`)
    broadcast({ type: 'transcript_update', callSid, speaker: 'AI', text: opening })

    res.type('text/xml').send(speakAndListen(opening))
  } else if (digit === '9') {
    const response = new VoiceResponse()
    response.say({ voice: 'Polly.Joanna-Neural' }, 'Connecting you to our support team. Please hold.')
    response.hangup()
    res.type('text/xml').send(response.toString())
  } else {
    const response = new VoiceResponse()
    const gather = response.gather({
      numDigits: 1,
      action: getActionUrl('/voice/handle-keypress'),
      method: 'POST',
      timeout: 8,
    })
    gather.say({ voice: 'Polly.Joanna-Neural' }, 'Invalid option. Press 3 for AI sales assistant, or 9 for support.')
    response.hangup()
    res.type('text/xml').send(response.toString())
  }
})

// ── Route 3: Handle Speech -> Gemini -> Respond ────────────────────────────────
app.all('/voice/speech-response', async (req, res) => {
  const callSid = req.body.CallSid || req.query.CallSid
  const speechResult = ((req.body.SpeechResult || req.query.SpeechResult) || '').trim()
  const confidence = parseFloat(req.body.Confidence || req.query.Confidence || '0')

  console.log(`🎤 [Speech] "${speechResult}" (${(confidence * 100).toFixed(0)}%) | ${callSid}`)

  const session = callSessions.get(callSid)

  // ── Human handoff detection ────────────────────────────────────────────────
  if (detectsHumanRequest(speechResult)) {
    const phone = session?.from || req.body.From || req.query.From || null
    const leadName = session?.prospectName || null
    const company = session?.company || null

    console.log(`👤 [Human Handoff] Lead requests human | phone: ${phone}`)

    // Generate unique Calendly link + send SMS
    const { sent: smsSent, link: calendlyLink } = await sendCalendlySms(phone, leadName)

    // Track in handoff store
    if (phone) {
      handoffStore.set(phone, {
        phone,
        callSid,
        leadName,
        company,
        sentAt: new Date().toISOString(),
        booked: false,
        smsSent,
        calendlyLink,
        retryScheduled: true,
      })
      scheduleBookingRetry(phone, leadName, company)
    }

    if (session) {
      session.transcript.push({ speaker: 'PROSPECT', text: speechResult, timestamp: new Date().toISOString() })
      session.humanHandoffRequested = true
      session.calendlySmsSent = smsSent
      session.calendlyLink = calendlyLink
    }

    broadcast({
      type: 'human_handoff',
      callSid,
      phone,
      leadName,
      smsSent,
      calendlyLink,
    })

    const handoffMsg = smsSent
      ? `Absolutely! I've just sent you a text message with your personal booking link. You can pick any time that works best for you. Is there anything else I can help with before we wrap up?`
      : `Of course! Our team would love to connect with you. Please visit ${calendlyLink} to book a call at your preferred time. Is there anything else you'd like to know?`

    const response = new VoiceResponse()
    response.say({ voice: 'Polly.Joanna-Neural' }, handoffMsg)

    // Continue gathering in case they have more questions
    const gather = response.gather({
      input: 'speech',
      action: getActionUrl('/voice/speech-response'),
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-US',
      timeout: 8,
    })
    gather.pause({ length: 1 })
    response.say({ voice: 'Polly.Joanna-Neural' }, 'Thank you so much for your time! Have a wonderful day.')
    response.hangup()
    return res.type('text/xml').send(response.toString())
  }

  // ── Disconnect intent detection ────────────────────────────────────────────
  const disconnectPhrases = ['goodbye', 'bye', 'end call', 'hang up', 'disconnect', 'not interested', 'stop the call']
  const isDisconnect = disconnectPhrases.some(p => speechResult.toLowerCase().includes(p))

  if (isDisconnect) {
    const farewell = 'It was a pleasure speaking with you! I will send over our product overview and pricing to your email. Have a great day!'
    if (session) {
      session.transcript.push({ speaker: 'PROSPECT', text: speechResult, timestamp: new Date().toISOString() })
      session.transcript.push({ speaker: 'AI', text: farewell, timestamp: new Date().toISOString() })
      session.status = 'completed'
      session.endTime = new Date()
    }
    broadcast({ type: 'call_ended', callSid, reason: 'prospect_disconnect' })

    const response = new VoiceResponse()
    response.say({ voice: 'Polly.Joanna-Neural' }, farewell)
    response.hangup()
    return res.type('text/xml').send(response.toString())
  }

  // No speech detected
  if (!speechResult) {
    const response = new VoiceResponse()
    response.say({ voice: 'Polly.Joanna-Neural' }, "I'm sorry, I didn't catch that. Could you say that again?")
    const gather = response.gather({
      input: 'speech',
      action: getActionUrl('/voice/speech-response'),
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-US',
      timeout: 8,
    })
    gather.pause({ length: 1 })
    response.say({ voice: 'Polly.Joanna-Neural' }, "Are you still there? Please feel free to ask any questions about our AI sales solutions.")
    response.redirect({ method: 'POST' }, getActionUrl('/voice/speech-response'))
    return res.type('text/xml').send(response.toString())
  }

  // Log prospect turn
  if (session) {
    session.conversationHistory.push({ role: 'user', parts: [{ text: speechResult }] })
    session.transcript.push({ speaker: 'PROSPECT', text: speechResult, timestamp: new Date().toISOString() })
    broadcast({ type: 'transcript_update', callSid, speaker: 'AI', text: speechResult })
    broadcast({ type: 'transcript_update', callSid, speaker: 'PROSPECT', text: speechResult })
  }

  // Max turns guard (20 AI + 20 prospect = 40)
  const turnCount = session?.transcript?.length || 0
  if (turnCount >= 40) {
    const closeOut = 'It has been a fantastic conversation! Let me send you our full proposal and we can schedule a deep-dive demo. Thank you so much!'
    const response = new VoiceResponse()
    response.say({ voice: 'Polly.Joanna-Neural' }, closeOut)
    response.hangup()
    if (session) session.status = 'completed'
    broadcast({ type: 'call_ended', callSid, reason: 'max_turns' })
    return res.type('text/xml').send(response.toString())
  }

  // Call Gemini
  const history = session?.conversationHistory?.slice(0, -1) || []
  const aiResponse = await callGemini(history, speechResult, session)

  console.log(`🤖 [AI Response] "${aiResponse}"`)

  // Log AI turn
  if (session) {
    session.conversationHistory.push({ role: 'model', parts: [{ text: aiResponse }] })
    session.transcript.push({ speaker: 'AI', text: aiResponse, timestamp: new Date().toISOString() })
    broadcast({ type: 'transcript_update', callSid, speaker: 'AI', text: aiResponse })
  }

  res.type('text/xml').send(speakAndListen(aiResponse))
})

// ── Route 4: Call Status Callback ─────────────────────────────────────────────
app.post('/voice/status', (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body
  console.log(`📊 [Status] ${CallSid}: ${CallStatus} | ${CallDuration}s`)

  const session = callSessions.get(CallSid)
  if (session && ['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(CallStatus)) {
    session.status = CallStatus
    session.duration = parseInt(CallDuration || '0')
    session.endTime = new Date()
    broadcast({ type: 'call_ended', callSid: CallSid, status: CallStatus, duration: session.duration })
  }
  res.sendStatus(200)
})

// ── Route 5: Active sessions list (for frontend dashboard) ────────────────────
app.get('/voice/sessions', (req, res) => {
  const sessions = Array.from(callSessions.values()).map(s => ({
    callSid: s.callSid,
    from: s.from,
    type: s.type || 'inbound',
    status: s.status,
    startTime: s.startTime,
    endTime: s.endTime || null,
    duration: s.duration || 0,
    turnCount: s.transcript?.length || 0,
    transcript: s.transcript || [],
  }))
  res.json({ success: true, total: sessions.length, sessions: sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)) })
})

// ── Route 5b: End a live call (hang up from dashboard) ──────────────────────────────────
app.post('/voice/end-call', async (req, res) => {
  const { callSid } = req.body
  if (!callSid) return res.status(400).json({ error: 'callSid is required' })

  if (!twilioClient) {
    const session = callSessions.get(callSid)
    if (session) { session.status = 'completed'; session.endTime = new Date() }
    broadcast({ type: 'call_ended', callSid, status: 'completed', reason: 'dashboard_hangup' })
    return res.json({ success: true, note: 'Twilio not configured — marked locally completed' })
  }

  try {
    await twilioClient.calls(callSid).update({ status: 'completed' })
    const session = callSessions.get(callSid)
    if (session) { session.status = 'completed'; session.endTime = new Date() }
    broadcast({ type: 'call_ended', callSid, status: 'completed', reason: 'dashboard_hangup' })
    console.log(`\ud83d\udd34 [Call Ended] SID: ${callSid} (dashboard hangup)`)
    res.json({ success: true, callSid })
  } catch (err) {
    console.error('[End Call Error]', err.message)
    const session = callSessions.get(callSid)
    if (session) { session.status = 'completed'; session.endTime = new Date() }
    broadcast({ type: 'call_ended', callSid, status: 'completed', reason: 'dashboard_hangup' })
    res.json({ success: true, note: err.message })
  }
})

// ── Route 6: Server status (for frontend config panel) ────────────────────────
app.get('/voice/config', (req, res) => {
  res.json({
    status: 'online',
    twilioConfigured: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER),
    geminiConfigured: !!GEMINI_API_KEY,
    phoneNumber: TWILIO_PHONE_NUMBER || null,
    publicUrl: PUBLIC_URL || null,
    webhookUrl: PUBLIC_URL ? `${PUBLIC_URL}/incoming-call` : null,
    calendlyWebhookUrl: PUBLIC_URL ? `${PUBLIC_URL}/webhooks/calendly` : null,
    calendlyLink: CALENDLY_URL,
    calendlyApiConfigured: !!(CALENDLY_API_TOKEN && CALENDLY_EVENT_TYPE_UUID),
    retryAfterHours: RETRY_AFTER_HOURS,
    model: GEMINI_MODELS[0],
    activeSessions: callSessions.size,
    handoffCount: handoffStore.size,
    uptime: Math.floor(process.uptime()),
  })
})

// ── Route 7: Trigger outbound call ────────────────────────────────────────────
app.post('/voice/call-outbound', async (req, res) => {
  const { toPhone, prospectName = 'there', company = 'your company' } = req.body

  if (!twilioClient) {
    return res.status(503).json({
      error: 'Twilio not configured',
      hint: 'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to server/.env'
    })
  }
  if (!toPhone) return res.status(400).json({ error: 'toPhone is required' })
  if (!PUBLIC_URL) return res.status(503).json({ error: 'PUBLIC_URL not set in .env — run ngrok and add the URL' })

  try {
    const callParams = {
      from: TWILIO_PHONE_NUMBER,
      to: toPhone,
      url: getActionUrl(`/voice/outbound-greeting?name=${encodeURIComponent(prospectName)}&company=${encodeURIComponent(company)}`),
    }

    // StatusCallback is blocked on trial accounts — only add if not trial
    // We detect trial by checking if Twilio rejects the call, and retry without it
    let call
    try {
      call = await twilioClient.calls.create({
        ...callParams,
        statusCallback: `${PUBLIC_URL}/voice/status`,
        statusCallbackMethod: 'POST',
      })
    } catch (trialErr) {
      // Trial account may not allow statusCallback — retry without it
      if (trialErr.code === 0 || trialErr.status === 400) {
        console.warn('[Outbound] Trial account detected — retrying without statusCallback')
        call = await twilioClient.calls.create(callParams)
      } else {
        throw trialErr
      }
    }

    console.log(`📲 [Outbound] To: ${toPhone} | SID: ${call.sid}`)

    // Create session immediately so dashboard can track it
    callSessions.set(call.sid, {
      callSid: call.sid,
      from: toPhone,
      type: 'outbound',
      startTime: new Date(),
      conversationHistory: [],
      transcript: [],
      status: 'initiated',
      prospectName,
      company,
    })
    broadcast({ type: 'call_started', callSid: call.sid, from: toPhone, callType: 'outbound', prospectName })

    res.json({ success: true, callSid: call.sid, status: call.status, to: toPhone })
  } catch (err) {
    console.error('[Outbound Error]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Route 8: Outbound call greeting TwiML ─────────────────────────────────────
app.all('/voice/outbound-greeting', async (req, res) => {
  const name = req.query.name || req.body.name || 'there'
  const company = req.query.company || req.body.company || 'your company'
  const isRetry = (req.query.isRetry === 'true' || req.body.isRetry === 'true')
  const callSid = req.body.CallSid || req.query.CallSid || 'outbound-' + Date.now()
  const toPhone = req.body.To || req.query.To || req.body.toPhone || req.query.toPhone || 'verified-number'

  const promptText = isRetry
    ? `Generate a warm follow-up call opening for prospect ${name} at ${company}. Mention you texted them a Calendly link earlier to book a call with the team and you are following up to make sure they got it. Ask if they had a chance to pick a time. Under 50 words.`
    : `Generate a warm outbound opening for prospect ${name} at ${company}. Introduce as Aria from Callisto AI. Ask if they have 2 minutes. Under 45 words.`

  const greeting = await callGemini([], promptText, { prospectName: name, company })

  callSessions.set(callSid, {
    callSid,
    from: toPhone,
    type: isRetry ? 'outbound-retry' : 'outbound',
    startTime: new Date(),
    conversationHistory: [{ role: 'model', parts: [{ text: greeting }] }],
    transcript: [{ speaker: 'AI', text: greeting, timestamp: new Date().toISOString() }],
    status: 'active',
    prospectName: name,
    company,
    isRetry,
  })

  broadcast({ type: 'call_started', callSid, from: toPhone, callType: isRetry ? 'outbound-retry' : 'outbound', prospectName: name })
  broadcast({ type: 'transcript_update', callSid, speaker: 'AI', text: greeting })

  console.log(`🤖 [${isRetry ? 'Retry' : 'Outbound'} Opening] "${greeting}"`)
  res.type('text/xml').send(speakAndListen(greeting))
})

// ── Route 9: Calendly webhook (booking confirmed) ─────────────────────────────
// Set this URL in Calendly: Dashboard → Integrations → Webhooks → Create Webhook
// Events to subscribe: invitee.created
app.post('/webhooks/calendly', express.raw({ type: 'application/json' }), async (req, res) => {
  // Optional signature verification
  if (CALENDLY_WEBHOOK_SECRET) {
    const sig = req.headers['calendly-webhook-signature']
    if (!sig) {
      console.warn('[Calendly Webhook] Missing signature header')
      return res.status(401).json({ error: 'Missing signature' })
    }
    // Calendly uses: t=<timestamp>,v1=<hmac>
    try {
      const parts = Object.fromEntries(sig.split(',').map(p => p.split('=')))
      const ts = parts['t']
      const v1 = parts['v1']
      const toSign = `${ts}.${req.body.toString()}`
      const expected = createHmac('sha256', CALENDLY_WEBHOOK_SECRET).update(toSign).digest('hex')
      if (v1 !== expected) {
        console.warn('[Calendly Webhook] Invalid signature')
        return res.status(401).json({ error: 'Invalid signature' })
      }
    } catch (e) {
      console.warn('[Calendly Webhook] Signature check failed', e.message)
    }
  }

  let payload
  try {
    payload = JSON.parse(req.body.toString())
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const event = payload?.event
  if (event !== 'invitee.created') {
    return res.json({ ignored: true })
  }

  // Extract invitee phone or email to match our handoff record
  const invitee = payload?.payload?.invitee || {}
  const inviteePhone = invitee?.text_reminder_number || null
  const inviteeName = invitee?.name || 'Unknown'
  const inviteeEmail = invitee?.email || null
  const scheduledAt = payload?.payload?.event?.start_time || new Date().toISOString()

  console.log(`📅 [Calendly Booked] ${inviteeName} | phone: ${inviteePhone} | email: ${inviteeEmail} | time: ${scheduledAt}`)

  // Try to match by phone
  let matched = false
  if (inviteePhone) {
    // Normalize: strip spaces, dashes
    const normalizePhone = p => (p || '').replace(/[\s\-().]/g, '')
    for (const [key, record] of handoffStore.entries()) {
      if (normalizePhone(key) === normalizePhone(inviteePhone)) {
        record.booked = true
        record.bookedAt = new Date().toISOString()
        record.scheduledMeetingTime = scheduledAt
        record.inviteeName = inviteeName
        matched = true
        broadcast({
          type: 'calendly_booked',
          phone: key,
          leadName: record.leadName,
          inviteeName,
          scheduledMeetingTime: scheduledAt,
        })
        console.log(`✅ [Booking Matched] Phone: ${key} → booked!`)
        break
      }
    }
  }

  if (!matched) {
    // Fallback: store by email / mark latest unbooked as booked
    console.warn(`[Calendly Webhook] Could not match phone. Name: ${inviteeName}, Email: ${inviteeEmail}`)
    broadcast({
      type: 'calendly_booked_unmatched',
      inviteeName,
      inviteeEmail,
      scheduledMeetingTime: scheduledAt,
    })
  }

  res.json({ success: true })
})

// ── Route 10: Get all handoff / booking records ───────────────────────────────
app.get('/voice/handoffs', (req, res) => {
  const records = Array.from(handoffStore.values())
  res.json({
    success: true,
    total: records.length,
    booked: records.filter(r => r.booked).length,
    pending: records.filter(r => !r.booked).length,
    records,
  })
})

// ── Route 11: Manual SMS send (e.g. from dashboard) ──────────────────────────
app.post('/voice/send-calendly-sms', async (req, res) => {
  const { phone, leadName } = req.body
  if (!phone) return res.status(400).json({ error: 'phone is required' })

  const { sent: smsSent, link: calendlyLink } = await sendCalendlySms(phone, leadName)
  handoffStore.set(phone, {
    phone,
    callSid: null,
    leadName: leadName || null,
    company: null,
    calendlyLink,
    sentAt: new Date().toISOString(),
    booked: false,
    smsSent,
    retryScheduled: true,
  })
  scheduleBookingRetry(phone, leadName, null)

  if (smsSent) {
    res.json({ success: true, message: `SMS sent to ${phone}`, link: calendlyLink })
  } else {
    res.json({
      success: false,
      warning: 'Twilio SMS not delivered (check Twilio credentials in server/.env), but Calendly link was generated and lead is tracked.',
      link: calendlyLink,
    })
  }
})

// ── Route 12: Test / Simulate Human Handoff (No phone call needed) ────────────
app.post('/voice/simulate-handoff', async (req, res) => {
  const { phone = '+15551234567', leadName = 'Alex Mercer', message = 'Can I speak to a human please?' } = req.body
  const isHuman = detectsHumanRequest(message)
  if (!isHuman) {
    return res.json({
      detected: false,
      message: 'Phrase did not trigger human handoff. Try saying "speak to a human" or "talk with someone".',
    })
  }

  const { sent: smsSent, link: calendlyLink } = await sendCalendlySms(phone, leadName)
  const simCallSid = 'SIM-' + Date.now().toString(36).toUpperCase()

  handoffStore.set(phone, {
    phone,
    callSid: simCallSid,
    leadName,
    company: 'Acme Corp',
    calendlyLink,
    sentAt: new Date().toISOString(),
    booked: false,
    smsSent,
    retryScheduled: true,
    isSimulated: true,
  })
  scheduleBookingRetry(phone, leadName, 'Acme Corp')

  broadcast({
    type: 'human_handoff',
    callSid: simCallSid,
    phone,
    leadName,
    smsSent,
    calendlyLink,
  })

  res.json({
    success: true,
    detected: true,
    phone,
    leadName,
    smsSent,
    calendlyLink,
    spokenReply: smsSent
      ? "Absolutely! I've just sent you a text message with your personal booking link. You can pick any time that works best for you."
      : `Of course! Please visit ${calendlyLink} to book a call with our team.`,
  })
})

// ── Route 13: Test / Simulate Calendly Booking Confirmation ───────────────────
app.post('/voice/simulate-booking', (req, res) => {
  const { phone, email, name = 'Alex Mercer', scheduledTime } = req.body
  if (!phone) return res.status(400).json({ error: 'phone is required' })

  const scheduledAt = scheduledTime || new Date(Date.now() + 86400000).toISOString()
  const normalizePhone = p => (p || '').replace(/[\s\-().]/g, '')

  let found = false
  for (const [key, record] of handoffStore.entries()) {
    if (normalizePhone(key) === normalizePhone(phone)) {
      record.booked = true
      record.bookedAt = new Date().toISOString()
      record.scheduledMeetingTime = scheduledAt
      record.inviteeName = name
      found = true
      broadcast({
        type: 'calendly_booked',
        phone: key,
        leadName: record.leadName,
        inviteeName: name,
        scheduledMeetingTime: scheduledAt,
      })
      console.log(`✅ [Simulated Booking Confirmed] Phone: ${key} marked booked!`)
      break
    }
  }

  if (!found) {
    handoffStore.set(phone, {
      phone,
      callSid: null,
      leadName: name,
      company: 'Test Corp',
      calendlyLink: CALENDLY_FALLBACK_URL,
      sentAt: new Date().toISOString(),
      booked: true,
      bookedAt: new Date().toISOString(),
      scheduledMeetingTime: scheduledAt,
      smsSent: true,
      retryScheduled: false,
    })
    broadcast({
      type: 'calendly_booked',
      phone,
      leadName: name,
      inviteeName: name,
      scheduledMeetingTime: scheduledAt,
    })
  }

  res.json({ success: true, message: `Booking confirmed for ${phone}`, record: handoffStore.get(phone) })
})

// ── Route 14: Test / Trigger Retry Call Immediately (Skip 24h wait) ───────────
app.post('/voice/trigger-retry', async (req, res) => {
  const { phone } = req.body
  if (!phone) return res.status(400).json({ error: 'phone is required' })

  const record = handoffStore.get(phone)
  if (!record) return res.status(404).json({ error: 'No handoff record found for this phone' })
  if (record.booked) return res.json({ message: 'Lead already booked — no retry needed', booked: true })

  console.log(`🔁 [Immediate Retry Triggered] For ${phone}`)
  broadcast({ type: 'retry_call', phone, leadName: record.leadName, reason: 'calendly_not_booked' })

  let callResult = null
  if (twilioClient && PUBLIC_URL) {
    try {
      const callParams = {
        from: TWILIO_PHONE_NUMBER,
        to: phone,
        url: `${PUBLIC_URL}/voice/outbound-greeting?name=${encodeURIComponent(record.leadName || 'there')}&company=${encodeURIComponent(record.company || 'your company')}&isRetry=true`,
      }
      let call
      try {
        call = await twilioClient.calls.create({
          ...callParams,
          statusCallback: `${PUBLIC_URL}/voice/status`,
          statusCallbackMethod: 'POST',
        })
      } catch (trialErr) {
        if (trialErr.code === 0 || trialErr.status === 400) {
          call = await twilioClient.calls.create(callParams)
        } else throw trialErr
      }
      callResult = { sid: call.sid, status: call.status }
      record.retryCallSid = call.sid
    } catch (err) {
      callResult = { error: err.message }
    }
  } else {
    callResult = { simulated: true, note: 'Twilio or PUBLIC_URL not configured. Broadcast event fired.' }
  }

  res.json({ success: true, phone, record, callResult })
})

// ── HTTP + WebSocket server ────────────────────────────────────────────────────
const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/ws/call-monitor' })
const dashboardClients = new Set()

wss.on('connection', (ws) => {
  dashboardClients.add(ws)
  console.log(`🖥️  [Dashboard WS] Connected (${dashboardClients.size} clients)`)

  // Send snapshot on connect
  ws.send(JSON.stringify({
    type: 'snapshot',
    sessions: Array.from(callSessions.values()).map(s => ({
      callSid: s.callSid, from: s.from, status: s.status,
      turnCount: s.transcript?.length || 0, startTime: s.startTime,
    }))
  }))

  ws.on('close', () => { dashboardClients.delete(ws) })
  ws.on('error', () => { dashboardClients.delete(ws) })
})

function broadcast(data) {
  const msg = JSON.stringify(data)
  for (const ws of dashboardClients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg)
  }
}

httpServer.listen(PORT, () => {
  console.log(`\n${'='.repeat(62)}`)
  console.log(`  🚀 Callisto AI Voice Server — http://localhost:${PORT}`)
  console.log(`${'='.repeat(62)}`)
  console.log(`  📞 Twilio:     ${TWILIO_PHONE_NUMBER || '⚠️  Add to .env'}`)
  console.log(`  🤖 Gemini:     ${GEMINI_API_KEY ? '✅ Ready' : '⚠️  Add GEMINI_API_KEY to .env'}`)
  console.log(`  🌐 Public URL: ${PUBLIC_URL || '⚠️  Run ngrok http ' + PORT + ' then set PUBLIC_URL'}`)
  console.log(`  📅 Calendly:   ${CALENDLY_URL}`)
  console.log(`  ⏰ Retry In:   ${RETRY_AFTER_HOURS}h if lead hasn't booked`)
  if (PUBLIC_URL) {
    console.log(`\n  📋 Set these webhooks:`)
    console.log(`     Twilio Voice:    ${PUBLIC_URL}/incoming-call  [HTTP POST]`)
    console.log(`     Calendly Events: ${PUBLIC_URL}/webhooks/calendly  [HTTP POST]`)
    console.log(`     (Calendly: Dashboard → Integrations → Webhooks → invitee.created)`)
  }
  console.log(`\n  API:`)
  console.log(`     GET  /voice/config            - Status & config`)
  console.log(`     GET  /voice/sessions          - All call sessions`)
  console.log(`     GET  /voice/handoffs          - Calendly booking status`)
  console.log(`     POST /voice/call-outbound     - Initiate outbound call`)
  console.log(`     POST /voice/send-calendly-sms - Manually send Calendly SMS`)
  console.log(`     POST /webhooks/calendly       - Calendly booking webhook`)
  console.log(`     WS   /ws/call-monitor         - Real-time updates`)
  console.log(`${'='.repeat(62)}\n`)
})
