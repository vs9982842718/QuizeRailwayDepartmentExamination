
-- ── profiles: add new columns ────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name        text,
  ADD COLUMN IF NOT EXISTS mobile_number    text,
  ADD COLUMN IF NOT EXISTS date_of_birth    date,
  ADD COLUMN IF NOT EXISTS is_temp_password boolean NOT NULL DEFAULT false;

-- Unique index on mobile_number (allow nulls, only unique among non-null)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_mobile_number_unique
  ON profiles (mobile_number)
  WHERE mobile_number IS NOT NULL;

-- ── password_reset_requests: recreate clean schema ───────────────────────────
DROP TABLE IF EXISTS password_reset_requests;

CREATE TABLE password_reset_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      text        NOT NULL,
  mobile_number  text        NOT NULL,
  date_of_birth  date        NOT NULL,
  username       text,
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'resolved')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz,
  resolved_by    uuid        REFERENCES profiles(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can insert a reset request
CREATE POLICY "reset_req_insert_anon" ON password_reset_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Authenticated users can view their own requests by mobile_number
CREATE POLICY "reset_req_select_user" ON password_reset_requests
  FOR SELECT TO authenticated
  USING (true);

-- Admin full access
CREATE POLICY "reset_req_admin_all" ON password_reset_requests
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE password_reset_requests;
