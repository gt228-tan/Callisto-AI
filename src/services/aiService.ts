import { sleep } from '@/lib/utils'
import type { Lead, IntentLevel } from '@/data/leads'

// ============================================================
// Mock AI Service Layer
// All functions are isolated so real APIs can replace them
// ============================================================

export interface DiscoveryResult {
  leadsFound: number
  sources: Record<string, number>
  highIntent: number
  avgScore: number
}

export interface QualificationResult {
  verdict: 'QUALIFIED' | 'LIKELY' | 'NEEDS_REVIEW' | 'NOT_QUALIFIED'
  score: number
  needClarity: number
  urgency: number
  budgetScore: number
  authorityScore: number
  fitScore: number
  reasoning: string
  recommendations: string[]
}

export interface EnrichmentResult {
  employees: number
  funding: string
  hiringStatus: string
  techStack: string[]
  competitors: string[]
  revenue: string
  linkedinFollowers: number
}

export interface CallSummaryResult {
  summary: string
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  intent: IntentLevel
  buyingSignals: string[]
  objections: string[]
  nextBestAction: string
}

export interface MarketSignalResult {
  signal: string
  industry: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence: number
  actionableLeads: number
}

// Progress callback type for UI loading states
export type ProgressCallback = (step: string, progress: number) => void

// ============================================================
// Lead Discovery
// ============================================================
export async function discoverLeads(
  params: {
    keywords: string
    industry: string
    location: string
    sources: string[]
  },
  onProgress?: ProgressCallback
): Promise<DiscoveryResult> {
  const steps = [
    ['Initializing AI discovery engine...', 5],
    ['Scanning LinkedIn for relevant posts...', 20],
    ['Crawling public directories and websites...', 35],
    ['Analyzing requirements with NLP...', 50],
    ['Extracting prospect contact signals...', 65],
    ['Enriching company data...', 78],
    ['Calculating intent scores...', 88],
    ['Deduplicating and ranking results...', 95],
    ['Discovery complete!', 100],
  ] as [string, number][]

  for (const [step, progress] of steps) {
    onProgress?.(step, progress)
    await sleep(400 + Math.random() * 300)
  }

  const base = Math.floor(Math.random() * 30) + 15
  return {
    leadsFound: base,
    sources: {
      LinkedIn: Math.floor(base * 0.45),
      'X (Twitter)': Math.floor(base * 0.15),
      'Company Websites': Math.floor(base * 0.20),
      'Public Directories': Math.floor(base * 0.12),
      'Freelance Platforms': Math.floor(base * 0.08),
    },
    highIntent: Math.floor(base * 0.38),
    avgScore: Math.floor(Math.random() * 20) + 68,
  }
}

// ============================================================
// Lead Enrichment
// ============================================================
export async function enrichLead(
  lead: Partial<Lead>,
  onProgress?: ProgressCallback
): Promise<EnrichmentResult> {
  const steps = [
    ['Looking up company profile...', 20],
    ['Fetching LinkedIn company data...', 40],
    ['Checking hiring activity...', 60],
    ['Identifying technology stack...', 80],
    ['Enrichment complete!', 100],
  ] as [string, number][]

  for (const [step, progress] of steps) {
    onProgress?.(step, progress)
    await sleep(300 + Math.random() * 200)
  }

  return {
    employees: Math.floor(Math.random() * 900) + 50,
    funding: ['Bootstrapped', 'Seed — $1M', 'Series A — $5M', 'Series B — $22M', 'Series C — $48M'][Math.floor(Math.random() * 5)],
    hiringStatus: ['Actively Hiring', 'Selective Hiring', 'Not Hiring'][Math.floor(Math.random() * 3)],
    techStack: ['Salesforce', 'HubSpot', 'AWS', 'Python', 'React', 'Kubernetes'].slice(0, Math.floor(Math.random() * 4) + 2),
    competitors: [`${lead.company ?? 'Company'} Competitor A`, `${lead.company ?? 'Company'} Competitor B`],
    revenue: ['<$1M', '$1-5M', '$5-20M', '$20-50M', '$50M+'][Math.floor(Math.random() * 5)],
    linkedinFollowers: Math.floor(Math.random() * 10000) + 500,
  }
}

// ============================================================
// Intent Score Calculation
// ============================================================
export async function calculateIntentScore(
  requirementText: string,
  onProgress?: ProgressCallback
): Promise<{ score: number; intent: IntentLevel; signals: string[] }> {
  const steps = [
    ['Analyzing requirement text...', 25],
    ['Extracting urgency indicators...', 50],
    ['Evaluating buying signals...', 75],
    ['Computing intent score...', 100],
  ] as [string, number][]

  for (const [step, progress] of steps) {
    onProgress?.(step, progress)
    await sleep(250)
  }

  const highSignals = ['immediate', 'urgent', 'asap', 'q4', 'budget allocated', 'project started', 'looking for', 'need', 'hire', 'implement']
  const text = requirementText.toLowerCase()
  const matched = highSignals.filter(s => text.includes(s))
  const score = Math.min(99, 55 + matched.length * 6 + Math.floor(Math.random() * 15))
  const intent: IntentLevel = score >= 80 ? 'HIGH' : score >= 65 ? 'MEDIUM' : 'LOW'

  return {
    score,
    intent,
    signals: matched.map(s => `"${s}" detected in requirement text`),
  }
}

// ============================================================
// Lead Qualification
// ============================================================
export async function qualifyLead(
  lead: Partial<Lead>,
  onProgress?: ProgressCallback
): Promise<QualificationResult> {
  const steps = [
    ['AI Analysis: Loading requirement context...', 10],
    ['Extracting intent signals...', 25],
    ['Evaluating company fit...', 40],
    ['Assessing budget indicators...', 55],
    ['Checking decision-maker authority...', 70],
    ['Generating BANT qualification score...', 85],
    ['Generating recommendation...', 95],
    ['Qualification complete!', 100],
  ] as [string, number][]

  for (const [step, progress] of steps) {
    onProgress?.(step, progress)
    await sleep(300 + Math.random() * 200)
  }

  const base = lead.intentScore ?? 75
  const needClarity   = Math.min(99, base + Math.floor(Math.random() * 10) - 3)
  const urgency       = Math.min(99, base + Math.floor(Math.random() * 10) - 5)
  const budgetScore   = Math.min(99, base + Math.floor(Math.random() * 15) - 10)
  const authorityScore = Math.min(99, base + Math.floor(Math.random() * 8) - 2)
  const fitScore      = Math.min(99, base + Math.floor(Math.random() * 6))
  const score = Math.round((needClarity + urgency + budgetScore + authorityScore + fitScore) / 5)

  const verdict = score >= 85 ? 'QUALIFIED' : score >= 72 ? 'LIKELY' : score >= 58 ? 'NEEDS_REVIEW' : 'NOT_QUALIFIED'

  return {
    verdict,
    score,
    needClarity,
    urgency,
    budgetScore,
    authorityScore,
    fitScore,
    reasoning: `${lead.name ?? 'Prospect'} shows ${verdict === 'QUALIFIED' ? 'strong' : verdict === 'LIKELY' ? 'moderate' : 'weak'} purchase intent. ${lead.decisionMaker ? 'Contact is a confirmed decision maker.' : 'May need to engage senior stakeholder.'} ${budgetScore >= 80 ? 'Budget signals are clear and confirmed.' : 'Budget needs further validation.'} Company profile aligns ${fitScore >= 80 ? 'strongly' : 'moderately'} with our ICP.`,
    recommendations: [
      score >= 85 ? 'Schedule executive demo immediately' : score >= 72 ? 'Send personalized proposal' : 'Nurture with case studies',
      lead.decisionMaker ? 'Proceed directly to technical discussion' : 'Request introduction to final decision maker',
      `Follow up within ${score >= 85 ? '24' : score >= 72 ? '48' : '72'} hours`,
    ],
  }
}

// ============================================================
// Call Summary Generation
// ============================================================
export async function generateCallSummary(
  transcriptText: string,
  onProgress?: ProgressCallback
): Promise<CallSummaryResult> {
  const steps = [
    ['Transcribing audio...', 20],
    ['Analyzing conversation sentiment...', 45],
    ['Extracting key buying signals...', 65],
    ['Identifying objections...', 80],
    ['Generating call summary...', 100],
  ] as [string, number][]

  for (const [step, progress] of steps) {
    onProgress?.(step, progress)
    await sleep(350)
  }

  const positive = transcriptText.toLowerCase().includes('interested') || transcriptText.toLowerCase().includes('great') || transcriptText.toLowerCase().includes('meeting')
  return {
    summary: positive
      ? 'Prospect showed genuine interest. Budget confirmed. Meeting requested for technical deep-dive.'
      : 'Initial discovery call completed. Prospect requested follow-up materials. No immediate commitment.',
    sentiment: positive ? 'POSITIVE' : 'NEUTRAL',
    intent: positive ? 'HIGH' : 'MEDIUM',
    buyingSignals: positive ? ['Confirmed budget availability', 'Requested meeting', 'Active project timeline'] : ['Open to follow-up'],
    objections: ['Integration complexity needs clarification', 'Pricing model needs review'],
    nextBestAction: positive ? 'Schedule technical discovery call within 24 hours.' : 'Send case study and follow up in 3 days.',
  }
}

// ============================================================
// Next Best Action
// ============================================================
export async function generateNextBestAction(
  lead: Partial<Lead>
): Promise<string> {
  await sleep(500)
  const score = lead.intentScore ?? 70
  if (score >= 90) return 'Call immediately — highest priority prospect. Budget confirmed, timeline is Q4.'
  if (score >= 80) return 'Send personalized demo video followed by a call within 48 hours.'
  if (score >= 70) return 'Add to nurture sequence. Send 3 case studies over 2 weeks, then call.'
  return 'Low priority. Add to monthly newsletter. Re-evaluate in 30 days.'
}

// ============================================================
// Market Signal Analysis
// ============================================================
export async function analyzeMarketSignal(
  industry: string,
  signal: string,
  onProgress?: ProgressCallback
): Promise<MarketSignalResult> {
  const steps = [
    ['Scanning public market data...', 30],
    ['Cross-referencing with lead database...', 60],
    ['Generating market insights...', 90],
    ['Complete!', 100],
  ] as [string, number][]

  for (const [step, progress] of steps) {
    onProgress?.(step, progress)
    await sleep(300)
  }

  return {
    signal,
    industry,
    impact: Math.random() > 0.6 ? 'HIGH' : Math.random() > 0.3 ? 'MEDIUM' : 'LOW',
    confidence: Math.floor(Math.random() * 25) + 72,
    actionableLeads: Math.floor(Math.random() * 15) + 3,
  }
}
