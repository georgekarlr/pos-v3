import { supabase } from '../lib/supabase';
import { OfflineDB } from '../db/offlineDB';
import { ServiceResponse } from '../types/pos';
import { CreateCustomerDebtParams, CustomerSearchResult, DebtOperationResult, CustomerListItem, ManageDebtAccountParams, ManageDebtAccountResult, CustomerDebtDetails } from '../types/debt';
import { FormatDateTime } from '../utils/formatDateTime';

export class DebtService {
  static async getCustomers(params: { limit: number; offset: number; searchTerm?: string }): Promise<ServiceResponse<CustomerListItem[]>> {
    try {
      if (!navigator.onLine) {
        return { data: [], error: 'Viewing customers requires an internet connection.' };
      }

      const { data, error } = await supabase.rpc('pos2_get_customers', {
        p_limit: params.limit,
        p_offset: params.offset,
        p_search_term: params.searchTerm || null
      });

      if (error) {
        console.error('Error fetching customers:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err: any) {
      console.error('Unexpected error fetching customers:', err);
      return { data: null, error: err.message || 'An unexpected error occurred.' };
    }
  }

  static async searchCustomers(searchTerm: string): Promise<ServiceResponse<CustomerSearchResult[]>> {
    try {
      if (!navigator.onLine) {
        return { data: [], error: null }; // or maybe search in local customers if we had them
      }

      const { data, error } = await supabase.rpc('pos2_search_customers', {
        p_search_term: searchTerm
      });

      if (error) {
        console.error('Error searching customers:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err: any) {
      console.error('Unexpected error searching customers:', err);
      return { data: null, error: err.message || 'An unexpected error occurred.' };
    }
  }

  static async createCustomerAndAddDebt(params: CreateCustomerDebtParams): Promise<ServiceResponse<DebtOperationResult>> {
    try {
      if (!navigator.onLine) {
        try {
          await OfflineDB.saveDebt({
            accountId: params.p_requesting_account_id,
            full_name: params.p_full_name,
            phone_number: params.p_phone_number,
            email: params.p_email || null,
            address: params.p_address || null,
            items: params.p_items_to_debt || [],
            cash_loan_amount: params.p_cash_loan_amount || 0,
            description: params.p_description || null,
            occurredAt: params.p_occurred_at || FormatDateTime.formatLocalTimestampForDatabase(new Date())
          });

          return {
            data: {
              success: true,
              message: 'Debt saved offline. Will sync when online.',
              data: null,
              is_offline: true
            },
            error: null
          };
        } catch (err: any) {
          console.error('Error saving offline debt:', err);
          return { data: null, error: 'Failed to save debt offline' };
        }
      }

      const { data, error } = await supabase.rpc('pos2_create_customer_and_add_debt', {
        p_requesting_account_id: params.p_requesting_account_id,
        p_full_name: params.p_full_name,
        p_phone_number: params.p_phone_number,
        p_email: params.p_email || null,
        p_address: params.p_address || null,
        p_items_to_debt: params.p_items_to_debt || [],
        p_cash_loan_amount: params.p_cash_loan_amount || 0,
        p_description: params.p_description || null,
        p_occurred_at: params.p_occurred_at || null
      });

      if (error) {
        console.error('Error adding debt:', error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'Failed to process debt operation.' };
      }

      const result = data[0] as DebtOperationResult;

      if (!result.success) {
        return { data: null, error: result.message };
      }

      return { data: result, error: null };
    } catch (err: any) {
      console.error('Unexpected error adding debt:', err);
      return { data: null, error: err.message || 'An unexpected error occurred.' };
    }
  }

  static async manageDebtAccount(params: ManageDebtAccountParams): Promise<ServiceResponse<ManageDebtAccountResult>> {
    try {
      if (!navigator.onLine) {
        return { data: null, error: 'Managing debt accounts requires an internet connection.' };
      }

      const { data, error } = await supabase.rpc('pos2_manage_debt_account', {
        p_requesting_account_id: params.p_requesting_account_id,
        p_customer_id: params.p_customer_id,
        p_action_type: params.p_action_type,
        p_amount: params.p_amount || 0,
        p_payment_method: params.p_payment_method || 'Cash',
        p_notes: params.p_notes || null
      });

      if (error) {
        console.error('Error managing debt account:', error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'Failed to process debt management action.' };
      }

      const result = data[0] as ManageDebtAccountResult;

      if (!result.success) {
        return { data: null, error: result.message };
      }

      return { data: result, error: null };
    } catch (err: any) {
      console.error('Unexpected error managing debt account:', err);
      return { data: null, error: err.message || 'An unexpected error occurred.' };
    }
  }

  static async getCustomerDebtDetails(customerId: number): Promise<ServiceResponse<CustomerDebtDetails>> {
    try {
      if (!navigator.onLine) {
        return { data: null, error: 'Viewing debt details requires an internet connection.' };
      }

      const { data, error } = await supabase.rpc('pos2_get_customer_debt_details', {
        p_customer_id: customerId
      });

      if (error) {
        console.error('Error fetching debt details:', error);
        return { data: null, error: error.message };
      }

      return { data: data as CustomerDebtDetails, error: null };
    } catch (err: any) {
      console.error('Unexpected error fetching debt details:', err);
      return { data: null, error: err.message || 'An unexpected error occurred.' };
    }
  }
}
