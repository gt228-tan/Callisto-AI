/**
 * Callisto AI — Voice Engine
 * Wraps the Web Speech API for:
 *   1. Speech Recognition  (microphone → text)
 *   2. Speech Synthesis    (text → spoken audio)
 *
 * Both are lazy-initialised so they don't break in environments
 * where the APIs are unavailable (e.g. server-side rendering).
 */

// ── Types ─────────────────────────────────────────────────────────────────────
export type VoiceLanguage = 'en-US' | 'hi-IN' | 'gu-IN' | 'de-DE' | 'ar-SA'

export interface RecognitionCallbacks {
  /** Called every time an interim or final transcript is ready */
  onInterim?: (text: string) => void
  /** Called when a full sentence/pause is detected (final result) */
  onFinal: (text: string) => void
  /** Called if the user says a disconnect phrase */
  onDisconnect?: () => void
  /** Called on any error */
  onError?: (err: string) => void
  /** Called when recognition actually starts capturing audio */
  onStart?: () => void
  /** Called when recognition stops */
  onStop?: () => void
}

// Phrases that trigger a call disconnect
const DISCONNECT_PHRASES = [
  'disconnected', 'disconnect', 'end call', 'hang up', 'goodbye', 'bye bye',
  'stop the call', 'cut the call', 'i want to end', 'end the call', 'terminate call'
]

function containsDisconnectPhrase(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return DISCONNECT_PHRASES.some(p => lower.includes(p))
}

// ── Speech Recognition ────────────────────────────────────────────────────────
type SpeechRecognitionAny = any   // Browser type varies; avoid strict typing

let recognitionInstance: SpeechRecognitionAny | null = null

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
}

/** Start continuous microphone recognition and invoke callbacks */
export function startMicRecognition(
  language: VoiceLanguage = 'en-US',
  callbacks: RecognitionCallbacks
): void {
  if (!isSpeechRecognitionSupported()) {
    callbacks.onError?.('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
    return
  }

  stopMicRecognition()   // Always clean up previous instance

  const SpeechRecognition: any =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  const recognition: SpeechRecognitionAny = new SpeechRecognition()
  recognitionInstance = recognition

  recognition.lang = language
  recognition.continuous = true          // Keep listening until explicitly stopped
  recognition.interimResults = true      // Stream partial results as user speaks
  recognition.maxAlternatives = 1

  recognition.onstart = () => {
    callbacks.onStart?.()
  }

  recognition.onresult = (event: any) => {
    let interim = ''
    let finalText = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      if (result.isFinal) {
        finalText += result[0].transcript
      } else {
        interim += result[0].transcript
      }
    }

    if (interim) {
      callbacks.onInterim?.(interim)
    }

    if (finalText.trim()) {
      // Check for disconnect trigger BEFORE passing to AI
      if (containsDisconnectPhrase(finalText)) {
        stopMicRecognition()
        callbacks.onDisconnect?.()
        return
      }
      callbacks.onFinal(finalText.trim())
    }
  }

  recognition.onerror = (event: any) => {
    const errMsg = event.error === 'not-allowed'
      ? 'Microphone permission denied. Please allow microphone access in your browser.'
      : event.error === 'no-speech'
        ? 'No speech detected. Listening again…'
        : `Speech recognition error: ${event.error}`

    // 'no-speech' is not fatal — just keep going
    if (event.error !== 'no-speech') {
      callbacks.onError?.(errMsg)
    }
  }

  recognition.onend = () => {
    callbacks.onStop?.()
    // Auto-restart if the instance is still assigned (i.e. not deliberately stopped)
    if (recognitionInstance === recognition) {
      try {
        recognition.start()
      } catch (_) {
        // Recognition may already be running; ignore
      }
    }
  }

  try {
    recognition.start()
  } catch (err: any) {
    callbacks.onError?.(`Could not start microphone: ${err.message}`)
  }
}

/** Stop microphone recognition */
export function stopMicRecognition(): void {
  if (recognitionInstance) {
    recognitionInstance.onend = null   // Prevent auto-restart
    try { recognitionInstance.stop() } catch (_) { /* already stopped */ }
    try { recognitionInstance.abort() } catch (_) { /* already aborted */ }
    recognitionInstance = null
  }
}

// ── Speech Synthesis ──────────────────────────────────────────────────────────
let currentUtterance: SpeechSynthesisUtterance | null = null

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** Speak text aloud and return a promise that resolves when done */
export function speakText(
  text: string,
  language: VoiceLanguage = 'en-US',
  options?: { rate?: number; pitch?: number; onStart?: () => void; onEnd?: () => void }
): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      options?.onEnd?.()
      resolve()
      return
    }

    cancelSpeech()

    const utterance = new SpeechSynthesisUtterance(text)
    currentUtterance = utterance

    utterance.lang = language
    utterance.rate = options?.rate ?? 1.05
    utterance.pitch = options?.pitch ?? 1.0

    // Pick best available voice for the language
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.lang.startsWith(language.split('-')[0]) && !v.localService)
      || voices.find(v => v.lang.startsWith(language.split('-')[0]))
    if (preferred) utterance.voice = preferred

    utterance.onstart = () => options?.onStart?.()
    utterance.onend = () => {
      currentUtterance = null
      options?.onEnd?.()
      resolve()
    }
    utterance.onerror = () => {
      currentUtterance = null
      options?.onEnd?.()
      resolve()
    }

    window.speechSynthesis.speak(utterance)

    // Chrome bug workaround: synthesis stops after ~15s — keep it alive
    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(keepAlive)
        return
      }
      window.speechSynthesis.pause()
      window.speechSynthesis.resume()
    }, 10000)

    utterance.onend = () => {
      clearInterval(keepAlive)
      currentUtterance = null
      options?.onEnd?.()
      resolve()
    }
    utterance.onerror = () => {
      clearInterval(keepAlive)
      currentUtterance = null
      options?.onEnd?.()
      resolve()
    }
  })
}

/** Immediately stop any ongoing speech */
export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel()
  }
  currentUtterance = null
}

/** Returns true while the browser is speaking */
export function isSpeaking(): boolean {
  return isSpeechSynthesisSupported() && window.speechSynthesis.speaking
}

/** Map the app language label to a BCP-47 voice language tag */
export function toVoiceLanguage(lang: string): VoiceLanguage {
  switch (lang) {
    case 'Hindi':    return 'hi-IN'
    case 'Gujarati': return 'gu-IN'
    case 'German':   return 'de-DE'
    case 'Arabic':   return 'ar-SA'
    default:         return 'en-US'
  }
}
