import React, { useState } from 'react';
import { X, CheckCircle2, Loader2, AlertCircle, Banknote, FileText } from 'lucide-react';
import { InstallmentContract } from '../../types/installment';

const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Card'];

interface DebtRecoveryModalProps {
  contract: InstallmentContract;
  onConfirm: (amount: number, method: string, notes: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

function getRemainingBalance(contract: InstallmentContract): number {
  return contract.schedules.reduce((sum, s) => sum + (s.amount_due - s.amount_paid), 0);
}

const DebtRecoveryModal: React.FC<DebtRecoveryModalProps> = ({
  contract,
  onConfirm,
  onClose,
  isLoading,
}) => {
  const remainingBalance = getRemainingBalance(contract);
  const [amount, setAmount] = useState<string>(remainingBalance.toFixed(2));
  const [method, setMethod] = useState('Cash');
  const [notes, setNotes] = useState('Recovered Bad Debt');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConfirm = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setLocalError('Please enter a valid recovery amount.');
      return;
    }
    if (numAmount > remainingBalance + 0.001) {
      setLocalError(`Recovery amount exceeds remaining defaulted balance of ₱${remainingBalance.toFixed(2)}.`);
      return;
    }
    setLocalError(null);
    await onConfirm(numAmount, method, notes.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Process Debt Recovery</h2>
              <p className="text-xs text-gray-500">Invoice #{contract.invoice_number} (Defaulted)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Recovery Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 size={15} />
              Debt Recovery Payment
            </p>
            <p className="text-xs leading-relaxed text-emerald-700">
              Use this form to record cash or digital payments recovered from a previously written-off debt. The payment will be posted to the cash drawer and logged under E-Journal audit events.
            </p>
          </div>

          {/* Remaining balance display */}
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Defaulted Debt</span>
            <span className="text-lg font-bold font-mono text-emerald-700">
              ₱{remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Recovery Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Banknote size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remainingBalance}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setLocalError(null);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-base font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(remainingBalance.toFixed(2))}
                className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition"
                disabled={isLoading}
              >
                Full Balance
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                    ${method === m
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-300'
                    }`}
                  disabled={isLoading}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Recovery Notes / Audit Details
            </label>
            <div className="relative">
              <FileText size={18} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                placeholder="E.g., Partial cash recovery from customer settlement."
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Error */}
          {localError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
              <AlertCircle size={15} className="flex-shrink-0" />
              {localError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm shadow-emerald-200 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Confirm Recovery
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebtRecoveryModal;
