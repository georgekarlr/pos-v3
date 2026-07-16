import React, { useState } from 'react'
import { Product, PRODUCT_UNIT_LABELS } from '../../types/product'
import { Trash2, Plus, Minus, ShoppingCart, Ticket, CheckCircle2, XCircle, Clock, X } from 'lucide-react'
import type { CouponStatus } from '../../utils/cartCalculator'

export interface CartLine {
    product: Product
    qty: number
    promoId?: number | null;
    promoDiscount?: number;
    lineGross?: number;
    lineTax?: number;
}

interface CartPanelProps {
    lines: CartLine[]
    subtotal: number
    tax: number
    total: number
    totalPromoDiscount?: number;
    terminalSelected: boolean
    // Multiple coupon code props
    appliedCoupons: string[];
    onApplyCoupon: (code: string) => CouponStatus;
    onRemoveCoupon: (code: string) => void;
    onAdd: (productId: number) => void
    onDeduct: (productId: number) => void
    onClear: (productId: number) => void
    onClearAll: () => void
    onQtyClick?: (productId: number) => void
    onCheckout?: () => void
}

const currency = (n: number) => `₱${n.toFixed(2)}`

// Coupon status helpers
const COUPON_STATUS_CONFIG: Record<
    CouponStatus,
    { icon: React.ReactNode; text: string; color: string; bg: string; border: string }
> = {
    idle: {
        icon: null,
        text: '',
        color: '',
        bg: '',
        border: 'border-gray-300',
    },
    valid: {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
        text: 'Coupon added successfully!',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-400',
    },
    invalid: {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        text: 'Invalid coupon code.',
        color: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-400',
    },
    expired: {
        icon: <XCircle className="h-4 w-4 text-orange-500" />,
        text: 'This coupon has expired.',
        color: 'text-orange-700',
        bg: 'bg-orange-50',
        border: 'border-orange-400',
    },
    upcoming: {
        icon: <Clock className="h-4 w-4 text-blue-500" />,
        text: 'This coupon is not active yet.',
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-400',
    },
    already_applied: {
        icon: <XCircle className="h-4 w-4 text-amber-500" />,
        text: 'This coupon is already applied.',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-400',
    },
}

const CartPanel: React.FC<CartPanelProps> = ({
    lines, subtotal, tax, total, totalPromoDiscount, terminalSelected,
    appliedCoupons, onApplyCoupon, onRemoveCoupon,
    onAdd, onDeduct, onClear, onClearAll, onQtyClick, onCheckout,
}) => {
    const [localCode, setLocalCode] = useState('')
    const [couponStatus, setCouponStatus] = useState<CouponStatus>('idle')

    const statusCfg = COUPON_STATUS_CONFIG[couponStatus]

    const handleApply = () => {
        if (!localCode.trim()) return
        const status = onApplyCoupon(localCode)
        setCouponStatus(status)
        if (status === 'valid') {
            setLocalCode('')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleApply()
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalCode(e.target.value.toUpperCase())
        if (couponStatus !== 'idle') {
            setCouponStatus('idle')
        }
    }

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
                        {lines.map((line) => {
                            const { product, qty, promoDiscount = 0, lineGross, lineTax } = line;
                            const hasDiscount = promoDiscount > 0;
                            const unitDisplayPrice = product.display_price;
                            const unitDiscountedPrice = hasDiscount && lineGross !== undefined && lineTax !== undefined
                                ? (lineGross + lineTax) / qty
                                : unitDisplayPrice;

                            const lineTotalVal = lineGross !== undefined && lineTax !== undefined
                                ? (lineGross + lineTax)
                                : (product.base_price * qty * (1 + product.tax_rate / 100));

                            return (
                                <li key={product.id} className="p-6 flex flex-col gap-3">
                                    {/* Top Row: Product Info */}
                                    <div>
                                        <div className="text-base font-semibold text-gray-800 truncate">{product.name}</div>
                                        <div className="text-sm text-gray-500 flex flex-wrap items-center gap-2">
                                            {hasDiscount ? (
                                                <>
                                                    <span className="line-through text-gray-400">{currency(unitDisplayPrice)}</span>
                                                    <span className="font-semibold text-violet-700">{currency(unitDiscountedPrice)}</span>
                                                    <span className="text-[10px] bg-violet-100 text-violet-800 px-1.5 py-0.5 rounded font-semibold">
                                                        Save {currency(promoDiscount)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span>{currency(unitDisplayPrice)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom Row: Controls and Price, spaced apart */}
                                    <div className="flex items-center justify-between">
                                        {/* Left Side: Grouped quantity controls and trash icon */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center border border-gray-300 rounded-lg bg-white">
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
                                            {currency(lineTotalVal)}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {lines.length > 0 && (
                <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl space-y-4">

                    {/* Coupon Code Input & Applied Badges */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <Ticket className="h-3.5 w-3.5 text-violet-500" />
                            Coupon Codes
                        </label>

                        {/* Applied Coupons List */}
                        {appliedCoupons.length > 0 && (
                            <div className="flex flex-wrap gap-2 py-1">
                                {appliedCoupons.map((code) => (
                                    <div
                                        key={code}
                                        className="flex items-center gap-1 bg-violet-55/80 bg-violet-50 border border-violet-200 rounded-full pl-2.5 pr-1.5 py-1 text-xs text-violet-800 font-semibold shadow-sm transition-all hover:border-violet-300"
                                    >
                                        <Ticket className="h-3 w-3 text-violet-500 flex-shrink-0" />
                                        <span className="font-mono uppercase tracking-wider">{code}</span>
                                        <button
                                            onClick={() => onRemoveCoupon(code)}
                                            className="ml-1 p-0.5 rounded-full hover:bg-violet-100 text-violet-600 hover:text-violet-800 transition-colors"
                                            title={`Remove coupon ${code}`}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input row */}
                        <div className="space-y-1.5">
                            <div className="flex gap-2">
                                <input
                                    id="pos-coupon-code-input"
                                    type="text"
                                    value={localCode}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter coupon code…"
                                    maxLength={50}
                                    className={`flex-1 px-3 py-2 border rounded-lg text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors ${couponStatus !== 'idle' ? statusCfg.border + ' ' + statusCfg.bg : 'border-gray-300 bg-white'}`}
                                />
                                <button
                                    onClick={handleApply}
                                    disabled={!localCode.trim()}
                                    className="px-3 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    Apply
                                </button>
                            </div>

                            {/* Status feedback */}
                            {couponStatus !== 'idle' && statusCfg.text && (
                                <div className={`flex items-center gap-1.5 text-xs font-medium ${statusCfg.color} animate-in fade-in slide-in-from-top-1 duration-200`}>
                                    {statusCfg.icon}
                                    {statusCfg.text}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Order Summary</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium text-gray-800">{currency(subtotal)}</span></div>
                            {totalPromoDiscount !== undefined && totalPromoDiscount > 0 && (
                                <div className="flex justify-between text-violet-700">
                                    <span className="flex items-center gap-1 font-semibold">
                                        <Ticket className="h-3 w-3" />
                                        Coupon Discounts
                                    </span>
                                    <span className="font-bold">-{currency(totalPromoDiscount)}</span>
                                </div>
                            )}
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
                                disabled={lines.length === 0 || !terminalSelected}
                                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-200"
                            >
                                {!terminalSelected ? 'Select Terminal to Checkout' : 'Proceed to Checkout'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default CartPanel