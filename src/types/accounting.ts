export interface BIRTaxLedgerParams {
  requesting_account_id: number
  start_date: string
  end_date: string
  terminal_id?: number | null
  limit?: number
  offset?: number
}

export interface BIRTaxLedgerRow {
  invoice_id: number
  invoice_date: string
  invoice_number: string
  terminal_name: string
  customer_name: string
  order_status: 'completed' | 'pending' | 'voided' | string
  gross_amount: number
  vatable_sales: number
  vat_amount: number
  vat_exempt_sales: number
  zero_rated_sales: number
  sc_pwd_discount: number
  promo_discount: number
  refund_amount: number
  net_taxable_sales: number
}

export interface MonthlyTaxPrepParams {
  requesting_account_id: number
  start_date: string
  end_date: string
}

export interface MonthlyTaxPrepBusinessInfo {
  Name: string | null
  TIN: string | null
  Address: string | null
}

export interface MonthlyTaxPrepSalesSummary {
  TotalCompletedTransactions: number
  TotalVoidTransactions: number
  GrossSalesWithVoids: number
  LessVoids: number
  LessPromotions: number
  LessSCPWDDiscounts: number
  LessVATExemptions: number
  LessReturnsRefunds: number
  NetTaxableSales: number
}

export interface MonthlyTaxPrepInstallmentSummary {
  NewContractsCreated: number
  TotalInvoicedPrincipal: number
  FinancedAmountOnCredit: number
  UnearnedInterestRecognized: number
}

export interface MonthlyTaxPrepTaxBreakdown {
  VATableSales: number
  OutputVATCollected: number
  LessRefundOutputVAT: number
  NetOutputVATPayable: number
  VATExemptSales: number
  ZeroRatedSales: number
}

export interface MonthlyTaxPrepResult {
  ReportType: string
  TaxpayerCategory: 'VAT-REGISTERED' | 'NON-VAT' | string
  TaxPeriod: {
    StartDate: string
    EndDate: string
  }
  BusinessInfo: MonthlyTaxPrepBusinessInfo
  GeneratedAt: string
  SalesSummary: MonthlyTaxPrepSalesSummary
  InstallmentFinancingSummary: MonthlyTaxPrepInstallmentSummary
  TaxBreakdown: MonthlyTaxPrepTaxBreakdown
}

export interface VATTaxDeclaration {
  GrossSales: number
  LessRefundsAndVoids: number
  VATableSalesBase: number
  OutputVATDue: number
  VATExemptSales: number
  ZeroRatedSales: number
  SC_PWD_Discounts_Claimed: number
  TotalNetTaxLiability: number
}

export interface NonVATTaxDeclaration {
  GrossReceipts: number
  ApplicableTaxRate: string
  PercentageTaxDue: number
}

export interface BIRTaxLedgerResult {
  TaxRegistrationType: 'VAT-REGISTERED' | 'NON-VAT (PERCENTAGE TAXPAYER)'
  TargetForm: string
  DateRange: {
    Start: string
    End: string
  }
  GeneratedAt: string
  TaxDeclaration: VATTaxDeclaration | NonVATTaxDeclaration
}

export interface ARAgingParams {
  requesting_account_id: number
}

export interface ARAgingRow {
  customer_id: number
  customer_name: string
  phone_number: string | null
  current_amount: number
  days_31_60: number
  days_61_90: number
  days_over_90: number
  total_balance: number
}

export interface PnLStatementParams {
  requesting_account_id: number
  start_date: string
  end_date: string
}

export interface PnLRevenue {
  GrossShelfRevenue: number
  LessPromoDiscounts: number
  LessSCPWDDiscounts: number
  LessVATExemptions: number
  NetRevenueRealized: number
}

export interface PnLCostOfGoodsSold {
  TotalCOGS: number
  GrossProfit: number
  GrossProfitMarginPercent: number
}

export interface PnLOperatingExpenses {
  PettyCashPayouts: number
}

export interface PnLNetIncome {
  NetOperatingProfit: number
  NetProfitMarginPercent: number
}

export interface PnLStatementResult {
  StatementType: string
  DateRange: {
    Start: string
    End: string
  }
  GeneratedAt: string
  Revenue: PnLRevenue
  CostOfGoodsSold: PnLCostOfGoodsSold
  OperatingExpenses: PnLOperatingExpenses
  NetIncome: PnLNetIncome
}
