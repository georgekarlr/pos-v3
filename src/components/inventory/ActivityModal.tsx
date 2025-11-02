import React, { useEffect, useState } from 'react'
import { X, History, UserRound, Package, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Product } from '../../types/product'
import { inventoryService, ProductActivityItem } from '../../services/inventoryService'

interface ActivityModalProps {
  open: boolean
  onClose: () => void
  mode: 'all' | 'product'
  product?: Product | null
}

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso))

const ActivityModal: React.FC<ActivityModalProps> = ({ open, onClose, mode, product }) => {
  const [items, setItems] = useState<ProductActivityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const limit = 20

  // load with STOCK_ADJUSTED filter always
  const loadMore = async (reset = false) => {
    setLoading(true)
    setError(null)
    try {
      const nextPage = reset ? 0 : page
      let data: ProductActivityItem[] = []
      if (mode === 'all') {
        data = await inventoryService.getAllProductActivity(limit, nextPage * limit, 'STOCK_ADJUSTED')
      } else if (mode === 'product' && product) {
        data = await inventoryService.getProductActivityById(product.id, limit, nextPage * limit, 'STOCK_ADJUSTED')
      }

      if (reset) {
        setItems(data)
      } else {
        setItems(prev => [...prev, ...data])
      }
      setHasMore(data.length === limit)
      setPage(nextPage + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setItems([])
      setPage(0)
      setHasMore(true)
      setError(null)
      loadMore(true).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, product?.id])

  const renderQuantityChange = (changes: any) => {
    const qty = changes?.quantity
    if (!qty || typeof qty.old !== 'number' || typeof qty.new !== 'number') {
      return (
        <pre className="text-xs text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto">{JSON.stringify(changes, null, 2)}</pre>
      )
    }
    const oldVal = qty.old as number
    const newVal = qty.new as number
    const delta = newVal - oldVal
    const isIncrease = delta >= 0

    return (
      <div className="mt-2 flex items-center gap-3">
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isIncrease ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'
        }`}>
          {isIncrease ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {isIncrease ? '+' : ''}{delta}
        </div>
        <div className="text-sm text-gray-800">
          <span className="font-medium">Quantity:</span>{' '}
          <span className="tabular-nums">{oldVal}</span>
          <span className="mx-1 text-gray-400">→</span>
          <span className="tabular-nums">{newVal}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* Backdrop */}
      <div className={`fixed inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className={`w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden transform transition-all ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">
                {mode === 'all' ? 'Stock Adjustments' : `Stock Adjustments — ${product?.name || ''}`}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 py-4">
            {mode === 'product' && product && (
              <div className="mb-3 flex items-center gap-2 text-sm text-gray-700">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="h-6 w-6 rounded object-cover" />
                ) : (
                  <div className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center">
                    <Package className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <span className="font-medium">{product.name}</span>
                <span className="text-gray-500">(ID: {product.id})</span>
              </div>
            )}

            {error && (
              <div className="mb-3 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
              {items.map((item) => (
                <div key={item.activity_id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium text-gray-900">{item.action_type}</div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(item.created_at)}</div>
                  </div>

                  {mode === 'all' && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-800">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{item.product_name}</span>
                      <span className="text-gray-500">(ID: {item.product_id})</span>
                    </div>
                  )}

                  <div className="mt-1 text-sm text-gray-700">{item.notes || '-'}</div>

                  {/* Specialized renderer for STOCK_ADJUSTED */}
                  {renderQuantityChange(item.changes)}

                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <UserRound className="h-3.5 w-3.5" />
                    <span>{item.account_name || `Account #${item.account_id}`}</span>
                  </div>
                </div>
              ))}

              {!loading && items.length === 0 && (
                <div className="text-center py-10 text-gray-500 text-sm">No stock adjustments found.</div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">{items.length} record{items.length === 1 ? '' : 's'}</div>
              {hasMore && (
                <button
                  onClick={() => loadMore()}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityModal
