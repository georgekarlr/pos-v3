import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { AccountingService } from '../../services/accountingService'
import { PnLStatementResult } from '../../types/accounting'
import { AccountingDateFilter } from '../../components/accounting/AccountingDateFilter'
import { PnLStatementView } from '../../components/accounting/PnLStatementView'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FormatDateTime } from '../../utils/formatDateTime'
import { TrendingUp } from 'lucide-react'

export const PnLStatementPage: React.FC = () => {
  const { persona } = useAuth()
  const isAdmin = persona?.type === 'admin'

  const todayISO = FormatDateTime.formatLocalTimestampForDatabase(new Date()).slice(0, 10)
  const firstDayOfMonthISO = FormatDateTime.formatLocalTimestampForDatabase(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  ).slice(0, 10)

  const [startDate, setStartDate] = useState(firstDayOfMonthISO)
  const [endDate, setEndDate] = useState(todayISO)

  const [data, setData] = useState<PnLStatementResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!isAdmin || !persona?.id) return
    setLoading(true)
    setError(null)
    try {
      // Append time bounds for start_date and end_date timestamps
      const startTimestamp = `${startDate} 00:00:00`
      const endTimestamp = `${endDate} 23:59:59`

      const result = await AccountingService.getPnLStatement({
        requesting_account_id: persona.id,
        start_date: startTimestamp,
        end_date: endTimestamp,
      })
      setData(result)
    } catch (err: any) {
      console.error('Failed to load P&L statement:', err)
      setError(err.message || 'Failed to load Profit & Loss statement data.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, persona?.id, startDate, endDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">
        Access Denied: Only administrators can view Profit & Loss statements.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-emerald-600" />
            Profit & Loss (P&L) Statement
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Income Statement summarizing sales revenue, cost of goods sold, operating expenses, and net profit margins.
          </p>
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
      ) : (
        <PnLStatementView data={data} startDate={startDate} endDate={endDate} />
      )}
    </div>
  )
}

export default PnLStatementPage
