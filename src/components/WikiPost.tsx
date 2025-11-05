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
    <div className="relative h-screen w-screen snap-start snap-always overflow-hidden">
      {/* Background Image with Animation */}
      <div 
        className={`absolute inset-0 ${animationType}`}
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      
      {/* Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
      
      {/* Post Actions (Like, Save, Share) */}
      <PostActions postId={id} />
      
      {/* Content - Centered Vertically and Horizontally */}
      <div className="relative h-full flex flex-col justify-center items-center px-6 pb-32 md:pb-24 animate-fade-in">
        <div className="max-w-3xl w-full space-y-6 text-center">
          {/* Title (Micro Riassunto) */}
          <h1 className="text-[2.5rem] leading-[1.1] md:text-5xl font-black text-white drop-shadow-2xl" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
            {title}
          </h1>
          
          {/* Detailed Explanation */}
          <p className="text-base md:text-lg font-normal text-white leading-relaxed drop-shadow-lg" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.5)' }}>
            {summary}
          </p>
          
          {/* Category Badge */}
          {category && (
            <div className="flex justify-center pt-2">
              <Badge 
                variant="secondary" 
                className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs font-bold tracking-wider uppercase px-3 py-1"
              >
                {category}
              </Badge>
            </div>
          )}
          
          {/* Sources */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold tracking-widest text-white/80 uppercase">FONTI</p>
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
