-- Add about_text columns to salons table for the "Über uns" section
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS about_text_de text,
  ADD COLUMN IF NOT EXISTS about_text_en text,
  ADD COLUMN IF NOT EXISTS about_text_fr text,
  ADD COLUMN IF NOT EXISTS about_text_it text;
