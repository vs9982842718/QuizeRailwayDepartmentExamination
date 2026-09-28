ALTER TABLE app_settings
  ADD COLUMN font_style text NOT NULL DEFAULT 'Inter',
  ADD COLUMN font_size integer NOT NULL DEFAULT 16,
  ADD COLUMN font_weight text NOT NULL DEFAULT 'regular';