export interface SalesHistoryRow {
  order_id: number
  created_at: string
  customer_name: string
  account_name: string
  total_amount: number
  status: string
}

export interface SaleOrderDetails {
  id: number
  created_at: string
  total_amount: number
  tax_amount?: number | null
  subtotal_amount?: number | null
  notes?: string | null
  account_person_name?: string | null
}

export interface SaleItemDetails {
  product_id: number
  product_name: string
  quantity: number
  unit_price?: number | null
  line_total?: number | null
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