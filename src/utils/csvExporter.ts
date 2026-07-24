import { getCachedBusinessSettings } from './settingsCache'

export interface CSVExportOptions {
  filename: string
  title: string
  headers: string[]
  rows: (string | number | boolean | null | undefined)[][]
  startDate?: string
  endDate?: string
  includeStoreHeader?: boolean
}

/**
 * Escapes a single cell value for CSV formatting according to RFC 4180 rules.
 */
export function escapeCSVCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Exports tabular data to a CSV file with a receipt-style business header.
 * Each header row is padded with empty cells up to the total column count,
 * effectively merging the cell across to the end of the column like a receipt when opened in spreadsheet applications.
 */
export function exportToCSV({
  filename,
  title,
  headers,
  rows,
  startDate,
  endDate,
  includeStoreHeader = true
}: CSVExportOptions): void {
  const columnCount = Math.max(headers.length, ...rows.map(r => r.length), 1)
  const settings = getCachedBusinessSettings(true)

  const csvLines: string[] = []

  // Helper to format a single line spanning across all columns (cell merging like a receipt)
  const addSpanningHeaderRow = (text: string) => {
    const cells = [text, ...Array(columnCount - 1).fill('')]
    csvLines.push(cells.map(escapeCSVCell).join(','))
  }

  if (includeStoreHeader) {
    // 1. Business Name
    const storeName = settings?.business_name?.trim() || 'Point of Sale'
    addSpanningHeaderRow(storeName)

    // 2. Address
    if (settings?.address?.trim()) {
      addSpanningHeaderRow(settings.address.trim())
    }

    // 3. Tax Registration & TIN
    if (settings?.tin?.trim()) {
      const vatStatus = settings.is_vat_registered === false ? 'NON-VAT Reg TIN' : 'VAT Reg TIN'
      addSpanningHeaderRow(`${vatStatus}: ${settings.tin.trim()}`)
    }

    // 4. MIN (Machine Identification Number)
    if (settings?.min?.trim()) {
      addSpanningHeaderRow(`MIN: ${settings.min.trim()}`)
    }

    // 5. PTU Number
    if (settings?.ptu_number?.trim()) {
      addSpanningHeaderRow(`PTU No: ${settings.ptu_number.trim()}`)
    }

    // 6. Report Title
    addSpanningHeaderRow(`Report: ${title}`)

    // 7. Date Range / Period
    if (startDate && endDate) {
      addSpanningHeaderRow(`Period: ${startDate} to ${endDate}`)
    } else if (startDate) {
      addSpanningHeaderRow(`Date: ${startDate}`)
    }

    // 8. Timestamp
    const now = new Date()
    const timestampStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
    addSpanningHeaderRow(`Exported: ${timestampStr}`)

    // Blank separator row (spanning end of column)
    addSpanningHeaderRow('')
  }

  // Data Table Headers
  csvLines.push(headers.map(escapeCSVCell).join(','))

  // Data Table Rows
  rows.forEach(row => {
    csvLines.push(row.map(escapeCSVCell).join(','))
  })

  const csvContent = csvLines.join('\n')
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
}
