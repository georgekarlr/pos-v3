DROP FUNCTION IF EXISTS pos2_report_bir_sales_book;

CREATE OR REPLACE FUNCTION pos2_report_bir_sales_book(
  p_requesting_account_id bigint, 
  p_start_date date, 
  p_end_date date
)
RETURNS TABLE(
  reading_date date, 
  terminal_name text, 
  min_number text, 
  starting_invoice text, 
  ending_invoice text, 
  gross_sales numeric, 
  vatable_sales numeric, 
  gross_vat_amount numeric,   -- Gross Output VAT Collected (e.g. ₱170.38)
  refund_vat_amount numeric,  -- Output VAT Component Refunded (e.g. ₱25.44)
  net_vat_amount numeric,     -- Net Output VAT Payable (e.g. ₱144.94)
  vat_exempt_sales numeric, 
  zero_rated_sales numeric, 
  total_discounts numeric, 
  previous_grand_total numeric, 
  ending_grand_total numeric
)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  IF NOT pos_is_admin(p_requesting_account_id) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can view the BIR Sales Book.';
  END IF;

  RETURN QUERY
  SELECT
    z.reading_date,
    t.terminal_name,
    t.min AS min_number,
    (z.raw_json_data->'Invoices'->>'Start')::TEXT AS starting_invoice,
    (z.raw_json_data->'Invoices'->>'End')::TEXT AS ending_invoice,
    z.gross_sales,
    (z.raw_json_data->'VAT'->>'VATable')::NUMERIC AS vatable_sales,
    
    -- 1. Gross Output VAT Collected (Form 2550Q Line 15B)
    COALESCE((z.raw_json_data->'VAT'->>'GrossVATAmount')::NUMERIC, z.total_vat) AS gross_vat_amount,
    
    -- 2. Refunded Output VAT Component
    COALESCE((z.raw_json_data->'VAT'->>'RefundVAT')::NUMERIC, 0.00) AS refund_vat_amount,
    
    -- 3. Net Output VAT Payable
    COALESCE((z.raw_json_data->'VAT'->>'NetVATPayable')::NUMERIC, z.total_vat) AS net_vat_amount,
    
    (z.raw_json_data->'VAT'->>'Exempt')::NUMERIC AS vat_exempt_sales,
    COALESCE((z.raw_json_data->'VAT'->>'ZeroRated')::NUMERIC, 0.00) AS zero_rated_sales,
    z.total_discounts,
    z.old_grand_total AS previous_grand_total,
    z.new_grand_total AS ending_grand_total
  FROM pos2_z_readings z
  JOIN pos2_terminals t ON z.terminal_id = t.id
  WHERE
    z.user_id = auth.uid()
    AND z.reading_date >= p_start_date
    AND z.reading_date <= p_end_date
  ORDER BY z.reading_date DESC;
END;
$function$;