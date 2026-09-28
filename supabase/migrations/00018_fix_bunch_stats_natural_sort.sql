
-- Replace get_bunch_stats with proper natural (human) sort.
-- regexp_replace pads every embedded digit run to 10 chars so
-- "Exp 1" < "Exp 2" < … < "Exp 10" < "Exp 11",
-- "Coaching Part-1" < "Coaching Part-2" < … < "Coaching Part-8", etc.
CREATE OR REPLACE FUNCTION get_bunch_stats(
  p_category     text,
  p_section      text,
  p_visible_only boolean DEFAULT false
)
RETURNS TABLE(
  bunch          text,
  question_count bigint,
  has_visible    boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    bunch,
    COUNT(*)      AS question_count,
    bool_or(visible) AS has_visible
  FROM questions
  WHERE category = p_category
    AND section  = p_section
    AND (NOT p_visible_only OR visible = true)
  GROUP BY bunch
  ORDER BY
    -- natural sort: lowercase the whole string, then pad every run of digits
    -- to 10 characters so numeric parts compare numerically, not lexically.
    regexp_replace(
      lower(bunch),
      '(\d+)',
      lpad('\1', 10, '0'),
      'g'
    );
$$;
