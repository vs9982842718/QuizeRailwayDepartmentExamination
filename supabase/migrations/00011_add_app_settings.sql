
CREATE TABLE app_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  quiz_time_per_question integer NOT NULL DEFAULT 30,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO app_settings (id, quiz_time_per_question) VALUES (1, 30);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION can_update_app_settings()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
$$;

CREATE POLICY "Admins can update app settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (can_update_app_settings())
  WITH CHECK (can_update_app_settings());
