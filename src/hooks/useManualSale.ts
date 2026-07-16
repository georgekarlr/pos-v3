import { useState, useMemo, useEffect } from 'react'
import { Product } from '../types/product'
import { CustomerSearchResult } from '../types/debt'
import { getCachedBusinessSettings } from '../utils/settingsCache'
import { Promotion } from '../types/promotion'
import { PromotionService } from '../services/promotionService'
import { calculateCartTotals } from '../utils/cartCalculator'

export interface CartItem {
  product: Product
  quantity: number
}

export interface PaymentItem {
  amount: number
  method: string
  transaction_ref: string
}

export function useManualSale(params?: { transactionTime?: string }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([{ amount: 0, method: 'Cash', transaction_ref: '' }])
  
  const [isScPwdDiscount, setIsScPwdDiscount] = useState(false)
  const [scPwdIdNumber, setScPwdIdNumber] = useState('')
  const [scPwdName, setScPwdName] = useState('')
  const [loyaltyPointsEarned, setLoyaltyPointsEarned] = useState(0)
  const [loyaltyPointsRedeemed, setLoyaltyPointsRedeemed] = useState(0)
  
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null)
  const [promotions, setPromotions] = useState<Promotion[]>([])

  useEffect(() => {
    PromotionService.getPromotions({ limit: 1000, filterStatus: 'all' })
      .then(res => {
        if (res.data) setPromotions(res.data)
      })
      .catch(err => console.error('Failed to fetch promotions in useManualSale:', err))
  }, [])

  const transactionTimeStr = params?.transactionTime
  const transactionTime = useMemo(() => {
    return transactionTimeStr ? new Date(transactionTimeStr) : new Date()
  }, [transactionTimeStr])

  const cartLines = useMemo(() => {
    return cart.map(item => ({
      product: item.product,
      qty: item.quantity
    }))
  }, [cart])

  const billingType = useMemo(() => {
    const settings = getCachedBusinessSettings()
    return settings?.billing_type || 'NON-VAT'
  }, [])

  const cartCalculations = useMemo(() => {
    return calculateCartTotals({
      cartLines,
      promotions,
      isScPwdDiscount,
      billingType: billingType as 'VAT' | 'NON-VAT',
      loyaltyPointsRedeemed,
      transactionTime
    })
  }, [cartLines, promotions, isScPwdDiscount, billingType, loyaltyPointsRedeemed, transactionTime])

  const subtotal = cartCalculations.subtotal
  const tax = cartCalculations.tax
  const scPwdDiscountAmount = cartCalculations.scPwdDiscountAmount
  const totalPromoDiscount = cartCalculations.totalPromoDiscount
  const total = cartCalculations.total
  const calculatedLines = cartCalculations.calculatedLines

  const totalTendered = useMemo(() => {
    return payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  }, [payments])

  const changeDue = useMemo(() => {
    return Math.max(0, totalTendered - total)
  }, [totalTendered, total])

  const addToCart = (product: Product) => {
    const existing = cart.find(c => c.product.id === product.id)
    if (existing) {
      setCart(cart.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
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

  const reset = () => {
    setCart([])
    setPayments([{ amount: 0, method: 'Cash', transaction_ref: '' }])
    setIsScPwdDiscount(false)
    setScPwdIdNumber('')
    setScPwdName('')
    setLoyaltyPointsEarned(0)
    setLoyaltyPointsRedeemed(0)
    setSelectedCustomer(null)
  }

  return {
    cart,
    setCart,
    payments,
    setPayments,
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
    reset
  }
}
