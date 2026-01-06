import React, { useEffect, useState } from 'react'
import { InventoryService, ProductActivityItem } from '../../services/inventoryService'
import { History, UserRound, Package } from 'lucide-react'

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso))

const AllActivityList: React.FC = () => {
  const [items, setItems] = useState<ProductActivityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const limit = 20

  const loadMore = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await InventoryService.getAllProductActivity(limit, page * limit)
      setItems(prev => [...prev, ...data])
      setHasMore(data.length === limit)
      setPage(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // initial load
    setItems([])
    setPage(0)
    setHasMore(true)
    loadMore().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {items.map((item) => (
          <div key={item.activity_id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-gray-700">
                <History className="h-4 w-4" />
                <span className="text-sm font-medium">{item.action_type}</span>
              </div>
              <div className="text-xs text-gray-500">{formatDateTime(item.created_at)}</div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-800">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{item.product_name}</span>
              <span className="text-gray-500">(ID: {item.product_id})</span>
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
          <div className="text-center py-12 text-gray-500">No activity yet.</div>
        )}
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}

export default AllActivityList
