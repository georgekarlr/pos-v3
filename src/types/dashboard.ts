export interface DashboardKpiData {
  net_sales_today: number | string
  order_count_today: number
  total_collections_today: number | string
  total_outstanding_debt: number | string
}

export interface DashboardTopProductRow {
  product_id: number
  product_name: string
  units_sold: number
}

export interface DashboardRecentOrderRow {
  order_id: number
  invoice_number: string | null
  created_at: string // ISO timestamp
  total_amount: number | string
  customer_name: string
}

export interface DashboardData {
  kpi: DashboardKpiData | null
  top_products: DashboardTopProductRow[]
  recent_orders: DashboardRecentOrderRow[]
}