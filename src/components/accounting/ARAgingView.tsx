import React, { useState, useMemo } from 'react'
import { ARAgingRow } from '../../types/accounting'
import { exportToCSV } from '../../utils/csvExporter'
import { Download, Search, AlertTriangle, Users, Wallet, ShieldAlert } from 'lucide-react'

interface ARAgingViewProps {
  rows: ARAgingRow[]
  loading?: boolean
}

const formatCurrency = (val: number | undefined | null) => {
  const num = val ?? 0
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num)
}

export const ARAgingView: React.FC<ARAgingViewProps> = ({ rows, loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('')

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows
    const term = searchTerm.toLowerCase()
    return rows.filter(
      (r) =>
        r.customer_name.toLowerCase().includes(term) ||
        (r.phone_number && r.phone_number.toLowerCase().includes(term))
    )
  }, [rows, searchTerm])

  // Aggregate Totals
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.current += Number(r.current_amount || 0)
        acc.days_31_60 += Number(r.days_31_60 || 0)
        acc.days_61_90 += Number(r.days_61_90 || 0)
        acc.days_over_90 += Number(r.days_over_90 || 0)
        acc.total += Number(r.total_balance || 0)
        return acc
      },
      { current: 0, days_31_60: 0, days_61_90: 0, days_over_90: 0, total: 0 }
    )
  }, [rows])

  const handleExportCSV = () => {
    const csvRows = filteredRows.map((r) => [
      r.customer_name,
      r.phone_number || 'N/A',
      r.current_amount,
      r.days_31_60,
      r.days_61_90,
      r.days_over_90,
      r.total_balance,
    ])

    // Add totals row
    csvRows.push([
      'TOTALS',
      '',
      totals.current,
      totals.days_31_60,
      totals.days_61_90,
      totals.days_over_90,
      totals.total,
    ])

    exportToCSV({
      filename: `AR_Aging_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      title: 'Accounts Receivable (A/R) Aging Report',
      headers: [
        'Customer Name',
        'Phone Number',
        '0 - 30 Days (Current)',
        '31 - 60 Days Late',
        '61 - 90 Days Late',
        'Over 90 Days (High Risk)',
        'Total Balance',
      ],
      rows: csvRows,
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Total A/R Balance</span>
            <Wallet className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.total)}</p>
          <span className="text-xs text-gray-400">{rows.length} debtors total</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Current (0-30 Days)</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(totals.current)}</p>
          <span className="text-xs text-emerald-700 font-medium">Standard terms</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">31 - 60 Days Late</span>
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
          </div>
          <p className="text-xl font-bold text-yellow-600">{formatCurrency(totals.days_31_60)}</p>
          <span className="text-xs text-yellow-700 font-medium">Reminder needed</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">61 - 90 Days Late</span>
            <span className="h-2 w-2 rounded-full bg-orange-500" />
          </div>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(totals.days_61_90)}</p>
          <span className="text-xs text-orange-700 font-medium">Overdue notice</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Over 90 Days</span>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totals.days_over_90)}</p>
          <span className="text-xs text-red-700 font-medium">High risk debt</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">0 - 30 Days</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">31 - 60 Days</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">61 - 90 Days</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Over 90 Days</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Total Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading aging data...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No outstanding accounts receivable found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.customer_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{row.customer_name}</div>
                      {row.phone_number && (
                        <div className="text-xs text-gray-500">{row.phone_number}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">
                      {formatCurrency(row.current_amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-yellow-700">
                      {formatCurrency(row.days_31_60)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-orange-700">
                      {formatCurrency(row.days_61_90)}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${row.days_over_90 > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {formatCurrency(row.days_over_90)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">
                      {formatCurrency(row.total_balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                <tr>
                  <td className="px-4 py-3 text-gray-900">Total Outstanding</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-800">
                    {formatCurrency(totals.current)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-yellow-800">
                    {formatCurrency(totals.days_31_60)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-orange-800">
                    {formatCurrency(totals.days_61_90)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-red-800">
                    {formatCurrency(totals.days_over_90)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900 text-base">
                    {formatCurrency(totals.total)}
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
