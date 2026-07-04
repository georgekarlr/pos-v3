import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  AlertCircle,
  X,
  CheckCircle2,
  FileText,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useInstallments } from '../hooks/useInstallments';
import { CustomerSearchResult } from '../types/debt';
import { InstallmentContract, CreateInstallmentSaleParams } from '../types/installment';
import CustomerSearchPanel from '../components/installments/CustomerSearchPanel';
import ContractList from '../components/installments/ContractList';
import ContractDetail from '../components/installments/ContractDetail';
import PaymentModal from '../components/installments/PaymentModal';
import CreateInstallmentModal from '../components/installments/CreateInstallmentModal';

const Installments: React.FC = () => {
  const { persona } = useAuth();
  const {
    installments,
    selectedContract,
    loading,
    error,
    setSelectedContract,
    loadCustomerInstallments,
    createSale,
    paySchedule,
    clearError,
    reset,
  } = useInstallments();

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectCustomer = async (customer: CustomerSearchResult) => {
    setSelectedCustomer(customer);
    reset();
    await loadCustomerInstallments(customer.customer_id);
  };

  const handleSelectContract = (contract: InstallmentContract) => {
    setSelectedContract(contract);
  };

  const handleBackToList = () => {
    setSelectedContract(null);
  };

  const handlePayConfirm = async (amount: number, method: string) => {
    if (!selectedContract || !persona?.id) return;
    setPayLoading(true);
    const result = await paySchedule({
      p_requesting_account_id: persona.id,
      p_contract_id: selectedContract.contract_id,
      p_payment_amount: amount,
      p_payment_method: method,
    });
    setPayLoading(false);
    setShowPayModal(false);

    if (result.success) {
      showToast('success', 'Payment processed successfully!');
      // Refresh selected contract from updated installments
      setSelectedContract(null);
    } else {
      showToast('error', result.message);
    }
  };

  const handleCreateSale = async (params: Omit<CreateInstallmentSaleParams, 'p_account_id'>) => {
    if (!persona?.id) return { success: false, message: 'No active persona.' };
    setCreateLoading(true);
    const result = await createSale({ ...params, p_account_id: persona.id });
    setCreateLoading(false);

    if (result.success) {
      setShowCreateModal(false);
      showToast('success', 'Installment contract created successfully!');
      // Refresh customer data if one is loaded
      if (selectedCustomer) await loadCustomerInstallments(selectedCustomer.customer_id);
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold
          transition-all duration-300 animate-in slide-in-from-top-2
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Installments</h1>
              <p className="text-sm text-gray-500">Manage installment contracts and collect payments</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl
              hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200"
          >
            <Plus size={18} />
            New Installment Sale
          </button>
        </div>
      </div>

      {/* Global Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p className="flex-1">{error}</p>
            <button onClick={clearError}><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Panel — Customer Search & Contract List */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Search Customer</h2>
              <CustomerSearchPanel
                onSelectCustomer={handleSelectCustomer}
                selectedCustomerId={selectedCustomer?.customer_id ?? null}
              />
            </div>

            {selectedCustomer && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Contracts
                  </h2>
                  {loading && <Loader2 size={16} className="animate-spin text-indigo-500" />}
                </div>

                {loading && !installments ? (
                  <div className="py-12 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-indigo-400" />
                  </div>
                ) : (
                  <ContractList
                    contracts={installments?.contracts || []}
                    selectedContractId={selectedContract?.contract_id ?? null}
                    onSelectContract={handleSelectContract}
                  />
                )}
              </div>
            )}

            {!selectedCustomer && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center text-center text-gray-400">
                <FileText size={40} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">Search for a customer above</p>
                <p className="text-xs mt-1">Their installment contracts will appear here</p>
              </div>
            )}
          </div>

          {/* Right Panel — Contract Detail */}
          <div className="lg:col-span-8">
            {selectedContract ? (
              <div className="space-y-4">
                {/* Back button on mobile */}
                <button
                  onClick={handleBackToList}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-semibold lg:hidden"
                >
                  <ArrowLeft size={16} />
                  Back to contracts
                </button>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="font-bold text-gray-900">Invoice #{selectedContract.invoice_number}</h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Contract #{selectedContract.contract_id} · {new Date(selectedContract.date_purchased).toLocaleDateString('en-PH', { dateStyle: 'long' })}
                      </p>
                    </div>
                  </div>

                  <ContractDetail
                    contract={selectedContract}
                    onPayClick={() => setShowPayModal(true)}
                    isLoading={payLoading}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center text-gray-400 p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <CreditCard size={28} className="opacity-40" />
                </div>
                <p className="text-base font-semibold text-gray-600">Select a contract</p>
                <p className="text-sm mt-1">
                  {selectedCustomer
                    ? 'Choose a contract from the left to view its schedule.'
                    : 'Search for a customer to get started.'}
                </p>
                {!selectedCustomer && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm"
                  >
                    <Plus size={16} />
                    New Installment Sale
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPayModal && selectedContract && (
        <PaymentModal
          contract={selectedContract}
          onConfirm={handlePayConfirm}
          onClose={() => setShowPayModal(false)}
          isLoading={payLoading}
        />
      )}

      {showCreateModal && persona?.id && (
        <CreateInstallmentModal
          accountId={persona.id}
          onConfirm={handleCreateSale}
          onClose={() => setShowCreateModal(false)}
          isLoading={createLoading}
        />
      )}
    </div>
  );
};

export default Installments;
