
-- Drop and recreate category check to include 'Chapter Wise Questions'
ALTER TABLE questions DROP CONSTRAINT questions_category_check;
ALTER TABLE questions ADD CONSTRAINT questions_category_check
  CHECK (category = ANY (ARRAY[
    'Appendix 2A'::text,
    'Appendix 3A'::text,
    'LDCE'::text,
    'Chapter Wise Questions'::text
  ]));

-- Drop and recreate section check to include 'General'
ALTER TABLE questions DROP CONSTRAINT questions_section_check;
ALTER TABLE questions ADD CONSTRAINT questions_section_check
  CHECK (section = ANY (ARRAY[
    'Expenditure'::text,
    'Establishment'::text,
    'Stores'::text,
    'Books & Budget'::text,
    'Traffic'::text,
    'General'::text
  ]));
