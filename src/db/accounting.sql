DROP FUNCTION IF EXISTS pos2_get_bir_tax_ledger;

CREATE OR REPLACE FUNCTION pos2_get_bir_tax_ledger(
  p_requesting_account_id bigint,
  p_start_date date,
  p_end_date date,
  p_terminal_id bigint DEFAULT NULL::bigint,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_summary JSONB;
  v_ledger JSONB;
  v_raw_net_vat NUMERIC := 0.00;
  v_net_vat_payable NUMERIC := 0.00;
  v_excess_vat_credit NUMERIC := 0.00;
  
  v_order_totals RECORD;
  v_item_totals RECORD;
  v_refunds RECORD;
  v_voids RECORD;
BEGIN
  -- Security Check
  IF NOT pos_is_admin(p_requesting_account_id) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can access the BIR Tax Ledger.';
  END IF;

  -- 1. SUMMARY KPI CARDS: Order-Level Aggregation
  SELECT
    COUNT(id) AS total_invoices_recorded,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_invoices,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN subtotal_amount ELSE 0 END), 0.00) AS completed_gross,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0.00) AS completed_net,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN tax_amount ELSE 0 END), 0.00) AS gross_output_vat,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN sc_pwd_discount_amount ELSE 0 END), 0.00) AS sc_pwd_discounts,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN vat_exempt_discount_amount ELSE 0 END), 0.00) AS vat_exemptions,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN promo_discount_total ELSE 0 END), 0.00) AS promo_discounts
  INTO v_order_totals
  FROM pos2_orders
  WHERE user_id = auth.uid()
    AND COALESCE(occurred_at, created_at)::DATE >= p_start_date
    AND COALESCE(occurred_at, created_at)::DATE <= p_end_date
    AND (p_terminal_id IS NULL OR terminal_id = p_terminal_id);

  -- 2. SUMMARY KPI CARDS: Item-Level Tax Base Breakdown
  SELECT
    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'VATable' AND (o.sc_pwd_discount_amount = 0 OR p.is_sc_pwd_eligible = FALSE)
        THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
        ELSE 0 
      END
    ), 0.00) AS vatable_sales_base,

    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'VAT-Exempt' OR (oi.tax_type_at_purchase = 'VATable' AND o.sc_pwd_discount_amount > 0 AND p.is_sc_pwd_eligible = TRUE)
        THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
        ELSE 0 
      END
    ), 0.00) AS vat_exempt_sales_base,

    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'Zero-Rated'
        THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
        ELSE 0 
      END
    ), 0.00) AS zero_rated_sales_base

  INTO v_item_totals
  FROM pos2_order_items oi
  JOIN pos2_orders o ON oi.order_id = o.id
  JOIN pos2_products p ON oi.product_id = p.id
  WHERE o.user_id = auth.uid()
    AND o.status = 'completed'
    AND COALESCE(o.occurred_at, o.created_at)::DATE >= p_start_date
    AND COALESCE(o.occurred_at, o.created_at)::DATE <= p_end_date
    AND (p_terminal_id IS NULL OR o.terminal_id = p_terminal_id);

  -- 3. SUMMARY KPI CARDS: Voids
  SELECT 
    COUNT(id) AS total_void_transactions,
    COALESCE(SUM(total_amount), 0.00) AS void_total_amount
  INTO v_voids
  FROM pos2_orders
  WHERE user_id = auth.uid()
    AND status = 'voided'
    AND COALESCE(occurred_at, created_at)::DATE >= p_start_date
    AND COALESCE(occurred_at, created_at)::DATE <= p_end_date
    AND (p_terminal_id IS NULL OR terminal_id = p_terminal_id);

  -- 4. SUMMARY KPI CARDS: Refunds
  SELECT 
    COALESCE(SUM(r.refund_amount), 0.00) AS refund_net,
    COALESCE(SUM(r.tax_component), 0.00) AS refund_vat
  INTO v_refunds
  FROM pos2_refunds r
  JOIN pos2_orders o ON r.order_id = o.id
  WHERE r.user_id = auth.uid()
    AND r.created_at::DATE >= p_start_date
    AND r.created_at::DATE <= p_end_date
    AND (p_terminal_id IS NULL OR o.terminal_id = p_terminal_id);

  -- Deduct SC/PWD discount from Exempt bucket for display
  v_item_totals.vat_exempt_sales_base := GREATEST(v_item_totals.vat_exempt_sales_base - v_order_totals.sc_pwd_discounts, 0.00);

  -- Calculate Net VAT Payable vs Excess Credit
  v_raw_net_vat := v_order_totals.gross_output_vat - v_refunds.refund_vat;
  IF v_raw_net_vat < 0 THEN
    v_net_vat_payable := 0.00;
    v_excess_vat_credit := ABS(v_raw_net_vat);
  ELSE
    v_net_vat_payable := v_raw_net_vat;
    v_excess_vat_credit := 0.00;
  END IF;

  -- Build Summary JSON Block
  v_summary := jsonb_build_object(
    'gross_transactions', (v_order_totals.completed_gross + v_voids.void_total_amount),
    'total_invoices_recorded', v_order_totals.total_invoices_recorded,
    'completed_invoices', v_order_totals.completed_invoices,
    'voided_invoices', v_voids.total_void_transactions,
    'vatable_sales_base', v_item_totals.vatable_sales_base,
    'gross_output_vat', v_order_totals.gross_output_vat,
    'refund_output_vat', v_refunds.refund_vat,
    'net_output_vat_payable', v_net_vat_payable,
    'excess_vat_credit', v_excess_vat_credit,
    'exempt_and_zero_rated', (v_item_totals.vat_exempt_sales_base + v_item_totals.zero_rated_sales_base),
    'net_taxable_realized', (v_order_totals.completed_net - (v_refunds.refund_net + v_refunds.refund_vat))
  );

  -- 5. ITEMIZED LEDGER ARRAY (Invoices List)
  SELECT COALESCE(jsonb_agg(row_to_json(l)), '[]'::jsonb)
  INTO v_ledger
  FROM (
    SELECT
      o.id AS invoice_id,
      COALESCE(o.occurred_at, o.created_at) AS invoice_date,
      o.invoice_number,
      COALESCE(t.terminal_name, 'System/Manual') AS terminal_name,
      COALESCE(c.full_name, 'General Customer') AS customer_name,
      o.status AS order_status,
      o.subtotal_amount AS gross_amount,

      CASE 
        WHEN o.status = 'voided' THEN 0.00
        ELSE COALESCE(SUM(
          CASE 
            WHEN oi.tax_type_at_purchase = 'VATable' AND (o.sc_pwd_discount_amount = 0 OR p.is_sc_pwd_eligible = FALSE)
            THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
            ELSE 0 
          END
        ), 0.00)
      END AS vatable_sales,

      CASE 
        WHEN o.status = 'voided' THEN 0.00
        ELSE o.tax_amount
      END AS gross_vat_amount,

      COALESCE((
        SELECT SUM(r.tax_component)
        FROM pos2_refunds r
        WHERE r.order_id = o.id
      ), 0.00) AS refund_vat_amount,

      CASE 
        WHEN o.status = 'voided' THEN 0.00
        ELSE GREATEST(o.tax_amount - COALESCE((
          SELECT SUM(r.tax_component)
          FROM pos2_refunds r
          WHERE r.order_id = o.id
        ), 0.00), 0.00)
      END AS net_vat_amount,

      CASE 
        WHEN o.status = 'voided' THEN 0.00
        ELSE GREATEST(COALESCE(SUM(
          CASE 
            WHEN oi.tax_type_at_purchase = 'VAT-Exempt' OR (oi.tax_type_at_purchase = 'VATable' AND o.sc_pwd_discount_amount > 0 AND p.is_sc_pwd_eligible = TRUE)
            THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
            ELSE 0 
          END
        ), 0.00) - o.sc_pwd_discount_amount, 0.00)
      END AS vat_exempt_sales,

      CASE 
        WHEN o.status = 'voided' THEN 0.00
        ELSE COALESCE(SUM(
          CASE 
            WHEN oi.tax_type_at_purchase = 'Zero-Rated'
            THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
            ELSE 0 
          END
        ), 0.00)
      END AS zero_rated_sales,

      o.sc_pwd_discount_amount AS sc_pwd_discount,
      o.promo_discount_total AS promo_discount,

      COALESCE((
        SELECT SUM(r.refund_amount + r.tax_component)
        FROM pos2_refunds r
        WHERE r.order_id = o.id
      ), 0.00) AS refund_amount,

      CASE 
        WHEN o.status = 'voided' THEN 0.00
        ELSE (o.total_amount - COALESCE((
          SELECT SUM(r.refund_amount + r.tax_component)
          FROM pos2_refunds r
          WHERE r.order_id = o.id
        ), 0.00))
      END AS net_taxable_sales

    FROM pos2_orders o
    LEFT JOIN pos2_order_items oi ON o.id = oi.order_id
    LEFT JOIN pos2_products p ON oi.product_id = p.id
    LEFT JOIN pos2_terminals t ON o.terminal_id = t.id
    LEFT JOIN pos2_customers c ON o.customer_id = c.id
    WHERE o.user_id = auth.uid()
      AND COALESCE(o.occurred_at, o.created_at)::DATE >= p_start_date
      AND COALESCE(o.occurred_at, o.created_at)::DATE <= p_end_date
      AND (p_terminal_id IS NULL OR o.terminal_id = p_terminal_id)
    GROUP BY 
      o.id, o.occurred_at, o.created_at, o.invoice_number, 
      t.terminal_name, c.full_name, o.status, o.subtotal_amount, 
      o.tax_amount, o.sc_pwd_discount_amount, o.promo_discount_total, o.total_amount
    ORDER BY COALESCE(o.occurred_at, o.created_at) DESC, o.invoice_number DESC
    LIMIT p_limit
    OFFSET p_offset
  ) l;

  -- 6. COMBINED JSON RETURN
  RETURN jsonb_build_object(
    'summary', v_summary,
    'ledger', v_ledger
  );
END;
$function$;

DROP FUNCTION IF EXISTS pos2_get_ar_aging_report;

CREATE OR REPLACE FUNCTION pos2_get_ar_aging_report(p_requesting_account_id bigint)
RETURNS TABLE(
  customer_id bigint, 
  customer_name text, 
  phone_number text, 
  current_amount numeric, 
  days_31_60 numeric, 
  days_61_90 numeric, 
  days_over_90 numeric, 
  total_balance numeric
)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  IF NOT pos_is_admin(p_requesting_account_id) THEN
    RAISE EXCEPTION 'Permission denied.';
  END IF;

  RETURN QUERY
  WITH customer_debts AS (
    -- 1. Unsettled Running Tab Debts (Item Debts, Loans, Deposits)
    SELECT 
      da.customer_id,
      dt.amount AS debt_amt,
      (CURRENT_DATE - dt.created_at::DATE) AS age_days
    FROM debt_transactions dt
    JOIN debt_accounts da ON dt.debt_account_id = da.id
    WHERE dt.user_id = auth.uid() 
      AND dt.related_order_id IS NULL -- Only unsettled transactions

    UNION ALL

    -- 2. Unpaid Installment Schedules
    SELECT 
      c.customer_id,
      (s.amount_due - s.amount_paid) AS debt_amt,
      (CURRENT_DATE - s.due_date) AS age_days
    FROM pos2_installment_schedules s
    JOIN pos2_installment_contracts c ON s.contract_id = c.id
    WHERE c.user_id = auth.uid() 
      AND c.status = 'active'
      AND s.status != 'paid' 
      AND (s.amount_due - s.amount_paid) > 0
  )
  SELECT 
    cust.id AS customer_id,
    cust.full_name AS customer_name,
    cust.phone_number,
    
    -- Aging Buckets
    COALESCE(SUM(CASE WHEN cd.age_days <= 30 THEN cd.debt_amt ELSE 0 END), 0.00) AS current_amount,
    COALESCE(SUM(CASE WHEN cd.age_days BETWEEN 31 AND 60 THEN cd.debt_amt ELSE 0 END), 0.00) AS days_31_60,
    COALESCE(SUM(CASE WHEN cd.age_days BETWEEN 61 AND 90 THEN cd.debt_amt ELSE 0 END), 0.00) AS days_61_90,
    COALESCE(SUM(CASE WHEN cd.age_days > 90 THEN cd.debt_amt ELSE 0 END), 0.00) AS days_over_90,
    
    COALESCE(SUM(cd.debt_amt), 0.00) AS total_balance
  FROM pos2_customers cust
  JOIN customer_debts cd ON cust.id = cd.customer_id
  WHERE cust.user_id = auth.uid()
  GROUP BY cust.id, cust.full_name, cust.phone_number
  HAVING SUM(cd.debt_amt) > 0
  ORDER BY total_balance DESC;
END;
$function$;

DROP FUNCTION IF EXISTS pos2_get_pnl_statement;

CREATE OR REPLACE FUNCTION pos2_get_pnl_statement(
  p_requesting_account_id bigint, 
  p_start_date timestamp without time zone, 
  p_end_date timestamp without time zone
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_revenue RECORD;
  v_refunds NUMERIC := 0.00;
  v_cogs NUMERIC := 0.00;
  v_operating_expenses NUMERIC := 0.00;
  v_gross_profit NUMERIC := 0.00;
  v_net_operating_income NUMERIC := 0.00;
  v_report_json JSONB;
BEGIN
  -- Security Check
  IF NOT pos_is_admin(p_requesting_account_id) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can view P&L Statements.';
  END IF;

  -- 1. CALCULATE GROSS REVENUE & DISCOUNTS
  SELECT 
    COALESCE(SUM(subtotal_amount), 0.00) AS gross_revenue,
    COALESCE(SUM(sc_pwd_discount_amount), 0.00) AS total_sc_pwd_discounts,
    COALESCE(SUM(vat_exempt_discount_amount), 0.00) AS total_vat_exemptions,
    COALESCE(SUM(promo_discount_total), 0.00) AS total_promo_discounts,
    COALESCE(SUM(tax_amount), 0.00) AS total_vat_collected,
    COALESCE(SUM(total_amount), 0.00) AS total_sales_realized
  INTO v_revenue
  FROM pos2_orders
  WHERE user_id = auth.uid()
    AND status = 'completed'
    AND COALESCE(occurred_at, created_at) >= p_start_date
    AND COALESCE(occurred_at, created_at) <= p_end_date;

  -- 2. CALCULATE REFUNDS
  SELECT COALESCE(SUM(refund_amount + tax_component), 0.00)
  INTO v_refunds
  FROM pos2_refunds
  WHERE user_id = auth.uid()
    AND created_at >= p_start_date
    AND created_at <= p_end_date;

  -- 3. CALCULATE COST OF GOODS SOLD (COGS)
  -- Sum of (Unit Cost * Net Quantity Sold)
  SELECT COALESCE(SUM(oi.cost_price_at_purchase * (oi.quantity - oi.refunded_quantity)), 0.00)
  INTO v_cogs
  FROM pos2_order_items oi
  JOIN pos2_orders o ON oi.order_id = o.id
  WHERE o.user_id = auth.uid()
    AND o.status = 'completed'
    AND COALESCE(o.occurred_at, o.created_at) >= p_start_date
    AND COALESCE(o.occurred_at, o.created_at) <= p_end_date;

  -- 4. CALCULATE OPERATING EXPENSES (Petty Cash Outflows)
  SELECT COALESCE(SUM(ABS(amount)), 0.00)
  INTO v_operating_expenses
  FROM pos2_payments
  WHERE user_id = auth.uid()
    AND payment_method = 'Petty Cash'
    AND amount < 0
    AND created_at >= p_start_date
    AND created_at <= p_end_date;

  -- 5. FINANCIAL MATH
  -- Gross Profit = (Net Sales - VAT) - COGS
  v_gross_profit := ((v_revenue.total_sales_realized - v_refunds) - v_revenue.total_vat_collected) - v_cogs;
  
  -- Net Operating Income = Gross Profit - Operating Expenses
  v_net_operating_income := v_gross_profit - v_operating_expenses;

  -- 6. ASSEMBLE STATEMENT JSON
  v_report_json := jsonb_build_object(
    'StatementType', 'PROFIT AND LOSS STATEMENT (INCOME STATEMENT)',
    'DateRange', jsonb_build_object('Start', p_start_date, 'End', p_end_date),
    'GeneratedAt', NOW(),
    
    'Revenue', jsonb_build_object(
        'GrossShelfRevenue', v_revenue.gross_revenue,
        'LessPromoDiscounts', v_revenue.total_promo_discounts,
        'LessSCPWDDiscounts', v_revenue.total_sc_pwd_discounts,
        'LessVATExemptions', v_revenue.total_vat_exemptions,
        'LessRefundsAndReturns', v_refunds,
        'NetRevenueRealized', (v_revenue.total_sales_realized - v_refunds)
    ),
    
    'CostOfGoodsSold', jsonb_build_object(
        'TotalCOGS', v_cogs,
        'GrossProfit', v_gross_profit,
        'GrossProfitMarginPercent', CASE WHEN (v_revenue.total_sales_realized - v_refunds) > 0 THEN ROUND((v_gross_profit / (v_revenue.total_sales_realized - v_refunds)) * 100, 2) ELSE 0.00 END
    ),
    
    'OperatingExpenses', jsonb_build_object(
        'PettyCashPayouts', v_operating_expenses
    ),
    
    'NetIncome', jsonb_build_object(
        'NetOperatingProfit', v_net_operating_income,
        'NetProfitMarginPercent', CASE WHEN (v_revenue.total_sales_realized - v_refunds) > 0 THEN ROUND((v_net_operating_income / (v_revenue.total_sales_realized - v_refunds)) * 100, 2) ELSE 0.00 END
    )
  );

  RETURN v_report_json;
END;
$function$;

-- =============================================================================
-- API FUNCTION: pos2_get_monthly_tax_preparation
-- Returns JSONB BIR Monthly Tax Preparation Declaration (Form 2550Q / Form 2551Q).
-- 
-- API Response Schema (JSONB):
-- {
--   "ReportType": string,
--   "TaxpayerCategory": "VAT-REGISTERED" | "NON-VAT",
--   "TaxPeriod": { "StartDate": date, "EndDate": date },
--   "BusinessInfo": { "Name": text, "TIN": text, "Address": text },
--   "GeneratedAt": timestamp,
--   "SalesSummary": {
--     "TotalCompletedTransactions": bigint,
--     "TotalVoidTransactions": bigint,
--     "GrossSalesWithVoids": numeric,
--     "LessVoids": numeric,
--     "LessPromotions": numeric,
--     "LessSCPWDDiscounts": numeric,
--     "LessVATExemptions": numeric,
--     "LessReturnsRefunds": numeric,
--     "NetTaxableSales": numeric
--   },
--   "InstallmentFinancingSummary": {
--     "NewContractsCreated": bigint,
--     "TotalInvoicedPrincipal": numeric,
--     "FinancedAmountOnCredit": numeric,
--     "UnearnedInterestRecognized": numeric
--   },
--   "TaxBreakdown": {
--     "VATableSales": numeric,
--     "OutputVATCollected": numeric,
--     "LessRefundOutputVAT": numeric,
--     "NetOutputVATPayable": numeric,
--     "ExcessVATCreditCarriedOver": numeric, -- Form 2550Q Line 23 Credit
--     "VATExemptSales": numeric,
--     "ZeroRatedSales": numeric
--   }
-- }
-- =============================================================================
DROP FUNCTION IF EXISTS pos2_get_monthly_tax_preparation;

CREATE OR REPLACE FUNCTION pos2_get_monthly_tax_preparation(
  p_requesting_account_id bigint, 
  p_start_date date, 
  p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_billing_type TEXT;
  v_business RECORD;
  v_order_totals RECORD;
  v_item_totals RECORD;
  v_installments RECORD;
  v_voids RECORD;
  v_refunds RECORD;
  v_raw_net_vat NUMERIC := 0.00;
  v_net_vat_payable NUMERIC := 0.00;
  v_excess_vat_credit NUMERIC := 0.00;
  v_report_json JSONB;
BEGIN
  -- Security Check
  IF NOT pos_is_admin(p_requesting_account_id) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can access Monthly Tax Preparation reports.';
  END IF;

  -- 1. Fetch Business Info & Billing Type
  SELECT COALESCE(sua.billing_type, 'NON-VAT') INTO v_billing_type
  FROM st_user_access sua
  WHERE sua.user_id = auth.uid();

  SELECT business_name, tin, address INTO v_business
  FROM pos2_business_settings
  WHERE user_id = auth.uid();

  -- 2. ORDER-LEVEL AGGREGATION
  SELECT
    COUNT(id) AS total_completed_transactions,
    COALESCE(SUM(subtotal_amount), 0.00) AS completed_gross_sales,
    COALESCE(SUM(total_amount), 0.00) AS net_sales_realized,
    COALESCE(SUM(tax_amount), 0.00) AS total_output_vat,
    COALESCE(SUM(sc_pwd_discount_amount), 0.00) AS sc_pwd_discounts,
    COALESCE(SUM(vat_exempt_discount_amount), 0.00) AS vat_exemptions,
    COALESCE(SUM(promo_discount_total), 0.00) AS promo_discounts
  INTO v_order_totals
  FROM pos2_orders
  WHERE user_id = auth.uid()
    AND status = 'completed'
    AND COALESCE(occurred_at, created_at)::DATE >= p_start_date
    AND COALESCE(occurred_at, created_at)::DATE <= p_end_date;

  -- 3. ITEM-LEVEL TAX BREAKDOWN AGGREGATION
  SELECT
    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'VATable' AND (o.sc_pwd_discount_amount = 0 OR p.is_sc_pwd_eligible = FALSE)
        THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
        ELSE 0 
      END
    ), 0.00) AS gross_vatable_sales_base,

    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'VAT-Exempt' OR (oi.tax_type_at_purchase = 'VATable' AND o.sc_pwd_discount_amount > 0 AND p.is_sc_pwd_eligible = TRUE)
        THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
        ELSE 0 
      END
    ), 0.00) AS vat_exempt_sales_base,

    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'Zero-Rated'
        THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
        ELSE 0 
      END
    ), 0.00) AS zero_rated_sales_base

  INTO v_item_totals
  FROM pos2_order_items oi
  JOIN pos2_orders o ON oi.order_id = o.id
  JOIN pos2_products p ON oi.product_id = p.id
  WHERE o.user_id = auth.uid()
    AND o.status = 'completed'
    AND COALESCE(o.occurred_at, o.created_at)::DATE >= p_start_date
    AND COALESCE(o.occurred_at, o.created_at)::DATE <= p_end_date;

  -- 4. AGGREGATE REFUNDS & REFUNDED Output VAT
  SELECT 
    COALESCE(SUM(r.refund_amount), 0.00) AS refund_net,
    COALESCE(SUM(r.tax_component), 0.00) AS refund_vat
  INTO v_refunds
  FROM pos2_refunds r
  WHERE r.user_id = auth.uid()
    AND r.created_at::DATE >= p_start_date
    AND r.created_at::DATE <= p_end_date;

  -- 5. Aggregate Installment Sales
  SELECT 
    COUNT(id) AS installment_contracts_count,
    COALESCE(SUM(total_contract_value), 0.00) AS total_installment_principal,
    COALESCE(SUM(financed_amount), 0.00) AS total_installment_financed,
    COALESCE(SUM(total_interest_amount), 0.00) AS total_installment_interest
  INTO v_installments
  FROM pos2_installment_contracts
  WHERE user_id = auth.uid()
    AND created_at::DATE >= p_start_date
    AND created_at::DATE <= p_end_date;

  -- 6. Aggregate Voids
  SELECT 
    COUNT(id) AS total_void_transactions,
    COALESCE(SUM(total_amount), 0.00) AS void_total_amount
  INTO v_voids
  FROM pos2_orders
  WHERE user_id = auth.uid()
    AND status = 'voided'
    AND COALESCE(occurred_at, created_at)::DATE >= p_start_date
    AND COALESCE(occurred_at, created_at)::DATE <= p_end_date;

  -- Deduct SC/PWD discount from Exempt bucket for clean display
  v_item_totals.vat_exempt_sales_base := GREATEST(v_item_totals.vat_exempt_sales_base - v_order_totals.sc_pwd_discounts, 0.00);

  -- 7. CALCULATE NET Output VAT PAYABLE vs. EXCESS CARRY-OVER
  v_raw_net_vat := v_order_totals.total_output_vat - v_refunds.refund_vat;
  
  IF v_raw_net_vat < 0 THEN
    v_net_vat_payable := 0.00;
    v_excess_vat_credit := ABS(v_raw_net_vat);
  ELSE
    v_net_vat_payable := v_raw_net_vat;
    v_excess_vat_credit := 0.00;
  END IF;

  -- 8. BUILD TAX PREPARATION JSON
  v_report_json := jsonb_build_object(
    'ReportType', 'BIR MONTHLY TAX PREPARATION REPORT',
    'TaxpayerCategory', v_billing_type,
    'TaxPeriod', jsonb_build_object('StartDate', p_start_date, 'EndDate', p_end_date),
    'BusinessInfo', jsonb_build_object(
      'Name', v_business.business_name,
      'TIN', v_business.tin,
      'Address', v_business.address
    ),
    'GeneratedAt', NOW(),

    'SalesSummary', jsonb_build_object(
      'TotalCompletedTransactions', v_order_totals.total_completed_transactions,
      'TotalVoidTransactions', v_voids.total_void_transactions,
      'GrossSalesWithVoids', (v_order_totals.completed_gross_sales + v_voids.void_total_amount),
      'LessVoids', v_voids.void_total_amount,
      'LessPromotions', v_order_totals.promo_discounts,
      'LessSCPWDDiscounts', v_order_totals.sc_pwd_discounts,
      'LessVATExemptions', v_order_totals.vat_exemptions,
      'LessReturnsRefunds', (v_refunds.refund_net + v_refunds.refund_vat),
      'NetTaxableSales', (v_order_totals.net_sales_realized - (v_refunds.refund_net + v_refunds.refund_vat))
    ),

    'InstallmentFinancingSummary', jsonb_build_object(
      'NewContractsCreated', v_installments.installment_contracts_count,
      'TotalInvoicedPrincipal', v_installments.total_installment_principal,
      'FinancedAmountOnCredit', v_installments.total_installment_financed,
      'UnearnedInterestRecognized', v_installments.total_installment_interest
    ),

    'TaxBreakdown', jsonb_build_object(
      'VATableSales', v_item_totals.gross_vatable_sales_base,
      'OutputVATCollected', v_order_totals.total_output_vat,
      'LessRefundOutputVAT', v_refunds.refund_vat,
      'NetOutputVATPayable', v_net_vat_payable,                      -- Capped at ₱0.00 minimum
      'ExcessVATCreditCarriedOver', v_excess_vat_credit,            -- Form 2550Q Line 23 Credit
      'VATExemptSales', v_item_totals.vat_exempt_sales_base,
      'ZeroRatedSales', v_item_totals.zero_rated_sales_base
    )
  );

  RETURN v_report_json;
END;
$function$;