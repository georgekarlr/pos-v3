import React, { useEffect, useState } from 'react'
import { X, History, UserRound } from 'lucide-react'
import { Product } from '../../types/product'
import { inventoryService, ProductActivityItem } from '../../services/inventoryService'

interface ProductHistoryDrawerProps {
  product: Product | null
  open: boolean
  onClose: () => void
}

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso))

const ProductHistoryDrawer: React.FC<ProductHistoryDrawerProps> = ({ product, open, onClose }) => {
  const [items, setItems] = useState<ProductActivityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const limit = 20

  useEffect(() => {
    if (open && product) {
      setItems([])
      setPage(0)
      setHasMore(true)
      setError(null)
      loadMore(true).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id])

  const loadMore = async (reset = false) => {
    if (!product) return
    setLoading(true)
    setError(null)
    try {
      const nextPage = reset ? 0 : page
      const data = await inventoryService.getProductActivityById(product.id, limit, nextPage * limit)
      if (reset) {
        setItems(data)
      } else {
        setItems(prev => [...prev, ...data])
      }
      setHasMore(data.length === limit)
      setPage(nextPage + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* Backdrop */}
      <div className={`fixed inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-xl transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Product History</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {product && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">Product</div>
              <div className="font-medium text-gray-900">{product.name}</div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
            {items.map((item) => (
              <div key={item.activity_id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">{item.action_type}</div>
                  <div className="text-xs text-gray-500">{formatDateTime(item.created_at)}</div>
                </div>
                <div className="mt-1 text-sm text-gray-700">{item.notes || '-'}</div>
                {item.changes && (
                  <pre className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto">
{JSON.stringify(item.changes, null, 2)}
                  </pre>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <UserRound className="h-3.5 w-3.5" />
                  <span>{item.account_name || `Account #${item.account_id}`}</span>
                </div>
              </div>
            ))}

            {!loading && items.length === 0 && (
              <div className="text-sm text-gray-500">No history found for this product.</div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {items.length} record{items.length === 1 ? '' : 's'}
            </div>
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
  )
}

export default ProductHistoryDrawer
