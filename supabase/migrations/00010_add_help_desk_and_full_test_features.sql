-- Add help desk instructions table
CREATE TABLE IF NOT EXISTS help_desk_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insert default help desk content
INSERT INTO help_desk_instructions (content) 
VALUES ('Welcome to the Help Desk. Admin can edit these instructions.');

-- Create categories table for managing category metadata
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category_type text DEFAULT 'normal' CHECK (category_type IN ('normal', 'full_test')),
  time_limit_minutes integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add marked for review to quiz_results
ALTER TABLE quiz_results
ADD COLUMN IF NOT EXISTS marked_for_review jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS time_remaining_seconds integer;

-- RLS for help_desk_instructions
ALTER TABLE help_desk_instructions ENABLE ROW LEVEL SECURITY;

-- Everyone can read help desk
CREATE POLICY "Anyone can view help desk instructions"
  ON help_desk_instructions FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update help desk
CREATE POLICY "Admins can update help desk instructions"
  ON help_desk_instructions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- RLS for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view categories
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));