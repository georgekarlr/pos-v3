import { supabase } from '../lib/supabase'
import { SaleDetailsResponse, SalesHistoryRow, RefundDetailRow, RefundableItem } from '../types/sales'
import { RecordManualSaleParams } from '../types/pos'

export interface GetSalesHistoryParams {
  limit: number
  offset: number
  searchTerm?: string | null
  startDate?: string | null // ISO string
  endDate?: string | null // ISO string
}

export interface BulkRefundItemInput {
  order_item_id: number
  quantity: number
  // Per-line base refund amount (pre-tax)
  refund_amount: number
  // Per-line tax component for the refunded quantity
  tax_component: number
}

export interface BulkRefundResult {
  success: boolean
  message: string
  data?: { refund_ids?: number[]; total_refunded_amount?: number }
}

export interface VoidSaleResult {
  success: boolean
  message: string
}

export const salesService = {
  async getSalesHistory(params: GetSalesHistoryParams): Promise<{ rows: SalesHistoryRow[] }> {
    const { limit, offset, searchTerm, startDate, endDate } = params
    const { data, error } = await supabase.rpc('pos2_get_sales_history', {
      p_limit: limit,
      p_offset: offset,
      p_search_term: searchTerm || null,
      p_start_date: startDate || null,
      p_end_date: endDate || null
    })
    console.log('Sales history', data);
    if (error) {
      console.error('Error fetching sales history:', error)
      throw new Error(error.message)
    }

    return { rows: (data || []) as SalesHistoryRow[] }
  },

  async getRefundDetails(params: {
    limit: number
    offset: number
    requestingAccountId: number
    orderId?: number | null
    searchTerm?: string | null
    startDate?: string | null
    endDate?: string | null
  }): Promise<{ rows: RefundDetailRow[] }> {
    const { limit, offset, requestingAccountId, orderId, searchTerm, startDate, endDate } = params
    const { data, error } = await supabase.rpc('pos2_get_refund_details', {
      p_requesting_account_id: requestingAccountId,
      p_limit: limit,
      p_offset: offset,
      p_order_id: orderId ?? null,
      p_search_term: searchTerm ?? null,
      p_start_date: startDate ?? null,
      p_end_date: endDate ?? null
    })
    console.log('Refund details', data);
    if (error) {
      console.error('Error fetching refund details:', error)
      throw new Error(error.message)
    }

    return { rows: (data || []) as RefundDetailRow[] }
  },

  async getSaleDetailsById(orderId: number): Promise<SaleDetailsResponse> {
    const { data, error } = await supabase.rpc('pos2_get_sale_details_by_id', {
      p_order_id: orderId
    })
    console.log('Sale details', data);
    console.log('vat_exempt_discount_amount', data.vat_exempt_discount_amount);
    if (error) {
      console.error('Error fetching sale details:', error)
      throw new Error(error.message)
    }

    return (data || {}) as SaleDetailsResponse
  },

  async getRefundableItems(orderId: number): Promise<RefundableItem[]> {
    const { data, error } = await supabase.rpc('pos2_get_refundable_items', {
      p_order_id: orderId
    })
    if (error) {
      console.error('Error fetching refundable items:', error)
      throw new Error(error.message)
    }
    return (data || []) as RefundableItem[]
  },

  async createBulkRefund(params: {
    order_id: number
    terminal_id: number
    items_to_refund: BulkRefundItemInput[]
    requesting_account_id: number
    refund_payment_method: string
    reason: string
  }): Promise<BulkRefundResult> {
    const { order_id, terminal_id, items_to_refund, requesting_account_id, refund_payment_method, reason } = params

    const { data, error } = await supabase.rpc('pos2_create_bulk_refund', {
      p_order_id: order_id,
      p_terminal_id: terminal_id,
      p_items_to_refund: items_to_refund,
      p_requesting_account_id: requesting_account_id,
      p_refund_payment_method: refund_payment_method,
      p_reason: reason
    })

    console.log('Bulk refund data:', data);
    console.log('Bulk refund error:', error);
    console.log('Bulk refund params:', params);
    if (error) {
      console.error('Error creating bulk refund:', error)
      return { success: false, message: error.message }
    }

    const row = Array.isArray(data) ? data[0] : data
    return {
      success: !!row?.success,
      message: row?.message || (row?.success ? 'Refund processed' : 'Failed to process refund'),
      data: row?.data || undefined
    }
  },

  async voidSale(params: {
    requesting_account_id: number
    order_id: number
    reason: string
  }): Promise<VoidSaleResult> {
    const { requesting_account_id, order_id, reason } = params

    const { data, error } = await supabase.rpc('pos2_void_sale', {
      p_requesting_account_id: requesting_account_id,
      p_order_id: order_id,
      p_reason: reason
    })

    if (error) {
      console.error('Error voiding sale:', error)
      return { success: false, message: error.message }
    }

    const row = Array.isArray(data) ? data[0] : data
    return {
      success: !!row?.success,
      message: row?.message || (row?.success ? 'Transaction successfully voided.' : 'Failed to void transaction.')
    }
  },

  async recordManualSale(params: RecordManualSaleParams): Promise<{ success: boolean; message: string; data?: any }> {
    const { data, error } = await supabase.rpc('pos2_record_manual_sale', params)

    console.log('Manual sale data:', data);
    console.log('Manual sale error:', error);
    console.log('Manual sale params:', params);
    if (error) {
      console.error('Error recording manual sale:', error)
      return { success: false, message: error.message }
    }

    console.log('Manual sale recorded:', data);
    const row = Array.isArray(data) ? data[0] : data
    return {
      success: !!row?.success,
      message: row?.message || (row?.success ? 'Manual receipt recorded successfully.' : 'Failed to record manual receipt.'),
      data: row?.data || undefined
    }
  }
}
