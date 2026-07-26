export interface BIRTaxLedgerParams {
  requesting_account_id: number
  start_date: string
  end_date: string
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
