import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ReportService } from '../services/reportService'
import { BIRSalesBookRow, SCPWDBookRow, VoidsAndRefundsRow } from '../types/report'
import LoadingSpinner from '../components/LoadingSpinner'
import { FormatDateTime } from '../utils/formatDateTime'
import { 
  BookOpen, 
  Users, 
  Trash2, 
  Download, 
  Printer, 
  Calendar,
  DollarSign,
  Receipt,
  FileSpreadsheet
} from 'lucide-react'

// Tab definitions
type BookTab = 'z-reading' | 'sc-pwd' | 'voids-refunds'

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? Number(value) : value
  if (isNaN(num)) return 'PHP 0.00'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num)
}

const BIRBooks: React.FC = () => {
  const { persona } = useAuth()
  const isAdmin = persona?.type === 'admin'

  // Date filters
  const todayISO = FormatDateTime.formatLocalTimestampForDatabase(new Date()).slice(0, 10)
  const thirtyDaysAgoISO = FormatDateTime.formatLocalTimestampForDatabase(
    new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
  ).slice(0, 10)

  const [startDate, setStartDate] = useState(thirtyDaysAgoISO)
  const [endDate, setEndDate] = useState(todayISO)
  const [activeTab, setActiveTab] = useState<BookTab>('z-reading')

  // Data states
  const [zReadingData, setZReadingData] = useState<BIRSalesBookRow[]>([])
  const [scPwdData, setScPwdData] = useState<SCPWDBookRow[]>([])
  const [voidsRefundsData, setVoidsRefundsData] = useState<VoidsAndRefundsRow[]>([])

  // UI States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch handler
  const loadData = useCallback(async () => {
    if (!isAdmin || !persona?.id) return
    setLoading(true)
    setError(null)

    const params = {
      requesting_account_id: persona.id,
      start_date: startDate,
      end_date: endDate,
    }

    try {
      if (activeTab === 'z-reading') {
        const data = await ReportService.getBIRSalesBook(params)
        setZReadingData(data)
      } else if (activeTab === 'sc-pwd') {
        const data = await ReportService.getSCPWDBook(params)
        setScPwdData(data)
      } else if (activeTab === 'voids-refunds') {
        const data = await ReportService.getVoidsAndRefunds(params)
        setVoidsRefundsData(data)
      }
    } catch (e: unknown) {
      console.error('Error loading compliance data:', e)
      const err = e as { message?: string }
      setError(err?.message || 'Failed to load report data.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, persona?.id, startDate, endDate, activeTab])

  // Trigger reload on filter/tab changes
  useEffect(() => {
    loadData()
  }, [loadData])

  // Computed summary values for KPI cards
  const zReadingSummary = useMemo(() => {
    const totalGross = zReadingData.reduce((sum, row) => sum + Number(row.gross_sales || 0), 0)
    const totalVAT = zReadingData.reduce((sum, row) => sum + Number(row.vat_amount || 0), 0)
    return {
      count: zReadingData.length,
      totalGross,
      totalVAT,
    }
  }, [zReadingData])

  const scPwdSummary = useMemo(() => {
    const totalDiscounts = scPwdData.reduce((sum, row) => sum + Number(row.discount_amount || 0), 0)
    const totalNetSales = scPwdData.reduce((sum, row) => sum + Number(row.net_sales || 0), 0)
    return {
      count: scPwdData.length,
      totalDiscounts,
      totalNetSales,
    }
  }, [scPwdData])

  const voidsRefundsSummary = useMemo(() => {
    const voids = voidsRefundsData.filter(r => r.adjustment_type === 'VOID')
    const refunds = voidsRefundsData.filter(r => r.adjustment_type === 'REFUND')
    const totalVoidedAmount = voids.reduce((sum, row) => sum + Number(row.adjusted_amount || 0), 0)
    const totalRefundedAmount = refunds.reduce((sum, row) => sum + Number(row.adjusted_amount || 0), 0)
    return {
      totalCount: voidsRefundsData.length,
      voidsCount: voids.length,
      refundsCount: refunds.length,
      totalVoidedAmount,
      totalRefundedAmount,
    }
  }, [voidsRefundsData])

  // Export to CSV helper
  const exportToCSV = () => {
    let headers: string[] = []
    let rows: string[][] = []
    let filename = `BIR_Compliance_Report`

    if (activeTab === 'z-reading') {
      filename = `BIR_Sales_Book_${startDate}_to_${endDate}`
      headers = [
        'Z-Reading Date',
        'Terminal Name',
        'MIN Number',
        'Starting Invoice',
        'Ending Invoice',
        'Gross Sales',
        'VATable Sales',
        'VAT Amount (12%)',
        'VAT-Exempt Sales',
        'Zero-Rated Sales',
        'Total Discounts',
        'Previous Grand Total',
        'Ending Grand Total'
      ]
      rows = zReadingData.map(r => [
        r.reading_date,
        r.terminal_name,
        r.min_number,
        r.starting_invoice || 'N/A',
        r.ending_invoice || 'N/A',
        String(r.gross_sales),
        String(r.vatable_sales),
        String(r.vat_amount),
        String(r.vat_exempt_sales),
        String(r.zero_rated_sales),
        String(r.total_discounts),
        String(r.previous_grand_total),
        String(r.ending_grand_total)
      ])
    } else if (activeTab === 'sc-pwd') {
      filename = `BIR_SC_PWD_Discount_Book_${startDate}_to_${endDate}`
      headers = [
        'Transaction Date',
        'Invoice Number',
        'Customer Name',
        'SC/PWD ID Number',
        'Gross Sales',
        'VAT Exempt Sales Base',
        '20% Discount Amount',
        'Net Sales'
      ]
      rows = scPwdData.map(r => [
        r.transaction_date,
        r.invoice_number,
        r.sc_pwd_name,
        r.sc_pwd_id,
        String(r.gross_sales),
        String(r.vat_exempt_sales),
        String(r.discount_amount),
        String(r.net_sales)
      ])
    } else if (activeTab === 'voids-refunds') {
      filename = `BIR_Voids_and_Refunds_Log_${startDate}_to_${endDate}`
      headers = [
        'Action Date',
        'Adjustment Type',
        'Invoice Number',
        'Original Total',
        'Adjusted Amount',
        'Reason',
        'Authorized By'
      ]
      rows = voidsRefundsData.map(r => [
        r.action_date,
        r.adjustment_type,
        r.invoice_number,
        String(r.original_total),
        String(r.adjusted_amount),
        r.reason || 'N/A',
        r.authorized_by || 'N/A'
      ])
    }

    // Convert arrays to CSV format, handling quotes/commas correctly
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          const clean = cell.replace(/"/g, '""')
          return clean.includes(',') || clean.includes('\n') || clean.includes('"') ? `"${clean}"` : clean
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print helper
  const handlePrint = () => {
    window.print()
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Books of Accounts Compliance</h1>
        <p className="mt-2 text-sm text-gray-600">Access denied. Only system administrators can generate compliance logs.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* CSS style overlay to cleanly support physical prints with custom headers/margins */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="text-blue-600 w-7 h-7" />
            BIR Books of Accounts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and export official compliance registers in accordance with Revenue Memorandum Order No. 10-2005.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={loading || (activeTab === 'z-reading' && zReadingData.length === 0) || (activeTab === 'sc-pwd' && scPwdData.length === 0) || (activeTab === 'voids-refunds' && voidsRefundsData.length === 0)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-950 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Date & Filter Panel */}
      <div className="bg-white border rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end no-print">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <button
            onClick={loadData}
            disabled={loading}
            className="w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            {loading ? 'Fetching records...' : 'Fetch Records'}
          </button>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 no-print">
        <button
          onClick={() => setActiveTab('z-reading')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'z-reading'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Z-Reading Log (Cumulative Sales)
        </button>
        <button
          onClick={() => setActiveTab('sc-pwd')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'sc-pwd'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          SC/PWD Discount Book
        </button>
        <button
          onClick={() => setActiveTab('voids-refunds')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'voids-refunds'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Voids & Adjustments Audit Log
        </button>
      </div>

      {/* Print-Only Compliance Metadata */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">Official Compliance Book of Accounts</h1>
        <div className="grid grid-cols-2 gap-4 text-xs mt-2 text-slate-700">
          <div>
            <p><span className="font-semibold">Tenant ID:</span> Auth UID ({persona?.id || 'N/A'})</p>
            <p><span className="font-semibold">Audited Date Range:</span> {startDate} to {endDate}</p>
            <p><span className="font-semibold">Print Timestamp:</span> {new Date().toLocaleString()}</p>
          </div>
          <div>
            <p><span className="font-semibold">Book Sub-Type:</span> {
              activeTab === 'z-reading' ? 'BIR Z-Reading Log (Cumulative Sales Book)' :
              activeTab === 'sc-pwd' ? 'Senior Citizen & PWD Discount Book' :
              'Voids and Refunds Audit Ledger'
            }</p>
            <p><span className="font-semibold">Regulatory Framework:</span> BIR RMO No. 10-2005</p>
            <p><span className="font-semibold">Verified Auditor PIN Status:</span> Active Admin Session</p>
          </div>
        </div>
      </div>

      {/* Main Report Area - Printed content goes here */}
      <div id="print-area" className="space-y-6">
        
        {/* KPI Summaries - Dynamic per active tab */}
        {activeTab === 'z-reading' && !loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Daily Readings</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{zReadingSummary.count}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Receipt className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Gross Sales</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{formatCurrency(zReadingSummary.totalGross)}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total VAT Collected</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{formatCurrency(zReadingSummary.totalVAT)}</h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sc-pwd' && !loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Discounted Transactions</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{scPwdSummary.count}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total 20% Deductions</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{formatCurrency(scPwdSummary.totalDiscounts)}</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Net Revenue</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{formatCurrency(scPwdSummary.totalNetSales)}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'voids-refunds' && !loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Voids Count</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{voidsRefundsSummary.voidsCount}</h3>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                <Trash2 className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Voided Amount</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{formatCurrency(voidsRefundsSummary.totalVoidedAmount)}</h3>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Refunds Count</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{voidsRefundsSummary.refundsCount}</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Refunded Amount</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{formatCurrency(voidsRefundsSummary.totalRefundedAmount)}</h3>
              </div>
              <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-12 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Table Content */}
        {!loading && !error && (
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            
            {/* Z-Reading Log Table */}
            {activeTab === 'z-reading' && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-2">Terminal</th>
                      <th className="py-3 px-2">MIN</th>
                      <th className="py-3 px-2">Start Inv</th>
                      <th className="py-3 px-2">End Inv</th>
                      <th className="py-3 px-2 text-right">Gross Sales</th>
                      <th className="py-3 px-2 text-right">VATable Base</th>
                      <th className="py-3 px-2 text-right">VAT (12%)</th>
                      <th className="py-3 px-2 text-right">VAT-Exempt</th>
                      <th className="py-3 px-2 text-right">Zero-Rated</th>
                      <th className="py-3 px-2 text-right">Discounts</th>
                      <th className="py-3 px-2 text-right">Prev Grand Total</th>
                      <th className="py-3 px-4 text-right">Ending Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {zReadingData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 odd:bg-white even:bg-slate-50/20">
                        <td className="py-3 px-4 font-medium whitespace-nowrap">{row.reading_date}</td>
                        <td className="py-3 px-2 whitespace-nowrap">{row.terminal_name}</td>
                        <td className="py-3 px-2 font-mono whitespace-nowrap">{row.min_number}</td>
                        <td className="py-3 px-2 font-mono whitespace-nowrap">{row.starting_invoice || 'N/A'}</td>
                        <td className="py-3 px-2 font-mono whitespace-nowrap">{row.ending_invoice || 'N/A'}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums">{formatCurrency(row.gross_sales)}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums">{formatCurrency(row.vatable_sales)}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums">{formatCurrency(row.vat_amount)}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums">{formatCurrency(row.vat_exempt_sales)}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums">{formatCurrency(row.zero_rated_sales)}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums">{formatCurrency(row.total_discounts)}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums">{formatCurrency(row.previous_grand_total)}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">{formatCurrency(row.ending_grand_total)}</td>
                      </tr>
                    ))}
                    {zReadingData.length === 0 && (
                      <tr>
                        <td colSpan={13} className="py-8 text-center text-slate-400 font-medium text-sm">
                          No daily Z-Reading records found in the specified range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {zReadingData.length > 0 && (
                    <tfoot className="border-t font-semibold bg-slate-50 text-slate-800 text-right">
                      <tr>
                        <td colSpan={5} className="py-3 px-4 text-left font-bold text-slate-900">Total Summaries</td>
                        <td className="py-3 px-2 font-mono tabular-nums">{formatCurrency(zReadingSummary.totalGross)}</td>
                        <td className="py-3 px-2 font-mono tabular-nums">
                          {formatCurrency(zReadingData.reduce((sum, r) => sum + Number(r.vatable_sales || 0), 0))}
                        </td>
                        <td className="py-3 px-2 font-mono tabular-nums">{formatCurrency(zReadingSummary.totalVAT)}</td>
                        <td className="py-3 px-2 font-mono tabular-nums">
                          {formatCurrency(zReadingData.reduce((sum, r) => sum + Number(r.vat_exempt_sales || 0), 0))}
                        </td>
                        <td className="py-3 px-2 font-mono tabular-nums">
                          {formatCurrency(zReadingData.reduce((sum, r) => sum + Number(r.zero_rated_sales || 0), 0))}
                        </td>
                        <td className="py-3 px-2 font-mono tabular-nums">
                          {formatCurrency(zReadingData.reduce((sum, r) => sum + Number(r.total_discounts || 0), 0))}
                        </td>
                        <td colSpan={2} className="py-3 px-4 font-mono text-slate-500 italic">Historical Grand Totals Verified</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* SC/PWD Discount Book Table */}
            {activeTab === 'sc-pwd' && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b uppercase tracking-wider">
                      <th className="py-3 px-4">Transaction Date</th>
                      <th className="py-3 px-4">Invoice Number</th>
                      <th className="py-3 px-4">SC/PWD Beneficiary Name</th>
                      <th className="py-3 px-4">SC/PWD ID Card Number</th>
                      <th className="py-3 px-4 text-right">Gross sales</th>
                      <th className="py-3 px-4 text-right">VAT Exempt Sales base</th>
                      <th className="py-3 px-4 text-right">20% SC/PWD Discount</th>
                      <th className="py-3 px-4 text-right">Net Sales (Paid)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {scPwdData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 odd:bg-white even:bg-slate-50/20">
                        <td className="py-3 px-4 font-medium whitespace-nowrap">{row.transaction_date}</td>
                        <td className="py-3 px-4 font-mono whitespace-nowrap">{row.invoice_number}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{row.sc_pwd_name}</td>
                        <td className="py-3 px-4 font-mono whitespace-nowrap">{row.sc_pwd_id}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(row.gross_sales)}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(row.vat_exempt_sales)}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-red-600 font-medium">-{formatCurrency(row.discount_amount)}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">{formatCurrency(row.net_sales)}</td>
                      </tr>
                    ))}
                    {scPwdData.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-medium text-sm">
                          No SC/PWD discount records found in the specified range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {scPwdData.length > 0 && (
                    <tfoot className="border-t font-semibold bg-slate-50 text-slate-800 text-right">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-left font-bold text-slate-900">Total Book Summaries</td>
                        <td className="py-3 px-4 font-mono tabular-nums">
                          {formatCurrency(scPwdData.reduce((sum, r) => sum + Number(r.gross_sales || 0), 0))}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums">
                          {formatCurrency(scPwdData.reduce((sum, r) => sum + Number(r.vat_exempt_sales || 0), 0))}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-red-700">
                          -{formatCurrency(scPwdSummary.totalDiscounts)}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-900">
                          {formatCurrency(scPwdSummary.totalNetSales)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Voids & Adjustments Table */}
            {activeTab === 'voids-refunds' && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b uppercase tracking-wider">
                      <th className="py-3 px-4">Action Date</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Invoice Number</th>
                      <th className="py-3 px-4 text-right">Original Total</th>
                      <th className="py-3 px-4 text-right">Reversed Amount</th>
                      <th className="py-3 px-4">Adjustment Reason</th>
                      <th className="py-3 px-4">Authorized By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {voidsRefundsData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 odd:bg-white even:bg-slate-50/20">
                        <td className="py-3 px-4 font-medium whitespace-nowrap">{row.action_date}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            row.adjustment_type === 'VOID' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {row.adjustment_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono whitespace-nowrap">{row.invoice_number}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(row.original_total)}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-600 font-semibold">-{formatCurrency(row.adjusted_amount)}</td>
                        <td className="py-3 px-4 text-slate-600 whitespace-pre-wrap max-w-xs">{row.reason || 'N/A'}</td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium">{row.authorized_by || 'Unknown'}</td>
                      </tr>
                    ))}
                    {voidsRefundsData.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium text-sm">
                          No voided or refunded transactions found in the specified range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {voidsRefundsData.length > 0 && (
                    <tfoot className="border-t font-semibold bg-slate-50 text-slate-800 text-right">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-left font-bold text-slate-900">Total Adjustments Summaries</td>
                        <td className="py-3 px-4 font-mono tabular-nums">
                          {formatCurrency(voidsRefundsData.reduce((sum, r) => sum + Number(r.original_total || 0), 0))}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-rose-700 font-bold">
                          -{formatCurrency(voidsRefundsSummary.totalVoidedAmount + voidsRefundsSummary.totalRefundedAmount)}
                        </td>
                        <td colSpan={2} className="py-3 px-4 text-slate-500 italic">
                          (Voids: {voidsRefundsSummary.voidsCount} | Refunds: {voidsRefundsSummary.refundsCount})
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default BIRBooks
