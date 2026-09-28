-- Fix trigger to include temporary username
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role, approved)
  VALUES (
    NEW.id,
    NEW.email,
    'user_' || substring(NEW.id::text, 1, 8),
    'user'::public.user_role,
    false
  );
  RETURN NEW;
END;
$$;