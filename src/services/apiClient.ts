/**
 * Callisto AI API Client
 * Manages live communication between the React frontend and the actual backend server.
 * Supports configurable server URL, latency checks, live CRM proxies, and fallback simulation.
 */

const STORAGE_SERVER_URL_KEY = 'callisto_backend_server_url'
export const DEFAULT_SERVER_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5005'

export function getSavedServerUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_SERVER_URL_KEY)
    if (saved && saved.trim()) return saved.trim()
  } catch (e) {
    // fallback
  }
  return DEFAULT_SERVER_URL
}

export function saveServerUrl(url: string) {
  try {
    localStorage.setItem(STORAGE_SERVER_URL_KEY, url.trim())
  } catch (e) {
    console.error('Failed to save server URL', e)
  }
}

export interface ServerHealthResult {
  connected: boolean
  latencyMs: number
  serverUrl: string
  version?: string
  status?: string
  mode?: 'production' | 'development' | 'mock'
  details?: any
  error?: string
}

export async function checkServerHealth(customUrl?: string): Promise<ServerHealthResult> {
  const targetUrl = (customUrl || getSavedServerUrl()).replace(/\/+$/, '')
  const startTime = performance.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)

    const response = await fetch(`${targetUrl}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latencyMs = Math.round(performance.now() - startTime)

    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      return {
        connected: true,
        latencyMs,
        serverUrl: targetUrl,
        version: data.version || '1.0.0',
        status: data.status || 'healthy',
        mode: data.environment || 'development',
        details: data,
      }
    } else {
      return {
        connected: false,
        latencyMs,
        serverUrl: targetUrl,
        error: `Server returned HTTP ${response.status}: ${response.statusText}`,
      }
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime)
    return {
      connected: false,
      latencyMs,
      serverUrl: targetUrl,
      error: err.name === 'AbortError' ? 'Connection timed out (3.5s)' : err.message || 'Connection refused',
    }
  }
}

/**
 * Triggers server-side CRM sync if live server is reachable
 */
export async function syncLeadsWithServer(crmId: string, leads: any[]): Promise<{ success: boolean; message: string; data?: any }> {
  const serverUrl = getSavedServerUrl().replace(/\/+$/, '')
  try {
    const res = await fetch(`${serverUrl}/api/crm/${crmId}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('callisto_jwt_token') || 'demo_token'}`,
      },
      body: JSON.stringify({ leads, timestamp: new Date().toISOString() }),
    })
    if (res.ok) {
      const data = await res.json()
      return { success: true, message: data.message || `Successfully synced with ${crmId}`, data }
    }
    const errData = await res.json().catch(() => ({}))
    return { success: false, message: errData.error || `Server HTTP ${res.status}` }
  } catch (err: any) {
    return { success: false, message: `Could not reach backend at ${serverUrl}. Operating in client simulation mode.` }
  }
}

/**
 * Ingests inbound webhook test ping through live server or client simulation
 */
export async function sendWebhookPing(sourceId: string, payload: any): Promise<{ success: boolean; message: string; lead?: any }> {
  const serverUrl = getSavedServerUrl().replace(/\/+$/, '')
  try {
    const res = await fetch(`${serverUrl}/api/webhooks/leads/${sourceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-callisto-signature': 'sig_test_simulator_handshake',
      },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json()
      return { success: true, message: 'Webhook received & processed by live backend!', lead: data.lead }
    }
  } catch (e) {
    // fallback gracefully to client processing
  }
  return { success: true, message: 'Processed via client simulation engine (no server response required).' }
}
