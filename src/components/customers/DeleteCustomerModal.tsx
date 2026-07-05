import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { Customer } from '../../types/customer';

interface DeleteCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<{ success: boolean; message: string }>;
    customer: Customer | null;
    isLoading: boolean;
}

const DeleteCustomerModal: React.FC<DeleteCustomerModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    customer,
    isLoading,
}) => {
    const [error, setError] = useState<string | null>(null);

    // Reset error when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setError(null);
        }
    }, [isOpen, customer]);

    if (!isOpen || !customer) return null;

    const handleConfirm = async () => {
        setError(null);
        const result = await onConfirm();
        if (!result.success) {
            setError(result.message);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Modal Box */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle size={20} />
                        <h2 className="text-lg font-bold">Delete Customer</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition disabled:opacity-40"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mx-6 mt-5 flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-sm flex-shrink-0">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span className="flex-1">{error}</span>
                    </div>
                )}

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-700 text-sm">
                        Are you sure you want to delete <span className="font-bold text-gray-900">{customer.full_name}</span>?
                    </p>
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800">
                        <p className="font-semibold mb-1">Please note:</p>
                        <ul className="list-disc list-inside space-y-1 text-orange-700/90 text-xs">
                            <li>This action is permanent and cannot be undone.</li>
                            <li>Customers with active installment contracts cannot be deleted.</li>
                            <li>Customers with unpaid running tab debts cannot be deleted.</li>
                        </ul>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 mt-auto">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition shadow-sm shadow-red-200 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                        Delete Customer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteCustomerModal;