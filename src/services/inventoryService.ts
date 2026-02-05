import { supabase } from '../lib/supabase'

export interface AddInventoryBatchInput {
  product_id: number
  account_id: number
  quantity_to_add: number
  expiration_date?: string | null
  notes?: string | null
}

export interface WriteOffInventoryBatchInput {
  batch_id: number
  requesting_account_id: number
  reason: string
}

export interface AdjustInventoryBatchItem {
  batch_id: number
  new_quantity: number
}

export interface AdjustInventoryBatchesInput {
  requesting_account_id: number
  reason: string
  items_to_adjust: AdjustInventoryBatchItem[]
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

  async addInventoryBatch(input: AddInventoryBatchInput): Promise<RpcStandardResponse> {
    const { data, error } = await supabase.rpc('pos2_add_inventory_batch', {
      p_product_id: input.product_id,
      p_account_id: input.account_id,
      p_quantity_to_add: input.quantity_to_add,
      p_expiration_date: input.expiration_date ?? null,
      p_notes: input.notes ?? null,
    })

    if (error) {
      console.error('Error adding inventory batch:', error)
      throw new Error(error.message)
    }

    const result = (Array.isArray(data) ? data[0] : data) as RpcStandardResponse
    return result
  },

  async writeOffInventoryBatch(input: WriteOffInventoryBatchInput): Promise<RpcStandardResponse> {
    const { data, error } = await supabase.rpc('pos2_write_off_inventory_batch', {
      p_batch_id: input.batch_id,
      p_requesting_account_id: input.requesting_account_id,
      p_reason: input.reason,
    })

    if (error) {
      console.error('Error writing off inventory batch:', error)
      throw new Error(error.message)
    }

    const result = (Array.isArray(data) ? data[0] : data) as RpcStandardResponse
    return result
  },

  async adjustInventoryBatches(input: AdjustInventoryBatchesInput): Promise<RpcStandardResponse> {
    const { data, error } = await supabase.rpc('pos2_adjust_inventory_batches', {
      p_requesting_account_id: input.requesting_account_id,
      p_reason: input.reason,
      p_items_to_adjust: input.items_to_adjust,
    })

    if (error) {
      console.error('Error adjusting inventory batches:', error)
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
    const { data, error } = await supabase.rpc('pos2_get_product_activity_history', params)

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
    const { data, error } = await supabase.rpc('pos2_get_product_activity_by_id', params)

    if (error) {
      console.error('Error fetching product activity by id:', error)
      throw new Error(error.message)
    }

    return (data || []) as ProductActivityItem[]
  },
}
