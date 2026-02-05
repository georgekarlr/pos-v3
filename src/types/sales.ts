export interface SalesHistoryRow {
  order_id: number
  created_at: string
  customer_name: string
  account_name: string
  original_total_amount: number
  total_refund_amount: number
  net_amount: number
  status: string
}

export interface SaleOrderDetails {
  id: number
  created_at: string
  total_amount: number
  tax_amount?: number | null
  subtotal_amount?: number | null
  notes?: string | null
  customer_name?: string | null
  account_person_name?: string | null
  total_tendered?: number | null
}

export interface SaleItemDetails {
  id: number
  product_id: number
  product_name: string
  quantity: number
    order_id: number
    base_price_at_purchase: number | null
    tax_rate_at_purchase: number | null

  price_at_purchase?: number | null
  line_total?: number | null
  unit_type?: string | null
  refunded_quantity: number | null
}

export interface SalePaymentDetails {
  method: string
  amount: number
  transaction_ref?: string | null
}

export interface SaleDetailsResponse {
  order: SaleOrderDetails
  items: SaleItemDetails[]
  payments: SalePaymentDetails[]
}

// Refund details row returned by pos2_get_refund_details
export interface RefundDetailRow {
  refund_id: number
  refunded_at: string
  order_id: number
  product_id: number
  product_name: string
  product_sku: string | null
  price_at_purchase: number
  refunded_quantity: number
  total_refund_amount: number
  account_name: string
  reason: string | null
}