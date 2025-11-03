import React from 'react'
import { LayoutGrid, LayoutList, PanelsTopLeft } from 'lucide-react'
import { PosViewMode } from '../../types/pos'

interface ViewModeSwitcherProps {
  value: PosViewMode
  onChange: (value: PosViewMode) => void
  className?: string
}

const options: { key: PosViewMode; label: string; Icon: React.ElementType }[] = [
  { key: 'products', label: 'Products', Icon: LayoutGrid },
  { key: 'cart-payments', label: 'Cart & Payments', Icon: LayoutList },
  { key: 'everything', label: 'Everything', Icon: PanelsTopLeft },
]

const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({ value, onChange, className }) => {
  return (
    <div className={"inline-flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden " + (className || '')} role="tablist" aria-label="View mode selector">
      {options.map(({ key, label, Icon }, idx) => {
        const selected = value === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            role="tab"
            aria-selected={selected}
            className={`px-3 sm:px-4 py-2 text-sm font-medium flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              selected ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50'
            } ${idx !== 0 ? 'border-l border-gray-200' : ''}`}
            title={`View: ${label}`}
          >
            <Icon className={`h-4 w-4 ${selected ? 'text-gray-900' : 'text-gray-600'}`} />
            <span className="hidden xs:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default ViewModeSwitcher
