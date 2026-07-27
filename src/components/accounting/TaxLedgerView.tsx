import React, { useState, useMemo } from 'react'
import { BIRTaxLedgerRow, BIRTaxLedgerSummary } from '../../types/accounting'
import { exportToCSV } from '../../utils/csvExporter'
import { Download, Printer, Search, Filter } from 'lucide-react'

interface TaxLedgerViewProps {
  rows: BIRTaxLedgerRow[]
  /** Server-side KPI summary from pos2_get_bir_tax_ledger */
  summary: BIRTaxLedgerSummary | null
  startDate: string
  endDate: string
  loading?: boolean
}

const formatCurrency = (val: number | undefined | null) => {
  const num = val ?? 0
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export const TaxLedgerView: React.FC<TaxLedgerViewProps> = ({
  rows,
  summary,
  startDate,
  endDate,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTerminal, setSelectedTerminal] = useState<string>('ALL')

  // Extract unique terminal names for filtering
  const terminalList = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => {
      if (r.terminal_name) set.add(r.terminal_name)
    })
    return Array.from(set)
  }, [rows])

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        !searchTerm.trim() ||
        r.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.terminal_name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchTerminal =
        selectedTerminal === 'ALL' || r.terminal_name === selectedTerminal

      return matchSearch && matchTerminal
    })
  }, [rows, searchTerm, selectedTerminal])

  // Aggregate Totals (for the table footer only — KPI cards use server summary)
  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => {
        acc.gross += Number(r.gross_amount || 0)
        acc.vatable += Number(r.vatable_sales || 0)
        acc.grossVat += Number(r.gross_vat_amount || 0)
        acc.refundVat += Number(r.refund_vat_amount || 0)
        acc.netVat += Number(r.net_vat_amount || 0)
        acc.vatExempt += Number(r.vat_exempt_sales || 0)
        acc.zeroRated += Number(r.zero_rated_sales || 0)
        acc.scPwd += Number(r.sc_pwd_discount || 0)
        acc.promo += Number(r.promo_discount || 0)
        acc.refund += Number(r.refund_amount || 0)
        acc.netTaxable += Number(r.net_taxable_sales || 0)
        return acc
      },
      {
        gross: 0,
        vatable: 0,
        grossVat: 0,
        refundVat: 0,
        netVat: 0,
        vatExempt: 0,
        zeroRated: 0,
        scPwd: 0,
        promo: 0,
        refund: 0,
        netTaxable: 0,
      }
    )
  }, [filteredRows])

  const handleExportCSV = () => {
    const csvRows = filteredRows.map((r) => [
      r.invoice_number,
      formatDate(r.invoice_date),
      r.terminal_name,
      r.customer_name,
      r.order_status,
      r.gross_amount,
      r.vatable_sales,
      r.gross_vat_amount,
      r.refund_vat_amount,
      r.net_vat_amount,
      r.vat_exempt_sales,
      r.zero_rated_sales,
      r.sc_pwd_discount,
      r.promo_discount,
      r.refund_amount,
      r.net_taxable_sales,
    ])

    // Append Totals row
    csvRows.push([
      'TOTALS',
      '',
      '',
      '',
      '',
      totals.gross,
      totals.vatable,
      totals.grossVat,
      totals.refundVat,
      totals.netVat,
      totals.vatExempt,
      totals.zeroRated,
      totals.scPwd,
      totals.promo,
      totals.refund,
      totals.netTaxable,
    ])

    exportToCSV({
      filename: `BIR_Itemized_Tax_Ledger_${startDate}_to_${endDate}.csv`,
      title: 'BIR Itemized Tax Ledger Transaction Report',
      headers: [
        'Invoice #',
        'Date & Time',
        'Terminal',
        'Customer',
        'Status',
        'Gross Amount',
        'VATable Sales',
        'Gross Output VAT (12%)',
        'Refund VAT',
        'Net Output VAT',
        'VAT-Exempt Sales',
        'Zero-Rated Sales',
        'SC/PWD Discount',
        'Promo Discount',
        'Refund Amount',
        'Net Taxable Sales',
      ],
      rows: csvRows,
      startDate,
      endDate,
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Top KPI Cards — driven by server-side summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <span className="text-xs text-gray-500 font-medium">Gross Transactions</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(summary?.gross_transactions)}</p>
          <span className="text-xs text-gray-400">{summary?.total_invoices_recorded ?? 0} invoices recorded</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <span className="text-xs text-gray-500 font-medium">Completed / Voided</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{summary?.completed_invoices ?? 0}</p>
          <span className="text-xs text-red-500">{summary?.voided_invoices ?? 0} voided</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <span className="text-xs text-indigo-600 font-medium">VATable Sales Base</span>
          <p className="text-xl font-bold text-indigo-600 mt-1">{formatCurrency(summary?.vatable_sales_base)}</p>
          <span className="text-xs text-indigo-700">Taxable revenue base</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <span className="text-xs text-blue-600 font-medium">Gross Output VAT</span>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(summary?.gross_output_vat)}</p>
          <span className="text-xs text-red-500">- {formatCurrency(summary?.refund_output_vat)} refunded</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <span className="text-xs text-amber-600 font-medium">Exempt & Zero-Rated</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(summary?.exempt_and_zero_rated)}</p>
          <span className="text-xs text-amber-700">Statutory exemptions</span>
        </div>

        <div className="bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100">
          <span className="text-xs text-indigo-800 font-medium">Net VAT Payable</span>
          <p className="text-xl font-bold text-indigo-900 mt-1">{formatCurrency(summary?.net_output_vat_payable)}</p>
          {(summary?.excess_vat_credit ?? 0) > 0 && (
            <span className="text-xs text-emerald-600 font-semibold">
              + {formatCurrency(summary?.excess_vat_credit)} credit
            </span>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoice, customer, terminal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Terminal Filter */}
            {terminalList.length > 0 && (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedTerminal}
                  onChange={(e) => setSelectedTerminal(e.target.value)}
                  className="w-full sm:w-auto py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="ALL">All Terminals</option>
                  {terminalList.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Invoice #</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Date & Time</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Terminal</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Customer</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700">Status</th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700">Gross</th>
                <th className="px-3 py-3 text-right font-semibold text-indigo-700">VATable</th>
                <th className="px-3 py-3 text-right font-semibold text-blue-700">Gross VAT</th>
                <th className="px-3 py-3 text-right font-semibold text-pink-700">Refund VAT</th>
                <th className="px-3 py-3 text-right font-semibold text-cyan-700">Net VAT</th>
                <th className="px-3 py-3 text-right font-semibold text-amber-700">Exempt</th>
                <th className="px-3 py-3 text-right font-semibold text-teal-700">Zero-Rated</th>
                <th className="px-3 py-3 text-right font-semibold text-purple-700">SC/PWD Disc</th>
                <th className="px-3 py-3 text-right font-semibold text-orange-700">Promo Disc</th>
                <th className="px-3 py-3 text-right font-semibold text-red-700">Refunds</th>
                <th className="px-3 py-3 text-right font-semibold text-gray-900">Net Taxable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-gray-500">
                    Loading BIR tax ledger records...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-gray-500">
                    No tax ledger transactions found for the selected period.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.invoice_id}
                    className={`hover:bg-gray-50 ${row.order_status === 'voided' ? 'bg-red-50/40 text-gray-400' : ''}`}
                  >
                    <td className="px-3 py-2.5 font-mono font-medium text-gray-900">
                      {row.invoice_number}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {formatDate(row.invoice_date)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{row.terminal_name}</td>
                    <td className="px-3 py-2.5 text-gray-900 font-medium">{row.customer_name}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          row.order_status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.order_status === 'voided'
                            ? 'bg-red-100 text-red-800 line-through'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {row.order_status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-900">
                      {formatCurrency(row.gross_amount)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium text-indigo-700">
                      {formatCurrency(row.vatable_sales)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium text-blue-700">
                      {formatCurrency(row.gross_vat_amount)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-pink-600">
                      {row.refund_vat_amount > 0 ? `- ${formatCurrency(row.refund_vat_amount)}` : '₱0.00'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium text-cyan-700">
                      {formatCurrency(row.net_vat_amount)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-amber-700">
                      {formatCurrency(row.vat_exempt_sales)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-teal-700">
                      {formatCurrency(row.zero_rated_sales)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-purple-700">
                      {formatCurrency(row.sc_pwd_discount)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-orange-700">
                      {row.promo_discount > 0 ? `- ${formatCurrency(row.promo_discount)}` : '₱0.00'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-red-600">
                      {row.refund_amount > 0 ? `- ${formatCurrency(row.refund_amount)}` : '₱0.00'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-900">
                      {formatCurrency(row.net_taxable_sales)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-gray-900">
                    Grand Totals ({filteredRows.length} Invoices)
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-gray-900">
                    {formatCurrency(totals.gross)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-indigo-900">
                    {formatCurrency(totals.vatable)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-blue-900">
                    {formatCurrency(totals.grossVat)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-pink-700">
                    - {formatCurrency(totals.refundVat)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-cyan-900">
                    {formatCurrency(totals.netVat)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-amber-900">
                    {formatCurrency(totals.vatExempt)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-teal-900">
                    {formatCurrency(totals.zeroRated)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-purple-900">
                    {formatCurrency(totals.scPwd)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-orange-900">
                    - {formatCurrency(totals.promo)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-red-700">
                    - {formatCurrency(totals.refund)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-gray-900 text-base">
                    {formatCurrency(totals.netTaxable)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
