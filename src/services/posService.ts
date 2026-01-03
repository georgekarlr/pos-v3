import { supabase } from '../lib/supabase'
import { CartItemInput, PaymentInput, SaleResult, SaleResultRow } from '../types/pos'
import { offlineDB } from '../db/offlineDB'

export const posService = {
  async createSale(accountId: number, cart: CartItemInput[], payments: PaymentInput[], notes: string, total: number, tax: number | null, total_tendered: number): Promise<SaleResult> {
    // Check if online
    if (!navigator.onLine) {
      try {
        const offlineSaleId = await offlineDB.saveSale({
          accountId,
          cart,
          payments,
          notes,
          total,
          tax,
          total_tendered,
          createdAt: new Date().toISOString()
        });
        return { success: true, message: 'Sale saved offline. Will sync when online.', order_id: offlineSaleId, is_offline: true };
      } catch (err) {
        console.error('Error saving offline sale:', err);
        return { success: false, message: 'Failed to save sale offline' };
      }
    }

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
      order_id: row.data?.order_id,
      is_offline: false
    }
  }
}
