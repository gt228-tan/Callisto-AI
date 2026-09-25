/**
 * Calendly Integration Service
 *
 * Handles:
 * 1. Detecting human-transfer intent from call transcripts
 * 2. Sending SMS with Calendly booking link (via Twilio simulation)
 * 3. Tracking booking status per lead
 * 4. Follow-up re-call logic for leads who have not booked
 */

export interface CalendlyBookingRecord {
  id: string
  leadName: string
  leadPhone: string
  leadEmail: string
  company: string
  smsSentAt?: string
  smsSentAtIST?: string
  emailSentAt?: string
  emailSentAtIST?: string
  calendlyLink: string
  bookingStatus: 'SMS_SENT' | 'EMAIL_SENT' | 'DISPATCHED' | 'LINK_OPENED' | 'BOOKED' | 'CANCELLED'
  dispatchChannel?: 'SMS' | 'EMAIL' | 'BOTH'
  previewUrl?: string
  bookedSlot?: string
  followUpCallScheduled?: boolean
  followUpCallAt?: string
  followUpAttempts: number
  lastCheckedAt?: string
  callId?: string
  triggeredBy: 'HUMAN_TRANSFER_REQUEST' | 'MANUAL'
  agentName: string
}

const STORAGE_KEY = 'callisto_calendly_bookings'

function getISTString(): string {
  return (
    new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }) + ' IST'
  )
}

function getInitialRecords(): CalendlyBookingRecord[] {
  return [
    {
      id: 'CLY-001',
      leadName: 'Rahul Mehta',
      leadPhone: '+91 98201 44892',
      leadEmail: 'rahul.mehta@acmedigital.com',
      company: 'Acme Digital Solutions',
      smsSentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      smsSentAtIST: '25 Sep 2026, 08:20:14 AM IST',
      calendlyLink: 'https://calendly.com/callisto-ai/demo-30min',
      bookingStatus: 'BOOKED',
      bookedSlot: 'Tuesday, Sep 29 · 11:00 AM IST',
      followUpAttempts: 0,
      triggeredBy: 'HUMAN_TRANSFER_REQUEST',
      agentName: 'Aria',
    },
    {
      id: 'CLY-002',
      leadName: 'Kavitha Reddy',
      leadPhone: '+91 94401 22819',
      leadEmail: 'kavitha.r@bharatinsure.com',
      company: 'Bharat Insurance Group',
      smsSentAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      smsSentAtIST: '25 Sep 2026, 09:12:33 AM IST',
      calendlyLink: 'https://calendly.com/callisto-ai/demo-30min',
      bookingStatus: 'LINK_OPENED',
      followUpCallScheduled: false,
      followUpAttempts: 0,
      triggeredBy: 'HUMAN_TRANSFER_REQUEST',
      agentName: 'Aria',
    },
    {
      id: 'CLY-003',
      leadName: 'Oliver Schmidt',
      leadPhone: '+49 89 1234 5678',
      leadEmail: 'o.schmidt@deutech.de',
      company: 'Deutech Manufacturing',
      smsSentAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      smsSentAtIST: '25 Sep 2026, 06:57:04 AM IST',
      calendlyLink: 'https://calendly.com/callisto-ai/demo-30min',
      bookingStatus: 'SMS_SENT',
      followUpCallScheduled: true,
      followUpCallAt: 'Tomorrow, 10:00 AM IST',
      followUpAttempts: 1,
      triggeredBy: 'HUMAN_TRANSFER_REQUEST',
      agentName: 'Aria',
    },
  ]
}

function loadStore(): CalendlyBookingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  const initial = getInitialRecords()
  saveStore(initial)
  return initial
}

function saveStore(records: CalendlyBookingRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch { /* ignore */ }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** Detect if the prospect message is requesting to speak with a human */
export function detectHumanTransferIntent(prospectMessage: string): boolean {
  const lower = prospectMessage.toLowerCase()
  const patterns = [
    'speak to a human',
    'talk to a person',
    'talk to a real person',
    'speak to someone',
    'human agent',
    'real person',
    'connect me to',
    'transfer me',
    'speak with your team',
    'talk to your team',
    'speak to your sales',
    'book a call',
    'schedule a call',
    'schedule a meeting',
    'book a meeting',
    'set up a meeting',
    'can we meet',
    'want to meet',
    'prefer to talk',
    'want to speak',
    'not interested in ai',
    'not talking to a bot',
    'talk to sales',
    'sales rep',
    'sales team',
    'account executive',
    'account manager',
    'your representative',
    'book with your team',
    'speak with someone',
    'human please',
  ]
  return patterns.some((p) => lower.includes(p))
}

/** Build the SMS body for Calendly link dispatch */
export function buildCalendlySmsText(
  prospectName: string,
  agentName: string,
  companyName: string,
  calendlyLink: string
): string {
  const firstName = prospectName.split(' ')[0] || prospectName
  return (
    `Hi ${firstName}! This is ${agentName} from ${companyName}. ` +
    `As requested, here is a direct link to book a time with our team at your preferred slot:\n` +
    `${calendlyLink}\n\n` +
    `All meeting slots are pre-approved by our team. Book now and we'll confirm within minutes! 🗓️`
  )
}

/** Build Email body and HTML for Calendly link dispatch */
export function buildCalendlyEmail(
  prospectName: string,
  agentName: string,
  companyName: string,
  calendlyLink: string
): { subject: string; body: string; html: string } {
  const firstName = prospectName.split(' ')[0] || prospectName
  const subject = `Invitation: Strategy Call & Calendly Booking with ${companyName || 'Callisto AI Solutions'}`
  const body =
    `Hi ${firstName},\n\n` +
    `Thank you for taking the time to speak with our team! This is ${agentName} from ${companyName || 'Callisto AI Solutions'}.\n\n` +
    `As requested during our call, here is your direct link to book a dedicated strategy consultation with our senior solutions engineering team:\n\n` +
    `👉 ${calendlyLink}\n\n` +
    `All available meeting slots on this link are pre-approved. Simply select the date and time that suits your schedule best, and our team will prepare a tailored walkthrough for your company.\n\n` +
    `We look forward to speaking with you!\n\n` +
    `Warm regards,\n` +
    `${agentName}\n` +
    `${companyName || 'Callisto AI Solutions'}`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="border-bottom: 2px solid #8b5cf6; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #8b5cf6; font-weight: 700;">${companyName || 'Callisto AI Solutions'} · Meeting Confirmation</span>
        <h2 style="margin: 8px 0 0 0; color: #0f172a; font-size: 20px;">Personalized Consultation Invite</h2>
      </div>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
        Thank you for speaking with us today! This is <strong>${agentName}</strong> from <strong>${companyName || 'Callisto AI Solutions'}</strong>.
        As requested during our conversation, here is your direct link to reserve a time with our senior engineering & solutions team:
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${calendlyLink}" target="_blank" style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: #ffffff; padding: 13px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);">
          📅 Book Meeting Slot on Calendly
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; line-height: 1.5; background: #f8fafc; padding: 12px 16px; border-radius: 6px; border-left: 3px solid #8b5cf6; margin: 0 0 24px 0;">
        💡 <strong>Quick Note:</strong> All slots are pre-configured with real-time calendar availability. Once booked, calendar invites and video conference links are instantly confirmed.
      </p>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 13px; color: #64748b;">
        <div>Best regards,</div>
        <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">${agentName}</div>
        <div style="color: #8b5cf6; font-size: 12px;">${companyName || 'Callisto AI Solutions'}</div>
      </div>
    </div>
  `

  return { subject, body, html }
}

/** Retrieve configured Calendly booking link (from localStorage, env, or default) */
export function getCustomCalendlyLink(): string {
  try {
    const saved = localStorage.getItem('callisto_custom_calendly_link')
    if (saved && saved.trim()) return saved.trim()
  } catch {}
  return (import.meta as any).env?.VITE_CALENDLY_LINK || 'https://calendly.com/mehtatanishq08/30min'
}

/** Save custom Calendly link to localStorage */
export function setCustomCalendlyLink(link: string): void {
  try {
    localStorage.setItem('callisto_custom_calendly_link', link.trim())
  } catch {}
}

/** Send Calendly link via Email — creates a tracking record */
export async function sendCalendlyEmail(params: {
  prospectName: string
  prospectEmail: string
  prospectPhone?: string
  company: string
  agentName: string
  companyName: string
  callId?: string
  triggeredBy?: 'HUMAN_TRANSFER_REQUEST' | 'MANUAL'
  calendlyLink?: string
}): Promise<CalendlyBookingRecord> {
  const calendlyLink = params.calendlyLink || getCustomCalendlyLink()
  const { subject, body, html } = buildCalendlyEmail(
    params.prospectName,
    params.agentName,
    params.companyName,
    calendlyLink
  )

  let previewUrl: string | undefined = undefined
  // Fire to backend server email endpoint
  try {
    const res = await fetch('http://localhost:5005/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ADMIN' },
      body: JSON.stringify({
        to: params.prospectEmail,
        subject,
        body,
        html,
        leadName: params.prospectName,
        calendlyLink,
        agentName: params.agentName,
        companyName: params.companyName,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.previewUrl) previewUrl = data.previewUrl
    }
  } catch {
    // Server may not be running; silently continue with local store
  }

  const now = new Date()
  const record: CalendlyBookingRecord = {
    id: `CLY-MAIL-${Date.now()}`,
    leadName: params.prospectName,
    leadPhone: params.prospectPhone || '',
    leadEmail: params.prospectEmail,
    company: params.company,
    emailSentAt: now.toISOString(),
    emailSentAtIST: getISTString(),
    calendlyLink,
    bookingStatus: 'EMAIL_SENT',
    dispatchChannel: 'EMAIL',
    previewUrl,
    followUpAttempts: 0,
    triggeredBy: params.triggeredBy ?? 'HUMAN_TRANSFER_REQUEST',
    agentName: params.agentName,
    callId: params.callId,
  }

  const store = loadStore()
  store.unshift(record)
  saveStore(store)
  return record
}

/** Send SMS with Calendly link — creates a tracking record */
export async function sendCalendlySms(params: {
  prospectName: string
  prospectPhone: string
  prospectEmail: string
  company: string
  agentName: string
  companyName: string
  callId?: string
  triggeredBy?: 'HUMAN_TRANSFER_REQUEST' | 'MANUAL'
  calendlyLink?: string
}): Promise<CalendlyBookingRecord> {
  const calendlyLink = params.calendlyLink || getCustomCalendlyLink()
  const smsText = buildCalendlySmsText(
    params.prospectName,
    params.agentName,
    params.companyName,
    calendlyLink
  )

  // Fire-and-forget to backend (Twilio SMS via server)
  try {
    await fetch('http://localhost:5005/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ADMIN' },
      body: JSON.stringify({
        to: params.prospectPhone,
        body: smsText,
        leadName: params.prospectName,
        calendlyLink,
      }),
    })
  } catch {
    // Server may not be running; silently continue
  }

  const record: CalendlyBookingRecord = {
    id: `CLY-SMS-${Date.now()}`,
    leadName: params.prospectName,
    leadPhone: params.prospectPhone,
    leadEmail: params.prospectEmail,
    company: params.company,
    smsSentAt: new Date().toISOString(),
    smsSentAtIST: getISTString(),
    calendlyLink,
    bookingStatus: 'SMS_SENT',
    dispatchChannel: 'SMS',
    followUpAttempts: 0,
    triggeredBy: params.triggeredBy ?? 'HUMAN_TRANSFER_REQUEST',
    agentName: params.agentName,
    callId: params.callId,
  }

  const store = loadStore()
  store.unshift(record)
  saveStore(store)
  return record
}

/** Send Calendly link via Email, SMS, or Both */
export async function sendCalendlyDispatch(params: {
  channel: 'EMAIL' | 'SMS' | 'BOTH'
  prospectName: string
  prospectPhone: string
  prospectEmail: string
  company: string
  agentName: string
  companyName: string
  callId?: string
  triggeredBy?: 'HUMAN_TRANSFER_REQUEST' | 'MANUAL'
  calendlyLink?: string
}): Promise<CalendlyBookingRecord> {
  const calendlyLink = params.calendlyLink || getCustomCalendlyLink()

  if (params.channel === 'EMAIL') {
    return sendCalendlyEmail(params)
  }

  if (params.channel === 'SMS') {
    return sendCalendlySms(params)
  }

  // BOTH Email and SMS
  const { subject, body, html } = buildCalendlyEmail(
    params.prospectName,
    params.agentName,
    params.companyName,
    calendlyLink
  )
  const smsText = buildCalendlySmsText(
    params.prospectName,
    params.agentName,
    params.companyName,
    calendlyLink
  )

  try {
    await Promise.allSettled([
      fetch('http://localhost:5005/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ADMIN' },
        body: JSON.stringify({
          to: params.prospectEmail,
          subject,
          body,
          html,
          leadName: params.prospectName,
          calendlyLink,
          agentName: params.agentName,
          companyName: params.companyName,
        }),
      }),
      fetch('http://localhost:5005/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ADMIN' },
        body: JSON.stringify({
          to: params.prospectPhone,
          body: smsText,
          leadName: params.prospectName,
          calendlyLink,
        }),
      }),
    ])
  } catch {}

  const now = new Date()
  const record: CalendlyBookingRecord = {
    id: `CLY-BOTH-${Date.now()}`,
    leadName: params.prospectName,
    leadPhone: params.prospectPhone,
    leadEmail: params.prospectEmail,
    company: params.company,
    smsSentAt: now.toISOString(),
    smsSentAtIST: getISTString(),
    emailSentAt: now.toISOString(),
    emailSentAtIST: getISTString(),
    calendlyLink,
    bookingStatus: 'DISPATCHED',
    dispatchChannel: 'BOTH',
    followUpAttempts: 0,
    triggeredBy: params.triggeredBy ?? 'HUMAN_TRANSFER_REQUEST',
    agentName: params.agentName,
    callId: params.callId,
  }

  const store = loadStore()
  store.unshift(record)
  saveStore(store)
  return record
}

/** Get all Calendly booking records */
export function getCalendlyBookings(): CalendlyBookingRecord[] {
  return loadStore()
}

/** Update booking status (called on Calendly webhook or manual simulation) */
export function updateBookingStatus(
  id: string,
  status: CalendlyBookingRecord['bookingStatus'],
  bookedSlot?: string
): CalendlyBookingRecord | null {
  const store = loadStore()
  const idx = store.findIndex((r) => r.id === id)
  if (idx === -1) return null
  store[idx].bookingStatus = status
  if (bookedSlot) store[idx].bookedSlot = bookedSlot
  store[idx].lastCheckedAt = getISTString()
  saveStore(store)
  return store[idx]
}

/** Schedule a follow-up re-call for a lead who has not booked */
export function scheduleFollowUpCall(
  id: string,
  callAt: string
): CalendlyBookingRecord | null {
  const store = loadStore()
  const idx = store.findIndex((r) => r.id === id)
  if (idx === -1) return null
  store[idx].followUpCallScheduled = true
  store[idx].followUpCallAt = callAt
  store[idx].followUpAttempts = (store[idx].followUpAttempts || 0) + 1
  store[idx].lastCheckedAt = getISTString()
  saveStore(store)
  return store[idx]
}

/** Simulate a Calendly event for demo purposes */
export function simulateCalendlyEvent(
  id: string,
  event: 'opened' | 'booked' | 'cancelled'
): CalendlyBookingRecord | null {
  const slots = [
    'Monday, Sep 28 · 10:00 AM IST',
    'Tuesday, Sep 29 · 11:00 AM IST',
    'Wednesday, Sep 30 · 3:00 PM IST',
    'Thursday, Oct 1 · 2:00 PM IST',
    'Friday, Oct 2 · 4:00 PM IST',
  ]
  const randomSlot = slots[Math.floor(Math.random() * slots.length)]
  const statusMap = {
    opened: 'LINK_OPENED' as const,
    booked: 'BOOKED' as const,
    cancelled: 'CANCELLED' as const,
  }
  return updateBookingStatus(
    id,
    statusMap[event],
    event === 'booked' ? randomSlot : undefined
  )
}

/** Statistics for dashboard tiles */
export function getCalendlyStats() {
  const records = loadStore()
  const booked = records.filter((r) => r.bookingStatus === 'BOOKED').length
  const opened = records.filter((r) => r.bookingStatus === 'LINK_OPENED').length
  const pending = records.filter(
    (r) => r.bookingStatus === 'SMS_SENT' || r.bookingStatus === 'EMAIL_SENT' || r.bookingStatus === 'DISPATCHED'
  ).length
  const followUpScheduled = records.filter(
    (r) => r.followUpCallScheduled && r.bookingStatus !== 'BOOKED'
  ).length
  return {
    total: records.length,
    booked,
    pending,
    opened,
    followUpScheduled,
    bookingRate: records.length > 0 ? Math.round((booked / records.length) * 100) : 0,
  }
}
