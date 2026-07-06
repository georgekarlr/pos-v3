import React from 'react';
import { Edit2, Trash2, Phone, Mail, MapPin, Calendar, Users, Loader2 } from 'lucide-react';
import { Customer } from '../../types/customer';

interface CustomerListProps {
    customers: Customer[];
    loading: boolean;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, loading, onEdit, onDelete }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-gray-400">
                <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
                <p className="text-sm font-medium">Loading customers...</p>
            </div>
        );
    }

    if (!customers || customers.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-gray-400 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                    <Users size={28} className="text-gray-300" />
                </div>
                <p className="text-base font-bold text-gray-700">No customers found</p>
                <p className="text-sm mt-1 max-w-sm">
                    We couldn't find any customers matching your criteria. Try a different search or add a new customer.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Contact Info</th>
                            <th className="px-6 py-4">Address</th>
                            <th className="px-6 py-4">Added</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {customers.map((customer) => {
                            // Null-safe fallbacks to prevent React crashes!
                            const customerName = customer.full_name || 'Unknown Customer';
                            const initial = customerName.charAt(0).toUpperCase();

                            return (
                                <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">

                                    {/* Customer Identity */}
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                                                <span className="text-sm font-bold text-indigo-700">
                                                    {initial}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{customerName}</p>
                                                <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {customer.id}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact Info */}
                                    <td className="px-6 py-4 align-top">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                <Phone size={14} className="text-gray-400" />
                                                <span className="font-medium">{customer.phone_number || 'No phone'}</span>
                                            </div>
                                            {customer.email && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Mail size={14} className="text-gray-400" />
                                                    <span>{customer.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Address */}
                                    <td className="px-6 py-4 align-top max-w-xs">
                                        {customer.address ? (
                                            <div className="flex items-start gap-1.5 text-sm text-gray-600 line-clamp-2">
                                                <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                                <span title={customer.address}>{customer.address}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">No address provided</span>
                                        )}
                                    </td>

                                    {/* Added Date */}
                                    <td className="px-6 py-4 align-top whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                            <Calendar size={14} className="text-gray-400" />
                                            {customer.created_at
                                                ? new Date(customer.created_at).toLocaleDateString('en-PH', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })
                                                : 'Unknown'
                                            }
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 align-top text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(customer)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Edit Customer"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(customer)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Customer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>

                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomerList;