DROP FUNCTION IF EXISTS pos2_create_sale CASCADE;

CREATE OR REPLACE FUNCTION pos2_create_sale(
    p_account_id BIGINT,
    p_terminal_id BIGINT, -- NEW: Must specify which machine is processing the sale
    p_customer_id BIGINT,
    p_cart_items JSONB,
    p_payments JSONB,
    p_notes TEXT,
    p_total NUMERIC,      -- Client's total (for verification)
    p_tax NUMERIC,        -- Client's tax (for verification)
    p_total_tendered NUMERIC,
    p_sc_pwd_discount NUMERIC DEFAULT 0.00, -- NEW: Separate legally mandated discounts
    p_regular_discount NUMERIC DEFAULT 0.00, -- NEW: Separate regular discounts
    p_occurred_at TIMESTAMP DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT, data JSONB) AS $$
DECLARE
  v_order_id BIGINT;
  v_terminal RECORD;
  v_new_invoice_number TEXT;
  cart_item RECORD;
  payment_item RECORD;
  
  -- Server-side calculation variables
  v_server_gross_subtotal NUMERIC := 0.00;
  v_server_tax NUMERIC := 0.00;
  v_server_total_net_due NUMERIC := 0.00;
  v_change_due NUMERIC := 0.00;
  
  -- Product variables
  v_product RECORD;
  v_line_gross NUMERIC;
  v_line_tax NUMERIC;
  
  v_transaction_time TIMESTAMP;
BEGIN
  -- 1. ACQUIRE TERMINAL & GENERATE INVOICE NUMBER (CRITICAL FOR BIR)
  -- We use FOR UPDATE to lock the row, preventing two sales from getting the same invoice number.
  SELECT * INTO v_terminal FROM pos2_terminals 
  WHERE id = p_terminal_id AND user_id = auth.uid() AND is_active = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active Terminal with ID % not found.', p_terminal_id;
  END IF;

  -- Generate the new 10-digit sequential invoice number
  v_new_invoice_number := LPAD((v_terminal.current_invoice_number + 1)::TEXT, 10, '0');

  -- 2. SERVER-SIDE VALIDATION & CALCULATION LOOP
  FOR cart_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(product_id BIGINT, quantity NUMERIC)
  LOOP
    -- Fetch authoritative product data
    SELECT * INTO v_product FROM pos2_products WHERE id = cart_item.product_id AND user_id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'Product with ID % not found.', cart_item.product_id; END IF;
    
    -- Base calculation (Gross amount before discounts)
    v_line_gross := v_product.base_price * cart_item.quantity;
    v_server_gross_subtotal := v_server_gross_subtotal + v_line_gross;

    -- Tax Calculation based on BIR Classification
    -- If SC/PWD discount is applied, VATable items are treated as VAT-Exempt for this sale.
    IF v_product.tax_type = 'VATable' AND p_sc_pwd_discount = 0 THEN
      -- Standard VAT Calculation
      v_line_tax := v_line_gross * (v_product.tax_rate / 100.0);
    ELSE
      -- VAT-Exempt, Zero-Rated, or VAT removed due to SC/PWD discount
      v_line_tax := 0.00;
    END IF;
    
    v_server_tax := v_server_tax + v_line_tax;
  END LOOP;

  -- Calculate Final Net Due: Gross + Tax - Discounts
  v_server_total_net_due := (v_server_gross_subtotal + v_server_tax) - p_sc_pwd_discount - p_regular_discount;

  -- 3. VERIFY CLIENT TOTALS
  IF abs(v_server_total_net_due - p_total) > 0.01 OR abs(v_server_tax - p_tax) > 0.01 THEN
    RAISE EXCEPTION 'Price mismatch detected. Server Net Due: %, Client Total: %. Transaction aborted.', v_server_total_net_due, p_total;
  END IF;

  -- 4. VALIDATE TENDERED AMOUNT & DEPOSITS
  IF p_total_tendered < v_server_total_net_due THEN
    RAISE EXCEPTION 'Amount tendered is less than the total amount due.';
  END IF;
  v_change_due := p_total_tendered - v_server_total_net_due;

  -- 5. DETERMINE TRANSACTION TIME
  v_transaction_time := COALESCE(p_occurred_at, NOW());

  -- 6. UPDATE TERMINAL (Increment Invoice Number & Grand Total)
  UPDATE pos2_terminals
  SET 
    current_invoice_number = current_invoice_number + 1,
    cumulative_grand_total = cumulative_grand_total + v_server_total_net_due
  WHERE id = p_terminal_id;

  -- 7. INSERT MAIN ORDER
  INSERT INTO pos2_orders 
    (user_id, account_id, terminal_id, invoice_number, customer_id, total_amount, tax_amount, sc_pwd_discount_amount, regular_discount_amount, notes, status, total_tendered, occurred_at)
  VALUES 
    (auth.uid(), p_account_id, p_terminal_id, v_new_invoice_number, p_customer_id, v_server_total_net_due, v_server_tax, p_sc_pwd_discount, p_regular_discount, p_notes, 'completed', p_total_tendered, v_transaction_time)
  RETURNING id INTO v_order_id;

  -- 8. INSERT ORDER ITEMS
  FOR cart_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(product_id BIGINT, quantity NUMERIC)
  LOOP
    SELECT base_price, tax_rate, display_price, unit_type, tax_type INTO v_product FROM pos2_products WHERE id = cart_item.product_id;
    
    INSERT INTO pos2_order_items 
      (user_id, order_id, product_id, quantity, base_price_at_purchase, tax_rate_at_purchase, price_at_purchase, unit_type_at_purchase, tax_type_at_purchase)
    VALUES 
      (auth.uid(), v_order_id, cart_item.product_id, cart_item.quantity, v_product.base_price, v_product.tax_rate, v_product.display_price, v_product.unit_type, v_product.tax_type);
  END LOOP;

  -- 9. PROCESS PAYMENTS & DEPOSITS
  FOR payment_item IN SELECT * FROM jsonb_to_recordset(p_payments) AS x(amount NUMERIC, method TEXT, transaction_ref TEXT)
  LOOP
    -- Handle Deposit Usage
    IF payment_item.method = 'Deposit' THEN
      IF p_customer_id IS NULL THEN RAISE EXCEPTION 'Customer required to use a Deposit.'; END IF;
      IF NOT EXISTS (SELECT 1 FROM debt_accounts WHERE customer_id = p_customer_id AND user_id = auth.uid() AND current_balance <= -(payment_item.amount)) THEN
        RAISE EXCEPTION 'Insufficient deposit balance.';
      END IF;
      UPDATE debt_accounts SET current_balance = current_balance + payment_item.amount, updated_at = NOW() WHERE customer_id = p_customer_id AND user_id = auth.uid();
      INSERT INTO debt_transactions (user_id, debt_account_id, transaction_type, amount, description, related_order_id)
      SELECT auth.uid(), id, 'PAYMENT', payment_item.amount, 'Deposit used for Invoice #' || v_new_invoice_number, v_order_id FROM debt_accounts WHERE customer_id = p_customer_id AND user_id = auth.uid();
    END IF;

    -- Standard Payment Insert
    INSERT INTO pos2_payments (user_id, order_id, amount, payment_method, transaction_ref, status)
    VALUES (auth.uid(), v_order_id, payment_item.amount, payment_item.method, payment_item.transaction_ref, 'completed');
  END LOOP;

  -- 10. (OPTIONAL BUT REQUIRED BY BIR) LOG TO E-JOURNAL
  -- You should add an insert to your pos2_e_journal table here, stringifying the order details.

  -- 11. RETURN SUCCESS
  RETURN QUERY SELECT TRUE, 'Sale created successfully.', jsonb_build_object(
      'order_id', v_order_id,
      'invoice_number', v_new_invoice_number,
      'change_due', v_change_due
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 'An unexpected error occurred: ' || SQLERRM, NULL::jsonb;
END;
$$ LANGUAGE plpgsql VOLATILE;
