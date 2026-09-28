-- Add approved field to profiles table
ALTER TABLE public.profiles ADD COLUMN approved boolean NOT NULL DEFAULT false;

-- Update existing admin to be approved
UPDATE public.profiles SET approved = true WHERE role = 'admin';

-- Update handle_new_user to set admin as approved by default
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, role, approved)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    'user'::public.user_role,
    false
  );
  RETURN NEW;
END;
$$;

-- Update policies to check approved status
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated 
  USING (auth.uid() = id OR has_role(auth.uid(), 'admin'));

-- Add policy for approved users to access questions
DROP POLICY IF EXISTS "Anyone can view questions" ON questions;
CREATE POLICY "Approved users can view questions" ON questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND approved = true
    )
  );

-- Only admin can insert/update/delete questions
DROP POLICY IF EXISTS "Authenticated users can add questions" ON questions;
CREATE POLICY "Only admin can add questions" ON questions
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admin can update questions" ON questions
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admin can delete questions" ON questions
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Only approved users can view quiz results
DROP POLICY IF EXISTS "Users can view their own results" ON quiz_results;
CREATE POLICY "Approved users can view their own results" ON quiz_results
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND approved = true
    )
  );

DROP POLICY IF EXISTS "Users can insert their own results" ON quiz_results;
CREATE POLICY "Approved users can insert their own results" ON quiz_results
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND approved = true
    )
  );