
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Contents table
CREATE TABLE public.contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  viral_score INTEGER DEFAULT 0,
  platform TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contents" ON public.contents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contents" ON public.contents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contents" ON public.contents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Hooks table
CREATE TABLE public.hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hook_text TEXT NOT NULL,
  category TEXT NOT NULL,
  platform TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hooks" ON public.hooks
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert hooks" ON public.hooks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hooks" ON public.hooks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trends table (public read)
CREATE TABLE public.trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  platform TEXT NOT NULL,
  trending_score INTEGER DEFAULT 0,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trends" ON public.trends
  FOR SELECT TO authenticated USING (true);

-- Seed some initial hooks
INSERT INTO public.hooks (hook_text, category, platform, is_public) VALUES
  ('Stop scrolling. This changed everything.', 'Attention', 'TikTok', true),
  ('Nobody talks about this hack...', 'Curiosity', 'Instagram', true),
  ('I tested this for 30 days. Here''s what happened.', 'Story', 'YouTube', true),
  ('POV: You just discovered the secret to...', 'POV', 'TikTok', true),
  ('This is why you''re not growing on social media.', 'Pain Point', 'Instagram', true),
  ('Wait for the end... 🤯', 'Suspense', 'TikTok', true),
  ('3 things I wish I knew before starting...', 'List', 'YouTube', true),
  ('The algorithm doesn''t want you to see this.', 'Conspiracy', 'TikTok', true),
  ('Here''s a free tool that replaced my $500/month subscription.', 'Value', 'Instagram', true),
  ('I made $10K in 30 days doing this one thing.', 'Results', 'YouTube', true),
  ('You''re doing it wrong. Here''s the right way.', 'Correction', 'TikTok', true),
  ('This trend is about to explode. Get in early.', 'FOMO', 'Instagram', true);

-- Seed some trends
INSERT INTO public.trends (topic, platform, trending_score, description, category) VALUES
  ('AI-generated content behind the scenes', 'TikTok', 92, 'Creators showing how they use AI tools to create content', 'Technology'),
  ('Day in my life as a creator', 'Instagram', 88, 'Authentic day-in-life content with raw editing style', 'Lifestyle'),
  ('Micro-storytelling in 15 seconds', 'YouTube', 85, 'Ultra-short narrative content with plot twists', 'Entertainment'),
  ('Green screen reactions to trending news', 'TikTok', 90, 'Using green screen to react to viral moments', 'Commentary'),
  ('Silent tutorials with text overlays', 'Instagram', 87, 'No-voice tutorials using only text and music', 'Education'),
  ('Before/After transformation content', 'YouTube', 83, 'Dramatic transformation reveals in short form', 'Lifestyle');
