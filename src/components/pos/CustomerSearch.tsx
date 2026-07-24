import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X, Check } from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';
import { Customer } from '../../types/customer';

interface CustomerSearchProps {
    selectedCustomerId: number | null;
    onSelectCustomer: (customer: Customer | null) => void;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({ selectedCustomerId, onSelectCustomer }) => {
    const { customers, fetchCustomers, loading } = useCustomers();
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initial fetch
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // Handle searching
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchCustomers]);

    // Sync selected customer if ID changes
    useEffect(() => {
        if (selectedCustomerId === null) {
            setSelectedCustomer(null);
        } else if (customers.length > 0) {
            const found = customers.find(c => c.id === selectedCustomerId);
            if (found) setSelectedCustomer(found);
        }
    }, [selectedCustomerId, customers]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        onSelectCustomer(customer);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCustomer(null);
        onSelectCustomer(null);
        setSearchTerm('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className={`flex items-center gap-2 p-2.5 rounded-md border bg-white cursor-pointer transition-all ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400'
                    }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <User className={`h-4 w-4 ${selectedCustomer ? 'text-blue-500' : 'text-gray-400'}`} />
                <div className="flex-1 truncate">
                    {selectedCustomer ? (
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">{selectedCustomer.full_name}</span>
                            <span className="text-xs text-gray-500">{selectedCustomer.phone_number}</span>
                        </div>
                    ) : (
                        <span className="text-sm text-gray-400">Search customer...</span>
                    )}
                </div>
                {selectedCustomer && (
                    <button
                        onClick={handleClear}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-[1100] mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-150">
                    <div className="p-2 border-b border-gray-100 bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Name or phone number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm rounded-md border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        {loading && customers.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">Loading customers...</div>
                        ) : customers.length > 0 ? (
                            customers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className={`px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between group transition-colors ${selectedCustomerId === customer.id ? 'bg-blue-50' : ''
                                        }`}
                                    onClick={() => handleSelect(customer)}
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                                            {customer.full_name}
                                        </p>
                                        <p className="text-xs text-gray-500 group-hover:text-blue-500">
                                            {customer.phone_number} • ID: {customer.id}
                                        </p>
                                    </div>
                                    {selectedCustomerId === customer.id && (
                                        <Check className="h-4 w-4 text-blue-600" />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500 italic">
                                No customers found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerSearch;
