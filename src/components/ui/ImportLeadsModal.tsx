import { useState, useRef, ChangeEvent, DragEvent, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileText, CheckCircle2, AlertCircle, X, Download,
  Sparkles, RefreshCw, Trash2, Check, ArrowRight, ArrowLeft,
  Users, PhoneCall, AlertTriangle, Filter, Eye, ChevronDown,
  Layers, ShieldCheck, HelpCircle, Phone, Mail, Building, MapPin, Briefcase
} from 'lucide-react'
import type { Lead } from '@/data/leads'
import {
  parseSpreadsheetFile,
  autoDetectFieldMapping,
  validateLeadRows,
  buildLeadsFromValidatedRows,
  downloadCallistoTemplate,
  type RawSpreadsheetData,
  type FieldMapping,
  type SpreadsheetValidationSummary,
  type DuplicateStrategy,
  type ValidatedLeadRow
} from '@/lib/excelLeads'
import { useLeads } from '@/contexts/LeadContext'
import { useCampaigns } from '@/contexts/CampaignContext'
import { useToast } from '@/contexts/ToastContext'
import { SUPPORTED_LANGUAGES } from '@/lib/languages'

interface ImportLeadsModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess?: (count: number, newLeads: Partial<Lead>[]) => void
  /** If provided, leads will be directly assigned to this campaign */
  targetCampaignId?: string
}

type WizardStep = 'upload' | 'mapping' | 'validation' | 'complete'

export function ImportLeadsModal({ isOpen, onClose, onImportSuccess, targetCampaignId }: ImportLeadsModalProps) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { leadsList, addLeads } = useLeads()
  const { addCampaign } = useCampaigns()

  const [step, setStep] = useState<WizardStep>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  // Uploaded spreadsheet data
  const [fileName, setFileName] = useState<string>('')
  const [fileSizeStr, setFileSizeStr] = useState<string>('')
  const [spreadsheetData, setSpreadsheetData] = useState<RawSpreadsheetData | null>(null)

  // Field mapping
  const [mapping, setMapping] = useState<FieldMapping>({})

  // Validation & duplicate results
  const [validationSummary, setValidationSummary] = useState<SpreadsheetValidationSummary | null>(null)
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('skip')
  const [activeReviewTab, setActiveReviewTab] = useState<'all' | 'valid' | 'duplicates' | 'errors'>('all')
  const [skipInvalidRows, setSkipInvalidRows] = useState(true)

  // Import execution
  const [isExecuting, setIsExecuting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStepText, setImportStepText] = useState('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function resetState() {
    setStep('upload')
    setIsDragging(false)
    setIsParsing(false)
    setParseError(null)
    setFileName('')
    setFileSizeStr('')
    setSpreadsheetData(null)
    setMapping({})
    setValidationSummary(null)
    setDuplicateStrategy('skip')
    setActiveReviewTab('all')
    setSkipInvalidRows(true)
    setIsExecuting(false)
    setImportProgress(0)
    setImportStepText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    if (isExecuting) return
    resetState()
    onClose()
  }

  // Parse any file (CSV, TSV, XLSX, XLS)
  async function processFile(file: File) {
    setIsParsing(true)
    setParseError(null)
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`

    try {
      const data = await parseSpreadsheetFile(file)
      if (data.rows.length === 0) {
        throw new Error('Spreadsheet does not contain any valid data rows.')
      }

      setFileName(file.name)
      setFileSizeStr(sizeStr)
      setSpreadsheetData(data)

      // Auto-detect field mapping
      const detected = autoDetectFieldMapping(data.headers)
      setMapping(detected)

      // Move to mapping step
      setStep('mapping')
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file. Please verify CSV/Excel format.')
    } finally {
      setIsParsing(false)
    }
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
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
    if (file) processFile(file)
  }

  // Load the standard Callisto template directly
  async function loadTemplateData() {
    setIsParsing(true)
    setParseError(null)
    try {
      // Mock loading of the standard 11-lead template
      const templateHeaders = ['Name', 'Company', 'Email', 'Phone', 'Job Title', 'Industry', 'Location']
      const templateRows = [
        { Name: 'Rahul Mehta', Company: 'Acme Digital Solutions', Email: 'rahul.mehta@acmedigital.com', Phone: '+91 98201 44892', 'Job Title': 'VP of Technology', Industry: 'IT & Cloud Services', Location: 'Bangalore, India' },
        { Name: 'Sarah Johnson', Company: 'NexaFinance Corp', Email: 'sarah.j@nexafinance.com', Phone: '+1 (415) 892-0192', 'Job Title': 'Head of Inside Sales', Industry: 'FinTech & Banking', Location: 'San Francisco, USA' },
        { Name: 'Kavitha Reddy', Company: 'Bharat Insurance Group', Email: 'kavitha.r@bharatinsure.com', Phone: '+91 94401 22819', 'Job Title': 'Director of Customer Operations', Industry: 'Insurance', Location: 'Hyderabad, India' },
        { Name: 'Oliver Schmidt', Company: 'Deutech Manufacturing', Email: 'oliver.s@deutech.de', Phone: '+49 89 2039 4810', 'Job Title': 'Chief Digital Officer', Industry: 'Industrial IoT', Location: 'Munich, Germany' },
        { Name: 'Mohammed Al-Rashidi', Company: 'Emirates Future Tech', Email: 'mohammed@emiratesft.ae', Phone: '+971 4 391 0022', 'Job Title': 'VP Business Development', Industry: 'Enterprise Software', Location: 'Dubai, UAE' },
        { Name: 'Aarav Sharma', Company: 'NovaByte Solutions', Email: 'aarav.sharma@example.com', Phone: '+91 90000 10001', 'Job Title': 'Founder & CEO', Industry: 'Software & IT', Location: 'Ahmedabad, India' },
        { Name: 'Riya Patel', Company: 'PixelCraft Studio', Email: 'riya.patel@example.com', Phone: '+91 90000 10002', 'Job Title': 'Creative Director', Industry: 'Design & Creative', Location: 'Mumbai, India' },
        { Name: 'Karan Mehta', Company: 'GrowthSphere Media', Email: 'karan.mehta@example.com', Phone: '+91 90000 10003', 'Job Title': 'Marketing Manager', Industry: 'Digital Marketing', Location: 'Bengaluru, India' },
        { Name: 'Ananya Shah', Company: 'FinEdge Technologies', Email: 'ananya.shah@example.com', Phone: '+91 90000 10004', 'Job Title': 'Product Manager', Industry: 'FinTech', Location: 'Pune, India' },
      ]

      setFileName('callisto_leads_import_template.xlsx')
      setFileSizeStr('11.2 KB')
      setSpreadsheetData({
        sheetNames: ['callisto_leads_import_template'],
        activeSheet: 'callisto_leads_import_template',
        headers: templateHeaders,
        rows: templateRows,
        totalRows: templateRows.length,
      })
      setMapping({
        name: 'Name',
        company: 'Company',
        email: 'Email',
        phone: 'Phone',
        jobTitle: 'Job Title',
        industry: 'Industry',
        location: 'Location',
      })
      setStep('mapping')
    } catch {
      setParseError('Failed to load template data.')
    } finally {
      setIsParsing(false)
    }
  }

  // Generate 120 leads programmatic demo
  function loadSample120Leads() {
    const titles = ['VP of Sales', 'Chief Technology Officer', 'Head of Revenue Ops', 'Director of Inside Sales', 'IT Infrastructure Lead']
    const companies = ['Acme Digital Solutions', 'NexaFinance Corp', 'Bharat Insurance Group', 'Deutech Mfg', 'Emirates Future Tech', 'CloudScale Inc', 'FinPro Advisors', 'RetailEdge Technologies']
    const industries = ['Enterprise Software', 'FinTech & Banking', 'Insurance', 'Cloud Infrastructure', 'Cybersecurity', 'Industrial IoT']
    const locations = ['Bangalore, India', 'San Francisco, USA', 'Hyderabad, India', 'London, UK', 'Singapore', 'Munich, Germany', 'Dubai, UAE', 'Ahmedabad, India']
    const firstNames = ['Rahul', 'Sarah', 'Kavitha', 'Oliver', 'Mohammed', 'Priya', 'Marcus', 'Chen', 'Deepa', 'Suresh', 'Ananya', 'David', 'Elena', 'Vikram']
    const lastNames = ['Mehta', 'Johnson', 'Reddy', 'Schmidt', 'Al-Rashidi', 'Sharma', 'Patel', 'Wei', 'Krishnan', 'Pillai', 'Deshmukh', 'Williams']

    const generated: Record<string, any>[] = []
    for (let i = 0; i < 120; i++) {
      const fn = firstNames[i % firstNames.length]
      const ln = lastNames[(i * 3) % lastNames.length]
      const comp = companies[i % companies.length]
      const cleanCompDomain = comp.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12)

      generated.push({
        'Full Name': `${fn} ${ln}`,
        'Organization': comp,
        'Work Email': `${fn.toLowerCase()}.${ln.toLowerCase()}@${cleanCompDomain}.com`,
        'Phone Number': `+${(i % 3 === 0 ? '91 98' : i % 3 === 1 ? '1 415 ' : '44 20 ')}${Math.floor(1000000 + Math.random() * 8999999)}`,
        'Industry Vertical': industries[i % industries.length],
        'Primary Location': locations[i % locations.length],
        'Designation': titles[i % titles.length],
      })
    }

    setFileName('enterprise_prospects_120_leads.csv')
    setFileSizeStr('28.4 KB')
    setSpreadsheetData({
      sheetNames: ['Leads'],
      activeSheet: 'Leads',
      headers: ['Full Name', 'Organization', 'Work Email', 'Phone Number', 'Industry Vertical', 'Primary Location', 'Designation'],
      rows: generated,
      totalRows: 120,
    })
    setMapping({
      name: 'Full Name',
      company: 'Organization',
      email: 'Work Email',
      phone: 'Phone Number',
      jobTitle: 'Designation',
      industry: 'Industry Vertical',
      location: 'Primary Location',
    })
    setStep('mapping')
  }

  // Proceed from Mapping to Validation step
  function proceedToValidation() {
    if (!spreadsheetData) return
    const summary = validateLeadRows(spreadsheetData.rows, mapping, leadsList)
    setValidationSummary(summary)
    setStep('validation')
  }

  // Filtered rows for the review tab
  const displayedRows = useMemo(() => {
    if (!validationSummary) return []
    switch (activeReviewTab) {
      case 'valid':
        return validationSummary.rows.filter(r => r.status === 'VALID')
      case 'duplicates':
        return validationSummary.rows.filter(r => r.isInternalDuplicate || r.isExistingDuplicate)
      case 'errors':
        return validationSummary.rows.filter(r => r.status === 'INVALID')
      default:
        return validationSummary.rows
    }
  }, [validationSummary, activeReviewTab])

  // Execute Import
  async function handleImport(mode: 'PIPELINE' | 'AI_CALLING_ONLY') {
    if (!validationSummary) return

    setIsExecuting(true)
    setImportProgress(20)
    setImportStepText('Normalizing phone numbers & international E.164 formats...')

    await new Promise(r => setTimeout(r, 300))
    setImportProgress(45)
    setImportStepText('Validating corporate emails and language routing...')

    await new Promise(r => setTimeout(r, 300))
    setImportProgress(70)
    setImportStepText(
      duplicateStrategy === 'skip'
        ? 'Deduplicating existing CRM and system leads...'
        : duplicateStrategy === 'update'
        ? 'Merging updated contact attributes into existing leads...'
        : 'Preparing independent records...'
    )

    await new Promise(r => setTimeout(r, 300))
    setImportProgress(90)
    setImportStepText(
      mode === 'AI_CALLING_ONLY'
        ? 'Configuring AI Voice Agent direct dialing campaign...'
        : 'Adding leads to active intelligence pipeline...'
    )

    const isAiCalling = mode === 'AI_CALLING_ONLY'
    const { newLeads, updatedLeadMap } = buildLeadsFromValidatedRows(
      validationSummary.rows,
      duplicateStrategy,
      {
        sourceUrl: fileName || 'CSV/Excel Upload',
        isAiCallingOnly: isAiCalling,
        campaignId: targetCampaignId,
        tags: isAiCalling ? ['AI Calling Only', 'Direct Upload'] : ['Spreadsheet Import'],
      }
    )

    // Save into LeadContext
    const result = addLeads(newLeads, duplicateStrategy, updatedLeadMap)

    await new Promise(r => setTimeout(r, 250))
    setImportProgress(100)
    setIsExecuting(false)

    // Trigger parent callback
    const totalProcessed = result.added + result.updated
    onImportSuccess?.(totalProcessed, newLeads)

    if (mode === 'AI_CALLING_ONLY') {
      // Create an instant AI Calling Only campaign
      const targetLeadIds = newLeads.map(l => l.id as string).filter(Boolean)
      const primaryLang = newLeads[0]?.primaryLanguage === 'gu'
        ? 'Gujarati'
        : newLeads[0]?.primaryLanguage === 'hi'
        ? 'Hindi'
        : 'English'

      const createdCamp = addCampaign({
        name: `AI Calling Only: ${fileName.replace(/\.[^/.]+$/, '') || 'Direct Leads'}`,
        target: `${totalProcessed} Uploaded Leads (Bypassed AI Discovery)`,
        type: 'AI_CALLING_ONLY',
        sourceType: 'UPLOADED_FILE',
        leadIds: targetLeadIds,
        leads: targetLeadIds.length,
        language: primaryLang,
        voice: primaryLang === 'Gujarati' ? 'Gaurav (Native Gujarati Male)' : primaryLang === 'Hindi' ? 'Swara (Native Hindi Female)' : 'Aria (Professional English Female)',
        tone: 'Consultative',
        objective: 'Autonomous outbound AI qualification. Direct spreadsheet upload, web discovery skipped.',
        greeting: primaryLang === 'Gujarati'
          ? 'નમસ્તે, હું Callisto AI Solutions માંથી બોલું છું. શું આપની પાસે વાતચીત માટે 2 મિનિટનો સમય છે?'
          : primaryLang === 'Hindi'
          ? 'नमस्ते, मैं Callisto AI Solutions से बात कर रही हूँ। क्या आपके पास 2 मिनट का समय है?'
          : "Hello, I'm calling from Callisto AI Solutions. Do you have 2 minutes to discuss sales automation?",
      })

      showToast('success', 'AI Calling Campaign Created!', `"${createdCamp.name}" launched with ${totalProcessed} direct leads.`)
      handleClose()
      navigate(`/ai-voice-agent?campaign=${createdCamp.id}&lead=${targetLeadIds[0] || ''}`)
    } else {
      showToast('success', 'Leads Imported Successfully', `${result.added} added, ${result.updated} updated, ${result.skipped} skipped.`)
      handleClose()
    }
  }

  // Count metrics for summary
  const totalCount = validationSummary?.total || 0
  const validCount = validationSummary?.valid || 0
  const invalidCount = validationSummary?.invalid || 0
  const dupCount = (validationSummary?.internalDuplicates || 0) + (validationSummary?.existingDuplicates || 0)

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-panel max-w-3xl w-full border border-amber-500/30 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bg-border px-5 py-3.5 bg-bg-secondary/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-primary">Import Leads</span>
                <span className="text-3xs font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  CSV / Excel (.xlsx, .xls)
                </span>
              </div>
              <span className="text-3xs text-text-muted">
                Validation · Duplicate Detection · Person Mapping · AI Calling Only
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isExecuting}
            className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Steps Breadcrumbs */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-bg-card/50 border-b border-bg-border text-2xs shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2">
            {[
              { id: 'upload', label: '1. Upload File' },
              { id: 'mapping', label: '2. Contact Mapping' },
              { id: 'validation', label: '3. Review & Duplicates' },
            ].map((st, i) => {
              const isActive = step === st.id
              const isPast = (st.id === 'upload' && step !== 'upload') || (st.id === 'mapping' && step === 'validation')
              return (
                <div key={st.id} className="flex items-center gap-1.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-3xs font-bold ${
                      isActive
                        ? 'bg-amber-500 text-black'
                        : isPast
                        ? 'bg-success text-black'
                        : 'bg-bg-border text-text-muted'
                    }`}
                  >
                    {isPast ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className={`font-medium ${isActive ? 'text-amber-400' : isPast ? 'text-text-primary' : 'text-text-muted'}`}>
                    {st.label}
                  </span>
                  {i < 2 && <span className="text-text-muted mx-1">›</span>}
                </div>
              )
            })}
          </div>

          {fileName && (
            <span className="text-3xs text-text-muted font-mono truncate max-w-[200px]" title={fileName}>
              {fileName} ({fileSizeStr})
            </span>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={onFileInputChange}
              />

              {/* Drag & Drop Area */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-amber-400 bg-amber-500/15 scale-[1.01] shadow-lg shadow-amber-500/10'
                    : 'border-amber-500/40 hover:border-amber-500/70 bg-amber-500/5 hover:bg-amber-500/10'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 transition-transform hover:scale-110">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="text-sm font-semibold text-text-primary">
                  Drop your CSV or Excel spreadsheet here
                </div>
                <div className="text-2xs text-text-muted mt-1.5">
                  or <span className="text-amber-400 underline font-medium">browse files</span> from your computer
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-3xs text-text-muted font-mono">
                  <span className="px-2 py-0.5 rounded bg-bg-secondary border border-bg-border">.xlsx (Excel)</span>
                  <span className="px-2 py-0.5 rounded bg-bg-secondary border border-bg-border">.xls (Legacy Excel)</span>
                  <span className="px-2 py-0.5 rounded bg-bg-secondary border border-bg-border">.csv (Comma/Semicolon)</span>
                  <span className="px-2 py-0.5 rounded bg-bg-secondary border border-bg-border">.tsv (Tab-delimited)</span>
                </div>
              </div>

              {/* Parsing Indicator */}
              {isParsing && (
                <div className="p-3 bg-bg-card border border-amber-500/40 rounded-xl flex items-center justify-center gap-2 text-xs text-amber-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reading spreadsheet structure and discovering columns...</span>
                </div>
              )}

              {/* Error Message */}
              {parseError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger-bright text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Sample Templates & Fast Loading */}
              <div className="pt-2 border-t border-bg-border space-y-2">
                <div className="text-2xs uppercase font-bold text-text-muted tracking-wider">
                  Quick Testing & Templates:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={loadTemplateData}
                    className="p-2.5 rounded-lg bg-bg-card border border-bg-border hover:border-amber-500/40 text-left flex items-start gap-2.5 transition-all group"
                  >
                    <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-text-primary group-hover:text-amber-400">
                        Load Official Template Excel
                      </div>
                      <div className="text-3xs text-text-muted">
                        callisto_leads_import_template.xlsx (11 Verified Leads)
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={loadSample120Leads}
                    className="p-2.5 rounded-lg bg-bg-card border border-bg-border hover:border-amber-500/40 text-left flex items-start gap-2.5 transition-all group"
                  >
                    <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-text-primary group-hover:text-amber-400">
                        Load Enterprise Sample (120 Leads)
                      </div>
                      <div className="text-3xs text-text-muted">
                        Simulates multi-region enterprise batch with phone numbers
                      </div>
                    </div>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-2xs">
                  <span className="text-3xs text-text-muted">
                    Need the blank template?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadCallistoTemplate('xlsx')}
                      className="btn-ghost text-2xs gap-1 py-1 px-2 text-text-muted hover:text-amber-400"
                    >
                      <Download className="w-3 h-3" /> Download .xlsx Template
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadCallistoTemplate('csv')}
                      className="btn-ghost text-2xs gap-1 py-1 px-2 text-text-muted hover:text-amber-400"
                    >
                      <Download className="w-3 h-3" /> Download .csv Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: FIELD / CONTACT MAPPING */}
          {step === 'mapping' && spreadsheetData && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between text-2xs">
                <div>
                  <span className="font-semibold text-text-primary">Detected Columns: </span>
                  <span className="text-text-muted">{spreadsheetData.headers.join(', ')}</span>
                </div>
                <span className="font-mono text-amber-400 font-semibold shrink-0 ml-2">
                  {spreadsheetData.totalRows} Rows Found
                </span>
              </div>

              <div className="text-2xs text-text-muted">
                Map the columns from your uploaded file to the contact attributes in Callisto AI. We have auto-detected matching fields for you:
              </div>

              {/* Mapping Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Full Name */}
                <div className="p-2.5 bg-bg-card border border-bg-border rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-text-primary flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>Full Name *</span>
                    </label>
                    {mapping.name && <span className="text-3xs text-success font-semibold">✓ Mapped</span>}
                  </div>
                  <select
                    className="input text-xs w-full"
                    value={mapping.name || ''}
                    onChange={e => setMapping(p => ({ ...p, name: e.target.value || undefined }))}
                  >
                    <option value="">-- (Not Mapped / Combine First + Last) --</option>
                    {spreadsheetData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Company Name */}
                <div className="p-2.5 bg-bg-card border border-bg-border rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-text-primary flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-amber-400" />
                      <span>Company / Organization *</span>
                    </label>
                    {mapping.company && <span className="text-3xs text-success font-semibold">✓ Mapped</span>}
                  </div>
                  <select
                    className="input text-xs w-full"
                    value={mapping.company || ''}
                    onChange={e => setMapping(p => ({ ...p, company: e.target.value || undefined }))}
                  >
                    <option value="">-- (Not Mapped) --</option>
                    {spreadsheetData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Email Address */}
                <div className="p-2.5 bg-bg-card border border-bg-border rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-text-primary flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      <span>Corporate Email</span>
                    </label>
                    {mapping.email && <span className="text-3xs text-success font-semibold">✓ Mapped</span>}
                  </div>
                  <select
                    className="input text-xs w-full"
                    value={mapping.email || ''}
                    onChange={e => setMapping(p => ({ ...p, email: e.target.value || undefined }))}
                  >
                    <option value="">-- (Not Mapped) --</option>
                    {spreadsheetData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Phone Number */}
                <div className="p-2.5 bg-bg-card border border-bg-border rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-text-primary flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>Phone Number (for AI Calling)</span>
                    </label>
                    {mapping.phone && <span className="text-3xs text-success font-semibold">✓ Mapped</span>}
                  </div>
                  <select
                    className="input text-xs w-full"
                    value={mapping.phone || ''}
                    onChange={e => setMapping(p => ({ ...p, phone: e.target.value || undefined }))}
                  >
                    <option value="">-- (Not Mapped) --</option>
                    {spreadsheetData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Job Title / Role */}
                <div className="p-2.5 bg-bg-card border border-bg-border rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-text-primary flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                      <span>Job Title / Role</span>
                    </label>
                    {mapping.jobTitle && <span className="text-3xs text-success font-semibold">✓ Mapped</span>}
                  </div>
                  <select
                    className="input text-xs w-full"
                    value={mapping.jobTitle || ''}
                    onChange={e => setMapping(p => ({ ...p, jobTitle: e.target.value || undefined }))}
                  >
                    <option value="">-- (Not Mapped) --</option>
                    {spreadsheetData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Industry */}
                <div className="p-2.5 bg-bg-card border border-bg-border rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-text-primary flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Industry / Sector</span>
                    </label>
                    {mapping.industry && <span className="text-3xs text-success font-semibold">✓ Mapped</span>}
                  </div>
                  <select
                    className="input text-xs w-full"
                    value={mapping.industry || ''}
                    onChange={e => setMapping(p => ({ ...p, industry: e.target.value || undefined }))}
                  >
                    <option value="">-- (Not Mapped) --</option>
                    {spreadsheetData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="p-2.5 bg-bg-card border border-bg-border rounded-lg space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-text-primary flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Location / City / Country (Used for Vernacular Language Detection)</span>
                    </label>
                    {mapping.location && <span className="text-3xs text-success font-semibold">✓ Mapped</span>}
                  </div>
                  <select
                    className="input text-xs w-full"
                    value={mapping.location || ''}
                    onChange={e => setMapping(p => ({ ...p, location: e.target.value || undefined }))}
                  >
                    <option value="">-- (Not Mapped) --</option>
                    {spreadsheetData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Preview */}
              <div className="space-y-1.5 pt-2 border-t border-bg-border">
                <div className="text-3xs uppercase font-bold text-text-muted tracking-wider flex items-center justify-between">
                  <span>Live Preview of Mapped Data (First 3 Rows):</span>
                </div>
                <div className="rounded-lg border border-bg-border overflow-hidden bg-bg-secondary/40 text-2xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-bg-card border-b border-bg-border text-text-muted text-left text-3xs font-semibold">
                        <th className="p-2">Name</th>
                        <th className="p-2">Company</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bg-border">
                      {spreadsheetData.rows.slice(0, 3).map((row, idx) => {
                        const name = mapping.name ? row[mapping.name] : 'N/A'
                        const comp = mapping.company ? row[mapping.company] : 'N/A'
                        const email = mapping.email ? row[mapping.email] : 'N/A'
                        const phone = mapping.phone ? row[mapping.phone] : 'N/A'
                        const loc = mapping.location ? row[mapping.location] : 'Global'
                        return (
                          <tr key={idx} className="hover:bg-bg-hover/50">
                            <td className="p-2 font-medium text-text-primary">{name || '—'}</td>
                            <td className="p-2 text-text-secondary">{comp || '—'}</td>
                            <td className="p-2 font-mono text-3xs text-text-muted">{email || '—'}</td>
                            <td className="p-2 font-mono text-3xs text-text-muted">{phone || '—'}</td>
                            <td className="p-2 text-text-secondary">{loc || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VALIDATION & DUPLICATE RESOLUTION */}
          {step === 'validation' && validationSummary && (
            <div className="space-y-4">
              {/* Stat Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-bg-card border border-bg-border rounded-xl">
                  <div className="text-2xs text-text-muted">Total Rows</div>
                  <div className="text-lg font-bold font-mono text-text-primary">{totalCount}</div>
                </div>

                <div className="p-3 bg-bg-card border border-success/30 rounded-xl">
                  <div className="text-2xs text-success">Valid Contacts</div>
                  <div className="text-lg font-bold font-mono text-success">{validCount}</div>
                </div>

                <div className="p-3 bg-bg-card border border-amber-500/30 rounded-xl">
                  <div className="text-2xs text-amber-400">Duplicates Found</div>
                  <div className="text-lg font-bold font-mono text-amber-400">{dupCount}</div>
                </div>

                <div className="p-3 bg-bg-card border border-danger/30 rounded-xl">
                  <div className="text-2xs text-danger-bright">Invalid Rows</div>
                  <div className="text-lg font-bold font-mono text-danger-bright">{invalidCount}</div>
                </div>
              </div>

              {/* Duplicate Resolution Strategy Picker */}
              <div className="p-3.5 bg-bg-card border border-amber-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Duplicate Contact Handling Strategy:</span>
                  </div>
                  <span className="text-3xs text-text-muted">
                    {dupCount} duplicates detected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      duplicateStrategy === 'skip'
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-bg-border bg-bg-secondary hover:border-bg-border/80'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'skip'}
                      onChange={() => setDuplicateStrategy('skip')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-semibold text-text-primary">Skip Duplicates (Default)</div>
                      <div className="text-3xs text-text-muted">Keep existing CRM leads; drop duplicate spreadsheet rows</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      duplicateStrategy === 'update'
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-bg-border bg-bg-secondary hover:border-bg-border/80'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'update'}
                      onChange={() => setDuplicateStrategy('update')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-semibold text-text-primary">Update Existing Leads</div>
                      <div className="text-3xs text-text-muted">Merge phone/title/location into existing lead records</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      duplicateStrategy === 'keep_both'
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-bg-border bg-bg-secondary hover:border-bg-border/80'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'keep_both'}
                      onChange={() => setDuplicateStrategy('keep_both')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-semibold text-text-primary">Import as Separate</div>
                      <div className="text-3xs text-text-muted">Create new lead IDs without altering previous records</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Review Filter Tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-bg-border pb-1">
                  <div className="flex items-center gap-1.5 text-2xs">
                    <button
                      type="button"
                      onClick={() => setActiveReviewTab('all')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        activeReviewTab === 'all'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      All Records ({totalCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveReviewTab('valid')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        activeReviewTab === 'valid'
                          ? 'bg-success/20 text-success border border-success/40'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Valid ({validCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveReviewTab('duplicates')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        activeReviewTab === 'duplicates'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Duplicates ({dupCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveReviewTab('errors')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        activeReviewTab === 'errors'
                          ? 'bg-danger/20 text-danger-bright border border-danger/40'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Invalid / Errors ({invalidCount})
                    </button>
                  </div>

                  <label className="flex items-center gap-1.5 text-3xs text-text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipInvalidRows}
                      onChange={e => setSkipInvalidRows(e.target.checked)}
                      className="rounded border-bg-border text-amber-500"
                    />
                    <span>Skip invalid rows on import</span>
                  </label>
                </div>

                {/* Rows Table */}
                <div className="rounded-lg border border-bg-border overflow-hidden bg-bg-secondary/40 text-2xs max-h-48 overflow-y-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-bg-card border-b border-bg-border text-text-muted text-left text-3xs font-semibold">
                      <tr>
                        <th className="p-2 w-10">Row</th>
                        <th className="p-2">Lead</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Status / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bg-border">
                      {displayedRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-text-muted text-2xs">
                            No records in this tab.
                          </td>
                        </tr>
                      ) : (
                        displayedRows.map((r, i) => (
                          <tr key={i} className="hover:bg-bg-hover/50">
                            <td className="p-2 font-mono text-3xs text-text-muted">#{r.rowIndex}</td>
                            <td className="p-2">
                              <div className="font-semibold text-text-primary">{r.mappedData.name}</div>
                              <div className="text-3xs text-text-muted">{r.mappedData.company} · {r.mappedData.jobTitle}</div>
                            </td>
                            <td className="p-2 font-mono text-3xs text-text-secondary">
                              {r.mappedData.phone || <span className="text-danger-bright">Missing</span>}
                            </td>
                            <td className="p-2 font-mono text-3xs text-text-secondary truncate max-w-[130px]">
                              {r.mappedData.email || '—'}
                            </td>
                            <td className="p-2">
                              {r.status === 'VALID' && (
                                <span className="inline-flex items-center gap-1 text-3xs font-semibold text-success">
                                  <CheckCircle2 className="w-3 h-3" /> Valid
                                </span>
                              )}
                              {r.status === 'INVALID' && (
                                <span className="inline-flex items-center gap-1 text-3xs font-semibold text-danger-bright" title={r.errors.join(', ')}>
                                  <AlertCircle className="w-3 h-3" /> {r.errors[0]}
                                </span>
                              )}
                              {r.status === 'WARNING' && (
                                <span className="inline-flex items-center gap-1 text-3xs font-semibold text-amber-400" title={r.duplicateReason || r.warnings.join(', ')}>
                                  <AlertTriangle className="w-3 h-3" /> {r.duplicateReason || r.warnings[0]}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Progress animation during active import */}
              {isExecuting && (
                <div className="p-3 bg-bg-card border border-amber-500/40 rounded-xl space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {importStepText}
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
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between p-4 border-t border-bg-border bg-bg-card/30 shrink-0">
          <div>
            {step === 'mapping' && (
              <button
                type="button"
                onClick={() => setStep('upload')}
                disabled={isExecuting}
                className="btn-secondary text-xs gap-1 py-1.5 px-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            {step === 'validation' && (
              <button
                type="button"
                onClick={() => setStep('mapping')}
                disabled={isExecuting}
                className="btn-secondary text-xs gap-1 py-1.5 px-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Adjust Mapping
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isExecuting}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Cancel
            </button>

            {step === 'mapping' && (
              <button
                type="button"
                onClick={proceedToValidation}
                className="btn-primary text-xs py-1.5 px-4 font-semibold flex items-center gap-1.5"
              >
                <span>Validate & Check Duplicates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 'validation' && (
              <>
                <button
                  type="button"
                  onClick={() => handleImport('PIPELINE')}
                  disabled={isExecuting}
                  className="btn-secondary text-xs py-1.5 px-3.5 font-medium flex items-center gap-1.5 hover:border-amber-500/50"
                  title="Add to Leads without launching campaign immediately"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Import to Leads Pipeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleImport('AI_CALLING_ONLY')}
                  disabled={isExecuting}
                  className="btn-primary text-xs py-1.5 px-4 font-semibold shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                  title="Directly call these uploaded leads, bypassing AI lead discovery completely"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>🚀 AI Calling Only Campaign</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
