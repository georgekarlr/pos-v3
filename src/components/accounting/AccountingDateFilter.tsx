import React from 'react'
import { Calendar, RefreshCw } from 'lucide-react'

interface AccountingDateFilterProps {
  startDate: string
  endDate: string
  onStartDateChange: (val: string) => void
  onEndDateChange: (val: string) => void
  onApply: () => void
  loading?: boolean
}

export const AccountingDateFilter: React.FC<AccountingDateFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  loading = false,
}) => {
  const applyPreset = (preset: 'today' | 'this_month' | 'this_quarter' | 'ytd') => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    let start = new Date()
    let end = new Date()

    if (preset === 'today') {
      start = now
      end = now
    } else if (preset === 'this_month') {
      start = new Date(year, month, 1)
      end = now
    } else if (preset === 'this_quarter') {
      const quarterStartMonth = Math.floor(month / 3) * 3
      start = new Date(year, quarterStartMonth, 1)
      end = now
    } else if (preset === 'ytd') {
      start = new Date(year, 0, 1)
      end = now
    }

    const formatYMD = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    onStartDateChange(formatYMD(start))
    onEndDateChange(formatYMD(end))
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center space-x-2">
        <Calendar className="h-5 w-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Period:</span>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-wrap gap-y-2">
        <button
          type="button"
          onClick={() => applyPreset('today')}
          className="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => applyPreset('this_month')}
          className="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          This Month
        </button>
        <button
          type="button"
          onClick={() => applyPreset('this_quarter')}
          className="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          This Quarter
        </button>
        <button
          type="button"
          onClick={() => applyPreset('ytd')}
          className="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          YTD
        </button>

        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Apply</span>
        </button>
      </div>
    </div>
  )
}
