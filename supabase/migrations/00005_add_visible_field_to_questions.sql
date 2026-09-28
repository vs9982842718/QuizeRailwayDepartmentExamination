-- Add visible field to questions table for hiding/showing tests
ALTER TABLE public.questions ADD COLUMN visible boolean NOT NULL DEFAULT true;

-- Create index for better query performance
CREATE INDEX idx_questions_visible ON public.questions(visible);