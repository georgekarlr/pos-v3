import { supabase } from '../lib/supabase';
import { OfflineDB } from '../db/offlineDB';
import type {
  CreatePosSaleParams,
  CreateSaleResult,
  ServiceResponse,
  PettyCashParams,
  PettyCashResult
} from '../types/pos.ts';
import { FormatDateTime } from '../utils/formatDateTime';

export class PosService {

  /**
   * Creates a new POS sale transaction.
   * Handles server-side validation of totals and taxes.
   */
  static async createSale(params: CreatePosSaleParams): Promise<ServiceResponse<CreateSaleResult & { is_offline?: boolean }>> {
    console.log('params', params)
    // Check if online
    if (!navigator.onLine) {
      try {
        // Retrieve and update cached terminal state sequentially
        const terminalStateStr = localStorage.getItem(`terminal_state_${params.p_terminal_id}`);
        let invoiceNumber = '0000000001';
        let offlineGrandTotal = params.p_total;

        if (terminalStateStr) {
          const terminalState = JSON.parse(terminalStateStr);
          const currentInvoiceNum = Number(terminalState.current_invoice_number || 0);
          const expectedInvoiceNum = currentInvoiceNum + 1;
          invoiceNumber = String(expectedInvoiceNum).padStart(10, '0');

          const cumulativeGrandTotal = Number(terminalState.cumulative_grand_total || 0);
          offlineGrandTotal = cumulativeGrandTotal + params.p_total;

          // Update cached terminal state
          terminalState.current_invoice_number = expectedInvoiceNum;
          terminalState.next_invoice_number = String(expectedInvoiceNum + 1).padStart(10, '0');
          terminalState.cumulative_grand_total = offlineGrandTotal;
          localStorage.setItem(`terminal_state_${params.p_terminal_id}`, JSON.stringify(terminalState));
        } else {
          // Fallback if no specific cached state yet, check in cached active terminals
          const cachedTerminalsStr = localStorage.getItem('cached_active_terminals');
          if (cachedTerminalsStr) {
            const terminals = JSON.parse(cachedTerminalsStr);
            const term = terminals.find((t: any) => t.id === params.p_terminal_id);
            if (term) {
              const currentInvoiceNum = Number(term.current_invoice_number || 0);
              const expectedInvoiceNum = currentInvoiceNum + 1;
              invoiceNumber = String(expectedInvoiceNum).padStart(10, '0');

              const cumulativeGrandTotal = Number(term.cumulative_grand_total || 0);
              offlineGrandTotal = cumulativeGrandTotal + params.p_total;

              // Initialize and save cached terminal state
              const newState = {
                terminal_id: term.id,
                terminal_name: term.terminal_name || term.name,
                min: term.min,
                current_invoice_number: expectedInvoiceNum,
                next_invoice_number: String(expectedInvoiceNum + 1).padStart(10, '0'),
                cumulative_grand_total: offlineGrandTotal,
                is_active: term.is_active
              };
              localStorage.setItem(`terminal_state_${params.p_terminal_id}`, JSON.stringify(newState));
            }
          }
        }

        const offlineSaleId = await OfflineDB.saveSale({
          accountId: params.p_account_id,
          terminalId: params.p_terminal_id,
          customerId: params.p_customer_id ?? null,           // NEW
          cart: params.p_cart_items,
          payments: params.p_payments,
          notes: params.p_notes || null,
          total: params.p_total,
          tax: params.p_tax,
          total_tendered: params.p_total_tendered,
          scPwdDiscount: params.p_sc_pwd_discount || 0,
          scPwdIdNumber: params.p_sc_pwd_id_number ?? null,  // NEW
          scPwdName: params.p_sc_pwd_name ?? null,            // NEW
          loyaltyPointsEarned: params.p_loyalty_points_earned ?? 0,   // NEW
          loyaltyPointsRedeemed: params.p_loyalty_points_redeemed ?? 0, // NEW
          createdAt: params.p_occurred_at || FormatDateTime.formatLocalTimestampForDatabase(new Date()),
          offlineInvoiceNumber: invoiceNumber,
          offlineGrandTotal: offlineGrandTotal
        });

        const result: CreateSaleResult & { is_offline: boolean } = {
          success: true,
          message: 'Sale saved offline. Will sync when online.',
          data: {
            order_id: offlineSaleId,
            invoice_number: invoiceNumber
          },
          is_offline: true
        };

        return { data: result, error: null };
      } catch (err: any) {
        console.error('Error saving offline sale:', err);
        return { data: null, error: 'Failed to save sale offline' };
      }
    }

    try {
      const { data, error } = await supabase.rpc('pos2_create_sale', {
        p_account_id: params.p_account_id,
        p_terminal_id: params.p_terminal_id,
        p_customer_id: params.p_customer_id,
        p_cart_items: params.p_cart_items,
        p_payments: params.p_payments,
        p_notes: params.p_notes ?? null,
        p_total: params.p_total,
        p_tax: params.p_tax,
        p_total_tendered: params.p_total_tendered,
        // BIR Compliance
        p_sc_pwd_discount: params.p_sc_pwd_discount ?? 0,
        p_sc_pwd_id_number: params.p_sc_pwd_id_number ?? null,     // NEW
        p_sc_pwd_name: params.p_sc_pwd_name ?? null,               // NEW
        // Loyalty Program
        p_loyalty_points_earned: params.p_loyalty_points_earned ?? 0,   // NEW
        p_loyalty_points_redeemed: params.p_loyalty_points_redeemed ?? 0, // NEW
        // Offline Sync
        p_is_offline_sync: params.p_is_offline_sync ?? false,
        p_occurred_at: params.p_occurred_at ?? null,
        p_offline_invoice_number: params.p_offline_invoice_number ?? null,
        p_offline_grand_total: params.p_offline_grand_total ?? null
      });

      console.log('data', data)
      console.log('error', error)
      if (error) {
        console.error('Error creating sale:', error);
        return { data: null, error: error.message };
      }

      // The function returns a TABLE, so data is an array.
      if (!data || data.length === 0) {
        return { data: null, error: 'Failed to create sale.' };
      }

      // The RPC returns { success, message, data (jsonb) }
      // We map this to our TypeScript interface
      const result = data[0] as CreateSaleResult;

      // If the RPC internally caught an exception and returned success: false
      if (!result.success) {
        return { data: null, error: result.message };
      }

      // Fetch and update cached terminal state after a successful online sale
      try {
        const stateRes = await supabase.rpc('pos2_get_terminal_state', {
          p_terminal_id: params.p_terminal_id
        });
        if (stateRes.data && stateRes.data.length > 0) {
          localStorage.setItem(`terminal_state_${params.p_terminal_id}`, JSON.stringify(stateRes.data[0]));
        }
      } catch (err) {
        console.error('Failed to update cached terminal state after online sale:', err);
      }

      return { data: { ...result, is_offline: false }, error: null };

    } catch (err: any) {
      console.error('Unexpected error during sale:', err);
      return {
        data: null,
        error: err.message || 'An unexpected error occurred while processing the sale.'
      };
    }
  }

  /**
   * Fetches active terminals for the current store user.
   */
  static async getActiveTerminals(): Promise<ServiceResponse<any[]>> {
    if (!navigator.onLine) {
      try {
        const cached = localStorage.getItem('cached_active_terminals');
        if (cached) {
          return { data: JSON.parse(cached), error: null };
        }
      } catch (err) {
        console.error('Error reading cached active terminals:', err);
      }
      return { data: [], error: 'Offline and no cached active terminals found.' };
    }

    try {
      const { data, error } = await supabase
        .from('pos2_terminals')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching active terminals:', error);
        try {
          const cached = localStorage.getItem('cached_active_terminals');
          if (cached) {
            return { data: JSON.parse(cached), error: null };
          }
        } catch (err) {
          console.error('Error reading cached active terminals on fallback:', err);
        }
        return { data: null, error: error.message };
      }

      const activeTerminals = data || [];
      localStorage.setItem('cached_active_terminals', JSON.stringify(activeTerminals));
      return { data: activeTerminals, error: null };
    } catch (err: any) {
      console.error('Unexpected error fetching active terminals:', err);
      try {
        const cached = localStorage.getItem('cached_active_terminals');
        if (cached) {
          return { data: JSON.parse(cached), error: null };
        }
      } catch (e) {
        console.error('Error reading cached active terminals on fallback:', e);
      }
      return { data: null, error: err.message || 'Failed to fetch active terminals.' };
    }
  }

  /**
   * Fetches the terminal state for a specific terminal.
   */
  static async getTerminalState(terminalId: number): Promise<ServiceResponse<any>> {
    if (!navigator.onLine) {
      try {
        const cached = localStorage.getItem(`terminal_state_${terminalId}`);
        if (cached) {
          return { data: JSON.parse(cached), error: null };
        }
      } catch (err) {
        console.error('Error reading cached terminal state:', err);
      }
      return { data: null, error: 'Offline and no cached terminal state found.' };
    }

    try {
      const { data, error } = await supabase.rpc('pos2_get_terminal_state', {
        p_terminal_id: terminalId
      });

      if (error) {
        console.error('Error fetching terminal state:', error);
        // Fallback to cache if error
        const cached = localStorage.getItem(`terminal_state_${terminalId}`);
        if (cached) {
          return { data: JSON.parse(cached), error: null };
        }
        return { data: null, error: error.message };
      }

      if (data && data.length > 0) {
        const state = data[0];
        localStorage.setItem(`terminal_state_${terminalId}`, JSON.stringify(state));
        return { data: state, error: null };
      }

      return { data: null, error: 'Terminal state not found.' };
    } catch (err: any) {
      console.error('Unexpected error fetching terminal state:', err);
      const cached = localStorage.getItem(`terminal_state_${terminalId}`);
      if (cached) {
        return { data: JSON.parse(cached), error: null };
      }
      return { data: null, error: err.message || 'Failed to fetch terminal state.' };
    }
  }

  /**
   * Performs Petty Cash Cash In / Cash Out operations.
   */
  static async managePettyCash(params: PettyCashParams): Promise<ServiceResponse<PettyCashResult>> {
    if (!navigator.onLine) {
      return { data: null, error: 'Petty cash operations require an active internet connection.' };
    }

    try {
      const { data, error } = await supabase.rpc('pos2_manage_petty_cash', {
        p_requesting_account_id: params.p_requesting_account_id,
        p_terminal_id: params.p_terminal_id,
        p_action_type: params.p_action_type,
        p_amount: params.p_amount,
        p_reason: params.p_reason
      });

      if (error) {
        console.error('Error in managePettyCash:', error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'No response received from the database.' };
      }

      const result = data[0] as PettyCashResult;
      return { data: result, error: null };
    } catch (err: any) {
      console.error('Unexpected error in managePettyCash:', err);
      return {
        data: null,
        error: err.message || 'An unexpected error occurred during the petty cash operation.'
      };
    }
  }
}
