import { supabase } from '../lib/supabase'
import { CartItemInput, PaymentInput, SaleResult, SaleResultRow } from '../types/pos'

export const posService = {
  async createSale(accountId: number, cart: CartItemInput[], payments: PaymentInput[], notes: string, total: number, tax: number | null, total_tendered: number): Promise<SaleResult> {
    const { data, error } = await supabase.rpc('pos_create_sale', {
      p_account_id: accountId,
      p_customer_id: null,
      p_cart_items: cart,
      p_payments: payments,
      p_notes: notes || null,
      p_total: total,
        p_tax: tax || 0,
        p_total_tendered: total_tendered
    })
      console.log('cart',cart);
    console.log('payments',payments);
    console.log('total',total);


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
