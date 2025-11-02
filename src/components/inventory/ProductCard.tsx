import React from 'react'
import { Product } from '../../types/product'
import { Package, History, Plus, Minus } from 'lucide-react'

interface ProductCardProps {
  product: Product
  isAdmin: boolean
  onAdjust: (product: Product) => void
  onViewHistory: (product: Product) => void
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isAdmin, onAdjust, onViewHistory }) => {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-gray-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate" title={product.name}>{product.name}</h3>
                <div className="mt-1 text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                  <span>SKU: {product.sku || '-'}</span>
                  <span>Barcode: {product.barcode || '-'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Price</div>
                <div className="text-base font-semibold text-gray-900">{formatCurrency(product.display_price)}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Quantity</div>
                <div className="text-lg font-bold text-gray-900">{product.quantity}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewHistory(product)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <History className="h-4 w-4" />
                  History
                </button>

                {isAdmin && (
                  <button
                    onClick={() => onAdjust(product)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    <Minus className="h-4 w-4 -ml-1" />
                    Adjust
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
