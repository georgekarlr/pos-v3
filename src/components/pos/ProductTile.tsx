import React from 'react'
import { Product } from '../../types/product'
import { PosAction } from '../../types/pos'

interface ProductTileProps {
  product: Product
  orderQty: number
  action: PosAction
  onClick: () => void
}

const actionHint: Record<PosAction, string> = {
  add: 'Click to add 1',
  deduct: 'Click to deduct 1',
  bundle: 'Click to bundle (enter qty)',
  clear: 'Click to clear from cart',
}

const ProductTile: React.FC<ProductTileProps> = ({ product, orderQty, action, onClick }) => {
  const disabled = product.quantity === 0 && action === 'add'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex flex-col text-left hover:border-blue-300 hover:shadow transition ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      aria-label={`${product.name}. ${actionHint[action]}`}
    >
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
          {product.barcode && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">{product.barcode}</span>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          <div>Price: <span className="font-medium text-gray-900">${product.display_price.toFixed(2)}</span></div>
          <div>In stock: <span className="font-medium text-gray-900">{product.quantity}</span></div>
          <div>Order qty: <span className="font-medium text-blue-600">{orderQty}</span></div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        {actionHint[action]}
      </div>
    </button>
  )
}

export default ProductTile
