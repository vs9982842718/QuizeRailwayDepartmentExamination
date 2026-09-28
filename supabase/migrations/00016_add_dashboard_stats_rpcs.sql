
-- RPC: category-level stats (sections, bunches, questions per category)
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE(
  category   text,
  sections   bigint,
  bunches    bigint,
  questions  bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    category,
    COUNT(DISTINCT section)  AS sections,
    COUNT(DISTINCT bunch)    AS bunches,
    COUNT(*)                 AS questions
  FROM questions
  GROUP BY category;
$$;

-- RPC: section-level stats (bunches, questions per category+section)
CREATE OR REPLACE FUNCTION get_section_stats()
RETURNS TABLE(
  category   text,
  section    text,
  bunches    bigint,
  questions  bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    category,
    section,
    COUNT(DISTINCT bunch) AS bunches,
    COUNT(*)              AS questions
  FROM questions
  GROUP BY category, section;
$$;
