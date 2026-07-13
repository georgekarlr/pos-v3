import React, { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ReportService } from '../../services/reportService'
import { SettingsService } from '../../services/settingsService'
import { Terminal, BusinessSettings } from '../../types/settings'
import { EJournalRow } from '../../types/report'
import ReportCard from './ReportCard'
import LoadingSpinner from '../LoadingSpinner'
import { FormatDateTime } from '../../utils/formatDateTime'

const PAGE_SIZE = 25

const todayISO = FormatDateTime.formatLocalTimestampForDatabase(new Date()).slice(0, 10)

// ─── Event-type badge ─────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  Z_READING: 'bg-blue-100 text-blue-700',
  X_READING: 'bg-sky-100 text-sky-700',
  SALE: 'bg-emerald-100 text-emerald-700',
  REFUND: 'bg-red-100 text-red-700',
  LOGIN: 'bg-gray-100 text-gray-600',
  LOGOUT: 'bg-gray-100 text-gray-600',
  VOID: 'bg-orange-100 text-orange-700',
  DISCOUNT: 'bg-purple-100 text-purple-700',
  SETTINGS_CHANGE: 'bg-yellow-100 text-yellow-700',
  COLLECTION: 'bg-teal-100 text-teal-700',
  SYSTEM_UPDATE: 'bg-amber-100 text-amber-700',
  MANUAL_SALE_ENTRY: 'bg-indigo-100 text-indigo-700',
  CASH_IN: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  CASH_OUT: 'bg-rose-100 text-rose-800 border border-rose-200',
}

const EventBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${EVENT_COLORS[type] ?? 'bg-gray-100 text-gray-600'}`}>
    {type.replace(/_/g, ' ')}
  </span>
)

// ─── Main Panel ───────────────────────────────────────────────────────────────

/**
 * EJournalPanel — composable paginated log viewer for the Electronic Journal.
 * Admin-only. Supports filtering by terminal, date range, and free-text search.
 */
const EJournalPanel: React.FC = () => {
  const { persona } = useAuth()

  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [terminalFilter, setTerminalFilter] = useState<number | ''>('')
  const thirtyDaysAgo = FormatDateTime.formatLocalTimestampForDatabase(new Date(Date.now() - 29 * 86400_000)).slice(0, 10)
  const [startDate, setStartDate] = useState(thirtyDaysAgo)
  const [endDate, setEndDate] = useState(todayISO)
  const [search, setSearch] = useState('')

  const [rows, setRows] = useState<EJournalRow[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [terminalLoading, setTerminalLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)

  useEffect(() => {
    SettingsService.getTerminals().then(({ data }) => {
      if (data) setTerminals(data)
      setTerminalLoading(false)
    })
    SettingsService.getBusinessSettings().then(({ data }) => {
      if (data) setBusinessSettings(data)
    })
  }, [])

  const load = useCallback(async (pageNum: number) => {
    if (!persona?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await ReportService.getEJournal({
        requesting_account_id: persona.id,
        limit: PAGE_SIZE + 1, // fetch one extra to detect next page
        offset: pageNum * PAGE_SIZE,
        terminal_id: terminalFilter || null,
        start_date: startDate ? `${startDate}T00:00:00` : null,
        end_date: endDate ? `${endDate}T23:59:59` : null,
      })
      setHasMore(data.length > PAGE_SIZE)
      setRows(data.slice(0, PAGE_SIZE))
      setPage(pageNum)
    } catch (e: any) {
      setError(e?.message || 'Failed to load E-Journal')
    } finally {
      setLoading(false)
    }
  }, [persona?.id, terminalFilter, startDate, endDate])

  // Load first page whenever filters change
  useEffect(() => { load(0) }, [load])

  // Client-side description search (the RPC doesn't support it; the filter is cheap on small pages)
  const filtered = search.trim()
    ? rows.filter(r =>
      r.event_description.toLowerCase().includes(search.toLowerCase()) ||
      r.event_type.toLowerCase().includes(search.toLowerCase()) ||
      r.terminal_name.toLowerCase().includes(search.toLowerCase()) ||
      r.account_name.toLowerCase().includes(search.toLowerCase())
    )
    : rows



  const generateEJournalText = useCallback(() => {
    const starLine = '*'.repeat(70)
    const dashLine = '-'.repeat(70)

    let text = `${starLine}\n`
    text += `ELECTRONIC JOURNAL EXPORT\n`
    text += `Business Name: ${businessSettings?.business_name || 'POS Business Name'}\n`
    text += `TIN: ${businessSettings?.tin || 'TIN NOT SET'}\n`
    text += `MIN: ${businessSettings?.min || 'MIN NOT SET'}\n`
    text += `Date Range: ${startDate || todayISO} 00:00:00 to ${endDate || todayISO} 23:59:59\n`
    text += `Generated By: ${persona?.personName || 'Admin'} (Account ID: ${persona?.id || 1})\n`
    text += `Generated On: ${FormatDateTime.formatLocalTimestampForDatabase(new Date())}\n`
    text += `${starLine}\n\n`

    filtered.forEach(row => {
      text += `${dashLine}\n`
      const eventName = row.event_type === 'LOGIN' ? 'SYSTEM_LOGIN' : row.event_type
      text += `[EVENT: ${eventName}]\n`
      const rawDateTime = FormatDateTime.formatLocalTimestampForDatabase(row.created_at)
      const dateTimeNoMs = rawDateTime.slice(0, 19).replace('T', ' ')
      text += `Date/Time: ${dateTimeNoMs}\n`
      text += `Terminal: ${row.terminal_name}\n`
      text += `User: ${row.account_name}\n`

      const detailsObj = row.details || {}

      if (row.event_type === 'SALE' || row.event_type === 'MANUAL_SALE_ENTRY') {
        const invoiceNo = detailsObj.invoice_number || detailsObj.invoice_no || 'N/A'
        const customerName = detailsObj.customer_name || 'Walk-in'
        text += `Invoice No: ${invoiceNo}\n`
        text += `Customer: ${customerName}\n\n`

        const items = Array.isArray(detailsObj.items) ? detailsObj.items : []
        if (items.length > 0) {
          text += `Items:\n`
          items.forEach((item: any, index: number) => {
            const qtyStr = Number(item.quantity || item.qty || 1).toFixed(3)
            const unit = item.unit_type || 'pc'
            const name = item.product_name || item.name || 'Item'
            const price = Number(item.display_price ?? item.price_at_purchase ?? 0).toFixed(2)
            const rawTaxType = item.tax_type || item.tax_type_at_purchase || 'VAT-Exempt'
            const taxType = rawTaxType === 'VATable' ? 'VATable' : (rawTaxType === 'Zero-Rated' ? 'Zero-Rated' : 'VAT-Exempt')
            const total = Number(item.display_line_total ?? item.line_total ?? (Number(qtyStr) * Number(price))).toFixed(2)
            text += `  ${index + 1}. ${qtyStr} ${unit} - ${name} @ ${price} (${taxType}) = ${total}\n`
          })
          text += `\n`
        }

        const totalDiscounts = Number((detailsObj.sc_pwd_discount || 0)) + Number((detailsObj.regular_discount || 0))
        const totalVat = Number(detailsObj.tax_amount ?? detailsObj.vat_amount ?? 0)

        text += `Totals:\n`
        text += `  Gross Amount:        ${Number(detailsObj.gross_amount || detailsObj.total_amount || detailsObj.subtotal || 0).toFixed(2).padStart(10)}\n`
        text += `  Discounts:           ${totalDiscounts.toFixed(2).padStart(10)}\n`
        text += `  Net Amount:          ${Number(detailsObj.net_amount || detailsObj.total_amount || detailsObj.total || 0).toFixed(2).padStart(10)}\n`
        text += `  Total VAT:           ${totalVat.toFixed(2).padStart(10)}\n`
        if (detailsObj.sc_pwd_id || detailsObj.sc_pwd_name) {
          text += `  SC/PWD ID:           ${(detailsObj.sc_pwd_id || 'N/A')}\n`
          text += `  SC/PWD Name:         ${(detailsObj.sc_pwd_name || 'N/A')}\n`
        }
        if (detailsObj.points_earned || detailsObj.points_redeemed) {
          text += `  Loyalty Earned:      ${Number(detailsObj.points_earned || 0).toFixed(2)}\n`
          text += `  Loyalty Redeemed:    ${Number(detailsObj.points_redeemed || 0).toFixed(2)}\n`
        }
        text += `\n`

        const payments = Array.isArray(detailsObj.payments) ? detailsObj.payments : []
        if (payments.length > 0) {
          text += `Payments:\n`
          payments.forEach((pay: any) => {
            const method = pay.method || pay.payment_method || 'Cash'
            const amount = Number(pay.amount || 0).toFixed(2)
            const refStr = pay.reference || pay.transaction_ref ? ` (Ref: ${pay.reference || pay.transaction_ref})` : ''
            const changeStr = pay.change || detailsObj.change_due ? ` (Change: ${Number(pay.change || detailsObj.change_due).toFixed(2)})` : ''
            text += `  ${method}: ${amount}${changeStr}${refStr}\n`
          })
        } else {
          // Fallback if no payment array
          const method = detailsObj.payment_method || 'Cash'
          const amount = Number(detailsObj.total_tendered || detailsObj.total_amount || 0).toFixed(2)
          const changeStr = detailsObj.change_due ? ` (Change: ${Number(detailsObj.change_due).toFixed(2)})` : ''
          text += `  ${method}: ${amount}${changeStr}\n`
        }
      } else if (row.event_type === 'VOID') {
        const targetInvoice = detailsObj.target_invoice_number || detailsObj.target_invoice_no || 'N/A'
        const reason = detailsObj.reason || row.event_description || 'N/A'
        const amountReversed = Number(detailsObj.amount_reversed || detailsObj.void_amount || 0).toFixed(2)

        text += `Target Invoice No: ${targetInvoice}\n`
        text += `Reason: ${reason}\n\n`
        text += `Void Details:\n`
        text += `  Amount Reversed: ${amountReversed}\n`
        text += `  Status of Invoice ${targetInvoice} changed to VOIDED.\n`
      } else if (row.event_type === 'Z_READING') {
        const detailsText = row.event_description
        const grossSales = Number(detailsObj.gross_sales || detailsObj.GrossSales || 0).toFixed(2)
        const netSales = Number(detailsObj.net_sales || detailsObj.NetSales || 0).toFixed(2)
        const oldGT = Number(detailsObj.old_grand_total || detailsObj.OldCumulative || 0).toFixed(2)
        const newGT = Number(detailsObj.new_grand_total || detailsObj.NewCumulative || 0).toFixed(2)

        text += `Details: ${detailsText}\n\n`
        text += `Summary:\n`
        text += `  Gross Sales:         ${grossSales.padStart(10)} (Excludes voids/refunds)\n`
        text += `  Net Sales:           ${netSales.padStart(10)}\n`
        text += `  Old Grand Total:     ${oldGT.padStart(10)}\n`
        text += `  New Grand Total:     ${newGT.padStart(10)}\n`
      } else if (row.event_type === 'COLLECTION') {
        // Sub-type 1: Installment schedule payment (pos2_pay_installment_schedule)
        //   details: { contract_id, amount_paid, method, months_affected[] }
        // Sub-type 2: Installment bad-debt recovery (pos2_recover_installment_debt)
        //   details: { contract_id, amount_recovered, method, notes }
        // Sub-type 3: Running-tab PAYMENT or DEPOSIT (pos2_manage_debt_account)
        //   details: { amount, method }
        // Sub-type 4: Running-tab WITHDRAW_DEPOSIT
        //   details: { amount_withdrawn, method }
        // Sub-type 5: Running-tab RECOVER_DEBT
        //   details: { amount_recovered, method }

        const method = detailsObj.method || 'N/A'
        text += `Payment Method: ${method}\n`
        text += `Description: ${row.event_description}\n`

        if (detailsObj.contract_id != null && detailsObj.amount_recovered != null) {
          // Installment bad-debt recovery — has BOTH contract_id and amount_recovered
          text += `Contract ID: ${detailsObj.contract_id}\n`
          text += `Amount Recovered: ${Number(detailsObj.amount_recovered).toFixed(2)}\n`
          if (detailsObj.notes) {
            text += `Notes: ${detailsObj.notes}\n`
          }
        } else if (detailsObj.contract_id != null && detailsObj.amount_paid != null) {
          // Installment schedule payment — has contract_id and amount_paid + months breakdown
          const amountPaid = Number(detailsObj.amount_paid || 0).toFixed(2)
          const monthsAffected: Array<{ month: number; amount_applied: number; new_status: string }> =
            Array.isArray(detailsObj.months_affected) ? detailsObj.months_affected : []

          text += `Contract ID: ${detailsObj.contract_id}\n`
          text += `Amount Collected: ${amountPaid}\n`

          if (monthsAffected.length > 0) {
            text += `\nMonths Affected:\n`
            monthsAffected.forEach((m) => {
              const applied = Number(m.amount_applied || 0).toFixed(2)
              text += `  Month ${m.month}: ${applied} applied — Status: ${(m.new_status || '').toUpperCase()}\n`
            })
          }
        } else if (detailsObj.amount_withdrawn != null) {
          // Running-tab deposit withdrawal
          text += `Amount Withdrawn: ${Number(detailsObj.amount_withdrawn).toFixed(2)}\n`
        } else if (detailsObj.amount_recovered != null) {
          // Running-tab bad-debt recovery (no contract_id)
          text += `Amount Recovered: ${Number(detailsObj.amount_recovered).toFixed(2)}\n`
        } else if (detailsObj.amount != null) {
          // Running-tab payment or deposit
          text += `Amount Received: ${Number(detailsObj.amount).toFixed(2)}\n`
        }
      } else if (row.event_type === 'SYSTEM_UPDATE') {
        // Sub-type 1: Running-tab bad-debt write-off (pos2_manage_debt_account WRITE_OFF)
        //   details: { amount_written_off, reason }
        // Sub-type 2: Installment contract write-off (pos2_write_off_installment_contract)
        //   details: { contract_id, amount_written_off, schedules_defaulted, reason }
        text += `Details: ${row.event_description}\n`

        if (detailsObj.amount_written_off != null) {
          text += `\nWrite-Off Summary:\n`
          if (detailsObj.contract_id != null) {
            text += `  Contract ID: ${detailsObj.contract_id}\n`
          }
          text += `  Amount Written Off: ${Number(detailsObj.amount_written_off).toFixed(2)}\n`
          if (detailsObj.schedules_defaulted != null) {
            text += `  Schedules Defaulted: ${detailsObj.schedules_defaulted}\n`
          }
          if (detailsObj.reason) {
            text += `  Reason: ${detailsObj.reason}\n`
          }
        }
      } else if (row.event_type === 'CASH_IN' || row.event_type === 'CASH_OUT') {
        const amt = Number(detailsObj.amount || 0).toFixed(2)
        text += `Type: ${row.event_type === 'CASH_IN' ? 'Cash In (Drawer Float)' : 'Cash Out (Expense/Drop)'}\n`
        text += `Amount: PHP ${amt}\n`
        text += `Reason/Description: ${row.event_description || 'N/A'}\n`
      } else {
        text += `Details: ${row.event_description}\n`
      }

      text += `${dashLine}\n\n`
    })

    text += `${starLine}\n`
    text += `END OF EXPORT\n`
    text += `${starLine}\n`

    return text
  }, [filtered, businessSettings, startDate, endDate, persona])

  const handleExportTxt = () => {
    try {
      const text = generateEJournalText()
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `ejournal-${startDate}-to-${endDate}.txt`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export e-journal txt', err)
    }
  }

  return (
    <div className="space-y-5">
      <ReportCard
        title="Electronic Journal"
        subtitle="Full audit trail of all POS events. Admin access only."
        badge="Audit Log"
        badgeVariant="blue"
        printTargetId="e-journal-printout"
      >
        {/* Filter row */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Terminal */}
          {terminalLoading ? (
            <div className="h-9 w-40 bg-gray-100 animate-pulse rounded-lg" />
          ) : (
            <select
              id="ejournal-terminal"
              value={terminalFilter}
              onChange={e => setTerminalFilter(e.target.value ? Number(e.target.value) : '')}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 min-w-[10rem]"
            >
              <option value="">All Terminals</option>
              {terminals.map(t => (
                <option key={t.terminal_id} value={t.terminal_id}>{t.terminal_name}</option>
              ))}
            </select>
          )}

          {/* Start date */}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-gray-500">From</label>
            <input
              id="ejournal-start"
              type="date"
              value={startDate}
              max={endDate}
              onChange={e => setStartDate(e.target.value)}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
            />
          </div>

          {/* End date */}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-gray-500">To</label>
            <input
              id="ejournal-end"
              type="date"
              value={endDate}
              min={startDate}
              max={todayISO}
              onChange={e => setEndDate(e.target.value)}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
            />
          </div>

          {/* Search */}
          <div className="flex items-end relative">
            <Search className="absolute left-3 bottom-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              id="ejournal-search"
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[10rem]"
            />
          </div>

          {/* Refresh */}
          <div className="flex items-end">
            <button
              id="ejournal-refresh"
              onClick={() => load(page)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Export Text */}
          <div className="flex items-end">
            <button
              id="ejournal-export-txt"
              onClick={handleExportTxt}
              disabled={loading || rows.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 border border-blue-200 bg-blue-50/50 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Export TXT
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-10 flex justify-center"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-5">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-5 py-3 font-medium">Timestamp</th>
                    <th className="px-5 py-3 font-medium">Terminal</th>
                    <th className="px-5 py-3 font-medium">Account</th>
                    <th className="px-5 py-3 font-medium">Event</th>
                    <th className="px-5 py-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr
                      key={row.log_id}
                      className="border-t border-gray-50 hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="px-5 py-2.5 whitespace-nowrap text-gray-500 font-mono text-xs">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-2.5 whitespace-nowrap text-gray-700">{row.terminal_name}</td>
                      <td className="px-5 py-2.5 whitespace-nowrap text-gray-700">{row.account_name}</td>
                      <td className="px-5 py-2.5 whitespace-nowrap">
                        <EventBadge type={row.event_type} />
                      </td>
                      <td className="px-5 py-2.5 text-gray-600 max-w-xs truncate">{row.event_description}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                        No journal entries found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Page {page + 1} · Showing {filtered.length} of {rows.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  id="ejournal-prev"
                  onClick={() => load(page - 1)}
                  disabled={page === 0 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  id="ejournal-next"
                  onClick={() => load(page + 1)}
                  disabled={!hasMore || loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </ReportCard>

      <pre id="e-journal-printout" className="hidden font-mono text-xs whitespace-pre bg-white p-4 select-all">
        {generateEJournalText()}
      </pre>
    </div>
  )
}

export default EJournalPanel
