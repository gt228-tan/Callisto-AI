export interface MarketSignal {
  id: string
  type: 'HIGH_SIGNAL' | 'RISING' | 'OPPORTUNITY' | 'ALERT' | 'TRENDING'
  title: string
  description: string
  industry: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  count?: number
  change?: number
  timestamp: Date
  tags: string[]
}

export interface IndustryTrend {
  industry: string
  demandIndex: number
  change: number
  hiringScore: number
  fundingScore: number
}

export interface HiringTrend {
  month: string
  aiEngineers: number
  salesOps: number
  dataScientists: number
}

export interface FundingData {
  month: string
  seedAmount: number
  seriesAAmount: number
  seriesBAmount: number
}

const now = new Date()
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000)
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000)

export const marketSignals: MarketSignal[] = [
  {
    id: 'MS001',
    type: 'HIGH_SIGNAL',
    title: 'AI Implementation Surge in FinTech',
    description: '18 FinTech companies in Mumbai and Bengaluru are actively posting AI/ML engineering roles, indicating imminent AI project kickoffs. Average team size being hired: 6-8 engineers.',
    industry: 'FinTech',
    impact: 'HIGH',
    count: 18,
    change: 34,
    timestamp: hoursAgo(2),
    tags: ['AI', 'FinTech', 'Hiring', 'Mumbai', 'Bengaluru'],
  },
  {
    id: 'MS002',
    type: 'RISING',
    title: 'Salesforce Integration Demand +28%',
    description: 'Demand for Salesforce CRM integration in AI tools has increased by 28% this month. Top verticals: FinTech, BFSI, and SaaS. Indication of enterprise procurement cycles starting.',
    industry: 'CRM',
    impact: 'HIGH',
    change: 28,
    timestamp: hoursAgo(4),
    tags: ['Salesforce', 'CRM', 'Integration', 'Enterprise'],
  },
  {
    id: 'MS003',
    type: 'OPPORTUNITY',
    title: '42 Companies Matching Service Profile',
    description: '42 companies across India, UAE, and UK posted requirements matching our AI voice agent and sales automation services. Estimated total contract value: ₹18-24 crore.',
    industry: 'Multiple',
    impact: 'HIGH',
    count: 42,
    timestamp: hoursAgo(1),
    tags: ['Voice AI', 'Sales Automation', 'India', 'UAE', 'UK'],
  },
  {
    id: 'MS004',
    type: 'TRENDING',
    title: 'Hindi Voice AI — 3x Search Volume Spike',
    description: 'Search volume for "Hindi voice AI" and "vernacular AI calling" has spiked 3x in the past 14 days. Top searchers: NBFCs, insurance companies, and retail chains in Tier-2 cities.',
    industry: 'AI Voice',
    impact: 'HIGH',
    change: 200,
    timestamp: hoursAgo(6),
    tags: ['Hindi', 'Voice AI', 'NBFC', 'Tier-2'],
  },
  {
    id: 'MS005',
    type: 'HIGH_SIGNAL',
    title: 'UAE Enterprise AI Budget Cycle Opens',
    description: 'UAE government-linked entities and private enterprises typically open Q1 2027 technology budgets in September. 12 identified targets in our pipeline.',
    industry: 'Technology',
    impact: 'HIGH',
    count: 12,
    timestamp: daysAgo(1),
    tags: ['UAE', 'Enterprise', 'Budget', 'Q1 2027'],
  },
  {
    id: 'MS006',
    type: 'RISING',
    title: 'BFSI Compliance AI Adoption +41%',
    description: 'AI adoption in BFSI sector for compliance-related use cases has grown 41% year-over-year. Key drivers: RBI digital lending guidelines, SEBI audit trail requirements.',
    industry: 'BFSI',
    impact: 'HIGH',
    change: 41,
    timestamp: daysAgo(1),
    tags: ['BFSI', 'RBI', 'SEBI', 'Compliance', 'AI'],
  },
  {
    id: 'MS007',
    type: 'OPPORTUNITY',
    title: 'EdTech Admission Season — High Outreach Demand',
    description: '28 EdTech companies are preparing for Jan 2027 admission season outreach. AI calling demand for student counseling is at peak. 6-8 week contract window.',
    industry: 'EdTech',
    impact: 'MEDIUM',
    count: 28,
    timestamp: daysAgo(2),
    tags: ['EdTech', 'Admissions', 'Hindi', 'Seasonal'],
  },
  {
    id: 'MS008',
    type: 'ALERT',
    title: 'Competitor Pricing Drop — Respond Required',
    description: 'Key competitor "VoiceFlow AI" has dropped pricing by 20% for SMB tier. 3 of our pipeline prospects have mentioned this. Recommend reviewing SMB pricing strategy.',
    industry: 'AI Voice',
    impact: 'HIGH',
    change: -20,
    timestamp: daysAgo(1),
    tags: ['Competitor', 'Pricing', 'SMB', 'Strategy'],
  },
  {
    id: 'MS009',
    type: 'TRENDING',
    title: 'Tamil Nadu Manufacturing Automation Wave',
    description: 'Tamil Nadu-based manufacturing SMEs are increasingly adopting AI for B2B sales outreach. 15 companies in auto components and textiles identified as high-intent prospects.',
    industry: 'Manufacturing',
    impact: 'MEDIUM',
    count: 15,
    timestamp: daysAgo(2),
    tags: ['Tamil', 'Manufacturing', 'Tamil Nadu', 'B2B'],
  },
  {
    id: 'MS010',
    type: 'RISING',
    title: 'Singapore FinTech Hub — AI Expansion Funding',
    description: 'Singapore MAS sandbox approvals up 22% this quarter. 8 newly funded FinTech companies in Singapore are in expansion mode and match our ICP.',
    industry: 'FinTech',
    impact: 'MEDIUM',
    count: 8,
    change: 22,
    timestamp: daysAgo(3),
    tags: ['Singapore', 'FinTech', 'MAS', 'Funding'],
  },
  {
    id: 'MS011',
    type: 'OPPORTUNITY',
    title: 'UK Election Aftermath — Sales Tech Spend Up',
    description: 'Post-election UK business confidence index at 14-month high. B2B sales tech spend is forecast to grow 18% in Q4. 6 UK enterprise prospects in pipeline are now accelerating decisions.',
    industry: 'Sales Technology',
    impact: 'MEDIUM',
    count: 6,
    change: 18,
    timestamp: daysAgo(3),
    tags: ['UK', 'Enterprise', 'Sales Tech', 'Q4'],
  },
  {
    id: 'MS012',
    type: 'HIGH_SIGNAL',
    title: 'Healthcare AI Voice — HIPAA/DPDPA Compliance Window',
    description: 'India\'s DPDPA enforcement begins January 2027. Healthcare companies are racing to implement compliant AI voice solutions before the deadline. 9 hospitals and clinic chains identified.',
    industry: 'Healthcare',
    impact: 'HIGH',
    count: 9,
    timestamp: daysAgo(2),
    tags: ['Healthcare', 'DPDPA', 'Compliance', 'Deadline'],
  },
]

export const industryTrends: IndustryTrend[] = [
  { industry: 'FinTech',        demandIndex: 91, change: 18,  hiringScore: 88, fundingScore: 85 },
  { industry: 'BFSI',           demandIndex: 87, change: 14,  hiringScore: 72, fundingScore: 78 },
  { industry: 'HealthTech',     demandIndex: 83, change: 22,  hiringScore: 80, fundingScore: 76 },
  { industry: 'EdTech',         demandIndex: 76, change: -5,  hiringScore: 65, fundingScore: 58 },
  { industry: 'Manufacturing',  demandIndex: 72, change: 11,  hiringScore: 68, fundingScore: 62 },
  { industry: 'RetailTech',     demandIndex: 78, change: 16,  hiringScore: 74, fundingScore: 70 },
  { industry: 'SaaS',           demandIndex: 89, change: 9,   hiringScore: 91, fundingScore: 88 },
  { industry: 'CleanTech',      demandIndex: 68, change: 31,  hiringScore: 62, fundingScore: 72 },
  { industry: 'Logistics',      demandIndex: 74, change: 8,   hiringScore: 70, fundingScore: 65 },
  { industry: 'RealEstate',     demandIndex: 70, change: -3,  hiringScore: 58, fundingScore: 55 },
]

export const hiringTrends: HiringTrend[] = [
  { month: 'Mar', aiEngineers: 1200, salesOps: 890, dataScientists: 650 },
  { month: 'Apr', aiEngineers: 1380, salesOps: 920, dataScientists: 710 },
  { month: 'May', aiEngineers: 1520, salesOps: 980, dataScientists: 780 },
  { month: 'Jun', aiEngineers: 1650, salesOps: 1020, dataScientists: 820 },
  { month: 'Jul', aiEngineers: 1890, salesOps: 1150, dataScientists: 910 },
  { month: 'Aug', aiEngineers: 2140, salesOps: 1280, dataScientists: 1020 },
  { month: 'Sep', aiEngineers: 2380, salesOps: 1410, dataScientists: 1140 },
]

export const fundingData: FundingData[] = [
  { month: 'Mar', seedAmount: 42, seriesAAmount: 125, seriesBAmount: 280 },
  { month: 'Apr', seedAmount: 51, seriesAAmount: 148, seriesBAmount: 320 },
  { month: 'May', seedAmount: 48, seriesAAmount: 162, seriesBAmount: 298 },
  { month: 'Jun', seedAmount: 63, seriesAAmount: 187, seriesBAmount: 415 },
  { month: 'Jul', seedAmount: 71, seriesAAmount: 204, seriesBAmount: 380 },
  { month: 'Aug', seedAmount: 58, seriesAAmount: 221, seriesBAmount: 495 },
  { month: 'Sep', seedAmount: 84, seriesAAmount: 248, seriesBAmount: 520 },
]
