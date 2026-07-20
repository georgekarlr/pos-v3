import React from 'react';
import { Search, Plus, ShoppingCart, Minus, Trash2 } from 'lucide-react';
import { Product } from '../../../types/product';
import { CouponSection } from '../../pos/CouponSection';
import type { CouponStatus, CalculatedLine } from '../../../utils/cartCalculator';

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
  appliedCoupons: string[];
  onApplyCoupon: (code: string) => CouponStatus;
  onRemoveCoupon: (code: string) => void;
  totalPromoDiscount: number;
  cartTotal: number;
  calculatedLines: CalculatedLine[];
}

const ProductStep: React.FC<ProductStepProps> = ({
  productQuery,
  setProductQuery,
  filteredProducts,
  addToCart,
  cart,
  updateQuantity,
  cartSubtotal,
  appliedCoupons,
  onApplyCoupon,
  onRemoveCoupon,
  totalPromoDiscount,
  cartTotal,
  calculatedLines,
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
            {cart.map(item => {
              const calcLine = calculatedLines.find(l => l.product.id === item.product.id);
              const promoDiscount = calcLine?.promoDiscount ?? 0;
              const hasDiscount = promoDiscount > 0;
              const lineTotalVal = calcLine
                ? (calcLine.lineGross + calcLine.lineTax)
                : (item.product.display_price * item.quantity);

              return (
                <div key={item.product.id} className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{item.product.name}</p>
                    <div className="text-xs text-gray-55/80 text-gray-500 flex flex-wrap items-center gap-1.5">
                      {hasDiscount ? (
                        <>
                          <span className="line-through text-gray-400">₱{(item.product.display_price * item.quantity).toFixed(2)}</span>
                          <span className="font-semibold text-violet-75/90 text-violet-700">₱{lineTotalVal.toFixed(2)}</span>
                          <span className="text-[9px] bg-violet-100 text-violet-85/90 text-violet-800 px-1 rounded font-semibold whitespace-nowrap">
                            Save ₱{promoDiscount.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span>₱{lineTotalVal.toFixed(2)}</span>
                      )}
                    </div>
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
              );
            })}
          </div>
        )}
        {cart.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <CouponSection
              appliedCoupons={appliedCoupons}
              onApplyCoupon={onApplyCoupon}
              onRemoveCoupon={onRemoveCoupon}
              inputId="installment-coupon-code-input"
            />
            
            <div className="space-y-1 text-xs text-gray-600 border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span>Gross Subtotal</span>
                <span className="font-mono">₱{cartSubtotal.toFixed(2)}</span>
              </div>
              {totalPromoDiscount > 0 && (
                <div className="flex justify-between text-violet-75/95 text-violet-75/90 text-violet-700 font-semibold">
                  <span>Promo Discount</span>
                  <span className="font-mono">-₱{totalPromoDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-dashed border-gray-200">
                <span>Net Total Due</span>
                <span className="font-mono text-indigo-700">₱{cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductStep;
