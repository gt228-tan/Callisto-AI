You are an expert senior full-stack engineer, product designer, and SaaS architect.

Build a complete, polished, production-style web application called:

"AI Sales Intelligence & Voice Agent Platform"

The application is based on the attached project requirements document. Do NOT make this a simple static landing page. Build an actual interactive SaaS dashboard/prototype with multiple pages, navigation, tables, filters, charts, modals, forms, mock data, state management, and realistic workflows.

==================================================
1. PROJECT OBJECTIVE
==================================================

Build an AI-powered sales automation platform that helps businesses:

1. Discover high-intent prospects from public sources.
2. Enrich prospect and company information.
3. Search, filter, score, segment, and prioritize leads.
4. Perform market intelligence analysis.
5. Create AI voice campaigns.
6. Conduct multilingual AI-powered outbound calls.
7. View call transcripts, summaries, qualification results, and next-best actions.
8. Manage leads through a sales pipeline.
9. Import/export CSV and Excel leads.
10. Integrate with CRM systems.
11. Monitor campaigns and sales performance.
12. Provide an administrator dashboard for users, subscriptions, billing, voice usage, audit logs, fraud detection, and system monitoring.

The product should feel like an enterprise-grade sales intelligence platform rather than a generic CRM.

==================================================
2. IMPORTANT DESIGN DIRECTION
==================================================

The interface should be heavily inspired by the INFORMATION-DENSE, SEARCH-FIRST, ANALYTICS-DASHBOARD EXPERIENCE of Splunk.

IMPORTANT:
- Do NOT copy Splunk logos, trademarks, proprietary assets, or exact branding.
- Do NOT make the application look like a direct clone.
- Use the same general design philosophy:
  - dark enterprise interface
  - dense information layout
  - powerful global search
  - dashboards made of cards/panels
  - event/activity streams
  - filters
  - data tables
  - analytics
  - real-time-looking metrics
  - technical/enterprise aesthetic
  - highly functional UI

Think:

"Splunk-style observability dashboard + modern sales intelligence platform + AI voice agent."

The application should immediately look impressive when opened.

==================================================
3. VISUAL DESIGN
==================================================

Use a dark-first enterprise UI.

Overall:
- Dark charcoal/near-black background.
- Slightly lighter panels/cards.
- High contrast text.
- Subtle borders.
- Compact spacing.
- Professional enterprise typography.
- Small but readable labels.
- Dense dashboards.
- Avoid excessive rounded cards.
- Avoid excessive gradients.
- Avoid generic startup landing-page aesthetics.

Use a restrained accent color system:
- Primary accent: amber/orange inspired by analytics tools.
- Green = successful/qualified/positive.
- Red = failed/negative/high risk.
- Blue = informational/AI/system.
- Yellow/orange = attention/high intent.

The UI should feel:
- Technical
- Intelligent
- Enterprise
- Data-heavy
- Fast
- Professional
- Slightly futuristic

Use icons consistently.

Create:
- collapsible left sidebar
- top global search bar
- breadcrumbs/page title
- user/account area
- notifications
- system status indicator
- responsive layout

==================================================
4. APPLICATION STRUCTURE
==================================================

Create the following main navigation:

DASHBOARD
├── Overview
├── Lead Discovery
├── Leads
├── AI Qualification
├── Campaigns
├── AI Voice Agent
├── Market Intelligence
├── Sales Pipeline
├── Analytics
├── CRM
└── Settings

ADMIN
├── Admin Overview
├── Users
├── Subscriptions
├── Voice Usage
├── Billing
├── Audit Logs
├── Fraud Detection
├── System Monitoring
└── Platform Settings

The sidebar should visually distinguish normal user functionality from administrative functionality.

==================================================
5. MAIN DASHBOARD
==================================================

Build a powerful Splunk-like overview dashboard.

Top section:

"AI Sales Intelligence"

Global search:
[ Search leads, companies, requirements, campaigns, calls... ]

Metric cards:

- Total Leads
- High Intent Leads
- Qualified Leads
- Active Campaigns
- Calls Today
- Meetings Booked
- Conversion Rate
- AI Voice Minutes Used

Use realistic mock values.

Example:

TOTAL LEADS
24,681
+12.8%

HIGH INTENT
3,842
+18.4%

QUALIFIED
1,426
+9.7%

MEETINGS
287
+14.2%

Below the metrics create multiple analytical panels.

Panel 1:
"Lead Discovery Activity"

Interactive time-series chart showing:
- leads discovered
- leads qualified
- leads enriched

Allow:
1H / 6H / 24H / 7D / 30D

Panel 2:
"Lead Sources"

Donut/bar chart showing:
- LinkedIn
- X
- Company Websites
- Public Directories
- Freelance Platforms
- CRM

Panel 3:
"AI Qualification Funnel"

Discovered
↓
Enriched
↓
High Intent
↓
Qualified
↓
Contacted
↓
Meeting
↓
Opportunity

Panel 4:
"Recent High-Intent Opportunities"

Dense table:
- Lead
- Company
- Requirement
- Industry
- Intent Score
- Source
- Discovered
- Status
- Action

Panel 5:
"AI Activity Stream"

Create a real-time-looking event stream:

14:32:11
AI discovered new requirement

14:31:48
Lead enriched

14:30:22
Voice campaign completed

14:29:51
Prospect classified as HIGH INTENT

14:28:07
Meeting booked

This should visually resemble an enterprise event/log stream.

==================================================
6. GLOBAL SEARCH
==================================================

The global search is a major feature.

Make it visually prominent.

Placeholder:

"Search leads, requirements, companies, campaigns, calls..."

When clicked, display a command/search interface.

Support searches such as:

"high intent leads"
"AI startups in Bangalore"
"companies hiring developers"
"requirements from LinkedIn"
"uncontacted leads"
"campaigns with low conversion"
"calls from yesterday"

Show search results in a dense table.

Add filters:
- Source
- Industry
- Location
- Company size
- Intent score
- Lead status
- Date discovered
- Campaign
- Contact availability

==================================================
7. LEAD DISCOVERY PAGE
==================================================

Create a sophisticated Lead Discovery page.

Top:

"AI Lead Discovery"

Search/query builder:

Keywords
Industry
Location
Company Size
Technology
Job Title
Source
Date Range

Sources:

☑ LinkedIn
☑ X
☑ Company Websites
☑ Public Directories
☑ Freelance Platforms
☑ CRM

Button:

"RUN AI DISCOVERY"

When clicked, show a simulated discovery process:

Scanning public sources...
Analyzing requirements...
Extracting prospects...
Enriching companies...
Calculating intent scores...

Then populate the results.

Lead table columns:

☑
Lead Name
Job Title
Company
Industry
Location
Requirement
Intent Score
Source
Email
Phone
LinkedIn
Discovered
Status

Use badges for:
HIGH INTENT
MEDIUM
LOW

Every lead should have an "original requirement" link/source field.

Create a lead detail drawer/modal.

==================================================
8. LEAD DETAIL PAGE / DRAWER
==================================================

When a lead is clicked, open a detailed right-side drawer.

Show:

Lead profile
- Name
- Job title
- Company
- Website
- Email
- Phone
- LinkedIn
- Industry
- Company size

AI Lead Score:
92/100

Intent:
HIGH

AI reasoning:
"Prospect explicitly requested implementation support and mentioned an active project timeline."

Original Requirement:
Show realistic requirement text.

Source:
LinkedIn

Original Post:
"View original post"

Company Intelligence:
- Employees
- Funding
- Hiring status
- Technology stack
- Competitors

AI Recommendations:
- Call immediately
- Mention SharePoint integration experience
- Follow up within 24 hours

Actions:
CALL
ADD TO CAMPAIGN
ADD TO CRM
EXPORT
MARK QUALIFIED

==================================================
9. AI QUALIFICATION
==================================================

Create an AI Qualification page.

Show:
- total analyzed
- qualified
- rejected
- needs review
- average AI score

Create a qualification table.

Columns:
Lead
Company
Requirement
Budget Signal
Timeline
Need
Decision Maker
Intent Score
AI Verdict

AI Verdict:
QUALIFIED
LIKELY
NEEDS REVIEW
NOT QUALIFIED

Clicking a lead should show the AI reasoning.

Create a visual scoring breakdown:

Intent Score: 91

Need clarity      ██████████
Urgency            █████████
Budget signal      ███████
Decision authority █████████
Fit                ██████████

==================================================
10. CAMPAIGNS
==================================================

Create Campaign Management.

Dashboard:

Active Campaigns
Scheduled Calls
Completed Calls
Answered
Qualified
Meetings
Conversion Rate

Campaign table:

Campaign
Target
Agent
Status
Leads
Calls
Answered
Qualified
Meetings
Conversion
Created

Statuses:
ACTIVE
SCHEDULED
PAUSED
COMPLETED

Buttons:
CREATE CAMPAIGN
PAUSE
RESUME
VIEW ANALYTICS

==================================================
11. CREATE CAMPAIGN
==================================================

Build a multi-step campaign wizard.

STEP 1:
Campaign details

STEP 2:
Select leads

STEP 3:
Configure AI voice agent

STEP 4:
Conversation objectives

STEP 5:
Schedule

STEP 6:
Review & Launch

Voice configuration:
- Agent name
- Language
- Voice
- Tone
- Speed
- Greeting
- Qualification questions
- FAQ knowledge
- Call objective

Languages:
English
Hindi
Gujarati
Spanish
French
German
Arabic
and other major languages.

Scheduling:
- Immediately
- Specific date/time
- Prospect local timezone
- Business hours only

Retry settings:
- Max retries
- Retry interval
- Voicemail behavior
- Callback handling

==================================================
12. AI VOICE AGENT
==================================================

Create a highly visual AI Voice Agent page.

Show:

Agent Status:
● ONLINE

Current calls:
12

Calls today:
842

Average duration:
3m 42s

Qualification rate:
31%

Create an active-call monitoring interface.

Call cards:
- Prospect
- Company
- Location
- Call duration
- Sentiment
- Qualification
- Current stage

Click call to open transcript.

Transcript interface:

AI AGENT:
"Hello, am I speaking with..."

PROSPECT:
"Yes, how can you help?"

AI AGENT:
"I noticed your company is currently..."

Show speaker labels and timestamps.

Right side:
AI Call Intelligence

Sentiment:
Positive

Intent:
High

Qualification:
Qualified

Buying signals:
- Active project
- Immediate requirement
- Decision maker

Next Best Action:
Schedule technical discussion.

Buttons:
CALL BACK
SCHEDULE MEETING
ADD NOTE
ADD TO CRM

==================================================
13. CALL HISTORY
==================================================

Create call logs similar to an enterprise event/log viewer.

Columns:

Timestamp
Prospect
Company
Agent
Duration
Outcome
Sentiment
Intent
Qualification
Recording
Transcript

Add filters.

Call outcomes:
Answered
Voicemail
No Answer
Callback
Qualified
Not Interested
Meeting Booked

==================================================
14. MARKET INTELLIGENCE
==================================================

Create Market Intelligence dashboard.

Show:

Industry Trends
Hiring Trends
Funding
Technology Stack
Competitor Insights

Charts:
- hiring trend
- funding activity
- technology adoption
- industry demand

Create "Market Signals" feed.

Example:

HIGH SIGNAL
12 companies in FinTech are currently hiring AI engineers.

RISING
Demand for Salesforce integration increased 23%.

OPPORTUNITY
34 companies posted requirements matching your services.

==================================================
15. SALES PIPELINE
==================================================

Create a Kanban-style sales pipeline.

Columns:

DISCOVERED
QUALIFIED
CONTACTED
INTERESTED
MEETING
OPPORTUNITY
WON
LOST

Lead cards should contain:
- Name
- Company
- Intent score
- Source
- Last activity
- Next action

Allow moving cards between stages.

Show pipeline value at top.

==================================================
16. ANALYTICS
==================================================

Build a detailed analytics dashboard.

Metrics:

Lead Discovery
Lead Qualification
Calls
Answer Rate
Qualification Rate
Meetings
Conversion
Revenue Opportunity
AI Voice Usage

Charts:
- leads over time
- qualification rate
- calls over time
- conversion funnel
- source performance
- campaign comparison
- industry performance
- geographic distribution

Add date filters:
Today
7 Days
30 Days
90 Days
Custom

==================================================
17. CRM
==================================================

Create CRM Integration page.

Cards for:

Salesforce
HubSpot
Zoho
Pipedrive

Show:
Connected
Disconnected
Syncing
Error

Allow:
CONNECT
SYNC NOW
CONFIGURE

Also create:
Import Leads
Export Leads

Support CSV/Excel UI.

==================================================
18. ADMIN DASHBOARD
==================================================

Build a separate enterprise Admin section.

Admin Overview:

Total Users
Active Users
Trial Users
Paid Users
Active Subscriptions
Voice Minutes
API Usage
System Health

System health indicators:

API
● Operational

AI Processing
● Operational

Voice Infrastructure
● Operational

CRM Integrations
● Operational

Database
● Operational

Create charts for:
- user growth
- voice usage
- API usage
- subscriptions
- platform activity

==================================================
19. ADMIN USER MANAGEMENT
==================================================

Table:

User
Email
Company
Role
Plan
Status
Voice Usage
Last Active
Created

Actions:
View
Edit
Suspend
Delete

Roles:
Admin
Manager
Sales Agent
Viewer

==================================================
20. SUBSCRIPTIONS & BILLING
==================================================

Plans:

STARTER
GROWTH
ENTERPRISE

Show:
- Contacts
- AI Voice Minutes
- API Integrations
- Users
- Features
- Current usage

Create billing dashboard.

Usage bars:
Contacts
Voice Minutes
API Calls
Storage

==================================================
21. AUDIT LOGS
==================================================

Create a security/event-log interface.

Columns:

Timestamp
User
Action
Resource
IP
Status

Example events:

User created campaign
Lead exported
CRM connected
AI agent updated
Subscription changed
Admin login
User suspended

Use filters and search.

==================================================
22. FRAUD DETECTION
==================================================

Create an AI-powered fraud/security page.

Show:
Risk Score
Suspicious Users
Unusual API Activity
Abnormal Voice Usage
Failed Login Attempts

Use severity badges:
LOW
MEDIUM
HIGH
CRITICAL

Create an event timeline.

==================================================
23. SETTINGS
==================================================

Create settings pages for:

Profile
Company
AI Preferences
Voice Agent
Languages
Notifications
Integrations
Security
Billing

Include multilingual UI support.

The application must be designed so the user can switch interface language.

==================================================
24. MULTILINGUAL SUPPORT
==================================================

The specification explicitly requires multilingual support.

Implement an i18n-ready architecture.

At minimum provide:
English
Hindi
Gujarati

Create a language selector in the user menu.

All major navigation labels and common UI elements should be translatable.

==================================================
25. DATA MODEL
==================================================

Create realistic mock data for:

Users
Companies
Leads
Requirements
Campaigns
Calls
Call Transcripts
AI Scores
Market Signals
CRM Integrations
Subscriptions
Invoices
Audit Logs
System Events

Do not use lorem ipsum.

Use realistic business data.

==================================================
26. INTERACTION REQUIREMENTS
==================================================

The application MUST feel functional.

Implement:

- Sidebar navigation
- Search
- Filters
- Sorting
- Pagination
- Tabs
- Modals
- Drawers
- Dropdowns
- Date pickers
- Toast notifications
- Status changes
- Campaign creation
- Lead selection
- Pipeline movement
- CSV upload UI
- CSV export action
- CRM connect simulation
- AI discovery simulation
- AI qualification simulation
- Campaign launch simulation
- Call transcript viewer
- Dashboard date filtering

Buttons must perform meaningful actions.

Do NOT leave major buttons completely non-functional.

==================================================
27. AI SIMULATION
==================================================

Since external AI APIs may not be available during development, create a realistic mock AI service layer.

Create functions such as:

discoverLeads()
enrichLead()
calculateIntentScore()
qualifyLead()
generateCallSummary()
generateNextBestAction()
analyzeMarketSignal()

Keep these services isolated so real AI APIs can later replace the mock implementation.

When an AI operation runs, show realistic loading states.

Example:

AI ANALYSIS
Analyzing requirement...

Extracting intent...

Evaluating company fit...

Generating recommendation...

Then return results.

==================================================
28. RESPONSIVE DESIGN
==================================================

The application must work on:

Desktop
Laptop
Tablet
Mobile

Desktop should be the primary experience.

On mobile:
- collapse sidebar
- convert tables to cards where necessary
- maintain filters/search
- preserve usability

==================================================
29. TECHNICAL ARCHITECTURE
==================================================

Use a modern production-quality stack.

Preferred:

Frontend:
React
TypeScript
Tailwind CSS

UI:
shadcn/ui or equivalent reusable component system

Charts:
Recharts or equivalent

Icons:
Lucide

State:
React state/context or a clean state-management solution

Routing:
React Router

Backend:
Use a clean API/service abstraction.

If a database/backend is available in the Antigravity environment, structure the application so data can later be persisted.

If backend configuration is not available, use a realistic mock API/data layer.

==================================================
30. COMPONENT ARCHITECTURE
==================================================

Create reusable components:

AppShell
Sidebar
TopBar
GlobalSearch
MetricCard
DataTable
FilterBar
StatusBadge
IntentScore
LeadDrawer
LeadCard
ActivityStream
ChartPanel
AIInsightCard
CampaignWizard
CallTranscript
PipelineBoard
PipelineCard
AdminTable
NotificationCenter
EmptyState
LoadingState
Toast

Avoid duplicating UI code.

==================================================
31. SPLUNK-INSPIRED DATA EXPERIENCE
==================================================

This is extremely important.

Make the application feel like a professional analytics/logging platform.

Use:
- dense tables
- event streams
- timestamps
- filters
- query/search bars
- compact metric panels
- dark UI
- analytical charts
- status indicators
- technical terminology
- real-time activity

For example, the Lead Discovery results should feel more like an intelligent event-search system than a normal CRM table.

Use an event-like display:

14:32:11
LEAD_DISCOVERED
LinkedIn
High Intent
Acme Technologies

14:31:44
LEAD_ENRICHED
Company data completed

14:30:21
AI_QUALIFICATION
Score: 91

14:29:07
CAMPAIGN_CALL
Qualified

==================================================
32. HOMEPAGE / DEFAULT ROUTE
==================================================

Do NOT create a marketing landing page as the primary experience.

When the application loads, immediately show the authenticated enterprise dashboard.

Use:

AI SALES INTELLIGENCE

"Real-time sales intelligence and AI-powered engagement"

Then the analytics dashboard.

==================================================
33. MICRO-INTERACTIONS
==================================================

Add polished interactions:

- subtle hover states
- smooth drawer animations
- table row highlighting
- loading skeletons
- progress indicators
- toast notifications
- chart tooltips
- expandable rows
- command-search interaction
- modal transitions

Do not over-animate.

Keep it professional.

==================================================
34. SAMPLE LEAD DATA
==================================================

Generate at least 30-50 realistic sample leads.

Example lead:

Name:
Rahul Mehta

Job:
Head of Technology

Company:
Acme Digital Solutions

Industry:
IT Services

Location:
Bangalore, India

Requirement:
"Looking for an experienced team to implement an AI-powered customer support solution..."

Intent Score:
94

Source:
LinkedIn

Status:
HIGH INTENT

Create varied realistic data across:
India
USA
UK
UAE
Singapore
Europe

==================================================
35. EMPTY / LOADING / ERROR STATES
==================================================

Every major page should have proper:

Loading state
Empty state
Error state

Example:

"No high-intent leads found for the selected filters."

Provide:
CLEAR FILTERS

==================================================
36. SECURITY UI
==================================================

Include enterprise security indicators:

- Secure connection
- Role-based access
- Session status
- Audit logging
- API security
- Encryption status

Do not implement fake security claims as actual security mechanisms; this is UI/prototype functionality unless a real backend is configured.

==================================================
37. ORIGINAL SOURCE TRANSPARENCY
==================================================

For every discovered lead, always display:

Original Requirement
Source Platform
Original Post URL
Discovery Date

This is required for transparency.

Do not invent personal contact information as if it were real.

Use clearly synthetic/mock contact data for demo purposes.

==================================================
38. IMPORTANT PRODUCT DIFFERENTIATOR
==================================================

Make the application communicate this USP:

"Discover → Enrich → Qualify → Engage → Convert"

The unique value is that the platform does not simply generate leads.

It:
1. discovers high-intent requirements
2. enriches prospects
3. scores and qualifies them
4. engages them through AI voice
5. recommends next actions
6. helps move them through the sales pipeline

Represent this visually throughout the application.

==================================================
39. FINAL QUALITY BAR
==================================================

Before finishing:

1. Make sure every route loads.
2. Make sure navigation works.
3. Make sure there are no broken buttons.
4. Make sure there are no console errors.
5. Make sure charts render.
6. Make sure tables render.
7. Make sure filtering works.
8. Make sure modals/drawers work.
9. Make sure responsive design works.
10. Make sure the dashboard looks polished.
11. Make sure mock data looks realistic.
12. Make sure the UI consistently follows the dark enterprise analytics design.
13. Make sure the application feels like a real SaaS product.
14. Make sure there are no lorem ipsum placeholders.
15. Make sure the product is clearly an AI SALES INTELLIGENCE platform, not a generic CRM.

==================================================
40. BUILD PRIORITY
==================================================

Prioritize in this order:

P0:
- App shell
- Sidebar
- Dashboard
- Global search
- Lead Discovery
- Leads table
- Lead details
- AI qualification
- Campaigns
- AI Voice Agent
- Analytics

P1:
- Pipeline
- Market Intelligence
- CRM
- Admin dashboard
- Users
- Billing
- Audit logs

P2:
- Fraud detection
- Advanced settings
- multilingual UI
- additional animations
- advanced filtering

Do not stop after creating the dashboard.

Build the complete application.

At the end, test the application and fix any visual, routing, or functional issues you find.

The final result should look like a serious enterprise product that could be demonstrated to investors, clients, or a college/project evaluation panel.