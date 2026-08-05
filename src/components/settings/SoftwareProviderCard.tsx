import React from 'react'
import { Lock } from 'lucide-react'
import { BusinessSettings } from '../../types/settings'
import { SOFTWARE_PROVIDER_INFO } from '../../constants/provider'

interface Props {
  settings?: BusinessSettings
}

/** Read-only display card for software provider fields.
 *  Uses system-managed constants defined in SOFTWARE_PROVIDER_INFO. */
export const SoftwareProviderCard: React.FC<Props> = () => {
  const row = (label: string, value: string | null | undefined) => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right">{value || '—'}</span>
    </div>
  )

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-800">POS Software Provider Information</h2>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-gray-400 font-medium">
          <Lock className="h-3 w-3" />
          System-managed
        </span>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          These details are hardcoded system constants set by the accredited software provider and cannot be edited.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {row('Provider Name', SOFTWARE_PROVIDER_INFO.name)}
          {row('Provider TIN', SOFTWARE_PROVIDER_INFO.tin)}
          {row('Accreditation No.', SOFTWARE_PROVIDER_INFO.accreditationNo)}
          {row('Date Issued', SOFTWARE_PROVIDER_INFO.dateIssued)}
          {row('Valid Until', SOFTWARE_PROVIDER_INFO.validUntil)}
          <div className="md:col-span-2">
            {row('Provider Address', SOFTWARE_PROVIDER_INFO.address)}
          </div>
        </div>
      </div>
    </div>
  )
}
