import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import PaymentPanel from './PaymentPanel'
import { PaymentInput } from '../../types/pos'
import { X } from 'lucide-react'

interface PaymentModalProps {
    open: boolean
    onClose: () => void
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
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    open,
    onClose,
    total,
    payments,
    onAddPayment,
    onUpdatePayment,
    onRemovePayment,
    notes,
    onNotesChange,
    onSubmit,
    submitting,
    disabled
}) => {
    const [show, setShow] = useState(false)

    useEffect(() => {
        if (open) {
            setTimeout(() => setShow(true), 10)
        } else {
            setShow(false)
        }
    }, [open])

    if (!open) return null

    const modal = (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
            <div 
                className={`absolute inset-0 bg-gray-900/60 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`} 
                onClick={onClose} 
            />

            <div className={`relative bg-white w-full sm:w-auto sm:max-w-2xl rounded-t-xl sm:rounded-xl shadow-2xl transition-all duration-300 overflow-hidden ${show ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-8 sm:scale-95'}`}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h3 className="text-xl font-bold text-gray-900">Checkout</h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="max-h-[85vh] overflow-y-auto">
                    <div className="p-0">
                        <PaymentPanel
                            total={total}
                            payments={payments}
                            onAddPayment={onAddPayment}
                            onUpdatePayment={handleUpdatePaymentWrapper}
                            onRemovePayment={onRemovePayment}
                            notes={notes}
                            onNotesChange={onNotesChange}
                            onSubmit={onSubmit}
                            submitting={submitting}
                            disabled={disabled}
                        />
                    </div>
                </div>
            </div>
        </div>
    )

    // Helper to ensure we don't accidentally close the modal while interacting with the panel
    function handleUpdatePaymentWrapper(index: number, patch: Partial<PaymentInput>) {
        onUpdatePayment(index, patch)
    }

    return createPortal(modal, document.body)
}

export default PaymentModal
