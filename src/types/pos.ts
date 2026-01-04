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

export interface CreatePosSaleParams {
  p_account_id: number;
  p_customer_id: number | null; // Nullable for guest checkout
  p_cart_items: CartItemInput[];
  p_payments: PaymentItemInput[];
  p_notes?: string | null;
  p_total: number;
  p_tax: number;
  p_total_tendered: number;
}

// --- Result Interface ---

export interface CreateSaleData {
  order_id: number;
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

