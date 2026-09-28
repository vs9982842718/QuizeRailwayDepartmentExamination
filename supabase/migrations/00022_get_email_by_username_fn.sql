
-- Returns the stored auth email for a given username, bypassing RLS.
-- This is intentionally public (no auth required) so the login page
-- can look up the correct email before the user is authenticated.
CREATE OR REPLACE FUNCTION get_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email
  FROM profiles
  WHERE lower(username) = lower(p_username)
  LIMIT 1;
  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION get_email_by_username(text) TO anon, authenticated;
