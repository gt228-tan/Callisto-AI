/**
 * Callisto AI — Voice Call Service
 * Communicates with the Twilio voice server (twilioVoiceServer.js)
 * and provides real-time call monitoring via WebSocket.
 */

const VOICE_SERVER_URL = (import.meta as any).env?.VITE_VOICE_SERVER_URL || 'http://localhost:5006'
const VOICE_WS_URL = VOICE_SERVER_URL.replace('http', 'ws') + '/ws/call-monitor'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface VoiceServerConfig {
  status: 'online' | 'offline'
  twilioConfigured: boolean
  geminiConfigured: boolean
  phoneNumber: string | null
  publicUrl: string | null
  webhookUrl: string | null
  calendlyWebhookUrl?: string | null
  calendlyLink?: string | null
  calendlyApiConfigured?: boolean
  retryAfterHours?: number
  model: string
  activeSessions: number
  handoffCount?: number
  uptime: number
}

export interface HandoffRecord {
  phone: string
  callSid: string | null
  leadName: string | null
  company: string | null
  calendlyLink: string
  sentAt: string
  booked: boolean
  smsSent: boolean
  retryScheduled: boolean
  isSimulated?: boolean
  bookedAt?: string
  scheduledMeetingTime?: string
  inviteeName?: string
}

export interface HandoffResponse {
  success: boolean
  total: number
  booked: number
  pending: number
  records: HandoffRecord[]
}

export interface CallSession {
  callSid: string
  from: string
  type: 'inbound' | 'outbound'
  status: string
  startTime: string
  endTime: string | null
  duration: number
  turnCount: number
  transcript: Array<{ speaker: 'AI' | 'PROSPECT'; text: string; timestamp: string }>
}

export interface OutboundCallResult {
  success: boolean
  callSid?: string
  status?: string
  to?: string
  error?: string
  hint?: string
}

export type WsEvent =
  | { type: 'snapshot'; sessions: Partial<CallSession>[] }
  | { type: 'call_started'; callSid: string; from: string; callType: string; prospectName?: string }
  | { type: 'call_connected'; callSid: string; digit: string }
  | { type: 'transcript_update'; callSid: string; speaker: 'AI' | 'PROSPECT'; text: string }
  | { type: 'call_ended'; callSid: string; status?: string; reason?: string; duration?: number }
  | { type: 'human_handoff'; callSid: string; phone: string; leadName?: string; smsSent: boolean; calendlyLink: string }
  | { type: 'calendly_booked'; phone: string; leadName?: string; inviteeName?: string; scheduledMeetingTime?: string }
  | { type: 'retry_call'; phone: string; leadName?: string; reason: string }

// ── Fetch voice server config / status ───────────────────────────────────────
export async function fetchVoiceConfig(): Promise<VoiceServerConfig> {
  try {
    const res = await fetch(`${VOICE_SERVER_URL}/voice/config`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    return {
      status: 'offline',
      twilioConfigured: false,
      geminiConfigured: false,
      phoneNumber: null,
      publicUrl: null,
      webhookUrl: null,
      model: 'N/A',
      activeSessions: 0,
      uptime: 0,
    }
  }
}

// ── Fetch call sessions ───────────────────────────────────────────────────────
export async function fetchCallSessions(): Promise<CallSession[]> {
  try {
    const res = await fetch(`${VOICE_SERVER_URL}/voice/sessions`, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.sessions || []
  } catch {
    return []
  }
}

// ── Trigger outbound call ─────────────────────────────────────────────────────
export async function makeOutboundCall(
  toPhone: string,
  prospectName: string,
  company: string
): Promise<OutboundCallResult> {
  try {
    const res = await fetch(`${VOICE_SERVER_URL}/voice/call-outbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toPhone, prospectName, company }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    return { success: res.ok, ...data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to voice server' }
  }
}

// ── End / hang up a live call ─────────────────────────────────────────────────
export async function endCall(callSid: string): Promise<{ success: boolean; note?: string; error?: string }> {
  try {
    const res = await fetch(`${VOICE_SERVER_URL}/voice/end-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callSid }),
      signal: AbortSignal.timeout(8000),
    })
    return await res.json()
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ── Calendly / Handoff API helpers ───────────────────────────────────────────
export async function fetchHandoffs(): Promise<HandoffResponse> {
  try {
    const res = await fetch(`${VOICE_SERVER_URL}/voice/handoffs`, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    return { success: false, total: 0, booked: 0, pending: 0, records: [] }
  }
}

export async function sendManualCalendlySms(phone: string, leadName?: string) {
  try {
    const res = await fetch(`${VOICE_SERVER_URL}/voice/send-calendly-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, leadName }),
      signal: AbortSignal.timeout(8000),
    })
    return await res.json()
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function simulateHumanHandoff(phone: string, leadName: string, message: string) {
  try {
    const res = await fetch(`${VOICE_SERVER_URL}/voice/simulate-handoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, leadName, message }),
      signal: AbortSignal.timeout(8000),
    })
    return await res.json()
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function simulateCalendlyBooking(phone: string, name?: string) {
  try {
    const res = await fetch(`${VOICE_SERVER_URL}/voice/simulate-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name }),
      signal: AbortSignal.timeout(8000),
    })
    return await res.json()
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function triggerImmediateRetry(phone: string) {
  try {
    const res = await fetch(`${VOICE_SERVER_URL}/voice/trigger-retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
      signal: AbortSignal.timeout(8000),
    })
    return await res.json()
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ── WebSocket real-time monitor ───────────────────────────────────────────────
let ws: WebSocket | null = null
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null
const wsListeners = new Set<(event: WsEvent) => void>()

export function subscribeToCallEvents(listener: (event: WsEvent) => void): () => void {
  wsListeners.add(listener)
  ensureWsConnected()
  return () => wsListeners.delete(listener)
}

function ensureWsConnected() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  try {
    ws = new WebSocket(VOICE_WS_URL)

    ws.onmessage = (event) => {
      try {
        const data: WsEvent = JSON.parse(event.data)
        wsListeners.forEach(fn => fn(data))
      } catch { /* ignore malformed */ }
    }

    ws.onclose = () => {
      ws = null
      if (wsListeners.size > 0) {
        // Auto-reconnect after 3s if there are active listeners
        wsReconnectTimer = setTimeout(ensureWsConnected, 3000)
      }
    }

    ws.onerror = () => {
      ws?.close()
    }
  } catch {
    // WebSocket not available (e.g. server offline)
  }
}

export function disconnectCallMonitor() {
  if (wsReconnectTimer) clearTimeout(wsReconnectTimer)
  ws?.close()
  ws = null
  wsListeners.clear()
}

// ── Format call duration ──────────────────────────────────────────────────────
export function formatCallDuration(seconds: number): string {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Get setup instructions ────────────────────────────────────────────────────
export function getSetupSteps(): Array<{ step: number; title: string; description: string; url: string; urlLabel: string }> {
  return [
    {
      step: 1,
      title: 'Create Twilio Account',
      description: 'Sign up for a free trial account and get $15 in credits — no credit card needed.',
      url: 'https://www.twilio.com/try-twilio',
      urlLabel: 'Sign up at twilio.com',
    },
    {
      step: 2,
      title: 'Get a Twilio Phone Number',
      description: 'Buy a number in the Twilio Console. Choose a country and a voice-capable number.',
      url: 'https://console.twilio.com/us1/develop/phone-numbers/manage/incoming',
      urlLabel: 'Buy Phone Number',
    },
    {
      step: 3,
      title: 'Get a Deepgram API Key (optional)',
      description: 'Deepgram provides faster STT. Free $200 credit on signup. Skip if using Twilio built-in.',
      url: 'https://console.deepgram.com/',
      urlLabel: 'Get Deepgram Key',
    },
    {
      step: 4,
      title: 'Configure server/.env',
      description: 'Copy server/.env.example to server/.env and fill in your Twilio SID, Auth Token, Phone Number, and Gemini API Key.',
      url: 'https://console.twilio.com/',
      urlLabel: 'Twilio Console',
    },
    {
      step: 5,
      title: 'Run ngrok to expose your server',
      description: 'Install ngrok and run: ngrok http 5006. Copy the HTTPS URL into PUBLIC_URL in your .env.',
      url: 'https://ngrok.com/download',
      urlLabel: 'Download ngrok',
    },
    {
      step: 6,
      title: 'Start the voice server',
      description: 'In the server/ directory, run: npm run voice. Your server will print the exact webhook URL to set.',
      url: '',
      urlLabel: '',
    },
    {
      step: 7,
      title: 'Set webhook in Twilio Console',
      description: 'In Twilio Console → Phone Numbers → your number → Voice → set "A call comes in" webhook to your server URL + /incoming-call',
      url: 'https://console.twilio.com/us1/develop/phone-numbers/manage/incoming',
      urlLabel: 'Configure Webhook',
    },
    {
      step: 8,
      title: 'Configure Calendly Webhook & Link (Free)',
      description: 'Add your free CALENDLY_LINK to server/.env. In Calendly Dashboard → Integrations → Webhooks, add webhook URL https://<ngrok>/webhooks/calendly for event invitee.created. Whenever a caller asks for a human, Aria texts them your Calendly link and tracks booking completion!',
      url: 'https://calendly.com/integrations/api_webhooks',
      urlLabel: 'Calendly Webhooks',
    },
  ]
}
