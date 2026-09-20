export type CampaignStatus = 'ACTIVE' | 'SCHEDULED' | 'PAUSED' | 'COMPLETED' | 'DRAFT'

export interface Campaign {
  id: string
  name: string
  target: string
  agent: string
  status: CampaignStatus
  language: string
  voice: string
  tone: string
  leads: number
  calls: number
  answered: number
  qualified: number
  meetings: number
  conversion: number
  createdAt: Date
  scheduledAt: Date | null
  completedAt: Date | null
  objective: string
  greeting: string
  maxRetries: number
  retryInterval: string
}

const now = new Date()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000)
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86_400_000)

export const campaigns: Campaign[] = [
  {
    id: 'C001',
    name: 'Q4 Enterprise AI Solutions',
    target: 'Enterprise IT Leads',
    agent: 'Aria (Enterprise)',
    status: 'ACTIVE',
    language: 'English',
    voice: 'Professional Female',
    tone: 'Consultative',
    leads: 285,
    calls: 241,
    answered: 156,
    qualified: 48,
    meetings: 19,
    conversion: 12.2,
    createdAt: daysAgo(14),
    scheduledAt: daysAgo(12),
    completedAt: null,
    objective: 'Qualify enterprise leads for AI implementation services, identify key decision makers, and schedule technical discussions.',
    greeting: 'Hello, I\'m Aria calling from Callisto AI Solutions. Is this a good time for a quick 3-minute conversation about how we\'re helping IT leaders automate their sales pipeline?',
    maxRetries: 3,
    retryInterval: '24 hours',
  },
  {
    id: 'C002',
    name: 'SMB SaaS Lead Nurture',
    target: 'SMB SaaS Prospects',
    agent: 'Sam (SMB)',
    status: 'ACTIVE',
    language: 'English',
    voice: 'Professional Male',
    tone: 'Friendly',
    leads: 520,
    calls: 388,
    answered: 201,
    qualified: 67,
    meetings: 28,
    conversion: 14.0,
    createdAt: daysAgo(21),
    scheduledAt: daysAgo(19),
    completedAt: null,
    objective: 'Qualify SMB SaaS companies for our growth package, identify pain points around lead qualification, and offer free trial.',
    greeting: 'Hi, this is Sam! I\'m reaching out because your company recently showed interest in AI-powered sales tools. Do you have 3 minutes to learn about how we\'ve helped 200+ SaaS companies increase their qualified pipeline by 40%?',
    maxRetries: 2,
    retryInterval: '48 hours',
  },
  {
    id: 'C003',
    name: 'India Vernacular Expansion',
    target: 'Hindi/Regional Language Prospects',
    agent: 'Priya (Hindi)',
    status: 'ACTIVE',
    language: 'Hindi',
    voice: 'Native Hindi Female',
    tone: 'Professional',
    leads: 340,
    calls: 298,
    answered: 187,
    qualified: 71,
    meetings: 24,
    conversion: 12.8,
    createdAt: daysAgo(10),
    scheduledAt: daysAgo(8),
    completedAt: null,
    objective: 'Engage Hindi-speaking business owners with AI voice automation solutions. Focus on cost savings vs. manual calling teams.',
    greeting: 'नमस्ते, मैं प्रिया हूं, Callisto AI Solutions से। क्या मैं आपसे 3 मिनट के लिए बात कर सकती हूं?',
    maxRetries: 3,
    retryInterval: '24 hours',
  },
  {
    id: 'C004',
    name: 'BFSI Compliance Outreach',
    target: 'Banking & Financial Services',
    agent: 'Aria (Compliance)',
    status: 'SCHEDULED',
    language: 'English / Hindi',
    voice: 'Professional Female',
    tone: 'Formal',
    leads: 150,
    calls: 0,
    answered: 0,
    qualified: 0,
    meetings: 0,
    conversion: 0,
    createdAt: daysAgo(3),
    scheduledAt: daysFromNow(2),
    completedAt: null,
    objective: 'Target BFSI decision makers with our compliance-ready AI voice solution. Focus on RBI/SEBI compliance documentation.',
    greeting: 'Good morning, I\'m calling from Callisto AI Solutions. Our enterprise AI voice platform is SEBI and RBI compliant and is currently being used by 3 NBFCs and 2 insurance companies for automated client outreach.',
    maxRetries: 2,
    retryInterval: '48 hours',
  },
  {
    id: 'C005',
    name: 'UAE & GCC Market Pilot',
    target: 'GCC Enterprise Leads',
    agent: 'Ahmad (Arabic)',
    status: 'SCHEDULED',
    language: 'Arabic / English',
    voice: 'Native Arabic Male',
    tone: 'Professional',
    leads: 85,
    calls: 0,
    answered: 0,
    qualified: 0,
    meetings: 0,
    conversion: 0,
    createdAt: daysAgo(2),
    scheduledAt: daysFromNow(5),
    completedAt: null,
    objective: 'Launch GCC market with Arabic-language AI voice demos. Target CDOs and CTOs at UAE/Saudi enterprise accounts.',
    greeting: 'مرحباً، معك أحمد من شركة نيكسس AI. هل تتوفر لديك ثلاث دقائق للحديث عن كيفية تحسين مبيعاتكم؟',
    maxRetries: 3,
    retryInterval: '72 hours',
  },
  {
    id: 'C006',
    name: 'RetailTech South India',
    target: 'Tamil/Kannada Retail Leads',
    agent: 'Kavitha (Tamil)',
    status: 'PAUSED',
    language: 'Tamil / English',
    voice: 'Native Tamil Female',
    tone: 'Friendly',
    leads: 210,
    calls: 145,
    answered: 89,
    qualified: 31,
    meetings: 11,
    conversion: 12.4,
    createdAt: daysAgo(18),
    scheduledAt: daysAgo(16),
    completedAt: null,
    objective: 'Target South India retail and e-commerce companies with Tamil-language AI voice automation for customer outreach.',
    greeting: 'வணக்கம், நான் கவிதா, Callisto AI Solutions-இலிருந்து பேசுகிறேன். உங்கள் வணிகத்திற்கு AI தொலைபேசி தீர்வு பற்றி பேசலாமா?',
    maxRetries: 2,
    retryInterval: '24 hours',
  },
  {
    id: 'C007',
    name: 'EduTech Campus Admissions',
    target: 'EdTech & Education Leads',
    agent: 'Riya (EdTech)',
    status: 'COMPLETED',
    language: 'Hindi / English',
    voice: 'Youthful Female',
    tone: 'Energetic',
    leads: 420,
    calls: 420,
    answered: 298,
    qualified: 89,
    meetings: 37,
    conversion: 12.4,
    createdAt: daysAgo(45),
    scheduledAt: daysAgo(43),
    completedAt: daysAgo(15),
    objective: 'Target EdTech companies for AI-powered student admission follow-up and counseling call automation.',
    greeting: 'Hi! I\'m Riya from Callisto AI. Quick question — are you still manually calling thousands of student leads during admission season?',
    maxRetries: 2,
    retryInterval: '24 hours',
  },
  {
    id: 'C008',
    name: 'UK & Europe B2B Expansion',
    target: 'UK/EU Enterprise Prospects',
    agent: 'Charlie (UK)',
    status: 'COMPLETED',
    language: 'English',
    voice: 'British Male',
    tone: 'Professional',
    leads: 180,
    calls: 180,
    answered: 112,
    qualified: 38,
    meetings: 14,
    conversion: 12.5,
    createdAt: daysAgo(60),
    scheduledAt: daysAgo(58),
    completedAt: daysAgo(30),
    objective: 'Qualify UK and European enterprise leads for our GDPR-compliant AI sales automation platform.',
    greeting: 'Good morning, this is Charlie from Callisto AI. We\'ve recently helped three UK-based SaaS companies double their qualified leads through AI voice automation. Do you have a few minutes?',
    maxRetries: 3,
    retryInterval: '48 hours',
  },
]

export const getCampaignById = (id: string) => campaigns.find(c => c.id === id)
export const getActiveCampaigns = () => campaigns.filter(c => c.status === 'ACTIVE')
