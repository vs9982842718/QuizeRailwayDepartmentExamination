
-- RPC: bunch-level stats for a given category + section
-- p_visible_only = true  → only count visible=true questions (regular users)
-- p_visible_only = false → count all questions (admins)
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
    COUNT(*)                        AS question_count,
    bool_or(visible)                AS has_visible
  FROM questions
  WHERE category = p_category
    AND section  = p_section
    AND (NOT p_visible_only OR visible = true)
  GROUP BY bunch
  ORDER BY
    -- natural / series sort: numeric bunches first, then alpha
    CASE WHEN bunch ~ '^\d+$' THEN lpad(bunch, 10, '0') ELSE bunch END;
$$;
