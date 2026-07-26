DROP FUNCTION IF EXISTS pos2_batch_catchup_z_readings(BIGINT, BIGINT);
DROP FUNCTION IF EXISTS pos2_batch_catchup_z_readings(BIGINT, BIGINT, DATE);

CREATE OR REPLACE FUNCTION pos2_batch_catchup_z_readings(
    p_requesting_account_id BIGINT,
    p_terminal_id BIGINT,
    p_current_date DATE DEFAULT CURRENT_DATE -- NEW PARAMETER
)
RETURNS TABLE(success BOOLEAN, message TEXT, data JSONB) AS $$
DECLARE
  v_date_record RECORD;
  v_single_report RECORD;
  v_all_reports JSONB[] := '{}';
  v_count INT := 0;
BEGIN
  PERFORM set_config('app.current_account_id', p_requesting_account_id::TEXT, true);

  IF NOT pos_is_admin(p_requesting_account_id) THEN
    RETURN QUERY SELECT FALSE, 'Permission denied: Only admins can process Z-Reading catch-ups.', NULL::jsonb;
    RETURN;
  END IF;

  -- Pass p_current_date down to pos2_get_unclosed_dates!
  FOR v_date_record IN SELECT * FROM pos2_get_unclosed_dates(p_terminal_id, p_current_date) 
  LOOP
    SELECT * INTO v_single_report 
    FROM pos2_generate_z_reading(p_requesting_account_id, p_terminal_id, v_date_record.unclosed_date);
    
    IF v_single_report.success = TRUE THEN
      v_all_reports := array_append(v_all_reports, v_single_report.data);
      v_count := v_count + 1;
    END IF;
  END LOOP;

  IF v_count = 0 THEN
    RETURN QUERY SELECT TRUE, 'No unclosed dates found. All Z-Readings are up to date.', '[]'::jsonb;
  ELSE
    RETURN QUERY SELECT TRUE, 'Successfully generated ' || v_count || ' missing Z-Reading(s).', to_jsonb(v_all_reports);
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 'An unexpected error occurred during catch-up: ' || SQLERRM, NULL::jsonb;
END;
$$ LANGUAGE plpgsql VOLATILE;


DROP FUNCTION IF EXISTS pos2_check_unclosed_z_readings(BIGINT);
DROP FUNCTION IF EXISTS pos2_check_unclosed_z_readings(BIGINT, DATE);

CREATE OR REPLACE FUNCTION pos2_check_unclosed_z_readings(
    p_terminal_id BIGINT,
    p_current_date DATE DEFAULT CURRENT_DATE -- NEW PARAMETER
)
RETURNS TABLE(has_unclosed_day BOOLEAN, unclosed_date DATE) AS $$
DECLARE
  v_last_sale_date DATE;
  v_has_z_reading BOOLEAN;
BEGIN
  -- Find the created_at date of the most recent sale BEFORE p_current_date
  SELECT o.created_at::DATE INTO v_last_sale_date
  FROM pos2_orders o
  WHERE o.user_id = auth.uid()
    AND o.terminal_id = p_terminal_id 
    AND o.status = 'completed'
    AND o.created_at::DATE < p_current_date -- UPDATED: Uses p_current_date
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF v_last_sale_date IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::DATE;
    RETURN;
  END IF;

  -- Check if a Z-Reading exists for that past record date
  SELECT EXISTS (
    SELECT 1 FROM pos2_z_readings 
    WHERE terminal_id = p_terminal_id AND reading_date = v_last_sale_date
  ) INTO v_has_z_reading;

  IF v_has_z_reading = FALSE THEN
    RETURN QUERY SELECT TRUE, v_last_sale_date;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::DATE;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

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
  v_gross_sales NUMERIC;
  
  -- Grand Total variables
  v_calculated_new_gt NUMERIC;
  v_old_gt NUMERIC;
  
  v_payment_breakdown JSONB;
  v_total_collected NUMERIC;
  v_report_json JSONB;
BEGIN
  -- 1. SECURITY & VALIDATION
  IF NOT pos_is_admin(p_requesting_account_id) THEN RETURN QUERY SELECT FALSE, 'Only Admins can generate Z-Readings.', NULL::jsonb; RETURN; END IF;
  IF EXISTS (SELECT 1 FROM pos2_z_readings WHERE terminal_id = p_terminal_id AND reading_date = p_target_date) THEN
    RETURN QUERY SELECT FALSE, 'Z-Reading already generated for this terminal on this date.', NULL::jsonb; RETURN;
  END IF;

  -- 2. FETCH CONTEXT
  SELECT * INTO v_settings FROM pos2_business_settings WHERE user_id = auth.uid();
  SELECT * INTO v_terminal FROM pos2_terminals WHERE id = p_terminal_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Terminal not found.'; END IF;
  
  SELECT * INTO v_requesting_account FROM accounts WHERE id = p_requesting_account_id;

  -- 3. AGGREGATE ORDERS FOR TARGET DATE
  SELECT MIN(invoice_number) AS starting_invoice, MAX(invoice_number) AS ending_invoice, MIN(id) AS start_id, MAX(id) AS end_id,
    COALESCE(SUM(total_amount), 0.00) AS completed_net_sales, 
    COALESCE(SUM(sc_pwd_discount_amount), 0.00) AS sc_pwd_discount, 
    COALESCE(SUM(vat_exempt_discount_amount), 0.00) AS vat_exempt_discount,
    COALESCE(SUM(promo_discount_total), 0.00) AS promo_discount
  INTO v_order_totals FROM pos2_orders o
  WHERE terminal_id = p_terminal_id AND status = 'completed' AND o.created_at::DATE = p_target_date;

  -- 4. AGGREGATE ORDER ITEMS
  SELECT
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VATable' THEN (oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount ELSE 0 END), 0.00) AS vatable_sales,
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VATable' THEN ((oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount) * (oi.tax_rate_at_purchase / 100.0) ELSE 0 END), 0.00) AS vat_amount,
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'VAT-Exempt' THEN (oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount ELSE 0 END), 0.00) AS vat_exempt_sales,
    COALESCE(SUM(CASE WHEN oi.tax_type_at_purchase = 'Zero-Rated' THEN (oi.base_price_at_purchase * oi.quantity) - oi.promo_discount_amount ELSE 0 END), 0.00) AS zero_rated_sales
  INTO v_item_totals FROM pos2_order_items oi JOIN pos2_orders o ON oi.order_id = o.id
  WHERE o.terminal_id = p_terminal_id AND o.status = 'completed' AND o.created_at::DATE = p_target_date;

  -- 5. CALCULATE DEDUCTIONS
  SELECT COALESCE(SUM(total_amount), 0.00) INTO v_voids FROM pos2_orders WHERE terminal_id = p_terminal_id AND status = 'voided' AND created_at::DATE = p_target_date;
  SELECT COALESCE(SUM(r.refund_amount + r.tax_component), 0.00) INTO v_refunds FROM pos2_refunds r JOIN pos2_orders o ON r.order_id = o.id WHERE o.terminal_id = p_terminal_id AND r.created_at::DATE = p_target_date;

  -- 6. AGGREGATE CASH DRAWER COLLECTIONS
  SELECT COALESCE(jsonb_agg(jsonb_build_object('method', sub.payment_method, 'amount', sub.total_amt)), '[]'::jsonb), COALESCE(SUM(sub.total_amt), 0.00)
  INTO v_payment_breakdown, v_total_collected
  FROM (
    SELECT p.payment_method, SUM(p.amount) as total_amt FROM pos2_payments p 
    WHERE p.user_id = auth.uid() AND p.terminal_id = p_terminal_id AND p.created_at::DATE = p_target_date AND p.status = 'completed' GROUP BY p.payment_method
  ) sub;

  -- 7. PERFORM FINAL ACCOUNTING MATH
  v_net_sales := v_order_totals.completed_net_sales - v_refunds;
  v_gross_sales := v_order_totals.completed_net_sales + v_order_totals.sc_pwd_discount + v_order_totals.vat_exempt_discount + v_order_totals.promo_discount + v_voids;

  -- === CRITICAL FIX: CALCULATE HISTORICAL GRAND TOTAL ACCURATELY ===
  -- Sum ALL completed sales up to the target date to find the true cumulative GT at that point in time
  SELECT COALESCE(SUM(total_amount), 0.00) INTO v_calculated_new_gt
  FROM pos2_orders
  WHERE user_id = auth.uid() 
    AND terminal_id = p_terminal_id 
    AND status = 'completed'
    AND created_at::DATE <= p_target_date; -- Sum everything up to target date

  v_old_gt := v_calculated_new_gt - v_net_sales;

  -- Deduct SC discount from Exempt bucket for display
  v_item_totals.vat_exempt_sales := v_item_totals.vat_exempt_sales - v_order_totals.sc_pwd_discount;

  -- 8. BUILD THE JSON REPORT
  v_report_json := jsonb_build_object(
    'ReportType', 'Z-READING (END OF DAY)', 'ReadingDate', p_target_date, 'GeneratedAt', NOW(),
    'Business', jsonb_build_object('Name', v_settings.business_name, 'Address', v_settings.address, 'TIN', v_settings.tin),
    'Terminal', jsonb_build_object('Name', v_terminal.terminal_name, 'MIN', v_terminal.min, 'PTU', v_terminal.ptu_number, 'AdminName', COALESCE(v_requesting_account.person_name, v_requesting_account.name)),
    'Invoices', jsonb_build_object('Start', v_order_totals.starting_invoice, 'End', v_order_totals.ending_invoice),
    'GrossSales', v_gross_sales, 
    'Deductions', jsonb_build_object('Voids', v_voids, 'Refunds', v_refunds, 'VAT_Exempt_Discount', v_order_totals.vat_exempt_discount, 'SC_PWD', v_order_totals.sc_pwd_discount, 'Promotions', v_order_totals.promo_discount),
    'NetSales', v_net_sales,
    'VAT', jsonb_build_object('VATable', v_item_totals.vatable_sales, 'VATAmount', v_item_totals.vat_amount, 'Exempt', v_item_totals.vat_exempt_sales, 'ZeroRated', v_item_totals.zero_rated_sales),
    'GrandTotals', jsonb_build_object('OldCumulative', v_old_gt, 'TodaysSales', v_net_sales, 'NewCumulative', v_calculated_new_gt),
    'Collections', jsonb_build_object('TotalCollected', v_total_collected, 'Breakdown', v_payment_breakdown),
    'SoftwareProvider', jsonb_build_object('Name', v_settings.software_provider_name, 'Address', v_settings.software_provider_address, 'TIN', v_settings.software_provider_tin, 'AccreditationNo', v_settings.software_provider_accreditation_no, 'DateIssued', v_settings.software_provider_date_issued)
  );

  -- 9. PERMANENTLY SAVE THE Z-READING
  INSERT INTO pos2_z_readings (user_id, terminal_id, account_id, reading_date, gross_sales, net_sales, total_vat, total_discounts, old_grand_total, new_grand_total, starting_invoice_id, ending_invoice_id, raw_json_data)
  VALUES (auth.uid(), p_terminal_id, p_requesting_account_id, p_target_date, v_gross_sales, v_net_sales, v_item_totals.vat_amount, (v_order_totals.sc_pwd_discount + v_order_totals.vat_exempt_discount + v_order_totals.promo_discount + v_voids + v_refunds), v_old_gt, v_calculated_new_gt, v_order_totals.start_id, v_order_totals.end_id, v_report_json);

  -- 10. E-JOURNAL LOG
  INSERT INTO pos2_e_journal (user_id, terminal_id, account_id, event_type, event_description, details)
  VALUES (auth.uid(), p_terminal_id, p_requesting_account_id, 'Z_READING', 'Generated Z-Reading for ' || p_target_date, v_report_json);

  RETURN QUERY SELECT TRUE, 'Z-Reading generated and saved successfully.', v_report_json;
END;
$$ LANGUAGE plpgsql VOLATILE;