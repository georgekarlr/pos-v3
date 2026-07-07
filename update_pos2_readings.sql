DROP FUNCTION IF EXISTS pos2_generate_z_reading(BIGINT, BIGINT, DATE);

CREATE OR REPLACE FUNCTION pos2_generate_z_reading(
    p_requesting_account_id BIGINT,
    p_terminal_id BIGINT,
    p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(success BOOLEAN, message TEXT, data JSONB) AS $$
DECLARE
  v_settings RECORD;
  v_terminal RECORD;
  v_requesting_account RECORD;
  v_order_totals RECORD;
  v_item_totals RECORD;
  v_refunds NUMERIC;
  v_voids NUMERIC;
  v_net_sales NUMERIC;
  v_old_gt NUMERIC;
  v_payment_breakdown JSONB;
  v_total_collected NUMERIC;
  v_report_json JSONB;
BEGIN
  -- 1. Security & Validation
  IF NOT pos_is_admin(p_requesting_account_id) THEN RETURN QUERY SELECT FALSE, 'Only Admins can generate Z-Readings.', NULL::jsonb; RETURN; END IF;
  IF EXISTS (SELECT 1 FROM pos2_z_readings WHERE terminal_id = p_terminal_id AND reading_date = p_target_date) THEN
    RETURN QUERY SELECT FALSE, 'Z-Reading already generated for this terminal on this date.', NULL::jsonb; RETURN;
  END IF;

  SELECT * INTO v_settings FROM pos2_business_settings WHERE user_id = auth.uid();
  SELECT * INTO v_terminal FROM pos2_terminals WHERE id = p_terminal_id AND user_id = auth.uid();
  SELECT * INTO v_requesting_account FROM accounts WHERE id = p_requesting_account_id;

  -- 2. Aggregate Orders (No fan-out)
  SELECT MIN(invoice_number) AS starting_invoice, MAX(invoice_number) AS ending_invoice, MIN(id) AS start_id, MAX(id) AS end_id,
    COALESCE(SUM(total_amount), 0.00) AS completed_sales_total, COALESCE(SUM(sc_pwd_discount_amount), 0.00) AS sc_pwd_discount, COALESCE(SUM(regular_discount_amount), 0.00) AS regular_discount
  INTO v_order_totals FROM pos2_orders
  WHERE terminal_id = p_terminal_id AND status = 'completed' AND COALESCE(occurred_at, created_at)::DATE = p_target_date;

  -- 3. Aggregate Items
  SELECT
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VATable' THEN oi.base_price_at_purchase * oi.quantity ELSE 0 END), 0.00) AS vatable_sales,
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VATable' THEN (oi.base_price_at_purchase * oi.quantity) * (oi.tax_rate_at_purchase / 100.0) ELSE 0 END), 0.00) AS vat_amount,
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VAT-Exempt' THEN oi.base_price_at_purchase * oi.quantity ELSE 0 END), 0.00) AS vat_exempt_sales,
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'Zero-Rated' THEN oi.base_price_at_purchase * oi.quantity ELSE 0 END), 0.00) AS zero_rated_sales
  INTO v_item_totals FROM pos2_order_items oi JOIN pos2_orders o ON oi.order_id = o.id
  WHERE o.terminal_id = p_terminal_id AND o.status = 'completed' AND COALESCE(o.occurred_at, o.created_at)::DATE = p_target_date;

  -- 4. Calculate Voids & Refunds
  SELECT COALESCE(SUM(total_amount), 0.00) INTO v_voids FROM pos2_orders WHERE terminal_id = p_terminal_id AND status = 'voided' AND COALESCE(occurred_at, created_at)::DATE = p_target_date;
  SELECT COALESCE(SUM(r.refund_amount + r.tax_component), 0.00) INTO v_refunds FROM pos2_refunds r JOIN pos2_orders o ON r.order_id = o.id WHERE o.terminal_id = p_terminal_id AND r.created_at::DATE = p_target_date;

  -- 5. Calculate Actual Collections (Cash Drawer)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('method', sub.payment_method, 'amount', sub.total_amt)), '[]'::jsonb), COALESCE(SUM(sub.total_amt), 0.00)
  INTO v_payment_breakdown, v_total_collected
  FROM (
    SELECT p.payment_method, SUM(p.amount) as total_amt FROM pos2_payments p JOIN pos2_orders o ON p.order_id = o.id
    WHERE o.terminal_id = p_terminal_id AND p.created_at::DATE = p_target_date AND p.status = 'completed' GROUP BY p.payment_method
  ) sub;

  -- 6. Math and JSON Build
  v_net_sales := v_order_totals.completed_sales_total - v_order_totals.sc_pwd_discount - v_order_totals.regular_discount - v_refunds;
  v_old_gt := v_terminal.cumulative_grand_total - v_net_sales;

  v_report_json := jsonb_build_object(
    'ReportType', 'Z-READING (END OF DAY)', 'ReadingDate', p_target_date, 'GeneratedAt', NOW(),
    'Business', jsonb_build_object('Name', v_settings.business_name, 'Address', v_settings.address, 'TIN', v_settings.tin),
    'Terminal', jsonb_build_object('Name', v_terminal.terminal_name, 'MIN', v_terminal.min, 'PTU', v_terminal.ptu_number, 'AdminName', COALESCE(v_requesting_account.person_name, v_requesting_account.name)),
    'Invoices', jsonb_build_object('Start', v_order_totals.starting_invoice, 'End', v_order_totals.ending_invoice),
    'GrossSales', (v_order_totals.completed_sales_total + v_voids), 
    'Deductions', jsonb_build_object('Voids', v_voids, 'Refunds', v_refunds, 'SC_PWD', v_order_totals.sc_pwd_discount, 'Regular', v_order_totals.regular_discount),
    'NetSales', v_net_sales,
    'VAT', jsonb_build_object('VATable', v_item_totals.vatable_sales, 'VATAmount', v_item_totals.vat_amount, 'Exempt', v_item_totals.vat_exempt_sales, 'ZeroRated', v_item_totals.zero_rated_sales),
    'GrandTotals', jsonb_build_object('OldCumulative', v_old_gt, 'TodaysSales', v_net_sales, 'NewCumulative', v_terminal.cumulative_grand_total),
    'Collections', jsonb_build_object('TotalCollected', v_total_collected, 'Breakdown', v_payment_breakdown) -- NEW: Cash Drawer info
  );

  -- 7. Save and Log
  INSERT INTO pos2_z_readings (user_id, terminal_id, account_id, reading_date, gross_sales, net_sales, total_vat, total_discounts, old_grand_total, new_grand_total, starting_invoice_id, ending_invoice_id, raw_json_data)
  VALUES (auth.uid(), p_terminal_id, p_requesting_account_id, p_target_date, (v_order_totals.completed_sales_total + v_voids), v_net_sales, v_item_totals.vat_amount, (v_order_totals.sc_pwd_discount + v_order_totals.regular_discount + v_voids + v_refunds), v_old_gt, v_terminal.cumulative_grand_total, v_order_totals.start_id, v_order_totals.end_id, v_report_json);

  INSERT INTO pos2_e_journal (user_id, terminal_id, account_id, event_type, event_description)
  VALUES (auth.uid(), p_terminal_id, p_requesting_account_id, 'Z_READING', 'Generated Z-Reading for ' || p_target_date);

  RETURN QUERY SELECT TRUE, 'Z-Reading generated successfully.', v_report_json;
END;
$$ LANGUAGE plpgsql VOLATILE;

DROP FUNCTION IF EXISTS pos2_generate_x_reading(BIGINT, BIGINT, DATE);

CREATE OR REPLACE FUNCTION pos2_generate_x_reading(
    p_requesting_account_id BIGINT, 
    p_terminal_id BIGINT,
    p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_settings RECORD;
  v_terminal RECORD;
  v_requesting_account RECORD;
  v_order_totals RECORD; -- Separated to fix fan-out bug
  v_item_totals RECORD;  -- Separated to fix fan-out bug
  v_refunds NUMERIC;
  v_voids NUMERIC;
  v_payment_breakdown JSONB;
  v_total_collected NUMERIC;
BEGIN
  -- 1. Fetch Settings & Terminal
  SELECT * INTO v_settings FROM pos2_business_settings WHERE user_id = auth.uid();
  SELECT * INTO v_terminal FROM pos2_terminals WHERE id = p_terminal_id AND user_id = auth.uid();
  SELECT * INTO v_requesting_account FROM accounts WHERE id = p_requesting_account_id;

  -- 2. Aggregate Orders (Solves the duplicate gross sales bug)
  SELECT
    MIN(invoice_number) AS starting_invoice,
    MAX(invoice_number) AS ending_invoice,
    COALESCE(SUM(total_amount), 0.00) AS completed_sales_total,
    COALESCE(SUM(sc_pwd_discount_amount), 0.00) AS sc_pwd_discount,
    COALESCE(SUM(regular_discount_amount), 0.00) AS regular_discount
  INTO v_order_totals
  FROM pos2_orders
  WHERE terminal_id = p_terminal_id AND status = 'completed' AND COALESCE(occurred_at, created_at)::DATE = p_target_date;

  -- 3. Aggregate Order Items for Taxes
  SELECT
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VATable' THEN oi.base_price_at_purchase * oi.quantity ELSE 0 END), 0.00) AS vatable_sales,
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VATable' THEN (oi.base_price_at_purchase * oi.quantity) * (oi.tax_rate_at_purchase / 100.0) ELSE 0 END), 0.00) AS vat_amount,
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VAT-Exempt' THEN oi.base_price_at_purchase * oi.quantity ELSE 0 END), 0.00) AS vat_exempt_sales,
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'Zero-Rated' THEN oi.base_price_at_purchase * oi.quantity ELSE 0 END), 0.00) AS zero_rated_sales
  INTO v_item_totals
  FROM pos2_order_items oi JOIN pos2_orders o ON oi.order_id = o.id
  WHERE o.terminal_id = p_terminal_id AND o.status = 'completed' AND COALESCE(o.occurred_at, o.created_at)::DATE = p_target_date;

  -- 4. Calculate Voids and Refunds
  SELECT COALESCE(SUM(total_amount), 0.00) INTO v_voids
  FROM pos2_orders WHERE terminal_id = p_terminal_id AND status = 'voided' AND COALESCE(occurred_at, created_at)::DATE = p_target_date;

  SELECT COALESCE(SUM(r.refund_amount + r.tax_component), 0.00) INTO v_refunds
  FROM pos2_refunds r JOIN pos2_orders o ON r.order_id = o.id
  WHERE o.terminal_id = p_terminal_id AND r.created_at::DATE = p_target_date;

  -- 5. NEW: Aggregate Actual Payments Collected Today (For the Cash Drawer)
  SELECT 
    COALESCE(jsonb_agg(jsonb_build_object('method', sub.payment_method, 'amount', sub.total_amt)), '[]'::jsonb),
    COALESCE(SUM(sub.total_amt), 0.00)
  INTO v_payment_breakdown, v_total_collected
  FROM (
    SELECT p.payment_method, SUM(p.amount) as total_amt
    FROM pos2_payments p JOIN pos2_orders o ON p.order_id = o.id
    WHERE o.terminal_id = p_terminal_id AND p.created_at::DATE = p_target_date AND p.status = 'completed'
    GROUP BY p.payment_method
  ) sub;

  -- 6. Return the Snapshot JSON
  RETURN jsonb_build_object(
    'ReportType', 'X-READING (MID-DAY SNAPSHOT)',
    'GeneratedAt', NOW(),
    'Terminal', jsonb_build_object('Name', v_terminal.terminal_name, 'MIN', v_terminal.min, 'CashierName', COALESCE(v_requesting_account.person_name, v_requesting_account.name)),
    'TransactionRange', jsonb_build_object('Start', v_order_totals.starting_invoice, 'End', v_order_totals.ending_invoice),
    
    -- The Accounting Section (For BIR)
    'GrossSales', (v_order_totals.completed_sales_total + v_voids),
    'Deductions', jsonb_build_object('SC_PWD', v_order_totals.sc_pwd_discount, 'Regular', v_order_totals.regular_discount, 'Refunds', v_refunds, 'Voids', v_voids),
    'NetSales', v_order_totals.completed_sales_total - v_order_totals.sc_pwd_discount - v_order_totals.regular_discount - v_refunds,
    'VAT', jsonb_build_object('VATable', v_item_totals.vatable_sales, 'VATAmount', v_item_totals.vat_amount, 'Exempt', v_item_totals.vat_exempt_sales, 'ZeroRated', v_item_totals.zero_rated_sales),
    
    -- NEW: The Cash Drawer Section (Actual money collected today)
    'Collections', jsonb_build_object(
        'TotalCollected', v_total_collected,
        'Breakdown', v_payment_breakdown
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;
