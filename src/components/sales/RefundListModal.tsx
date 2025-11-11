import React, { useEffect, useMemo, useState } from 'react'
import { Loader2, X, Search, Calendar } from 'lucide-react'
import { salesService } from '../../services/salesService'
import { RefundDetailRow } from '../../types/sales'

interface RefundListModalProps {
  open: boolean
  onClose: () => void
  requestingAccountId: number | null
  orderId?: number | null
}

const PAGE_SIZE = 20

const currency = (n: number) => `\u20b1${(Number(n) || 0).toFixed(2)}`

const RefundListModal: React.FC<RefundListModalProps> = ({ open, onClose, requestingAccountId, orderId = null }) => {
  const [rows, setRows] = useState<RefundDetailRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)

  const offset = useMemo(() => (page - 1) * PAGE_SIZE, [page])

  useEffect(() => {
    if (!open) return
    setPage(1)
  }, [open, orderId])

  useEffect(() => {
    const fetchData = async () => {
      if (!open || !requestingAccountId) return
      setLoading(true)
      setError(null)
      try {
        const { rows } = await salesService.getRefundDetails({
          limit: PAGE_SIZE,
          offset,
          requestingAccountId,
          orderId: orderId ?? null,
          searchTerm: search || null,
          startDate: startDate ? new Date(startDate + 'T00:00:00').toISOString() : null,
          endDate: endDate ? new Date(endDate + 'T23:59:59.999').toISOString() : null
        })
        setRows(rows)
        setHasNext(rows.length === PAGE_SIZE)
      } catch (e: any) {
        setError(e?.message || 'Failed to load refunds')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [open, requestingAccountId, orderId, offset, search, startDate, endDate])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-end sm:items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" />
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-t-lg sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">{orderId ? `Refunds for Order #${orderId}` : 'All Refunds'}</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
          </div>

          <div className="px-4 py-3 border-b">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by product name, SKU, or order id"
                  className="w-full pl-8 pr-3 py-2 border rounded"
                />
              </div>
              <div className="relative">
                <Calendar className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" value={startDate || ''} onChange={(e) => setStartDate(e.target.value || null)} className="w-full pl-8 pr-3 py-2 border rounded" />
              </div>
              <div className="relative">
                <Calendar className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" value={endDate || ''} onChange={(e) => setEndDate(e.target.value || null)} className="w-full pl-8 pr-3 py-2 border rounded" />
              </div>
            </div>
          </div>

          <div className="px-4 py-4">
            {error && (
              <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
            )}

            <div className="overflow-x-auto border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refund #</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Refunded</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500"><div className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading...</span></div></td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">No refunds found.</td></tr>
                  ) : (
                    rows.map((r) => {
                      const d = new Date(r.refunded_at)
                      const dateStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
                      return (
                        <tr key={`${r.refund_id}-${r.product_id}`}> 
                          <td className="px-3 py-2 text-sm text-gray-900">#{r.refund_id}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{dateStr}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">#{r.order_id}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{r.product_name}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{r.product_sku || '—'}</td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right">{currency(Number(r.price_at_purchase))}</td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right">{r.refunded_quantity}</td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right">{currency(Number(r.total_refund_amount))}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{r.account_name}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 max-w-[240px] truncate" title={r.reason || ''}>{r.reason || '—'}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">Page {page}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading} className="px-3 py-1.5 rounded border bg-white text-gray-700 disabled:opacity-50">Prev</button>
                <button onClick={() => setPage((p) => (hasNext ? p + 1 : p))} disabled={!hasNext || loading} className="px-3 py-1.5 rounded border bg-white text-gray-700 disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 border-t flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50">Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RefundListModal
