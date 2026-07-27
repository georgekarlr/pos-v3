import React from 'react'
import { MonthlyTaxPrepSalesSummary } from '../../../types/accounting'
import { FileCheck2 } from 'lucide-react'

interface TaxPrepSalesSummaryTableProps {
  salesSummary: MonthlyTaxPrepSalesSummary
}

const formatCurrency = (val: number | undefined | null) => {
  const num = val ?? 0
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num)
}

export const TaxPrepSalesSummaryTable: React.FC<TaxPrepSalesSummaryTableProps> = ({
  salesSummary,
}) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
        <FileCheck2 className="h-5 w-5 text-indigo-600" />
        1. Sales Realization & Statutory Deductions
      </h3>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <tbody className="divide-y divide-gray-200 bg-white">
            <tr>
              <td className="px-4 py-2.5 text-gray-900 font-medium">Gross Invoiced Sales (With Voids)</td>
              <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                {formatCurrency(salesSummary.GrossSalesWithVoids)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-600 pl-8">
                Less: Voided Transactions ({salesSummary.TotalVoidTransactions})
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-red-600">
                - {formatCurrency(salesSummary.LessVoids)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-600 pl-8">Less: Promotional Discounts</td>
              <td className="px-4 py-2.5 text-right font-mono text-red-600">
                - {formatCurrency(salesSummary.LessPromotions)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-600 pl-8">Less: SC & PWD Statutory Discounts</td>
              <td className="px-4 py-2.5 text-right font-mono text-red-600">
                - {formatCurrency(salesSummary.LessSCPWDDiscounts)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-600 pl-8">Less: Statutory VAT Exemptions</td>
              <td className="px-4 py-2.5 text-right font-mono text-red-600">
                - {formatCurrency(salesSummary.LessVATExemptions)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-gray-600 pl-8">Less: Customer Returns & Refunds</td>
              <td className="px-4 py-2.5 text-right font-mono text-red-600">
                - {formatCurrency(salesSummary.LessReturnsRefunds)}
              </td>
            </tr>
            <tr className="bg-indigo-50 font-bold">
              <td className="px-4 py-3 text-indigo-950">Net Taxable Realized Sales</td>
              <td className="px-4 py-3 text-right font-mono text-indigo-950 text-base">
                {formatCurrency(salesSummary.NetTaxableSales)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
