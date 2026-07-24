import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  MinusCircle,
  CreditCard,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import { InstallmentContract, InstallmentSchedule, ScheduleStatus } from '../../types/installment';

interface ContractDetailProps {
  contract: InstallmentContract;
  onPayClick: () => void;
  onWriteOffClick: () => void;
  onRecoverClick: () => void;
  isAdmin?: boolean;
  isLoading?: boolean;
}

const scheduleStatusConfig: Record<ScheduleStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-600',
    icon: Clock,
  },
  partial: {
    label: 'Partial',
    className: 'bg-amber-50 text-amber-700',
    icon: MinusCircle,
  },
  paid: {
    label: 'Paid',
    className: 'bg-green-50 text-green-700',
    icon: CheckCircle2,
  },
  late: {
    label: 'Late',
    className: 'bg-red-50 text-red-700',
    icon: AlertCircle,
  },
  defaulted: {
    label: 'Defaulted',
    className: 'bg-rose-50 text-rose-700 border border-rose-100',
    icon: AlertTriangle,
  },
};

function getRemainingBalance(contract: InstallmentContract): number {
  return contract.schedules.reduce((sum, s) => sum + (s.amount_due - s.amount_paid), 0);
}

function ScheduleRow({ schedule }: { schedule: InstallmentSchedule }) {
  const cfg = scheduleStatusConfig[schedule.status];
  const StatusIcon = cfg.icon;
  const remaining = schedule.amount_due - schedule.amount_paid;

  return (
    <tr className={`border-b border-gray-100 transition-colors ${schedule.status === 'late' ? 'bg-red-50/40' : 'hover:bg-gray-50'}`}>
      <td className="py-3 px-4 text-sm font-semibold text-gray-700">
        Month {schedule.month_number}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-gray-400" />
          {new Date(schedule.due_date).toLocaleDateString('en-PH', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </div>
      </td>
      <td className="py-3 px-4 text-sm font-mono text-right text-gray-800">
        ₱{schedule.amount_due.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
      </td>
      <td className="py-3 px-4 text-sm font-mono text-right text-green-700">
        ₱{schedule.amount_paid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
      </td>
      <td className="py-3 px-4 text-sm font-mono text-right text-red-600">
        {remaining > 0 ? `₱${remaining.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'}
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg.className}`}>
          <StatusIcon size={10} />
          {cfg.label}
        </span>
      </td>
    </tr>
  );
}

const ContractDetail: React.FC<ContractDetailProps> = ({
  contract,
  onPayClick,
  onWriteOffClick,
  onRecoverClick,
  isAdmin = false,
  isLoading,
}) => {
  const remainingBalance = getRemainingBalance(contract);
  const isCompleted = contract.contract_status === 'completed';
  const isDefaulted = contract.contract_status === 'defaulted';

  return (
    <div className="flex flex-col gap-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Total Value</p>
          <p className="text-lg font-bold font-mono text-gray-900">
            ₱{contract.total_contract_value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Downpayment</p>
          <p className="text-lg font-bold font-mono text-indigo-600">
            ₱{contract.downpayment_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Monthly Due</p>
          <p className="text-lg font-bold font-mono text-gray-900">
            ₱{contract.monthly_due.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`rounded-xl p-4 border ${isCompleted
            ? 'bg-green-50 border-green-200 text-green-700'
            : isDefaulted
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}>
          <p className={`text-xs uppercase tracking-wide font-semibold mb-1 ${isCompleted
              ? 'text-green-600'
              : isDefaulted
                ? 'text-rose-600'
                : 'text-indigo-600'
            }`}>
            {isCompleted ? 'Fully Paid' : isDefaulted ? 'Defaulted Balance' : 'Active Balance'}
          </p>
          <p className="text-lg font-bold font-mono">
            {isCompleted
              ? '✓ Complete'
              : `₱${remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
          </p>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-indigo-500" />
            <h3 className="font-semibold text-gray-800 text-sm">Payment Schedule</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Standard payment: only for Active contracts */}
            {contract.contract_status === 'active' && (
              <button
                onClick={onPayClick}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg
                  hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200 disabled:opacity-50"
              >
                <CreditCard size={15} />
                Make Payment
              </button>
            )}

            {/* Write-off: only for Active contracts and Admin users */}
            {contract.contract_status === 'active' && isAdmin && remainingBalance > 0 && (
              <button
                onClick={onWriteOffClick}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 border border-red-200 text-sm font-semibold rounded-lg
                  hover:bg-red-50 active:scale-95 transition-all disabled:opacity-50"
                title="Write off remaining balance as bad debt"
              >
                <AlertTriangle size={15} className="text-red-500" />
                Write Off
              </button>
            )}

            {/* Recovery: only for Defaulted contracts and Admin users */}
            {contract.contract_status === 'defaulted' && isAdmin && remainingBalance > 0 && (
              <button
                onClick={onRecoverClick}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg
                  hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-200 disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                Recover Bad Debt
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100 bg-gray-50">
                <th className="py-2.5 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Month</th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Due Date</th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wide text-right">Due</th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wide text-right">Paid</th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wide text-right">Remaining</th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {contract.schedules.map((schedule) => (
                <ScheduleRow key={schedule.schedule_id} schedule={schedule} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContractDetail;
