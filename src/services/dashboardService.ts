import { supabase } from '../lib/supabase'
import { DashboardData } from '../types/dashboard'

export const dashboardService = {
  async getDashboardData(topLimit = 5, recentLimit = 5): Promise<DashboardData> {
    const { data, error } = await supabase.rpc('pos_get_dashboard_data', {
      p_top_product_limit: topLimit,
      p_recent_order_limit: recentLimit,
    })

    if (error) {
      console.error('Error fetching dashboard data:', error)
      throw new Error(error.message)
    }

    const d = (data as DashboardData) || ({} as DashboardData)

    return {
      kpi: d?.kpi || { today_revenue: 0, today_orders: 0, today_avg_sale: 0 },
      top_products: Array.isArray(d?.top_products) ? d.top_products : [],
      recent_orders: Array.isArray(d?.recent_orders) ? d.recent_orders : [],
    }
  }
}
