import React from 'react';
import { FileText, ChevronRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { InstallmentContract, ContractStatus } from '../../types/installment';

interface ContractListProps {
  contracts: InstallmentContract[];
  selectedContractId: number | null;
  onSelectContract: (contract: InstallmentContract) => void;
}

const statusConfig: Record<ContractStatus, { label: string; className: string; icon: React.ElementType }> = {
  active: {
    label: 'Active',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-50 text-green-700 border border-green-200',
    icon: CheckCircle2,
  },
  defaulted: {
    label: 'Defaulted',
    className: 'bg-red-50 text-red-700 border border-red-200',
    icon: AlertCircle,
  },
};

function getProgressPercent(contract: InstallmentContract): number {
  const paid = contract.schedules.filter((s) => s.status === 'paid').length;
  return Math.round((paid / contract.months_to_pay) * 100);
}

const ContractList: React.FC<ContractListProps> = ({
  contracts,
  selectedContractId,
  onSelectContract,
}) => {
  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
        <FileText size={40} className="mb-3 opacity-30" />
        <p className="text-sm font-medium">No installment contracts</p>
        <p className="text-xs mt-1">This customer has no installment history yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {contracts.map((contract) => {
        const cfg = statusConfig[contract.contract_status];
        const StatusIcon = cfg.icon;
        const progress = getProgressPercent(contract);
        const isSelected = selectedContractId === contract.contract_id;

        return (
          <button
            key={contract.contract_id}
            onClick={() => onSelectContract(contract)}
            className={`w-full text-left rounded-xl border p-4 transition-all duration-200 group
              ${isSelected
                ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wide">
                    #{contract.invoice_number}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg.className}`}>
                    <StatusIcon size={10} />
                    {cfg.label}
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-gray-900 font-mono">
                    ₱{contract.total_contract_value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-gray-500">total</span>
                </div>

                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span>₱{contract.monthly_due.toLocaleString('en-PH', { minimumFractionDigits: 2 })}/mo</span>
                  <span>{contract.months_to_pay} months</span>
                  <span>{new Date(contract.date_purchased).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>{contract.schedules.filter(s => s.status === 'paid').length} of {contract.months_to_pay} months paid</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        contract.contract_status === 'completed' ? 'bg-green-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <ChevronRight
                size={18}
                className={`flex-shrink-0 mt-1 transition-colors ${isSelected ? 'text-indigo-500' : 'text-gray-300 group-hover:text-gray-500'}`}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ContractList;
