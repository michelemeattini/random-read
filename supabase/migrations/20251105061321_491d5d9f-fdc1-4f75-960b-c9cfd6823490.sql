-- Create wiki_posts table for storing generated Wikipedia summaries
CREATE TABLE IF NOT EXISTS public.wiki_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  image_url TEXT NOT NULL,
  source_url TEXT NOT NULL,
  wikipedia_page_id TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wiki_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view posts
CREATE POLICY "Posts are viewable by everyone"
  ON public.wiki_posts
  FOR SELECT
  USING (true);

-- Policy: System can insert new posts (we'll use service role for this)
CREATE POLICY "System can insert posts"
  ON public.wiki_posts
  FOR INSERT
  WITH CHECK (true);

-- Policy: System can update view counts
CREATE POLICY "System can update posts"
  ON public.wiki_posts
  FOR UPDATE
  USING (true);

-- Create index for efficient querying
CREATE INDEX idx_wiki_posts_created_at ON public.wiki_posts(created_at DESC);
CREATE INDEX idx_wiki_posts_view_count ON public.wiki_posts(view_count);

-- Add realtime support
ALTER TABLE public.wiki_posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wiki_posts;