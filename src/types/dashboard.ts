export interface DashboardKpiData {
  today_revenue: number | string
  today_orders: number
  today_avg_sale: number | string
}

export interface DashboardTopProductRow {
  product_id: number
  product_name: string
  units_sold: number
}

export interface DashboardRecentOrderRow {
  order_id: number
  created_at: string // ISO timestamp
  total_amount: number | string
  customer_name: string
}

export interface DashboardData {
  kpi: DashboardKpiData | null
  top_products: DashboardTopProductRow[]
  recent_orders: DashboardRecentOrderRow[]
}