import React from 'react'
import { BusinessSettings } from '../../types/settings'

interface Props {
  settings: BusinessSettings
  isAdmin: boolean
  onChange: (updated: BusinessSettings) => void
}

export const TaxConfigSection: React.FC<Props> = ({ settings, isAdmin, onChange }) => {
  const toggle = (checked: boolean) => onChange({ ...settings, is_vat_registered: checked })

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Tax Configuration</h2>
        <p className="text-xs text-gray-500 mt-1">
          Specify whether this business is VAT-registered. This affects how taxes are computed and
          printed on receipts.
        </p>
      </div>
      <div className="p-6">
        <label
          htmlFor="is-vat-registered"
          className={[
            'flex items-center justify-between gap-4 p-4 rounded-xl border-2 select-none transition-all',
            !isAdmin ? 'cursor-default opacity-70' : 'cursor-pointer',
            settings.is_vat_registered
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-gray-50',
          ].join(' ')}
        >
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {settings.is_vat_registered ? 'VAT-Registered Business' : 'Non-VAT / Exempt Business'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {settings.is_vat_registered
                ? 'Receipts will include 12% VAT breakdown.'
                : 'Receipts will not include a VAT line.'}
            </p>
          </div>

          {/* Toggle switch */}
          <div className="relative flex-shrink-0">
            <input
              id="is-vat-registered"
              type="checkbox"
              disabled={!isAdmin}
              checked={settings.is_vat_registered}
              onChange={(e) => toggle(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors ${
                settings.is_vat_registered ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.is_vat_registered ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </label>
      </div>
    </div>
  )
}
