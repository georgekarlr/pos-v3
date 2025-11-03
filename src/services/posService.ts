import { supabase } from '../lib/supabase'
import { CartItemInput, PaymentInput, SaleResult, SaleResultRow } from '../types/pos'

export const posService = {
  async createSale(accountId: number, cart: CartItemInput[], payments: PaymentInput[], notes: string | null): Promise<SaleResult> {
    const { data, error } = await supabase.rpc('pos_create_sale', {
      p_account_id: accountId,
      p_customer_id: null,
      p_cart_items: cart,
      p_payments: payments,
      p_notes: notes || null
    })

    if (error) {
      console.error('Error creating sale:', error)
      return { success: false, message: error.message }
    }

    const row: SaleResultRow | undefined = data?.[0]
    if (!row) return { success: false, message: 'Unknown response from server' }
    return {
      success: row.success,
      message: row.message,
      order_id: row.data?.order_id
    }
  }
}
