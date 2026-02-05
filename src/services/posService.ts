import { supabase } from '../lib/supabase';
import { OfflineDB } from '../db/offlineDB';
import type {
  CreatePosSaleParams,
  CreateSaleResult,
  ServiceResponse
} from '../types/pos.ts';

export class PosService {

  /**
   * Creates a new POS sale transaction.
   * Handles server-side validation of totals and taxes.
   */
  static async createSale(params: CreatePosSaleParams): Promise<ServiceResponse<CreateSaleResult & { is_offline?: boolean }>> {
    // Check if online
    if (!navigator.onLine) {
      try {
        const offlineSaleId = await OfflineDB.saveSale({
          accountId: params.p_account_id,
          cart: params.p_cart_items,
          payments: params.p_payments,
          notes: params.p_notes || null,
          total: params.p_total,
          tax: params.p_tax,
          total_tendered: params.p_total_tendered,
          createdAt: params.p_occurred_at || new Date().toISOString()
        });

        const result: CreateSaleResult & { is_offline: boolean } = {
          success: true,
          message: 'Sale saved offline. Will sync when online.',
          data: { order_id: offlineSaleId },
          is_offline: true
        };

        return { data: result, error: null };
      } catch (err: any) {
        console.error('Error saving offline sale:', err);
        return { data: null, error: 'Failed to save sale offline' };
      }
    }

    try {
      const { data, error } = await supabase.rpc('pos2_create_sale', {
        p_account_id: params.p_account_id,
        p_customer_id: params.p_customer_id,
        p_cart_items: params.p_cart_items,
        p_payments: params.p_payments,
        p_notes: params.p_notes ?? null,
        p_total: params.p_total,
        p_tax: params.p_tax,
        p_total_tendered: params.p_total_tendered,
        p_occurred_at: params.p_occurred_at ?? null
      });

      if (error) {
        console.error('Error creating sale:', error);
        return { data: null, error: error.message };
      }

      // The function returns a TABLE, so data is an array.
      if (!data || data.length === 0) {
        return { data: null, error: 'Failed to create sale.' };
      }

      // The RPC returns { success, message, data (jsonb) }
      // We map this to our TypeScript interface
      const result = data[0] as CreateSaleResult;

      // If the RPC internally caught an exception and returned success: false
      if (!result.success) {
        return { data: null, error: result.message };
      }

      return { data: { ...result, is_offline: false }, error: null };

    } catch (err: any) {
      console.error('Unexpected error during sale:', err);
      return {
        data: null,
        error: err.message || 'An unexpected error occurred while processing the sale.'
      };
    }
  }
}
