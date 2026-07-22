import React from 'react'
import { BusinessSettings } from '../../types/settings'

interface Props {
  settings: BusinessSettings
  isAdmin: boolean
  onChange: (updated: BusinessSettings) => void
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500'

export const BusinessInfoForm: React.FC<Props> = ({ settings, isAdmin, onChange }) => {
  const set = (patch: Partial<BusinessSettings>) => onChange({ ...settings, ...patch })

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Business Registration Information</h2>
        <p className="text-xs text-gray-500 mt-1">
          Official details used for taxpayer identification and BIR receipts.
        </p>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business / Trade Name *
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              required
              value={settings.business_name}
              onChange={(e) => set({ business_name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Identification Number (TIN)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={settings.tin || ''}
              onChange={(e) => set({ tin: e.target.value })}
              placeholder="e.g. 000-000-000-000"
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registered Address
            </label>
            <textarea
              rows={2}
              disabled={!isAdmin}
              value={settings.address || ''}
              onChange={(e) => set({ address: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Machine Identification Number (MIN)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={settings.min || ''}
              onChange={(e) => set({ min: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PTU Number</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={settings.ptu_number || ''}
              onChange={(e) => set({ ptu_number: e.target.value })}
              placeholder="e.g. 12-34567890-12345-6"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PTU Issued By</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={settings.ptu_issued_by || ''}
              onChange={(e) => set({ ptu_issued_by: e.target.value })}
              placeholder="e.g. BIR Revenue Region 8"
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
