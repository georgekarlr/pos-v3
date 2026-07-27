import { supabase } from '../lib/supabase'
import {
  ARAgingParams,
  ARAgingRow,
  BIRTaxLedgerParams,
  BIRTaxLedgerRow,
  MonthlyTaxPrepParams,
  MonthlyTaxPrepResult,
  PnLStatementParams,
  PnLStatementResult,
} from '../types/accounting'
import { FormatDateTime } from '../utils/formatDateTime'

export const AccountingService = {
  /**
   * Fetch BIR Tax Ledger (Itemized sales transaction tax rows).
   * Dates are normalized to local-timezone ISO date strings (YYYY-MM-DD) before
   * being passed to the SQL function to prevent UTC-shift boundary errors.
   */
  async getBIRTaxLedger(params: BIRTaxLedgerParams): Promise<BIRTaxLedgerRow[]> {
    const { requesting_account_id, start_date, end_date, terminal_id, limit = 1000, offset = 0 } = params
    const { data, error } = await supabase.rpc('pos2_get_bir_tax_ledger', {
      p_requesting_account_id: requesting_account_id,
      p_start_date: FormatDateTime.getLocalDateISO(new Date(start_date)),
      p_end_date: FormatDateTime.getLocalDateISO(new Date(end_date)),
      p_terminal_id: terminal_id ?? null,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) {
      console.error('Error fetching BIR tax ledger:', error)
      throw new Error(error.message)
    }

    return (data || []) as BIRTaxLedgerRow[]
  },

  /**
   * Fetch BIR Monthly Tax Preparation declaration report (Form 2550Q / Form 2551Q summary).
   * Dates are normalized to local-timezone ISO date strings (YYYY-MM-DD) before
   * being passed to the SQL function to prevent UTC-shift boundary errors.
   */
  async getMonthlyTaxPreparation(params: MonthlyTaxPrepParams): Promise<MonthlyTaxPrepResult> {
    const { requesting_account_id, start_date, end_date } = params
    const { data, error } = await supabase.rpc('pos2_get_monthly_tax_preparation', {
      p_requesting_account_id: requesting_account_id,
      p_start_date: FormatDateTime.getLocalDateISO(new Date(start_date)),
      p_end_date: FormatDateTime.getLocalDateISO(new Date(end_date)),
    })

    if (error) {
      console.error('Error fetching Monthly Tax Preparation report:', error)
      throw new Error(error.message)
    }

    return data as MonthlyTaxPrepResult
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
   * Timestamps are normalized to local-timezone full timestamps before being
   * passed to the SQL function to prevent UTC-shift boundary errors.
   */
  async getPnLStatement(params: PnLStatementParams): Promise<PnLStatementResult> {
    const { requesting_account_id, start_date, end_date } = params
    const { data, error } = await supabase.rpc('pos2_get_pnl_statement', {
      p_requesting_account_id: requesting_account_id,
      p_start_date: FormatDateTime.formatLocalTimestampForDatabase(new Date(start_date)),
      p_end_date: FormatDateTime.formatLocalTimestampForDatabase(new Date(end_date)),
    })

    if (error) {
      console.error('Error fetching P&L statement:', error)
      throw new Error(error.message)
    }

    return data as PnLStatementResult
  },
}
