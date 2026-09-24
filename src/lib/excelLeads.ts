import * as XLSX from 'xlsx'
import type { Lead, IntentLevel, LeadStatus, LeadSource } from '@/data/leads'
import { detectLanguageFromLocation, type SupportedLanguage } from '@/lib/languages'

export interface RawSpreadsheetData {
  sheetNames: string[]
  activeSheet: string
  headers: string[]
  rows: Record<string, any>[]
  totalRows: number
}

export interface FieldMapping {
  name?: string
  firstName?: string
  lastName?: string
  company?: string
  email?: string
  phone?: string
  jobTitle?: string
  industry?: string
  location?: string
  requirement?: string
}

export type RowValidationStatus = 'VALID' | 'WARNING' | 'INVALID'

export interface ValidatedLeadRow {
  rowIndex: number
  originalData: Record<string, any>
  mappedData: {
    name: string
    company: string
    email: string
    phone: string
    jobTitle: string
    industry: string
    location: string
    requirement: string
    detectedLanguage: SupportedLanguage
  }
  status: RowValidationStatus
  errors: string[]
  warnings: string[]
  isInternalDuplicate: boolean
  isExistingDuplicate: boolean
  duplicateReason?: string
  existingLeadId?: string
}

export interface SpreadsheetValidationSummary {
  total: number
  valid: number
  warnings: number
  invalid: number
  internalDuplicates: number
  existingDuplicates: number
  rows: ValidatedLeadRow[]
}

export type DuplicateStrategy = 'skip' | 'update' | 'keep_both'

/**
 * Parses any uploaded Excel (.xlsx, .xls) or CSV (.csv, .tsv, .txt) file into raw rows and headers.
 * Handles diverse delimiters, encodings, and arbitrary column layouts.
 */
export async function parseSpreadsheetFile(file: File): Promise<RawSpreadsheetData> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })

  const sheetNames = workbook.SheetNames
  if (sheetNames.length === 0) {
    throw new Error('No sheets found in the uploaded file.')
  }

  const activeSheetName = sheetNames[0]
  const worksheet = workbook.Sheets[activeSheetName]

  // Convert sheet to JSON with raw strings
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  }) as any[][]

  if (jsonData.length === 0) {
    throw new Error('The spreadsheet is empty.')
  }

  // Find header row (first non-empty row)
  let headerRowIndex = 0
  while (headerRowIndex < jsonData.length && (!jsonData[headerRowIndex] || jsonData[headerRowIndex].length === 0)) {
    headerRowIndex++
  }

  if (headerRowIndex >= jsonData.length) {
    throw new Error('No valid header row could be found in the file.')
  }

  const rawHeaders = (jsonData[headerRowIndex] || []).map((h: any, i: number) => {
    const str = String(h ?? '').trim()
    return str || `Column_${i + 1}`
  })

  // Extract data rows
  const rows: Record<string, any>[] = []
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const rowValues = jsonData[i]
    if (!rowValues || rowValues.every((val: any) => String(val ?? '').trim() === '')) {
      continue // Skip completely blank lines
    }

    const rowObj: Record<string, any> = {}
    rawHeaders.forEach((header: string, colIdx: number) => {
      let val = rowValues[colIdx]
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0]
      } else if (val !== null && val !== undefined) {
        val = String(val).trim()
      } else {
        val = ''
      }
      rowObj[header] = val
    })
    rows.push(rowObj)
  }

  return {
    sheetNames,
    activeSheet: activeSheetName,
    headers: rawHeaders,
    rows,
    totalRows: rows.length,
  }
}

/**
 * Intelligent auto-mapping heuristics for arbitrary CSV/Excel headers.
 * Matches synonyms, partial words, case-insensitive variations.
 */
export function autoDetectFieldMapping(headers: string[]): FieldMapping {
  const mapping: FieldMapping = {}

  const findHeader = (synonyms: string[]): string | undefined => {
    return headers.find(h => {
      const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '')
      return synonyms.some(syn => {
        const cleanSyn = syn.toLowerCase().replace(/[^a-z0-9]/g, '')
        return clean === cleanSyn || clean.includes(cleanSyn)
      })
    })
  }

  // Exact or high-confidence matching
  mapping.name = findHeader(['name', 'fullname', 'full_name', 'contact_name', 'lead_name', 'prospect', 'person', 'client'])
  mapping.firstName = findHeader(['first_name', 'firstname', 'fname', 'first'])
  mapping.lastName = findHeader(['last_name', 'lastname', 'lname', 'last', 'surname'])

  mapping.company = findHeader(['company', 'company_name', 'organization', 'organisation', 'org', 'business', 'account', 'employer', 'corp'])
  mapping.email = findHeader(['email', 'e-mail', 'email_address', 'work_email', 'corporate_email', 'mail'])
  mapping.phone = findHeader(['phone', 'phone_number', 'mobile', 'mobile_number', 'contact_number', 'cell', 'telephone', 'tel'])
  mapping.jobTitle = findHeader(['job_title', 'jobtitle', 'title', 'role', 'designation', 'position', 'occupation', 'profession'])
  mapping.industry = findHeader(['industry', 'sector', 'domain', 'vertical', 'business_vertical', 'category'])
  mapping.location = findHeader(['location', 'city', 'state', 'country', 'address', 'region', 'headquarters', 'geo'])
  mapping.requirement = findHeader(['requirement', 'requirements', 'notes', 'comments', 'need', 'pain_point', 'description', 'details'])

  return mapping
}

/**
 * Normalizes phone numbers for duplicate comparison and voice dialer.
 * Strips formatting while preserving country prefix (+).
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''
  let cleaned = phone.trim().replace(/[^\d+]/g, '')
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2)
  }
  return cleaned
}

/**
 * Email validation regex (RFC-compliant standard check)
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return re.test(email.trim())
}

/**
 * Validates phone numbers (at least 7 digits, maximum 16 digits)
 */
export function isValidPhone(phone: string): boolean {
  const norm = normalizePhoneNumber(phone)
  const digits = norm.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 16
}

/**
 * Validates rows, checks email/phone validity, identifies internal and platform duplicates.
 */
export function validateLeadRows(
  rows: Record<string, any>[],
  mapping: FieldMapping,
  existingLeads: Lead[]
): SpreadsheetValidationSummary {
  const seenEmails = new Set<string>()
  const seenPhones = new Set<string>()

  // Build lookup index of existing leads for fast duplicate identification
  const existingEmailMap = new Map<string, Lead>()
  const existingPhoneMap = new Map<string, Lead>()

  existingLeads.forEach(lead => {
    if (lead.email) {
      existingEmailMap.set(lead.email.toLowerCase().trim(), lead)
    }
    if (lead.phone) {
      const norm = normalizePhoneNumber(lead.phone)
      if (norm) existingPhoneMap.set(norm, lead)
    }
  })

  let validCount = 0
  let warningCount = 0
  let invalidCount = 0
  let internalDupCount = 0
  let existingDupCount = 0

  const validatedRows: ValidatedLeadRow[] = rows.map((row, index) => {
    const errors: string[] = []
    const warnings: string[] = []

    // 1. Resolve Name
    let name = ''
    if (mapping.name && row[mapping.name]) {
      name = String(row[mapping.name]).trim()
    } else {
      const fn = mapping.firstName && row[mapping.firstName] ? String(row[mapping.firstName]).trim() : ''
      const ln = mapping.lastName && row[mapping.lastName] ? String(row[mapping.lastName]).trim() : ''
      name = `${fn} ${ln}`.trim()
    }

    if (!name) {
      errors.push('Missing contact name')
    }

    // 2. Resolve Company
    const company = mapping.company && row[mapping.company]
      ? String(row[mapping.company]).trim()
      : ''
    if (!company) {
      warnings.push('Company is empty; defaulted to "Independent / Unspecified"')
    }

    // 3. Resolve Email
    const email = mapping.email && row[mapping.email]
      ? String(row[mapping.email]).trim()
      : ''
    if (email) {
      if (!isValidEmail(email)) {
        errors.push(`Invalid email format: "${email}"`)
      }
    } else {
      warnings.push('Missing email address')
    }

    // 4. Resolve Phone
    const phone = mapping.phone && row[mapping.phone]
      ? String(row[mapping.phone]).trim()
      : ''
    if (phone) {
      if (!isValidPhone(phone)) {
        warnings.push(`Phone number may have invalid digits or country code: "${phone}"`)
      }
    } else {
      warnings.push('Missing phone number (AI calling will require manual entry)')
    }

    // 5. Must have at least one communication channel (phone or email)
    if (!email && !phone) {
      errors.push('Must provide at least an Email address or a Phone number')
    }

    // 6. Other attributes
    const jobTitle = mapping.jobTitle && row[mapping.jobTitle]
      ? String(row[mapping.jobTitle]).trim()
      : 'Decision Maker'
    const industry = mapping.industry && row[mapping.industry]
      ? String(row[mapping.industry]).trim()
      : 'Technology & Enterprise'
    const location = mapping.location && row[mapping.location]
      ? String(row[mapping.location]).trim()
      : 'Global'
    const requirement = mapping.requirement && row[mapping.requirement]
      ? String(row[mapping.requirement]).trim()
      : 'Imported via CSV/Excel custom lead list. Ready for autonomous AI calling.'

    // Language detection
    const detectedLang = detectLanguageFromLocation(location, name).primary

    // 7. Duplicate Checks
    let isInternalDuplicate = false
    let isExistingDuplicate = false
    let duplicateReason: string | undefined
    let existingLeadId: string | undefined

    const normEmail = email ? email.toLowerCase().trim() : ''
    const normPhone = phone ? normalizePhoneNumber(phone) : ''

    // Internal duplicate check (same file)
    if (normEmail && seenEmails.has(normEmail)) {
      isInternalDuplicate = true
      duplicateReason = `Duplicate email within file (${normEmail})`
    } else if (normPhone && seenPhones.has(normPhone)) {
      isInternalDuplicate = true
      duplicateReason = `Duplicate phone within file (${normPhone})`
    }

    if (normEmail) seenEmails.add(normEmail)
    if (normPhone) seenPhones.add(normPhone)

    // Existing platform lead duplicate check
    if (!isInternalDuplicate) {
      if (normEmail && existingEmailMap.has(normEmail)) {
        isExistingDuplicate = true
        const existing = existingEmailMap.get(normEmail)!
        existingLeadId = existing.id
        duplicateReason = `Matches existing lead: ${existing.name} (${existing.company})`
      } else if (normPhone && existingPhoneMap.has(normPhone)) {
        isExistingDuplicate = true
        const existing = existingPhoneMap.get(normPhone)!
        existingLeadId = existing.id
        duplicateReason = `Matches existing phone: ${existing.name} (${existing.company})`
      }
    }

    if (isInternalDuplicate) internalDupCount++
    if (isExistingDuplicate) existingDupCount++

    // Determine status
    let status: RowValidationStatus = 'VALID'
    if (errors.length > 0) {
      status = 'INVALID'
      invalidCount++
    } else if (warnings.length > 0 || isInternalDuplicate || isExistingDuplicate) {
      status = 'WARNING'
      warningCount++
    } else {
      validCount++
    }

    return {
      rowIndex: index + 1,
      originalData: row,
      mappedData: {
        name,
        company: company || 'Independent / Unspecified',
        email,
        phone,
        jobTitle,
        industry,
        location,
        requirement,
        detectedLanguage: detectedLang,
      },
      status,
      errors,
      warnings,
      isInternalDuplicate,
      isExistingDuplicate,
      duplicateReason,
      existingLeadId,
    }
  })

  return {
    total: rows.length,
    valid: validCount,
    warnings: warningCount,
    invalid: invalidCount,
    internalDuplicates: internalDupCount,
    existingDuplicates: existingDupCount,
    rows: validatedRows,
  }
}

/**
 * Transforms validated rows into full Lead objects based on selected duplicate strategy.
 */
export function buildLeadsFromValidatedRows(
  validatedRows: ValidatedLeadRow[],
  strategy: DuplicateStrategy,
  options: {
    sourceUrl?: string
    isAiCallingOnly?: boolean
    campaignId?: string
    tags?: string[]
  } = {}
): {
  newLeads: Partial<Lead>[]
  updatedLeadMap: Map<string, Partial<Lead>>
  skippedCount: number
} {
  const newLeads: Partial<Lead>[] = []
  const updatedLeadMap = new Map<string, Partial<Lead>>()
  let skippedCount = 0

  for (const item of validatedRows) {
    // If invalid, skip
    if (item.status === 'INVALID') {
      skippedCount++
      continue
    }

    // If duplicate within file, skip subsequent occurrences
    if (item.isInternalDuplicate) {
      skippedCount++
      continue
    }

    // Existing duplicate handling
    if (item.isExistingDuplicate && item.existingLeadId) {
      if (strategy === 'skip') {
        skippedCount++
        continue
      } else if (strategy === 'update') {
        // Merge newer data
        const updates: Partial<Lead> = {
          name: item.mappedData.name,
          company: item.mappedData.company,
          jobTitle: item.mappedData.jobTitle,
          industry: item.mappedData.industry,
          location: item.mappedData.location,
          primaryLanguage: item.mappedData.detectedLanguage,
          lastActivity: new Date(),
        }
        if (item.mappedData.email) updates.email = item.mappedData.email
        if (item.mappedData.phone) updates.phone = item.mappedData.phone
        if (item.mappedData.requirement) updates.requirement = item.mappedData.requirement
        if (options.campaignId) updates.campaignId = options.campaignId

        updatedLeadMap.set(item.existingLeadId, updates)
        continue
      }
      // If 'keep_both', proceed to create new record below
    }

    // Build new Lead
    const lead: Partial<Lead> = {
      id: `LEAD-IMP-${Date.now()}-${item.rowIndex}`,
      name: item.mappedData.name,
      company: item.mappedData.company,
      email: item.mappedData.email,
      phone: item.mappedData.phone,
      jobTitle: item.mappedData.jobTitle,
      industry: item.mappedData.industry,
      location: item.mappedData.location,
      country: item.mappedData.location.includes(',')
        ? item.mappedData.location.split(',')[1].trim()
        : 'Global',
      primaryLanguage: item.mappedData.detectedLanguage,
      intent: 'HIGH',
      intentScore: Math.floor(Math.random() * 15) + 82, // 82 - 96
      status: 'NEW',
      source: 'CSV / Excel Import' as LeadSource,
      sourceUrl: options.sourceUrl || 'Spreadsheet Upload',
      discoveredAt: new Date(),
      enrichedAt: null,
      lastActivity: new Date(),
      requirement: item.mappedData.requirement,
      aiReasoning: options.isAiCallingOnly
        ? 'Directly uploaded for AI Voice Calling outreach. Web discovery bypassed.'
        : 'Ingested from customer spreadsheet with auto-detected multilingual parameters.',
      aiRecommendations: [
        'Initiate introductory AI voice qualification call',
        'Verify corporate email delivery and phone connectivity',
      ],
      budgetSignal: 'HIGH',
      timeline: 'Immediate / Active',
      decisionMaker: true,
      tags: options.tags || (options.isAiCallingOnly ? ['AI Calling Only', 'Direct Upload'] : ['Spreadsheet Import']),
      techStack: ['CRM Connector'],
      competitors: [],
      needClarity: 85,
      urgency: 80,
      budgetScore: 82,
      authorityScore: 86,
      fitScore: 88,
      campaignId: options.campaignId || null,
      linkedin: `https://linkedin.com/search/results/all/?keywords=${encodeURIComponent(item.mappedData.name + ' ' + item.mappedData.company)}`,
      website: `https://${item.mappedData.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      companySize: '50-500 employees',
      employees: 210,
      funding: 'Series A/B',
      hiringStatus: 'Actively Hiring',
      nextAction: options.isAiCallingOnly ? 'Queue in AI Voice Agent' : 'Ready for AI Voice Outreach',
    }

    newLeads.push(lead)
  }

  return { newLeads, updatedLeadMap, skippedCount }
}

/**
 * Native Excel (.xlsx) file exporter using SheetJS
 */
export function exportLeadsToExcel(filename: string, leads: Lead[], columns?: { key: keyof Lead | string; label: string }[]): void {
  const headers = columns && columns.length > 0
    ? columns
    : [
        { key: 'name', label: 'Name' },
        { key: 'company', label: 'Company' },
        { key: 'jobTitle', label: 'Job Title' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'industry', label: 'Industry' },
        { key: 'location', label: 'Location' },
        { key: 'primaryLanguage', label: 'Language' },
        { key: 'status', label: 'Status' },
        { key: 'intent', label: 'Intent' },
        { key: 'intentScore', label: 'Intent Score' },
        { key: 'source', label: 'Source' },
        { key: 'requirement', label: 'Requirement' },
      ]

  const dataRows = leads.map(lead => {
    const rowObj: Record<string, any> = {}
    headers.forEach(h => {
      let val = (lead as any)[h.key]
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0]
      } else if (Array.isArray(val)) {
        val = val.join(', ')
      } else if (val === null || val === undefined) {
        val = ''
      }
      rowObj[h.label] = val
    })
    return rowObj
  })

  const worksheet = XLSX.utils.json_to_sheet(dataRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')

  const finalName = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(workbook, finalName)
}

/**
 * Native CSV (.csv) file exporter with UTF-8 BOM
 */
export function exportLeadsToCSV(filename: string, leads: Lead[], columns?: { key: keyof Lead | string; label: string }[]): void {
  const headers = columns && columns.length > 0
    ? columns
    : [
        { key: 'name', label: 'Name' },
        { key: 'company', label: 'Company' },
        { key: 'jobTitle', label: 'Job Title' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'industry', label: 'Industry' },
        { key: 'location', label: 'Location' },
        { key: 'primaryLanguage', label: 'Language' },
        { key: 'status', label: 'Status' },
        { key: 'intent', label: 'Intent' },
        { key: 'intentScore', label: 'Intent Score' },
        { key: 'source', label: 'Source' },
      ]

  const dataRows = leads.map(lead => {
    const rowObj: Record<string, any> = {}
    headers.forEach(h => {
      let val = (lead as any)[h.key]
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0]
      } else if (Array.isArray(val)) {
        val = val.join(', ')
      } else if (val === null || val === undefined) {
        val = ''
      }
      rowObj[h.label] = val
    })
    return rowObj
  })

  const worksheet = XLSX.utils.json_to_sheet(dataRows)
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet)
  const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Downloads the standardized Callisto template as Excel (.xlsx) or CSV (.csv)
 * Identical structure to callisto_leads_import_template.xlsx
 */
export function downloadCallistoTemplate(format: 'xlsx' | 'csv' = 'xlsx'): void {
  const sampleTemplateRows = [
    {
      'Name': 'Rahul Mehta',
      'Company': 'Acme Digital Solutions',
      'Email': 'rahul.mehta@acmedigital.com',
      'Phone': '+91 98201 44892',
      'Job Title': 'VP of Technology',
      'Industry': 'IT & Cloud Services',
      'Location': 'Bangalore, India',
    },
    {
      'Name': 'Sarah Johnson',
      'Company': 'NexaFinance Corp',
      'Email': 'sarah.j@nexafinance.com',
      'Phone': '+1 (415) 892-0192',
      'Job Title': 'Head of Inside Sales',
      'Industry': 'FinTech & Banking',
      'Location': 'San Francisco, USA',
    },
    {
      'Name': 'Kavitha Reddy',
      'Company': 'Bharat Insurance Group',
      'Email': 'kavitha.r@bharatinsure.com',
      'Phone': '+91 94401 22819',
      'Job Title': 'Director of Customer Operations',
      'Industry': 'Insurance',
      'Location': 'Hyderabad, India',
    },
    {
      'Name': 'Oliver Schmidt',
      'Company': 'Deutech Manufacturing',
      'Email': 'oliver.s@deutech.de',
      'Phone': '+49 89 2039 4810',
      'Job Title': 'Chief Digital Officer',
      'Industry': 'Industrial IoT',
      'Location': 'Munich, Germany',
    },
    {
      'Name': 'Mohammed Al-Rashidi',
      'Company': 'Emirates Future Tech',
      'Email': 'mohammed@emiratesft.ae',
      'Phone': '+971 4 391 0022',
      'Job Title': 'VP Business Development',
      'Industry': 'Enterprise Software',
      'Location': 'Dubai, UAE',
    },
    {
      'Name': 'Aarav Sharma',
      'Company': 'NovaByte Solutions',
      'Email': 'aarav.sharma@example.com',
      'Phone': '+91 90000 10001',
      'Job Title': 'Founder & CEO',
      'Industry': 'Software & IT',
      'Location': 'Ahmedabad, India',
    },
    {
      'Name': 'Riya Patel',
      'Company': 'PixelCraft Studio',
      'Email': 'riya.patel@example.com',
      'Phone': '+91 90000 10002',
      'Job Title': 'Creative Director',
      'Industry': 'Design & Creative',
      'Location': 'Mumbai, India',
    },
    {
      'Name': 'Karan Mehta',
      'Company': 'GrowthSphere Media',
      'Email': 'karan.mehta@example.com',
      'Phone': '+91 90000 10003',
      'Job Title': 'Marketing Manager',
      'Industry': 'Digital Marketing',
      'Location': 'Bengaluru, India',
    },
    {
      'Name': 'Ananya Shah',
      'Company': 'FinEdge Technologies',
      'Email': 'ananya.shah@example.com',
      'Phone': '+91 90000 10004',
      'Job Title': 'Product Manager',
      'Industry': 'FinTech',
      'Location': 'Pune, India',
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(sampleTemplateRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'callisto_leads_import_template')

  if (format === 'xlsx') {
    XLSX.writeFile(workbook, 'callisto_leads_import_template.xlsx')
  } else {
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet)
    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'callisto_leads_import_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
