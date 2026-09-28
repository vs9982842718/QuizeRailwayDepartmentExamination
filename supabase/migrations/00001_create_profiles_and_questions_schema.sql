-- Create user_role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username text UNIQUE NOT NULL,
  role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('Appendix 2A', 'Appendix 3A', 'LDCE')),
  section text NOT NULL CHECK (section IN ('Expenditure', 'Establishment', 'Stores', 'Books & Budget')),
  question text NOT NULL,
  options jsonb NOT NULL,
  correct integer[] NOT NULL,
  explanation text,
  question_image_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT min_two_options CHECK (jsonb_array_length(options) >= 2),
  CONSTRAINT at_least_one_correct CHECK (array_length(correct, 1) >= 1)
);

-- Create quiz_results table
CREATE TABLE public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  section text NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  percentage numeric(5,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create storage bucket for question images
INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', true);

-- Storage policies for question-images bucket
CREATE POLICY "Anyone can view question images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'question-images');

CREATE POLICY "Authenticated users can upload question images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'question-images');

CREATE POLICY "Users can update their own question images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'question-images');

CREATE POLICY "Users can delete their own question images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'question-images');

-- Create helper function to check user role
CREATE OR REPLACE FUNCTION public.has_role(uid uuid, role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = uid AND p.role = role_name::public.user_role
  );
$$;

-- Profiles RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Public profiles view
CREATE VIEW public.public_profiles AS
  SELECT id, username, role FROM public.profiles;

-- Questions RLS policies
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions" ON public.questions
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can create questions" ON public.questions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own questions" ON public.questions
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Admins can update any question" ON public.questions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own questions" ON public.questions
  FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Admins can delete any question" ON public.questions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Quiz results RLS policies
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own results" ON public.quiz_results
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all results" ON public.quiz_results
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own results" ON public.quiz_results
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Create trigger function to sync new users to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.email, '@', 1),
    'user'::public.user_role
  );
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();