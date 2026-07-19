import React, { useState, useEffect, useCallback } from 'react';
import {
  X, CheckCircle2, ChevronRight, ChevronLeft, Loader2, AlertCircle
} from 'lucide-react';
import { DebtService } from '../../services/debtService';
import { ProductService } from '../../services/productService';
import { OfflineDB } from '../../db/offlineDB';
import { CustomerSearchResult } from '../../types/debt';
import { Product } from '../../types/product';
import { CreateInstallmentSaleParams } from '../../types/installment';
import { PosService } from "../../services/posService.ts";

import CustomerStep from './create-steps/CustomerStep';
import ProductStep from './create-steps/ProductStep';
import TermsStep from './create-steps/TermsStep';
import ConfirmStep from './create-steps/ConfirmStep';

type Step = 'customer' | 'cart' | 'terms' | 'confirm';

const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Card'];

interface CartItem {
  product: Product;
  quantity: number;
}

interface CreateInstallmentModalProps {
  accountId: number;
  onConfirm: (params: Omit<CreateInstallmentSaleParams, 'p_account_id'>) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
  isLoading: boolean;
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'customer', label: 'Customer' },
  { id: 'cart', label: 'Products' },
  { id: 'terms', label: 'Terms' },
  { id: 'confirm', label: 'Confirm' },
];

const CreateInstallmentModal: React.FC<CreateInstallmentModalProps> = ({
  accountId, // Kept for prop type consistency, though unused directly in rendering
  onConfirm,
  onClose,
  isLoading,
}) => {
  const [step, setStep] = useState<Step>('customer');
  const [error, setError] = useState<string | null>(null);

  const [selectedTerminalId, setSelectedTerminalId] = useState<number | null>(null);

  // Step 1 — Customer
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [promoId, setPromoId] = useState<number | null>(null);

  // Step 2 — Cart
  const [products, setProducts] = useState<Product[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Step 3 — Terms
  const [downpayment, setDownpayment] = useState('');
  const [downpaymentMethod, setDownpaymentMethod] = useState('Cash');
  const [monthsToPay, setMonthsToPay] = useState('12');
  const [interestRate, setInterestRate] = useState('0'); // NEW: Interest Rate State
  const [occurredAt, setOccurredAt] = useState(() => {
    const d = new Date()

    return (
      `${d.getFullYear()}-` +
      `${String(d.getMonth() + 1).padStart(2, '0')}-` +
      `${String(d.getDate()).padStart(2, '0')}T` +
      `${String(d.getHours()).padStart(2, '0')}:` +
      `${String(d.getMinutes()).padStart(2, '0')}:` +
      `${String(d.getSeconds()).padStart(2, '0')}`
    )
  });

  const loadTerminals = async () => {
    try {
      const { data, error: termError } = await PosService.getActiveTerminals()
      if (termError) {
        console.error('Failed to load terminals:', termError)
      } else {
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

  // Load products and terminals once
  useEffect(() => {
    loadTerminals();
    const load = async () => {
      const cached = await OfflineDB.getProducts();
      if (cached.length > 0) setProducts(cached);
      const { data } = await ProductService.getAllProducts(500);
      if (data) {
        setProducts(data);
        await OfflineDB.saveProducts(data);
      }
    };
    load();
  }, []);

  // Customer search (debounced)
  const searchCustomers = useCallback(async (term: string) => {
    if (term.length < 2) { setCustomerResults([]); return; }
    setCustomerSearching(true);
    const { data } = await DebtService.searchCustomers(term);
    setCustomerResults(data || []);
    setCustomerSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchCustomers(customerQuery), 300);
    return () => clearTimeout(t);
  }, [customerQuery, searchCustomers]);

  // Cart helpers
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.product.id !== productId)); return; }
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: Math.min(i.product.total_stock, qty) } : i));
  };

  // Calculations (Matches backend logic)
  const cartSubtotal = cart.reduce((s, i) => s + i.product.display_price * i.quantity, 0);
  const dpNum = parseFloat(downpayment) || 0;
  const monthsNum = parseInt(monthsToPay) || 1;
  const interestRateNum = parseFloat(interestRate) || 0;

  const financed = cartSubtotal - dpNum;
  const totalInterestAmount = financed * (interestRateNum / 100);
  const totalOwed = financed + totalInterestAmount;
  const monthlyDue = totalOwed > 0 ? totalOwed / monthsNum : 0;

  // Navigation
  const goNext = () => {
    setError(null);
    if (step === 'customer') {
      if (!selectedCustomer) { setError('Please select a customer.'); return; }
      setStep('cart');
    } else if (step === 'cart') {
      if (cart.length === 0) { setError('Please add at least one product.'); return; }
      setStep('terms');
    } else if (step === 'terms') {
      if (dpNum < 0) { setError('Downpayment cannot be negative.'); return; }
      if (dpNum >= cartSubtotal) { setError('Downpayment covers the full amount. Use a standard sale instead.'); return; }
      if (monthsNum < 1) { setError('Months to pay must be at least 1.'); return; }
      if (interestRateNum < 0) { setError('Interest rate cannot be negative.'); return; }
      setStep('confirm');
    }
  };

  const goBack = () => {
    setError(null);
    if (step === 'cart') setStep('customer');
    else if (step === 'terms') setStep('cart');
    else if (step === 'confirm') setStep('terms');
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) return;
    if (dpNum > 0 && !selectedTerminalId) {
      setError('No active terminal detected. Please register or select an active terminal drawer before performing downpayments.');
      return;
    }
    const result = await onConfirm({
      p_terminal_id: selectedTerminalId,
      p_customer_id: selectedCustomer.customer_id,
      p_cart_items: cart.map(i => ({ product_id: i.product.id, quantity: i.quantity, promo_id: promoId })),
      p_downpayment_amount: dpNum,
      p_downpayment_method: downpaymentMethod,
      p_months_to_pay: monthsNum,
      p_interest_rate: interestRateNum, // NEW
      p_occurred_at: null,
      p_cart_full: cart.map(i => ({ ...i.product, qty: i.quantity, lineTotal: i.product.display_price * i.quantity, unitPrice: i.product.display_price }))
    } as any);
    if (!result.success) setError(result.message);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productQuery.toLowerCase())
  );

  const currentStepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!isLoading ? onClose : undefined} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">New Installment Sale</h2>
            <p className="text-xs text-gray-500">Step {currentStepIndex + 1} of {STEPS.length} — {STEPS[currentStepIndex].label}</p>
          </div>
          <button onClick={onClose} disabled={isLoading} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 px-6 py-4 border-b border-gray-50 flex-shrink-0 bg-gray-50">
          {STEPS.map((s, i) => {
            const isDone = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <React.Fragment key={s.id}>
                <div className={`flex items-center gap-2 text-xs font-semibold transition-colors
                  ${isCurrent ? 'text-indigo-700' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold
                    ${isCurrent ? 'bg-indigo-600 text-white' : isDone ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {isDone ? <CheckCircle2 size={12} /> : i + 1}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 transition-colors ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-sm flex-shrink-0">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'customer' && (
            <CustomerStep
              customerQuery={customerQuery}
              setCustomerQuery={setCustomerQuery}
              customerSearching={customerSearching}
              customerResults={customerResults}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
            />
          )}

          {step === 'cart' && (
            <ProductStep
              productQuery={productQuery}
              setProductQuery={setProductQuery}
              filteredProducts={filteredProducts}
              addToCart={addToCart}
              cart={cart}
              updateQuantity={updateQuantity}
              cartSubtotal={cartSubtotal}
            />
          )}

          {step === 'terms' && (
            <TermsStep
              downpayment={downpayment}
              setDownpayment={setDownpayment}
              monthsToPay={monthsToPay}
              setMonthsToPay={setMonthsToPay}
              interestRate={interestRate}
              setInterestRate={setInterestRate}
              downpaymentMethod={downpaymentMethod}
              setDownpaymentMethod={setDownpaymentMethod}
              occurredAt={occurredAt}
              setOccurredAt={setOccurredAt}
              paymentMethods={PAYMENT_METHODS}
              cartSubtotal={cartSubtotal}
              dpNum={dpNum}
              financed={financed}
              totalInterestAmount={totalInterestAmount}
              interestRateNum={interestRateNum}
              totalOwed={totalOwed}
              monthlyDue={monthlyDue}
              monthsNum={monthsNum}
            />
          )}

          {step === 'confirm' && selectedCustomer && (
            <ConfirmStep
              selectedCustomer={selectedCustomer}
              cart={cart}
              cartSubtotal={cartSubtotal}
              dpNum={dpNum}
              downpaymentMethod={downpaymentMethod}
              financed={financed}
              totalInterestAmount={totalInterestAmount}
              interestRateNum={interestRateNum}
              totalOwed={totalOwed}
              monthsNum={monthsNum}
              monthlyDue={monthlyDue}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            onClick={goBack}
            disabled={step === 'customer' || isLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-30 transition"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {step !== 'confirm' ? (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm"
            >
              Continue
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Create Contract
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateInstallmentModal;