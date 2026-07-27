import React from 'react'
import { MonthlyTaxPrepResult } from '../../types/accounting'
import { exportToCSV } from '../../utils/csvExporter'
import { TaxPrepHeaderCard } from './monthlyTaxPrep/TaxPrepHeaderCard'
import { TaxPrepKpiGrid } from './monthlyTaxPrep/TaxPrepKpiGrid'
import { TaxPrepSalesSummaryTable } from './monthlyTaxPrep/TaxPrepSalesSummaryTable'
import { TaxPrepTaxBreakdownTable } from './monthlyTaxPrep/TaxPrepTaxBreakdownTable'
import { TaxPrepInstallmentSummaryGrid } from './monthlyTaxPrep/TaxPrepInstallmentSummaryGrid'

interface MonthlyTaxPrepViewProps {
  data: MonthlyTaxPrepResult | null
  startDate: string
  endDate: string
  loading?: boolean
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
    BusinessInfo,
    SalesSummary,
    InstallmentFinancingSummary,
    TaxBreakdown,
  } = data

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
      ['VATable Sales Base (Line 15A)', TaxBreakdown.VATableSales],
      ['Output VAT Collected (12%) (Line 15B)', TaxBreakdown.OutputVATCollected],
      ['Less Refund Output VAT', TaxBreakdown.LessRefundOutputVAT],
      ['Net Output VAT Payable', TaxBreakdown.NetOutputVATPayable],
      ['Excess VAT Credit Carried Over (Line 23)', TaxBreakdown.ExcessVATCreditCarriedOver ?? 0],
      ['VAT-Exempt Sales (Line 18)', TaxBreakdown.VATExemptSales],
      ['Zero-Rated Sales (Line 17)', TaxBreakdown.ZeroRatedSales],
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
      {/* 1. Header Info Card */}
      <TaxPrepHeaderCard
        reportType={ReportType}
        taxpayerCategory={TaxpayerCategory}
        startDate={startDate}
        endDate={endDate}
        businessInfo={BusinessInfo}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
      />

      {/* 2. Primary KPI Grid */}
      <TaxPrepKpiGrid salesSummary={SalesSummary} taxBreakdown={TaxBreakdown} />

      {/* 3. Detailed Declarations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaxPrepSalesSummaryTable salesSummary={SalesSummary} />
        <TaxPrepTaxBreakdownTable taxBreakdown={TaxBreakdown} />
      </div>

      {/* 4. Installment Financing Card */}
      <TaxPrepInstallmentSummaryGrid installmentSummary={InstallmentFinancingSummary} />
    </div>
  )
}
