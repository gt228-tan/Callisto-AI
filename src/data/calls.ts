export type CallOutcome = 'ANSWERED' | 'VOICEMAIL' | 'NO_ANSWER' | 'CALLBACK' | 'QUALIFIED' | 'NOT_INTERESTED' | 'MEETING_BOOKED' | 'CALL_BACK'
export type CallSentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'

export interface CallTranscriptLine {
  speaker: 'AI' | 'PROSPECT'
  text: string
  timestamp: string
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
}

export interface Call {
  id: string
  timestamp: Date
  prospect: string
  company: string
  agent: string
  campaignId: string
  duration: number // seconds
  outcome: CallOutcome
  sentiment: CallSentiment
  intent: 'HIGH' | 'MEDIUM' | 'LOW'
  qualification: 'QUALIFIED' | 'LIKELY' | 'NEEDS_REVIEW' | 'NOT_QUALIFIED'
  recording: boolean
  transcript: CallTranscriptLine[]
  summary: string
  nextBestAction: string
  buyingSignals: string[]
  objections: string[]
}

const now = new Date()
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000)
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000)

export const calls: Call[] = [
  {
    id: 'CALL001',
    timestamp: hoursAgo(1),
    prospect: 'Rahul Mehta',
    company: 'Acme Digital Solutions',
    agent: 'Aria (Enterprise)',
    campaignId: 'C001',
    duration: 284,
    outcome: 'MEETING_BOOKED',
    sentiment: 'POSITIVE',
    intent: 'HIGH',
    qualification: 'QUALIFIED',
    recording: true,
    summary: 'Rahul confirmed active AI project with Q4 timeline. Budget is allocated. Requested technical discussion with their CTO. Meeting booked for next Tuesday at 11 AM IST.',
    nextBestAction: 'Prepare technical presentation for CTO meeting. Include Salesforce integration architecture and ROI calculator.',
    buyingSignals: ['Active project timeline confirmed', 'Budget already allocated', 'Decision maker on the call', 'Requested technical meeting'],
    objections: ['Concerned about integration timeline', 'Wants to see Salesforce connector demo first'],
    transcript: [
      { speaker: 'AI', text: 'Hello, am I speaking with Rahul Mehta?', timestamp: '00:00:03' },
      { speaker: 'PROSPECT', text: 'Yes, this is Rahul. Who is this?', timestamp: '00:00:07', sentiment: 'NEUTRAL' },
      { speaker: 'AI', text: 'Hi Rahul, I\'m Aria calling from NexusAI Solutions. I noticed your LinkedIn post about implementing an AI customer support solution — we specialize in exactly that. Do you have 3 minutes?', timestamp: '00:00:12' },
      { speaker: 'PROSPECT', text: 'Oh yes, I remember posting that. Sure, go ahead, I have a few minutes.', timestamp: '00:00:28', sentiment: 'POSITIVE' },
      { speaker: 'AI', text: 'Thank you! Could you tell me more about your current timeline? You mentioned a Q4 kickoff — is that still the plan?', timestamp: '00:00:35' },
      { speaker: 'PROSPECT', text: 'Yes, exactly. We need to get this implemented by end of November. We\'ve already allocated the budget, about 18 lakhs for this quarter.', timestamp: '00:00:48', sentiment: 'POSITIVE' },
      { speaker: 'AI', text: 'That\'s perfect timing. We\'ve implemented similar solutions for 3 IT services companies in Bangalore in the past 6 months. Do you use Salesforce as your CRM?', timestamp: '00:01:05' },
      { speaker: 'PROSPECT', text: 'Yes we do! That\'s actually one of my concerns — can your system integrate seamlessly with Salesforce?', timestamp: '00:01:18', sentiment: 'NEUTRAL' },
      { speaker: 'AI', text: 'Absolutely — we have a native Salesforce connector that syncs in real-time. No custom development needed. Our last client was live in 3 weeks. I\'d love to connect you with our technical team for a deeper dive. Would next Tuesday at 11 AM work?', timestamp: '00:01:32' },
      { speaker: 'PROSPECT', text: 'Tuesday at 11 works great. Please include our CTO, Vikram, in the invite as well.', timestamp: '00:01:52', sentiment: 'POSITIVE' },
      { speaker: 'AI', text: 'Wonderful! I\'ll send a calendar invite for Tuesday, 9 September at 11 AM IST including Vikram. Is there anything specific you\'d like us to cover in the technical session?', timestamp: '00:02:02' },
      { speaker: 'PROSPECT', text: 'Yes, please show us the Salesforce integration and also how the voice AI handles complex customer queries. Our support team deals with very specific SharePoint-related issues.', timestamp: '00:02:22', sentiment: 'POSITIVE' },
      { speaker: 'AI', text: 'Noted! We\'ll prepare a tailored demo including Salesforce integration and SharePoint-specific scenario handling. Looking forward to Tuesday. Thanks for your time, Rahul!', timestamp: '00:02:45' },
      { speaker: 'PROSPECT', text: 'Thanks Aria, see you Tuesday!', timestamp: '00:02:58', sentiment: 'POSITIVE' },
    ],
  },
  {
    id: 'CALL002',
    timestamp: hoursAgo(2),
    prospect: 'Sarah Johnson',
    company: 'NexaFinance Corp',
    agent: 'Aria (Enterprise)',
    campaignId: 'C001',
    duration: 198,
    outcome: 'QUALIFIED',
    sentiment: 'POSITIVE',
    intent: 'HIGH',
    qualification: 'QUALIFIED',
    recording: true,
    summary: 'Sarah confirmed need for AI sales automation for SDR scaling. HubSpot integration is critical. Requested proposal with FinTech case studies.',
    nextBestAction: 'Send detailed proposal with FinTech industry case studies and HubSpot integration architecture within 24 hours.',
    buyingSignals: ['Confirmed SDR scaling initiative', 'Clear 6-week timeline', 'Budget pre-approved by CFO'],
    objections: ['Needs FinTech-specific compliance documentation', 'Wants to see HubSpot native sync in action'],
    transcript: [
      { speaker: 'AI', text: 'Hi Sarah, this is Aria from NexusAI. I saw your LinkedIn post about scaling your SDR team from 20 to 50. Congratulations on the growth! Do you have 3 minutes?', timestamp: '00:00:05' },
      { speaker: 'PROSPECT', text: 'Yes, thanks! We\'re actually in the middle of evaluating tools for exactly that.', timestamp: '00:00:22', sentiment: 'POSITIVE' },
      { speaker: 'AI', text: 'Perfect timing then. Our platform automates lead qualification for exactly this SDR scaling scenario — we can help qualify 10x more leads without adding headcount. What CRM are you on?', timestamp: '00:00:32' },
      { speaker: 'PROSPECT', text: 'HubSpot, primarily. That\'s non-negotiable for us.', timestamp: '00:00:48', sentiment: 'NEUTRAL' },
      { speaker: 'AI', text: 'No problem at all — HubSpot is our strongest integration. Real-time bidirectional sync, deal stage automation, the works. Given your 6-week timeline, when would you want to start the evaluation?', timestamp: '00:00:56' },
      { speaker: 'PROSPECT', text: 'This week if possible. Can you send me a proposal with some FinTech client case studies?', timestamp: '00:01:15', sentiment: 'POSITIVE' },
      { speaker: 'AI', text: 'Absolutely! I\'ll have our team send you a detailed proposal with 3 FinTech case studies by end of day. Is sarah.johnson@nexafinance the best email?', timestamp: '00:01:28' },
      { speaker: 'PROSPECT', text: 'Yes, that\'s perfect.', timestamp: '00:01:40', sentiment: 'POSITIVE' },
    ],
  },
  {
    id: 'CALL003',
    timestamp: hoursAgo(3),
    prospect: 'Vikas Malhotra',
    company: 'IndiaFirst Telecom',
    agent: 'Aria (Enterprise)',
    campaignId: 'C001',
    duration: 156,
    outcome: 'CALLBACK',
    sentiment: 'NEUTRAL',
    intent: 'HIGH',
    qualification: 'LIKELY',
    recording: true,
    summary: 'Vikas was in a meeting but expressed interest. Requested callback tomorrow at 3 PM. Confirmed 50K subscriber churn reduction initiative.',
    nextBestAction: 'Call back tomorrow at 3 PM IST. Prepare churn reduction ROI presentation for telecom sector.',
    buyingSignals: ['Confirmed churn reduction initiative', 'Requested callback (positive signal)', '50K subscriber base means large deal value'],
    objections: ['Timing was not right', 'Needs to consult IT team on BSS integration'],
    transcript: [
      { speaker: 'AI', text: 'Hello, may I speak with Vikas Malhotra?', timestamp: '00:00:04' },
      { speaker: 'PROSPECT', text: 'Yes, this is Vikas. Can I ask who\'s calling?', timestamp: '00:00:09', sentiment: 'NEUTRAL' },
      { speaker: 'AI', text: 'Hi Vikas, I\'m Aria from NexusAI. We help telecom companies reduce subscriber churn using AI-powered proactive calling. Do you have 2 minutes?', timestamp: '00:00:17' },
      { speaker: 'PROSPECT', text: 'Look, I\'m actually in a meeting right now. Can you call me back tomorrow?', timestamp: '00:00:31', sentiment: 'NEUTRAL' },
      { speaker: 'AI', text: 'Of course! Would 3 PM IST tomorrow work? And just to confirm — are you working on a churn reduction initiative currently?', timestamp: '00:00:40' },
      { speaker: 'PROSPECT', text: 'Yes actually. We have a 50K subscriber renewal issue we\'re trying to address. Call me tomorrow at 3.', timestamp: '00:00:52', sentiment: 'POSITIVE' },
      { speaker: 'AI', text: 'Perfect! I\'ll call you tomorrow at 3 PM IST. I\'ll prepare a telecom-specific churn reduction presentation. Have a great meeting!', timestamp: '00:01:05' },
    ],
  },
  {
    id: 'CALL004',
    timestamp: hoursAgo(4),
    prospect: 'Priya Sharma',
    company: 'TechVenture Labs',
    agent: 'Sam (SMB)',
    campaignId: 'C002',
    duration: 87,
    outcome: 'NOT_INTERESTED',
    sentiment: 'NEGATIVE',
    intent: 'LOW',
    qualification: 'NOT_QUALIFIED',
    recording: false,
    summary: 'Prospect indicated they are not the decision maker and their company has already committed to a competitor solution. Requested removal from calling list.',
    nextBestAction: 'Mark as NOT_QUALIFIED. Remove from campaign. Note competitor: Clearbit. Re-evaluate in 6 months.',
    buyingSignals: [],
    objections: ['Already committed to competitor (Clearbit)', 'Not the decision maker', 'Requested DNC'],
    transcript: [
      { speaker: 'AI', text: 'Hi, is this Priya Sharma from TechVenture Labs?', timestamp: '00:00:04' },
      { speaker: 'PROSPECT', text: 'Yes, but I\'m not really the right person for this. We\'ve already decided to go with another vendor.', timestamp: '00:00:10', sentiment: 'NEGATIVE' },
      { speaker: 'AI', text: 'I understand. Just out of curiosity, which solution are you going with, if I may ask?', timestamp: '00:00:21' },
      { speaker: 'PROSPECT', text: 'Clearbit. Please don\'t call again, thanks.', timestamp: '00:00:28', sentiment: 'NEGATIVE' },
      { speaker: 'AI', text: 'Of course, I\'ll remove your number right away. Thank you for your time, Priya.', timestamp: '00:00:33' },
    ],
  },
  {
    id: 'CALL005',
    timestamp: hoursAgo(5),
    prospect: 'Kavitha Reddy',
    company: 'Bharat Insurance Group',
    agent: 'Aria (Enterprise)',
    campaignId: 'C001',
    duration: 312,
    outcome: 'MEETING_BOOKED',
    sentiment: 'POSITIVE',
    intent: 'HIGH',
    qualification: 'QUALIFIED',
    recording: true,
    summary: 'Enterprise deal with 200K renewal calls/year. Kavitha is enthusiastic. Meeting booked with CTO and procurement team. RFP response requested.',
    nextBestAction: 'Prepare formal RFP response. Involve legal and compliance teams. Schedule enterprise demo with CTO.',
    buyingSignals: ['200K call volume confirmed', 'Budget available through existing vendor swap', 'Interested in Telugu voice capability', 'Requested RFP response'],
    objections: ['Need to involve procurement for enterprise deal', 'Formal RFP process required', 'IRDAI compliance documentation needed'],
    transcript: [
      { speaker: 'AI', text: 'Good morning, is this Kavitha Reddy from Bharat Insurance Group?', timestamp: '00:00:04' },
      { speaker: 'PROSPECT', text: 'Yes, who am I speaking with?', timestamp: '00:00:10', sentiment: 'NEUTRAL' },
      { speaker: 'AI', text: 'Hi Kavitha, I\'m Aria from NexusAI Solutions. We\'ve been working with several insurance companies on AI-powered policy renewal calls — I understand Bharat Insurance has about 200,000 renewals annually?', timestamp: '00:00:18' },
      { speaker: 'PROSPECT', text: 'Yes, that\'s right. We currently have a call center of 45 agents handling renewals. Are you saying AI can replace that?', timestamp: '00:00:38', sentiment: 'NEUTRAL' },
      { speaker: 'AI', text: 'Not replace — augment. Our AI handles routine renewal reminders and initial qualification, so your agents focus only on complex cases. We\'ve helped an insurance company reduce renewal call costs by 62% while maintaining a 94% customer satisfaction score. Do you handle Telugu and Hindi-speaking policyholders?', timestamp: '00:00:55' },
      { speaker: 'PROSPECT', text: 'Yes! Telugu is huge for us — Andhra and Telangana are our biggest markets. Does your AI speak Telugu?', timestamp: '00:01:22', sentiment: 'POSITIVE' },
      { speaker: 'AI', text: 'Yes — native Telugu voice with natural-sounding pronunciation. I can actually play you a 30-second demo right now if you\'d like?', timestamp: '00:01:35' },
      { speaker: 'PROSPECT', text: 'Please do!', timestamp: '00:01:45', sentiment: 'POSITIVE' },
      { speaker: 'AI', text: '[Demo plays] ...That\'s a sample of our Telugu renewal reminder. We can customize the script entirely. What do you think?', timestamp: '00:02:10' },
      { speaker: 'PROSPECT', text: 'Honestly, that\'s impressive. I\'d like to show this to our CTO and procurement team. Can you send an RFP format document? We have a formal process.', timestamp: '00:02:28', sentiment: 'POSITIVE' },
      { speaker: 'AI', text: 'Absolutely. I\'ll send our enterprise package documentation and RFP template today. Can we schedule a formal demo with your team next week?', timestamp: '00:02:45' },
      { speaker: 'PROSPECT', text: 'Thursday at 2 PM works. Include our CTO Suresh and our procurement head Anita in the invite.', timestamp: '00:02:58', sentiment: 'POSITIVE' },
    ],
  },
  ...Array.from({ length: 44 }, (_, i) => {
    const outcomes: CallOutcome[] = ['ANSWERED','VOICEMAIL','NO_ANSWER','CALLBACK','QUALIFIED','NOT_INTERESTED','MEETING_BOOKED']
    const sentiments: CallSentiment[] = ['POSITIVE','NEUTRAL','NEGATIVE']
    const qualifications = ['QUALIFIED','LIKELY','NEEDS_REVIEW','NOT_QUALIFIED'] as const
    const prospects = ['Ankit Patel','James Williams','Chen Wei','Thomas Baker','Oliver Schmidt','Marcus Johnson','Emily Watson','David Park','Harpreet Singh','Deepa Krishnamurthy']
    const companies = ['HealthSync AI','Apex Marketing','Pacific Rim','LegalTech UK','Deutech Mfg','Vertex Solutions','GrowthMetrics','KoreaTech','AutoDrive Motors','RetailEdge Tech']
    const idx = i + 6
    const outcome = outcomes[i % 7]
    const sentiment = outcome === 'NOT_INTERESTED' || outcome === 'NO_ANSWER' ? 'NEGATIVE' : outcome === 'MEETING_BOOKED' || outcome === 'QUALIFIED' ? 'POSITIVE' : 'NEUTRAL'
    const qualification = outcome === 'MEETING_BOOKED' || outcome === 'QUALIFIED' ? 'QUALIFIED' : outcome === 'NOT_INTERESTED' ? 'NOT_QUALIFIED' : outcome === 'CALLBACK' ? 'LIKELY' : 'NEEDS_REVIEW'
    return {
      id: `CALL00${idx}`,
      timestamp: new Date(now.getTime() - (i * 3_600_000 + Math.random() * 1_800_000)),
      prospect: prospects[i % 10],
      company: companies[i % 10],
      agent: ['Aria (Enterprise)','Sam (SMB)','Priya (Hindi)','Kavitha (Tamil)'][i % 4],
      campaignId: ['C001','C002','C003'][i % 3],
      duration: Math.floor(Math.random() * 300) + 30,
      outcome,
      sentiment: sentiments.find(s => s === sentiment) ?? 'NEUTRAL',
      intent: ['HIGH','MEDIUM','LOW'][i % 3] as 'HIGH'|'MEDIUM'|'LOW',
      qualification,
      recording: i % 3 !== 0,
      summary: `Call with ${prospects[i % 10]} from ${companies[i % 10]}. Outcome: ${outcome}. ${outcome === 'MEETING_BOOKED' ? 'Meeting scheduled for next week.' : outcome === 'VOICEMAIL' ? 'Left voicemail with callback number.' : outcome === 'NO_ANSWER' ? 'No answer. Retry scheduled.' : 'Follow-up action assigned.'}`,
      nextBestAction: ['Schedule demo call','Send proposal email','Retry in 24 hours','Update CRM record','Connect with decision maker'][i % 5],
      buyingSignals: outcome === 'QUALIFIED' || outcome === 'MEETING_BOOKED' ? ['Confirmed budget', 'Active project timeline', 'Decision maker engaged'] : [],
      objections: outcome === 'NOT_INTERESTED' ? ['Already with competitor', 'No budget currently'] : [],
      transcript: [
        { speaker: 'AI' as const, text: `Hello, is this ${prospects[i % 10]}?`, timestamp: '00:00:04' },
        { speaker: 'PROSPECT' as const, text: 'Yes, who is calling?', timestamp: '00:00:10', sentiment: 'NEUTRAL' as const },
        { speaker: 'AI' as const, text: `Hi! I'm calling from NexusAI Solutions about our AI sales automation platform.`, timestamp: '00:00:16' },
      ],
    } as Call
  })
]

export const getCallById = (id: string) => calls.find(c => c.id === id)
export const getRecentCalls = (limit = 20) => [...calls].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit)
export const getCallsByCampaign = (campaignId: string) => calls.filter(c => c.campaignId === campaignId)
