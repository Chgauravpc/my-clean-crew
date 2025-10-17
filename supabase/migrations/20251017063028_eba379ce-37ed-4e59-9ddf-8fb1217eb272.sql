-- Add foreign key from maids to profiles
ALTER TABLE public.maids
DROP CONSTRAINT IF EXISTS maids_user_id_fkey;

ALTER TABLE public.maids
ADD CONSTRAINT maids_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;