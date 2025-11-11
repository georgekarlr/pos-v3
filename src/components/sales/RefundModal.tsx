import React, { useEffect, useMemo, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { salesService, BulkRefundItemInput } from '../../services/salesService'
import { SaleDetailsResponse, SaleItemDetails } from '../../types/sales'

interface RefundModalProps {
  open: boolean
  orderId: number | null
  requestingAccountId: number | null
  onClose: () => void
  onSuccess: () => void
}

const currency = (n: number) => `\u20b1${(Number(n) || 0).toFixed(2)}`

const RefundModal: React.FC<RefundModalProps> = ({ open, orderId, requestingAccountId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [details, setDetails] = useState<SaleDetailsResponse | null>(null)
  const [quantities, setQuantities] = useState<Record<number, number>>({}) // key: order_item_id
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open || !orderId) return
    setError(null)
    setDetails(null)
    setQuantities({})
    setPaymentMethod('cash')
    setReason('')

    const load = async () => {
      setLoading(true)
      try {
        const d = await salesService.getSaleDetailsById(orderId)
        setDetails(d)
        // initialize quantities to 0
        const initial: Record<number, number> = {}
        ;(d.items || []).forEach((it: any) => {
          const key = (it.order_item_id ?? it.id) as number
          initial[key] = 0
        })
        setQuantities(initial)
      } catch (e: any) {
        setError(e?.message || 'Failed to load sale details')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [open, orderId])

  const itemsWithAvail = useMemo(() => {
    const items: (SaleItemDetails & { availableQuantity: number; id: number })[] = (details?.items || []).map((it: any) => {
      const refunded = Number(it.refunded_quantity || 0)
      const availableQuantity = Math.max(0, Number(it.quantity) - refunded)
      const order_item_id = (it.order_item_id ?? it.id) as number
      return { ...it, availableQuantity, order_item_id }
    })
    return items
  }, [details])

  const canSubmit = useMemo(() => {
    const anyQty = itemsWithAvail.some((it) => (quantities[it.id] || 0) > 0)
    return open && !!orderId && !!requestingAccountId && anyQty && !submitting
  }, [open, orderId, requestingAccountId, itemsWithAvail, quantities, submitting])

  const totalRefundLines = useMemo(() => {
    return itemsWithAvail.reduce((sum, it) => {
      const q = quantities[it.id] || 0
      const unit = Number(it.price_at_purchase || 0)
      return sum + q * unit
    }, 0)
  }, [itemsWithAvail, quantities])

  const handleQtyChange = (order_item_id: number, value: number, max: number) => {
    const v = Math.max(0, Math.min(Math.floor(value || 0), max))
    setQuantities((prev) => ({ ...prev, [order_item_id]: v }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderId || !requestingAccountId) return

    const items: BulkRefundItemInput[] = itemsWithAvail
      .map((it) => ({ order_item_id: it.id, quantity: quantities[it.id] || 0 }))
      .filter((x) => x.quantity > 0)

    if (items.length === 0) {
      setError('Please enter a refund quantity for at least one item.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const result = await salesService.createBulkRefund({
        order_id: orderId,
        items_to_refund: items,
        requesting_account_id: requestingAccountId,
        refund_payment_method: paymentMethod,
        reason: reason || 'Refund processed from Sales History.'
      })

      if (!result.success) {
        setError(result.message || 'Failed to process refund')
        return
      }

      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Failed to process refund')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-end sm:items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" />
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-t-lg sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Process Refund {orderId ? `#${orderId}` : ''}</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-4 py-4">
              {error && (
                <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-600"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...</div>
              ) : (
                <>
                  <div className="space-y-3 max-h-80 overflow-auto pr-1">
                    {itemsWithAvail.length === 0 && (
                      <div className="text-sm text-gray-600">No items found for this order.</div>
                    )}
                    {itemsWithAvail.map((it) => (
                      <div key={it.id} className="flex items-start justify-between gap-3 p-3 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{it.product_name}</div>
                          <div className="text-xs text-gray-600">Purchased: {it.quantity} • Refunded: {Number(it.refunded_quantity || 0)} • Available: {it.availableQuantity}</div>
                          <div className="text-xs text-gray-600">Unit price: {currency(Number(it.price_at_purchase || 0))}</div>
                        </div>
                        <div className="w-28">
                          <label className="block text-xs text-gray-600 mb-1">Refund qty</label>
                          <input
                            type="number"
                            min={0}
                            max={it.availableQuantity}
                            step={1}
                            value={quantities[it.id] || 0}
                            onChange={(e) => handleQtyChange(it.id, parseInt(e.target.value, 10), it.availableQuantity)}
                            className="w-full px-2 py-1 border rounded"
                          />
                          <div className="mt-1 text-[11px] text-gray-500">Max {it.availableQuantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Refund payment method</label>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border rounded">
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="gcash">GCash</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason" className="w-full px-3 py-2 border rounded" />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                    <div className="text-sm text-blue-800">Estimated base refund (excl. tax adjustments)</div>
                    <div className="text-base font-semibold text-blue-700">{currency(totalRefundLines)}</div>
                  </div>
                </>
              )}
            </div>

            <div className="px-4 py-3 border-t flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={!canSubmit} className="w-full sm:w-auto px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed">
                {submitting ? 'Processing...' : 'Process Refund'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RefundModal
