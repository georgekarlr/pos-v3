import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import PaymentPanel from './PaymentPanel'
import { PaymentInput } from '../../types/pos'
import { X } from 'lucide-react'

interface PaymentModalProps {
    open: boolean
    onClose: () => void
    // --- Totals ---
    total: number
    subtotal: number
    tax: number
    totalPromoDiscount?: number
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
    // --- SC/PWD ---
    isScPwdDiscount: boolean
    onScPwdToggle: (val: boolean) => void
    scPwdDiscountAmount: number
    scPwdIdNumber: string
    onScPwdIdNumberChange: (val: string) => void
    scPwdName: string
    onScPwdNameChange: (val: string) => void
    // --- Customer & Loyalty ---
    customerId: number | null
    onCustomerIdChange: (id: number | null) => void
    customerLoyaltyBalance: number
    loyaltyPointsEarned: number
}

const PaymentModal: React.FC<PaymentModalProps> = (props) => {
    const [show, setShow] = useState(false)

    useEffect(() => {
        if (props.open) {
            setTimeout(() => setShow(true), 10)
        } else {
            setShow(false)
        }
    }, [props.open])

    if (!props.open) return null

    const modal = (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
            <div
                className={`absolute inset-0 bg-gray-900/60 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
                onClick={props.onClose}
            />

            <div className={`relative bg-white w-full sm:w-auto sm:max-w-2xl rounded-t-xl sm:rounded-xl shadow-2xl transition-all duration-300 overflow-hidden ${show ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-8 sm:scale-95'}`}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h3 className="text-xl font-bold text-gray-900">Checkout</h3>
                    <button
                        onClick={props.onClose}
                        className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="max-h-[85vh] overflow-y-auto">
                    <div className="p-0">
                        <PaymentPanel
                            total={props.total}
                            subtotal={props.subtotal}
                            tax={props.tax}
                            totalPromoDiscount={props.totalPromoDiscount}
                            payments={props.payments}
                            onAddPayment={props.onAddPayment}
                            onUpdatePayment={props.onUpdatePayment}
                            onRemovePayment={props.onRemovePayment}
                            notes={props.notes}
                            onNotesChange={props.onNotesChange}
                            onSubmit={props.onSubmit}
                            submitting={props.submitting}
                            disabled={props.disabled}
                            isScPwdDiscount={props.isScPwdDiscount}
                            onScPwdToggle={props.onScPwdToggle}
                            scPwdDiscountAmount={props.scPwdDiscountAmount}
                            scPwdIdNumber={props.scPwdIdNumber}
                            onScPwdIdNumberChange={props.onScPwdIdNumberChange}
                            scPwdName={props.scPwdName}
                            onScPwdNameChange={props.onScPwdNameChange}
                            customerId={props.customerId}
                            onCustomerIdChange={props.onCustomerIdChange}
                            customerLoyaltyBalance={props.customerLoyaltyBalance}
                            loyaltyPointsEarned={props.loyaltyPointsEarned}
                        />
                    </div>
                </div>
            </div>
        </div>
    )

    return createPortal(modal, document.body)
}

export default PaymentModal
