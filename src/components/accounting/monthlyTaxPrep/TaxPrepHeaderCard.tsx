import React from 'react'
import { MonthlyTaxPrepBusinessInfo } from '../../../types/accounting'
import { Landmark, Download, Printer } from 'lucide-react'

interface TaxPrepHeaderCardProps {
  reportType: string
  taxpayerCategory: string
  startDate: string
  endDate: string
  businessInfo: MonthlyTaxPrepBusinessInfo
  onExportCSV: () => void
  onPrint: () => void
}

export const TaxPrepHeaderCard: React.FC<TaxPrepHeaderCardProps> = ({
  reportType,
  taxpayerCategory,
  startDate,
  endDate,
  businessInfo,
  onExportCSV,
  onPrint,
}) => {
  const isVAT = taxpayerCategory === 'VAT-REGISTERED' || taxpayerCategory?.toUpperCase().includes('VAT')

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-start space-x-3">
          <div className={`p-3 rounded-lg ${isVAT ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-gray-900">{reportType}</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isVAT ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {taxpayerCategory}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Official BIR Tax Declaration Summary for period {startDate} to {endDate}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center space-x-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
        <div>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Registered Business</span>
          <p className="font-bold text-gray-900 mt-0.5">{businessInfo.Name || 'Store Business Name'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Taxpayer Identification (TIN)</span>
          <p className="font-mono font-bold text-indigo-700 mt-0.5">{businessInfo.TIN || '000-000-000-000'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Official Business Address</span>
          <p className="text-gray-700 mt-0.5 truncate">{businessInfo.Address || 'Primary Store Address'}</p>
        </div>
      </div>
    </div>
  )
}
