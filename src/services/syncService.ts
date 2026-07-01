import { OfflineDB } from '../db/offlineDB';
import { PosService } from './posService';
import { DebtService } from './debtService';

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
            p_terminal_id: sale.terminalId, // NEW
            p_customer_id: null,
            p_cart_items: sale.cart,
            p_payments: sale.payments,
            p_notes: sale.notes || null,
            p_total: sale.total,
            p_tax: sale.tax || 0,
            p_total_tendered: sale.total_tendered,
            p_sc_pwd_discount: sale.scPwdDiscount || 0, // NEW
            p_regular_discount: sale.regularDiscount || 0, // NEW
            p_occurred_at: sale.createdAt
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
      console.log('Sync process for sales finished.');
    }
  },

  async syncOfflineDebts() {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    try {
      const debts = await OfflineDB.getAllDebts();
      if (debts.length === 0) return;

      console.log(`Starting sync of ${debts.length} offline debts...`);

      for (const debt of debts) {
        try {
          console.log(`Syncing debt ${debt.id}...`, debt);
          const { data, error } = await DebtService.createCustomerAndAddDebt({
            p_requesting_account_id: debt.accountId,
            p_full_name: debt.full_name,
            p_phone_number: debt.phone_number,
            p_email: debt.email,
            p_address: debt.address,
            p_items_to_debt: debt.items,
            p_cash_loan_amount: debt.cash_loan_amount,
            p_description: debt.description,
            p_occurred_at: debt.occurredAt
          });

          if (error || !data) {
            console.error(`Failed to sync debt ${debt.id}:`, error);
            continue;
          }

          if (data.success) {
            await OfflineDB.deleteDebt(debt.id!);
            console.log(`Synced and deleted offline debt ${debt.id}`);
          } else {
            console.error(`Failed to sync debt ${debt.id} (server rejected):`, data.message || 'Unknown error');
          }
        } catch (err) {
          console.error('Error during sync for debt:', debt.id, err);
        }
      }
    } finally {
      this.isSyncing = false;
      console.log('Sync process for debts finished.');
    }
  },

  async syncAll() {
    await this.syncOfflineSales();
    await this.syncOfflineDebts();
  },

  init() {
    if (this.initialized) return;
    this.initialized = true;

    window.addEventListener('online', () => {
      console.log('App is online. Triggering sync...');
      this.syncAll();
    });

    // Also try to sync on init if online
    if (navigator.onLine) {
      this.syncAll();
    }
  }
};
