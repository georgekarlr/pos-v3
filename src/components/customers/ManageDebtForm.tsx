import React, { useState, useEffect } from 'react';
import {
  Banknote,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Sparkles
} from 'lucide-react';

export type DebtActionType = 'PAYMENT' | 'DEPOSIT' | 'WITHDRAW_DEPOSIT' | 'SETTLE' | 'WRITE_OFF' | 'RECOVER_DEBT';

export interface ManageDebtFormProps {
  currentBalance: number;
  isAdmin: boolean;
  submitting: boolean;
  onSubmit: (params: {
    actionType: DebtActionType;
    amount: number;
    paymentMethod: string;
    notes: string;
  }) => void;
  onCancel: () => void;
}

export const ManageDebtForm: React.FC<ManageDebtFormProps> = ({
  currentBalance,
  isAdmin,
  submitting,
  onSubmit,
  onCancel
}) => {
  const [actionType, setActionType] = useState<DebtActionType>('PAYMENT');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Run validation checks when actionType, amount, or currentBalance changes
  useEffect(() => {
    setValidationError(null);

    if (actionType === 'WITHDRAW_DEPOSIT') {
      if (currentBalance >= 0) {
        setValidationError('Customer has no deposit credit to withdraw.');
      } else {
        const amt = parseFloat(amount);
        const maxWithdraw = Math.abs(currentBalance);
        if (amt && amt > maxWithdraw) {
          setValidationError(`Cannot withdraw more than the deposit of ${maxWithdraw.toFixed(2)}.`);
        }
      }
    } else if (actionType === 'SETTLE') {
      if (currentBalance > 0.01) {
        setValidationError(`Account is not fully paid. Balance is ${currentBalance.toFixed(2)} (must be ≤ 0.01).`);
      }
    } else if (actionType === 'WRITE_OFF') {
      if (currentBalance <= 0) {
        setValidationError('Account has no outstanding debt to write off.');
      }
    }
  }, [actionType, amount, currentBalance]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;

    // Check admin restrictions (just in case)
    const isAdminAction = ['SETTLE', 'WRITE_OFF', 'RECOVER_DEBT'].includes(actionType);
    if (isAdminAction && !isAdmin) {
      setValidationError('This action is restricted to administrators.');
      return;
    }

    const needsAmount = !['SETTLE', 'WRITE_OFF'].includes(actionType);
    const parsedAmount = needsAmount ? parseFloat(amount) : 0;

    if (needsAmount && (isNaN(parsedAmount) || parsedAmount <= 0)) {
      setValidationError('Amount must be greater than zero.');
      return;
    }

    onSubmit({
      actionType,
      amount: parsedAmount,
      paymentMethod,
      notes
    });
  };

  const actionDetails: Record<DebtActionType, { label: string; description: string; color: string; isAdminOnly: boolean }> = {
    PAYMENT: {
      label: 'Payment',
      description: 'Receive cash from customer to pay down their outstanding balance.',
      color: 'bg-green-50 text-green-700 border-green-200',
      isAdminOnly: false
    },
    DEPOSIT: {
      label: 'Deposit',
      description: 'Accept advance payment from customer, resulting in account credit.',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      isAdminOnly: false
    },
    WITHDRAW_DEPOSIT: {
      label: 'Withdraw Deposit',
      description: 'Withdraw existing credit/deposit back to the customer.',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      isAdminOnly: false
    },
    SETTLE: {
      label: 'Settle Account',
      description: 'Consolidate paid debt ledger items into a formal POS transaction. Requires balance ≤ 0.01.',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      isAdminOnly: true
    },
    WRITE_OFF: {
      label: 'Write Off Debt',
      description: 'Mark outstanding debt as uncollectible Bad Debt. Balance becomes 0.00.',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      isAdminOnly: true
    },
    RECOVER_DEBT: {
      label: 'Recover Bad Debt',
      description: 'Accept recovery cash for a previously written-off debt.',
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      isAdminOnly: true
    }
  };

  const currentActionInfo = actionDetails[actionType];
  const requiresAmount = !['SETTLE', 'WRITE_OFF'].includes(actionType);

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner animate-in slide-in-from-top duration-300">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Banknote size={22} className="text-indigo-600" />
          Manage Customer Account
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Action Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Select Action
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(Object.keys(actionDetails) as DebtActionType[]).map((type) => {
              const info = actionDetails[type];
              const isDisabled = info.isAdminOnly && !isAdmin;

              return (
                <button
                  key={type}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    setActionType(type);
                    setAmount('');
                  }}
                  className={`relative py-3 px-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-20 ${actionType === type
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : isDisabled
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                    }`}
                >
                  <span className="text-xs font-bold leading-snug">{info.label}</span>
                  <div className="flex items-center justify-between w-full mt-1">
                    {info.isAdminOnly && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${actionType === type ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                      >
                        <ShieldCheck size={10} />
                        Admin Only
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Explanation Alert */}
        <div className={`p-4 rounded-xl border flex gap-3 text-sm items-start ${currentActionInfo.color}`}>
          <Sparkles size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{currentActionInfo.label}</p>
            <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
              {currentActionInfo.description}
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {requiresAmount ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    disabled={submitting}
                    className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Payment Method
                </label>
                <select
                  disabled={submitting}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
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
            <div className="md:col-span-2 p-4 bg-slate-100 border border-slate-200 rounded-xl flex items-center h-[74px]">
              <CheckCircle2 size={20} className="text-indigo-600 mr-2 flex-shrink-0" />
              <div className="text-xs text-slate-600 leading-tight">
                {actionType === 'SETTLE' ? (
                  <p>
                    All paid debt transactions will be converted into a new POS sale. The current balance is{' '}
                    <span className="font-mono font-bold text-slate-800">${currentBalance.toFixed(2)}</span>.
                  </p>
                ) : (
                  <p>
                    The outstanding balance of{' '}
                    <span className="font-mono font-bold text-rose-600">${currentBalance.toFixed(2)}</span> will be written off
                    as uncollectible.
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Action
            </label>
            <button
              type="submit"
              disabled={submitting || !!validationError}
              className={`w-full py-2.5 rounded-xl font-bold text-sm text-white flex justify-center items-center gap-2 shadow-sm transition-all duration-200 ${validationError
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : actionType === 'WRITE_OFF'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : actionType === 'WRITE_OFF' ? (
                <>
                  <Trash2 size={16} />
                  Write Off
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Confirm
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Notes / Reference (Optional)
          </label>
          <input
            type="text"
            disabled={submitting}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder={
              actionType === 'WRITE_OFF'
                ? 'Reason for bad debt write-off...'
                : 'Add reference or payment notes...'
            }
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Inline Validation Warning */}
        {validationError && (
          <div className="p-3.5 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs rounded-r-xl flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="font-medium">{validationError}</span>
          </div>
        )}
      </form>
    </div>
  );
};
