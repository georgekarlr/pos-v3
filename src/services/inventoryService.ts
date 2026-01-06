import { supabase } from '../lib/supabase'

export interface AdjustQuantityInput {
  product_id: number
  account_id: number
  adjustment_value: number
  notes: string
}

export interface RpcStandardResponse<T = any> {
  success: boolean
  message: string
  data: T | null
}

export type ProductActionType = 'STOCK_ADJUSTED' | string

export interface ProductActivityItem {
  activity_id: number
  product_id: number
  product_name: string
  account_id: number
  account_name: string
  action_type: ProductActionType
  changes: any
  notes: string | null
  created_at: string
}

export const InventoryService = {
  async adjustProductQuantity(input: AdjustQuantityInput): Promise<RpcStandardResponse> {
    const { data, error } = await supabase.rpc('pos_adjust_product_quantity', {
      p_product_id: input.product_id,
      p_account_id: input.account_id,
      p_adjustment_value: input.adjustment_value,
      p_notes: input.notes,
    })

    if (error) {
      console.error('Error adjusting product quantity:', error)
      throw new Error(error.message)
    }

    const result = (Array.isArray(data) ? data[0] : data) as RpcStandardResponse
    return result
  },

  async getAllProductActivity(limit: number, offset: number, actionFilter?: ProductActionType): Promise<ProductActivityItem[]> {
    const params: Record<string, any> = {
      p_limit: limit,
      p_offset: offset,
    }
    if (actionFilter) {
      params.p_action_filter = actionFilter
    }
    const { data, error } = await supabase.rpc('pos_get_product_activity_history', params)

    if (error) {
      console.error('Error fetching product activity history:', error)
      throw new Error(error.message)
    }

    return (data || []) as ProductActivityItem[]
  },

  async getProductActivityById(product_id: number, limit: number, offset: number, actionFilter?: ProductActionType): Promise<ProductActivityItem[]> {
    const params: Record<string, any> = {
      p_product_id: product_id,
      p_limit: limit,
      p_offset: offset,
    }
    if (actionFilter) {
      params.p_action_filter = actionFilter
    }
    const { data, error } = await supabase.rpc('pos_get_product_activity_by_id', params)

    if (error) {
      console.error('Error fetching product activity by id:', error)
      throw new Error(error.message)
    }

    return (data || []) as ProductActivityItem[]
  },
}
