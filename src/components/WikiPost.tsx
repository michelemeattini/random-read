import { useEffect, useState } from "react";
import PostActions from "./PostActions";
import { ExternalLink } from "lucide-react";
import { Badge } from "./ui/badge";

interface WikiPostProps {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  sourceUrl: string;
  category?: string;
  onViewed: () => void;
}

const WikiPost = ({ id, title, summary, imageUrl, sourceUrl, category, onViewed }: WikiPostProps) => {
  const [animationType] = useState(Math.random() > 0.5 ? "animate-pan" : "animate-zoom");
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    if (!hasViewed) {
      const timer = setTimeout(() => {
        onViewed();
        setHasViewed(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasViewed, onViewed]);

  const extractDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="relative h-screen w-screen snap-start snap-always overflow-hidden bg-black">
      {/* Background Image with Animation */}
      <div 
        className="absolute inset-0 animate-zoom-bg"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      
      {/* Dark Overlay + Gradient for Readability */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      
      {/* Post Actions (Like, Save, Share) */}
      <PostActions postId={id} />
      
      {/* Content - Bottom Left Aligned */}
      <div className="relative h-full flex flex-col justify-end items-start px-6 md:px-12 pb-32 md:pb-24 animate-fade-in-up">
        <div className="max-w-3xl w-full space-y-4 text-left">
          {/* Title (Micro Riassunto) */}
          <h1 className="text-[2.5rem] leading-[1.1] md:text-5xl font-[700] text-white" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}>
            {title}
          </h1>
          
          {/* Detailed Explanation */}
          <p className="text-base md:text-lg font-[300] text-white/95 leading-relaxed" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.6)' }}>
            {summary}
          </p>
          
          {/* Category Badge */}
          {category && (
            <div className="flex justify-start pt-1">
              <Badge 
                variant="secondary" 
                className={`backdrop-blur-md text-xs font-semibold tracking-wider uppercase px-4 py-1.5 border-2 transition-all duration-300 hover:scale-105 ${
                  category.toLowerCase().includes('scien') ? 'bg-category-science/20 text-category-science border-category-science/50 hover:shadow-[0_0_20px_hsl(var(--category-science)/0.5)]' :
                  category.toLowerCase().includes('tech') ? 'bg-category-technology/20 text-category-technology border-category-technology/50 hover:shadow-[0_0_20px_hsl(var(--category-technology)/0.5)]' :
                  category.toLowerCase().includes('stor') || category.toLowerCase().includes('hist') ? 'bg-category-history/20 text-category-history border-category-history/50 hover:shadow-[0_0_20px_hsl(var(--category-history)/0.5)]' :
                  category.toLowerCase().includes('natur') ? 'bg-category-nature/20 text-category-nature border-category-nature/50 hover:shadow-[0_0_20px_hsl(var(--category-nature)/0.5)]' :
                  category.toLowerCase().includes('spaz') || category.toLowerCase().includes('space') ? 'bg-category-space/20 text-category-space border-category-space/50 hover:shadow-[0_0_20px_hsl(var(--category-space)/0.5)]' :
                  category.toLowerCase().includes('art') ? 'bg-category-art/20 text-category-art border-category-art/50 hover:shadow-[0_0_20px_hsl(var(--category-art)/0.5)]' :
                  category.toLowerCase().includes('cultur') ? 'bg-category-culture/20 text-category-culture border-category-culture/50 hover:shadow-[0_0_20px_hsl(var(--category-culture)/0.5)]' :
                  'bg-category-default/20 text-category-default border-category-default/50 hover:shadow-[0_0_20px_hsl(var(--category-default)/0.5)]'
                }`}
              >
                {category}
              </Badge>
            </div>
          )}
          
          {/* Sources */}
          <div className="space-y-1 pt-2">
            <p className="text-xs font-semibold tracking-widest text-white/70 uppercase">FONTE:</p> <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm inline-flex items-center gap-2 text-white hover:underline drop-shadow-md"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {extractDomain(sourceUrl)}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WikiPost;
