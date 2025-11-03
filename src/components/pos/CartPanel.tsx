import React from 'react'
import { Product } from '../../types/product'
import { Trash2, Plus, Minus } from 'lucide-react'

export interface CartLine {
  product: Product
  qty: number
}

interface CartPanelProps {
  lines: CartLine[]
  subtotal: number
  tax: number
  total: number
  onAdd: (productId: number) => void
  onDeduct: (productId: number) => void
  onClear: (productId: number) => void
  onClearAll: () => void
}

const currency = (n: number) => `$${n.toFixed(2)}`

const CartPanel: React.FC<CartPanelProps> = ({ lines, subtotal, tax, total, onAdd, onDeduct, onClear, onClearAll }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Cart</h3>
        <button
          onClick={onClearAll}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
          disabled={lines.length === 0}
        >
          Clear all
        </button>
      </div>

      <div className="flex-1 overflow-auto divide-y divide-gray-100">
        {lines.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">No items in cart</div>
        ) : (
          lines.map(({ product, qty }) => (
            <div key={product.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                <div className="text-xs text-gray-500">${product.display_price.toFixed(2)} • Stock: {product.quantity}</div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => onDeduct(product.id)} className="p-2 rounded-md border border-gray-300 hover:bg-gray-50">
                  <Minus className="h-4 w-4" />
                </button>
                <div className="w-10 text-center font-medium text-blue-600">{qty}</div>
                <button onClick={() => onAdd(product.id)} className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                </button>
                <button onClick={() => onClear(product.id)} className="p-2 rounded-md border border-gray-300 hover:bg-gray-50">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>

              <div className="w-24 text-right text-sm font-semibold text-gray-900">
                {currency(product.base_price * qty * (1 + product.tax_rate / 100))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-200 p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{currency(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="font-medium">{currency(tax)}</span></div>
        <div className="flex justify-between text-base"><span className="font-semibold text-gray-900">Total</span><span className="font-bold text-gray-900">{currency(total)}</span></div>
      </div>
    </div>
  )
}

export default CartPanel
