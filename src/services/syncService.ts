import { OfflineDB } from '../db/offlineDB';
import { PosService } from './posService';

export const SyncService = {
  isSyncing: false,

  initialized: false,

  async syncOfflineSales() {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    try {
      const sales = await OfflineDB.getAllSales();
      if (sales.length === 0) return;

      console.log(`Starting sync of ${sales.length} offline sales...`);

      for (const sale of sales) {
        try {
          console.log(`Syncing sale ${sale.id}...`, sale);
          const { data, error } = await PosService.createSale({
            p_account_id: sale.accountId,
            p_customer_id: null,
            p_cart_items: sale.cart,
            p_payments: sale.payments,
            p_notes: sale.notes || null,
            p_total: sale.total,
            p_tax: sale.tax || 0,
            p_total_tendered: sale.total_tendered
          });

          if (error || !data) {
            console.error(`Failed to sync sale ${sale.id}:`, error);
            continue;
          }

          if (data.success) {
            await OfflineDB.deleteSale(sale.id!);
            console.log(`Synced and deleted offline sale ${sale.id}`);
          } else {
            console.error(`Failed to sync sale ${sale.id} (server rejected):`, data.message || 'Unknown error');
          }
        } catch (err) {
          console.error('Error during sync for sale:', sale.id, err);
        }
      }
    } finally {
      this.isSyncing = false;
      console.log('Sync process finished.');
    }
  },

  init() {
    if (this.initialized) return;
    this.initialized = true;

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
