import { Product } from '../types/product';

export interface OfflineSale {
  id?: number;
  accountId: number;
  terminalId: number;
  customerId?: number | null;           // NEW: for loyalty
  cart: any[];
  payments: any[];
  notes: string | null;
  total: number;
  tax: number | null;
  total_tendered: number;
  // BIR Compliance
  scPwdDiscount?: number;
  scPwdIdNumber?: string | null;        // NEW
  scPwdName?: string | null;            // NEW
  regularDiscount?: number;
  // Loyalty Program
  loyaltyPointsEarned?: number;         // NEW
  loyaltyPointsRedeemed?: number;       // NEW
  // Offline Sync
  createdAt: string;
  offlineInvoiceNumber?: string;
  offlineGrandTotal?: number;
}


export interface OfflineDebt {
  id?: number;
  accountId: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  items: { product_id: number; quantity: number }[];
  cash_loan_amount: number;
  description: string | null;
  occurredAt: string | null;
}

export class IndexedDBService {
  private dbName = 'pos-offline-db';
  private dbVersion = 5;
  private salesStore = 'offline-sales';
  private productsStore = 'products';
  private debtsStore = 'offline-debts';
  private customersStore = 'customers';

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.salesStore)) {
          db.createObjectStore(this.salesStore, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(this.productsStore)) {
          db.createObjectStore(this.productsStore, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.debtsStore)) {
          db.createObjectStore(this.debtsStore, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(this.customersStore)) {
          db.createObjectStore(this.customersStore, { keyPath: 'id' });
        }
      };
    });
  }

  async saveSale(sale: OfflineSale): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.salesStore, 'readwrite');
      const store = transaction.objectStore(this.salesStore);
      const request = store.add(sale);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSales(): Promise<OfflineSale[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.salesStore, 'readonly');
      const store = transaction.objectStore(this.salesStore);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSale(id: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.salesStore, 'readwrite');
      const store = transaction.objectStore(this.salesStore);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveProducts(products: Product[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.productsStore, 'readwrite');
      const store = transaction.objectStore(this.productsStore);

      // Clear existing products before saving new ones to keep cache fresh
      store.clear();

      products.forEach(product => {
        store.put(product);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getProducts(): Promise<Product[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.productsStore, 'readonly');
      const store = transaction.objectStore(this.productsStore);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveDebt(debt: OfflineDebt): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.debtsStore, 'readwrite');
      const store = transaction.objectStore(this.debtsStore);
      const request = store.add(debt);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDebts(): Promise<OfflineDebt[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.debtsStore, 'readonly');
      const store = transaction.objectStore(this.debtsStore);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDebt(id: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.debtsStore, 'readwrite');
      const store = transaction.objectStore(this.debtsStore);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveCustomers(customers: any[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.customersStore, 'readwrite');
      const store = transaction.objectStore(this.customersStore);

      store.clear();
      customers.forEach(customer => {
        store.put(customer);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCustomers(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.customersStore, 'readonly');
      const store = transaction.objectStore(this.customersStore);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const OfflineDB = new IndexedDBService();
