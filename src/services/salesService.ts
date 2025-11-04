import { supabase } from '../lib/supabase'
import { SaleDetailsResponse, SalesHistoryRow } from '../types/sales'

export interface GetSalesHistoryParams {
  limit: number
  offset: number
  searchTerm?: string | null
  startDate?: string | null // ISO string
  endDate?: string | null // ISO string
}

export const salesService = {
  async getSalesHistory(params: GetSalesHistoryParams): Promise<{ rows: SalesHistoryRow[] }> {
    const { limit, offset, searchTerm, startDate, endDate } = params
    const { data, error } = await supabase.rpc('pos_get_sales_history', {
      p_limit: limit,
      p_offset: offset,
      p_search_term: searchTerm || null,
      p_start_date: startDate || null,
      p_end_date: endDate || null
    })

    if (error) {
      console.error('Error fetching sales history:', error)
      throw new Error(error.message)
    }

    return { rows: (data || []) as SalesHistoryRow[] }
  },

  async getSaleDetailsById(orderId: number): Promise<SaleDetailsResponse> {
    const { data, error } = await supabase.rpc('pos_get_sale_details_by_id', {
      p_order_id: orderId
    })

    if (error) {
      console.error('Error fetching sale details:', error)
      throw new Error(error.message)
    }

    return (data || {}) as SaleDetailsResponse
  }
}
