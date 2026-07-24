import React, { useEffect, useRef } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Loader2,
  User,
} from 'lucide-react';
import { InstallmentContractSummary, ContractStatus } from '../../types/installment';

// ---- Status config ----

const statusConfig: Record<ContractStatus, { label: string; className: string; dot: string; icon: React.ElementType }> = {
  active: {
    label: 'Active',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500',
    icon: Clock,
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-50 text-green-700 border border-green-200',
    dot: 'bg-green-500',
    icon: CheckCircle2,
  },
  defaulted: {
    label: 'Defaulted',
    className: 'bg-red-50 text-red-700 border border-red-200',
    dot: 'bg-red-500',
    icon: AlertCircle,
  },
};

const STATUS_TABS: { label: string; value: ContractStatus | null }[] = [
  { label: 'All', value: null },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Defaulted', value: 'defaulted' },
];

// ---- Progress helpers ----

function getProgress(contract: InstallmentContractSummary): number {
  const total = contract.financed_amount + contract.total_interest_amount;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((contract.total_paid / total) * 100));
}

// ---- Props ----

interface AllContractsListProps {
  contracts: InstallmentContractSummary[];
  selectedContractId: number | null;
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  searchTerm: string;
  statusFilter: ContractStatus | null;
  onSelectContract: (contract: InstallmentContractSummary) => void;
  onSearchChange: (term: string) => void;
  onStatusFilterChange: (status: ContractStatus | null) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

// ---- Component ----

const AllContractsList: React.FC<AllContractsListProps> = ({
  contracts,
  selectedContractId,
  loading,
  error,
  page,
  hasMore,
  searchTerm,
  statusFilter,
  onSelectContract,
  onSearchChange,
  onStatusFilterChange,
  onNextPage,
  onPrevPage,
}) => {
  const searchRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => onSearchChange(val), 350);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={searchRef}
          type="text"
          defaultValue={searchTerm}
          onChange={handleSearchInput}
          placeholder="Search customer or invoice…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => onStatusFilterChange(tab.value)}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all
              ${statusFilter === tab.value
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-indigo-400" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <FileText size={36} className="mb-3 opacity-25" />
            <p className="text-sm font-medium">No contracts found</p>
            <p className="text-xs mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contracts.map((contract) => {
              const cfg = statusConfig[contract.status];
              const StatusIcon = cfg.icon;
              const progress = getProgress(contract);
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Invoice + status badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-bold text-gray-500 uppercase tracking-wide truncate">
                          #{contract.invoice_number}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${cfg.className}`}>
                          <StatusIcon size={9} />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Customer name */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <User size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {contract.customer_name}
                        </span>
                      </div>

                      {/* Financials */}
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-base font-bold text-gray-900 font-mono">
                          ₱{contract.remaining_balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-gray-400">remaining</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        <span>₱{contract.monthly_due.toLocaleString('en-PH', { minimumFractionDigits: 2 })}/mo</span>
                        <span>{contract.months_to_pay} mos</span>
                        <span>{new Date(contract.date_created).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>₱{contract.total_paid.toLocaleString('en-PH', { minimumFractionDigits: 2 })} paid</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${contract.status === 'completed'
                                ? 'bg-green-500'
                                : contract.status === 'defaulted'
                                  ? 'bg-red-500'
                                  : 'bg-indigo-500'
                              }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <ChevronRightIcon
                      size={16}
                      className={`flex-shrink-0 mt-1 transition-colors ${isSelected ? 'text-indigo-500' : 'text-gray-300 group-hover:text-gray-500'}`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {(page > 0 || hasMore) && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onPrevPage}
            disabled={page === 0 || loading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600
              border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={14} />
            Prev
          </button>
          <span className="text-xs text-gray-400">Page {page + 1}</span>
          <button
            onClick={onNextPage}
            disabled={!hasMore || loading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600
              border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
            <ChevronRightIcon size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AllContractsList;
