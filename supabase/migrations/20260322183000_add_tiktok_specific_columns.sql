-- Add scope and token_type to social_tokens
ALTER TABLE public.social_tokens 
ADD COLUMN IF NOT EXISTS scope TEXT,
ADD COLUMN IF NOT EXISTS token_type TEXT;
