import { useState, useEffect } from 'react';
import { AdData } from '@/types/ad';
import { useAdTracking } from '@/hooks/useAdTracking';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, ExternalLink } from 'lucide-react';
import { Progress } from './ui/progress';

interface AdPostProps {
  ad: AdData;
}

const AdPost = ({ ad }: AdPostProps) => {
  const [user, setUser] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(ad.skipDelay);
  const [canSkip, setCanSkip] = useState(false);
  const { trackClick, trackSkip, trackFullView } = useAdTracking(ad.id, user?.id);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (timeRemaining <= 0) {
      setCanSkip(true);
      trackFullView();
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining, trackFullView]);

  const handleSkip = () => {
    if (canSkip) {
      trackSkip();
      // Scroll to next post
      const container = document.querySelector('.snap-y');
      if (container) {
        container.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
      }
    }
  };

  const handleCtaClick = () => {
    trackClick();
    window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
  };

  const progressValue = ((ad.skipDelay - timeRemaining) / ad.skipDelay) * 100;

  return (
    <div className="relative h-screen w-screen snap-start snap-always overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary-glow animate-gradient-x" />
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url(${ad.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)',
        }}
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      {/* Sponsored Badge */}
      <div className="absolute top-6 left-6 z-10">
        <Badge 
          variant="secondary" 
          className="backdrop-blur-md bg-background/20 text-foreground border-2 border-primary/50 text-xs font-bold tracking-wider uppercase px-4 py-1.5 animate-glow-pulse"
        >
          ⭐ Sponsorizzato
        </Badge>
      </div>

      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-10">
        <Button
          variant={canSkip ? "default" : "secondary"}
          size="icon"
          onClick={handleSkip}
          disabled={!canSkip}
          className={`backdrop-blur-md transition-all duration-300 ${
            canSkip 
              ? 'animate-spring-bounce hover:scale-110' 
              : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Timer Progress */}
      {!canSkip && (
        <div className="absolute top-20 right-6 z-10 w-48">
          <div className="backdrop-blur-md bg-background/20 rounded-lg p-3 border border-border/50">
            <p className="text-xs text-foreground/80 mb-2 font-medium">
              Salta tra {timeRemaining}s
            </p>
            <Progress value={progressValue} className="h-2" />
          </div>
        </div>
      )}

      {/* Ad Content */}
      <div className="relative h-full flex flex-col justify-end items-start px-6 md:px-12 pb-32 md:pb-24 animate-fade-in-up">
        <div className="max-w-3xl w-full space-y-6 text-left">
          {/* Advertiser */}
          <p className="text-sm font-semibold tracking-widest text-white/70 uppercase">
            {ad.advertiser}
          </p>

          {/* Title */}
          <h1 
            className="text-[2.5rem] leading-[1.1] md:text-5xl font-[700] text-white" 
            style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}
          >
            {ad.title}
          </h1>

          {/* Description */}
          <p 
            className="text-base md:text-lg font-[300] text-white/95 leading-relaxed" 
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.6)' }}
          >
            {ad.description}
          </p>

          {/* CTA Button */}
          <Button
            onClick={handleCtaClick}
            size="lg"
            className="mt-4 text-base font-semibold px-8 py-6 animate-glow-pulse hover:scale-105 transition-transform"
          >
            {ad.ctaText}
            <ExternalLink className="ml-2 w-5 h-5" />
          </Button>

          {/* Disclaimer */}
          <p className="text-xs text-white/60 pt-2">
            Questo contenuto è un annuncio pubblicitario. Supporta WikiScroll guardando gli ads.
          </p>
        </div>
      </div>

      {/* Google AdSense Placeholder (da implementare) */}
      {ad.isGoogleAd && ad.googleAdSlot && (
        <div className="hidden">
          {/* 
            Qui andrà inserito il codice Google AdSense:
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-xxxxx"
                 data-ad-slot={ad.googleAdSlot}
                 data-ad-format="auto"></ins>
          */}
        </div>
      )}
    </div>
  );
};

export default AdPost;
