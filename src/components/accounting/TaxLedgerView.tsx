import React from 'react'
import { BIRTaxLedgerResult, VATTaxDeclaration, NonVATTaxDeclaration } from '../../types/accounting'
import { exportToCSV } from '../../utils/csvExporter'
import { Download, Printer, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

interface TaxLedgerViewProps {
  data: BIRTaxLedgerResult | null
  startDate: string
  endDate: string
}

const formatCurrency = (val: number | undefined | null) => {
  const num = val ?? 0
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num)
}

export const TaxLedgerView: React.FC<TaxLedgerViewProps> = ({ data, startDate, endDate }) => {
  if (!data) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
        No tax ledger data loaded. Select a date range and click Apply.
      </div>
    )
  }

  const isVAT = data.TaxRegistrationType === 'VAT-REGISTERED'

  const handleExportCSV = () => {
    if (!data) return
    const rows: (string | number)[][] = []

    if (isVAT) {
      const decl = data.TaxDeclaration as VATTaxDeclaration
      rows.push(['Gross Sales', decl.GrossSales])
      rows.push(['Less Refunds & Voids', decl.LessRefundsAndVoids])
      rows.push(['VATable Sales Base (Form 2550Q Line 15A)', decl.VATableSalesBase])
      rows.push(['Output VAT Due (Form 2550Q Line 15B)', decl.OutputVATDue])
      rows.push(['VAT-Exempt Sales (Form 2550Q Line 18)', decl.VATExemptSales])
      rows.push(['Zero-Rated Sales (Form 2550Q Line 17)', decl.ZeroRatedSales])
      rows.push(['SC/PWD Discounts Claimed', decl.SC_PWD_Discounts_Claimed])
      rows.push(['Total Net Tax Liability Owed to BIR', decl.TotalNetTaxLiability])
    } else {
      const decl = data.TaxDeclaration as NonVATTaxDeclaration
      rows.push(['Gross Receipts (Taxable Base)', decl.GrossReceipts])
      rows.push(['Applicable Percentage Tax Rate', decl.ApplicableTaxRate])
      rows.push(['Percentage Tax Due (Form 2551Q Line 14)', decl.PercentageTaxDue])
    }

    exportToCSV({
      filename: `BIR_Tax_Ledger_${startDate}_to_${endDate}.csv`,
      title: `${data.TargetForm} - Tax Ledger`,
      headers: ['Tax Field / Description', 'Amount (PHP) / Value'],
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
      {/* Summary Header Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-start space-x-3">
            <div className={`p-3 rounded-lg ${isVAT ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-gray-900">{data.TargetForm}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isVAT ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {data.TaxRegistrationType}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Official BIR Tax Declaration Ledger for period {data.DateRange.Start} to {data.DateRange.End}
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

        {/* Declaration Display */}
        {isVAT ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Gross Sales</span>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {formatCurrency((data.TaxDeclaration as VATTaxDeclaration).GrossSales)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-500 font-medium">VATable Sales Base</span>
                <p className="text-lg font-bold text-indigo-600 mt-1">
                  {formatCurrency((data.TaxDeclaration as VATTaxDeclaration).VATableSalesBase)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-500 font-medium">12% Output VAT Due</span>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {formatCurrency((data.TaxDeclaration as VATTaxDeclaration).OutputVATDue)}
                </p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <span className="text-xs text-indigo-700 font-medium">Net Tax Owed to BIR</span>
                <p className="text-xl font-bold text-indigo-900 mt-1">
                  {formatCurrency((data.TaxDeclaration as VATTaxDeclaration).TotalNetTaxLiability)}
                </p>
              </div>
            </div>

            {/* BIR Form 2550Q Line Item Breakdown Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">BIR Form 2550Q Line Item</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount (PHP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  <tr>
                    <td className="px-4 py-3 text-gray-900 font-medium">Gross Sales / Receipts</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                      {formatCurrency((data.TaxDeclaration as VATTaxDeclaration).GrossSales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-600 pl-8">Less: Sales Returns, Refunds & Voids</td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">
                      - {formatCurrency((data.TaxDeclaration as VATTaxDeclaration).LessRefundsAndVoids)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-900 font-semibold">Line 15A: VATable Sales Base</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">
                      {formatCurrency((data.TaxDeclaration as VATTaxDeclaration).VATableSalesBase)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-900 font-semibold">Line 15B: Output VAT Due (12%)</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">
                      {formatCurrency((data.TaxDeclaration as VATTaxDeclaration).OutputVATDue)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-600 pl-8">Line 17: Zero-Rated Sales Base</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">
                      {formatCurrency((data.TaxDeclaration as VATTaxDeclaration).ZeroRatedSales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-600 pl-8">Line 18: Exempt Sales Base (Net of SC/PWD)</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">
                      {formatCurrency((data.TaxDeclaration as VATTaxDeclaration).VATExemptSales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-600 pl-8">SC & PWD Statutory Discounts Claimed</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">
                      {formatCurrency((data.TaxDeclaration as VATTaxDeclaration).SC_PWD_Discounts_Claimed)}
                    </td>
                  </tr>
                  <tr className="bg-indigo-50 font-bold">
                    <td className="px-4 py-3 text-indigo-900">Total Net Tax Liability (Form 2550Q Owed)</td>
                    <td className="px-4 py-3 text-right font-mono text-indigo-900 text-base">
                      {formatCurrency((data.TaxDeclaration as VATTaxDeclaration).TotalNetTaxLiability)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Gross Taxable Receipts</span>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {formatCurrency((data.TaxDeclaration as NonVATTaxDeclaration).GrossReceipts)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Applicable Percentage Tax Rate</span>
                <p className="text-lg font-bold text-amber-600 mt-1">
                  {(data.TaxDeclaration as NonVATTaxDeclaration).ApplicableTaxRate}
                </p>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <span className="text-xs text-amber-800 font-medium">Percentage Tax Due (BIR 2551Q)</span>
                <p className="text-xl font-bold text-amber-900 mt-1">
                  {formatCurrency((data.TaxDeclaration as NonVATTaxDeclaration).PercentageTaxDue)}
                </p>
              </div>
            </div>

            {/* BIR Form 2551Q Line Item Breakdown Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">BIR Form 2551Q Line Item</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount / Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  <tr>
                    <td className="px-4 py-3 text-gray-900 font-medium">Gross Taxable Receipts (Net of Refunds)</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                      {formatCurrency((data.TaxDeclaration as NonVATTaxDeclaration).GrossReceipts)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-600">Standard Non-VAT Tax Rate (Sec. 116 NIRC)</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700 font-semibold">
                      {(data.TaxDeclaration as NonVATTaxDeclaration).ApplicableTaxRate}
                    </td>
                  </tr>
                  <tr className="bg-amber-50 font-bold">
                    <td className="px-4 py-3 text-amber-900">Percentage Tax Owed (BIR Form 2551Q Line 14)</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-900 text-base">
                      {formatCurrency((data.TaxDeclaration as NonVATTaxDeclaration).PercentageTaxDue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
