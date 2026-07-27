DROP FUNCTION IF EXISTS pos2_get_system_audit_trail;

CREATE OR REPLACE FUNCTION pos2_get_system_audit_trail(
  p_requesting_account_id bigint, 
  p_limit integer, 
  p_offset integer, 
  p_table_filter text DEFAULT NULL::text, 
  p_action_filter text DEFAULT NULL::text, 
  p_start_date timestamp without time zone DEFAULT NULL::timestamp without time zone, 
  p_end_date timestamp without time zone DEFAULT NULL::timestamp without time zone
)
RETURNS TABLE(
  log_id bigint, 
  created_at timestamp without time zone, 
  table_name text, 
  action text, 
  row_id bigint, 
  old_values jsonb, 
  new_values jsonb, 
  operator_name text
)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  IF NOT pos_is_admin(p_requesting_account_id) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can view the System Audit Trail.';
  END IF;

  RETURN QUERY
  SELECT 
    at.id AS log_id,
    at.created_at::TIMESTAMP,
    
    -- SCHEMA OBFUSCATION FOR FRIENDLY UI DISPLAY
    CASE at.table_name
      WHEN 'accounts' THEN 'Staff Profile'
      WHEN 'pos2_products' THEN 'Product Catalog'
      WHEN 'pos2_business_settings' THEN 'Business Header'
      WHEN 'pos2_terminals' THEN 'Register Configuration'
      WHEN 'pos2_promotions' THEN 'Promotion Rules'
      WHEN 'pos2_inventory_batches' THEN 'Inventory Stock'
      WHEN 'pos2_orders' THEN 'Invoices & Voids'        -- NEW
      WHEN 'pos2_refunds' THEN 'Customer Refunds'       -- NEW
      WHEN 'debt_accounts' THEN 'Debt Ledger'
      WHEN 'pos2_installment_contracts' THEN 'Installment Plan'
      WHEN 'SYSTEM' THEN 'System Access'
      ELSE 'System Module'
    END AS table_name,
    
    at.action,
    at.row_id,
    at.old_values,
    at.new_values,
    COALESCE(act.person_name, act.name, 'System Process') AS operator_name
  FROM pos2_system_audit_trail at
  LEFT JOIN accounts act ON at.account_id = act.id
  WHERE 
    at.user_id = auth.uid()
    AND (
      p_table_filter IS NULL
      OR (p_table_filter = 'staff' AND at.table_name = 'accounts')
      OR (p_table_filter = 'products' AND at.table_name = 'pos2_products')
      OR (p_table_filter = 'settings' AND at.table_name = 'pos2_business_settings')
      OR (p_table_filter = 'registers' AND at.table_name = 'pos2_terminals')
      OR (p_table_filter = 'promos' AND at.table_name = 'pos2_promotions')
      OR (p_table_filter = 'inventory' AND at.table_name = 'pos2_inventory_batches')
      OR (p_table_filter = 'orders' AND at.table_name IN ('pos2_orders', 'pos2_refunds')) -- NEW
      OR (p_table_filter = 'debt' AND at.table_name = 'debt_accounts')
      OR (p_table_filter = 'installments' AND at.table_name = 'pos2_installment_contracts')
      OR (p_table_filter = 'security' AND at.table_name = 'SYSTEM')
    )
    AND (p_action_filter IS NULL OR at.action = p_action_filter)
    AND (p_start_date IS NULL OR at.created_at >= p_start_date)
    AND (p_end_date IS NULL OR at.created_at <= p_end_date)
  ORDER BY at.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;
