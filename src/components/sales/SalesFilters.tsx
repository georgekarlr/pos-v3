import React, { useState } from 'react'
import { Search, Calendar, X } from 'lucide-react'

export interface SalesFiltersValue {
  search: string
  startDate: string | null // YYYY-MM-DD
  endDate: string | null   // YYYY-MM-DD
}

interface SalesFiltersProps {
  value: SalesFiltersValue
  onChange: (val: SalesFiltersValue) => void
  onApply: () => void
  onClear: () => void
}

const SalesFilters: React.FC<SalesFiltersProps> = ({ value, onChange, onApply, onClear }) => {
  const [local, setLocal] = useState<SalesFiltersValue>(value)

  const apply = () => {
    onChange(local)
    onApply()
  }

  const clear = () => {
    const cleared: SalesFiltersValue = { search: '', startDate: null, endDate: null }
    setLocal(cleared)
    onChange(cleared)
    onClear()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              value={local.search}
              onChange={(e) => setLocal({ ...local, search: e.target.value })}
              placeholder="Order # or customer name"
              className="w-full pl-9 pr-10 py-2 rounded-md border border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {local.search && (
              <button
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                onClick={() => setLocal({ ...local, search: '' })}
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:w-[340px]">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start date</label>
            <div className="relative">
              <Calendar className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={local.startDate ?? ''}
                onChange={(e) => setLocal({ ...local, startDate: e.target.value || null })}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End date</label>
            <div className="relative">
              <Calendar className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={local.endDate ?? ''}
                onChange={(e) => setLocal({ ...local, endDate: e.target.value || null })}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={apply} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Apply</button>
          <button onClick={clear} className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50">Clear</button>
        </div>
      </div>
    </div>
  )
}

export default SalesFilters
