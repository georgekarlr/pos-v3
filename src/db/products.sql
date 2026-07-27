DROP FUNCTION IF EXISTS pos2_create_product;

CREATE OR REPLACE FUNCTION pos2_create_product(
  p_account_id bigint,
  p_name text,
  p_description text,
  p_base_price numeric,
  p_tax_rate numeric,
  p_sku text,
  p_barcode text,
  p_image_url text,
  p_selling_method product_selling_method,
  p_inventory_type product_inventory_type,
  p_unit_type text,
  p_is_for_sale boolean DEFAULT true,
  p_tax_type product_tax_type DEFAULT 'VATable'::product_tax_type,
  p_is_sc_pwd_eligible boolean DEFAULT true,
  p_cost_price numeric DEFAULT 0.00
)
RETURNS TABLE(success boolean, message text, data jsonb)
LANGUAGE plpgsql
AS $function$
DECLARE
  new_product public.pos2_products;
  v_display_price NUMERIC;
  v_tax_amount NUMERIC;
BEGIN
  PERFORM set_config('app.current_account_id', p_account_id::TEXT, true);

  IF NOT pos_is_admin(p_account_id) THEN
    RETURN QUERY SELECT FALSE, 'Permission denied: Only admins can create products.', NULL::jsonb; 
    RETURN;
  END IF;

  v_tax_amount := p_base_price * (p_tax_rate / 100.0);
  v_display_price := p_base_price + v_tax_amount;

  -- Insert product including cost_price
  INSERT INTO pos2_products 
    (user_id, name, description, base_price, cost_price, tax_rate, display_price, sku, barcode, image_url, selling_method, inventory_type, unit_type, is_for_sale, tax_type, is_sc_pwd_eligible)
  VALUES
    (auth.uid(), p_name, p_description, p_base_price, COALESCE(p_cost_price, 0.00), p_tax_rate, v_display_price, p_sku, p_barcode, p_image_url, p_selling_method, p_inventory_type, p_unit_type, p_is_for_sale, p_tax_type, p_is_sc_pwd_eligible)
  RETURNING * INTO new_product;

  RETURN QUERY SELECT TRUE, 'Product created successfully.', row_to_json(new_product)::jsonb;
END;
$function$;

DROP FUNCTION IF EXISTS pos2_get_product_details;

CREATE OR REPLACE FUNCTION pos2_get_product_details(
  p_limit integer,
  p_offset integer,
  p_search_term text DEFAULT NULL::text,
  p_filter_for_sale boolean DEFAULT NULL::boolean,
  p_filter_active boolean DEFAULT true
)
RETURNS TABLE(
  id bigint,
  user_id uuid,
  name text,
  description text,
  base_price numeric,
  cost_price numeric,
  tax_rate numeric,
  display_price numeric,
  sku text,
  barcode text,
  image_url text,
  is_active boolean,
  is_for_sale boolean,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  selling_method product_selling_method,
  inventory_type product_inventory_type,
  unit_type text,
  tax_type product_tax_type,
  is_sc_pwd_eligible boolean,
  total_stock numeric,
  stock_batches jsonb
)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.user_id, p.name, p.description, p.base_price, p.cost_price, p.tax_rate, p.display_price,
    p.sku, p.barcode, p.image_url, p.is_active, p.is_for_sale,
    p.created_at::TIMESTAMP, p.updated_at::TIMESTAMP,
    p.selling_method, p.inventory_type, p.unit_type, p.tax_type,
    p.is_sc_pwd_eligible,
    
    (
        SELECT COALESCE(SUM(ib.quantity), 0.000)
        FROM pos2_inventory_batches ib
        WHERE ib.product_id = p.id
          AND (ib.expiration_date IS NULL OR ib.expiration_date >= current_date)
    ) AS total_stock,
    
    CASE
      WHEN p.inventory_type = 'perishable' THEN
        (
          SELECT COALESCE(jsonb_agg(
              jsonb_build_object('batch_id', ib.id, 'quantity', ib.quantity, 'expiration_date', ib.expiration_date, 'received_at', ib.received_at::TIMESTAMP) 
              ORDER BY ib.expiration_date ASC NULLS LAST, ib.received_at ASC
          ), '[]'::jsonb)
          FROM pos2_inventory_batches ib
          WHERE ib.product_id = p.id AND ib.quantity > 0
        )
      ELSE '[]'::jsonb 
    END AS stock_batches
    
  FROM pos2_products p
  WHERE
    p.user_id = auth.uid()
    AND (
      p_search_term IS NULL 
      OR p.name ILIKE '%' || p_search_term || '%' 
      OR p.sku ILIKE '%' || p_search_term || '%'
      OR p.barcode ILIKE '%' || p_search_term || '%'
    )
    AND (p_filter_for_sale IS NULL OR p.is_for_sale = p_filter_for_sale)
    AND (p_filter_active IS NULL OR p.is_active = p_filter_active)
  ORDER BY p.name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

DROP FUNCTION IF EXISTS pos2_update_product;

CREATE OR REPLACE FUNCTION pos2_update_product(
  p_product_id bigint,
  p_account_id bigint,
  p_name text,
  p_description text,
  p_base_price numeric,
  p_tax_rate numeric,
  p_sku text,
  p_barcode text,
  p_image_url text,
  p_selling_method product_selling_method,
  p_inventory_type product_inventory_type,
  p_unit_type text,
  p_is_for_sale boolean,
  p_tax_type product_tax_type,
  p_is_active boolean,
  p_is_sc_pwd_eligible boolean,
  p_cost_price numeric DEFAULT 0.00
)
RETURNS TABLE(success boolean, message text, data jsonb)
LANGUAGE plpgsql
AS $function$
DECLARE
  updated_product pos2_products;
  v_display_price NUMERIC;
  v_tax_amount NUMERIC;
BEGIN
  PERFORM set_config('app.current_account_id', p_account_id::TEXT, true);

  IF NOT pos_is_admin(p_account_id) THEN
    RETURN QUERY SELECT FALSE, 'Permission denied.', NULL::jsonb; 
    RETURN;
  END IF;

  v_tax_amount := p_base_price * (p_tax_rate / 100.0);
  v_display_price := p_base_price + v_tax_amount;

  UPDATE pos2_products
  SET
    name = p_name,
    description = p_description,
    base_price = p_base_price,
    cost_price = COALESCE(p_cost_price, 0.00),
    tax_rate = p_tax_rate,
    display_price = v_display_price,
    sku = p_sku,
    barcode = p_barcode,
    image_url = p_image_url,
    selling_method = p_selling_method,
    inventory_type = p_inventory_type,
    unit_type = p_unit_type,
    is_for_sale = p_is_for_sale,
    tax_type = p_tax_type,
    is_active = p_is_active,
    is_sc_pwd_eligible = p_is_sc_pwd_eligible,
    updated_at = now()
  WHERE id = p_product_id AND user_id = auth.uid()
  RETURNING * INTO updated_product;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Product not found or access denied.', NULL::jsonb; 
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, 'Product updated successfully.', row_to_json(updated_product)::jsonb;
END;
$function$;