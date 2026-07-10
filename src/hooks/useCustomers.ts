import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
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
        if (!navigator.onLine) {
            setError('You are offline. Cannot fetch customers.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('pos2_customers')
                .select('*')
                .order('full_name', { ascending: true });

            if (searchQuery.trim() !== '') {
                query = query.or(`full_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw fetchError;
            }

            setCustomers(data as Customer[] || []);
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