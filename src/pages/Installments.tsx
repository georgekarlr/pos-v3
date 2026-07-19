import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  AlertCircle,
  X,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useInstallments } from '../hooks/useInstallments';
import { useAllInstallmentContracts } from '../hooks/useAllInstallmentContracts';
import { InstallmentContractSummary, CreateInstallmentSaleParams } from '../types/installment';
import AllContractsList from '../components/installments/AllContractsList';
import ContractDetail from '../components/installments/ContractDetail';
import PaymentModal from '../components/installments/PaymentModal';
import CreateInstallmentModal from '../components/installments/CreateInstallmentModal';
import WriteOffModal from '../components/installments/WriteOffModal';
import DebtRecoveryModal from '../components/installments/DebtRecoveryModal';
import {PosService} from "../services/posService.ts";
import ReceiptModal from '../components/pos/ReceiptModal';
import InstallmentReceiptModal from '../components/pos/InstallmentReceiptModal';
import { ReceiptData } from '../components/pos/Receipt';
import { getCachedBusinessSettings } from '../utils/settingsCache';
import {FormatDateTime} from "../utils/formatDateTime.ts";

const Installments: React.FC = () => {
  const { persona } = useAuth();

  // --- All-contracts list (search + filter + pagination) ---
  const {
    contracts,
    loading: listLoading,
    error: listError,
    page,
    hasMore,
    searchTerm,
    statusFilter,
    load: loadAllContracts,
    nextPage,
    prevPage,
    setSearch,
    setStatusFilter,
  } = useAllInstallmentContracts({ pageSize: 20 });

  // --- Per-contract detail (schedules + actions) ---
  const {
    installments,
    selectedContract,
    loading: detailLoading,
    error: detailError,
    setSelectedContract,
    loadCustomerInstallments,
    createSale,
    paySchedule,
    writeOff,
    recoverDebt,
    clearError: clearDetailError,
  } = useInstallments();

  const [selectedSummary, setSelectedSummary] = useState<InstallmentContractSummary | null>(null);
  const [contractsOpen, setContractsOpen] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [writeOffLoading, setWriteOffLoading] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedTerminalId, setSelectedTerminalId] = useState<number | null>(null);

  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showInstallmentReceiptModal, setShowInstallmentReceiptModal] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

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

  // Initial load
  useEffect(() => {
    loadTerminals();
    if (persona?.id) loadAllContracts(persona.id);
  }, [persona?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // When a summary row is selected: load that customer's full installment detail
  // then pick the matching contract from the schedules data.
  const handleSelectSummary = async (summary: InstallmentContractSummary) => {
    setSelectedSummary(summary);
    setSelectedContract(null);
    await loadCustomerInstallments(summary.customer_id);
  };

  // After installments load, auto-select the matching contract
  useEffect(() => {
    if (!selectedSummary || !installments) return;
    const match = installments.contracts.find(
      (c) => c.contract_id === selectedSummary.contract_id
    );
    if (match) setSelectedContract(match);
  }, [installments, selectedSummary]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBackToList = () => {
    setSelectedContract(null);
    setSelectedSummary(null);
  };

  // --- Payment ---
  const handlePayConfirm = async (amount: number, method: string) => {
    if (!selectedContract || !persona?.id) return;
    if (!selectedTerminalId) {
      showToast('error', 'No active terminal detected. Please register or select an active terminal drawer.');
      return;
    }
    setPayLoading(true);
    const result = await paySchedule({
      p_requesting_account_id: persona.id,
      p_terminal_id: selectedTerminalId,
      p_contract_id: selectedContract.contract_id,
      p_payment_amount: amount,
      p_payment_method: method,
    });
    setPayLoading(false);
    setShowPayModal(false);

    if (result.data && result.data.success) {
      showToast('success', 'Payment processed successfully!');
      
      // Prepare business settings for receipt
      let businessName = 'Installment Payment Receipt';
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
          businessName = settings.business_name || businessName;
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
        console.error('Error reading cached business settings in Installments:', e);
      }
      
      // Prepare receipt data
      const newRemainingBalance = selectedContract.schedules.reduce((sum, s) => sum + (s.amount_due - s.amount_paid), 0) - result.data.data.amount_applied;
      
      const rData: ReceiptData = {
        dateISO: FormatDateTime.formatLocalTimestampForDatabase(new Date()),
        businessName,
        businessAddress1,
        tin,
        isVatRegistered,
        min,
        cashier: persona.personName,
        terminalId: selectedTerminalId,
        lines: [], // No items for simple payment
        subtotal: 0,
        tax: 0,
        total: amount,
        payments: [{ method, amount }],
        totalPaid: amount,
        change: 0,
        isInstallment: true,
        ptuIssuedBy,
        softwareProviderName,
        softwareProviderAddress,
        softwareProviderTin,
        softwareProviderAccreditationNo,
        installmentContract: {
          contractId: selectedContract.contract_id,
          invoiceNumber: selectedContract.invoice_number,
          customerName: selectedSummary?.customer_name || 'Customer',
          remainingBalance: newRemainingBalance,
          monthlyDue: selectedContract.monthly_due,
          monthsToPay: selectedContract.months_to_pay,
          totalPaid: selectedContract.schedules.reduce((sum, s) => sum + s.amount_paid, 0) + result.data.data.amount_applied
        },
        installmentPayment: {
          amountApplied: result.data.data.amount_applied,
          monthsAffected: result.data.data.months_affected.map(m => ({
            month: m.month,
            amountApplied: m.amount_applied,
            newStatus: m.new_status
          }))
        }
      }
      setReceiptData(rData);
      setShowInstallmentReceiptModal(true);

      setSelectedContract(null);
      setSelectedSummary(null);
      if (persona?.id) loadAllContracts(persona.id);
    } else if (result.error || (result.data && !result.data.success)) {
      showToast('error', result.error || result.data?.message || 'Payment failed');
    }
  };

  // --- Write-off ---
  const handleWriteOffConfirm = async (reason: string) => {
    if (!selectedContract || !persona?.id) return;
    setWriteOffLoading(true);
    const result = await writeOff({
      p_requesting_account_id: persona.id,
      p_contract_id: selectedContract.contract_id,
      p_reason: reason,
    });
    setWriteOffLoading(false);
    setShowWriteOffModal(false);

    if (result.data && result.data.success) {
      showToast('success', 'Contract successfully written off as bad debt!');
      setSelectedContract(null);
      setSelectedSummary(null);
      if (persona?.id) loadAllContracts(persona.id);
    } else {
      showToast('error', result.error || (result.data && result.data.message) || 'Write-off failed');
    }
  };

  // --- Debt recovery ---
  const handleRecoveryConfirm = async (amount: number, method: string, notes: string) => {
    if (!selectedContract || !persona?.id) return;
    if (!selectedTerminalId) {
      showToast('error', 'No active terminal detected. Please register or select an active terminal drawer.');
      return;
    }
    setRecoveryLoading(true);
    const result = await recoverDebt({
      p_requesting_account_id: persona.id,
      p_terminal_id: selectedTerminalId,
      p_contract_id: selectedContract.contract_id,
      p_recovery_amount: amount,
      p_payment_method: method,
      p_notes: notes,
    });
    setRecoveryLoading(false);
    setShowRecoveryModal(false);

    if (result.data && result.data.success) {
      showToast('success', 'Installment bad debt recovery processed successfully!');

      // Prepare business settings for receipt
      let businessName = 'Debt Recovery Receipt';
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
          businessName = settings.business_name || businessName;
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
        console.error('Error reading cached business settings in Installments:', e);
      }

      const rData: ReceiptData = {
        dateISO: FormatDateTime.formatLocalTimestampForDatabase(new Date()),
        businessName,
        businessAddress1,
        tin,
        isVatRegistered,
        min,
        cashier: persona.personName,
        terminalId: selectedTerminalId,
        lines: [],
        subtotal: 0,
        tax: 0,
        total: amount,
        payments: [{ method, amount }],
        totalPaid: amount,
        change: 0,
        isInstallment: true,
        ptuIssuedBy,
        softwareProviderName,
        softwareProviderAddress,
        softwareProviderTin,
        softwareProviderAccreditationNo,
        installmentContract: {
          contractId: selectedContract.contract_id,
          invoiceNumber: selectedContract.invoice_number,
          customerName: selectedSummary?.customer_name || 'Customer',
          remainingBalance: selectedContract.schedules.reduce((sum, s) => sum + (s.amount_due - s.amount_paid), 0) - result.data.data.amount_recovered,
          monthlyDue: selectedContract.monthly_due,
          monthsToPay: selectedContract.months_to_pay,
          totalPaid: selectedContract.schedules.reduce((sum, s) => sum + s.amount_paid, 0) + result.data.data.amount_recovered
        },
        notes: notes
      }
      setReceiptData(rData);
      setShowInstallmentReceiptModal(true);

      setSelectedContract(null);
      setSelectedSummary(null);
      if (persona?.id) loadAllContracts(persona.id);
    } else if (result.error || (result.data && !result.data.success)) {
      showToast('error', result.error || result.data?.message || 'Recovery failed');
    }
  };

  // --- Create sale ---
  const handleCreateSale = async (params: Omit<CreateInstallmentSaleParams, 'p_account_id'> & { p_cart_full?: any[] }) => {
    if (!persona?.id) return { success: false, message: 'No active persona.' };
    setCreateLoading(true);
    const result = await createSale({ ...params, p_account_id: persona.id });
    setCreateLoading(false);

    if (result.data && result.data.success) {
      setShowCreateModal(false);
      showToast('success', 'Installment contract created successfully!');

      // Prepare business settings for receipt
      let businessName = 'Installment Contract';
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
          businessName = settings.business_name || businessName;
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
        console.error('Error reading cached business settings in Installments:', e);
      }

      // Prepare receipt for the new installment sale
      const rData: ReceiptData = {
        dateISO: FormatDateTime.formatLocalTimestampForDatabase(new Date()),
        businessName,
        businessAddress1,
        tin,
        isVatRegistered,
        min,
        cashier: persona.personName,
        invoiceNumber: result.data.data?.invoice_number || 'N/A',
        lines: params.p_cart_full || [],
        subtotal: (params.p_cart_full || []).reduce((acc, l) => acc + l.lineTotal, 0),
        tax: 0, // Simplified for now
        total: (params.p_cart_full || []).reduce((acc, l) => acc + l.lineTotal, 0),
        payments: params.p_downpayment_amount > 0 ? [{ method: params.p_downpayment_method, amount: params.p_downpayment_amount }] : [],
        totalPaid: params.p_downpayment_amount,
        change: 0,
        isInstallment: true,
        ptuIssuedBy,
        softwareProviderName,
        softwareProviderAddress,
        softwareProviderTin,
        softwareProviderAccreditationNo,
        installmentContract: {
          contractId: result.data.data?.contract_id || 0,
          invoiceNumber: result.data.data?.invoice_number || 'N/A',
          customerName: selectedSummary?.customer_name || 'Customer',
          remainingBalance: ((result.data.data?.monthly_due || 0) * params.p_months_to_pay),
          monthlyDue: result.data.data?.monthly_due || 0,
          monthsToPay: params.p_months_to_pay,
          totalPaid: params.p_downpayment_amount,
          interestRate: params.p_interest_rate,
          totalInterestAmount: result.data.data?.total_interest || 0
        }
      }
      setReceiptData(rData);
      
      // Use a small delay to ensure state updates from closing the create modal have settled
      setTimeout(() => {
        setShowInstallmentReceiptModal(true);
      }, 100);

      if (persona?.id) loadAllContracts(persona.id);
      return { success: true, message: result.data.message };
    }
    return { success: false, message: result.error || result.data?.message || 'Failed to create sale' };
  };

  const accountId = persona?.id ?? 0;

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

      {/* Detail-level error banner */}
      {detailError && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p className="flex-1">{detailError}</p>
            <button onClick={clearDetailError}><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Panel — All Contracts List */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Collapsible header */}
              <button
                onClick={() => setContractsOpen((o) => !o)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Contracts
                  </h2>
                  {listLoading && <Loader2 size={13} className="animate-spin text-indigo-400" />}
                  {!listLoading && contracts.length > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                      {contracts.length}
                    </span>
                  )}
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform duration-300 ${contractsOpen ? 'rotate-180' : 'rotate-0'}`}
                />
              </button>

              {/* Collapsible body */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  contractsOpen ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-5 pb-5">
                  <AllContractsList
                    contracts={contracts}
                    selectedContractId={selectedSummary?.contract_id ?? null}
                    loading={listLoading}
                    error={listError}
                    page={page}
                    hasMore={hasMore}
                    searchTerm={searchTerm}
                    statusFilter={statusFilter}
                    onSelectContract={handleSelectSummary}
                    onSearchChange={(term) => setSearch(term, accountId)}
                    onStatusFilterChange={(status) => setStatusFilter(status, accountId)}
                    onNextPage={() => nextPage(accountId)}
                    onPrevPage={() => prevPage(accountId)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel — Contract Detail */}
          <div className="lg:col-span-8">
            {detailLoading && !selectedContract ? (
              <div className="h-full min-h-[400px] bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-indigo-400" />
              </div>
            ) : selectedContract ? (
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
                        Contract #{selectedContract.contract_id} ·{' '}
                        {new Date(selectedContract.date_purchased).toLocaleDateString('en-PH', { dateStyle: 'long' })}
                        {selectedSummary && (
                          <> · <span className="font-medium text-gray-700">{selectedSummary.customer_name}</span></>
                        )}
                      </p>
                    </div>
                  </div>

                  <ContractDetail
                    contract={selectedContract}
                    onPayClick={() => setShowPayModal(true)}
                    onWriteOffClick={() => setShowWriteOffModal(true)}
                    onRecoverClick={() => setShowRecoveryModal(true)}
                    isAdmin={persona?.type === 'admin'}
                    isLoading={payLoading || writeOffLoading || recoveryLoading}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center text-gray-400 p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <CreditCard size={28} className="opacity-40" />
                </div>
                <p className="text-base font-semibold text-gray-600">Select a contract</p>
                <p className="text-sm mt-1">Choose a contract from the list to view its schedule.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm"
                >
                  <Plus size={16} />
                  New Installment Sale
                </button>
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

      {showWriteOffModal && selectedContract && (
        <WriteOffModal
          contract={selectedContract}
          onConfirm={handleWriteOffConfirm}
          onClose={() => setShowWriteOffModal(false)}
          isLoading={writeOffLoading}
        />
      )}

      {showRecoveryModal && selectedContract && (
        <DebtRecoveryModal
          contract={selectedContract}
          onConfirm={handleRecoveryConfirm}
          onClose={() => setShowRecoveryModal(false)}
          isLoading={recoveryLoading}
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

      <ReceiptModal
        open={showReceiptModal}
        data={receiptData}
        onClose={() => setShowReceiptModal(false)}
      />

      <InstallmentReceiptModal
        open={showInstallmentReceiptModal}
        data={receiptData}
        onClose={() => setShowInstallmentReceiptModal(false)}
      />
    </div>
  );
};

export default Installments;
