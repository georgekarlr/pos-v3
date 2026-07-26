import React from 'react'
import { PnLStatementResult } from '../../types/accounting'
import { exportToCSV } from '../../utils/csvExporter'
import { Download, Printer, TrendingUp, DollarSign, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface PnLStatementViewProps {
  data: PnLStatementResult | null
  startDate: string
  endDate: string
}

const formatCurrency = (val: number | undefined | null) => {
  const num = val ?? 0
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num)
}

export const PnLStatementView: React.FC<PnLStatementViewProps> = ({ data, startDate, endDate }) => {
  if (!data) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
        No P&L statement loaded. Select a date range and click Apply.
      </div>
    )
  }

  const { Revenue, CostOfGoodsSold, OperatingExpenses, NetIncome } = data

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['Gross Shelf Revenue', Revenue.GrossShelfRevenue],
      ['Less Promo Discounts', Revenue.LessPromoDiscounts],
      ['Less Senior/PWD Discounts', Revenue.LessSCPWDDiscounts],
      ['Less VAT Exemptions', Revenue.LessVATExemptions],
      ['Net Realized Sales Revenue', Revenue.NetRevenueRealized],
      ['Cost of Goods Sold (COGS)', CostOfGoodsSold.TotalCOGS],
      ['Gross Profit', CostOfGoodsSold.GrossProfit],
      ['Gross Profit Margin (%)', `${CostOfGoodsSold.GrossProfitMarginPercent}%`],
      ['Operating Expenses (Petty Cash Payouts)', OperatingExpenses.PettyCashPayouts],
      ['Net Operating Profit', NetIncome.NetOperatingProfit],
      ['Net Profit Margin (%)', `${NetIncome.NetProfitMarginPercent}%`],
    ]

    exportToCSV({
      filename: `PnL_Statement_${startDate}_to_${endDate}.csv`,
      title: 'Profit & Loss Statement (Income Statement)',
      headers: ['Financial Line Item', 'Amount (PHP) / Percentage'],
      rows,
      startDate,
      endDate,
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const isNetProfitPositive = NetIncome.NetOperatingProfit >= 0

  return (
    <div className="space-y-6">
      {/* Financial KPI Summary Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Net Realized Revenue</span>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(Revenue.NetRevenueRealized)}</p>
          <span className="text-xs text-gray-500">Gross Shelf: {formatCurrency(Revenue.GrossShelfRevenue)}</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Gross Profit</span>
            <PieChart className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-indigo-600">{formatCurrency(CostOfGoodsSold.GrossProfit)}</p>
          <span className="text-xs text-indigo-700 font-medium">
            Margin: {CostOfGoodsSold.GrossProfitMarginPercent}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Operating Expenses</span>
            <ArrowDownRight className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-600">
            {formatCurrency(OperatingExpenses.PettyCashPayouts)}
          </p>
          <span className="text-xs text-amber-700 font-medium">Petty cash outflows</span>
        </div>

        <div className={`p-4 rounded-xl shadow-sm border ${
          isNetProfitPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${isNetProfitPositive ? 'text-emerald-800' : 'text-red-800'}`}>
              Net Operating Profit
            </span>
            {isNetProfitPositive ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
          </div>
          <p className={`text-2xl font-extrabold ${isNetProfitPositive ? 'text-emerald-900' : 'text-red-900'}`}>
            {formatCurrency(NetIncome.NetOperatingProfit)}
          </p>
          <span className={`text-xs font-semibold ${isNetProfitPositive ? 'text-emerald-700' : 'text-red-700'}`}>
            Net Margin: {NetIncome.NetProfitMarginPercent}%
          </span>
        </div>
      </div>

      {/* Main Income Statement Details */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Profit & Loss Statement</h2>
            <p className="text-sm text-gray-500">
              For period starting {data.DateRange.Start} ending {data.DateRange.End}
            </p>
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

        {/* Financial Line Item Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Financial Schedule / Line Item</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount (PHP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {/* REVENUE SECTION */}
              <tr className="bg-gray-50/50">
                <td colSpan={2} className="px-4 py-2 font-bold text-gray-900 uppercase text-xs tracking-wider">
                  1. Revenue & Sales Realized
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-700 pl-8">Gross Shelf Revenue</td>
                <td className="px-4 py-2.5 text-right font-mono text-gray-900">
                  {formatCurrency(Revenue.GrossShelfRevenue)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-500 pl-12">Less: Promotional Discounts</td>
                <td className="px-4 py-2.5 text-right font-mono text-red-600">
                  - {formatCurrency(Revenue.LessPromoDiscounts)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-500 pl-12">Less: Senior Citizen / PWD Discounts</td>
                <td className="px-4 py-2.5 text-right font-mono text-red-600">
                  - {formatCurrency(Revenue.LessSCPWDDiscounts)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-500 pl-12">Less: VAT Exemption Discounts</td>
                <td className="px-4 py-2.5 text-right font-mono text-red-600">
                  - {formatCurrency(Revenue.LessVATExemptions)}
                </td>
              </tr>
              <tr className="bg-blue-50/40 font-semibold">
                <td className="px-4 py-2.5 text-blue-900 pl-8">Total Net Realized Sales Revenue</td>
                <td className="px-4 py-2.5 text-right font-mono text-blue-900 font-bold">
                  {formatCurrency(Revenue.NetRevenueRealized)}
                </td>
              </tr>

              {/* COGS SECTION */}
              <tr className="bg-gray-50/50">
                <td colSpan={2} className="px-4 py-2 font-bold text-gray-900 uppercase text-xs tracking-wider">
                  2. Direct Cost of Goods Sold (COGS)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-700 pl-8">Cost of Products Sold</td>
                <td className="px-4 py-2.5 text-right font-mono text-gray-900">
                  {formatCurrency(CostOfGoodsSold.TotalCOGS)}
                </td>
              </tr>
              <tr className="bg-indigo-50/40 font-semibold">
                <td className="px-4 py-2.5 text-indigo-900 pl-8">
                  Gross Profit (Margin: {CostOfGoodsSold.GrossProfitMarginPercent}%)
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-indigo-900 font-bold">
                  {formatCurrency(CostOfGoodsSold.GrossProfit)}
                </td>
              </tr>

              {/* OPERATING EXPENSES SECTION */}
              <tr className="bg-gray-50/50">
                <td colSpan={2} className="px-4 py-2 font-bold text-gray-900 uppercase text-xs tracking-wider">
                  3. Operating Expenses
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-700 pl-8">Petty Cash Outflows & Operational Expenses</td>
                <td className="px-4 py-2.5 text-right font-mono text-amber-700">
                  {formatCurrency(OperatingExpenses.PettyCashPayouts)}
                </td>
              </tr>

              {/* NET INCOME SECTION */}
              <tr className={`font-extrabold text-base ${isNetProfitPositive ? 'bg-emerald-100 text-emerald-950' : 'bg-red-100 text-red-950'}`}>
                <td className="px-4 py-3">
                  Net Operating Profit (Margin: {NetIncome.NetProfitMarginPercent}%)
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCurrency(NetIncome.NetOperatingProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
