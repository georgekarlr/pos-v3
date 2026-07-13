import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ProductService } from '../services/productService'
import { Product } from '../types/product'
import LoadingSpinner from '../components/LoadingSpinner'
import ProductGrid from '../components/pos/ProductGrid'
import CartPanel, { CartLine } from '../components/pos/CartPanel'
import BundleModal from '../components/pos/BundleModal'
import { AlertCircle, Camera, Coins, RefreshCw, Search, WifiOff } from 'lucide-react'
import { PaymentInput, PosAction, PosViewMode } from '../types/pos'
import { CustomerService } from '../services/customerService'
import ActionModeBar from '../components/pos/ActionModeBar'
import ViewModeSwitcher from '../components/pos/ViewModeSwitcher'
import ReceiptModal from '../components/pos/ReceiptModal'
import PaymentModal from '../components/pos/PaymentModal'
import {ReceiptData, ReceiptLine} from '../components/pos/Receipt'
import { OfflineDB } from '../db/offlineDB'
import { PosService } from '../services/posService'
import { useHardwareScanner } from '../hooks/useHardwareScanner'
import CameraScanner from '../components/pos/CameraScanner'
import { useScannerSettings } from '../contexts/ScannerSettingsContext'
import OfflineSalesModal from '../components/pos/OfflineSalesModal'
import PettyCashModal from '../components/pos/PettyCashModal'
import { getCachedBusinessSettings } from '../utils/settingsCache'
import { FormatDateTime } from '../utils/formatDateTime'

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
  const [scanSuccess, setScanSuccess] = useState<string | null>(null)

  // Terminals
  const [terminals, setTerminals] = useState<any[]>([])
  const [selectedTerminalId, setSelectedTerminalId] = useState<number | null>(null)

  // SC/PWD Discount state
  const [isScPwdDiscount, setIsScPwdDiscount] = useState<boolean>(false)
  const [scPwdIdNumber, setScPwdIdNumber] = useState<string>('')
  const [scPwdName, setScPwdName] = useState<string>('')
  const [regularDiscount, setRegularDiscount] = useState<string>('')

  // Customer & Loyalty state
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customerLoyaltyBalance, setCustomerLoyaltyBalance] = useState<number>(0)

  // Receipt & Payment modal state
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const [query, setQuery] = useState('')

  // New UI state
  const [selectedAction, setSelectedAction] = useState<PosAction>('add')
  const [viewMode, setViewMode] = useState<PosViewMode>('everything')

  const { scanMode } = useScannerSettings()
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [offlineSalesOpen, setOfflineSalesOpen] = useState(false)
  const [isPettyCashOpen, setIsPettyCashOpen] = useState(false)

  const loadProducts = async (silent = false) => {
    if (!silent) setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await ProductService.getAllProducts(1000, 0, undefined, true)
      // Always apply whatever data we got (cached or live)
      if (data !== null) {
        setProducts(data)
        setFilteredProducts(data)
      }
      // Only show error banner when online (offline errors are expected)
      if (error && isOnline) {
        setError(error)
      }
    } catch (err) {
      if (isOnline) setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const loadTerminals = async () => {
    try {
      const { data, error: termError } = await PosService.getActiveTerminals()
      if (termError) {
        console.error('Failed to load terminals:', termError)
      } else {
        setTerminals(data || [])
        if (data && data.length > 0) {
          const savedId = localStorage.getItem('selected_pos_terminal_id')
          if (savedId && data.some((t: any) => t.id === Number(savedId))) {
            setSelectedTerminalId(Number(savedId))
          } else if (data.length === 1) {
            setSelectedTerminalId(data[0].id)
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error loading terminals:', err)
    }
  }

  useEffect(() => {
    loadProducts()
    loadTerminals()

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

  useEffect(() => {
    if (selectedTerminalId && isOnline) {
      PosService.getTerminalState(selectedTerminalId).then((res) => {
        if (res.data) {
          console.log('Fetched and cached terminal state:', res.data);
        }
      });
    }
  }, [selectedTerminalId, isOnline])

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
      const next = Math.min(product.total_stock, current + inc)
      return { ...prev, [productId]: next }
    })
  }

  const handleBarcodeScanned = useCallback((barcode: string) => {
    const product = products.find(p => p.barcode === barcode)
    if (product) {
      if (selectedAction === 'add') {
        add(product.id, 1)
        setScanSuccess(`Added ${product.name}`)
      } else if (selectedAction === 'deduct') {
        deduct(product.id, 1)
        setScanSuccess(`Deducted ${product.name}`)
      } else if (selectedAction === 'bundle') {
        setBundleOpenFor(product.id)
      } else if (selectedAction === 'clear') {
        clear(product.id)
        setScanSuccess(`Cleared ${product.name} from cart`)
      }
      if (selectedAction !== 'bundle') {
        setTimeout(() => setScanSuccess(null), 2000)
      }
    } else {
      setError(`Product with barcode ${barcode} not found`)
      setTimeout(() => setError(null), 3000)
    }
  }, [products, selectedAction])

  const handleMultipleBarcodesScanned = useCallback((items: { product: Product, count: number }[]) => {
    items.forEach(({ product, count }) => {
      if (selectedAction === 'add') {
        add(product.id, count)
      } else {
        deduct(product.id, count)
      }
    })
    if (items.length > 0) {
      setScanSuccess(`${selectedAction === 'add' ? 'Added' : 'Deducted'} ${items.length} items ${selectedAction === 'add' ? 'to' : 'from'} cart`)
      setTimeout(() => setScanSuccess(null), 2000)
    }
  }, [products, selectedAction])

  useHardwareScanner(handleBarcodeScanned, scanMode === 'hardware')

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

  const handleClosePayment = () => {
    setPaymentOpen(false)
    setIsScPwdDiscount(false)
    setScPwdIdNumber('')
    setScPwdName('')
    setRegularDiscount('')
    setCustomerId(null)
    setPayments([])
    setNotes('')
  }

  const cartLines: CartLine[] = useMemo(() => {
    const ids = Object.keys(orderQtyById).map(Number)
    return ids
      .map(id => ({ product: products.find(p => p.id === id)!, qty: orderQtyById[id] }))
      .filter(l => l.product && l.qty > 0)
  }, [orderQtyById, products])

  const subtotal = useMemo(() => cartLines.reduce((sum, l) => sum + l.product.base_price * l.qty, 0), [cartLines])

  const tax = useMemo(() => {
    const settings = getCachedBusinessSettings();
    const billingType = settings?.billing_type || 'NON-VAT';

    return cartLines.reduce((sum, l) => {
      // SC/PWD logic: if discount is applied AND item is eligible, VAT is stripped
      if (isScPwdDiscount && l.product.is_sc_pwd_eligible) {
        return sum;
      }
      
      // Normal tax logic
      if (billingType === 'VAT' && l.product.tax_type === 'VATable') {
        return sum + (l.product.base_price * l.qty) * (l.product.tax_rate / 100);
      }
      
      return sum;
    }, 0);
  }, [cartLines, isScPwdDiscount])

  const scPwdDiscountAmount = useMemo(() => {
    if (!isScPwdDiscount) return 0;
    
    // Server logic: v_server_calculated_sc_discount := v_server_calculated_sc_discount + (v_line_gross * 0.20);
    // where v_line_gross = v_product.base_price * cart_item.quantity;
    // only if v_product.is_sc_pwd_eligible = TRUE
    return cartLines.reduce((sum, l) => {
      if (l.product.is_sc_pwd_eligible) {
        return sum + (l.product.base_price * l.qty) * 0.20;
      }
      return sum;
    }, 0);
  }, [cartLines, isScPwdDiscount])

  const regularDiscountAmount = useMemo(() => {
    return Number(regularDiscount) || 0
  }, [regularDiscount])

  const total = useMemo(() => {
    const calculated = subtotal + tax - scPwdDiscountAmount - regularDiscountAmount
    return Math.max(0, calculated)
  }, [subtotal, tax, scPwdDiscountAmount, regularDiscountAmount])

  // Loyalty points earned: 1 point per ₱1 of net total
  const loyaltyPointsEarned = useMemo(() => {
    if (!customerId) return 0
    return Math.floor(total)
  }, [total, customerId])
  // Fetch customer loyalty balance whenever customerId changes
  useEffect(() => {
    if (customerId === null) {
      setCustomerLoyaltyBalance(0)
      return
    }
    CustomerService.getCustomerById(customerId).then(res => {
      if (res.data) {
        setCustomerLoyaltyBalance(Number(res.data.total_loyalty_points ?? 0))
      } else {
        setCustomerLoyaltyBalance(0)
      }
    }).catch(() => setCustomerLoyaltyBalance(0))
  }, [customerId])

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
    if (!selectedTerminalId) {
      setError('Please select a terminal before completing the sale.')
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
        p_terminal_id: selectedTerminalId,
        p_customer_id: customerId,
        p_cart_items: cartPayload,
        p_payments: payments.map(p => ({
          amount: Number(p.amount),
          method: p.method,
          transaction_ref: p.transaction_ref
        })),
        p_notes: notes || null,
        p_total: total,
        p_tax: tax,
        p_total_tendered: totalPaidFromUI,
        // BIR Compliance
        p_sc_pwd_discount: scPwdDiscountAmount,
        p_sc_pwd_id_number: isScPwdDiscount ? scPwdIdNumber : null,
        p_sc_pwd_name: isScPwdDiscount ? scPwdName : null,
        p_regular_discount: regularDiscountAmount,
        // Loyalty
        p_loyalty_points_earned: loyaltyPointsEarned,
        p_loyalty_points_redeemed: 0,
      })


      if (serviceError || !serviceData) {
        setError(serviceError || 'Failed to create sale');
      } else {
        const result = serviceData;
        setSuccessMessage('Sale created successfully');
        handleClosePayment(); // Reset states and close modal

        // Build receipt data BEFORE clearing local state
        const lines: ReceiptLine[] = cartLines.map(l => ({
          name: l.product.name,
          qty: l.qty,
          unitType: l.product.unit_type,
          unitPrice: l.product.display_price,       // VAT-inclusive (used for normal sales)
          baseUnitPrice: l.product.base_price,      // VAT-exclusive (used for SC/PWD sales)
          lineTotal: l.product.display_price * l.qty,
          isScPwdEligible: l.product.is_sc_pwd_eligible,
        }));
        const totalPaidLocal = totalPaidFromUI;
        const change = Math.max(0, totalPaidLocal - total);
        let businessName = 'Point of Sale';
        let businessAddress1: string | undefined;
        let tin: string | undefined;
        let isVatRegistered: boolean | undefined;
        let min: string | undefined;
        let ptuIssuedBy: string | undefined;
        let softwareProviderName: string | undefined;
        let softwareProviderAddress: string | undefined;
        let softwareProviderTin: string | undefined;
        let softwareProviderAccreditationNo: string | undefined;

        try {
          const settings = getCachedBusinessSettings();
          if (settings) {
            businessName = settings.business_name || 'Point of Sale';
            businessAddress1 = settings.address || undefined;
            tin = settings.tin || undefined;
            isVatRegistered = settings.is_vat_registered !== undefined ? Boolean(settings.is_vat_registered) : undefined;
            min = settings.min || undefined;
            ptuIssuedBy = settings.ptu_issued_by || undefined;
            softwareProviderName = settings.software_provider_name || undefined;
            softwareProviderAddress = settings.software_provider_address || undefined;
            softwareProviderTin = settings.software_provider_tin || undefined;
            softwareProviderAccreditationNo = settings.software_provider_accreditation_no || undefined;
          }
        } catch (e) {
          console.error('Error reading cached business settings in POS checkout:', e);
        }

        const receipt: ReceiptData = {
          orderId: result.is_offline ? undefined : result.data?.order_id,
          offlineId: result.is_offline ? result.data?.order_id : undefined,
          invoiceNumber: result.data?.invoice_number,
          terminalId: selectedTerminalId,
          businessName,
          businessAddress1,
          tin,
          isVatRegistered,
          min,
          cashier: persona.personName || persona.loginName || undefined,
          dateISO: FormatDateTime.formatLocalTimestampForDatabase(new Date()),
          lines,
          subtotal,
          tax,
          scPwdDiscount: scPwdDiscountAmount,
          regularDiscount: regularDiscountAmount,
          total,
          payments: payments.map(p => ({ method: p.method, amount: Number(p.amount) || 0, reference: p.transaction_ref || undefined })),
          totalPaid: totalPaidLocal,
          change,
          notes: notes || null,
          ptuIssuedBy,
          softwareProviderName,
          softwareProviderAddress,
          softwareProviderTin,
          softwareProviderAccreditationNo,
        };
        setReceiptData(receipt)
        setReceiptOpen(true)
        setOrderQtyById({}) // Clear cart after success and receipt generation

        // Silent refresh to update stock without closing receipt modal
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
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-4 flex flex-col items-center gap-3">
          {!isOnline && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-2 text-amber-800 text-sm">
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4" />
                <span>Offline</span>
              </div>
              <button
                onClick={() => setOfflineSalesOpen(true)}
                className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md font-medium transition-colors border border-amber-300 whitespace-nowrap"
              >
                View Offline Sales
              </button>
            </div>
          )}
          {pendingSalesCount > 0 && isOnline && (
            <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between gap-2 text-blue-800 text-sm">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Syncing {pendingSalesCount} offline sales...</span>
              </div>
              <button
                onClick={() => setOfflineSalesOpen(true)}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-md font-medium transition-colors border border-blue-300 whitespace-nowrap"
              >
                View Offline Sales
              </button>
            </div>
          )}
          {!selectedTerminalId && !isLoading && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-amber-800 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 animate-pulse" />
              <span>No active terminal selected. Please select a terminal to process checkout transactions.</span>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <ActionModeBar value={selectedAction} onChange={setSelectedAction} />

            {/* Active Terminal Display */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm">
              <span className="text-gray-500 font-medium">Terminal:</span>
              <span className="font-semibold text-gray-900">
                {selectedTerminalId
                  ? (terminals.find(t => t.id === selectedTerminalId)?.terminal_name ||
                    terminals.find(t => t.id === selectedTerminalId)?.name ||
                    `Terminal #${selectedTerminalId}`)
                  : 'None'}
              </span>
              <Link
                to="/settings"
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline ml-1.5 border-l pl-1.5 border-gray-300 font-medium"
              >
                Change
              </Link>
            </div>

            {selectedTerminalId && (
              <button
                onClick={() => {
                  if (!isOnline) {
                    setError('Petty cash operations require an active internet connection.')
                    return
                  }
                  setIsPettyCashOpen(true)
                }}
                className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 px-3.5 py-1.5 rounded-lg shadow-sm text-sm transition-colors font-medium"
                title="Manage Petty Cash / Drawer Float"
              >
                <Coins className="h-4 w-4" />
                <span>Petty Cash</span>
              </button>
            )}

            {scanMode === 'camera' && (
              <button
                onClick={() => setIsCameraOpen(true)}
                className="px-4 py-2 text-sm font-medium flex items-center gap-2 rounded-lg border border-gray-200 bg-white shadow-sm text-blue-700 hover:bg-gray-50 transition-colors"
                title="Open Camera Scanner"
              >
                <Camera className="h-4 w-4" />
                <span>Open Scanner</span>
              </button>
            )}
            <ViewModeSwitcher value={viewMode} onChange={setViewMode} />
          </div>
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

          {scanSuccess && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-blue-800 font-medium">{scanSuccess}</p>
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
                terminalSelected={selectedTerminalId !== null} // NEW
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
                terminalSelected={selectedTerminalId !== null} // NEW
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

      {isCameraOpen && (
        <CameraScanner
          onScan={handleBarcodeScanned}
          onMultipleScan={handleMultipleBarcodesScanned}
          onClose={() => setIsCameraOpen(false)}
          products={products}
          currentAction={selectedAction}
        />
      )}

      {/* Receipt modal */}
      <ReceiptModal
        open={receiptOpen}
        data={receiptData}
        onClose={() => setReceiptOpen(false)}
      />

      {/* Payment modal */}
      <PaymentModal
        open={paymentOpen}
        onClose={handleClosePayment}
        total={total}
        subtotal={subtotal}
        tax={tax}
        payments={payments}
        onAddPayment={handleAddPayment}
        onUpdatePayment={handleUpdatePayment}
        onRemovePayment={handleRemovePayment}
        notes={notes}
        onNotesChange={setNotes}
        onSubmit={handleSubmit}
        submitting={submitting}
        disabled={cartLines.length === 0}
        // SC/PWD
        isScPwdDiscount={isScPwdDiscount}
        onScPwdToggle={setIsScPwdDiscount}
        scPwdDiscountAmount={scPwdDiscountAmount}
        scPwdIdNumber={scPwdIdNumber}
        onScPwdIdNumberChange={setScPwdIdNumber}
        scPwdName={scPwdName}
        onScPwdNameChange={setScPwdName}
        // Regular Discount
        regularDiscount={regularDiscount}
        onRegularDiscountChange={setRegularDiscount}
        // Customer & Loyalty
        customerId={customerId}
        onCustomerIdChange={setCustomerId}
        customerLoyaltyBalance={customerLoyaltyBalance}
        loyaltyPointsEarned={loyaltyPointsEarned}
      />

      <OfflineSalesModal
        open={offlineSalesOpen}
        onClose={() => setOfflineSalesOpen(false)}
      />

      {selectedTerminalId && persona?.id && (
        <PettyCashModal
          open={isPettyCashOpen}
          onClose={() => setIsPettyCashOpen(false)}
          terminalId={selectedTerminalId}
          accountId={persona.id}
          onSuccess={(msg) => {
            setSuccessMessage(msg)
            setTimeout(() => setSuccessMessage(null), 5000)
          }}
        />
      )}
    </div>
  )
}

export default POS
