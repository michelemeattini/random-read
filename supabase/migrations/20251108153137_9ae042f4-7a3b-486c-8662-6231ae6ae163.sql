-- Create post_views table to track when users view posts
CREATE TABLE public.post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reading_time INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own views"
ON public.post_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own views"
ON public.post_views
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_post_views_user_id ON public.post_views(user_id);
CREATE INDEX idx_post_views_viewed_at ON public.post_views(viewed_at);

-- Create achievements table
CREATE TABLE public.achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  category TEXT NOT NULL
);

-- Insert predefined achievements
INSERT INTO public.achievements (id, name, description, icon, threshold, category) VALUES
  ('first_view', 'Primo Passo', 'Leggi il tuo primo articolo', '📖', 1, 'reading'),
  ('views_10', 'Curioso', 'Leggi 10 articoli', '🔍', 10, 'reading'),
  ('views_50', 'Appassionato', 'Leggi 50 articoli', '📚', 50, 'reading'),
  ('views_100', 'Esperto', 'Leggi 100 articoli', '🎓', 100, 'reading'),
  ('views_500', 'Maestro', 'Leggi 500 articoli', '👨‍🏫', 500, 'reading'),
  ('streak_3', 'Costante', '3 giorni di streak', '🔥', 3, 'streak'),
  ('streak_7', 'Dedicato', '7 giorni di streak', '⚡', 7, 'streak'),
  ('streak_30', 'Inarrestabile', '30 giorni di streak', '💪', 30, 'streak'),
  ('categories_5', 'Esploratore', 'Leggi da 5 categorie diverse', '🗺️', 5, 'diversity'),
  ('categories_all', 'Universalista', 'Leggi da tutte le categorie', '🌍', 8, 'diversity');

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can view achievements
CREATE POLICY "Achievements are viewable by everyone"
ON public.achievements
FOR SELECT
USING (true);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);