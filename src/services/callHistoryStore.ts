// ============================================================
// Call History Store — Persistent in-memory + localStorage
// Manages AI-generated call sessions, transcripts, and analytics
// ============================================================

import type { CallOutcome, CallSentiment } from '@/data/calls'

export interface LiveCallSession {
  sessionId: string
  startedAt: Date
  endedAt?: Date
  prospectName: string
  company: string
  agentName: string
  language: 'en' | 'hi' | 'gu'
  scenario: 'INTERESTED' | 'VOICEMAIL' | 'CALLBACK' | 'FAQ' | 'RETRY'
  transcript: Array<{
    speaker: 'AI' | 'PROSPECT'
    text: string
    timestamp: string
    isGeminiGenerated?: boolean
  }>
  outcome?: CallOutcome
  sentiment?: CallSentiment
  intent?: 'HIGH' | 'MEDIUM' | 'LOW'
  qualification?: 'QUALIFIED' | 'LIKELY' | 'NEEDS_REVIEW' | 'NOT_QUALIFIED'
  buyingSignals: string[]
  objections: string[]
  summary?: string
  nextBestAction?: string
  engagementScore?: number
  durationSeconds: number
  isAIGenerated: boolean // true if used Gemini, false if script-based
}

const STORAGE_KEY = 'callisto_call_sessions'

function loadFromStorage(): LiveCallSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // Re-hydrate Date objects
    return parsed.map((s: LiveCallSession) => ({
      ...s,
      startedAt: new Date(s.startedAt),
      endedAt: s.endedAt ? new Date(s.endedAt) : undefined,
    }))
  } catch {
    return []
  }
}

function saveToStorage(sessions: LiveCallSession[]) {
  try {
    // Keep only last 100 sessions to avoid storage bloat
    const trimmed = sessions.slice(-100)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // Storage might be full — fail silently
  }
}

// In-memory store (reactive via callbacks)
let _sessions: LiveCallSession[] = loadFromStorage()
const _listeners: Array<(sessions: LiveCallSession[]) => void> = []

function notify() {
  _listeners.forEach(fn => fn([..._sessions]))
}

export const callHistoryStore = {
  // Subscribe to session changes
  subscribe(fn: (sessions: LiveCallSession[]) => void): () => void {
    _listeners.push(fn)
    fn([..._sessions])
    return () => {
      const idx = _listeners.indexOf(fn)
      if (idx !== -1) _listeners.splice(idx, 1)
    }
  },

  // Get all sessions
  getAll(): LiveCallSession[] {
    return [..._sessions]
  },

  // Get a specific session
  getById(id: string): LiveCallSession | undefined {
    return _sessions.find(s => s.sessionId === id)
  },

  // Start a new session
  startSession(params: {
    prospectName: string
    company: string
    agentName: string
    language: 'en' | 'hi' | 'gu'
    scenario: 'INTERESTED' | 'VOICEMAIL' | 'CALLBACK' | 'FAQ' | 'RETRY'
    isAIGenerated: boolean
  }): LiveCallSession {
    const session: LiveCallSession = {
      sessionId: `LIVE-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      startedAt: new Date(),
      prospectName: params.prospectName,
      company: params.company,
      agentName: params.agentName,
      language: params.language,
      scenario: params.scenario,
      transcript: [],
      buyingSignals: [],
      objections: [],
      durationSeconds: 0,
      isAIGenerated: params.isAIGenerated,
    }
    _sessions = [session, ..._sessions]
    saveToStorage(_sessions)
    notify()
    return session
  },

  // Add a transcript turn
  addTranscriptTurn(
    sessionId: string,
    turn: {
      speaker: 'AI' | 'PROSPECT'
      text: string
      timestamp: string
      isGeminiGenerated?: boolean
    }
  ) {
    _sessions = _sessions.map(s =>
      s.sessionId === sessionId
        ? { ...s, transcript: [...s.transcript, turn] }
        : s
    )
    saveToStorage(_sessions)
    notify()
  },

  // End a session with analysis results
  endSession(
    sessionId: string,
    data: {
      outcome: CallOutcome
      sentiment: CallSentiment
      intent: 'HIGH' | 'MEDIUM' | 'LOW'
      qualification: 'QUALIFIED' | 'LIKELY' | 'NEEDS_REVIEW' | 'NOT_QUALIFIED'
      buyingSignals: string[]
      objections: string[]
      summary: string
      nextBestAction: string
      engagementScore?: number
      durationSeconds: number
    }
  ) {
    _sessions = _sessions.map(s =>
      s.sessionId === sessionId
        ? { ...s, ...data, endedAt: new Date() }
        : s
    )
    saveToStorage(_sessions)
    notify()
  },

  // Update duration only (live ticker)
  updateDuration(sessionId: string, durationSeconds: number) {
    _sessions = _sessions.map(s =>
      s.sessionId === sessionId ? { ...s, durationSeconds } : s
    )
    // Don't persist every second — just notify UI
    notify()
  },

  // Delete a session
  deleteSession(sessionId: string) {
    _sessions = _sessions.filter(s => s.sessionId !== sessionId)
    saveToStorage(_sessions)
    notify()
  },

  // Clear all sessions
  clearAll() {
    _sessions = []
    saveToStorage(_sessions)
    notify()
  },

  // Stats helper
  getStats() {
    const total = _sessions.length
    const answered = _sessions.filter(s => s.outcome && !['NO_ANSWER', 'VOICEMAIL'].includes(s.outcome)).length
    const qualified = _sessions.filter(s => s.qualification === 'QUALIFIED').length
    const meetings = _sessions.filter(s => s.outcome === 'MEETING_BOOKED').length
    const avgDuration = total > 0
      ? Math.round(_sessions.reduce((sum, s) => sum + s.durationSeconds, 0) / total)
      : 0
    const aiGenerated = _sessions.filter(s => s.isAIGenerated).length
    return { total, answered, qualified, meetings, avgDuration, aiGenerated }
  }
}
