import { supabase } from '../lib/supabase'
import {
  ARAgingParams,
  ARAgingRow,
  BIRTaxLedgerParams,
  BIRTaxLedgerResult,
  PnLStatementParams,
  PnLStatementResult,
} from '../types/accounting'

export const AccountingService = {
  /**
   * Fetch BIR Tax Ledger (Form 2550Q / Form 2551Q declaration).
   */
  async getBIRTaxLedger(params: BIRTaxLedgerParams): Promise<BIRTaxLedgerResult> {
    const { requesting_account_id, start_date, end_date } = params
    const { data, error } = await supabase.rpc('pos2_get_bir_tax_ledger', {
      p_requesting_account_id: requesting_account_id,
      p_start_date: start_date,
      p_end_date: end_date,
    })

    if (error) {
      console.error('Error fetching BIR tax ledger:', error)
      throw new Error(error.message)
    }

    return data as BIRTaxLedgerResult
  },

  /**
   * Fetch Accounts Receivable (A/R) Aging Report.
   */
  async getARAgingReport(params: ARAgingParams): Promise<ARAgingRow[]> {
    const { requesting_account_id } = params
    const { data, error } = await supabase.rpc('pos2_get_ar_aging_report', {
      p_requesting_account_id: requesting_account_id,
    })

    if (error) {
      console.error('Error fetching A/R aging report:', error)
      throw new Error(error.message)
    }

    return (data || []) as ARAgingRow[]
  },

  /**
   * Fetch Profit & Loss (Income) Statement.
   */
  async getPnLStatement(params: PnLStatementParams): Promise<PnLStatementResult> {
    const { requesting_account_id, start_date, end_date } = params
    const { data, error } = await supabase.rpc('pos2_get_pnl_statement', {
      p_requesting_account_id: requesting_account_id,
      p_start_date: start_date,
      p_end_date: end_date,
    })

    if (error) {
      console.error('Error fetching P&L statement:', error)
      throw new Error(error.message)
    }

    return data as PnLStatementResult
  },
}
