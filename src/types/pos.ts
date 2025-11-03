export interface CartItemInput {
  product_id: number
  quantity: number
}

export interface PaymentInput {
  amount: number
  method: string
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
}

// POS UI types
export type PosAction = 'add' | 'deduct' | 'bundle' | 'clear'
export type PosViewMode = 'products' | 'cart-payments' | 'everything'
