export interface CartItemInput {
  product_id: number
  quantity: number
  price: number
  base_price: number
  tax_rate: number
}

export interface PaymentInput {
  amount: string | number
  method: string
  tendered: string | number
  transaction_ref?: string | null
}

export interface SaleResultRow {
  success: boolean
  message: string
  data: {
    order_id: number
  } | null
}

export interface SaleResult {
  success: boolean
  message: string
  order_id?: number
  is_offline?: boolean
}

// POS UI types
export type PosAction = 'add' | 'deduct' | 'bundle' | 'clear'
export type PosViewMode = 'products' | 'cart-payments' | 'everything'
