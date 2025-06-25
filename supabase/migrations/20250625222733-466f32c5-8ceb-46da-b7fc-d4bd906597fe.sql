
-- First, delete duplicate citation_settings rows, keeping only the most recent one for each user
DELETE FROM public.citation_settings
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.citation_settings
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint on user_id to prevent future duplicates
ALTER TABLE public.citation_settings
ADD CONSTRAINT citation_settings_user_id_unique UNIQUE (user_id);
