import { ReceiptData, ReceiptLine, ReceiptPayment } from '../components/pos/Receipt'
import { SaleDetailsResponse } from '../types/sales'

export function mapSaleDetailsToReceipt(details: SaleDetailsResponse): ReceiptData {
  const order = details.order
  const items = details.items || []
  const payments = details.payments || []

  const lines: ReceiptLine[] = items.map((it) => {
    const unit = Number(it.price_at_purchase || 0)
    const total = (it.line_total ?? (it.quantity && it.price_at_purchase ? it.quantity * it.price_at_purchase : 0)) || 0
    const refundedQty = Number(it.refunded_quantity || 0)
    const refundedAmount = refundedQty > 0 ? refundedQty * unit : undefined
    return {
      name: it.product_name,
      qty: it.quantity,
      unitPrice: unit,
      lineTotal: Number(total),
      refundedQty,
      refundedAmount
    }
  })

  const subtotalFromItems = lines.reduce((sum, l) => sum + l.lineTotal, 0)
  const subtotal = Number(order.subtotal_amount ?? subtotalFromItems)
  // Prefer explicit tax from backend; otherwise, fall back to (order.total_amount - subtotal)
  const inferredTax = Number(order.total_amount) ? Math.max(0, Number(order.total_amount) - subtotal) : 0
  const tax = Number(order.tax_amount ?? inferredTax)
  // IMPORTANT: Total shown on the receipt should be Subtotal + Tax (not net of refunds)
  const total = subtotal + tax

  const receiptPayments: ReceiptPayment[] = payments.map((p) => ({
    method: p.method,
    amount: Number(p.amount),
    reference: p.transaction_ref ?? undefined
  }))

  const totalPaid = receiptPayments.reduce((s, p) => s + p.amount, 0)
  const change = Math.max(0, totalPaid - total)

  return {
    orderId: order.id,
    businessName: undefined,
    businessAddress1: undefined,
    businessAddress2: undefined,
    cashier: order.account_person_name || undefined,
    dateISO: order.created_at,
    lines,
    subtotal,
    tax,
    total,
    payments: receiptPayments,
    totalPaid,
    change,
    notes: order.notes ?? undefined
  }
}