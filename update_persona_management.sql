DROP FUNCTION IF EXISTS pos2_get_staff_accounts();

CREATE OR REPLACE FUNCTION pos2_get_staff_accounts()
RETURNS TABLE(
    account_id BIGINT,
    role_name TEXT,
    person_name TEXT,
    user_type TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    id AS account_id,
    name AS role_name,
    person_name,
    user_type,
    created_at
  FROM accounts
  WHERE user_id = auth.uid()
  ORDER BY 
    -- 1st Priority: Sort by user_type. 'admin' comes before 'staff' alphabetically, 
    -- but using a CASE statement guarantees Admins are always at the top 
    -- even if you add new roles later (like 'manager' or 'cashier').
    CASE WHEN user_type = 'admin' THEN 1 ELSE 2 END ASC,
    
    -- 2nd Priority: Sort alphabetically by their actual name
    COALESCE(person_name, name) ASC;
END;
$$ LANGUAGE plpgsql STABLE;


DROP FUNCTION IF EXISTS pos2_update_account_credentials(BIGINT, BIGINT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION pos2_update_account_credentials(
    p_requesting_account_id BIGINT, -- The person making the change
    p_target_account_id BIGINT,     -- The account being changed
    p_new_name TEXT,                -- e.g., 'Manager', 'Cashier 1'
    p_new_person_name TEXT,         -- e.g., 'Juan Dela Cruz'
    p_new_password TEXT             -- e.g., '1234' or a secure hash
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_target_account RECORD;
  v_is_admin BOOLEAN;
BEGIN
  -- 1. Check if the requesting user is an admin
  v_is_admin := pos_is_admin(p_requesting_account_id);

  -- 2. Security: Ensure the user is either an Admin OR they are editing their own account
  IF NOT v_is_admin AND p_requesting_account_id != p_target_account_id THEN
    RETURN QUERY SELECT FALSE, 'Permission denied: You can only edit your own account.';
    RETURN;
  END IF;

  -- 3. Verify the target account belongs to this business
  SELECT * INTO v_target_account FROM accounts 
  WHERE id = p_target_account_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Account not found or access denied.';
    RETURN;
  END IF;

  -- 4. Perform the Update
  UPDATE accounts
  SET 
    name = COALESCE(p_new_name, name),
    person_name = COALESCE(p_new_person_name, person_name),
    password = COALESCE(p_new_password, password)
  WHERE id = p_target_account_id;

  -- 5. Log the Security Event to the E-Journal
  INSERT INTO pos2_e_journal (user_id, account_id, event_type, event_description, details)
  VALUES (
    auth.uid(), 
    p_requesting_account_id, 
    'SYSTEM_UPDATE', 
    'Account credentials updated for: ' || COALESCE(p_new_person_name, p_new_name),
    jsonb_build_object('target_account_id', p_target_account_id, 'updated_by', p_requesting_account_id)
  );

  RETURN QUERY SELECT TRUE, 'Account updated successfully.';

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 'An unexpected error occurred: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql VOLATILE;
