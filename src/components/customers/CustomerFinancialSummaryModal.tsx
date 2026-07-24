import React from 'react';
import {
    X,
    Loader2,
    TrendingUp,
    CreditCard,
    ShoppingBag,
    AlertCircle,
    CheckCircle2,
    Calendar,
    DollarSign,
} from 'lucide-react';
import { CustomerFinancialSummary, CustomerActiveInstallment } from '../../types/customer';

// ---- Sub-components ----

interface SummaryStatProps {
    label: string;
    value: string;
    highlight?: boolean;
    danger?: boolean;
}
const SummaryStat: React.FC<SummaryStatProps> = ({ label, value, highlight, danger }) => (
    <div className={`flex flex-col gap-0.5 px-4 py-3 rounded-xl border ${danger
            ? 'bg-red-50 border-red-200'
            : highlight
                ? 'bg-indigo-50 border-indigo-200'
                : 'bg-gray-50 border-gray-200'
        }`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${danger ? 'text-red-500' : highlight ? 'text-indigo-500' : 'text-gray-400'
            }`}>{label}</span>
        <span className={`font-mono text-xl font-extrabold leading-tight ${danger ? 'text-red-700' : highlight ? 'text-indigo-700' : 'text-gray-800'
            }`}>{value}</span>
    </div>
);

interface UnsettledItemRowProps {
    name: string;
    qty: number;
    price: number;
    date: string;
}
const UnsettledItemRow: React.FC<UnsettledItemRowProps> = ({ name, qty, price, date }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <div>
            <p className="text-sm font-medium text-gray-800">{name}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <Calendar size={10} />
                {new Date(date).toLocaleDateString()}
                <span className="ml-1">× {qty}</span>
            </p>
        </div>
        <span className="font-mono text-sm font-bold text-red-600">
            +{(price * qty).toFixed(2)}
        </span>
    </div>
);

interface InstallmentCardProps {
    contract: CustomerActiveInstallment;
}
const InstallmentCard: React.FC<InstallmentCardProps> = ({ contract }) => {
    const paidAmount = contract.total_financed - contract.remaining_balance;
    const paidMonths = contract.monthly_due > 0
        ? Math.round(paidAmount / contract.monthly_due)
        : 0;
    const progressPct = Math.min(100, Math.round((paidMonths / contract.months_to_pay) * 100));

    return (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div>
                    <p className="text-xs font-bold text-gray-800">
                        Invoice #{contract.invoice_number}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={9} />
                        {new Date(contract.date_purchased).toLocaleDateString()}
                    </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase">
                    {contract.status}
                </span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-100 text-center py-3">
                <div className="px-2">
                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Financed</p>
                    <p className="font-mono font-bold text-gray-800 text-sm">
                        {contract.total_financed.toFixed(2)}
                    </p>
                </div>
                <div className="px-2">
                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Monthly</p>
                    <p className="font-mono font-bold text-gray-800 text-sm">
                        {contract.monthly_due.toFixed(2)}
                    </p>
                </div>
                <div className="px-2">
                    <p className="text-[9px] uppercase font-bold text-red-400 mb-0.5">Remaining</p>
                    <p className="font-mono font-bold text-red-600 text-sm">
                        {contract.remaining_balance.toFixed(2)}
                    </p>
                </div>
            </div>
            {/* Progress bar */}
            <div className="px-4 pb-3">
                <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                    <span>{paidMonths} of {contract.months_to_pay} months paid</span>
                    <span>{progressPct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                        className="bg-indigo-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

// ---- Main Modal ----

interface CustomerFinancialSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: CustomerFinancialSummary | null;
    isLoading: boolean;
}

const CustomerFinancialSummaryModal: React.FC<CustomerFinancialSummaryModalProps> = ({
    isOpen,
    onClose,
    summary,
    isLoading,
}) => {
    if (!isOpen) return null;

    const debt = summary?.running_tab_debt;
    const installments = summary?.active_installments ?? [];
    const hasDebt = (debt?.current_balance ?? 0) > 0;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative flex min-h-full items-start justify-center p-4 sm:p-8">
                <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

                    {/* Header */}
                    <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
                        <div>
                            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                                <TrendingUp size={20} className="text-indigo-500" />
                                Financial Overview
                            </h2>
                            {summary && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {summary.customer.full_name}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Loader2 size={32} className="animate-spin text-indigo-500" />
                                <p className="text-sm text-gray-500 font-medium">
                                    Loading financial summary...
                                </p>
                            </div>
                        ) : summary ? (
                            <>
                                {/* Grand Total */}
                                <div className={`flex items-center justify-between p-4 rounded-2xl border-2 ${summary.total_outstanding_amount > 0
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-green-50 border-green-200'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${summary.total_outstanding_amount > 0
                                                ? 'bg-red-100'
                                                : 'bg-green-100'
                                            }`}>
                                            {summary.total_outstanding_amount > 0
                                                ? <AlertCircle size={20} className="text-red-600" />
                                                : <CheckCircle2 size={20} className="text-green-600" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                                Total Outstanding
                                            </p>
                                            <p className={`font-mono text-2xl font-extrabold leading-tight ${summary.total_outstanding_amount > 0
                                                    ? 'text-red-700'
                                                    : 'text-green-700'
                                                }`}>
                                                &#8369;{summary.total_outstanding_amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 text-right max-w-[120px]">
                                        {summary.total_outstanding_amount > 0
                                            ? 'Running tab + all active installments'
                                            : 'No outstanding balance'}
                                    </p>
                                </div>

                                {/* Running Tab Debt */}
                                <section>
                                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                                        <DollarSign size={15} className="text-orange-500" />
                                        Running Tab
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <SummaryStat
                                            label="Current Balance"
                                            value={`${(debt?.current_balance ?? 0).toFixed(2)}`}
                                            danger={hasDebt}
                                            highlight={!hasDebt && (debt?.current_balance ?? 0) < 0}
                                        />
                                        <SummaryStat
                                            label="Credit Limit"
                                            value={`${(debt?.credit_limit ?? 0).toFixed(2)}`}
                                        />
                                    </div>

                                    {/* Unsettled Items */}
                                    {(debt?.unsettled_items?.length ?? 0) > 0 ? (
                                        <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 mb-2 flex items-center gap-1">
                                                <ShoppingBag size={10} />
                                                Unsettled Items
                                            </p>
                                            {debt!.unsettled_items.map((item, i) => (
                                                <UnsettledItemRow
                                                    key={i}
                                                    name={item.product_name}
                                                    qty={item.quantity}
                                                    price={item.price}
                                                    date={item.date}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 py-2 text-center border border-dashed border-gray-200 rounded-xl">
                                            No unsettled items on running tab
                                        </p>
                                    )}
                                </section>

                                {/* Active Installments */}
                                <section>
                                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                                        <CreditCard size={15} className="text-indigo-500" />
                                        Active Installments
                                        {installments.length > 0 && (
                                            <span className="ml-auto text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                                {installments.length}
                                            </span>
                                        )}
                                    </h3>
                                    {installments.length > 0 ? (
                                        <div className="space-y-3">
                                            {installments.map((contract) => (
                                                <InstallmentCard
                                                    key={contract.contract_id}
                                                    contract={contract}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 py-2 text-center border border-dashed border-gray-200 rounded-xl">
                                            No active installment contracts
                                        </p>
                                    )}
                                </section>
                            </>
                        ) : (
                            <div className="py-16 text-center text-red-500 text-sm">
                                Failed to load financial summary.
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerFinancialSummaryModal;
