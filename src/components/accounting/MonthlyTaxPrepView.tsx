import React from 'react'
import { MonthlyTaxPrepResult } from '../../types/accounting'
import { exportToCSV } from '../../utils/csvExporter'
import { Download, Printer, Building2, FileCheck2, Calculator, Landmark, ShieldCheck } from 'lucide-react'

interface MonthlyTaxPrepViewProps {
  data: MonthlyTaxPrepResult | null
  startDate: string
  endDate: string
  loading?: boolean
}

const formatCurrency = (val: number | undefined | null) => {
  const num = val ?? 0
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num)
}

export const MonthlyTaxPrepView: React.FC<MonthlyTaxPrepViewProps> = ({
  data,
  startDate,
  endDate,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-500">
        Loading BIR Monthly Tax Preparation report...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
        No monthly tax preparation data loaded. Select a date range and click Apply.
      </div>
    )
  }

  const {
    ReportType,
    TaxpayerCategory,
    TaxPeriod,
    BusinessInfo,
    SalesSummary,
    InstallmentFinancingSummary,
    TaxBreakdown,
  } = data

  const isVAT = TaxpayerCategory === 'VAT-REGISTERED' || TaxpayerCategory?.toUpperCase().includes('VAT')

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['Taxpayer Category', TaxpayerCategory],
      ['Business Name', BusinessInfo?.Name || 'N/A'],
      ['Business TIN', BusinessInfo?.TIN || 'N/A'],
      ['Business Address', BusinessInfo?.Address || 'N/A'],
      ['', ''],
      ['-- SALES & RECEIPTS SUMMARY --', ''],
      ['Total Completed Transactions', SalesSummary.TotalCompletedTransactions],
      ['Total Void Transactions', SalesSummary.TotalVoidTransactions],
      ['Gross Sales With Voids', SalesSummary.GrossSalesWithVoids],
      ['Less Voids', SalesSummary.LessVoids],
      ['Less Promotions', SalesSummary.LessPromotions],
      ['Less Senior / PWD Discounts', SalesSummary.LessSCPWDDiscounts],
      ['Less VAT Exemptions', SalesSummary.LessVATExemptions],
      ['Less Returns & Refunds', SalesSummary.LessReturnsRefunds],
      ['Net Taxable Sales', SalesSummary.NetTaxableSales],
      ['', ''],
      ['-- INSTALLMENT FINANCING SUMMARY --', ''],
      ['New Contracts Created', InstallmentFinancingSummary.NewContractsCreated],
      ['Total Invoiced Principal', InstallmentFinancingSummary.TotalInvoicedPrincipal],
      ['Financed Amount On Credit', InstallmentFinancingSummary.FinancedAmountOnCredit],
      ['Unearned Interest Recognized', InstallmentFinancingSummary.UnearnedInterestRecognized],
      ['', ''],
      ['-- BIR TAX BREAKDOWN (FORM 2550Q / 2551Q) --', ''],
      ['VATable Sales Base', TaxBreakdown.VATableSales],
      ['Output VAT Collected (12%)', TaxBreakdown.OutputVATCollected],
      ['Less Refund Output VAT', TaxBreakdown.LessRefundOutputVAT],
      ['Net Output VAT Payable', TaxBreakdown.NetOutputVATPayable],
      ['VAT-Exempt Sales', TaxBreakdown.VATExemptSales],
      ['Zero-Rated Sales', TaxBreakdown.ZeroRatedSales],
    ]

    exportToCSV({
      filename: `BIR_Monthly_Tax_Preparation_${startDate}_to_${endDate}.csv`,
      title: `${ReportType} - BIR Official Tax Declaration`,
      headers: ['Declaration Field / Line Item', 'Value / Amount (PHP)'],
      rows,
      startDate,
      endDate,
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header Info Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-start space-x-3">
            <div className={`p-3 rounded-lg ${isVAT ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-gray-900">{ReportType}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isVAT ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {TaxpayerCategory}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Official BIR Tax Declaration Summary for period {TaxPeriod.StartDate} to {TaxPeriod.EndDate}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Business Info Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Registered Business</span>
            <p className="font-bold text-gray-900 mt-0.5">{BusinessInfo.Name || 'Store Business Name'}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Taxpayer Identification (TIN)</span>
            <p className="font-mono font-bold text-indigo-700 mt-0.5">{BusinessInfo.TIN || '000-000-000-000'}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Official Business Address</span>
            <p className="text-gray-700 mt-0.5 truncate">{BusinessInfo.Address || 'Primary Store Address'}</p>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Gross Invoiced Sales</span>
            <FileCheck2 className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(SalesSummary.GrossSalesWithVoids)}</p>
          <span className="text-xs text-gray-500">Includes {SalesSummary.TotalCompletedTransactions} completed orders</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">VATable Base (Form 2550Q)</span>
            <Calculator className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-indigo-600">{formatCurrency(TaxBreakdown.VATableSales)}</p>
          <span className="text-xs text-indigo-700 font-medium">Net taxable base</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Net Output VAT Payable</span>
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(TaxBreakdown.NetOutputVATPayable)}</p>
          <span className="text-xs text-blue-700 font-medium">After refund VAT deductions</span>
        </div>

        <div className="bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100">
          <div className="flex items-center justify-between text-indigo-800 mb-1">
            <span className="text-xs font-medium">Net Taxable Realized Sales</span>
            <ShieldCheck className="h-4 w-4 text-indigo-700" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-900">{formatCurrency(SalesSummary.NetTaxableSales)}</p>
          <span className="text-xs text-indigo-700 font-semibold">Net of returns & discounts</span>
        </div>
      </div>

      {/* Detailed Declarations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales & Deductions Breakdown Table */}
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
                    {formatCurrency(SalesSummary.GrossSalesWithVoids)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 pl-8">Less: Voided Transactions ({SalesSummary.TotalVoidTransactions})</td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-600">
                    - {formatCurrency(SalesSummary.LessVoids)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 pl-8">Less: Promotional Discounts</td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-600">
                    - {formatCurrency(SalesSummary.LessPromotions)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 pl-8">Less: SC & PWD Statutory Discounts</td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-600">
                    - {formatCurrency(SalesSummary.LessSCPWDDiscounts)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 pl-8">Less: Statutory VAT Exemptions</td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-600">
                    - {formatCurrency(SalesSummary.LessVATExemptions)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 pl-8">Less: Customer Returns & Refunds</td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-600">
                    - {formatCurrency(SalesSummary.LessReturnsRefunds)}
                  </td>
                </tr>
                <tr className="bg-indigo-50 font-bold">
                  <td className="px-4 py-3 text-indigo-950">Net Taxable Realized Sales</td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-950 text-base">
                    {formatCurrency(SalesSummary.NetTaxableSales)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* BIR Tax Breakdown Table */}
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
                    {formatCurrency(TaxBreakdown.VATableSales)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-700 pl-8">BIR Form 2550Q Line 15B: Output VAT Collected (12%)</td>
                  <td className="px-4 py-2.5 text-right font-mono text-blue-700 font-semibold">
                    {formatCurrency(TaxBreakdown.OutputVATCollected)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600 pl-8">Less: Output VAT Component on Refunds</td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-600">
                    - {formatCurrency(TaxBreakdown.LessRefundOutputVAT)}
                  </td>
                </tr>
                <tr className="bg-blue-50/60 font-semibold">
                  <td className="px-4 py-2.5 text-blue-900">Net Output VAT Payable Owed to BIR</td>
                  <td className="px-4 py-2.5 text-right font-mono text-blue-950 font-bold">
                    {formatCurrency(TaxBreakdown.NetOutputVATPayable)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-700">BIR Form 2550Q Line 18: Exempt Sales Base</td>
                  <td className="px-4 py-2.5 text-right font-mono text-amber-700">
                    {formatCurrency(TaxBreakdown.VATExemptSales)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-700">BIR Form 2550Q Line 17: Zero-Rated Sales Base</td>
                  <td className="px-4 py-2.5 text-right font-mono text-teal-700">
                    {formatCurrency(TaxBreakdown.ZeroRatedSales)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Installment Financing Card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
          <Landmark className="h-5 w-5 text-indigo-600" />
          3. Installment Credit & Financing Schedule (Initiated in Period)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">New Contracts Created</span>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {InstallmentFinancingSummary.NewContractsCreated} Contracts
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Total Invoiced Principal</span>
            <p className="text-lg font-bold text-indigo-600 mt-1">
              {formatCurrency(InstallmentFinancingSummary.TotalInvoicedPrincipal)}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Financed Amount On Credit</span>
            <p className="text-lg font-bold text-blue-600 mt-1">
              {formatCurrency(InstallmentFinancingSummary.FinancedAmountOnCredit)}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Unearned Interest Recognized</span>
            <p className="text-lg font-bold text-amber-600 mt-1">
              {formatCurrency(InstallmentFinancingSummary.UnearnedInterestRecognized)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
