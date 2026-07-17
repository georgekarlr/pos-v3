import { supabase } from '../lib/supabase'
import {
  BestSellingProductRow,
  EJournalRow,
  GenerateXReadingParams,
  GenerateZReadingParams,
  GetBestSellingProductsParams,
  GetEJournalParams,
  GetLowStockProductsParams,
  GetSalesByStaffParams,
  GetSalesOverTimeParams,
  LowStockProductRow,
  SalesByStaffRow,
  SalesOverTimeRow,
  XReadingResult,
  ZReadingRPCRow,
} from '../types/report'

export const ReportService = {
  // ─── Analytics ──────────────────────────────────────────────────────────────

  async getSalesOverTime(params: GetSalesOverTimeParams): Promise<SalesOverTimeRow[]> {
    const { requesting_account_id, start_date, end_date } = params
    const { data, error } = await supabase.rpc('pos2_report_sales_over_time', {
      p_requesting_account_id: requesting_account_id,
      p_start_date: start_date,
      p_end_date: end_date,
    })
    if (error) { console.error('Error fetching sales over time:', error); throw new Error(error.message) }
    return (data || []) as SalesOverTimeRow[]
  },

  async getSalesByStaff(params: GetSalesByStaffParams): Promise<SalesByStaffRow[]> {
    const { requesting_account_id, start_date, end_date } = params
    const { data, error } = await supabase.rpc('pos2_report_sales_by_staff', {
      p_requesting_account_id: requesting_account_id,
      p_start_date: start_date,
      p_end_date: end_date,
    })
    if (error) { console.error('Error fetching sales by staff:', error); throw new Error(error.message) }
    return (data || []) as SalesByStaffRow[]
  },

  async getBestSellingProducts(params: GetBestSellingProductsParams): Promise<BestSellingProductRow[]> {
    const { requesting_account_id, start_date, end_date, limit } = params
    const { data, error } = await supabase.rpc('pos2_report_best_selling_products', {
      p_requesting_account_id: requesting_account_id,
      p_start_date: start_date,
      p_end_date: end_date,
      p_limit: limit,
    })
    if (error) { console.error('Error fetching best-selling products:', error); throw new Error(error.message) }
    return (data || []) as BestSellingProductRow[]
  },

  async getLowStockProducts(params: GetLowStockProductsParams): Promise<LowStockProductRow[]> {
    const { requesting_account_id, threshold } = params
    const { data, error } = await supabase.rpc('pos2_report_low_stock_products', {
      p_requesting_account_id: requesting_account_id,
      p_threshold: threshold,
    })
    if (error) { console.error('Error fetching low stock products:', error); throw new Error(error.message) }
    return (data || []) as LowStockProductRow[]
  },

  // ─── Compliance / POS Fiscal ─────────────────────────────────────────────

  /**
   * Generate an X-Reading (mid-day snapshot) for a terminal on a given date.
   * Logs a permanent X_READING entry to the E-Journal on every call.
   */
  async generateXReading(params: GenerateXReadingParams): Promise<XReadingResult> {
    const { requesting_account_id, terminal_id, target_date } = params
    const { data, error } = await supabase.rpc('pos2_generate_x_reading', {
      p_requesting_account_id: requesting_account_id,
      p_terminal_id: terminal_id,
      p_target_date: target_date,
    })
    console.log('data x-reading', data);
    if (error) { console.error('Error generating X-Reading:', error); throw new Error(error.message) }
    return data as XReadingResult
  },

  /**
   * Generate and permanently save a Z-Reading (end-of-day) for a terminal.
   * Admin-only. Can only be executed once per terminal per date.
   */
  async generateZReading(params: GenerateZReadingParams): Promise<ZReadingRPCRow> {
    const { requesting_account_id, terminal_id, target_date } = params
    const { data, error } = await supabase.rpc('pos2_generate_z_reading', {
      p_requesting_account_id: requesting_account_id,
      p_terminal_id: terminal_id,
      p_target_date: target_date,
    })
    if (error) { console.error('Error generating Z-Reading:', error); throw new Error(error.message) }
    // The SQL function returns a TABLE – Supabase wraps it in an array
    const row = Array.isArray(data) ? data[0] : data
    return row as ZReadingRPCRow
  },

  /**
   * Fetch paginated E-Journal entries. Admin-only.
   */
  async getEJournal(params: GetEJournalParams): Promise<EJournalRow[]> {
    const { requesting_account_id, limit, offset, terminal_id, start_date, end_date } = params
    const { data, error } = await supabase.rpc('pos2_get_e_journal', {
      p_requesting_account_id: requesting_account_id,
      p_limit: limit,
      p_offset: offset,
      p_terminal_id: terminal_id ?? null,
      p_start_date: start_date ?? null,
      p_end_date: end_date ?? null,
    })
    console.log('data e-journal', data);
    if (error) { console.error('Error fetching E-Journal:', error); throw new Error(error.message) }
    return (data || []) as EJournalRow[]
  },
}
