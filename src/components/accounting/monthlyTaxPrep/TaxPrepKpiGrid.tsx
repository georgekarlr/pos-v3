import React from 'react'
import { MonthlyTaxPrepSalesSummary, MonthlyTaxPrepTaxBreakdown } from '../../../types/accounting'
import { FileCheck2, Calculator, Building2, ShieldCheck, ArrowRightLeft } from 'lucide-react'

interface TaxPrepKpiGridProps {
  salesSummary: MonthlyTaxPrepSalesSummary
  taxBreakdown: MonthlyTaxPrepTaxBreakdown
}

const formatCurrency = (val: number | undefined | null) => {
  const num = val ?? 0
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num)
}

export const TaxPrepKpiGrid: React.FC<TaxPrepKpiGridProps> = ({
  salesSummary,
  taxBreakdown,
}) => {
  const excessCredit = taxBreakdown.ExcessVATCreditCarriedOver ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between text-gray-500 mb-1">
          <span className="text-xs font-medium">Gross Invoiced Sales</span>
          <FileCheck2 className="h-4 w-4 text-blue-600" />
        </div>
        <p className="text-xl font-bold text-gray-900">{formatCurrency(salesSummary.GrossSalesWithVoids)}</p>
        <span className="text-xs text-gray-500">Includes {salesSummary.TotalCompletedTransactions} completed orders</span>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between text-gray-500 mb-1">
          <span className="text-xs font-medium">VATable Base (Form 2550Q)</span>
          <Calculator className="h-4 w-4 text-indigo-600" />
        </div>
        <p className="text-xl font-bold text-indigo-600">{formatCurrency(taxBreakdown.VATableSales)}</p>
        <span className="text-xs text-indigo-700 font-medium">Net taxable base</span>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between text-gray-500 mb-1">
          <span className="text-xs font-medium">Net Output VAT Payable</span>
          <Building2 className="h-4 w-4 text-blue-600" />
        </div>
        <p className="text-xl font-bold text-blue-600">{formatCurrency(taxBreakdown.NetOutputVATPayable)}</p>
        <span className="text-xs text-blue-700 font-medium">After refund VAT deductions</span>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between text-gray-500 mb-1">
          <span className="text-xs font-medium">Excess VAT Credit (Line 23)</span>
          <ArrowRightLeft className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-xl font-bold text-amber-600">{formatCurrency(excessCredit)}</p>
        <span className="text-xs text-amber-700 font-medium">Carried over to next period</span>
      </div>

      <div className="bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100">
        <div className="flex items-center justify-between text-indigo-800 mb-1">
          <span className="text-xs font-medium">Net Taxable Realized Sales</span>
          <ShieldCheck className="h-4 w-4 text-indigo-700" />
        </div>
        <p className="text-2xl font-extrabold text-indigo-900">{formatCurrency(salesSummary.NetTaxableSales)}</p>
        <span className="text-xs text-indigo-700 font-semibold">Net of returns & discounts</span>
      </div>
    </div>
  )
}
