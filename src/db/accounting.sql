DROP FUNCTION IF EXISTS pos2_get_bir_tax_ledger(BIGINT, DATE, DATE);

CREATE OR REPLACE FUNCTION pos2_get_bir_tax_ledger(
    p_requesting_account_id BIGINT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSONB AS $$
DECLARE
  v_billing_type TEXT;
  v_sales RECORD;
  v_item_bases RECORD;
  v_refunds NUMERIC;
  v_report_json JSONB;
  v_percentage_tax_rate NUMERIC := 3.00; -- Standard 3% Percentage Tax for Non-VAT in PH
BEGIN
  -- 1. SECURITY CHECK
  IF NOT pos_is_admin(p_requesting_account_id) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can view BIR Tax Ledgers.';
  END IF;

  -- 2. FETCH BUSINESS VAT STATUS
  SELECT COALESCE(billing_type, 'NON-VAT') INTO v_billing_type 
  FROM st_user_access WHERE user_id = auth.uid();

  -- 3. AGGREGATE ORDERS DATA
  SELECT 
    COALESCE(SUM(o.subtotal_amount), 0.00) AS gross_subtotal,
    COALESCE(SUM(o.total_amount), 0.00) AS net_sales_cash,
    COALESCE(SUM(o.tax_amount), 0.00) AS vat_collected,
    COALESCE(SUM(o.sc_pwd_discount_amount), 0.00) AS sc_pwd_discounts,
    COALESCE(SUM(o.vat_exempt_discount_amount), 0.00) AS vat_exemption_discounts,
    COALESCE(SUM(o.promo_discount_total), 0.00) AS promo_discounts
  INTO v_sales
  FROM pos2_orders o
  WHERE o.user_id = auth.uid() 
    AND o.status = 'completed'
    AND COALESCE(o.occurred_at, o.created_at)::DATE >= p_start_date
    AND COALESCE(o.occurred_at, o.created_at)::DATE <= p_end_date;

  -- 4. AGGREGATE ORDER ITEMS (For exact VAT Bucket Bases)
  SELECT
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VATable' THEN (oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount ELSE 0 END), 0.00) AS vatable_sales_base,
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VAT-Exempt' THEN (oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount ELSE 0 END), 0.00) AS vat_exempt_sales_base,
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'Zero-Rated' THEN (oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount ELSE 0 END), 0.00) AS zero_rated_sales_base
  INTO v_item_bases 
  FROM pos2_order_items oi JOIN pos2_orders o ON oi.order_id = o.id
  WHERE o.user_id = auth.uid() 
    AND o.status = 'completed' 
    AND COALESCE(o.occurred_at, o.created_at)::DATE >= p_start_date
    AND COALESCE(o.occurred_at, o.created_at)::DATE <= p_end_date;

  -- 5. AGGREGATE REFUNDS
  SELECT COALESCE(SUM(r.refund_amount + r.tax_component), 0.00) INTO v_refunds
  FROM pos2_refunds r
  WHERE r.user_id = auth.uid()
    AND r.created_at::DATE >= p_start_date
    AND r.created_at::DATE <= p_end_date;

  -- Deduct SC discount from Exempt bucket for exact balancing
  v_item_bases.vat_exempt_sales_base := v_item_bases.vat_exempt_sales_base - v_sales.sc_pwd_discounts;

  -- 6. BUILD DYNAMIC TAX RETURN JSON
  IF v_billing_type = 'VAT' THEN
    -- =========================================================
    -- VAT-REGISTERED TAXPAYER (BIR Form 2550Q)
    -- =========================================================
    v_report_json := jsonb_build_object(
      'TaxRegistrationType', 'VAT-REGISTERED',
      'TargetForm', 'BIR Form 2550Q (Quarterly Value-Added Tax Return)',
      'DateRange', jsonb_build_object('Start', p_start_date, 'End', p_end_date),
      'GeneratedAt', NOW(),
      'TaxDeclaration', jsonb_build_object(
          'GrossSales', v_sales.gross_subtotal,
          'LessRefundsAndVoids', v_refunds,
          'VATableSalesBase', v_item_bases.vatable_sales_base,         -- Form 2550Q Line 15A
          'OutputVATDue', v_sales.vat_collected,                      -- Form 2550Q Line 15B (12% Tax Owed)
          'VATExemptSales', v_item_bases.vat_exempt_sales_base,        -- Form 2550Q Line 18
          'ZeroRatedSales', v_item_bases.zero_rated_sales_base,        -- Form 2550Q Line 17
          'SC_PWD_Discounts_Claimed', v_sales.sc_pwd_discounts,
          'TotalNetTaxLiability', v_sales.vat_collected                 -- Total VAT to remit to BIR
      )
    );
  ELSE
    -- =========================================================
    -- NON-VAT TAXPAYER (BIR Form 2551Q - Percentage Tax)
    -- =========================================================
    v_report_json := jsonb_build_object(
      'TaxRegistrationType', 'NON-VAT (PERCENTAGE TAXPAYER)',
      'TargetForm', 'BIR Form 2551Q (Quarterly Percentage Tax Return)',
      'DateRange', jsonb_build_object('Start', p_start_date, 'End', p_end_date),
      'GeneratedAt', NOW(),
      'TaxDeclaration', jsonb_build_object(
          'GrossReceipts', (v_sales.net_sales_cash - v_refunds),     -- Form 2551Q Taxable Base
          'ApplicableTaxRate', v_percentage_tax_rate || '%',
          'PercentageTaxDue', ROUND((v_sales.net_sales_cash - v_refunds) * (v_percentage_tax_rate / 100.0), 2) -- Tax Owed
      )
    );
  END IF;

  RETURN v_report_json;
END;
$$ LANGUAGE plpgsql STABLE;

DROP FUNCTION IF EXISTS pos2_get_ar_aging_report(BIGINT);

CREATE OR REPLACE FUNCTION pos2_get_ar_aging_report(
    p_requesting_account_id BIGINT
)
RETURNS TABLE(
    customer_id BIGINT,
    customer_name TEXT,
    phone_number TEXT,
    current_amount NUMERIC,      -- 0 - 30 days old
    days_31_60 NUMERIC,          -- 31 - 60 days late
    days_61_90 NUMERIC,          -- 61 - 90 days late
    days_over_90 NUMERIC,        -- 90+ days late (High risk bad debt!)
    total_balance NUMERIC
) AS $$
BEGIN
  IF NOT pos_is_admin(p_requesting_account_id) THEN
    RAISE EXCEPTION 'Permission denied.';
  END IF;

  RETURN QUERY
  WITH customer_debts AS (
    -- Group Running Tab Debts
    SELECT 
      da.customer_id,
      da.current_balance AS debt_amt,
      CURRENT_DATE - da.updated_at::DATE AS age_days
    FROM debt_accounts da
    WHERE da.user_id = auth.uid() AND da.current_balance > 0

    UNION ALL

    -- Group Installment Unpaid Schedules
    SELECT 
      c.customer_id,
      (s.amount_due - s.amount_paid) AS debt_amt,
      CURRENT_DATE - s.due_date AS age_days
    FROM pos2_installment_schedules s
    JOIN pos2_installment_contracts c ON s.contract_id = c.id
    WHERE c.user_id = auth.uid() AND s.status != 'paid' AND (s.amount_due - s.amount_paid) > 0
  )
  SELECT 
    cust.id AS customer_id,
    cust.full_name AS customer_name,
    cust.phone_number,
    
    -- Bucketing Math
    COALESCE(SUM(CASE WHEN cd.age_days <= 30 THEN cd.debt_amt ELSE 0 END), 0.00) AS current_amount,
    COALESCE(SUM(CASE WHEN cd.age_days BETWEEN 31 AND 60 THEN cd.debt_amt ELSE 0 END), 0.00) AS days_31_60,
    COALESCE(SUM(CASE WHEN cd.age_days BETWEEN 61 AND 90 THEN cd.debt_amt ELSE 0 END), 0.00) AS days_61_90,
    COALESCE(SUM(CASE WHEN cd.age_days > 90 THEN cd.debt_amt ELSE 0 END), 0.00) AS days_over_90,
    
    COALESCE(SUM(cd.debt_amt), 0.00) AS total_balance
  FROM pos2_customers cust
  JOIN customer_debts cd ON cust.id = cd.customer_id
  WHERE cust.user_id = auth.uid()
  GROUP BY cust.id, cust.full_name, cust.phone_number
  ORDER BY total_balance DESC;
END;
$$ LANGUAGE plpgsql STABLE;

DROP FUNCTION IF EXISTS pos2_get_pnl_statement(BIGINT, TIMESTAMP, TIMESTAMP);

CREATE OR REPLACE FUNCTION pos2_get_pnl_statement(
    p_requesting_account_id BIGINT,
    p_start_date TIMESTAMP,
    p_end_date TIMESTAMP
)
RETURNS JSONB AS $$
DECLARE
  v_revenue RECORD;
  v_cogs NUMERIC;
  v_operating_expenses NUMERIC;
  v_gross_profit NUMERIC;
  v_net_operating_income NUMERIC;
  v_report_json JSONB;
BEGIN
  -- Security check
  IF NOT pos_is_admin(p_requesting_account_id) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can view P&L Statements.';
  END IF;

  -- 1. CALCULATE REVENUE & DISCOUNTS
  SELECT 
    COALESCE(SUM(subtotal_amount), 0.00) AS gross_revenue,
    COALESCE(SUM(sc_pwd_discount_amount), 0.00) AS total_sc_pwd_discounts,
    COALESCE(SUM(vat_exempt_discount_amount), 0.00) AS total_vat_exemptions,
    COALESCE(SUM(promo_discount_total), 0.00) AS total_promo_discounts,
    COALESCE(SUM(tax_amount), 0.00) AS total_vat_collected,
    COALESCE(SUM(total_amount), 0.00) AS net_sales_cash_realized
  INTO v_revenue
  FROM pos2_orders
  WHERE user_id = auth.uid()
    AND status = 'completed'
    AND COALESCE(occurred_at, created_at) >= p_start_date
    AND COALESCE(occurred_at, created_at) <= p_end_date;

  -- 2. CALCULATE COST OF GOODS SOLD (COGS)
  -- Sum of (Unit Supplier Cost * Quantity Sold) for all completed sales in range
  SELECT COALESCE(SUM(oi.cost_price_at_purchase * oi.quantity), 0.00)
  INTO v_cogs
  FROM pos2_order_items oi
  JOIN pos2_orders o ON oi.order_id = o.id
  WHERE o.user_id = auth.uid()
    AND o.status = 'completed'
    AND COALESCE(o.occurred_at, o.created_at) >= p_start_date
    AND COALESCE(o.occurred_at, o.created_at) <= p_end_date;

  -- 3. CALCULATE OPERATING EXPENSES (Petty Cash Outflows)
  -- Sum of all CASH_OUT actions recorded via pos2_manage_petty_cash
  SELECT COALESCE(SUM(ABS(amount)), 0.00)
  INTO v_operating_expenses
  FROM pos2_payments
  WHERE user_id = auth.uid()
    AND payment_method = 'Petty Cash'
    AND amount < 0 -- Negative values represent cash paid OUT for expenses
    AND created_at >= p_start_date
    AND created_at <= p_end_date;

  -- 4. PERFORM FINANCIAL STATEMENT MATH
  -- Gross Profit = (Net Realized Sales - VAT) - COGS
  v_gross_profit := (v_revenue.net_sales_cash_realized - v_revenue.total_vat_collected) - v_cogs;
  
  -- Net Operating Income = Gross Profit - Operating Expenses
  v_net_operating_income := v_gross_profit - v_operating_expenses;

  -- 5. ASSEMBLE P&L STATEMENT JSON
  v_report_json := jsonb_build_object(
    'StatementType', 'PROFIT AND LOSS STATEMENT (INCOME STATEMENT)',
    'DateRange', jsonb_build_object('Start', p_start_date, 'End', p_end_date),
    'GeneratedAt', NOW(),
    
    'Revenue', jsonb_build_object(
        'GrossShelfRevenue', v_revenue.gross_revenue,
        'LessPromoDiscounts', v_revenue.total_promo_discounts,
        'LessSCPWDDiscounts', v_revenue.total_sc_pwd_discounts,
        'LessVATExemptions', v_revenue.total_vat_exemptions,
        'NetRevenueRealized', v_revenue.net_sales_cash_realized
    ),
    
    'CostOfGoodsSold', jsonb_build_object(
        'TotalCOGS', v_cogs,
        'GrossProfit', v_gross_profit,
        'GrossProfitMarginPercent', CASE WHEN v_revenue.net_sales_cash_realized > 0 THEN ROUND((v_gross_profit / v_revenue.net_sales_cash_realized) * 100, 2) ELSE 0.00 END
    ),
    
    'OperatingExpenses', jsonb_build_object(
        'PettyCashPayouts', v_operating_expenses
    ),
    
    'NetIncome', jsonb_build_object(
        'NetOperatingProfit', v_net_operating_income,
        'NetProfitMarginPercent', CASE WHEN v_revenue.net_sales_cash_realized > 0 THEN ROUND((v_net_operating_income / v_revenue.net_sales_cash_realized) * 100, 2) ELSE 0.00 END
    )
  );

  RETURN v_report_json;
END;
$$ LANGUAGE plpgsql STABLE;