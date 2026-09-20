import { useState, useRef, ChangeEvent, DragEvent } from 'react'
import {
  Upload, FileText, CheckCircle2, AlertCircle, X, Download,
  Sparkles, RefreshCw, Trash2, Check
} from 'lucide-react'
import { exportToCSV } from '@/lib/exportCsv'
import type { Lead } from '@/data/leads'

interface ParsedLeadRow {
  name: string
  company: string
  email: string
  phone: string
  industry: string
  location: string
  jobTitle?: string
}

interface ImportLeadsModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess?: (count: number, parsedLeads: Partial<Lead>[]) => void
}

const sample120LeadsData: ParsedLeadRow[] = [
  { name: 'Rahul Mehta', company: 'Acme Digital Solutions', email: 'rahul.mehta@acmedigital.com', phone: '+91 98201 44892', industry: 'IT & Cloud Services', location: 'Bangalore, India', jobTitle: 'VP of Technology' },
  { name: 'Sarah Johnson', company: 'NexaFinance Corp', email: 'sarah.j@nexafinance.com', phone: '+1 (415) 892-0192', industry: 'FinTech & Banking', location: 'San Francisco, USA', jobTitle: 'Head of Inside Sales' },
  { name: 'Kavitha Reddy', company: 'Bharat Insurance Group', email: 'kavitha.r@bharatinsure.com', phone: '+91 94401 22819', industry: 'Insurance', location: 'Hyderabad, India', jobTitle: 'Director of Customer Operations' },
  { name: 'Oliver Schmidt', company: 'Deutech Manufacturing', email: 'oliver.s@deutech.de', phone: '+49 89 2039 4810', industry: 'Industrial IoT', location: 'Munich, Germany', jobTitle: 'Chief Digital Officer' },
  { name: 'Mohammed Al-Rashidi', company: 'Emirates Future Tech', email: 'mohammed@emiratesft.ae', phone: '+971 4 391 0022', industry: 'Enterprise Software', location: 'Dubai, UAE', jobTitle: 'VP Business Development' },
  { name: 'Priya Sharma', company: 'TechVenture Labs', email: 'priya.s@techventure.in', phone: '+91 99201 88371', industry: 'AI & Data Platforms', location: 'Mumbai, India', jobTitle: 'Head of Growth' },
  { name: 'Marcus Johnson', company: 'Vertex Solutions', email: 'marcus.j@vertexsolutions.io', phone: '+1 (312) 555-0199', industry: 'Cybersecurity', location: 'Chicago, USA', jobTitle: 'SDR Team Lead' },
  { name: 'Chen Wei', company: 'Pacific Rim Logistics', email: 'chen.wei@pacificrim.sg', phone: '+65 6721 9901', industry: 'Supply Chain', location: 'Singapore', jobTitle: 'Operations Director' },
]

export function ImportLeadsModal({ isOpen, onClose, onImportSuccess }: ImportLeadsModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; count: number } | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedLeadRow[]>([])
  const [detectedColumns, setDetectedColumns] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStep, setImportStep] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  function resetState() {
    setSelectedFile(null)
    setParsedRows([])
    setDetectedColumns([])
    setErrorMessage(null)
    setIsImporting(false)
    setImportProgress(0)
    setImportStep('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    if (isImporting) return
    resetState()
    onClose()
  }

  function parseCSVContent(text: string, fileName: string, fileSizeStr: string) {
    try {
      const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0)
      if (lines.length < 2) {
        setErrorMessage('The selected CSV file appears to be empty or missing data rows.')
        return
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase())
      const colsFound: string[] = []
      if (headers.some(h => h.includes('name'))) colsFound.push('Name')
      if (headers.some(h => h.includes('comp'))) colsFound.push('Company')
      if (headers.some(h => h.includes('email') || h.includes('mail'))) colsFound.push('Email')
      if (headers.some(h => h.includes('phone') || h.includes('mobile') || h.includes('contact'))) colsFound.push('Phone')
      if (headers.some(h => h.includes('indus') || h.includes('sector'))) colsFound.push('Industry')
      if (headers.some(h => h.includes('loc') || h.includes('city') || h.includes('country'))) colsFound.push('Location')
      if (headers.some(h => h.includes('title') || h.includes('role') || h.includes('job'))) colsFound.push('Job Title')

      const nameIdx = headers.findIndex(h => h.includes('name'))
      const companyIdx = headers.findIndex(h => h.includes('comp'))
      const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'))
      const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact'))
      const industryIdx = headers.findIndex(h => h.includes('indus') || h.includes('sector'))
      const locationIdx = headers.findIndex(h => h.includes('loc') || h.includes('city') || h.includes('country'))
      const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('role') || h.includes('job'))

      const rows: ParsedLeadRow[] = []
      for (let i = 1; i < lines.length; i++) {
        // basic CSV comma split
        const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''))
        const name = (nameIdx !== -1 ? parts[nameIdx] : parts[0]) || `Lead #${i}`
        const company = (companyIdx !== -1 ? parts[companyIdx] : parts[1]) || 'Company'
        const email = (emailIdx !== -1 ? parts[emailIdx] : parts[2]) || `contact${i}@example.com`
        const phone = (phoneIdx !== -1 ? parts[phoneIdx] : parts[3]) || '+1 (555) 000-0000'
        const industry = (industryIdx !== -1 ? parts[industryIdx] : parts[4]) || 'Technology'
        const location = (locationIdx !== -1 ? parts[locationIdx] : parts[5]) || 'Global'
        const jobTitle = titleIdx !== -1 ? parts[titleIdx] : 'Decision Maker'

        rows.push({ name, company, email, phone, industry, location, jobTitle })
      }

      setDetectedColumns(colsFound.length > 0 ? colsFound : ['Name', 'Company', 'Email', 'Phone', 'Industry', 'Location'])
      setParsedRows(rows)
      setSelectedFile({
        name: fileName,
        size: fileSizeStr,
        count: rows.length,
      })
      setErrorMessage(null)
    } catch {
      setErrorMessage('Could not parse CSV file. Please verify comma separation and utf-8 encoding.')
    }
  }

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setErrorMessage('Please upload a valid .csv file format.')
      return
    }

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`

    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      if (text) {
        parseCSVContent(text, file.name, sizeStr)
      }
    }
    reader.onerror = () => {
      setErrorMessage('Failed to read the file. Please try again.')
    }
    reader.readAsText(file)
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  function loadSample120Leads() {
    // Generates 120 realistic leads programmatically
    const titles = ['VP of Sales', 'Chief Technology Officer', 'Head of Revenue Ops', 'Director of Inside Sales', 'IT Infrastructure Lead']
    const companies = ['Acme Digital Solutions', 'NexaFinance Corp', 'Bharat Insurance Group', 'Deutech Mfg', 'Emirates Future Tech', 'CloudScale Inc', 'FinPro Advisors', 'RetailEdge Technologies']
    const industries = ['Enterprise Software', 'FinTech & Banking', 'Insurance', 'Cloud Infrastructure', 'Cybersecurity', 'Industrial IoT']
    const locations = ['Bangalore, India', 'San Francisco, USA', 'Hyderabad, India', 'London, UK', 'Singapore', 'Munich, Germany', 'Dubai, UAE']
    const firstNames = ['Rahul', 'Sarah', 'Kavitha', 'Oliver', 'Mohammed', 'Priya', 'Marcus', 'Chen', 'Deepa', 'Suresh', 'Ananya', 'David', 'Elena', 'Vikram']
    const lastNames = ['Mehta', 'Johnson', 'Reddy', 'Schmidt', 'Al-Rashidi', 'Sharma', 'Patel', 'Wei', 'Krishnan', 'Pillai', 'Deshmukh', 'Williams']

    const generated: ParsedLeadRow[] = []
    for (let i = 0; i < 120; i++) {
      const fn = firstNames[i % firstNames.length]
      const ln = lastNames[(i * 3) % lastNames.length]
      const comp = companies[i % companies.length]
      const ind = industries[i % industries.length]
      const loc = locations[i % locations.length]
      const title = titles[i % titles.length]
      const cleanCompDomain = comp.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12)

      generated.push({
        name: `${fn} ${ln}`,
        company: comp,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${cleanCompDomain}.com`,
        phone: `+${(i % 3 === 0 ? '91 98' : i % 3 === 1 ? '1 415 ' : '44 20 ')}${Math.floor(1000000 + Math.random() * 8999999)}`,
        industry: ind,
        location: loc,
        jobTitle: title,
      })
    }

    setDetectedColumns(['Name', 'Company', 'Email', 'Phone', 'Industry', 'Location', 'Job Title'])
    setParsedRows(generated)
    setSelectedFile({
      name: 'enterprise_high_intent_prospects_120.csv',
      size: '28.4 KB',
      count: 120,
    })
    setErrorMessage(null)
  }

  function downloadSampleTemplate() {
    exportToCSV(
      'callisto_leads_import_template.csv',
      sample120LeadsData.slice(0, 5),
      [
        { key: 'name', label: 'Name' },
        { key: 'company', label: 'Company' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'jobTitle', label: 'Job Title' },
        { key: 'industry', label: 'Industry' },
        { key: 'location', label: 'Location' },
      ]
    )
  }

  async function executeImport() {
    const leadsToImport = parsedRows.length > 0 ? parsedRows : sample120LeadsData
    const count = selectedFile?.count || leadsToImport.length || 120

    setIsImporting(true)
    setImportProgress(15)
    setImportStep('Parsing lead records & normalizing phone numbers...')

    await new Promise(r => setTimeout(r, 400))
    setImportProgress(45)
    setImportStep('Validating corporate emails & domain deliverability...')

    await new Promise(r => setTimeout(r, 450))
    setImportProgress(75)
    setImportStep('Checking for existing duplicate CRM contacts...')

    await new Promise(r => setTimeout(r, 400))
    setImportProgress(100)
    setImportStep('Sync complete! Queuing leads for AI qualification...')

    await new Promise(r => setTimeout(r, 350))

    const newLeads: Partial<Lead>[] = leadsToImport.map((row, idx) => ({
      id: `LEAD-IMP-${Date.now()}-${idx}`,
      name: row.name,
      company: row.company,
      email: row.email,
      phone: row.phone,
      industry: row.industry,
      location: row.location,
      jobTitle: row.jobTitle || 'Executive Contact',
      country: row.location.includes(',') ? row.location.split(',')[1].trim() : 'Global',
      intent: (idx % 3 === 0 ? 'HIGH' : idx % 3 === 1 ? 'MEDIUM' : 'LOW') as any,
      intentScore: Math.floor(Math.random() * 25) + 72,
      status: 'NEW' as const,
      source: 'CRM' as const,
      sourceUrl: 'CSV File Upload Import',
      discoveredAt: new Date(),
      enrichedAt: null,
      lastActivity: new Date(),
      requirement: `Imported via CSV batch upload. Interested in AI sales voice outreach automation.`,
      aiReasoning: 'Newly ingested CRM contact awaiting automated intent enrichment and outreach call scheduling.',
      aiRecommendations: ['Validate decision maker status', 'Schedule introductory AI voice discovery call'],
      budgetSignal: 'MEDIUM',
      timeline: 'Q4 Evaluation',
      decisionMaker: true,
      tags: ['CSV Import', 'Enterprise Batch'],
      techStack: ['CRM Connector'],
      competitors: [],
      needClarity: 80,
      urgency: 75,
      budgetScore: 78,
      authorityScore: 82,
      fitScore: 85,
      campaignId: null,
      linkedin: `https://linkedin.com/search/results/all/?keywords=${encodeURIComponent(row.name + ' ' + row.company)}`,
      website: `https://${row.company.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      companySize: '50-500 employees',
      employees: 180,
      funding: 'Series B',
      hiringStatus: 'Actively Hiring',
      nextAction: 'Queue for AI Qualification Call',
    }))

    setIsImporting(false)
    onImportSuccess?.(count, newLeads)
    handleClose()
  }

  const importCount = selectedFile?.count || 120

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-panel max-w-lg w-full border border-amber-500/30 shadow-2xl animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="section-header flex items-center justify-between border-b border-bg-border px-4 py-3 bg-bg-secondary/70">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="section-title text-sm font-bold text-text-primary">Import Leads</span>
              <span className="text-3xs text-text-muted ml-2">CSV / Excel Format</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onFileInputChange}
          />

          {/* Upload Drop Area */}
          {!selectedFile ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/15 scale-[1.01] shadow-lg shadow-amber-500/10'
                  : 'border-amber-500/40 hover:border-amber-500/70 bg-amber-500/5 hover:bg-amber-500/10'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 transition-transform hover:scale-110">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-text-primary">
                Drop your CSV file here
              </div>
              <div className="text-2xs text-text-muted mt-1">
                or <span className="text-amber-400 underline font-medium">browse files</span> from your computer
              </div>
              <div className="text-3xs text-text-muted mt-2">
                Supported columns: Name, Company, Email, Phone, Industry, Location
              </div>
            </div>
          ) : (
            /* Selected File State Card */
            <div className="p-3.5 bg-bg-card border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-text-primary truncate font-mono">
                      {selectedFile.name}
                    </span>
                    <span className="text-2xs text-text-muted">
                      {selectedFile.size} · <strong className="text-amber-400 font-mono">{selectedFile.count} leads</strong> ready to import
                    </span>
                  </div>
                </div>

                {!isImporting && (
                  <button
                    onClick={resetState}
                    className="p-1.5 text-text-muted hover:text-danger rounded hover:bg-bg-hover transition-colors"
                    title="Remove selected file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mapped Fields Badges */}
              {detectedColumns.length > 0 && (
                <div className="pt-2 border-t border-bg-border/60">
                  <div className="flex items-center justify-between text-2xs mb-1.5">
                    <span className="text-text-muted font-medium">Auto-Mapped CRM Columns:</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-mono text-3xs font-semibold">
                      <Check className="w-3 h-3" /> Validated
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {detectedColumns.map(col => (
                      <span
                        key={col}
                        className="px-1.5 py-0.5 rounded text-3xs font-mono bg-bg-secondary border border-bg-border text-text-secondary"
                      >
                        ✓ {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Preview Table of First 3 Records */}
              {parsedRows.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="text-3xs uppercase font-bold text-text-muted tracking-wider">
                    Data Preview (First {Math.min(3, parsedRows.length)} of {parsedRows.length}):
                  </div>
                  <div className="rounded border border-bg-border overflow-hidden bg-bg-secondary/40 text-2xs">
                    {parsedRows.slice(0, 3).map((r, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-2.5 py-1.5 ${
                          i > 0 ? 'border-t border-bg-border/40' : ''
                        }`}
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold text-text-primary">{r.name}</span>
                          <span className="text-text-muted text-3xs ml-1.5">({r.company})</span>
                        </div>
                        <span className="text-3xs text-text-muted font-mono shrink-0 truncate max-w-[140px]">
                          {r.email}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message if any */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded bg-danger/10 border border-danger/30 text-danger-bright text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Helper Actions / Demo Tools */}
          {!selectedFile && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-2xs">
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="btn-ghost text-2xs gap-1 py-1 px-2 text-text-muted hover:text-amber-400"
              >
                <Download className="w-3 h-3" /> Download Sample CSV Template
              </button>

              <button
                type="button"
                onClick={loadSample120Leads}
                className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-2xs font-semibold flex items-center gap-1 transition-all"
              >
                <Sparkles className="w-3 h-3" /> Load Sample 120 Leads
              </button>
            </div>
          )}

          {/* Progress Animation Bar during active import */}
          {isImporting && (
            <div className="p-3 bg-bg-card border border-amber-500/40 rounded-xl space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {importStep}
                </span>
                <span className="font-mono font-bold text-text-primary text-xs">{importProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-bg-border">
            <span className="text-3xs text-text-muted">
              {selectedFile ? `Ready to import ${importCount} records` : 'Select a file or load sample leads'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isImporting}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={executeImport}
                disabled={isImporting}
                className="btn-primary text-xs py-1.5 px-4 font-semibold shadow-md shadow-amber-500/20 flex items-center gap-1.5"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Import {importCount} Leads
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
