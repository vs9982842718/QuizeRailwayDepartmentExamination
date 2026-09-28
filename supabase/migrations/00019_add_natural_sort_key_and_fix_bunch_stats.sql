
-- ──────────────────────────────────────────────────────────────────────────
-- 1. Helper: produces a zero-padded natural-sort key from any string.
--    "Exp 1"  → "exp 0000000001"
--    "Exp 10" → "exp 0000000010"
--    "Coaching Part-1" → "coaching part-0000000001"
--    "Traffic accounts Part-12" → "traffic accounts part-0000000012"
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION natural_sort_key(s text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE STRICT
AS $$
DECLARE
  result  text := '';
  num_buf text := '';
  i       int  := 1;
  c       text;
  len     int;
BEGIN
  s   := lower(s);
  len := length(s);
  WHILE i <= len LOOP
    c := substring(s FROM i FOR 1);
    IF c ~ '[0-9]' THEN
      num_buf := num_buf || c;
    ELSE
      IF num_buf <> '' THEN
        result  := result || lpad(num_buf, 10, '0');
        num_buf := '';
      END IF;
      result := result || c;
    END IF;
    i := i + 1;
  END LOOP;
  IF num_buf <> '' THEN
    result := result || lpad(num_buf, 10, '0');
  END IF;
  RETURN result;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Replace get_bunch_stats using the correct natural_sort_key helper.
-- ──────────────────────────────────────────────────────────────────────────
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
    COUNT(*)         AS question_count,
    bool_or(visible) AS has_visible
  FROM questions
  WHERE category = p_category
    AND section  = p_section
    AND (NOT p_visible_only OR visible = true)
  GROUP BY bunch
  ORDER BY natural_sort_key(bunch);
$$;
