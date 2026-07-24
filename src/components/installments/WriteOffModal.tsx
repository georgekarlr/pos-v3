import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { InstallmentContract } from '../../types/installment';

interface WriteOffModalProps {
  contract: InstallmentContract;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

function getRemainingBalance(contract: InstallmentContract): number {
  return contract.schedules.reduce((sum, s) => sum + (s.amount_due - s.amount_paid), 0);
}

const WriteOffModal: React.FC<WriteOffModalProps> = ({
  contract,
  onConfirm,
  onClose,
  isLoading,
}) => {
  const remainingBalance = getRemainingBalance(contract);
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setLocalError('Please enter a reason for the write-off.');
      return;
    }
    setLocalError(null);
    await onConfirm(reason.trim());
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
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Write Off Contract</h2>
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
          {/* Warning Banner */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle size={15} />
              Warning: High-Risk Action
            </p>
            <p className="text-xs leading-relaxed text-red-700">
              Writing off this contract will classify the remaining balance as a bad debt. The contract status and all unpaid schedules will be set to <strong>Defaulted</strong>. This action is recorded in the E-Journal and cannot be undone.
            </p>
          </div>

          {/* Remaining Balance Summary */}
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Remaining Balance to Write Off</span>
            <span className="text-lg font-bold font-mono text-red-700">
              ₱{remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Reason for Write-Off <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setLocalError(null);
              }}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              placeholder="Provide a detailed explanation for the accountant (e.g., customer relocated, uncontactable for 90 days)."
              disabled={isLoading}
            />
          </div>

          {/* Error */}
          {localError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
              <AlertTriangle size={15} className="flex-shrink-0" />
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
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition shadow-sm shadow-red-200 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Confirm Write-Off
          </button>
        </div>
      </div>
    </div>
  );
};

export default WriteOffModal;
