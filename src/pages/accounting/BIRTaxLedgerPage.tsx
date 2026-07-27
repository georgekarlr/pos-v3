import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { AccountingService } from '../../services/accountingService'
import { BIRTaxLedgerRow, MonthlyTaxPrepResult } from '../../types/accounting'
import { AccountingDateFilter } from '../../components/accounting/AccountingDateFilter'
import { TaxLedgerView } from '../../components/accounting/TaxLedgerView'
import { MonthlyTaxPrepView } from '../../components/accounting/MonthlyTaxPrepView'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FormatDateTime } from '../../utils/formatDateTime'
import { Receipt, Landmark, Table, FileText } from 'lucide-react'

export const BIRTaxLedgerPage: React.FC = () => {
  const { persona } = useAuth()
  const isAdmin = persona?.type === 'admin'

  const todayISO = FormatDateTime.formatLocalTimestampForDatabase(new Date()).slice(0, 10)
  const firstDayOfMonthISO = FormatDateTime.formatLocalTimestampForDatabase(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  ).slice(0, 10)

  const [activeTab, setActiveTab] = useState<'itemized' | 'summary'>('itemized')
  const [startDate, setStartDate] = useState(firstDayOfMonthISO)
  const [endDate, setEndDate] = useState(todayISO)

  const [itemizedRows, setItemizedRows] = useState<BIRTaxLedgerRow[]>([])
  const [prepSummary, setPrepSummary] = useState<MonthlyTaxPrepResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!isAdmin || !persona?.id) return
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'itemized') {
        const rows = await AccountingService.getBIRTaxLedger({
          requesting_account_id: persona.id,
          start_date: startDate,
          end_date: endDate,
        })
        setItemizedRows(rows)
      } else {
        const summary = await AccountingService.getMonthlyTaxPreparation({
          requesting_account_id: persona.id,
          start_date: startDate,
          end_date: endDate,
        })
        setPrepSummary(summary)
      }
    } catch (err: any) {
      console.error('Failed to load tax ledger data:', err)
      setError(err.message || 'Failed to load BIR tax ledger data.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, persona?.id, startDate, endDate, activeTab])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">
        Access Denied: Only administrators can view BIR Tax Ledgers.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="h-7 w-7 text-indigo-600" />
            BIR Tax Ledger & Compliance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Automated BIR Form 2550Q (VAT) & BIR Form 2551Q (Percentage Tax) transaction ledger & returns summary.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveTab('itemized')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'itemized'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Table className="h-4 w-4" />
            <span>Itemized Tax Ledger</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'summary'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <FileText className="h-4 w-4" />
            <span>Monthly Tax Declaration</span>
          </button>
        </div>
      </div>

      <AccountingDateFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApply={loadData}
        loading={loading}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-gray-200">
          <LoadingSpinner />
        </div>
      ) : activeTab === 'itemized' ? (
        <TaxLedgerView rows={itemizedRows} startDate={startDate} endDate={endDate} />
      ) : (
        <MonthlyTaxPrepView data={prepSummary} startDate={startDate} endDate={endDate} />
      )}
    </div>
  )
}

export default BIRTaxLedgerPage
