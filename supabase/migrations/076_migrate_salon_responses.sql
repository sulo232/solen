-- Migration 076: Migrate legacy salon_response to review_replies

INSERT INTO public.review_replies (review_id, salon_id, reply_text, is_public, created_at)
SELECT 
  id as review_id, 
  salon_id, 
  salon_response as reply_text, 
  true as is_public, 
  COALESCE(salon_response_at, created_at) as created_at
FROM public.reviews
WHERE salon_response IS NOT NULL
  AND id NOT IN (SELECT review_id FROM public.review_replies);
