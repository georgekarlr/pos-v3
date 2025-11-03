import React, { useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PaymentInput } from '../../types/pos'

interface PaymentPanelProps {
    total: number
    payments: PaymentInput[]
    // REMOVED: The currency prop is no longer needed
    // currency: string
    onAddPayment: () => void
    onUpdatePayment: (index: number, patch: Partial<PaymentInput>) => void
    onRemovePayment: (index: number) => void
    notes: string
    onNotesChange: (notes: string) => void
    onSubmit: () => void
    submitting?: boolean
    disabled?: boolean
}

// CHANGED: Reverted to a simple currency formatter for dollars
const formatAsCurrency = (n: number) => `$${n.toFixed(2)}`

const methods = ['Cash', 'Credit Card', 'Debit Card', 'Mobile Pay', 'Other']

const PaymentPanel: React.FC<PaymentPanelProps> = ({
                                                       total,
                                                       payments,
                                                       onAddPayment,
                                                       onUpdatePayment,
                                                       onRemovePayment,
                                                       notes,
                                                       onNotesChange,
                                                       onSubmit,
                                                       submitting,
                                                       disabled,
                                                   }) => {
    const { totalPaid, totalChangeDue } = useMemo(() => {
        let paid = 0
        let change = 0
        payments.forEach(p => {
            const amount = Number(p.amount) || 0
            paid += amount
            if (p.method === 'Cash') {
                const tendered = Number(p.tendered) || 0
                if (tendered > amount) {
                    change += tendered - amount
                }
            }
        })
        return { totalPaid: paid, totalChangeDue: change }
    }, [payments])

    const diff = total - totalPaid
    const canSubmit = !disabled && Math.abs(diff) < 0.01 && total > 0 && payments.length > 0 && !submitting

    const handleCashTenderedChange = (index: number, tenderedValue: string) => {
        const tendered = Number(tenderedValue) || 0
        const currentPaymentAmount = Number(payments[index].amount) || 0
        const remainingDueBeforeThisPayment = total - (totalPaid - currentPaymentAmount)
        const amountToApply = Math.min(tendered, remainingDueBeforeThisPayment)

        onUpdatePayment(index, {
            tendered: tenderedValue,
            amount: amountToApply > 0 ? amountToApply.toFixed(2) : ''
        })
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-w-2xl mx-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Payment</h3>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Amount Due</div>
                    <div className="text-xl font-bold text-gray-800">{formatAsCurrency(total)}</div>
                </div>
            </div>

            <div className="p-6 space-y-4">
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
                                        {methods.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <button onClick={() => onRemovePayment(idx)} className="mt-5 flex-shrink-0 p-2 rounded-md border border-gray-300 bg-white hover:bg-red-50" aria-label="Remove payment">
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                            </div>

                            {p.method === 'Cash' ? (
                                // CHANGED: Using a 12-column grid to give the Tendered input more space
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                                    {/* "Cash Tendered" input now takes up half the width on larger screens */}
                                    <div className="sm:col-span-6">
                                        <label htmlFor={`cash-tendered-${idx}`} className="block text-xs font-medium text-gray-600 mb-1">Cash Tendered</label>
                                        <input
                                            id={`cash-tendered-${idx}`} type="number" min="0" step="0.01" placeholder="0.00"
                                            value={p.tendered || ''}
                                            onChange={(e) => handleCashTenderedChange(idx, e.target.value)}
                                            className="w-full rounded-md border-blue-500 ring-2 ring-blue-200 shadow-sm text-lg" // text-lg makes it bigger
                                        />
                                    </div>
                                    {/* "Amount Applied" input now takes up a quarter of the width */}
                                    <div className="sm:col-span-3">
                                        <label htmlFor={`amount-applied-${idx}`} className="block text-xs font-medium text-gray-600 mb-1">Applied</label>
                                        <input
                                            id={`amount-applied-${idx}`} type="text" value={formatAsCurrency(Number(p.amount) || 0)} readOnly
                                            className="w-full rounded-md border-gray-300 shadow-sm text-sm bg-gray-100 text-gray-700"
                                        />
                                    </div>
                                    {/* "Change Due" also takes up a quarter of the width */}
                                    <div className="sm:col-span-3">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Change</label>
                                        <div className="p-2 rounded-md bg-gray-200 text-gray-800 font-medium text-sm">
                                            {formatAsCurrency(Math.max(0, (Number(p.tendered) || 0) - (Number(p.amount) || 0)))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* This part remains the same */}
                                    <div>
                                        <label htmlFor={`payment-amount-${idx}`} className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                                        <input
                                            id={`payment-amount-${idx}`} type="number" min="0" step="0.01" placeholder="0.00"
                                            value={p.amount}
                                            onChange={e => onUpdatePayment(idx, { amount: e.target.value })}
                                            className="w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`payment-ref-${idx}`} className="block text-xs font-medium text-gray-600 mb-1">Reference <span className="text-gray-400">(Optional)</span></label>
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

                <button onClick={onAddPayment} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors">
                    <Plus className="h-4 w-4" /> Add Another Payment
                </button>

                <div className="pt-4 border-t-2 border-gray-100 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Total Paid</span>
                        <span className="font-medium text-gray-800">{formatAsCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-semibold">Remaining</span>
                        <span className={`font-semibold text-lg ${diff > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
              {formatAsCurrency(Math.max(0, diff))}
            </span>
                    </div>
                    {totalChangeDue > 0 && (
                        <div className="flex justify-between items-center pt-2 border-t border-dashed">
                            <span className="text-blue-600 font-semibold">Total Change Due</span>
                            <span className="font-semibold text-lg text-blue-600">
                {formatAsCurrency(totalChangeDue)}
              </span>
                        </div>
                    )}
                </div>

                {/* ... Notes and Submit Button sections are unchanged ... */}

                <button
                    onClick={onSubmit}
                    disabled={!canSubmit}
                    className="w-full mt-2 inline-flex items-center justify-center px-4 py-3 rounded-md text-white font-semibold text-base transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    {submitting ? 'Processing...' : `Complete Sale (${formatAsCurrency(total)})`}
                </button>
            </div>
        </div>
    )
}

export default PaymentPanel