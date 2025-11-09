export const ADS_CONFIG = {
  // Frequenza inserimento ads
  FEED_AD_FREQUENCY: 6, // ogni 6 post nel feed principale
  LIBRARY_AD_FREQUENCY: 9, // ogni 9 post nella library

  // Timing e comportamento
  SKIP_DELAY_SECONDS: 5, // secondi prima di poter skippare
  MIN_VIEW_DURATION_MS: 1000, // minimo per contare come impression valida

  // Feature flags
  ENABLE_ADS: true,
  ENABLE_GOOGLE_ADS: false, // TODO: Abilitare dopo configurazione AdSense

  // Gamification rewards
  REWARD_FOR_FULL_VIEW: 10, // punti exp per view completo
  REWARD_FOR_CLICK: 5, // punti exp per click

  // Google AdSense - CONFIGURARE CON I TUOI DATI
  // Passo 1: Registrati su https://www.google.com/adsense
  // Passo 2: Aggiungi il tuo sito e verifica la proprietà
  // Passo 3: Crea gli Ad Units e ottieni gli Slot IDs
  // Passo 4: Inserisci qui sotto il tuo Publisher ID e Slot IDs
  GOOGLE_AD_CLIENT: '', // TODO: Inserire 'ca-pub-XXXXXXXXXXXXXXXX'
  GOOGLE_AD_SLOTS: {
    FEED: '', // TODO: Inserire Slot ID per feed ads (es. '1234567890')
    LIBRARY: '', // TODO: Inserire Slot ID per library ads (es. '0987654321')
  },
} as const;

export type AdsConfig = typeof ADS_CONFIG;
