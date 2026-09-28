-- Add bunch field to questions table
ALTER TABLE public.questions ADD COLUMN bunch text NOT NULL DEFAULT 'Starter Set';

-- Create index for faster queries
CREATE INDEX idx_questions_category_section_bunch ON public.questions(category, section, bunch);