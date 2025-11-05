import { useEffect, useState } from "react";

interface WikiPostProps {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  sourceUrl: string;
  onViewed: () => void;
}

const WikiPost = ({ title, summary, imageUrl, sourceUrl, onViewed }: WikiPostProps) => {
  const [animationType] = useState(Math.random() > 0.5 ? "animate-pan" : "animate-zoom");

  useEffect(() => {
    const timer = setTimeout(() => {
      onViewed();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onViewed]);

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
      
      {/* Gradient Overlay for Readability - Lighter to show background better */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 pb-24 animate-fade-in">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight drop-shadow-lg">
            {title}
          </h1>
          
          <p className="text-base md:text-lg text-white/95 leading-relaxed max-w-3xl line-clamp-6 drop-shadow-md">
            {summary}
          </p>
          
          <a 
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-accent hover:text-accent/80 transition-colors"
          >
            Fonte: Wikipedia →
          </a>
        </div>
      </div>
    </div>
  );
};

export default WikiPost;
