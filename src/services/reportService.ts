import { supabase } from '../lib/supabase'
import {
  BestSellingProductRow,
  GetBestSellingProductsParams,
  GetLowStockProductsParams,
  GetSalesByStaffParams,
  GetSalesOverTimeParams,
  LowStockProductRow,
  SalesByStaffRow,
  SalesOverTimeRow,
} from '../types/report'

export const ReportService = {
  async getSalesOverTime(params: GetSalesOverTimeParams): Promise<SalesOverTimeRow[]> {
    const { requesting_account_id, start_date, end_date } = params
    const { data, error } = await supabase.rpc('pos_report_sales_over_time', {
      p_requesting_account_id: requesting_account_id,
      p_start_date: start_date,
      p_end_date: end_date
    })

    if (error) {
      console.error('Error fetching sales over time:', error)
      throw new Error(error.message)
    }

    return (data || []) as SalesOverTimeRow[]
  },

  async getSalesByStaff(params: GetSalesByStaffParams): Promise<SalesByStaffRow[]> {
    const { requesting_account_id, start_date, end_date } = params
    const { data, error } = await supabase.rpc('pos_report_sales_by_staff', {
      p_requesting_account_id: requesting_account_id,
      p_start_date: start_date,
      p_end_date: end_date
    })

    if (error) {
      console.error('Error fetching sales by staff:', error)
      throw new Error(error.message)
    }

    return (data || []) as SalesByStaffRow[]
  },

  async getBestSellingProducts(params: GetBestSellingProductsParams): Promise<BestSellingProductRow[]> {
    const { requesting_account_id, start_date, end_date, limit } = params
    const { data, error } = await supabase.rpc('pos_report_best_selling_products', {
      p_requesting_account_id: requesting_account_id,
      p_start_date: start_date,
      p_end_date: end_date,
      p_limit: limit
    })

    if (error) {
      console.error('Error fetching best-selling products:', error)
      throw new Error(error.message)
    }

    return (data || []) as BestSellingProductRow[]
  },

  async getLowStockProducts(params: GetLowStockProductsParams): Promise<LowStockProductRow[]> {
    const { requesting_account_id, threshold } = params
    const { data, error } = await supabase.rpc('pos_report_low_stock_products', {
      p_requesting_account_id: requesting_account_id,
      p_threshold: threshold
    })

    if (error) {
      console.error('Error fetching low stock products:', error)
      throw new Error(error.message)
    }

    return (data || []) as LowStockProductRow[]
  },
}
