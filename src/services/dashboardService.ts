import { supabase } from '../lib/supabase'
import { DashboardData } from '../types/dashboard'

export const dashboardService = {
  async getDashboardData(
    topLimit = 5,
    recentLimit = 5,
    targetDate?: string   // ISO date string e.g. '2026-07-13'; defaults to today on the DB side
  ): Promise<DashboardData> {
    const params: Record<string, unknown> = {
      p_top_product_limit: topLimit,
      p_recent_order_limit: recentLimit,
    }
    if (targetDate) {
      params.p_target_date = targetDate
    }

    const { data, error } = await supabase.rpc('pos2_get_dashboard_data', params)

    if (error) {
      console.error('Error fetching dashboard data:', error)
      throw new Error(error.message)
    }
    const d = (data as DashboardData) || ({} as DashboardData)

    return {
      kpi: d?.kpi || {
        net_sales_today: 0,
        order_count_today: 0,
        total_collections_today: 0,
        total_outstanding_debt: 0,
      },
      top_products: Array.isArray(d?.top_products) ? d.top_products : [],
      recent_orders: Array.isArray(d?.recent_orders) ? d.recent_orders : [],
    }
  }
}
