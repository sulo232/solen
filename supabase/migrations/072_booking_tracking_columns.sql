-- Add cancellation and no-show tracking columns

-- Add cancellation_count to salons table
ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS cancellation_count integer DEFAULT 0;

-- Add no_show_count to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS no_show_count integer DEFAULT 0;
