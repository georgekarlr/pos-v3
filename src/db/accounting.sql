DROP FUNCTION IF EXISTS pos2_get_bir_tax_ledger;

CREATE OR REPLACE FUNCTION pos2_get_bir_tax_ledger(
  p_requesting_account_id bigint,
  p_start_date date,
  p_end_date date,
  p_terminal_id bigint DEFAULT NULL::bigint,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  invoice_id bigint,
  invoice_date timestamp without time zone,
  invoice_number text,
  terminal_name text,
  customer_name text,
  order_status order_status_type,
  gross_amount numeric,
  vatable_sales numeric,
  vat_amount numeric,
  vat_exempt_sales numeric,
  zero_rated_sales numeric,
  sc_pwd_discount numeric,
  promo_discount numeric,
  refund_amount numeric,
  net_taxable_sales numeric
)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  -- Security Check: Only Admins can access BIR Tax Ledgers
  IF NOT pos_is_admin(p_requesting_account_id) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can access the BIR Tax Ledger.';
  END IF;

  RETURN QUERY
  SELECT
    o.id AS invoice_id,
    COALESCE(o.occurred_at, o.created_at) AS invoice_date,
    o.invoice_number,
    COALESCE(t.terminal_name, 'System/Manual') AS terminal_name,
    COALESCE(c.full_name, 'General Customer') AS customer_name,
    o.status AS order_status,
    
    -- Gross Amount (Shelf Subtotal before discounts)
    o.subtotal_amount AS gross_amount,

    -- VATable Sales Base (₱0.00 if transaction was voided)
    CASE 
      WHEN o.status = 'voided' THEN 0.00
      ELSE COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VATable' THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount) ELSE 0 END), 0.00)
    END AS vatable_sales,

    -- Output VAT (₱0.00 if transaction was voided)
    CASE 
      WHEN o.status = 'voided' THEN 0.00
      ELSE o.tax_amount
    END AS vat_amount,

    -- VAT-Exempt Sales Base
    CASE 
      WHEN o.status = 'voided' THEN 0.00
      ELSE GREATEST(COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VAT-Exempt' THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount) ELSE 0 END), 0.00) - o.sc_pwd_discount_amount, 0.00)
    END AS vat_exempt_sales,

    -- Zero-Rated Sales Base
    CASE 
      WHEN o.status = 'voided' THEN 0.00
      ELSE COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'Zero-Rated' THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount) ELSE 0 END), 0.00)
    END AS zero_rated_sales,

    -- Discounts Applied
    o.sc_pwd_discount_amount AS sc_pwd_discount,
    o.promo_discount_total AS promo_discount,

    -- Refunded Portion (Sub-queried from refunds table)
    COALESCE((
      SELECT SUM(r.refund_amount + r.tax_component)
      FROM pos2_refunds r
      WHERE r.order_id = o.id
    ), 0.00) AS refund_amount,

    -- Final Realized Net Taxable Sales (₱0.00 if voided)
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
  LEFT JOIN pos2_terminals t ON o.terminal_id = t.id
  LEFT JOIN pos2_customers c ON o.customer_id = c.id
  WHERE o.user_id = auth.uid()
    AND COALESCE(o.occurred_at, o.created_at)::DATE >= p_start_date
    AND COALESCE(o.occurred_at, o.created_at)::DATE <= p_end_date
    AND (p_terminal_id IS NULL OR o.terminal_id = p_terminal_id)
  GROUP BY 
    o.id, 
    o.occurred_at, 
    o.created_at, 
    o.invoice_number, 
    t.terminal_name, 
    c.full_name, 
    o.status, 
    o.subtotal_amount, 
    o.tax_amount, 
    o.sc_pwd_discount_amount, 
    o.promo_discount_total, 
    o.total_amount
  ORDER BY COALESCE(o.occurred_at, o.created_at) ASC, o.invoice_number ASC
  LIMIT p_limit
  OFFSET p_offset;
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
  v_sales RECORD;
  v_installments RECORD;
  v_voids RECORD;
  v_refunds RECORD;
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

  -- 2. Aggregate Completed Sales & Tax Components (Includes Installment Invoices)
  SELECT
    COUNT(o.id) AS total_completed_transactions,
    COALESCE(SUM(o.subtotal_amount), 0.00) AS completed_gross_sales,
    COALESCE(SUM(o.total_amount), 0.00) AS net_sales_realized,
    COALESCE(SUM(o.tax_amount), 0.00) AS total_output_vat,
    COALESCE(SUM(o.sc_pwd_discount_amount), 0.00) AS sc_pwd_discounts,
    COALESCE(SUM(o.vat_exempt_discount_amount), 0.00) AS vat_exemptions,
    COALESCE(SUM(o.promo_discount_total), 0.00) AS promo_discounts,
    
    -- Item-level breakdown by tax category
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VATable' THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount) ELSE 0 END), 0.00) AS vatable_sales_base,
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VAT-Exempt' THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount) ELSE 0 END), 0.00) AS vat_exempt_sales_base,
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'Zero-Rated' THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount) ELSE 0 END), 0.00) AS zero_rated_sales_base
  INTO v_sales
  FROM pos2_orders o
  LEFT JOIN pos2_order_items oi ON o.id = oi.order_id
  WHERE o.user_id = auth.uid()
    AND o.status = 'completed'
    AND COALESCE(o.occurred_at, o.created_at)::DATE >= p_start_date
    AND COALESCE(o.occurred_at, o.created_at)::DATE <= p_end_date;

  -- 3. Isolate Installment Sales Contracts Initiated in Period
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

  -- 4. Aggregate Voided Orders
  SELECT 
    COUNT(id) AS total_void_transactions,
    COALESCE(SUM(total_amount), 0.00) AS void_total_amount
  INTO v_voids
  FROM pos2_orders
  WHERE user_id = auth.uid()
    AND status = 'voided'
    AND COALESCE(occurred_at, created_at)::DATE >= p_start_date
    AND COALESCE(occurred_at, created_at)::DATE <= p_end_date;

  -- 5. Aggregate Refunds & Tax Deductions
  SELECT 
    COALESCE(SUM(r.refund_amount), 0.00) AS refund_net,
    COALESCE(SUM(r.tax_component), 0.00) AS refund_vat
  INTO v_refunds
  FROM pos2_refunds r
  WHERE r.user_id = auth.uid()
    AND r.created_at::DATE >= p_start_date
    AND r.created_at::DATE <= p_end_date;

  -- Deduct SC/PWD discount from VAT Exempt Bucket for accurate display
  v_sales.vat_exempt_sales_base := GREATEST(v_sales.vat_exempt_sales_base - v_sales.sc_pwd_discounts, 0.00);

  -- 6. BUILD TAX PREPARATION JSON
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
      'TotalCompletedTransactions', v_sales.total_completed_transactions,
      'TotalVoidTransactions', v_voids.total_void_transactions,
      'GrossSalesWithVoids', (v_sales.completed_gross_sales + v_voids.void_total_amount),
      'LessVoids', v_voids.void_total_amount,
      'LessPromotions', v_sales.promo_discounts,
      'LessSCPWDDiscounts', v_sales.sc_pwd_discounts,
      'LessVATExemptions', v_sales.vat_exemptions,
      'LessReturnsRefunds', v_refunds.refund_net,
      'NetTaxableSales', (v_sales.net_sales_realized - v_refunds.refund_net)
    ),

    'InstallmentFinancingSummary', jsonb_build_object(
      'NewContractsCreated', v_installments.installment_contracts_count,
      'TotalInvoicedPrincipal', v_installments.total_installment_principal,
      'FinancedAmountOnCredit', v_installments.total_installment_financed,
      'UnearnedInterestRecognized', v_installments.total_installment_interest
    ),

    'TaxBreakdown', jsonb_build_object(
      'VATableSales', v_sales.vatable_sales_base,
      'OutputVATCollected', v_sales.total_output_vat,
      'LessRefundOutputVAT', v_refunds.refund_vat,
      'NetOutputVATPayable', (v_sales.total_output_vat - v_refunds.refund_vat),
      'VATExemptSales', v_sales.vat_exempt_sales_base,
      'ZeroRatedSales', v_sales.zero_rated_sales_base
    )
  );

  RETURN v_report_json;
END;
$function$;