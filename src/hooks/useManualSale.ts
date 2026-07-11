import { useState, useMemo } from 'react'
import { Product } from '../types/product'
import { CustomerSearchResult } from '../types/debt'
import { getCachedBusinessSettings } from '../utils/settingsCache'

export interface CartItem {
  product: Product
  quantity: number
}

export interface PaymentItem {
  amount: number
  method: string
  transaction_ref: string
}

export function useManualSale() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([{ amount: 0, method: 'Cash', transaction_ref: '' }])
  
  const [isScPwdDiscount, setIsScPwdDiscount] = useState(false)
  const [scPwdIdNumber, setScPwdIdNumber] = useState('')
  const [scPwdName, setScPwdName] = useState('')
  const [regularDiscount, setRegularDiscount] = useState(0)
  
  const [loyaltyPointsEarned, setLoyaltyPointsEarned] = useState(0)
  const [loyaltyPointsRedeemed, setLoyaltyPointsRedeemed] = useState(0)
  
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null)

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.base_price * item.quantity), 0)
  }, [cart])

  const tax = useMemo(() => {
    const settings = getCachedBusinessSettings();
    const billingType = settings?.billing_type || 'NON-VAT';
    
    return cart.reduce((acc, item) => {
      // SC/PWD logic: if discount is applied AND item is eligible, VAT is stripped
      if (isScPwdDiscount && item.product.is_sc_pwd_eligible) {
        return acc;
      }
      
      // Normal tax logic
      if (billingType === 'VAT' && item.product.tax_type === 'VATable') {
        return acc + (item.product.base_price * item.quantity * (item.product.tax_rate / 100));
      }
      
      return acc;
    }, 0);
  }, [cart, isScPwdDiscount])

  const scPwdDiscountAmount = useMemo(() => {
    if (!isScPwdDiscount) return 0;
    
    return cart.reduce((sum, item) => {
      if (item.product.is_sc_pwd_eligible) {
        return sum + (item.product.base_price * item.quantity) * 0.20;
      }
      return sum;
    }, 0);
  }, [cart, isScPwdDiscount])

  const total = useMemo(() => {
    return (subtotal + tax) - scPwdDiscountAmount - regularDiscount - loyaltyPointsRedeemed
  }, [subtotal, tax, scPwdDiscountAmount, regularDiscount, loyaltyPointsRedeemed])

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
    setRegularDiscount(0)
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
    regularDiscount,
    setRegularDiscount,
    loyaltyPointsEarned,
    setLoyaltyPointsEarned,
    loyaltyPointsRedeemed,
    setLoyaltyPointsRedeemed,
    selectedCustomer,
    setSelectedCustomer,
    subtotal,
    tax,
    total,
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
