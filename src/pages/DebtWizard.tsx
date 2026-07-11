import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DebtService } from '../services/debtService';
import { ProductService } from '../services/productService';
import { OfflineDB } from '../db/offlineDB';
import { Product } from '../types/product';
import { CustomerSearchResult } from '../types/debt';
import { FormatDateTime } from '../utils/formatDateTime';
import {
  User,
  Search,
  Plus,
  ShoppingCart,
  Banknote,
  FileText,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Trash2,
  AlertCircle,
  X,
  UserPlus
} from 'lucide-react';

type Step = 'customer' | 'items' | 'loan' | 'summary';

const DebtWizard: React.FC = () => {
  const { persona } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Customer state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    address: ''
  });

  // Items state
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  // Loan state
  const [cashLoanAmount, setCashLoanAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [occurredAt, setOccurredAt] = useState<string>(FormatDateTime.formatLocalTimestampForDatabase(new Date()));
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load products once
  useEffect(() => {
    const loadProducts = async () => {
      // Try to load from IndexedDB first for fast initial render or offline use
      const cachedProducts = await OfflineDB.getProducts();
      if (cachedProducts.length > 0) {
        setProducts(cachedProducts);
      }

      const { data, error } = await ProductService.getAllProducts(100);
      if (error) {
        if (navigator.onLine) setError(error);
        // If offline and no cache, show specific error
        if (!navigator.onLine && cachedProducts.length === 0) {
          setError('Offline: No products cached. Please connect to internet to sync products.');
        }
      } else if (data) {
        setProducts(data);
        // Update offline cache
        await OfflineDB.saveProducts(data);
      }
    };
    loadProducts();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Customer search
  useEffect(() => {
    const search = async () => {
      if (customerSearch.length < 2) {
        setCustomers([]);
        return;
      }
      const { data, error } = await DebtService.searchCustomers(customerSearch);
      if (error) setError(error);
      else if (data) setCustomers(data);
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const nextQty = Math.min(item.product.total_stock, quantity);

    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity: nextQty } : item
    ));
  };

  const calculateTotalItemsValue = () => {
    return cart.reduce((sum, item) => sum + (item.product.display_price * item.quantity), 0);
  };

  const handleSubmit = async () => {
    if (!persona?.id) {
      setError('No active persona found.');
      return;
    }

    setLoading(true);
    setError(null);

    const params = {
      p_requesting_account_id: persona.id,
      p_full_name: isNewCustomer ? newCustomer.full_name : (selectedCustomer?.full_name || ''),
      p_phone_number: isNewCustomer ? newCustomer.phone_number : (selectedCustomer?.phone_number || ''),
      p_email: isNewCustomer ? newCustomer.email : null,
      p_address: isNewCustomer ? newCustomer.address : null,
      p_items_to_debt: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      })),
      p_cash_loan_amount: cashLoanAmount,
      p_description: description,
      p_occurred_at: occurredAt ? FormatDateTime.formatLocalTimestampForDatabase(new Date(occurredAt)) : null
    };

    const { data, error: submitError } = await DebtService.createCustomerAndAddDebt(params);

    if (submitError) {
      setError(submitError);
      setLoading(false);
    } else if (data) {
      if (data.is_offline) {
        setSuccess('Debt saved offline. It will be synchronized once you are back online.');
      } else {
        setSuccess(`Debt recorded successfully! New balance: ${data.data?.new_balance.toFixed(2)}`);
      }
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep('customer');
    setSelectedCustomer(null);
    setIsNewCustomer(false);
    setNewCustomer({ full_name: '', phone_number: '', email: '', address: '' });
    setCart([]);
    setCashLoanAmount(0);
    setDescription('');
    setSuccess(null);
    setError(null);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Success!</h2>
        <p className="text-gray-600 mb-8">{success}</p>
        <button
          onClick={resetWizard}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Start New Debt Record
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Debt Wizard</h1>
          <p className="text-gray-500">Record a new product debt or cash loan for a customer.</p>
        </div>
        {!isOnline && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-medium">
            <AlertCircle size={14} />
            Offline Mode
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
        {[
          { id: 'customer', label: 'Customer', icon: User },
          { id: 'items', label: 'Items', icon: ShoppingCart },
          { id: 'loan', label: 'Loan & Details', icon: Banknote },
          { id: 'summary', label: 'Confirm', icon: CheckCircle2 }
        ].map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className={`flex flex-col items-center min-w-[80px] ${currentStep === step.id ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep === step.id ? 'bg-indigo-100 border-2 border-indigo-600' : 'bg-gray-100 border-2 border-transparent'
                }`}>
                <step.icon size={20} />
              </div>
              <span className="text-xs font-medium">{step.label}</span>
            </div>
            {idx < 3 && <div className="flex-1 h-px bg-gray-200 mx-4 mt-[-20px]" />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Step 1: Customer Selection */}
        {currentStep === 'customer' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Select Customer</h2>
              <button
                onClick={() => setIsNewCustomer(!isNewCustomer)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                {isNewCustomer ? 'Search Existing' : 'Add New Customer'}
              </button>
            </div>

            {!isNewCustomer ? (
              <div className="space-y-4">
                {!isOnline && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-sm flex items-start gap-2">
                    <AlertCircle className="shrink-0 mt-0.5" size={16} />
                    <p>Customer search is unavailable while offline. Please use <strong>Add New Customer</strong> to proceed.</p>
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    disabled={!isOnline}
                    placeholder={isOnline ? "Search by name or phone number..." : "Search unavailable offline"}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg divide-y">
                  {customers.map(c => (
                    <button
                      key={c.customer_id}
                      onClick={() => setSelectedCustomer(c)}
                      className={`w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors ${selectedCustomer?.customer_id === c.customer_id ? 'bg-indigo-50 border-indigo-200' : ''
                        }`}
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{c.full_name}</p>
                        <p className="text-sm text-gray-500">{c.phone_number}</p>
                      </div>
                      <div className="flex gap-4 items-center">
                        {c.total_loyalty_points !== undefined && c.total_loyalty_points > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase font-bold">Loyalty</p>
                            <p className="font-semibold text-amber-600 font-mono text-sm">
                              {Number(c.total_loyalty_points).toLocaleString()} pts
                            </p>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-xs text-gray-400 uppercase font-bold">Balance</p>
                          <p className={`font-mono ${c.current_balance > 0 ? 'text-red-600' :
                            c.current_balance < 0 ? 'text-green-600' :
                              'text-gray-400'
                            }`}>
                            {c.current_balance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {customerSearch.length >= 2 && customers.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No customers found matching "{customerSearch}"
                    </div>
                  )}
                  {customerSearch.length < 2 && (
                    <div className="p-8 text-center text-gray-400">
                      Type at least 2 characters to search
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={newCustomer.full_name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={newCustomer.phone_number}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Items Selection */}
        {currentStep === 'items' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Select Products</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Product Search & List */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-80 overflow-y-auto border border-gray-100 rounded-lg divide-y">
                  {products
                    .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map(p => (
                      <div key={p.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-sm text-gray-500">{p.display_price.toFixed(2)} • Stock: {p.total_stock}</p>
                        </div>
                        <button
                          onClick={() => addToCart(p)}
                          disabled={p.total_stock <= 0}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full disabled:text-gray-300"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Cart Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Cart</h3>
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart size={40} className="mx-auto mb-2 opacity-20" />
                    <p>No items added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.product.display_price.toFixed(2)} / unit</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max={item.product.total_stock}
                            className="w-16 px-2 py-1 border rounded text-center text-sm"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                          />
                          <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-gray-200 mt-4">
                      <div className="flex justify-between items-center font-bold text-gray-900">
                        <span>Total Items Value:</span>
                        <span>{calculateTotalItemsValue().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Loan & Details */}
        {currentStep === 'loan' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Loan & Transaction Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cash Loan Amount</label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      value={cashLoanAmount || ''}
                      onChange={(e) => setCashLoanAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Add an optional cash loan to this debt transaction.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      rows={5}
                      placeholder="Add any specific details about this debt..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                {cart.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Items Review</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                      {cart.map(item => (
                        <div key={item.product.id} className="flex justify-between text-xs">
                          <span className="text-gray-600">{item.product.name} x {item.quantity}</span>
                          <span className="font-medium text-gray-900">{(item.product.display_price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between text-sm font-bold">
                      <span>Items Total:</span>
                      <span>{calculateTotalItemsValue().toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Summary */}
        {currentStep === 'summary' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Review & Confirm</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Customer</h3>
                  <div className="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {isNewCustomer ? newCustomer.full_name : selectedCustomer?.full_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {isNewCustomer ? newCustomer.phone_number : selectedCustomer?.phone_number}
                      </p>
                      {isNewCustomer && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">New Customer</span>}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Transaction Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium">{new Date(occurredAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Items Count:</span>
                      <span className="font-medium">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                    </div>
                    {description && (
                      <div className="pt-2">
                        <p className="text-gray-500 mb-1">Description:</p>
                        <p className="italic text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">{description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {cart.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Borrowed Items</h3>
                    <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg divide-y bg-gray-50">
                      {cart.map(item => (
                        <div key={item.product.id} className="p-3 flex justify-between items-center text-sm">
                          <div>
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-mono font-medium text-gray-700">
                            {(item.product.display_price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-900 text-white rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Debt Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Items Total</span>
                      <span className="font-mono text-xl">{calculateTotalItemsValue().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Cash Loan</span>
                      <span className="font-mono text-xl">{cashLoanAmount.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-gray-700 my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">New Debt</span>
                      <span className="font-mono text-3xl text-indigo-400">
                        {(calculateTotalItemsValue() + cashLoanAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-xs text-gray-400 text-center italic">
                  By clicking "Confirm Debt", you are recording this transaction to the customer's debt account.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => {
              if (currentStep === 'summary') setCurrentStep('loan');
              else if (currentStep === 'loan') setCurrentStep('items');
              else if (currentStep === 'items') setCurrentStep('customer');
            }}
            disabled={currentStep === 'customer' || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          {currentStep !== 'summary' ? (
            <button
              onClick={() => {
                if (currentStep === 'customer') {
                  if (isNewCustomer) {
                    if (!newCustomer.full_name || !newCustomer.phone_number) {
                      setError('Please fill in required customer details.');
                      return;
                    }
                  } else if (!selectedCustomer) {
                    setError('Please select a customer first.');
                    return;
                  }
                  setError(null);
                  setCurrentStep('items');
                } else if (currentStep === 'items') {
                  setCurrentStep('loan');
                } else if (currentStep === 'loan') {
                  if (cart.length === 0 && cashLoanAmount <= 0) {
                    setError('Please add at least one item or a cash loan.');
                    return;
                  }
                  setError(null);
                  setCurrentStep('summary');
                }
              }}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:bg-indigo-400"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
              Confirm Debt
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtWizard;
