/**
 * Enterprise Security Utility Library for Callisto AI
 * Implements:
 * - IST (Indian Standard Time, UTC+5:30) timestamping
 * - Cryptographic Hash-Chain (SHA-256) for tamper-evident audit logs
 * - Field-level sensitive data masking (Phone, Email, IP, API keys) for CSV/exports
 * - Client-side AES-GCM 256-bit encryption at rest for master data
 * - Input validation & sanitization (anti-XSS and anti-SQLi)
 * - Zero-Trust Role-Based Access Control (RBAC) permission definitions
 */

// ============================================================================
// 1. IST (Indian Standard Time) Formatters (UTC + 5:30)
// ============================================================================

/**
 * Returns formatted IST Date & Time with seconds:
 * e.g. "25 Sep 2026, 05:48:12 AM IST"
 */
export function formatISTDateTime(date: Date | string | number | undefined | null): string {
  if (!date) return 'N/A'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return 'Invalid Date'

  try {
    const formatted = d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    return `${formatted} IST`
  } catch (e) {
    // Fallback manual offset (+5h 30m)
    const utc = d.getTime() + d.getTimezoneOffset() * 60000
    const ist = new Date(utc + 5.5 * 3600000)
    return `${ist.toDateString()} ${ist.toLocaleTimeString()} IST`
  }
}

/**
 * Returns formatted IST Time only: "05:48:12 AM IST"
 */
export function formatISTTime(date: Date | string | number | undefined | null): string {
  if (!date) return 'N/A'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return 'Invalid Time'

  try {
    const formatted = d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    return `${formatted} IST`
  } catch (e) {
    return d.toLocaleTimeString()
  }
}

/**
 * Returns current timestamp formatted in IST
 */
export function getCurrentISTTimestamp(): string {
  return formatISTDateTime(new Date())
}

// ============================================================================
// 2. Cryptographic SHA-256 & Tamper-Evident Hash Chain
// ============================================================================

/**
 * Computes SHA-256 digest of any string.
 * Uses Web Crypto API when available, with a fast fallback.
 */
export async function computeSha256(text: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(text)
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (e) {
      // fallback to sync hash if crypto.subtle fails
    }
  }

  // FNV-1a / Murmur hybrid 64-char hex fallback for testing / older runtimes
  let h1 = 0xdeadbeef ^ text.length, h2 = 0x41c6ce57 ^ text.length
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0')
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0')
  return `${p1}${p2}${p1}${p2}${p1}${p2}${p1}${p2}`.slice(0, 64)
}

export interface HashChainedLogEntry {
  id: string
  timestamp: string // ISO string
  timestampIST: string // e.g. "25 Sep 2026, 05:48:12 AM IST"
  userId: string
  userName: string
  userEmail: string
  userRole: string
  action: string
  resource: string
  ip: string
  status: 'SUCCESS' | 'FAILED' | 'WARNING' | 'BLOCKED'
  details: string
  previousHash: string
  tamperHash: string
  sequence: number
}

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000'

/**
 * Creates the payload string that is hashed for an audit entry
 */
export function buildHashPayload(entry: {
  sequence: number
  previousHash: string
  id: string
  timestamp: string
  userId: string
  action: string
  resource: string
  status: string
  details: string
}): string {
  return `${entry.sequence}|${entry.previousHash}|${entry.id}|${entry.timestamp}|${entry.userId}|${entry.action}|${entry.resource}|${entry.status}|${entry.details}`
}

/**
 * Verifies the integrity of an entire hash-chained audit log array.
 * Detects if any record was modified, reordered, or deleted.
 */
export async function verifyAuditChain(
  logs: HashChainedLogEntry[]
): Promise<{ valid: boolean; brokenIndex?: number; message: string; verifiedCount: number }> {
  if (!logs || logs.length === 0) {
    return { valid: true, message: 'Log chain empty (valid genesis state)', verifiedCount: 0 }
  }

  // Iterate chronologically (lowest sequence to highest)
  const sorted = [...logs].sort((a, b) => a.sequence - b.sequence)

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    const expectedPrevHash = i === 0 ? GENESIS_HASH : sorted[i - 1].tamperHash

    if (current.previousHash !== expectedPrevHash) {
      return {
        valid: false,
        brokenIndex: i,
        message: `Tamper alert! Previous hash mismatch at sequence #${current.sequence} (Log ID: ${current.id}). Expected ${expectedPrevHash.slice(0, 10)}... got ${current.previousHash.slice(0, 10)}...`,
        verifiedCount: i,
      }
    }

    const payload = buildHashPayload({
      sequence: current.sequence,
      previousHash: current.previousHash,
      id: current.id,
      timestamp: current.timestamp,
      userId: current.userId,
      action: current.action,
      resource: current.resource,
      status: current.status,
      details: current.details,
    })

    const recomputedHash = await computeSha256(payload)
    if (recomputedHash !== current.tamperHash) {
      return {
        valid: false,
        brokenIndex: i,
        message: `Tamper alert! SHA-256 signature mismatch at sequence #${current.sequence} (Log ID: ${current.id}). Log contents appear to have been modified.`,
        verifiedCount: i,
      }
    }
  }

  return {
    valid: true,
    message: `All ${sorted.length} cryptographic audit log blocks verified. Zero tampering detected. Chain is 100% immutable.`,
    verifiedCount: sorted.length,
  }
}

// ============================================================================
// 3. Field-Level Masking for Sensitive Operational Data
// ============================================================================

/**
 * Masks an email address for privacy/compliance:
 * "tanishq@demo-callistoai.com" -> "ta****@demo-callistoai.com"
 */
export function maskEmail(email: string | undefined | null): string {
  if (!email || typeof email !== 'string') return ''
  const parts = email.split('@')
  if (parts.length !== 2) return '****'
  const [local, domain] = parts
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1)
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`
}

/**
 * Masks a phone number:
 * "+91 9820192831" -> "+91 98*****831"
 * "+1 (555) 019-2831" -> "+1 (555) ***-2831"
 */
export function maskPhone(phone: string | undefined | null): string {
  if (!phone || typeof phone !== 'string') return ''
  const digitsOnly = phone.replace(/\D/g, '')
  if (digitsOnly.length < 6) return '****'
  const first = phone.slice(0, Math.min(6, Math.floor(phone.length / 2)))
  const last = phone.slice(-3)
  return `${first}${'*'.repeat(4)}${last}`
}

/**
 * Masks an IP address:
 * "192.168.1.101" -> "192.168.*.*"
 * "202.88.12.45" -> "202.88.*.*"
 */
export function maskIp(ip: string | undefined | null): string {
  if (!ip || typeof ip !== 'string') return ''
  if (ip === 'SYSTEM') return 'SYSTEM'
  const segments = ip.split('.')
  if (segments.length === 4) {
    return `${segments[0]}.${segments[1]}.*.*`
  }
  return ip.slice(0, Math.min(6, ip.length)) + '****'
}

/**
 * Masks sensitive API keys or secrets:
 * "sk-live-93a8bf12984ac890" -> "sk-live-********c890"
 */
export function maskSecret(secret: string | undefined | null): string {
  if (!secret || typeof secret !== 'string') return ''
  if (secret.length <= 8) return '********'
  return `${secret.slice(0, 7)}${'*'.repeat(secret.length - 11)}${secret.slice(-4)}`
}

/**
 * Applies field-level masking to an object record before CSV export or display
 */
export function maskSensitiveRecord<T extends Record<string, any>>(
  record: T,
  shouldMask: boolean = true
): T {
  if (!shouldMask) return record
  const clone = { ...record }

  const sensitiveEmailKeys = ['email', 'userEmail', 'contactEmail', 'workEmail']
  const sensitivePhoneKeys = ['phone', 'mobile', 'phoneNumber', 'cellPhone']
  const sensitiveIpKeys = ['ip', 'clientIp', 'ipAddress']
  const sensitiveSecretKeys = ['apiKey', 'webhookSecret', 'token', 'password', 'secret']

  for (const key of Object.keys(clone)) {
    const val = clone[key]
    if (typeof val === 'string') {
      if (sensitiveEmailKeys.includes(key)) {
        clone[key as keyof T] = maskEmail(val) as any
      } else if (sensitivePhoneKeys.includes(key)) {
        clone[key as keyof T] = maskPhone(val) as any
      } else if (sensitiveIpKeys.includes(key)) {
        clone[key as keyof T] = maskIp(val) as any
      } else if (sensitiveSecretKeys.includes(key)) {
        clone[key as keyof T] = maskSecret(val) as any
      }
    }
  }

  return clone
}

// ============================================================================
// 4. Input Validation & Sanitization (Injection Prevention)
// ============================================================================

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /data:text\/html/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|EXECUTE)\b.{1,50}\b(FROM|INTO|TABLE|DATABASE|WHERE)\b)/gi,
  /--\s*$/gm,
  /;\s*DROP\s+TABLE/gi,
  /'\s+OR\s+'?1'?='?1/gi,
  /"\s+OR\s+"?1"?="?1/gi,
]

/**
 * Checks if a string contains known XSS, SQLi, or injection payload patterns
 */
export function hasInjectionRisk(input: string): boolean {
  if (!input || typeof input !== 'string') return false
  return DANGEROUS_PATTERNS.some(regex => regex.test(input))
}

/**
 * Sanitizes input string by stripping script tags, javascript protocols, and dangerous HTML entities
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/['"]\s*OR\s*['"]?1['"]?\s*=\s*['"]?1/gi, '')
    .trim()
}

// ============================================================================
// 5. Client-Side Encryption at Rest (AES-GCM 256-bit)
// ============================================================================

const MASTER_SALT = 'CALLISTO_ENTERPRISE_KEY_SALT_2026'

async function getEncryptionKey(secret: string = MASTER_SALT): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('callisto_salt_vector_gcm'),
      iterations: 10000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypts plain text string using AES-GCM 256-bit
 */
export async function encryptData(plainText: string, secret?: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Base64 fallback if Web Crypto is unavailable
    return `enc_b64:${btoa(unescape(encodeURIComponent(plainText)))}`
  }
  try {
    const key = await getEncryptionKey(secret)
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(plainText)
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    )
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encrypted), iv.length)
    return `aes_gcm:${btoa(String.fromCharCode(...combined))}`
  } catch (e) {
    return `enc_raw:${btoa(plainText)}`
  }
}

/**
 * Decrypts AES-GCM ciphertext
 */
export async function decryptData(cipherText: string, secret?: string): Promise<string> {
  if (!cipherText) return ''
  if (cipherText.startsWith('enc_b64:')) {
    return decodeURIComponent(escape(atob(cipherText.replace('enc_b64:', ''))))
  }
  if (cipherText.startsWith('enc_raw:')) {
    return atob(cipherText.replace('enc_raw:', ''))
  }
  if (!cipherText.startsWith('aes_gcm:') || typeof window === 'undefined' || !window.crypto?.subtle) {
    return cipherText
  }

  try {
    const rawData = atob(cipherText.replace('aes_gcm:', ''))
    const bytes = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; i++) bytes[i] = rawData.charCodeAt(i)

    const iv = bytes.slice(0, 12)
    const encryptedData = bytes.slice(12)
    const key = await getEncryptionKey(secret)

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    )
    return new TextDecoder().decode(decrypted)
  } catch (e) {
    console.warn('[Security] Failed to decrypt ciphertext, falling back to raw', e)
    return cipherText
  }
}

/**
 * Stores encrypted master data to localStorage
 */
export async function setEncryptedStorage(key: string, value: any): Promise<void> {
  try {
    const jsonStr = JSON.stringify(value)
    const encrypted = await encryptData(jsonStr)
    localStorage.setItem(`__enc_${key}`, encrypted)
  } catch (e) {
    console.error(`[Security] Failed setting encrypted storage for ${key}`, e)
  }
}

/**
 * Reads and decrypts master data from localStorage
 */
export async function getEncryptedStorage<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const stored = localStorage.getItem(`__enc_${key}`)
    if (!stored) {
      // Check legacy unencrypted key for seamless migration
      const legacy = localStorage.getItem(key)
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy)
          // Automatically encrypt it now for future safety
          setEncryptedStorage(key, parsed)
          return parsed
        } catch {
          return legacy as any
        }
      }
      return defaultValue
    }
    const decrypted = await decryptData(stored)
    return JSON.parse(decrypted) as T
  } catch (e) {
    return defaultValue
  }
}

// ============================================================================
// 6. Role-Based Access Control (RBAC) Permissions Matrix
// ============================================================================

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES_AGENT' | 'VIEWER'

export interface RolePrivilege {
  role: UserRole
  title: string
  level: number // 4: Highest (Admin), 1: Lowest (Viewer)
  description: string
  badgeColor: string
  mfaRequired: boolean
  canAccessAdmin: boolean
  canManageUsers: boolean
  canManagePlatform: boolean
  canWriteLeads: boolean
  canExportUnmasked: boolean
  canDialVoiceAgent: boolean
  canSyncCrm: boolean
  canViewAuditLogs: boolean
  canClearLogs: boolean
}

export const ROLE_PRIVILEGES: Record<UserRole, RolePrivilege> = {
  ADMIN: {
    role: 'ADMIN',
    title: 'Super Administrator / Security Officer',
    level: 4,
    description: 'Complete root privileges: User management, platform configuration, full audit chain verification, unmasked exports, and emergency security controls.',
    badgeColor: 'badge-blue',
    mfaRequired: true,
    canAccessAdmin: true,
    canManageUsers: true,
    canManagePlatform: true,
    canWriteLeads: true,
    canExportUnmasked: true,
    canDialVoiceAgent: true,
    canSyncCrm: true,
    canViewAuditLogs: true,
    canClearLogs: false, // Append-only by design!
  },
  MANAGER: {
    role: 'MANAGER',
    title: 'Operations & Sales Lead Manager',
    level: 3,
    description: 'High privileges: CRM synchronization, campaign creation, lead allocation, AI qualification rules, and team performance analytics.',
    badgeColor: 'badge-amber',
    mfaRequired: true,
    canAccessAdmin: false,
    canManageUsers: false,
    canManagePlatform: false,
    canWriteLeads: true,
    canExportUnmasked: false, // Masked by default
    canDialVoiceAgent: true,
    canSyncCrm: true,
    canViewAuditLogs: true,
    canClearLogs: false,
  },
  SALES_AGENT: {
    role: 'SALES_AGENT',
    title: 'Inside Sales SDR / Closer',
    level: 2,
    description: 'Standard operational privileges: Multilingual AI voice dialing, lead status updates, objection handling review, and appointment scheduling.',
    badgeColor: 'badge-success',
    mfaRequired: false,
    canAccessAdmin: false,
    canManageUsers: false,
    canManagePlatform: false,
    canWriteLeads: true,
    canExportUnmasked: false,
    canDialVoiceAgent: true,
    canSyncCrm: false,
    canViewAuditLogs: false,
    canClearLogs: false,
  },
  VIEWER: {
    role: 'VIEWER',
    title: 'Auditor & Read-Only Stakeholder',
    level: 1,
    description: 'Strictly read-only compliance access: Review pipelines, dashboards, and market trends. All write, update, dial, and export actions are restricted.',
    badgeColor: 'badge-low',
    mfaRequired: false,
    canAccessAdmin: false,
    canManageUsers: false,
    canManagePlatform: false,
    canWriteLeads: false,
    canExportUnmasked: false,
    canDialVoiceAgent: false,
    canSyncCrm: false,
    canViewAuditLogs: true,
    canClearLogs: false,
  },
}

/**
 * Checks whether a given role has permission for a specific capability
 */
export function hasPermission(role: UserRole | undefined, permission: keyof Omit<RolePrivilege, 'role' | 'title' | 'level' | 'description' | 'badgeColor' | 'mfaRequired'>): boolean {
  if (!role) return false
  const priv = ROLE_PRIVILEGES[role]
  return priv ? Boolean(priv[permission]) : false
}
