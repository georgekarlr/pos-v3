import { supabase } from '../lib/supabase';
import { ServiceResponse } from '../types/pos';
import { OfflineDB } from '../db/offlineDB';
import {
    Customer,
    CreateCustomerParams,
    UpdateCustomerParams,
    DeleteCustomerParams,
    CustomerMutationResult,
    DeleteCustomerResult,
    CustomerFinancialSummary
} from '../types/customer';

export class CustomerService {
    /**
     * Creates a new customer record. 
     * Validates uniqueness of the phone number on the database side.
     */
    static async createCustomer(
        params: CreateCustomerParams
    ): Promise<ServiceResponse<CustomerMutationResult>> {
        try {
            if (!navigator.onLine) {
                return { data: null, error: 'Creating customers requires an internet connection.' };
            }

            const { data, error } = await supabase.rpc('pos2_create_customer', {
                p_full_name: params.p_full_name,
                p_phone_number: params.p_phone_number,
                p_email: params.p_email ?? null,
                p_address: params.p_address ?? null,
            });

            if (error) {
                console.error('Error creating customer:', error);
                return { data: null, error: error.message };
            }

            if (!data || data.length === 0) {
                return { data: null, error: 'Failed to create customer. No data returned.' };
            }

            const result = data[0] as CustomerMutationResult;
            return { data: result, error: null };
        } catch (err: any) {
            console.error('Unexpected error creating customer:', err);
            return { data: null, error: err.message || 'An unexpected error occurred.' };
        }
    }

    /**
     * Fetches a single customer by their ID.
     */
    static async getCustomerById(
        customerId: number
    ): Promise<ServiceResponse<Customer>> {
        try {
            if (!navigator.onLine) {
                // Try to find in local cache
                const localCustomers = await OfflineDB.getCustomers();
                const found = localCustomers.find(c => c.id === customerId);
                if (found) {
                    return { data: found as Customer, error: null };
                }
                return { data: null, error: 'Customer not found in local cache while offline.' };
            }

            const { data, error } = await supabase.rpc('pos2_get_customer_by_id', {
                p_customer_id: customerId,
            });

            if (error) {
                console.error('Error fetching customer by ID:', error);
                return { data: null, error: error.message };
            }

            return { data: data as Customer, error: null };
        } catch (err: any) {
            console.error('Unexpected error fetching customer by ID:', err);
            return { data: null, error: err.message || 'An unexpected error occurred.' };
        }
    }

    /**
     * Updates an existing customer's details.
     */
    static async updateCustomer(
        params: UpdateCustomerParams
    ): Promise<ServiceResponse<CustomerMutationResult>> {
        try {
            if (!navigator.onLine) {
                return { data: null, error: 'Updating customers requires an internet connection.' };
            }

            const { data, error } = await supabase.rpc('pos2_update_customer', {
                p_customer_id: params.p_customer_id,
                p_full_name: params.p_full_name,
                p_phone_number: params.p_phone_number,
                p_email: params.p_email ?? null,
                p_address: params.p_address ?? null,
            });

            if (error) {
                console.error('Error updating customer:', error);
                return { data: null, error: error.message };
            }

            if (!data || data.length === 0) {
                return { data: null, error: 'Failed to update customer. No data returned.' };
            }

            const result = data[0] as CustomerMutationResult;
            return { data: result, error: null };
        } catch (err: any) {
            console.error('Unexpected error updating customer:', err);
            return { data: null, error: err.message || 'An unexpected error occurred.' };
        }
    }

    /**
     * Deletes a customer if they have no unpaid debts and no active installment contracts.
     * Requires Admin privileges.
     */
    static async deleteCustomer(
        params: DeleteCustomerParams
    ): Promise<ServiceResponse<DeleteCustomerResult>> {
        try {
            if (!navigator.onLine) {
                return { data: null, error: 'Deleting customers requires an internet connection.' };
            }

            const { data, error } = await supabase.rpc('pos2_delete_customer', {
                p_requesting_account_id: params.p_requesting_account_id,
                p_customer_id: params.p_customer_id,
            });

            if (error) {
                console.error('Error deleting customer:', error);
                return { data: null, error: error.message };
            }

            if (!data || data.length === 0) {
                return { data: null, error: 'Failed to delete customer. No data returned.' };
            }

            const result = data[0] as DeleteCustomerResult;
            return { data: result, error: null };
        } catch (err: any) {
            console.error('Unexpected error deleting customer:', err);
            return { data: null, error: err.message || 'An unexpected error occurred.' };
        }
    }

    /**
     * Fetches a unified financial snapshot for a customer:
     * running-tab debt, active installment contracts, and grand total outstanding.
     */
    static async getFinancialSummary(
        customerId: number
    ): Promise<ServiceResponse<CustomerFinancialSummary>> {
        try {
            if (!navigator.onLine) {
                return { data: null, error: 'Viewing financial summary requires an internet connection.' };
            }

            const { data, error } = await supabase.rpc('pos2_get_customer_financial_summary', {
                p_customer_id: customerId,
            });

            if (error) {
                console.error('Error fetching customer financial summary:', error);
                return { data: null, error: error.message };
            }

            return { data: data as CustomerFinancialSummary, error: null };
        } catch (err: any) {
            console.error('Unexpected error fetching customer financial summary:', err);
            return { data: null, error: err.message || 'An unexpected error occurred.' };
        }
    }
}