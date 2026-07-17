export interface SalesOverTimeRow {
  report_date: string // ISO date string (yyyy-mm-dd)
  total_revenue: string // numeric comes back as string
  order_count: number
}

export interface SalesByStaffRow {
  account_id: number
  account_name: string | null
  total_revenue: string
  order_count: number
}

export interface BestSellingProductRow {
  product_id: number
  product_name: string
  total_units_sold: number
  unit_type: string
  total_revenue: string
}

export interface LowStockProductRow {
  product_id: number
  product_name: string
  sku: string | null
  unit_type: string
  current_stock: number
}

export interface GetSalesOverTimeParams {
  requesting_account_id: number
  start_date: string // ISO timestamp
  end_date: string // ISO timestamp
}

export interface GetSalesByStaffParams extends GetSalesOverTimeParams { }

export interface GetBestSellingProductsParams extends GetSalesOverTimeParams {
  limit: number
}

export interface GetLowStockProductsParams {
  requesting_account_id: number
  threshold: number
}

// ─── X-Reading ────────────────────────────────────────────────────────────────

export interface CollectionBreakdown {
  method: string
  amount: number
}

export interface CollectionDetails {
  TotalCollected: number
  Breakdown: CollectionBreakdown[]
}

export interface XReadingDeductions {
  SC_PWD_Discount: number
  VAT_Exempt_Discount: number
  Promotions: number
  Refunds: number
  Voids: number
}

export interface XReadingVAT {
  VATable: number
  VATAmount: number
  Exempt: number
  ZeroRated: number
}

export interface XReadingResult {
  ReportType: string
  GeneratedAt: string
  Business?: { Name: string; Address: string; TIN: string }
  Terminal: { Name: string; MIN: string; CashierName: string }
  TransactionRange: { Start: string | null; End: string | null }
  GrossSales: number
  Deductions: XReadingDeductions
  NetSales: number
  VAT: XReadingVAT
  Collections?: CollectionDetails
}

export interface GenerateXReadingParams {
  requesting_account_id: number
  terminal_id: number
  target_date: string // 'YYYY-MM-DD'
}

// ─── Z-Reading ────────────────────────────────────────────────────────────────

export interface ZReadingGrandTotals {
  OldCumulative: number
  TodaysSales: number
  NewCumulative: number
}

export interface ZReadingVAT {
  VATable: number
  VATAmount: number
  Exempt: number
  ZeroRated: number
}

export interface ZReadingResult {
  ReportType: string
  ReadingDate: string
  GeneratedAt: string
  Business: { Name: string; Address: string; TIN: string }
  Terminal: { Name: string; MIN: string; PTU: string; AdminName: string }
  Invoices: { Start: string | null; End: string | null }
  GrossSales: number
  NetSales: number
  Deductions: { SC_PWD_Discount: number; VAT_Exempt_Discount: number; Promotions: number; Refunds: number; Voids: number }
  VAT: ZReadingVAT
  GrandTotals: ZReadingGrandTotals
  Collections?: CollectionDetails
}

export interface ZReadingRPCRow {
  success: boolean
  message: string
  data: ZReadingResult | null
}

export interface GenerateZReadingParams {
  requesting_account_id: number
  terminal_id: number
  target_date: string // 'YYYY-MM-DD'
}

// ─── E-Journal ────────────────────────────────────────────────────────────────

export interface EJournalRow {
  log_id: number
  created_at: string
  terminal_name: string
  account_name: string
  event_type: string
  event_description: string
  details: Record<string, unknown> | null
}

export interface GetEJournalParams {
  requesting_account_id: number
  limit: number
  offset: number
  terminal_id?: number | null
  start_date?: string | null
  end_date?: string | null
}

// ─── BIR Books of Accounts (RMO No. 10-2005) ───────────────────────────────────

export interface BIRSalesBookRow {
  reading_date: string
  terminal_name: string
  min_number: string
  starting_invoice: string | null
  ending_invoice: string | null
  gross_sales: number
  vatable_sales: number
  vat_amount: number
  vat_exempt_sales: number
  zero_rated_sales: number
  total_discounts: number
  previous_grand_total: number
  ending_grand_total: number
}

export interface SCPWDBookRow {
  transaction_date: string
  invoice_number: string
  sc_pwd_name: string
  sc_pwd_id: string
  gross_sales: number
  vat_exempt_sales: number
  discount_amount: number
  net_sales: number
}

export interface VoidsAndRefundsRow {
  action_date: string
  adjustment_type: 'VOID' | 'REFUND'
  invoice_number: string
  original_total: number
  adjusted_amount: number
  reason: string | null
  authorized_by: string | null
}

export interface GetBIRBooksParams {
  requesting_account_id: number
  start_date: string // 'YYYY-MM-DD'
  end_date: string // 'YYYY-MM-DD'
}


