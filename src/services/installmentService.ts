import { supabase } from '../lib/supabase';
import { ServiceResponse } from '../types/pos';
import {
  CustomerInstallments,
  InstallmentContractSummary,
  GetAllInstallmentContractsParams,
  CreateInstallmentSaleParams,
  CreateInstallmentSaleResult,
  PayInstallmentScheduleParams,
  PayInstallmentScheduleResult,
  WriteOffInstallmentContractParams,
  WriteOffInstallmentContractResult,
  RecoverInstallmentDebtParams,
  RecoverInstallmentDebtResult,
} from '../types/installment';

export class InstallmentService {
  /**
   * Fetches all installment contracts and their monthly schedules for a customer.
   */
  static async getCustomerInstallments(
    customerId: number
  ): Promise<ServiceResponse<CustomerInstallments>> {
    try {
      if (!navigator.onLine) {
        return { data: null, error: 'Viewing installments requires an internet connection.' };
      }

      const { data, error } = await supabase.rpc('pos2_get_customer_installments', {
        p_customer_id: customerId,
      });

      if (error) {
        console.error('Error fetching customer installments:', error);
        return { data: null, error: error.message };
      }

      return { data: data as CustomerInstallments, error: null };
    } catch (err: any) {
      console.error('Unexpected error fetching customer installments:', err);
      return { data: null, error: err.message || 'An unexpected error occurred.' };
    }
  }

  /**
   * Fetches a paginated, filterable list of all installment contracts (admin-only).
   * Replaces the separate search-customers + search-contracts pattern.
   */
  static async getAllContracts(
    params: GetAllInstallmentContractsParams
  ): Promise<ServiceResponse<InstallmentContractSummary[]>> {
    try {
      if (!navigator.onLine) {
        return { data: null, error: 'Viewing contracts requires an internet connection.' };
      }

      const { data, error } = await supabase.rpc('pos2_get_all_installment_contracts', {
        p_requesting_account_id: params.p_requesting_account_id,
        p_limit: params.p_limit,
        p_offset: params.p_offset,
        p_search_term: params.p_search_term ?? null,
        p_status_filter: params.p_status_filter ?? null,
      });

      if (error) {
        console.error('Error fetching all installment contracts:', error);
        return { data: null, error: error.message };
      }

      return { data: (data ?? []) as InstallmentContractSummary[], error: null };
    } catch (err: any) {
      console.error('Unexpected error fetching all installment contracts:', err);
      return { data: null, error: err.message || 'An unexpected error occurred.' };
    }
  }

  /**
   * Creates a new installment sale: places an order, deducts stock,
   * records downpayment, and generates the monthly schedule.
   */
  static async createInstallmentSale(
    params: CreateInstallmentSaleParams
  ): Promise<ServiceResponse<CreateInstallmentSaleResult>> {
    try {
      if (!navigator.onLine) {
        return { data: null, error: 'Creating installment sales requires an internet connection.' };
      }

      console.log('params', params);
      const { data, error } = await supabase.rpc('pos2_create_installment_sale', {
        p_account_id: params.p_account_id,
        p_terminal_id: params.p_terminal_id,
        p_customer_id: params.p_customer_id,
        p_cart_items: params.p_cart_items,
        p_downpayment_amount: params.p_downpayment_amount,
        p_downpayment_method: params.p_downpayment_method,
        p_months_to_pay: params.p_months_to_pay,
        p_interest_rate: params.p_interest_rate, // NEW: Interest Rate
        p_occurred_at: params.p_occurred_at ?? null,
      });

      if (error) {
        console.error('Error creating installment sale:', error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'Failed to create installment sale.' };
      }

      const result = data[0] as CreateInstallmentSaleResult;

      if (!result.success) {
        return { data: null, error: result.message };
      }

      return { data: result, error: null };
    } catch (err: any) {
      console.error('Unexpected error creating installment sale:', err);
      return { data: null, error: err.message || 'An unexpected error occurred.' };
    }
  }

  /**
   * Applies a payment to a contract's schedules using waterfall logic
   * (earliest unpaid month first). Also handles overpayment rejection.
   */
  static async payInstallmentSchedule(
    params: PayInstallmentScheduleParams
  ): Promise<ServiceResponse<PayInstallmentScheduleResult>> {
    try {
      if (!navigator.onLine) {
        return { data: null, error: 'Processing payments requires an internet connection.' };
      }

      const { data, error } = await supabase.rpc('pos2_pay_installment_schedule', {
        p_requesting_account_id: params.p_requesting_account_id,
        p_contract_id: params.p_contract_id,
        p_terminal_id: params.p_terminal_id,
        p_payment_amount: params.p_payment_amount,
        p_payment_method: params.p_payment_method,
      });

      if (error) {
        console.error('Error paying installment schedule:', error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'Failed to process installment payment.' };
      }

      const result = data[0] as PayInstallmentScheduleResult;

      if (!result.success) {
        return { data: null, error: result.message };
      }

      return { data: result, error: null };
    } catch (err: any) {
      console.error('Unexpected error paying installment schedule:', err);
      return { data: null, error: err.message || 'An unexpected error occurred.' };
    }
  }

  /**
   * Writes off an active installment contract as a bad debt.
   * Requires admin permissions.
   */
  static async writeOffContract(
    params: WriteOffInstallmentContractParams
  ): Promise<ServiceResponse<WriteOffInstallmentContractResult>> {
    try {
      if (!navigator.onLine) {
        return { data: null, error: 'Writing off contracts requires an internet connection.' };
      }

      const { data, error } = await supabase.rpc('pos2_write_off_installment_contract', {
        p_requesting_account_id: params.p_requesting_account_id,
        p_contract_id: params.p_contract_id,
        p_reason: params.p_reason,
      });

      if (error) {
        console.error('Error writing off contract:', error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'Failed to write off contract.' };
      }

      const result = data[0] as WriteOffInstallmentContractResult;

      if (!result.success) {
        return { data: null, error: result.message };
      }

      return { data: result, error: null };
    } catch (err: any) {
      console.error('Unexpected error writing off contract:', err);
      return { data: null, error: err.message || 'An unexpected error occurred.' };
    }
  }

  /**
   * Processes recovery of a defaulted/written-off contract.
   * Requires admin permissions.
   */
  static async recoverDebt(
    params: RecoverInstallmentDebtParams
  ): Promise<ServiceResponse<RecoverInstallmentDebtResult>> {
    try {
      if (!navigator.onLine) {
        return { data: null, error: 'Debt recovery requires an internet connection.' };
      }

      const { data, error } = await supabase.rpc('pos2_recover_installment_debt', {
        p_requesting_account_id: params.p_requesting_account_id,
        p_contract_id: params.p_contract_id,
        p_recovery_amount: params.p_recovery_amount,
        p_payment_method: params.p_payment_method,
        p_notes: params.p_notes ?? 'Recovered Bad Debt',
      });

      if (error) {
        console.error('Error recovering installment debt:', error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'Failed to process debt recovery.' };
      }

      const result = data[0] as RecoverInstallmentDebtResult;

      if (!result.success) {
        return { data: null, error: result.message };
      }

      return { data: result, error: null };
    } catch (err: any) {
      console.error('Unexpected error recovering installment debt:', err);
      return { data: null, error: err.message || 'An unexpected error occurred.' };
    }
  }
}