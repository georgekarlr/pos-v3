import { offlineDB } from '../db/offlineDB';
import { supabase } from '../lib/supabase';

export const syncService = {
  isSyncing: false,

  async syncOfflineSales() {
    if (this.isSyncing || !navigator.onLine) return;

    const sales = await offlineDB.getAllSales();
    if (sales.length === 0) return;

    this.isSyncing = true;
    console.log(`Starting sync of ${sales.length} offline sales...`);

    for (const sale of sales) {
      try {
        console.log(`Syncing sale ${sale.id}...`, sale);
        const { data, error } = await supabase.rpc('pos_create_sale', {
          p_account_id: sale.accountId,
          p_customer_id: null,
          p_cart_items: sale.cart,
          p_payments: sale.payments,
          p_notes: sale.notes || null,
          p_total: sale.total,
          p_tax: sale.tax || 0,
          p_total_tendered: sale.total_tendered
        });

        if (error) {
          console.error(`Failed to sync sale ${sale.id}:`, error);
          continue;
        }

        const result = Array.isArray(data) ? data[0] : data;

        if (result?.success) {
          await offlineDB.deleteSale(sale.id!);
          console.log(`Synced and deleted offline sale ${sale.id}`);
        } else {
          console.error(`Failed to sync sale ${sale.id} (server rejected):`, result?.message || 'Unknown error');
        }
      } catch (err) {
        console.error('Error during sync for sale:', sale.id, err);
      }
    }

    this.isSyncing = false;
    console.log('Sync process finished.');
  },

  init() {
    window.addEventListener('online', () => {
      console.log('App is online. Triggering sync...');
      this.syncOfflineSales();
    });

    // Also try to sync on init if online
    if (navigator.onLine) {
      this.syncOfflineSales();
    }
  }
};
