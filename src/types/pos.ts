// --- Generic Response Wrapper ---
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

export interface CartItemInput {
  product_id: number;
  quantity: number;
  price: number;
  base_price: number;
  tax_rate: number;
  promo_id?: number | null;
}

export interface PaymentItemInput {
  amount: number;
  method: string;
  transaction_ref?: string | null;
  tendered?: string | number;
}

// Keeping PaymentInput for backward compatibility if needed, but modernizing it
export interface PaymentInput extends PaymentItemInput {}

// --- Parameter Interface ---

// SC/PWD BIR compliance fields (required when sc_pwd_discount > 0)
export interface ScPwdInfo {
  idNumber: string;
  name: string;
}

// Loyalty program state (customer required when either > 0)
export interface LoyaltyState {
  pointsEarned: number;
  pointsRedeemed: number;
}

export interface CreatePosSaleParams {
  p_account_id: number;
  p_terminal_id: number;
  p_customer_id: number | null; // Required if loyalty points are used
  p_cart_items: CartItemInput[];
  p_payments: PaymentItemInput[];
  p_notes?: string | null;
  p_total: number;
  p_tax: number;
  p_total_tendered: number;
  // BIR Compliance: SC/PWD Discount
  p_sc_pwd_discount?: number;
  p_sc_pwd_id_number?: string | null; // NEW: required when sc_pwd_discount > 0
  p_sc_pwd_name?: string | null;      // NEW: required when sc_pwd_discount > 0
  // Loyalty Program
  p_loyalty_points_earned?: number;   // NEW
  p_loyalty_points_redeemed?: number; // NEW
  // Offline Sync
  p_occurred_at?: string | null;
  p_is_offline_sync?: boolean;
  p_offline_invoice_number?: string | null;
  p_offline_grand_total?: number | null;
}

export interface RecordManualSaleParams {
  p_account_id: number;
  p_customer_id: number | null;
  p_manual_or_number: string;
  p_cart_items: { product_id: number; quantity: number; promo_id?: number | null }[];
  p_payments: { amount: number; method: string; transaction_ref?: string }[];
  p_notes?: string | null;
  p_total: number;
  p_tax: number;
  p_total_tendered: number;
  p_sc_pwd_discount?: number;
  p_sc_pwd_id_number?: string | null;
  p_sc_pwd_name?: string | null;
  p_loyalty_points_earned?: number;
  p_loyalty_points_redeemed?: number;
  p_occurred_at: string; // Required for manual sale
}

// --- Result Interface ---

export interface CreateSaleData {
  order_id: number;
  invoice_number?: string; // NEW
  change_due?: number;
}

export interface CreateSaleResult {
  success: boolean;
  message: string;
  data: CreateSaleData | null;
}

export interface SaleResultRow extends CreateSaleResult {}

export interface SaleResult {
  success: boolean;
  message: string;
  order_id?: number;
  is_offline?: boolean;
}


// POS UI types
export type PosAction = 'add' | 'deduct' | 'bundle' | 'clear'
export type PosViewMode = 'products' | 'cart-payments' | 'everything'

// Petty Cash
export interface PettyCashParams {
  p_requesting_account_id: number;
  p_terminal_id: number;
  p_action_type: 'CASH_IN' | 'CASH_OUT';
  p_amount: number;
  p_reason: string;
}

export interface PettyCashResult {
  success: boolean;
  message: string;
}

