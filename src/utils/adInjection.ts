import { AdData, PostOrAd } from '@/types/ad';
import { MOCK_ADS } from '@/data/mockAds';
import { ADS_CONFIG } from '@/config/ads';

/**
 * Inietta ads in un array di post a intervalli regolari
 * @param posts Array di post originali
 * @param frequency Ogni quanti post inserire un ad
 * @returns Array con post e ads mescolati
 */
export const injectAds = <T extends { id: string }>(
  posts: T[],
  frequency: number = ADS_CONFIG.FEED_AD_FREQUENCY
): PostOrAd[] => {
  if (!ADS_CONFIG.ENABLE_ADS || posts.length === 0) {
    return posts;
  }

  const result: PostOrAd[] = [];
  let adIndex = 0;

  posts.forEach((post, index) => {
    result.push(post);

    // Inserisci un ad ogni 'frequency' post (ma non alla fine)
    if ((index + 1) % frequency === 0 && index < posts.length - 1) {
      const ad = MOCK_ADS[adIndex % MOCK_ADS.length];
      result.push({ ...ad });
      adIndex++;
    }
  });

  return result;
};

/**
 * Verifica se un item è un ad
 */
export const isAd = (item: any): item is AdData => {
  return item && item.type === 'ad';
};

/**
 * Ottiene ads attivi dal database Supabase (per future implementazioni)
 * @returns Array di ads dal database
 */
export const fetchActiveAds = async (): Promise<AdData[]> => {
  // TODO: implementare fetch da Supabase quando necessario
  // const { data } = await supabase
  //   .from('ads')
  //   .select('*')
  //   .eq('is_active', true)
  //   .order('priority', { ascending: false });
  
  // Per ora ritorna mock ads
  return MOCK_ADS;
};
