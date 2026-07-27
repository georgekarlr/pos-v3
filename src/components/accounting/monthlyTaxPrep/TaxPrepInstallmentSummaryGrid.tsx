import React from 'react'
import { MonthlyTaxPrepInstallmentSummary } from '../../../types/accounting'
import { Landmark } from 'lucide-react'

interface TaxPrepInstallmentSummaryGridProps {
  installmentSummary: MonthlyTaxPrepInstallmentSummary
}

const formatCurrency = (val: number | undefined | null) => {
  const num = val ?? 0
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num)
}

export const TaxPrepInstallmentSummaryGrid: React.FC<TaxPrepInstallmentSummaryGridProps> = ({
  installmentSummary,
}) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
        <Landmark className="h-5 w-5 text-indigo-600" />
        3. Installment Credit & Financing Schedule (Initiated in Period)
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <span className="text-xs text-gray-500 font-medium">New Contracts Created</span>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {installmentSummary.NewContractsCreated} Contracts
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <span className="text-xs text-gray-500 font-medium">Total Invoiced Principal</span>
          <p className="text-lg font-bold text-indigo-600 mt-1">
            {formatCurrency(installmentSummary.TotalInvoicedPrincipal)}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <span className="text-xs text-gray-500 font-medium">Financed Amount On Credit</span>
          <p className="text-lg font-bold text-blue-600 mt-1">
            {formatCurrency(installmentSummary.FinancedAmountOnCredit)}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <span className="text-xs text-gray-500 font-medium">Unearned Interest Recognized</span>
          <p className="text-lg font-bold text-amber-600 mt-1">
            {formatCurrency(installmentSummary.UnearnedInterestRecognized)}
          </p>
        </div>
      </div>
    </div>
  )
}
