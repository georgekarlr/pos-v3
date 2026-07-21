import React, { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { ProductService } from '../../services/productService'
import { DebtService } from '../../services/debtService'
import { Product } from '../../types/product'
import { CustomerSearchResult } from '../../types/debt'
import { salesService } from '../../services/salesService'
import { RecordManualSaleParams } from '../../types/pos'
import { FormatDateTime } from '../../utils/formatDateTime'
import { useManualSale } from '../../hooks/useManualSale'
import { Ticket, X } from 'lucide-react'
import type { CouponStatus } from '../../utils/cartCalculator'
import { getTerminalId } from '../../utils/terminalStorage'

const COUPON_STATUS_CONFIG: Record<
  CouponStatus,
  { text: string; color: string; bg: string; border: string }
> = {
  idle: { text: '', color: '', bg: '', border: 'border-gray-300' },
  valid: { text: 'Coupon added successfully!', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-400' },
  invalid: { text: 'Invalid coupon code.', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-400' },
  expired: { text: 'This coupon has expired.', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-400' },
  upcoming: { text: 'This coupon is not active yet.', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-400' },
  already_applied: { text: 'This coupon is already applied.', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-400' },
}

interface ManualSaleModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  accountId: number
}

const ManualSaleModal: React.FC<ManualSaleModalProps> = ({ open, onClose, onSuccess, accountId }) => {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form Fields
  const [manualOrNumber, setManualOrNumber] = useState('')
  const [occurredAt, setOccurredAt] = useState(FormatDateTime.formatLocalTimestampForDatabase(new Date()))
  const [notes, setNotes] = useState('')

  // Coupon entry state
  const [localCouponCode, setLocalCouponCode] = useState('')
  const [couponStatus, setCouponStatus] = useState<CouponStatus>('idle')

  // Product Search
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [searchingProducts, setSearchingProducts] = useState(false)

  // Customer Search
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([])
  const [searchingCustomers, setSearchingCustomers] = useState(false)

  // Use the Composable Hook for State and Calculations
  const {
    cart,
    payments,
    isScPwdDiscount,
    setIsScPwdDiscount,
    scPwdDiscountAmount,
    scPwdIdNumber,
    setScPwdIdNumber,
    scPwdName,
    setScPwdName,
    loyaltyPointsEarned,
    setLoyaltyPointsEarned,
    loyaltyPointsRedeemed,
    setLoyaltyPointsRedeemed,
    selectedCustomer,
    setSelectedCustomer,
    subtotal,
    tax,
    total,
    totalPromoDiscount,
    calculatedLines,
    totalTendered,
    changeDue,
    addToCart,
    removeFromCart,
    updateQuantity,
    addPayment,
    removePayment,
    updatePayment,
    appliedCoupons,
    onApplyCoupon,
    onRemoveCoupon,
    reset
  } = useManualSale({ transactionTime: occurredAt })

  const handleApplyCouponCode = () => {
    if (!localCouponCode.trim()) return
    const status = onApplyCoupon(localCouponCode)
    setCouponStatus(status)
    if (status === 'valid') {
      setLocalCouponCode('')
    }
  }

  const handleCouponKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApplyCouponCode()
    }
  }

  const handleCouponInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalCouponCode(e.target.value.toUpperCase())
    if (couponStatus !== 'idle') {
      setCouponStatus('idle')
    }
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => setShow(true), 10)
      setError(null)
      setManualOrNumber('')
      reset()
      setNotes('')
      setOccurredAt(FormatDateTime.formatLocalTimestampForDatabase(new Date()))
    } else {
      setShow(false)
    }
  }, [open])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (productSearch.trim().length >= 2) {
        setSearchingProducts(true)
        const res = await ProductService.getAllProducts(20, 0, productSearch, true)
        setProductResults(res.data || [])
        setSearchingProducts(false)
      } else {
        setProductResults([])
      }
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [productSearch])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (customerSearch.trim().length >= 2) {
        setSearchingCustomers(true)
        const res = await DebtService.searchCustomers(customerSearch)
        setCustomerResults(res.data || [])
        setSearchingCustomers(false)
      } else {
        setCustomerResults([])
      }
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [customerSearch])

  const handleAddToCart = (product: Product) => {
    addToCart(product)
    setProductSearch('')
    setProductResults([])
  }

  const handleSelectCustomer = (customer: CustomerSearchResult) => {
    setSelectedCustomer(customer)
    setCustomerSearch('')
    setCustomerResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualOrNumber.trim()) {
      setError('OR Number is required')
      return
    }
    if (cart.length === 0) {
      setError('Cart is empty')
      return
    }
    if (isScPwdDiscount && (!scPwdIdNumber.trim() || !scPwdName.trim())) {
      setError('SC/PWD Name and ID Number must be provided when applying an SC/PWD discount')
      return
    }
    if ((loyaltyPointsEarned > 0 || loyaltyPointsRedeemed > 0) && !selectedCustomer) {
      setError('A customer must be selected to earn or redeem loyalty points')
      return
    }
    if (totalTendered < total - 0.01) {
      setError('Total tendered is less than total amount due')
      return
    }

    setLoading(true)
    setError(null)

    const params: RecordManualSaleParams = {
      p_account_id: accountId,
      p_terminal_id: getTerminalId(),
      p_customer_id: selectedCustomer?.customer_id || null,
      p_manual_or_number: manualOrNumber,
      p_cart_items: calculatedLines.map(line => ({
        product_id: line.product.id,
        quantity: line.qty,
        promo_id: line.promoId
      })),
      p_payments: payments.map(p => ({ amount: p.amount, method: p.method, transaction_ref: p.transaction_ref })),
      p_notes: notes,
      p_total: total,
      p_tax: tax,
      p_total_tendered: totalTendered,
      p_sc_pwd_discount: scPwdDiscountAmount,
      p_sc_pwd_id_number: isScPwdDiscount ? scPwdIdNumber : null,
      p_sc_pwd_name: isScPwdDiscount ? scPwdName : null,
      p_loyalty_points_earned: loyaltyPointsEarned,
      p_loyalty_points_redeemed: loyaltyPointsRedeemed,
      p_occurred_at: FormatDateTime.formatLocalTimestampForDatabase(new Date(occurredAt)),
      p_created_at: FormatDateTime.formatLocalTimestampForDatabase(new Date()),
    }

    try {
      const res = await salesService.recordManualSale(params)
      if (res.success) {
        onSuccess()
        onClose()
      } else {
        setError(res.message)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-gray-900/60 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <div className={`relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">Record Manual Receipt</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Official Receipt (OR) #</label>
                <input
                  type="text"
                  required
                  value={manualOrNumber}
                  onChange={e => setManualOrNumber(e.target.value)}
                  placeholder="e.g. MAN-OR-12345"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date & Time on Receipt</label>
                <input
                  type="datetime-local"
                  required
                  value={occurredAt}
                  onChange={e => setOccurredAt(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">Customer (Optional)</label>
                {selectedCustomer ? (
                  <div className="mt-1 flex items-center justify-between p-2 border rounded-md bg-blue-50 border-blue-200">
                    <span className="text-sm font-medium text-blue-800">{selectedCustomer.full_name}</span>
                    <button type="button" onClick={() => setSelectedCustomer(null)} className="text-blue-600 hover:text-blue-800">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        placeholder="Search customer..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pl-10"
                      />
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2" />
                    </div>
                    {searchingCustomers && <div className="text-xs text-gray-500 mt-1">Searching...</div>}
                    {customerResults.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-auto">
                        {customerResults.map(c => (
                          <li
                            key={c.customer_id}
                            onClick={() => handleSelectCustomer(c)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          >
                            {c.full_name} ({c.phone_number})
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              {isScPwdDiscount && (
                <div className="p-3 border border-orange-200 bg-orange-50/50 rounded-md space-y-3">
                  <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider">BIR SC/PWD Compliance</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">ID Number</label>
                      <input
                        type="text"
                        required
                        value={scPwdIdNumber}
                        onChange={e => setScPwdIdNumber(e.target.value)}
                        placeholder="ID No."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        required
                        value={scPwdName}
                        onChange={e => setScPwdName(e.target.value)}
                        placeholder="Name"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedCustomer && (
                <div className="p-3 border border-blue-200 bg-blue-50/50 rounded-md space-y-3">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Loyalty Program</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Earned Points</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={loyaltyPointsEarned}
                        onChange={e => setLoyaltyPointsEarned(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Redeemed Points</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={loyaltyPointsRedeemed}
                        onChange={e => setLoyaltyPointsRedeemed(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Right Column: Product Search & Cart */}
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">Add Products</label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search by name or SKU..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pl-10"
                  />
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2" />
                </div>
                {searchingProducts && <div className="text-xs text-gray-500 mt-1">Searching...</div>}
                {productResults.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {productResults.map(p => (
                      <li
                        key={p.id}
                        onClick={() => handleAddToCart(p)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                      >
                        <div className="text-sm">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-gray-500 text-xs">{p.sku}</p>
                        </div>
                        <span className="text-sm font-semibold">₱{p.display_price.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border rounded-md divide-y max-h-64 overflow-auto bg-gray-50">
                {calculatedLines.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">No products added yet</div>
                ) : (
                  calculatedLines.map(line => (
                    <div key={line.product.id} className="p-3 flex items-center justify-between gap-2 bg-white">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{line.product.name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-gray-500">₱{line.product.display_price.toFixed(2)} / {line.product.unit_type}</span>
                          {line.promoDiscount > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                              Promo -₱{line.promoDiscount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step={line.product.unit_type === 'kg' ? '0.01' : '1'}
                          value={line.qty}
                          onChange={e => updateQuantity(line.product.id, parseFloat(e.target.value))}
                          className="w-16 rounded-md border-gray-300 text-sm p-1 text-center"
                        />
                        <button type="button" onClick={() => removeFromCart(line.product.id)} className="text-red-500 hover:text-red-700">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <hr />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payments Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Payments</label>
                <button type="button" onClick={addPayment} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <PlusIcon className="h-3 w-3" /> Add Payment
                </button>
              </div>
              <div className="space-y-3">
                {payments.map((p, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-start border p-3 rounded-md bg-white">
                    <div className="flex-1 min-w-[120px]">
                      <select
                        value={p.method}
                        onChange={e => updatePayment(idx, 'method', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs"
                      >
                        <option>Cash</option>
                        <option>GCash</option>
                        <option>Maya</option>
                        <option>Bank Transfer</option>
                        <option>Card</option>
                        <option>Deposit</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={p.amount}
                        onChange={e => updatePayment(idx, 'amount', parseFloat(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs"
                      />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <input
                        type="text"
                        placeholder="Ref # (optional)"
                        value={p.transaction_ref}
                        onChange={e => updatePayment(idx, 'transaction_ref', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs"
                      />
                    </div>
                    {payments.length > 1 && (
                      <button type="button" onClick={() => removePayment(idx)} className="text-red-500 mt-1">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {payments.some(p => p.method === 'Deposit') && !selectedCustomer && (
                <p className="text-xs text-red-600 mt-1">Customer is required for Deposit payment.</p>
              )}
            </div>

            {/* Totals Section */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4 border">
              {/* Coupon Codes Input & Applied Badges */}
              <div className="space-y-3 bg-white p-3 rounded-md border shadow-sm">
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <Ticket className="h-3.5 w-3.5 text-violet-500" />
                  Coupon Codes
                </label>

                {/* Applied Coupons List */}
                {appliedCoupons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 py-1">
                    {appliedCoupons.map((code) => (
                      <div
                        key={code}
                        className="flex items-center gap-1 bg-violet-50 border border-violet-200 rounded-full pl-2.5 pr-1.5 py-0.5 text-xs text-violet-850 font-semibold shadow-sm"
                      >
                        <span className="font-mono uppercase tracking-wider">{code}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveCoupon(code)}
                          className="ml-1 p-0.5 rounded-full hover:bg-violet-100 text-violet-600 hover:text-violet-800 transition-colors"
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
                      type="text"
                      value={localCouponCode}
                      onChange={handleCouponInputChange}
                      onKeyDown={handleCouponKeyDown}
                      placeholder="Enter coupon code…"
                      className={`flex-1 px-3 py-1.5 border rounded-lg text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors ${couponStatus !== 'idle' ? COUPON_STATUS_CONFIG[couponStatus].border + ' ' + COUPON_STATUS_CONFIG[couponStatus].bg : 'border-gray-300 bg-white'}`}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCouponCode}
                      disabled={!localCouponCode.trim()}
                      className="px-3 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Apply
                    </button>
                  </div>

                  {/* Status feedback */}
                  {couponStatus !== 'idle' && COUPON_STATUS_CONFIG[couponStatus].text && (
                    <div className={`text-xs font-medium ${COUPON_STATUS_CONFIG[couponStatus].color}`}>
                      {COUPON_STATUS_CONFIG[couponStatus].text}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gross Subtotal</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
                {totalPromoDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Promo Discount</span>
                    <span className="text-green-600 font-medium">-₱{totalPromoDiscount.toFixed(2)}</span>
                  </div>
                )}
                {/* Show intermediate Subtotal After Promo only when both promo and SC/PWD discounts are active */}
                {totalPromoDiscount > 0 && isScPwdDiscount && (
                  <div className="flex justify-between text-gray-500 text-xs pl-2">
                    <span>Subtotal After Promo</span>
                    <span>₱{(subtotal - totalPromoDiscount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax (VAT)</span>
                  <span>₱{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Apply SC/PWD Discount?</span>
                    <label className="inline-flex items-center mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isScPwdDiscount}
                        onChange={e => setIsScPwdDiscount(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <span className="text-red-600 font-bold">-₱{scPwdDiscountAmount.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t flex justify-between font-bold text-lg">
                  <span>Net Due</span>
                  <span className="text-blue-600">₱{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-gray-500">Total Tendered</span>
                  <span>₱{totalTendered.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Change Due</span>
                  <span className={totalTendered - total >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₱{changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (payments.some(p => p.method === 'Deposit') && !selectedCustomer)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Record Receipt'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ManualSaleModal
