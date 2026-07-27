import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { AccountingService } from '../../services/accountingService'
import { MonthlyTaxPrepResult } from '../../types/accounting'
import { AccountingDateFilter } from '../../components/accounting/AccountingDateFilter'
import { MonthlyTaxPrepView } from '../../components/accounting/MonthlyTaxPrepView'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FormatDateTime } from '../../utils/formatDateTime'
import { Landmark } from 'lucide-react'

export const MonthlyTaxPrepPage: React.FC = () => {
  const { persona } = useAuth()
  const isAdmin = persona?.type === 'admin'

  const todayISO = FormatDateTime.formatLocalTimestampForDatabase(new Date()).slice(0, 10)
  const firstDayOfMonthISO = FormatDateTime.formatLocalTimestampForDatabase(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  ).slice(0, 10)

  const [startDate, setStartDate] = useState(firstDayOfMonthISO)
  const [endDate, setEndDate] = useState(todayISO)

  const [data, setData] = useState<MonthlyTaxPrepResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!isAdmin || !persona?.id) return
    setLoading(true)
    setError(null)
    try {
      const result = await AccountingService.getMonthlyTaxPreparation({
        requesting_account_id: persona.id,
        start_date: startDate,
        end_date: endDate,
      })
      setData(result)
    } catch (err: any) {
      console.error('Failed to load Monthly Tax Preparation report:', err)
      setError(err.message || 'Failed to load Monthly Tax Preparation report data.')
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
        Access Denied: Only administrators can view Monthly Tax Preparation reports.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="h-7 w-7 text-indigo-600" />
            BIR Monthly Tax Preparation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Official BIR Form 2550Q (VAT) & BIR Form 2551Q (Percentage Tax) returns summary.
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
        <MonthlyTaxPrepView data={data} startDate={startDate} endDate={endDate} />
      )}
    </div>
  )
}

export default MonthlyTaxPrepPage
