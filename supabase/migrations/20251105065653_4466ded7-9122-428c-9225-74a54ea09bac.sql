-- Add category column to wiki_posts if it doesn't exist
ALTER TABLE public.wiki_posts 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add preferred_categories to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_categories TEXT[] DEFAULT '{}';

-- Create index for faster category queries
CREATE INDEX IF NOT EXISTS idx_wiki_posts_category ON public.wiki_posts(category);

-- Add some sample categories to existing posts (for testing)
UPDATE public.wiki_posts 
SET category = CASE 
  WHEN LOWER(title) LIKE '%scien%' OR LOWER(title) LIKE '%tecn%' THEN 'Scienza e Tecnologia'
  WHEN LOWER(title) LIKE '%stor%' OR LOWER(title) LIKE '%antic%' THEN 'Storia'
  WHEN LOWER(title) LIKE '%arte%' OR LOWER(title) LIKE '%cultur%' THEN 'Arte e Cultura'
  WHEN LOWER(title) LIKE '%natur%' OR LOWER(title) LIKE '%animal%' THEN 'Natura'
  WHEN LOWER(title) LIKE '%geograf%' OR LOWER(title) LIKE '%paes%' THEN 'Geografia'
  ELSE 'Generale'
END
WHERE category IS NULL;