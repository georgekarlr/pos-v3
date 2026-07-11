import React, { useState, useEffect, useMemo } from 'react'
import { XMarkIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { ProductService } from '../../services/productService'
import { DebtService } from '../../services/debtService'
import { Product } from '../../types/product'
import { CustomerSearchResult } from '../../types/debt'
import { salesService } from '../../services/salesService'
import { RecordManualSaleParams } from '../../types/pos'
import { FormatDateTime } from '../../utils/formatDateTime'

interface ManualSaleModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  accountId: number
}

interface CartItem {
  product: Product
  quantity: number
}

interface PaymentItem {
  amount: number
  method: string
  transaction_ref: string
}

const ManualSaleModal: React.FC<ManualSaleModalProps> = ({ open, onClose, onSuccess, accountId }) => {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form Fields
  const [manualOrNumber, setManualOrNumber] = useState('')
  const [occurredAt, setOccurredAt] = useState(FormatDateTime.formatLocalTimestampForDatabase(new Date()))
  const [notes, setNotes] = useState('')
  const [scPwdDiscount, setScPwdDiscount] = useState(0)
  const [regularDiscount, setRegularDiscount] = useState(0)

  // Cart & Payments
  const [cart, setCart] = useState<CartItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([{ amount: 0, method: 'Cash', transaction_ref: '' }])

  // Product Search
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [searchingProducts, setSearchingProducts] = useState(false)

  // Customer Search
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null)
  const [searchingCustomers, setSearchingCustomers] = useState(false)

  useEffect(() => {
    if (open) {
      setTimeout(() => setShow(true), 10)
      setError(null)
      setManualOrNumber('')
      setCart([])
      setPayments([{ amount: 0, method: 'Cash', transaction_ref: '' }])
      setNotes('')
      setScPwdDiscount(0)
      setRegularDiscount(0)
      setSelectedCustomer(null)
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

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.base_price * item.quantity), 0)
  }, [cart])

  const tax = useMemo(() => {
    return cart.reduce((acc, item) => {
      if (item.product.tax_type === 'VATable' && scPwdDiscount === 0) {
        return acc + (item.product.base_price * item.quantity * (item.product.tax_rate / 100))
      }
      return acc
    }, 0)
  }, [cart, scPwdDiscount])

  const total = useMemo(() => {
    return (subtotal + tax) - scPwdDiscount - regularDiscount
  }, [subtotal, tax, scPwdDiscount, regularDiscount])

  const totalTendered = useMemo(() => {
    return payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  }, [payments])

  const addToCart = (product: Product) => {
    const existing = cart.find(c => c.product.id === product.id)
    if (existing) {
      setCart(cart.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
    setProductSearch('')
    setProductResults([])
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(c => c.product.id !== productId))
  }

  const updateQuantity = (productId: number, qty: number) => {
    setCart(cart.map(c => c.product.id === productId ? { ...c, quantity: Math.max(0.01, qty) } : c))
  }

  const addPayment = () => {
    setPayments([...payments, { amount: 0, method: 'Cash', transaction_ref: '' }])
  }

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index))
  }

  const updatePayment = (index: number, field: keyof PaymentItem, value: any) => {
    setPayments(payments.map((p, i) => i === index ? { ...p, [field]: value } : p))
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
    if (totalTendered < total - 0.01) {
      setError('Total tendered is less than total amount due')
      return
    }

    setLoading(true)
    setError(null)

    const params: RecordManualSaleParams = {
      p_account_id: accountId,
      p_customer_id: selectedCustomer?.customer_id || null,
      p_manual_or_number: manualOrNumber,
      p_cart_items: cart.map(c => ({ product_id: c.product.id, quantity: c.quantity })),
      p_payments: payments.map(p => ({ amount: p.amount, method: p.method, transaction_ref: p.transaction_ref })),
      p_notes: notes,
      p_total: total,
      p_tax: tax,
      p_total_tendered: totalTendered,
      p_sc_pwd_discount: scPwdDiscount,
      p_regular_discount: regularDiscount,
      p_occurred_at: new Date(occurredAt).toISOString()
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
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerResults([]) }}
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
                        onClick={() => addToCart(p)}
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
                {cart.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">No products added yet</div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="p-3 flex items-center justify-between gap-2 bg-white">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">₱{item.product.base_price.toFixed(2)} / {item.product.unit_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step={item.product.unit_type === 'kg' ? '0.01' : '1'}
                          value={item.quantity}
                          onChange={e => updateQuantity(item.product.id, parseFloat(e.target.value))}
                          className="w-16 rounded-md border-gray-300 text-sm p-1 text-center"
                        />
                        <button type="button" onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:text-red-700">
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
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gross Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (VAT)</span>
                <span>₱{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500">SC/PWD Discount</span>
                  <input
                    type="number"
                    value={scPwdDiscount}
                    onChange={e => setScPwdDiscount(Number(e.target.value))}
                    className="w-24 text-xs p-1 border rounded"
                  />
                </div>
                <span className="text-red-600">-₱{scPwdDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500">Regular Discount</span>
                  <input
                    type="number"
                    value={regularDiscount}
                    onChange={e => setRegularDiscount(Number(e.target.value))}
                    className="w-24 text-xs p-1 border rounded"
                  />
                </div>
                <span className="text-red-600">-₱{regularDiscount.toFixed(2)}</span>
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
                  ₱{Math.max(0, totalTendered - total).toFixed(2)}
                </span>
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
