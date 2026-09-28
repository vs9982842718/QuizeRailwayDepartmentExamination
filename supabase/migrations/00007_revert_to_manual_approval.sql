-- Revert default approved back to false (manual approval required)
ALTER TABLE public.profiles ALTER COLUMN approved SET DEFAULT false;

-- Update trigger to require manual approval for new users
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