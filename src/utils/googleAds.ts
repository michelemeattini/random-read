import { ADS_CONFIG } from '@/config/ads';

/**
 * Carica lo script Google AdSense nel documento
 * Da chiamare una sola volta all'avvio dell'app
 */
export const loadGoogleAdsenseScript = () => {
  if (!ADS_CONFIG.ENABLE_GOOGLE_ADS || !ADS_CONFIG.GOOGLE_AD_CLIENT) {
    console.log('Google Ads disabled or not configured');
    return;
  }

  // Verifica se lo script è già stato caricato
  if (document.querySelector(`script[data-ad-client="${ADS_CONFIG.GOOGLE_AD_CLIENT}"]`)) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CONFIG.GOOGLE_AD_CLIENT}`;
  script.crossOrigin = 'anonymous';
  script.setAttribute('data-ad-client', ADS_CONFIG.GOOGLE_AD_CLIENT);
  
  document.head.appendChild(script);

  script.onload = () => {
    console.log('Google AdSense script loaded successfully');
  };

  script.onerror = () => {
    console.error('Failed to load Google AdSense script');
  };
};

/**
 * Inizializza un ad slot Google AdSense dopo il rendering
 * Da chiamare dopo che l'elemento DOM è stato creato
 */
export const initializeGoogleAd = (elementId: string) => {
  if (!ADS_CONFIG.ENABLE_GOOGLE_ADS) return;

  try {
    // @ts-ignore - adsbygoogle è un oggetto globale di Google
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (error) {
    console.error('Error initializing Google Ad:', error);
  }
};

/**
 * Hook per caricare Google AdSense all'avvio dell'applicazione
 * Usare in App.tsx o main.tsx
 */
export const useGoogleAdsense = () => {
  // Carica lo script solo lato client
  if (typeof window !== 'undefined') {
    loadGoogleAdsenseScript();
  }
};

/**
 * Componente wrapper per Google AdSense (esempio)
 * 
 * Usage:
 * <GoogleAdSense 
 *   adSlot="1234567890"
 *   adFormat="auto"
 *   responsive={true}
 * />
 */
export interface GoogleAdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  className?: string;
}

// Documentazione per l'integrazione completa:
// 
// 1. Configurare ADS_CONFIG.GOOGLE_AD_CLIENT in src/config/ads.ts
//    Esempio: GOOGLE_AD_CLIENT: 'ca-pub-1234567890123456'
//
// 2. Ottenere gli Ad Slot IDs da Google AdSense dashboard
//    Esempio: GOOGLE_AD_SLOTS.FEED: '1234567890'
//
// 3. Abilitare Google Ads: ENABLE_GOOGLE_ADS: true
//
// 4. Chiamare loadGoogleAdsenseScript() in App.tsx o main.tsx (una volta sola)
//
// 5. Per usare in AdPost.tsx o AdCard.tsx:
//    - Settare isGoogleAd: true nell'oggetto AdData
//    - Settare googleAdSlot: 'slot-id' nell'oggetto AdData
//    - Renderizzare l'elemento <ins> con le classi corrette
//    - Chiamare initializeGoogleAd() dopo il rendering
//
// Esempio di componente AdSense:
// <ins 
//   className="adsbygoogle"
//   style={{ display: 'block' }}
//   data-ad-client={ADS_CONFIG.GOOGLE_AD_CLIENT}
//   data-ad-slot={ad.googleAdSlot}
//   data-ad-format="auto"
//   data-full-width-responsive="true"
// />
