export interface AdData {
  id: string;
  type: 'ad';
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  advertiser: string;
  skipDelay: number;
  isGoogleAd?: boolean;
  googleAdSlot?: string;
}

export interface AdImpression {
  id?: string;
  user_id: string;
  ad_id: string;
  viewed_at: string;
  skipped: boolean;
  clicked: boolean;
  view_duration: number;
  created_at?: string;
}

export type PostOrAd = any | AdData;
