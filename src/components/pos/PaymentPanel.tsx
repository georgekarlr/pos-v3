import React, { useMemo } from 'react'
import { Plus, Trash2, Award, CreditCard, User } from 'lucide-react'
import { PaymentInput } from '../../types/pos'
import CustomerSearch from './CustomerSearch'

interface PaymentPanelProps {
    // --- Totals ---
    total: number
    subtotal: number
    tax: number
    // --- Payments ---
    payments: PaymentInput[]
    onAddPayment: () => void
    onUpdatePayment: (index: number, patch: Partial<PaymentInput>) => void
    onRemovePayment: (index: number) => void
    // --- Notes ---
    notes: string
    onNotesChange: (notes: string) => void
    // --- Submit ---
    onSubmit: (totalPaid: number) => void
    submitting?: boolean
    disabled?: boolean
    // --- SC/PWD Discount ---
    isScPwdDiscount: boolean
    onScPwdToggle: (val: boolean) => void
    scPwdDiscountAmount: number
    scPwdIdNumber: string
    onScPwdIdNumberChange: (val: string) => void
    scPwdName: string
    onScPwdNameChange: (val: string) => void
    // --- Regular Discount ---
    regularDiscount: string | number
    onRegularDiscountChange: (val: string) => void
    // --- Customer (for loyalty) ---
    customerId: number | null
    onCustomerIdChange: (id: number | null) => void
    // --- Loyalty Points ---
    customerLoyaltyBalance: number   // current points the customer holds
    loyaltyPointsEarned: number      // computed from total
}

const formatCurrency = (n: number) => `₱${n.toFixed(2)}`
const formatPts = (n: number) => `${n.toLocaleString()} pts`

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Mobile Pay', 'Deposit', 'Other']

const PaymentPanel: React.FC<PaymentPanelProps> = ({
    total,
    subtotal,
    tax,
    payments,
    onAddPayment,
    onUpdatePayment,
    onRemovePayment,
    notes,
    onNotesChange,
    onSubmit,
    submitting,
    disabled,
    isScPwdDiscount,
    onScPwdToggle,
    scPwdDiscountAmount,
    scPwdIdNumber,
    onScPwdIdNumberChange,
    scPwdName,
    onScPwdNameChange,
    regularDiscount,
    onRegularDiscountChange,
    customerId,
    onCustomerIdChange,
    customerLoyaltyBalance,
    loyaltyPointsEarned,
}) => {
    const { totalPaid, totalChangeDue } = useMemo(() => {
        let paid = 0
        payments.forEach(p => { paid += Number(p.amount) || 0 })
        const change = Math.max(0, paid - total)
        return { totalPaid: paid, totalChangeDue: change }
    }, [payments, total])

    const diff = total - totalPaid

    // SC/PWD BIR validation: name + ID required when discount is active
    const scPwdValid = !isScPwdDiscount || (scPwdIdNumber.trim() !== '' && scPwdName.trim() !== '')

    const canSubmit =
        !disabled &&
        (totalPaid >= total - 0.01) &&
        total > 0 &&
        payments.length > 0 &&
        !submitting &&
        scPwdValid

    const handleCashTenderedChange = (index: number, tenderedValue: string) => {
        const tendered = Number(tenderedValue) || 0
        onUpdatePayment(index, {
            tendered: tenderedValue,
            amount: tendered > 0 ? tendered.toFixed(2) : ''
        })
    }


    return (
        <div className="bg-white max-w-2xl mx-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 italic">Order Total</h3>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Amount Due</div>
                    <div className="text-xl font-bold text-gray-800">{formatCurrency(total)}</div>
                </div>
            </div>

            <div className="p-6 space-y-4">

                {/* ── Discounts & Promos ── */}
                <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Discounts &amp; Promos
                    </h4>

                    {/* SC/PWD toggle */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 select-none">
                            <input
                                type="checkbox"
                                checked={isScPwdDiscount}
                                onChange={e => onScPwdToggle(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span>SC/PWD Discount (20% &amp; VAT Exempt)</span>
                        </label>

                        {/* SC/PWD BIR Compliance fields (shown when toggle is ON) */}
                        {isScPwdDiscount && (
                            <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                <p className="col-span-full text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
                                    BIR Required — SC/PWD Information
                                </p>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        SC/PWD Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Full name of SC/PWD beneficiary"
                                        value={scPwdName}
                                        onChange={e => onScPwdNameChange(e.target.value)}
                                        className="w-full rounded-md border-amber-300 shadow-sm text-sm focus:border-amber-500 focus:ring-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        SC/PWD ID Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ID / Card number"
                                        value={scPwdIdNumber}
                                        onChange={e => onScPwdIdNumberChange(e.target.value)}
                                        className="w-full rounded-md border-amber-300 shadow-sm text-sm focus:border-amber-500 focus:ring-amber-500"
                                    />
                                </div>
                                {isScPwdDiscount && (!scPwdName.trim() || !scPwdIdNumber.trim()) && (
                                    <p className="col-span-full text-xs text-red-600 font-medium">
                                        Both fields are required for BIR compliance.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Regular discount */}
                    <div className="flex items-center gap-3">
                        <label htmlFor="regular-discount" className="text-xs font-medium text-gray-600 whitespace-nowrap">
                            Regular Discount:
                        </label>
                        <div className="relative rounded-md shadow-sm w-36">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <span className="text-gray-400 text-sm">₱</span>
                            </div>
                            <input
                                type="number"
                                id="regular-discount"
                                min="0"
                                max={(subtotal + tax - scPwdDiscountAmount).toFixed(2)}
                                step="0.01"
                                placeholder="0.00"
                                value={regularDiscount || ''}
                                onChange={e => onRegularDiscountChange(e.target.value)}
                                className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Loyalty Program ── */}
                <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-yellow-500" />
                        Loyalty Program
                    </h4>

                    {/* Customer search */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600">
                            Search Customer <span className="text-gray-400">(optional — required for loyalty)</span>
                        </label>
                        <CustomerSearch 
                            selectedCustomerId={customerId}
                            onSelectCustomer={(c) => onCustomerIdChange(c ? c.id : null)}
                        />
                    </div>

                    {customerId !== null ? (
                        <div className="space-y-3 pt-1">
                            {/* Balance display */}
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                    <CreditCard className="h-3.5 w-3.5" /> Current Balance
                                </span>
                                <span className="font-semibold text-yellow-600">{formatPts(customerLoyaltyBalance)}</span>
                            </div>

                            {/* Points to earn */}
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Points Earned (this sale)</span>
                                <span className="font-semibold text-green-600">+{formatPts(loyaltyPointsEarned)}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 italic">Select a customer above to earn or redeem loyalty points.</p>
                    )}
                </div>

                {/* ── Payment Methods ── */}
                <div className="space-y-4">
                    {payments.map((p, idx) => (
                        <div key={idx} className="bg-gray-50/70 border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex-grow pr-4">
                                    <label htmlFor={`payment-method-${idx}`} className="block text-xs font-medium text-gray-600 mb-1">Method</label>
                                    <select
                                        id={`payment-method-${idx}`}
                                        value={p.method}
                                        onChange={e => onUpdatePayment(idx, { method: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 md:w-auto"
                                    >
                                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <button
                                    onClick={() => onRemovePayment(idx)}
                                    className="mt-5 flex-shrink-0 p-2 rounded-md border border-gray-300 bg-white hover:bg-red-50"
                                    aria-label="Remove payment"
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                            </div>

                            {p.method === 'Cash' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                                    <div className="sm:col-span-6">
                                        <label htmlFor={`cash-tendered-${idx}`} className="block text-xs font-medium text-gray-600 mb-1">Cash Tendered</label>
                                        <input
                                            id={`cash-tendered-${idx}`} type="number" min="0" step="0.01" placeholder="0.00"
                                            value={p.tendered || ''}
                                            onChange={(e) => handleCashTenderedChange(idx, e.target.value)}
                                            className="w-full rounded-md border-blue-500 ring-2 ring-blue-200 shadow-sm text-lg"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor={`payment-amount-${idx}`} className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                                        <input
                                            id={`payment-amount-${idx}`} type="number" min="0" step="0.01" placeholder="0.00"
                                            value={p.amount || ''}
                                            onChange={e => onUpdatePayment(idx, { amount: e.target.value })}
                                            className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`payment-ref-${idx}`} className="block text-xs font-medium text-gray-600 mb-1">
                                            Reference <span className="text-gray-400">(Optional)</span>
                                        </label>
                                        <input
                                            id={`payment-ref-${idx}`} type="text" placeholder="e.g., last 4 digits"
                                            value={p.transaction_ref || ''}
                                            onChange={e => onUpdatePayment(idx, { transaction_ref: e.target.value })}
                                            className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    onClick={onAddPayment}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                    <Plus className="h-4 w-4" /> Add Another Payment
                </button>

                {/* ── Totals Breakdown ── */}
                <div className="pt-4 border-t-2 border-gray-100 space-y-2 text-sm">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Gross Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Tax (VAT)</span>
                        <span>{formatCurrency(tax)}</span>
                    </div>
                    {isScPwdDiscount && (
                        <div className="flex justify-between text-xs text-amber-700">
                            <span>SC/PWD Discount (20%)</span>
                            <span>-{formatCurrency(scPwdDiscountAmount)}</span>
                        </div>
                    )}
                    {Number(regularDiscount) > 0 && (
                        <div className="flex justify-between text-xs text-blue-700">
                            <span>Regular Discount</span>
                            <span>-{formatCurrency(Number(regularDiscount))}</span>
                        </div>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                    <div className="flex justify-between text-sm font-semibold text-gray-800">
                        <span>Net Amount Due</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                    <div className="border-t border-gray-100 my-1" />
                    <div className="flex justify-between">
                        <span className="text-gray-600">Total Paid</span>
                        <span className="font-medium text-gray-800">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-semibold">Remaining</span>
                        <span className={`font-semibold text-lg ${diff > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(Math.max(0, diff))}
                        </span>
                    </div>
                    {totalChangeDue > 0 && (
                        <div className="flex justify-between items-center pt-2 border-t border-dashed">
                            <span className="text-blue-600 font-semibold">Total Change Due</span>
                            <span className="font-semibold text-lg text-blue-600">{formatCurrency(totalChangeDue)}</span>
                        </div>
                    )}
                </div>

                {/* ── Notes ── */}
                <div className="space-y-1">
                    <label htmlFor="notes" className="block text-xs font-medium text-gray-600">Notes (Printed on receipt)</label>
                    <textarea
                        id="notes" rows={2} placeholder="Add special instructions or customer notes..."
                        value={notes} onChange={e => onNotesChange(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <button
                    onClick={() => onSubmit(totalPaid)}
                    disabled={!canSubmit}
                    className="w-full mt-2 inline-flex items-center justify-center px-4 py-3 rounded-md text-white font-semibold text-base transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    {submitting ? 'Processing...' : `Complete Sale (${formatCurrency(total)})`}
                </button>
            </div>
        </div>
    )
}

export default PaymentPanel