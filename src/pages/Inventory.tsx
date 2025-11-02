import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Product } from '../types/product'
import { productService } from '../services/productService'
import { inventoryService } from '../services/inventoryService'
import ProductCard from '../components/inventory/ProductCard'
import AdjustQuantityDialog from '../components/inventory/AdjustQuantityDialog'
import ActivityModal from '../components/inventory/ActivityModal'
import { RefreshCw, Boxes, History } from 'lucide-react'

const Inventory: React.FC = () => {
  const { persona } = useAuth()
  const isAdmin = persona?.type === 'admin'

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Activity modal state
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activityMode, setActivityMode] = useState<'all' | 'product'>('all')
  const [activityProduct, setActivityProduct] = useState<Product | null>(null)

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await productService.getAllProducts()
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleConfirmAdjust = async (adjustment_value: number, notes: string) => {
    if (!adjustProduct) return
    if (!persona?.id) {
      throw new Error('Account ID not found')
    }

    const result = await inventoryService.adjustProductQuantity({
      product_id: adjustProduct.id,
      account_id: persona.id,
      adjustment_value,
      notes,
    })

    if (!result.success) {
      throw new Error(result.message || 'Adjustment failed')
    }

    setAdjustProduct(null)
    setSuccessMessage('Quantity adjusted successfully!')
    await loadProducts()
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory</h1>
              <p className="mt-1 text-sm text-gray-500">
                {isAdmin ? 'Adjust product quantities and review inventory history.' : 'View product quantities and history.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadProducts}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => { setActivityMode('all'); setActivityProduct(null); setShowActivityModal(true) }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">View Stock Adjustments</span>
                <span className="sm:hidden">Adjustments</span>
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-green-800 font-medium">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Error loading products</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}
        </div>

        {/* Products grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Boxes className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 bg-white border border-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Boxes className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products</h3>
              <p className="text-gray-500">No products available to display.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isAdmin={!!isAdmin}
                  onAdjust={(prod) => setAdjustProduct(prod)}
                  onViewHistory={(prod) => { setActivityMode('product'); setActivityProduct(prod); setShowActivityModal(true) }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {isAdmin && adjustProduct && (
          <AdjustQuantityDialog
            product={adjustProduct}
            onClose={() => setAdjustProduct(null)}
            onConfirm={handleConfirmAdjust}
          />
        )}

        <ActivityModal
          open={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          mode={activityMode}
          product={activityProduct}
        />
      </div>
    </div>
  )
}

export default Inventory
