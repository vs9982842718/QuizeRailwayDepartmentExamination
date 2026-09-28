-- Add temporary_password field to profiles table for admin to see user credentials
ALTER TABLE public.profiles ADD COLUMN temporary_password text;

-- Update policy to allow admin to see all profile fields including temporary_password
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated 
  USING (auth.uid() = id OR has_role(auth.uid(), 'admin'));

-- Allow users to update their own temporary_password during signup
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR has_role(auth.uid(), 'admin'));
