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
  total_revenue: string
}

export interface LowStockProductRow {
  product_id: number
  product_name: string
  sku: string | null
  current_quantity: number
}

export interface GetSalesOverTimeParams {
  requesting_account_id: number
  start_date: string // ISO timestamp
  end_date: string // ISO timestamp
}

export interface GetSalesByStaffParams extends GetSalesOverTimeParams {}

export interface GetBestSellingProductsParams extends GetSalesOverTimeParams {
  limit: number
}

export interface GetLowStockProductsParams {
  requesting_account_id: number
  threshold: number
}

