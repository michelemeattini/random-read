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

  useEffect(() => {
    const timer = setTimeout(() => {
      onViewed();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onViewed]);

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
      
      {/* Content - Centered Vertically and Horizontally */}
      <div className="relative h-full flex flex-col justify-center items-center px-6 pb-32 md:pb-24 animate-fade-in-up">
        <div className="max-w-3xl w-full space-y-6 text-center">
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
            <div className="flex justify-center pt-2">
              <Badge 
                variant="secondary" 
                className="bg-white/10 text-white border border-white/20 backdrop-blur-md text-xs font-semibold tracking-wider uppercase px-4 py-1.5"
              >
                {category}
              </Badge>
            </div>
          )}
          
          {/* Sources */}
          <div className="space-y-2 pt-4">
            <p className="text-xs font-semibold tracking-widest text-white/70 uppercase">FONTI</p>
            <a
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
