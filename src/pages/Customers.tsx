import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; import { Customer } from '../types/customer';
import CustomerList from '../components/customers/CustomerList';
import CustomerFormModal from '../components/customers/CustomerFormModal'
import DeleteCustomerModal from '../components/customers/DeleteCustomerModal';
import { useCustomers } from '../hooks/useCustomers';

const Customers: React.FC = () => {
    const { persona } = useAuth();

    // Custom Hook
    const {
        customers,
        loading,
        error: globalError,
        fetchCustomers,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        clearError
    } = useCustomers();

    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isMutating, setIsMutating] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Toast Helper
    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    // Initial Fetch
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchCustomers]);

    // Modal Handlers
    const handleOpenCreate = () => {
        setSelectedCustomer(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsFormModalOpen(true);
    };

    const handleOpenDelete = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDeleteModalOpen(true);
    };

    // Mutation Handlers
    const handleSaveCustomer = async (payload: any) => {
        setIsMutating(true);
        let result;

        if (selectedCustomer) {
            result = await updateCustomer(payload);
        } else {
            result = await createCustomer(payload);
        }

        setIsMutating(false);

        if (result.success) {
            showToast('success', result.message);
        }
        return result;
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCustomer || !persona?.id) return { success: false, message: 'Missing required data.' };

        setIsMutating(true);
        const result = await deleteCustomer({
            p_requesting_account_id: persona.id,
            p_customer_id: selectedCustomer.id
        });
        setIsMutating(false);

        if (result.success) {
            showToast('success', result.message);
        }
        return result;
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold
          transition-all duration-300 animate-in slide-in-from-top-2
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                >
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {toast.message}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
                        <X size={15} />
                    </button>
                </div>
            )}

            {/* Page Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-5">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                            <Users size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Customers</h1>
                            <p className="text-sm text-gray-500">Manage your customer database and contact info</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl
              hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200"
                    >
                        <Plus size={18} />
                        Add Customer
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

                {/* Global Error */}
                {globalError && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <p className="flex-1">{globalError}</p>
                        <button onClick={clearError}><X size={16} /></button>
                    </div>
                )}

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or phone number..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Data List */}
                <CustomerList
                    customers={customers}
                    loading={loading}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                />
            </div>

            {/* Modals */}
            <CustomerFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSaveCustomer}
                customer={selectedCustomer}
                isLoading={isMutating}
            />

            <DeleteCustomerModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                customer={selectedCustomer}
                isLoading={isMutating}
            />

        </div>
    );
}; export default Customers;