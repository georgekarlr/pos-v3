import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { AccountingService } from '../../services/accountingService'
import { ARAgingRow } from '../../types/accounting'
import { ARAgingView } from '../../components/accounting/ARAgingView'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Users, RefreshCw } from 'lucide-react'

export const ARAgingPage: React.FC = () => {
  const { persona } = useAuth()
  const isAdmin = persona?.type === 'admin'

  const [rows, setRows] = useState<ARAgingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!isAdmin || !persona?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await AccountingService.getARAgingReport({
        requesting_account_id: persona.id,
      })
      setRows(data)
    } catch (err: any) {
      console.error('Failed to load A/R aging report:', err)
      setError(err.message || 'Failed to load A/R aging report.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, persona?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">
        Access Denied: Only administrators can view Accounts Receivable Aging reports.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-600" />
            Accounts Receivable (A/R) Aging Report
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track customer debts, credit tabs, installment balances, and age-based debt risk buckets.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading && rows.length === 0 ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-gray-200">
          <LoadingSpinner />
        </div>
      ) : (
        <ARAgingView rows={rows} loading={loading} />
      )}
    </div>
  )
}

export default ARAgingPage
