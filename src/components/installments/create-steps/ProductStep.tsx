import React from 'react';
import { Search, Plus, ShoppingCart, Minus, Trash2 } from 'lucide-react';
import { Product } from '../../../types/product';

interface CartItem {
  product: Product;
  quantity: number;
}

interface ProductStepProps {
  productQuery: string;
  setProductQuery: (query: string) => void;
  filteredProducts: Product[];
  addToCart: (product: Product) => void;
  cart: CartItem[];
  updateQuantity: (productId: number, qty: number) => void;
  cartSubtotal: number;
}

const ProductStep: React.FC<ProductStepProps> = ({
  productQuery,
  setProductQuery,
  filteredProducts,
  addToCart,
  cart,
  updateQuantity,
  cartSubtotal,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">Add Products</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
          />
        </div>
        <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-xl divide-y bg-white">
          {filteredProducts.map(p => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-500">₱{p.display_price.toFixed(2)} · Stock: {p.total_stock}</p>
              </div>
              <button
                type="button"
                onClick={() => addToCart(p)}
                disabled={p.total_stock <= 0}
                className="ml-2 p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-30 transition"
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart size={15} className="text-gray-500" />
          <p className="text-sm font-semibold text-gray-700">Cart ({cart.length} items)</p>
        </div>
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-gray-400">
            <ShoppingCart size={32} className="mb-2 opacity-20" />
            <p className="text-xs">No products added</p>
          </div>
        ) : (
          <div className="flex-1 space-y-2 overflow-y-auto">
            {cart.map(item => (
              <div key={item.product.id} className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">₱{(item.product.display_price * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 rounded text-gray-500 hover:bg-gray-100">
                    <Minus size={12} />
                  </button>
                  <span className="w-7 text-center text-sm font-mono font-bold text-gray-900">{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.total_stock} className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                    <Plus size={12} />
                  </button>
                  <button type="button" onClick={() => updateQuantity(item.product.id, 0)} className="p-1 rounded text-red-400 hover:bg-red-50 ml-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {cart.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
            <span>Subtotal</span>
            <span className="font-mono">₱{cartSubtotal.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductStep;
