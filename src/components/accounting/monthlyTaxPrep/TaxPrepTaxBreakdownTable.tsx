import React from 'react'
import { MonthlyTaxPrepTaxBreakdown } from '../../../types/accounting'
import { Calculator } from 'lucide-react'

interface TaxPrepTaxBreakdownTableProps {
  taxBreakdown: MonthlyTaxPrepTaxBreakdown
}

const formatCurrency = (val: number | undefined | null) => {
  const num = val ?? 0
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num)
}

export const TaxPrepTaxBreakdownTable: React.FC<TaxPrepTaxBreakdownTableProps> = ({
  taxBreakdown,
}) => {
  const excessCredit = taxBreakdown.ExcessVATCreditCarriedOver ?? 0

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
        <Calculator className="h-5 w-5 text-indigo-600" />
        2. BIR Official Tax Liability Schedule
      </h3>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <tbody className="divide-y divide-gray-200 bg-white">
            <tr className="bg-gray-50/50">
              <td className="px-4 py-2.5 text-gray-900 font-semibold">BIR Form 2550Q Line 15A: VATable Sales Base</td>
              <td className="px-4 py-2.5 text-right font-mono font-bold text-indigo-700">
                {formatCurrency(taxBreakdown.VATableSales)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-700 pl-8">BIR Form 2550Q Line 15B: Output VAT Collected (12%)</td>
              <td className="px-4 py-2.5 text-right font-mono text-blue-700 font-semibold">
                {formatCurrency(taxBreakdown.OutputVATCollected)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-600 pl-8">Less: Output VAT Component on Refunds</td>
              <td className="px-4 py-2.5 text-right font-mono text-red-600">
                - {formatCurrency(taxBreakdown.LessRefundOutputVAT)}
              </td>
            </tr>
            <tr className="bg-blue-50/60 font-semibold">
              <td className="px-4 py-2.5 text-blue-900">Net Output VAT Payable Owed to BIR</td>
              <td className="px-4 py-2.5 text-right font-mono text-blue-950 font-bold">
                {formatCurrency(taxBreakdown.NetOutputVATPayable)}
              </td>
            </tr>
            <tr className="bg-amber-50/50">
              <td className="px-4 py-2.5 text-amber-900 font-semibold">
                BIR Form 2550Q Line 23: Excess VAT Credit Carried Over
              </td>
              <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-700">
                {formatCurrency(excessCredit)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-700">BIR Form 2550Q Line 18: Exempt Sales Base</td>
              <td className="px-4 py-2.5 text-right font-mono text-amber-700">
                {formatCurrency(taxBreakdown.VATExemptSales)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-700">BIR Form 2550Q Line 17: Zero-Rated Sales Base</td>
              <td className="px-4 py-2.5 text-right font-mono text-teal-700">
                {formatCurrency(taxBreakdown.ZeroRatedSales)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
