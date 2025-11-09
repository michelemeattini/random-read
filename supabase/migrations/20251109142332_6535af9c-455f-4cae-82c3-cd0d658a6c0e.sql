-- Tabella per configurazione ads
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  cta_url TEXT NOT NULL,
  advertiser TEXT NOT NULL,
  skip_delay INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  is_google_ad BOOLEAN DEFAULT false,
  google_ad_slot TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per tracking impressions ads
CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  skipped BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  view_duration INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

-- Policies per ads (tutti possono leggere ads attivi)
CREATE POLICY "Ads are viewable by everyone"
ON public.ads
FOR SELECT
USING (is_active = true);

-- Policies per ad_impressions
CREATE POLICY "Users can view their own ad impressions"
ON public.ad_impressions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ad impressions"
ON public.ad_impressions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Indexes per performance
CREATE INDEX idx_ads_active ON public.ads(is_active, priority DESC);
CREATE INDEX idx_ad_impressions_user ON public.ad_impressions(user_id);
CREATE INDEX idx_ad_impressions_ad ON public.ad_impressions(ad_id);
CREATE INDEX idx_ad_impressions_date ON public.ad_impressions(viewed_at DESC);