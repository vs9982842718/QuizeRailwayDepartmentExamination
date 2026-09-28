-- Change default approved to true for auto-approval
ALTER TABLE public.profiles ALTER COLUMN approved SET DEFAULT true;

-- Update existing non-admin users to be approved
UPDATE public.profiles SET approved = true WHERE role = 'user';

-- Update trigger to auto-approve new users
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
    true
  );
  RETURN NEW;
END;
$$;

-- Create user_category_access table for per-user category visibility
CREATE TABLE IF NOT EXISTS public.user_category_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Enable RLS
ALTER TABLE public.user_category_access ENABLE ROW LEVEL SECURITY;

-- Policies for user_category_access
CREATE POLICY "Users can view their own category access" ON public.user_category_access
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can manage category access" ON public.user_category_access
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create index for better performance
CREATE INDEX idx_user_category_access_user_id ON public.user_category_access(user_id);
CREATE INDEX idx_user_category_access_visible ON public.user_category_access(visible);