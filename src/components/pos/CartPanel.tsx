import React from 'react'
import { Product, PRODUCT_UNIT_LABELS } from '../../types/product'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'

// --- INTERFACES AND PROPS ARE UNCHANGED ---
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
    onQtyClick?: (productId: number) => void
    onCheckout?: () => void
}

const currency = (n: number) => `\u20b1${n.toFixed(2)}`

// --- THE COMPONENT WITH A CONSISTENT, STACKED LAYOUT ---
const CartPanel: React.FC<CartPanelProps> = ({ lines, subtotal, tax, total, onAdd, onDeduct, onClear, onClearAll, onQtyClick, onCheckout }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-md flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Your Cart</h3>
                <button
                    onClick={onClearAll}
                    className="text-sm font-medium text-red-600 px-3 py-1 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={lines.length === 0}
                >
                    Clear all
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {lines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                        <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
                        <h4 className="text-lg font-semibold text-gray-700">Your cart is empty</h4>
                        <p className="text-sm">Add some products to see them here.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {lines.map(({ product, qty }) => (
                            // Each list item is a vertical flex container with a gap between its two rows.
                            <li key={product.id} className="p-6 flex flex-col gap-3">

                                {/* Top Row: Product Info */}
                                <div>
                                    <div className="text-base font-semibold text-gray-800 truncate">{product.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {currency(product.display_price)} •{' '}
                                        <span className="text-xs">
                                            Stock: {product.quantity}{' '}
                                            {product.unit_type
                                                ? PRODUCT_UNIT_LABELS[product.unit_type] || product.unit_type
                                                : product.selling_method === 'unit'
                                                ? 'units'
                                                : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Bottom Row: Controls and Price, spaced apart */}
                                <div className="flex items-center justify-between">
                                    {/* Left Side: Grouped quantity controls and trash icon */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center border border-gray-300 rounded-lg">
                                            <button onClick={() => onDeduct(product.id)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-l-md transition-colors">
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => onQtyClick?.(product.id)}
                                                disabled={!onQtyClick}
                                                className="min-w-[2.5rem] px-2 text-center font-medium text-gray-800 border-x border-gray-300 text-sm hover:bg-gray-50 disabled:hover:bg-transparent transition-colors"
                                            >
                                                {product.selling_method === 'measured' ? qty.toFixed(2).replace(/\.?0+$/, '') : qty}{' '}
                                                <span className="text-[10px] text-gray-500 font-normal">
                                                    {product.unit_type
                                                        ? PRODUCT_UNIT_LABELS[product.unit_type] || product.unit_type
                                                        : product.selling_method === 'unit'
                                                        ? 'units'
                                                        : ''}
                                                </span>
                                            </button>
                                            <button onClick={() => onAdd(product.id)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-r-md transition-colors">
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <button onClick={() => onClear(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Right Side: Line Total */}
                                    <div className="text-base font-semibold text-gray-900">
                                        {currency(product.base_price * qty * (1 + product.tax_rate / 100))}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {lines.length > 0 && (
                <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Order Summary</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium text-gray-800">{currency(subtotal)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Tax</span><span className="font-medium text-gray-800">{currency(tax)}</span></div>
                        <div className="border-t border-gray-200 my-2"></div>
                        <div className="flex justify-between text-lg">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="font-bold text-gray-900">{currency(total)}</span>
                        </div>
                    </div>

                    {onCheckout && (
                        <button
                            onClick={onCheckout}
                            disabled={lines.length === 0}
                            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-200"
                        >
                            Proceed to Checkout
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default CartPanel