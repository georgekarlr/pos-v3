import { useState, useCallback } from 'react';
import { CustomerService } from '../services/customerService';
import {
    Customer,
    CreateCustomerParams,
    UpdateCustomerParams,
    DeleteCustomerParams,
    CustomerFinancialSummary,
} from '../types/customer';

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Financial summary — isolated state so it doesn't pollute the list
    const [financialSummary, setFinancialSummary] = useState<CustomerFinancialSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // 1. Fetch & Search Customers
    const fetchCustomers = useCallback(async (searchQuery: string = '') => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await CustomerService.getCustomers({
                searchTerm: searchQuery
            });

            if (fetchError) {
                throw new Error(fetchError);
            }

            setCustomers(data || []);
        } catch (err: any) {
            console.error('Error fetching customers:', err);
            setError(err.message || 'Failed to load customers.');
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. Create Customer
    const createCustomer = async (params: CreateCustomerParams) => {
        setError(null);
        const { data, error: svcError } = await CustomerService.createCustomer(params);

        if (svcError) {
            setError(svcError);
            return { success: false, message: svcError };
        }

        if (data && data.success) {
            await fetchCustomers(); // Refresh the list automatically
            return { success: true, message: data.message };
        }

        const fallbackError = data?.message || 'Failed to create customer.';
        setError(fallbackError);
        return { success: false, message: fallbackError };
    };

    // 3. Update Customer
    const updateCustomer = async (params: UpdateCustomerParams) => {
        setError(null);
        const { data, error: svcError } = await CustomerService.updateCustomer(params);

        if (svcError) {
            setError(svcError);
            return { success: false, message: svcError };
        }

        if (data && data.success) {
            await fetchCustomers(); // Refresh the list automatically
            return { success: true, message: data.message };
        }

        const fallbackError = data?.message || 'Failed to update customer.';
        setError(fallbackError);
        return { success: false, message: fallbackError };
    };

    // 4. Delete Customer
    const deleteCustomer = async (params: DeleteCustomerParams) => {
        setError(null);
        const { data, error: svcError } = await CustomerService.deleteCustomer(params);

        if (svcError) {
            setError(svcError);
            return { success: false, message: svcError };
        }

        if (data && data.success) {
            await fetchCustomers(); // Refresh the list automatically
            return { success: true, message: data.message };
        }

        const fallbackError = data?.message || 'Failed to delete customer.';
        setError(fallbackError);
        return { success: false, message: fallbackError };
    };

    // 5. Fetch Financial Summary (new API)
    const fetchFinancialSummary = useCallback(async (customerId: number) => {
        setSummaryLoading(true);
        setFinancialSummary(null);

        const { data, error: svcError } = await CustomerService.getFinancialSummary(customerId);

        setSummaryLoading(false);

        if (svcError) {
            setError(svcError);
            return { success: false };
        }

        setFinancialSummary(data);
        return { success: true };
    }, []);

    const clearError = () => setError(null);
    const clearSummary = () => setFinancialSummary(null);

    return {
        customers,
        loading,
        error,
        fetchCustomers,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        clearError,
        // Financial summary
        financialSummary,
        summaryLoading,
        fetchFinancialSummary,
        clearSummary,
    };
};