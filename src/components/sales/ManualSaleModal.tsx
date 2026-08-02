import React, { useState, useEffect, useMemo } from 'react'
import { ProductService } from '../../services/productService'
import { DebtService } from '../../services/debtService'
import { Product } from '../../types/product'
import { CustomerSearchResult } from '../../types/debt'
import { salesService } from '../../services/salesService'
import { RecordManualSaleParams } from '../../types/pos'
import { FormatDateTime } from '../../utils/formatDateTime'
import { useManualSale } from '../../hooks/useManualSale'
import {
  Receipt,
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Ticket,
  AlertCircle,
  Calendar,
  Hash,
  FileText,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Coins,
  ArrowRight
} from 'lucide-react'
import type { CouponStatus } from '../../utils/cartCalculator'
import { getTerminalId } from '../../utils/terminalStorage'

const COUPON_STATUS_CONFIG: Record<
  CouponStatus,
  { text: string; color: string; bg: string; border: string }
> = {
  idle: { text: '', color: '', bg: '', border: 'border-slate-300' },
  valid: { text: 'Coupon added successfully!', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' },
  invalid: { text: 'Invalid coupon code.', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300' },
  expired: { text: 'This coupon has expired.', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300' },
  upcoming: { text: 'This coupon is not active yet.', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300' },
  already_applied: { text: 'This coupon is already applied.', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300' },
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

  // Composable Hook for State and Calculations
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

  // Calculate remaining balance owed before complete payment
  const remainingBalance = useMemo(() => {
    return Math.max(0, total - totalTendered)
  }, [total, totalTendered])

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

  // Quick action: Fill exact remaining balance into a payment line
  const handleFillRemaining = (index: number) => {
    const otherPaymentsTotal = payments.reduce((sum, p, i) => i === index ? sum : sum + (p.amount || 0), 0)
    const needed = Math.max(0, total - otherPaymentsTotal)
    updatePayment(index, 'amount', Number(needed.toFixed(2)))
  }

  // Quantity adjustments with steppers
  const handleQuantityStep = (productId: number, currentQty: number, delta: number, isKg: boolean) => {
    const step = isKg ? 0.25 : 1
    const nextQty = Math.max(isKg ? 0.01 : 1, parseFloat((currentQty + delta * step).toFixed(2)))
    updateQuantity(productId, nextQty)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualOrNumber.trim()) {
      setError('Official Receipt (OR) Number is required')
      return
    }
    if (cart.length === 0) {
      setError('Please add at least one product to the sale')
      return
    }
    if (isScPwdDiscount && (!scPwdIdNumber.trim() || !scPwdName.trim())) {
      setError('SC/PWD Name and ID Number must be provided when SC/PWD discount is active')
      return
    }
    if ((loyaltyPointsEarned > 0 || loyaltyPointsRedeemed > 0) && !selectedCustomer) {
      setError('A customer must be selected to earn or redeem loyalty points')
      return
    }
    if (totalTendered < total - 0.01) {
      setError(`Total tendered (₱${totalTendered.toFixed(2)}) is less than net amount due (₱${total.toFixed(2)})`)
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
      setError(err.message || 'An error occurred while saving manual sale')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] pb-[5vh] px-3 sm:px-4 overflow-y-auto overscroll-contain" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Main Modal Card - Strictly locked at h-[85vh] on all viewports so height never changes when toggling SC/PWD */}
      <form
        onSubmit={handleSubmit}
        className={`relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[100vh] flex flex-col overflow-hidden border border-slate-200 transition-all duration-300 transform ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
      >
        {/* Header - Fixed Top Anchor */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-500/30 text-indigo-400 shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">Record Manual Sale</h3>
                <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  Terminal #{getTerminalId()}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate hidden sm:block">Log manual receipts, paper vouchers, or backdated POS sales into electronic records.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-slate-50/40">

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 shadow-sm animate-fadeIn">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
              <button type="button" onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Main 2-Column Responsive Layout - items-start prevents vertical column stretch gaps */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">

            {/* Left Column: Transaction Meta & Cart (7 cols) */}
            <div className="lg:col-span-7 space-y-3.5">

              {/* Receipt Info Card */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-500" />
                  Receipt Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* OR Number */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Official Receipt (OR) # <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={manualOrNumber}
                        onChange={e => setManualOrNumber(e.target.value)}
                        placeholder="e.g. OR-2026-8812"
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                      <Hash className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2" />
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Date & Time on Receipt <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        required
                        value={occurredAt}
                        onChange={e => setOccurredAt(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                      <Calendar className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2" />
                    </div>
                  </div>
                </div>

                {/* Customer Search & Card */}
                <div className="relative">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Customer Account (Optional)
                  </label>

                  {selectedCustomer ? (
                    <div className="flex items-center justify-between p-2 border rounded-lg bg-indigo-50/60 border-indigo-200">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px]">
                          {selectedCustomer.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-indigo-950">{selectedCustomer.full_name}</p>
                          <p className="text-[10px] text-indigo-600">{selectedCustomer.phone_number || 'No phone recorded'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="p-1 text-indigo-500 hover:text-indigo-800 hover:bg-indigo-100 rounded-md transition-colors"
                        title="Remove customer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        placeholder="Search customer name or phone..."
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                      <User className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2" />

                      {searchingCustomers && (
                        <div className="absolute right-3 top-2 text-[10px] text-indigo-600 font-medium">Searching...</div>
                      )}

                      {customerResults.length > 0 && (
                        <ul className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-36 overflow-auto divide-y divide-slate-100">
                          {customerResults.map(c => (
                            <li
                              key={c.customer_id}
                              onClick={() => handleSelectCustomer(c)}
                              className="p-2 hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between transition-colors"
                            >
                              <div>
                                <p className="text-xs font-semibold text-slate-800">{c.full_name}</p>
                                <p className="text-[10px] text-slate-500">{c.phone_number}</p>
                              </div>
                              <span className="text-[10px] font-semibold text-indigo-600">Select</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Internal Sales Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Written manual receipt from back-up register"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Product Selection & Cart Section */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    Products ({calculatedLines.length})
                  </h4>
                  {calculatedLines.length > 0 && (
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {calculatedLines.reduce((sum, l) => sum + l.qty, 0)} Total Units
                    </span>
                  )}
                </div>

                {/* Product Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search product by name or SKU..."
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2" />

                  {searchingProducts && (
                    <div className="absolute right-3 top-2 text-[10px] text-indigo-600 font-medium">Searching...</div>
                  )}

                  {productResults.length > 0 && (
                    <ul className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-44 overflow-auto divide-y divide-slate-100">
                      {productResults.map(p => (
                        <li
                          key={p.id}
                          onClick={() => handleAddToCart(p)}
                          className="p-2.5 hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{p.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">SKU: {p.sku || 'N/A'} • Unit: {p.unit_type}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-indigo-700">₱{p.display_price.toFixed(2)}</span>
                            <span className="block text-[9px] text-emerald-600 font-medium">+ Add to cart</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-36 overflow-y-auto bg-slate-50/50">
                  {calculatedLines.length === 0 ? (
                    <div className="p-3.5 text-center space-y-1">
                      <Receipt className="h-4 w-4 text-slate-400 mx-auto" />
                      <p className="text-xs font-medium text-slate-600">No items added to cart</p>
                    </div>
                  ) : (
                    calculatedLines.map(line => {
                      const isKg = line.product.unit_type === 'kg'
                      const lineTotal = line.product.display_price * line.qty - line.promoDiscount

                      return (
                        <div key={line.product.id} className="p-2 bg-white flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{line.product.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-slate-500">
                                ₱{line.product.display_price.toFixed(2)} / {line.product.unit_type}
                              </span>
                              {line.promoDiscount > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                  Promo -₱{line.promoDiscount.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stepper & Input */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center border border-slate-300 rounded-md bg-slate-50 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleQuantityStep(line.product.id, line.qty, -1, isKg)}
                                className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <input
                                type="number"
                                step={isKg ? '0.01' : '1'}
                                min={isKg ? '0.01' : '1'}
                                value={line.qty}
                                onChange={e => updateQuantity(line.product.id, Math.max(0.01, parseFloat(e.target.value) || 0))}
                                className="w-10 text-center text-xs font-semibold bg-transparent focus:outline-none py-0.5"
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantityStep(line.product.id, line.qty, 1, isKg)}
                                className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Subtotal preview */}
                            <div className="w-14 text-right">
                              <span className="text-xs font-bold text-slate-900">₱{lineTotal.toFixed(2)}</span>
                            </div>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => removeFromCart(line.product.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Payments, Loyalty & Financial Totals (5 cols) */}
            <div className="lg:col-span-5 space-y-3.5">

              {/* Payment Methods Card */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                    Payments
                  </h4>
                  <button
                    type="button"
                    onClick={addPayment}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add Payment
                  </button>
                </div>

                {/* Status bar */}
                <div className={`p-2 rounded-lg border flex items-center justify-between text-xs font-medium ${remainingBalance === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                  <span>{remainingBalance === 0 ? 'Payment Satisfied' : 'Remaining Balance:'}</span>
                  <span className="font-bold text-xs">
                    {remainingBalance === 0 ? '₱0.00' : `₱${remainingBalance.toFixed(2)}`}
                  </span>
                </div>

                {/* Payments List */}
                <div className="space-y-2 max-h-36 overflow-y-auto pr-0.5">
                  {payments.map((p, idx) => (
                    <div key={idx} className="p-2 border border-slate-200 rounded-lg bg-slate-50/50 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={p.method}
                          onChange={e => updatePayment(idx, 'method', e.target.value)}
                          className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:ring-indigo-500"
                        >
                          <option value="Cash">💵 Cash</option>
                          <option value="GCash">📱 GCash</option>
                          <option value="Maya">📱 Maya</option>
                          <option value="Bank Transfer">🏦 Bank Transfer</option>
                          <option value="Card">💳 Card</option>
                          <option value="Deposit">💳 Deposit</option>
                        </select>

                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={p.amount || ''}
                            onChange={e => updatePayment(idx, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-300 rounded pl-5 pr-2 py-1 text-xs font-bold text-slate-900 focus:ring-indigo-500"
                          />
                          <span className="absolute left-1.5 top-1 text-slate-400 text-xs">₱</span>
                        </div>

                        {payments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePayment(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Ref # (optional)"
                          value={p.transaction_ref}
                          onChange={e => updatePayment(idx, 'transaction_ref', e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-700 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleFillRemaining(idx)}
                          className="px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-[10px] font-semibold transition-colors shrink-0"
                          title="Auto fill remaining amount due"
                        >
                          Fill Balance
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {payments.some(p => p.method === 'Deposit') && !selectedCustomer && (
                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Customer account required for Deposit.
                  </p>
                )}
              </div>

              {/* Coupons & Special Discounts Panel */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm space-y-2.5">

                {/* Coupons */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <Ticket className="h-3.5 w-3.5 text-violet-600" />
                    Coupon Code
                  </label>

                  {appliedCoupons.length > 0 && (
                    <div className="flex flex-wrap gap-1 py-0.5">
                      {appliedCoupons.map((code) => (
                        <div
                          key={code}
                          className="flex items-center gap-1 bg-violet-50 border border-violet-200 rounded-full pl-2 pr-1 py-0.5 text-[10px] text-violet-900 font-semibold shadow-sm"
                        >
                          <span className="font-mono uppercase tracking-wider">{code}</span>
                          <button
                            type="button"
                            onClick={() => onRemoveCoupon(code)}
                            className="p-0.5 rounded-full hover:bg-violet-200 text-violet-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={localCouponCode}
                      onChange={handleCouponInputChange}
                      onKeyDown={handleCouponKeyDown}
                      placeholder="Enter promo coupon..."
                      className={`flex-1 px-2 py-1 border rounded text-xs font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-violet-500 ${couponStatus !== 'idle' ? COUPON_STATUS_CONFIG[couponStatus].border + ' ' + COUPON_STATUS_CONFIG[couponStatus].bg : 'border-slate-300 bg-white'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCouponCode}
                      disabled={!localCouponCode.trim()}
                      className="px-2.5 py-1 bg-violet-600 text-white text-xs font-semibold rounded hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                      Apply
                    </button>
                  </div>

                  {couponStatus !== 'idle' && COUPON_STATUS_CONFIG[couponStatus].text && (
                    <p className={`text-[10px] font-medium ${COUPON_STATUS_CONFIG[couponStatus].color}`}>
                      {COUPON_STATUS_CONFIG[couponStatus].text}
                    </p>
                  )}
                </div>

                {/* BIR SC / PWD Toggle & Inputs */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                      BIR Senior / PWD Discount
                    </span>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isScPwdDiscount}
                        onChange={e => setIsScPwdDiscount(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {isScPwdDiscount && (
                    <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-amber-950">
                        <span className="text-[10px] font-bold uppercase tracking-wider">BIR Compliance Record</span>
                        <span className="text-xs font-bold text-amber-700">-₱{scPwdDiscountAmount.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            required
                            value={scPwdIdNumber}
                            onChange={e => setScPwdIdNumber(e.target.value)}
                            placeholder="SC/PWD ID No. *"
                            className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            required
                            value={scPwdName}
                            onChange={e => setScPwdName(e.target.value)}
                            placeholder="Cardholder Name *"
                            className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-semibold focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Loyalty Program (If Customer Selected) */}
                {selectedCustomer && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-indigo-600" />
                      Loyalty Points
                    </h5>
                    <div className="grid grid-cols-2 gap-2 p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Points Earned</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={loyaltyPointsEarned}
                          onChange={e => setLoyaltyPointsEarned(Number(e.target.value))}
                          className="w-full px-2 py-0.5 bg-white border border-indigo-200 rounded text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Points Redeemed</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={loyaltyPointsRedeemed}
                          onChange={e => setLoyaltyPointsRedeemed(Number(e.target.value))}
                          className="w-full px-2 py-0.5 bg-white border border-indigo-200 rounded text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Totals Summary Card */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl space-y-2">
                <div className="space-y-1 text-xs text-slate-300 pb-2 border-b border-slate-800">
                  <div className="flex justify-between">
                    <span>Gross Subtotal</span>
                    <span className="font-mono">₱{subtotal.toFixed(2)}</span>
                  </div>

                  {totalPromoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Promo Discount</span>
                      <span className="font-mono">-₱{totalPromoDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {isScPwdDiscount && (
                    <div className="flex justify-between text-amber-400">
                      <span>SC / PWD BIR Discount</span>
                      <span className="font-mono">-₱{scPwdDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Tax (VAT Included)</span>
                    <span className="font-mono">₱{tax.toFixed(2)}</span>
                  </div>
                </div>

                {/* Net Due Highlight */}
                <div className="flex items-baseline justify-between pt-0.5">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Net Amount Due</p>
                    <p className="text-[10px] text-slate-400">{calculatedLines.length} item(s)</p>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-indigo-400 font-mono">
                    ₱{total.toFixed(2)}
                  </span>
                </div>

                {/* Tendered & Change */}
                <div className="pt-1.5 border-t border-slate-800 space-y-0.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Tendered</span>
                    <span className="font-mono font-semibold">₱{totalTendered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs sm:text-sm">
                    <span>Change Due</span>
                    <span className={`font-mono ${changeDue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ₱{changeDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Modal Action Footer - Fixed Bottom */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-md z-10">
          <div className="hidden sm:block text-xs text-slate-500">
            {calculatedLines.length > 0 ? (
              <span className="font-medium">Ready to record: <strong className="text-slate-800">₱{total.toFixed(2)}</strong></span>
            ) : (
              <span>Add items to complete manual sale entry</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 sm:py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || cart.length === 0 || (payments.some(p => p.method === 'Deposit') && !selectedCustomer)}
              className="flex-1 sm:flex-initial px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <span>Record Sale</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}

export default ManualSaleModal
