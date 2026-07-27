DROP FUNCTION IF EXISTS pos2_generate_x_reading(bigint, bigint, date);

CREATE OR REPLACE FUNCTION pos2_generate_x_reading(
  p_requesting_account_id bigint, 
  p_terminal_id bigint, 
  p_target_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  v_settings RECORD;
  v_terminal RECORD;
  v_requesting_account RECORD;
  v_order_totals RECORD;
  v_item_totals RECORD;
  v_refunds RECORD;
  v_voids NUMERIC := 0.00;
  v_payment_breakdown JSONB;
  v_total_collected NUMERIC := 0.00;
  v_report_json JSONB;
BEGIN
  -- Fetch Context
  SELECT * INTO v_settings FROM pos2_business_settings WHERE user_id = auth.uid();
  SELECT * INTO v_terminal FROM pos2_terminals WHERE id = p_terminal_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Terminal not found.'; END IF;

  SELECT * INTO v_requesting_account FROM accounts WHERE id = p_requesting_account_id;

  -- 1. Aggregate Orders
  SELECT
    MIN(invoice_number) AS starting_invoice,
    MAX(invoice_number) AS ending_invoice,
    COALESCE(SUM(total_amount), 0.00) AS completed_net_sales,
    COALESCE(SUM(sc_pwd_discount_amount), 0.00) AS sc_pwd_discount,
    COALESCE(SUM(vat_exempt_discount_amount), 0.00) AS vat_exempt_discount,
    COALESCE(SUM(promo_discount_total), 0.00) AS promo_discount
  INTO v_order_totals
  FROM pos2_orders o
  WHERE terminal_id = p_terminal_id 
    AND status = 'completed' 
    AND COALESCE(o.occurred_at, o.created_at)::DATE = p_target_date;

  -- 2. Aggregate Item Tax Breakdown
  SELECT
    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'VATable' AND (o.sc_pwd_discount_amount = 0 OR p.is_sc_pwd_eligible = FALSE)
        THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
        ELSE 0 
      END
    ), 0.00) AS vatable_sales,

    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'VATable' AND (o.sc_pwd_discount_amount = 0 OR p.is_sc_pwd_eligible = FALSE)
        THEN (((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount) * (oi.tax_rate_at_purchase / 100.0))
        ELSE 0 
      END
    ), 0.00) AS gross_vat_amount,

    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'VAT-Exempt' OR (oi.tax_type_at_purchase = 'VATable' AND o.sc_pwd_discount_amount > 0 AND p.is_sc_pwd_eligible = TRUE)
        THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
        ELSE 0 
      END
    ), 0.00) AS vat_exempt_sales,

    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'Zero-Rated'
        THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
        ELSE 0 
      END
    ), 0.00) AS zero_rated_sales

  INTO v_item_totals
  FROM pos2_order_items oi 
  JOIN pos2_orders o ON oi.order_id = o.id
  JOIN pos2_products p ON oi.product_id = p.id
  WHERE o.terminal_id = p_terminal_id 
    AND o.status = 'completed' 
    AND COALESCE(o.occurred_at, o.created_at)::DATE = p_target_date;

  -- 3. Calculate Voids and Refunds
  SELECT COALESCE(SUM(total_amount), 0.00) INTO v_voids
  FROM pos2_orders 
  WHERE terminal_id = p_terminal_id 
    AND status = 'voided' 
    AND COALESCE(occurred_at, created_at)::DATE = p_target_date;

  SELECT 
    COALESCE(SUM(r.refund_amount), 0.00) AS refund_net,
    COALESCE(SUM(r.tax_component), 0.00) AS refund_vat
  INTO v_refunds
  FROM pos2_refunds r 
  JOIN pos2_orders o ON r.order_id = o.id
  WHERE o.terminal_id = p_terminal_id 
    AND r.created_at::DATE = p_target_date;

  -- 4. Collections (Normalized Case Casing)
  SELECT 
    COALESCE(jsonb_agg(jsonb_build_object('method', sub.payment_method, 'amount', sub.total_amt)), '[]'::jsonb), 
    COALESCE(SUM(sub.total_amt), 0.00)
  INTO v_payment_breakdown, v_total_collected
  FROM (
    SELECT INITCAP(LOWER(p.payment_method)) AS payment_method, SUM(p.amount) as total_amt 
    FROM pos2_payments p 
    WHERE p.user_id = auth.uid() 
      AND p.terminal_id = p_terminal_id 
      AND p.created_at::DATE = p_target_date 
      AND p.status = 'completed' 
    GROUP BY INITCAP(LOWER(p.payment_method))
  ) sub;

  v_item_totals.vat_exempt_sales := GREATEST(v_item_totals.vat_exempt_sales - v_order_totals.sc_pwd_discount, 0.00);

  -- 5. Build Snapshot JSON
  v_report_json := jsonb_build_object(
    'ReportType', 'X-READING (MID-DAY SNAPSHOT)',
    'GeneratedAt', NOW(),
    'Business', jsonb_build_object('Name', v_settings.business_name, 'Address', v_settings.address, 'TIN', v_settings.tin),
    'Terminal', jsonb_build_object('Name', v_terminal.terminal_name, 'MIN', v_terminal.min, 'CashierName', COALESCE(v_requesting_account.person_name, v_requesting_account.name)),
    'TransactionRange', jsonb_build_object('Start', v_order_totals.starting_invoice, 'End', v_order_totals.ending_invoice),
    
    'GrossSales', (v_order_totals.completed_net_sales + v_order_totals.sc_pwd_discount + v_order_totals.vat_exempt_discount + v_order_totals.promo_discount + v_voids),
    'Deductions', jsonb_build_object(
        'Voids', v_voids, 
        'Refunds', (v_refunds.refund_net + v_refunds.refund_vat), 
        'VAT_Exempt_Discount', v_order_totals.vat_exempt_discount, 
        'SC_PWD_Discount', v_order_totals.sc_pwd_discount,        
        'Promotions', v_order_totals.promo_discount
    ),
    'NetSales', (v_order_totals.completed_net_sales - (v_refunds.refund_net + v_refunds.refund_vat)),
    
    'VAT', jsonb_build_object(
        'VATable', v_item_totals.vatable_sales, 
        'GrossVATAmount', v_item_totals.gross_vat_amount, 
        'RefundVAT', v_refunds.refund_vat,
        'NetVATPayable', (v_item_totals.gross_vat_amount - v_refunds.refund_vat),
        'VATAmount', (v_item_totals.gross_vat_amount - v_refunds.refund_vat),
        'Exempt', v_item_totals.vat_exempt_sales, 
        'ZeroRated', v_item_totals.zero_rated_sales
    ),
    'Collections', jsonb_build_object('TotalCollected', v_total_collected, 'Breakdown', v_payment_breakdown)
  );

  RETURN v_report_json;
END;
$function$;

DROP FUNCTION IF EXISTS pos2_generate_z_reading(bigint, bigint, date);

CREATE OR REPLACE FUNCTION pos2_generate_z_reading(
  p_requesting_account_id bigint, 
  p_terminal_id bigint, 
  p_target_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(success boolean, message text, data jsonb)
LANGUAGE plpgsql
AS $function$
DECLARE
  v_settings RECORD;
  v_terminal RECORD;
  v_requesting_account RECORD;
  v_order_totals RECORD;
  v_item_totals RECORD;
  v_refunds RECORD;
  v_voids NUMERIC := 0.00;
  v_net_sales NUMERIC := 0.00;
  v_gross_sales NUMERIC := 0.00;
  
  v_calculated_new_gt NUMERIC := 0.00;
  v_old_gt NUMERIC := 0.00;
  v_z_counter INT := 1;
  
  v_payment_breakdown JSONB;
  v_total_collected NUMERIC := 0.00;
  v_report_json JSONB;
BEGIN
  -- 1. SECURITY & VALIDATION
  IF NOT pos_is_admin(p_requesting_account_id) THEN 
    RETURN QUERY SELECT FALSE, 'Only Admins can generate Z-Readings.', NULL::jsonb; 
    RETURN; 
  END IF;

  IF EXISTS (SELECT 1 FROM pos2_z_readings WHERE terminal_id = p_terminal_id AND reading_date = p_target_date) THEN
    RETURN QUERY SELECT FALSE, 'Z-Reading already generated for this terminal on this date.', NULL::jsonb; 
    RETURN;
  END IF;

  -- 2. FETCH CONTEXT
  SELECT * INTO v_settings FROM pos2_business_settings WHERE user_id = auth.uid();
  SELECT * INTO v_terminal FROM pos2_terminals WHERE id = p_terminal_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Terminal not found.'; END IF;
  
  SELECT * INTO v_requesting_account FROM accounts WHERE id = p_requesting_account_id;

  -- 3. AGGREGATE ORDERS FOR TARGET DATE
  SELECT 
    MIN(invoice_number) AS starting_invoice, 
    MAX(invoice_number) AS ending_invoice, 
    MIN(id) AS start_id, 
    MAX(id) AS end_id,
    COALESCE(SUM(total_amount), 0.00) AS completed_net_sales, 
    COALESCE(SUM(sc_pwd_discount_amount), 0.00) AS sc_pwd_discount, 
    COALESCE(SUM(vat_exempt_discount_amount), 0.00) AS vat_exempt_discount,
    COALESCE(SUM(promo_discount_total), 0.00) AS promo_discount
  INTO v_order_totals 
  FROM pos2_orders o
  WHERE terminal_id = p_terminal_id 
    AND status = 'completed' 
    AND COALESCE(o.occurred_at, o.created_at)::DATE = p_target_date;

  -- 4. AGGREGATE ITEM TAX BREAKDOWN (UNIFIED BIR TAX ENGINE)
  SELECT
    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'VATable' AND (o.sc_pwd_discount_amount = 0 OR p.is_sc_pwd_eligible = FALSE)
        THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
        ELSE 0 
      END
    ), 0.00) AS vatable_sales,

    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'VATable' AND (o.sc_pwd_discount_amount = 0 OR p.is_sc_pwd_eligible = FALSE)
        THEN (((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount) * (oi.tax_rate_at_purchase / 100.0))
        ELSE 0 
      END
    ), 0.00) AS gross_vat_amount,

    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'VAT-Exempt' OR (oi.tax_type_at_purchase = 'VATable' AND o.sc_pwd_discount_amount > 0 AND p.is_sc_pwd_eligible = TRUE)
        THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
        ELSE 0 
      END
    ), 0.00) AS vat_exempt_sales,

    COALESCE(SUM(
      CASE 
        WHEN oi.tax_type_at_purchase = 'Zero-Rated'
        THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount)
        ELSE 0 
      END
    ), 0.00) AS zero_rated_sales

  INTO v_item_totals
  FROM pos2_order_items oi 
  JOIN pos2_orders o ON oi.order_id = o.id
  JOIN pos2_products p ON oi.product_id = p.id
  WHERE o.terminal_id = p_terminal_id 
    AND o.status = 'completed' 
    AND COALESCE(o.occurred_at, o.created_at)::DATE = p_target_date;

  -- 5. CALCULATE VOIDS AND REFUNDS
  SELECT COALESCE(SUM(total_amount), 0.00) INTO v_voids
  FROM pos2_orders 
  WHERE terminal_id = p_terminal_id 
    AND status = 'voided' 
    AND COALESCE(occurred_at, created_at)::DATE = p_target_date;

  SELECT 
    COALESCE(SUM(r.refund_amount), 0.00) AS refund_net,
    COALESCE(SUM(r.tax_component), 0.00) AS refund_vat
  INTO v_refunds
  FROM pos2_refunds r 
  JOIN pos2_orders o ON r.order_id = o.id
  WHERE o.terminal_id = p_terminal_id 
    AND r.created_at::DATE = p_target_date;

  -- 6. AGGREGATE CASH DRAWER COLLECTIONS
  SELECT 
    COALESCE(jsonb_agg(jsonb_build_object('method', sub.payment_method, 'amount', sub.total_amt)), '[]'::jsonb), 
    COALESCE(SUM(sub.total_amt), 0.00)
  INTO v_payment_breakdown, v_total_collected
  FROM (
    SELECT INITCAP(LOWER(p.payment_method)) AS payment_method, SUM(p.amount) as total_amt 
    FROM pos2_payments p 
    WHERE p.user_id = auth.uid() 
      AND p.terminal_id = p_terminal_id 
      AND p.created_at::DATE = p_target_date 
      AND p.status = 'completed' 
    GROUP BY INITCAP(LOWER(p.payment_method))
  ) sub;

  -- 7. PERFORM FINAL ACCOUNTING MATH
  v_net_sales := v_order_totals.completed_net_sales - (v_refunds.refund_net + v_refunds.refund_vat);
  v_gross_sales := v_order_totals.completed_net_sales + v_order_totals.sc_pwd_discount + v_order_totals.vat_exempt_discount + v_order_totals.promo_discount + v_voids;

  -- CALCULATE HISTORICAL GRAND TOTAL ACCURATELY
  SELECT COALESCE(SUM(total_amount), 0.00) INTO v_calculated_new_gt
  FROM pos2_orders
  WHERE user_id = auth.uid() 
    AND terminal_id = p_terminal_id 
    AND status = 'completed'
    AND COALESCE(occurred_at, created_at)::DATE <= p_target_date;

  v_old_gt := v_calculated_new_gt - v_net_sales;

  -- Calculate Z-Counter
  SELECT COALESCE(COUNT(*) + 1, 1) INTO v_z_counter
  FROM pos2_z_readings
  WHERE terminal_id = p_terminal_id;

  -- Deduct SC discount from Exempt bucket for display
  v_item_totals.vat_exempt_sales := GREATEST(v_item_totals.vat_exempt_sales - v_order_totals.sc_pwd_discount, 0.00);

  -- 8. BUILD THE JSON REPORT
  v_report_json := jsonb_build_object(
    'ReportType', 'Z-READING (END OF DAY)', 
    'ReadingDate', p_target_date, 
    'GeneratedAt', NOW(),
    'Business', jsonb_build_object('Name', v_settings.business_name, 'Address', v_settings.address, 'TIN', v_settings.tin),
    'Terminal', jsonb_build_object('Name', v_terminal.terminal_name, 'MIN', v_terminal.min, 'PTU', v_terminal.ptu_number, 'AdminName', COALESCE(v_requesting_account.person_name, v_requesting_account.name), 'ZCounter', v_z_counter),
    'Invoices', jsonb_build_object('Start', v_order_totals.starting_invoice, 'End', v_order_totals.ending_invoice),
    'TransactionRange', jsonb_build_object('Start', v_order_totals.starting_invoice, 'End', v_order_totals.ending_invoice),
    'GrossSales', v_gross_sales, 
    'Deductions', jsonb_build_object(
      'Voids', v_voids, 
      'Refunds', (v_refunds.refund_net + v_refunds.refund_vat), 
      'VAT_Exempt_Discount', v_order_totals.vat_exempt_discount, 
      'SC_PWD_Discount', v_order_totals.sc_pwd_discount, 
      'SC_PWD', v_order_totals.sc_pwd_discount, 
      'Promotions', v_order_totals.promo_discount
    ),
    'NetSales', v_net_sales,
    'VAT', jsonb_build_object(
      'VATable', v_item_totals.vatable_sales, 
      'GrossVATAmount', v_item_totals.gross_vat_amount, 
      'RefundVAT', v_refunds.refund_vat, 
      'NetVATPayable', (v_item_totals.gross_vat_amount - v_refunds.refund_vat), 
      'VATAmount', (v_item_totals.gross_vat_amount - v_refunds.refund_vat), 
      'Exempt', v_item_totals.vat_exempt_sales, 
      'ZeroRated', v_item_totals.zero_rated_sales
    ),
    'GrandTotals', jsonb_build_object('OldCumulative', v_old_gt, 'TodaysSales', v_net_sales, 'NewCumulative', v_calculated_new_gt),
    'Collections', jsonb_build_object('TotalCollected', v_total_collected, 'Breakdown', v_payment_breakdown),
    'SoftwareProvider', jsonb_build_object('Name', v_settings.software_provider_name, 'Address', v_settings.software_provider_address, 'TIN', v_settings.software_provider_tin, 'AccreditationNo', v_settings.software_provider_accreditation_no, 'DateIssued', v_settings.software_provider_date_issued)
  );

  -- 9. PERMANENTLY SAVE THE Z-READING
  INSERT INTO pos2_z_readings (user_id, terminal_id, account_id, reading_date, gross_sales, net_sales, total_vat, total_discounts, old_grand_total, new_grand_total, starting_invoice_id, ending_invoice_id, raw_json_data)
  VALUES (auth.uid(), p_terminal_id, p_requesting_account_id, p_target_date, v_gross_sales, v_net_sales, (v_item_totals.gross_vat_amount - v_refunds.refund_vat), (v_order_totals.sc_pwd_discount + v_order_totals.vat_exempt_discount + v_order_totals.promo_discount + v_voids + (v_refunds.refund_net + v_refunds.refund_vat)), v_old_gt, v_calculated_new_gt, v_order_totals.start_id, v_order_totals.end_id, v_report_json);

  -- 10. E-JOURNAL LOG
  INSERT INTO pos2_e_journal (user_id, terminal_id, account_id, event_type, event_description, details)
  VALUES (auth.uid(), p_terminal_id, p_requesting_account_id, 'Z_READING', 'Generated Z-Reading for ' || p_target_date, v_report_json);

  RETURN QUERY SELECT TRUE, 'Z-Reading generated and saved successfully.', v_report_json;
END;
$function$;