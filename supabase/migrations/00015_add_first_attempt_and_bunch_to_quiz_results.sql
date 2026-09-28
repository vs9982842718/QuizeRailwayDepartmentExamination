
-- Add bunch column to track which bunch was attempted
ALTER TABLE quiz_results ADD COLUMN bunch text;

-- Add is_first_attempt flag — true only on the user's very first attempt of a specific quiz
ALTER TABLE quiz_results ADD COLUMN is_first_attempt boolean NOT NULL DEFAULT false;

-- Unique index: only one first-attempt record per user+category+section+bunch combo
CREATE UNIQUE INDEX quiz_results_first_attempt_unique
  ON quiz_results (user_id, category, section, bunch)
  WHERE is_first_attempt = true;

-- Helper: check if a first-attempt record already exists for this combo
CREATE OR REPLACE FUNCTION has_first_attempt(
  p_user_id uuid,
  p_category text,
  p_section text,
  p_bunch text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM quiz_results
    WHERE user_id = p_user_id
      AND category = p_category
      AND section  = p_section
      AND bunch    = p_bunch
      AND is_first_attempt = true
  );
$$;
