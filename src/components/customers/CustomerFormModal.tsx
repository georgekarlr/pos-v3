import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Customer } from '../../types/customer';

// We use a generic `any` for onSave here so it can accept both CreateCustomerParams and UpdateCustomerParams
interface CustomerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: any) => Promise<{ success: boolean; message: string }>;
    customer: Customer | null;
    isLoading: boolean;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    customer,
    isLoading,
}) => {
    const isEdit = !!customer;

    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Reset or populate form when modal opens/changes
    useEffect(() => {
        if (isOpen) {
            if (customer) {
                setFullName(customer.full_name);
                setPhoneNumber(customer.phone_number);
                setEmail(customer.email || '');
                setAddress(customer.address || '');
            } else {
                setFullName('');
                setPhoneNumber('');
                setEmail('');
                setAddress('');
            }
            setError(null);
        }
    }, [isOpen, customer]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic local validation
        if (!fullName.trim() || !phoneNumber.trim()) {
            setError('Full Name and Phone Number are required.');
            return;
        }

        const payload = isEdit
            ? {
                p_customer_id: customer.id,
                p_full_name: fullName.trim(),
                p_phone_number: phoneNumber.trim(),
                p_email: email.trim() || null,
                p_address: address.trim() || null,
            }
            : {
                p_full_name: fullName.trim(),
                p_phone_number: phoneNumber.trim(),
                p_email: email.trim() || null,
                p_address: address.trim() || null,
            };

        const result = await onSave(payload);
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
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {isEdit ? 'Edit Customer' : 'New Customer'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {isEdit ? 'Update customer details below.' : 'Add a new customer to your database.'}
                        </p>
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

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Juan Dela Cruz"
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="0917-123-4567"
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                placeholder="juan@example.com (Optional)"
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
                        <div className="relative">
                            <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                            <textarea
                                placeholder="Complete address (Optional)"
                                rows={2}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            {isEdit ? 'Save Changes' : 'Create Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerFormModal;