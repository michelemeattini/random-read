import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdImpression } from '@/types/ad';
import { ADS_CONFIG } from '@/config/ads';

export const useAdTracking = (adId: string, userId: string | undefined) => {
  const [viewStartTime, setViewStartTime] = useState<number>(Date.now());
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  useEffect(() => {
    setViewStartTime(Date.now());
    setHasTrackedImpression(false);
  }, [adId]);

  const trackImpression = useCallback(async (skipped: boolean, clicked: boolean = false) => {
    if (!userId || hasTrackedImpression) return;

    const viewDuration = Date.now() - viewStartTime;
    
    // Solo se la view duration è sufficiente
    if (viewDuration < ADS_CONFIG.MIN_VIEW_DURATION_MS) return;

    const impression: Omit<AdImpression, 'id' | 'created_at'> = {
      user_id: userId,
      ad_id: adId,
      viewed_at: new Date().toISOString(),
      skipped,
      clicked,
      view_duration: viewDuration,
    };

    try {
      const { error } = await (supabase as any)
        .from('ad_impressions')
        .insert(impression);

      if (!error) {
        setHasTrackedImpression(true);
        
        // Reward per view completo (non skippato)
        if (!skipped && ADS_CONFIG.REWARD_FOR_FULL_VIEW > 0) {
          // TODO: implementare sistema di punti esperienza
          console.log(`User earned ${ADS_CONFIG.REWARD_FOR_FULL_VIEW} XP for watching ad`);
        }

        // Reward per click
        if (clicked && ADS_CONFIG.REWARD_FOR_CLICK > 0) {
          console.log(`User earned ${ADS_CONFIG.REWARD_FOR_CLICK} XP for clicking ad`);
        }
      }
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  }, [userId, adId, viewStartTime, hasTrackedImpression]);

  const trackClick = useCallback(() => {
    trackImpression(false, true);
  }, [trackImpression]);

  const trackSkip = useCallback(() => {
    trackImpression(true, false);
  }, [trackImpression]);

  const trackFullView = useCallback(() => {
    trackImpression(false, false);
  }, [trackImpression]);

  return {
    trackClick,
    trackSkip,
    trackFullView,
    viewDuration: Date.now() - viewStartTime,
  };
};
