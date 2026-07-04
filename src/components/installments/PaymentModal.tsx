import React, { useState } from 'react';
import { X, CreditCard, Loader2, CheckCircle2, AlertCircle, Banknote } from 'lucide-react';
import { InstallmentContract } from '../../types/installment';

const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Card'];

interface PaymentModalProps {
  contract: InstallmentContract;
  onConfirm: (amount: number, method: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

function getRemainingBalance(contract: InstallmentContract): number {
  return contract.schedules.reduce((sum, s) => sum + (s.amount_due - s.amount_paid), 0);
}

const PaymentModal: React.FC<PaymentModalProps> = ({ contract, onConfirm, onClose, isLoading }) => {
  const remainingBalance = getRemainingBalance(contract);
  const [amount, setAmount] = useState<string>(contract.monthly_due.toFixed(2));
  const [method, setMethod] = useState('Cash');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConfirm = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setLocalError('Please enter a valid payment amount.');
      return;
    }
    if (numAmount > remainingBalance + 0.001) {
      setLocalError(`Amount exceeds remaining balance of ₱${remainingBalance.toFixed(2)}.`);
      return;
    }
    setLocalError(null);
    await onConfirm(numAmount, method);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!isLoading ? onClose : undefined} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <CreditCard size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Make Payment</h2>
              <p className="text-xs text-gray-500">Invoice #{contract.invoice_number}</p>
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
          {/* Remaining balance banner */}
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Remaining Balance</span>
            <span className="text-xl font-bold font-mono text-indigo-700">
              ₱{remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Payment Amount
            </label>
            <div className="relative">
              <Banknote size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remainingBalance}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setLocalError(null); }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-base font-mono
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(contract.monthly_due.toFixed(2))}
                className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition"
              >
                1 Month (₱{contract.monthly_due.toFixed(2)})
              </button>
              <button
                type="button"
                onClick={() => setAmount(remainingBalance.toFixed(2))}
                className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition"
              >
                Full Balance
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Payment Method
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                    ${method === m
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                    }`}
                >
                  {m}
                </button>
              ))}
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
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300
              hover:bg-gray-50 transition disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl
              hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
