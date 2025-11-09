import { useState, useEffect } from 'react';
import { AdData } from '@/types/ad';
import { useAdTracking } from '@/hooks/useAdTracking';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ExternalLink } from 'lucide-react';

interface AdCardProps {
  ad: AdData;
}

const AdCard = ({ ad }: AdCardProps) => {
  const [user, setUser] = useState<any>(null);
  const { trackClick } = useAdTracking(ad.id, user?.id);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleClick = () => {
    trackClick();
    window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-accent/10 to-primary-glow/10 animate-glow-pulse"
      onClick={handleClick}
    >
      <CardContent className="p-0 relative">
        {/* Sponsored Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge 
            variant="secondary" 
            className="backdrop-blur-md bg-background/80 text-foreground text-[10px] font-bold tracking-wider uppercase px-2 py-1"
          >
            ⭐ Ad
          </Badge>
        </div>

        {/* Image */}
        <div className="relative w-full pt-[75%] overflow-hidden">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
          <p className="text-[10px] font-semibold tracking-wider text-white/70 uppercase mb-1">
            {ad.advertiser}
          </p>
          <h3 className="text-sm font-bold text-white mb-1 line-clamp-2 leading-tight">
            {ad.title}
          </h3>
          <p className="text-xs text-white/80 line-clamp-2 mb-2">
            {ad.description}
          </p>
          
          {/* CTA */}
          <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:text-primary-glow transition-colors">
            {ad.ctaText}
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>

        {/* Google AdSense Placeholder */}
        {ad.isGoogleAd && ad.googleAdSlot && (
          <div className="hidden">
            {/* Codice Google AdSense per card format */}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdCard;
