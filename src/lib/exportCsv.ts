import { maskSensitiveRecord } from './security'

/**
 * Utility to convert an array of objects into a formatted CSV file and trigger download.
 * Enforces field-level masking for sensitive operational data (phone, email, IP, secrets)
 * per enterprise data privacy regulations (GDPR, DPDP Act 2023).
 */
export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  data: T[],
  columns?: { key: keyof T | string; label: string }[],
  options: { maskSensitiveFields?: boolean } = { maskSensitiveFields: true }
): boolean {
  if (!data || data.length === 0) return false

  // Apply field-level masking if enabled
  const processedData = options.maskSensitiveFields
    ? data.map(item => maskSensitiveRecord(item, true))
    : data

  // Determine headers
  const headers = columns && columns.length > 0
    ? columns
    : Object.keys(processedData[0]).map(k => ({ key: k, label: k.toUpperCase() }))

  // Helper to format values cleanly for CSV
  function formatValue(val: any): string {
    if (val === null || val === undefined) return ''
    if (val instanceof Date) return val.toLocaleString()
    if (Array.isArray(val)) return val.join('; ')
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }

  function escapeCSV(str: string): string {
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return `"${str}"`
  }

  const headerRow = headers.map(h => escapeCSV(h.label)).join(',')

  const dataRows = processedData.map(row => {
    return headers
      .map(h => {
        const val = row[h.key as keyof T]
        return escapeCSV(formatValue(val))
      })
      .join(',')
  })

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return true
}
