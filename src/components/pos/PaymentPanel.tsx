import React, { useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PaymentInput } from '../../types/pos'

interface PaymentPanelProps {
    total: number
    payments: PaymentInput[]
    onAddPayment: () => void
    onUpdatePayment: (index: number, patch: Partial<PaymentInput>) => void
    onRemovePayment: (index: number) => void
    notes: string
    onNotesChange: (notes: string) => void
    onSubmit: (totalPaid: number) => void
    submitting?: boolean
    disabled?: boolean
    // Discounts
    isScPwdDiscount: boolean
    onScPwdToggle: (val: boolean) => void
    regularDiscount: string | number
    onRegularDiscountChange: (val: string) => void
    subtotal: number
    tax: number
    scPwdDiscountAmount: number
}

// CHANGED: Reverted to a simple currency formatter for dollars
const formatAsCurrency = (n: number) => `\u20b1${n.toFixed(2)}`

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
                                                       isScPwdDiscount,
                                                       onScPwdToggle,
                                                       regularDiscount,
                                                       onRegularDiscountChange,
                                                       subtotal,
                                                       tax,
                                                       scPwdDiscountAmount
                                                   }) => {
    const { totalPaid, totalChangeDue } = useMemo(() => {
        let paid = 0
        payments.forEach(p => {
            paid += Number(p.amount) || 0
        })
        const change = Math.max(0, paid - total)
        return { totalPaid: paid, totalChangeDue: change }
    }, [payments, total])

    const diff = total - totalPaid
    const canSubmit = !disabled && (totalPaid >= total - 0.01) && total > 0 && payments.length > 0 && !submitting

    const handleCashTenderedChange = (index: number, tenderedValue: string) => {
        const tendered = Number(tenderedValue) || 0
        // We now allow the amount applied to be the full tendered value for Cash.
        // This ensures "Total Paid" reflects the cash received.
        onUpdatePayment(index, {
            tendered: tenderedValue,
            amount: tendered > 0 ? tendered.toFixed(2) : ''
        })
    }

    return (
        <div className="bg-white max-w-2xl mx-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 italic">Order Total</h3>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Amount Due</div>
                    <div className="text-xl font-bold text-gray-800">{formatAsCurrency(total)}</div>
                </div>
            </div>

            <div className="p-6 space-y-4">
                {/* Discounts Section */}
                <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Discounts & Promos</h4>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* SC/PWD Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 select-none">
                            <input
                                type="checkbox"
                                checked={isScPwdDiscount}
                                onChange={e => onScPwdToggle(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span>SC/PWD Discount (20% & VAT Exempt)</span>
                        </label>
                        
                        {/* Regular Discount */}
                        <div className="flex items-center gap-2">
                            <label htmlFor="regular-discount" className="text-xs font-medium text-gray-600 whitespace-nowrap">
                                Regular Discount:
                            </label>
                            <div className="relative rounded-md shadow-sm w-32">
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
                </div>

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
                    {/* Totals Breakdown */}
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Gross Subtotal</span>
                        <span>{formatAsCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Tax (VAT)</span>
                        <span>{formatAsCurrency(tax)}</span>
                    </div>
                    {isScPwdDiscount && (
                        <div className="flex justify-between text-xs text-amber-700">
                            <span>SC/PWD Discount (20%)</span>
                            <span>-{formatAsCurrency(scPwdDiscountAmount)}</span>
                        </div>
                    )}
                    {Number(regularDiscount) > 0 && (
                        <div className="flex justify-between text-xs text-blue-700">
                            <span>Regular Discount</span>
                            <span>-{formatAsCurrency(Number(regularDiscount))}</span>
                        </div>
                    )}
                    <div className="border-t border-gray-100 my-1"></div>
                    <div className="flex justify-between text-sm font-semibold text-gray-800">
                        <span>Net Amount Due</span>
                        <span>{formatAsCurrency(total)}</span>
                    </div>
                    <div className="border-t border-gray-100 my-1"></div>
                    {/* Payment breakdown */}
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
                    {submitting ? 'Processing...' : `Complete Sale (${formatAsCurrency(total)})`}
                </button>
            </div>
        </div>
    )
}

export default PaymentPanel