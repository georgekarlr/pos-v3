import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ProductService } from '../services/productService'
import { Product } from '../types/product'
import LoadingSpinner from '../components/LoadingSpinner'
import ProductGrid from '../components/pos/ProductGrid'
import CartPanel, { CartLine } from '../components/pos/CartPanel'
import BundleModal from '../components/pos/BundleModal'
import { AlertCircle, RefreshCw, Search, WifiOff } from 'lucide-react'
import { PaymentInput, PosAction, PosViewMode } from '../types/pos'
import ActionModeBar from '../components/pos/ActionModeBar'
import ViewModeSwitcher from '../components/pos/ViewModeSwitcher'
import ReceiptModal from '../components/pos/ReceiptModal'
import PaymentModal from '../components/pos/PaymentModal'
import { ReceiptData } from '../components/pos/Receipt'
import { OfflineDB } from '../db/offlineDB'
import { PosService } from '../services/posService'

const POS: React.FC = () => {
  const { persona } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingSalesCount, setPendingSalesCount] = useState(0)

  const [orderQtyById, setOrderQtyById] = useState<Record<number, number>>({})
  const [bundleOpenFor, setBundleOpenFor] = useState<number | null>(null)

  const [payments, setPayments] = useState<PaymentInput[]>([])
  const [notes, setNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Receipt & Payment modal state
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const [query, setQuery] = useState('')

  // New UI state
  const [selectedAction, setSelectedAction] = useState<PosAction>('add')
  const [viewMode, setViewMode] = useState<PosViewMode>('everything')

  const loadProducts = async (silent = false) => {
    if (!silent) setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await ProductService.getAllProducts()
      if (error) {
        setError(error)
      } else {
        setProducts(data || [])
        setFilteredProducts(data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()

    const handleOnline = () => {
      setIsOnline(true)
      checkPendingSales()
    }
    const handleOffline = () => setIsOnline(false)

    const checkPendingSales = async () => {
      const sales = await OfflineDB.getAllSales()
      setPendingSalesCount(sales.length)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    checkPendingSales()

    const interval = setInterval(checkPendingSales, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  // Filtering by name or barcode
  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setFilteredProducts(products)
      return
    }
    setFilteredProducts(
      products.filter(p => (
        p.name.toLowerCase().includes(q) || (p.barcode?.toLowerCase() || '').includes(q)
      ))
    )
  }, [query, products])

  const add = (productId: number, inc = 1) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    setOrderQtyById(prev => {
      const current = prev[productId] || 0
      const next = Math.min(product.quantity, current + inc)
      return { ...prev, [productId]: next }
    })
  }

  const deduct = (productId: number, dec = 1) => {
    setOrderQtyById(prev => {
      const current = prev[productId] || 0
      const next = Math.max(0, current - dec)
      const copy = { ...prev }
      if (next === 0) delete copy[productId]
      else copy[productId] = next
      return copy
    })
  }

  const clear = (productId: number) => {
    setOrderQtyById(prev => {
      const copy = { ...prev }
      delete copy[productId]
      return copy
    })
  }

  const clearAll = () => setOrderQtyById({})

  const cartLines: CartLine[] = useMemo(() => {
    const ids = Object.keys(orderQtyById).map(Number)
    return ids
      .map(id => ({ product: products.find(p => p.id === id)!, qty: orderQtyById[id] }))
      .filter(l => l.product && l.qty > 0)
  }, [orderQtyById, products])

  const subtotal = useMemo(() => cartLines.reduce((sum, l) => sum + l.product.base_price * l.qty, 0), [cartLines])
  const tax = useMemo(() => cartLines.reduce((sum, l) => sum + (l.product.base_price * l.qty) * (l.product.tax_rate / 100), 0), [cartLines])
  const total = useMemo(() => subtotal + tax, [subtotal, tax])
    {/**const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [payments])
  const itemsCount = useMemo(() => cartLines.reduce((sum, l) => sum + l.qty, 0), [cartLines])
     **/}
  const handleProductClick = (productId: number) => {
    switch (selectedAction) {
      case 'add':
        add(productId, 1)
        break
      case 'deduct':
        deduct(productId, 1)
        break
      case 'bundle':
        setBundleOpenFor(productId)
        break
      case 'clear':
        clear(productId)
        break
    }
  }

  const handleAddPayment = () => {
    setPayments(prev => [...prev, { amount: '', method: 'Cash', transaction_ref: '', tendered: '' }])
  }

  const handleUpdatePayment = (index: number, patch: Partial<PaymentInput>) => {
    setPayments(prev => prev.map((p, i) => i === index ? { ...p, ...patch } : p))
  }

  const handleRemovePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (totalPaidFromUI: number) => {
    if (!persona?.id) {
      setError('Account ID missing')
      return
    }
    console.log('totalss', totalPaidFromUI)
    if (cartLines.length === 0) return

    setSubmitting(true)
    setError(null)
    try {
      const cartPayload = cartLines.map(l => ({
        product_id: l.product.id,
        quantity: l.qty,
        price: l.product.display_price,
        base_price: l.product.base_price,
        tax_rate: l.product.tax_rate
      }));

      const { data: serviceData, error: serviceError } = await PosService.createSale({
          p_account_id: persona.id!,
          p_customer_id: null,
          p_cart_items: cartPayload,
          p_payments: payments.map(p => ({
            amount: Number(p.amount),
            method: p.method,
            transaction_ref: p.transaction_ref
          })),
          p_notes: notes || null,
          p_total: total,
          p_tax: tax,
          p_total_tendered: totalPaidFromUI
        })


      if (serviceError || !serviceData) {
        setError(serviceError || 'Failed to create sale');
      } else {
        const result = serviceData;
        setSuccessMessage('Sale created successfully');
        setPaymentOpen(false); // Close payment modal on success

        // Build receipt data BEFORE clearing local state
        const lines = cartLines.map(l => ({
          name: l.product.name,
          qty: l.qty,
          unitType: l.product.unit_type,
          unitPrice: l.product.base_price,
          lineTotal: l.product.base_price * l.qty,
        }));
        const totalPaidLocal = totalPaidFromUI;
        const change = Math.max(0, totalPaidLocal - total);
        const receipt: ReceiptData = {
          orderId: result.is_offline ? undefined : result.data?.order_id,
          offlineId: result.is_offline ? result.data?.order_id : undefined,
          businessName: 'Point of Sale',
          businessAddress1: '',
          businessAddress2: '',
          cashier: persona.personName || persona.loginName || undefined,
          dateISO: new Date().toISOString(),
          lines,
          subtotal,
          tax,
          total,
          payments: payments.map(p => ({ method: p.method, amount: Number(p.amount) || 0, reference: p.transaction_ref || undefined })),
          totalPaid: totalPaidLocal,
          change,
          notes: notes || null,
        };
        setReceiptData(receipt)
        setReceiptOpen(true)

        // Reset state
        setOrderQtyById({})
        setPayments([])
        setNotes('')
        // Optionally refresh products (to update stock)
        // Use silent refresh so the receipt modal remains visible
        loadProducts(true)
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error during sale')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner/>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-4 flex flex-col items-center gap-3">
              {!isOnline && (
                <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-center gap-2 text-amber-800 text-sm">
                  <WifiOff className="h-4 w-4" />
                  <span>You are currently offline. Sales will be saved locally and synced when online.</span>
                </div>
              )}
              {pendingSalesCount > 0 && isOnline && (
                <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-center gap-2 text-blue-800 text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Syncing {pendingSalesCount} offline sales...</span>
                </div>
              )}
              <ActionModeBar value={selectedAction} onChange={setSelectedAction} />
              <ViewModeSwitcher value={viewMode} onChange={setViewMode} />
          </div>
          {/**<TotalsBar items={itemsCount} subtotal={subtotal} tax={tax} total={total} paid={totalPaid} />**/}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/**<div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Point of Sale</h1>
              <p className="mt-1 text-sm text-gray-500">Process new sales. Customer is optional and not required.</p>
            </div>**/}

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search name or barcode"
                  className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-64 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={loadProducts}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-green-800 font-medium">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {viewMode === 'products' && (
          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            <div>
              <ProductGrid
                products={filteredProducts}
                orderQtyById={orderQtyById}
                action={selectedAction}
                onProductClick={handleProductClick}
              />
            </div>
          </div>
        )}

        {viewMode === 'cart-payments' && (
          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            <div className="flex flex-col gap-4">
              <CartPanel
                lines={cartLines}
                subtotal={subtotal}
                tax={tax}
                total={total}
                onAdd={(id) => add(id, 1)}
                onDeduct={(id) => deduct(id, 1)}
                onClear={clear}
                onClearAll={clearAll}
                onQtyClick={(id) => setBundleOpenFor(id)}
                onCheckout={() => setPaymentOpen(true)}
              />
            </div>
          </div>
        )}

        {viewMode === 'everything' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Left: product grid spans 2 columns */}
            <div className="lg:col-span-2">
              <ProductGrid
                products={filteredProducts}
                orderQtyById={orderQtyById}
                action={selectedAction}
                onProductClick={handleProductClick}
              />
            </div>

            {/* Right: cart and payment */}
            <div className="flex flex-col gap-4">
              <CartPanel
                lines={cartLines}
                subtotal={subtotal}
                tax={tax}
                total={total}
                onAdd={(id) => add(id, 1)}
                onDeduct={(id) => deduct(id, 1)}
                onClear={clear}
                onClearAll={clearAll}
                onQtyClick={(id) => setBundleOpenFor(id)}
                onCheckout={() => setPaymentOpen(true)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bundle modal */}
      <BundleModal
        open={bundleOpenFor !== null}
        isDecimal={products.find(p => p.id === bundleOpenFor)?.selling_method === 'measured'}
        initialQuantity={bundleOpenFor !== null ? orderQtyById[bundleOpenFor] || 1 : 1}
        onClose={() => setBundleOpenFor(null)}
        onConfirm={(qty) => { if (bundleOpenFor !== null) setOrderQtyById(prev => ({ ...prev, [bundleOpenFor]: qty })) }}
      />

      {/* Receipt modal */}
      <ReceiptModal
        open={receiptOpen}
        data={receiptData}
        onClose={() => setReceiptOpen(false)}
      />

      {/* Payment modal */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={total}
        payments={payments}
        onAddPayment={handleAddPayment}
        onUpdatePayment={handleUpdatePayment}
        onRemovePayment={handleRemovePayment}
        notes={notes}
        onNotesChange={setNotes}
        onSubmit={handleSubmit}
        submitting={submitting}
        disabled={cartLines.length === 0}
      />
    </div>
  )
}

export default POS
