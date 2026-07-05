import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Search, Plus, Minus, Trash2, ShoppingCart, Banknote,
  CheckCircle2, ChevronRight, ChevronLeft, Loader2, AlertCircle, User, Percent
} from 'lucide-react';
import { DebtService } from '../../services/debtService';
import { ProductService } from '../../services/productService';
import { OfflineDB } from '../../db/offlineDB';
import { CustomerSearchResult } from '../../types/debt';
import { Product } from '../../types/product';
import { CreateInstallmentSaleParams } from '../../types/installment';

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

  // Step 1 — Customer
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);

  // Step 2 — Cart
  const [products, setProducts] = useState<Product[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Step 3 — Terms
  const [downpayment, setDownpayment] = useState('');
  const [downpaymentMethod, setDownpaymentMethod] = useState('Cash');
  const [monthsToPay, setMonthsToPay] = useState('12');
  const [interestRate, setInterestRate] = useState('0'); // NEW: Interest Rate State
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));

  // Load products and terminals once
  useEffect(() => {
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
    const result = await onConfirm({
      p_terminal_id: Number(localStorage.getItem('selected_pos_terminal_id')),
      p_customer_id: selectedCustomer.customer_id,
      p_cart_items: cart.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
      p_downpayment_amount: dpNum,
      p_downpayment_method: downpaymentMethod,
      p_months_to_pay: monthsNum,
      p_interest_rate: interestRateNum, // NEW
      p_occurred_at: null,
    });
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

          {/* Step 1: Customer */}
          {step === 'customer' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Search for the customer who will receive this installment contract.</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                {customerSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" size={16} />}
                <input
                  type="text"
                  placeholder="Search by name or phone…"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                />
              </div>
              <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 divide-y bg-white">
                {customerResults.map(c => {
                  const isSelected = selectedCustomer?.customer_id === c.customer_id;
                  return (
                    <button
                      key={c.customer_id}
                      onClick={() => setSelectedCustomer(c)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                        ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                        <User size={16} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>{c.full_name}</p>
                        <p className="text-xs text-gray-500">{c.phone_number}</p>
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="ml-auto text-indigo-500" />}
                    </button>
                  );
                })}
                {customerQuery.length >= 2 && !customerSearching && customerResults.length === 0 && (
                  <div className="py-8 text-center text-sm text-gray-400">No customers found</div>
                )}
                {customerQuery.length < 2 && (
                  <div className="py-8 text-center text-sm text-gray-400">Type at least 2 characters to search</div>
                )}
              </div>
              {selectedCustomer && (
                <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                  <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-indigo-800">Selected: {selectedCustomer.full_name}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Cart */}
          {step === 'cart' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Add Products</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search products…"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                  />
                </div>
                <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-xl divide-y bg-white">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">₱{p.display_price.toFixed(2)} · Stock: {p.total_stock}</p>
                      </div>
                      <button
                        onClick={() => addToCart(p)}
                        disabled={p.total_stock <= 0}
                        className="ml-2 p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-30 transition"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart size={15} className="text-gray-500" />
                  <p className="text-sm font-semibold text-gray-700">Cart ({cart.length} items)</p>
                </div>
                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-gray-400">
                    <ShoppingCart size={32} className="mb-2 opacity-20" />
                    <p className="text-xs">No products added</p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-500">₱{(item.product.display_price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 rounded text-gray-500 hover:bg-gray-100">
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center text-sm font-mono font-bold text-gray-900">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.total_stock} className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                            <Plus size={12} />
                          </button>
                          <button onClick={() => updateQuantity(item.product.id, 0)} className="p-1 rounded text-red-400 hover:bg-red-50 ml-1">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {cart.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                    <span>Subtotal</span>
                    <span className="font-mono">₱{cartSubtotal.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Terms */}
          {step === 'terms' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Downpayment</label>
                  <div className="relative">
                    <Banknote size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                      value={downpayment}
                      onChange={(e) => setDownpayment(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Months to Pay</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                    value={monthsToPay}
                    onChange={(e) => setMonthsToPay(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Interest Rate (%)</label>
                  <div className="relative">
                    <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Downpayment Method</label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button key={m} type="button" onClick={() => setDownpaymentMethod(m)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                        ${downpaymentMethod === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Transaction Date</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                />
              </div>

              {/* Live preview */}
              {cartSubtotal > 0 && dpNum < cartSubtotal && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3">Contract Preview</p>
                  {[
                    ['Total Contract Value', `₱${cartSubtotal.toFixed(2)}`],
                    ['Downpayment', `₱${dpNum.toFixed(2)}`],
                    ['Financed Amount', `₱${financed.toFixed(2)}`],
                    ['Interest Amount', `₱${totalInterestAmount.toFixed(2)} (${interestRateNum}%)`],
                    ['Total Owed', `₱${totalOwed.toFixed(2)}`],
                    ['Monthly Due', `₱${monthlyDue.toFixed(2)} × ${monthsNum} months`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-semibold font-mono text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && selectedCustomer && (
            <div className="space-y-5">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selectedCustomer.full_name}</p>
                  <p className="text-sm text-gray-500">{selectedCustomer.phone_number}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Items</p>
                </div>
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between px-4 py-2.5 border-b border-gray-50 text-sm">
                    <span className="text-gray-700">{item.product.name} × {item.quantity}</span>
                    <span className="font-mono font-semibold text-gray-900">₱{(item.product.display_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-900 text-white rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Contract Summary</p>
                {[
                  ['Total Contract Value', `₱${cartSubtotal.toFixed(2)}`],
                  ['Downpayment', `₱${dpNum.toFixed(2)} via ${downpaymentMethod}`],
                  ['Financed Amount', `₱${financed.toFixed(2)}`],
                  ['Interest', `₱${totalInterestAmount.toFixed(2)} (${interestRateNum}%)`],
                  ['Total Owed', `₱${totalOwed.toFixed(2)}`],
                  ['Duration', `${monthsNum} months`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-semibold font-mono text-white">{value}</span>
                  </div>
                ))}
                <div className="h-px bg-gray-700 my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-200 font-semibold">Monthly Due</span>
                  <span className="text-2xl font-bold font-mono text-indigo-400">₱{monthlyDue.toFixed(2)}</span>
                </div>
              </div>
            </div>
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