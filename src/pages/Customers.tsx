import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DebtService } from '../services/debtService';
import { CustomerListItem, CustomerDebtDetails } from '../types/debt';
import { 
  Users, 
  Search, 
  Loader2, 
  Phone, 
  Mail, 
  MapPin, 
  Wallet,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreVertical,
  Banknote,
  RotateCcw,
  CheckCircle2,
  X,
  AlertCircle,
  Eye,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Customers: React.FC = () => {
  const { persona } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  // Management State
  const [actionType, setActionType] = useState<'PAYMENT' | 'DEPOSIT' | 'SETTLE'>('PAYMENT');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal State
  const [detailsCustomer, setDetailsCustomer] = useState<CustomerListItem | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDebtDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedSettled, setExpandedSettled] = useState<number | null>(null);
  const [showManageForm, setShowManageForm] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await DebtService.getCustomers({
      limit,
      offset: page * limit,
      searchTerm: searchTerm || undefined
    });

    if (error) {
      setError(error);
    } else if (data) {
      setCustomers(data);
    }
    setLoading(false);
  };

  const handleManageAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailsCustomer || !persona) return;

    setSubmitting(true);
    setError(null);

    const { data, error: apiError } = await DebtService.manageDebtAccount({
      p_requesting_account_id: persona.id,
      p_customer_id: detailsCustomer.customer_id,
      p_action_type: actionType,
      p_amount: actionType === 'SETTLE' ? 0 : parseFloat(amount),
      p_payment_method: paymentMethod,
      p_notes: notes || null
    });

    if (apiError) {
      setError(apiError);
    } else if (data) {
      setSuccess(data.message);
      setAmount('');
      setNotes('');
      setShowManageForm(false);
      fetchCustomers();
      // Refresh details as well
      fetchCustomerDetails(detailsCustomer);
    }
    setSubmitting(false);
  };

  const fetchCustomerDetails = async (customer: CustomerListItem) => {
    setDetailsCustomer(customer);
    setLoadingDetails(true);
    const { data, error: apiError } = await DebtService.getCustomerDebtDetails(customer.customer_id);
    if (apiError) {
      setError(apiError);
    } else if (data) {
      setCustomerDetails(data);
    }
    setLoadingDetails(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-red-600 font-bold';
    if (balance < 0) return 'text-green-600 font-bold';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers & Debts</h1>
          <p className="text-gray-500">Manage customer balances and debt records</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search customers..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
                    <p className="mt-2 text-gray-500">Loading customers...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.customer_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3">
                          {customer.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.full_name}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin size={12} className="mr-1" />
                            {customer.address || 'No address'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Phone size={14} className="mr-2 text-gray-400" />
                        {customer.phone_number}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Mail size={14} className="mr-2 text-gray-400" />
                        {customer.email || 'No email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={`font-mono ${getBalanceColor(customer.current_balance)}`}>
                        {customer.current_balance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.current_balance > 0 ? 'bg-red-100 text-red-800' :
                        customer.current_balance < 0 ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.current_balance > 0 ? 'Debt' :
                         customer.current_balance < 0 ? 'Credit' :
                         'Settled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => fetchCustomerDetails(customer)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md transition-colors flex items-center"
                        >
                          <Eye size={14} className="mr-1" />
                          Details & Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        {detailsCustomer && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Customer Ledger Details
                      </h3>
                      <p className="text-sm text-gray-500">{detailsCustomer.full_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowManageForm(!showManageForm)}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          showManageForm 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        <Banknote size={16} className="mr-1.5" />
                        Quick Actions
                      </button>
                      <button 
                        onClick={() => {
                          setDetailsCustomer(null);
                          setCustomerDetails(null);
                          setShowManageForm(false);
                        }} 
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>

                  {loadingDetails ? (
                    <div className="py-20 text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto" />
                      <p className="mt-4 text-gray-500 font-medium">Loading history and transactions...</p>
                    </div>
                  ) : customerDetails ? (
                    <div className="space-y-8">
                      {/* Management Form (Conditional) */}
                      {showManageForm && (
                        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 animate-in slide-in-from-top duration-300">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-indigo-900 flex items-center">
                              <Banknote size={18} className="mr-2" />
                              Manage Customer Account
                            </h4>
                            <button onClick={() => setShowManageForm(false)} className="text-indigo-400 hover:text-indigo-600">
                              <X size={18} />
                            </button>
                          </div>

                          <form onSubmit={handleManageAction} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-1">
                              <label className="block text-xs font-bold text-indigo-700 uppercase mb-1">Action</label>
                              <div className="grid grid-cols-3 gap-1">
                                {['PAYMENT', 'DEPOSIT', 'SETTLE'].map((type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => setActionType(type as any)}
                                    className={`py-2 px-1 text-[10px] font-bold rounded border transition-colors ${
                                      actionType === type 
                                        ? 'bg-indigo-600 text-white border-indigo-600' 
                                        : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                                    }`}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {actionType !== 'SETTLE' ? (
                              <>
                                <div>
                                  <label className="block text-xs font-bold text-indigo-700 uppercase mb-1">Amount</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="0.01"
                                      required
                                      min="0.01"
                                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                      placeholder="0.00"
                                      value={amount}
                                      onChange={(e) => setAmount(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-indigo-700 uppercase mb-1">Method</label>
                                  <select
                                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                  >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Mobile Money">Mobile Money</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </>
                            ) : (
                              <div className="md:col-span-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
                                <AlertCircle size={16} className="text-yellow-600 mr-2 flex-shrink-0" />
                                <p className="text-[10px] text-yellow-800">Settle will convert all items to a receipt. Balance must be ≤ 0.</p>
                              </div>
                            )}

                            <div>
                              <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center"
                              >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
                              </button>
                            </div>

                            <div className="md:col-span-4">
                              <label className="block text-xs font-bold text-indigo-700 uppercase mb-1">Notes (Optional)</label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                placeholder="Add any relevant details..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                              />
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Top Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Current Balance</p>
                          <p className={`text-2xl font-mono font-bold ${getBalanceColor(customerDetails.account.current_balance)}`}>
                            {customerDetails.account.current_balance.toFixed(2)}
                          </p>
                          <p className="text-xs text-indigo-400 mt-2">
                            {customerDetails.account.current_balance > 0 ? 'Amount owed to you' : 
                             customerDetails.account.current_balance < 0 ? 'Customer credit balance' : 
                             'Account fully settled'}
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-gray-200">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contact Details</p>
                          <div className="space-y-1">
                            <p className="text-sm font-medium flex items-center text-gray-700">
                              <Phone size={14} className="mr-2 text-gray-400" /> {detailsCustomer.phone_number}
                            </p>
                            {detailsCustomer.email && (
                              <p className="text-sm font-medium flex items-center text-gray-700">
                                <Mail size={14} className="mr-2 text-gray-400" /> {detailsCustomer.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-gray-200">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Account Info</p>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">Limit: {customerDetails.account.credit_limit.toFixed(2)}</p>
                            <p className="text-sm font-medium text-gray-700">Status: 
                              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                                {customerDetails.account.status}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Unsettled Section */}
                        <div className="space-y-4">
                          <h4 className="font-bold text-gray-800 flex items-center">
                            <Clock size={18} className="mr-2 text-indigo-500" />
                            Unsettled Transactions
                          </h4>
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {customerDetails.unsettled.length === 0 ? (
                              <p className="text-sm text-gray-500 py-4 text-center border-2 border-dashed border-gray-100 rounded-lg">
                                No active/unsettled transactions.
                              </p>
                            ) : (
                              customerDetails.unsettled.map((tx) => (
                                <div key={tx.transaction_id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                        tx.type === 'ITEM_DEBT' ? 'bg-orange-100 text-orange-700' :
                                        tx.type === 'CASH_LOAN' ? 'bg-red-100 text-red-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                        {tx.type.replace('_', ' ')}
                                      </span>
                                      <p className="text-xs text-gray-400 mt-1 flex items-center">
                                        <Calendar size={10} className="mr-1" />
                                        {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    <p className={`font-mono font-bold ${
                                      tx.type.includes('DEBT') || tx.type.includes('LOAN') ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      {tx.type.includes('DEBT') || tx.type.includes('LOAN') ? '+' : '-'}{tx.amount.toFixed(2)}
                                    </p>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">{tx.description}</p>
                                  {tx.items && tx.items.length > 0 && (
                                    <div className="mt-2 border-t border-gray-50 pt-2 space-y-1">
                                      {tx.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                          <span className="text-gray-600">{item.quantity}x {item.product_name}</span>
                                          <span className="text-gray-900 font-medium">{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Settled History Section */}
                        <div className="space-y-4">
                          <h4 className="font-bold text-gray-800 flex items-center">
                            <CheckCircle2 size={18} className="mr-2 text-green-500" />
                            Settled History
                          </h4>
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {customerDetails.settled.length === 0 ? (
                              <p className="text-sm text-gray-500 py-4 text-center border-2 border-dashed border-gray-100 rounded-lg">
                                No settlement history found.
                              </p>
                            ) : (
                              customerDetails.settled.map((group) => (
                                <div key={group.settled_order_id} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                  <button 
                                    onClick={() => setExpandedSettled(expandedSettled === group.settled_order_id ? null : group.settled_order_id)}
                                    className="w-full px-3 py-3 flex justify-between items-center hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="text-left">
                                      <p className="text-xs font-bold text-gray-900">Receipt #{group.settled_order_id}</p>
                                      <p className="text-[10px] text-gray-500">{new Date(group.settled_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center">
                                      <p className="font-mono font-bold text-gray-700 mr-3">{group.total_settled_amount.toFixed(2)}</p>
                                      {expandedSettled === group.settled_order_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                  </button>
                                  {expandedSettled === group.settled_order_id && (
                                    <div className="px-3 pb-3 pt-1 border-t border-gray-200 bg-white">
                                      <div className="space-y-2 mt-2">
                                        {group.transactions.map((tx, idx) => (
                                          <div key={idx} className="flex justify-between items-center text-[11px]">
                                            <div>
                                              <span className="text-gray-900 font-medium">{tx.type}</span>
                                              <p className="text-gray-500">{tx.description}</p>
                                            </div>
                                            <span className="font-mono text-gray-700">{tx.amount.toFixed(2)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-red-500">
                      Failed to load details.
                    </div>
                  )}

                  <div className="mt-8 border-t border-gray-100 pt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setDetailsCustomer(null);
                        setCustomerDetails(null);
                        setShowManageForm(false);
                      }}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="fixed bottom-4 right-4 space-y-2 z-[60]">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 shadow-lg rounded-md flex justify-between items-center max-w-md">
              <div className="flex items-center">
                <AlertCircle className="text-red-400 mr-3" size={20} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 shadow-lg rounded-md flex justify-between items-center max-w-md">
              <div className="flex items-center">
                <CheckCircle2 className="text-green-400 mr-3" size={20} />
                <p className="text-sm text-green-700">{success}</p>
              </div>
              <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-500">
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{page + 1}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={customers.length < limit}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
