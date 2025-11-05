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
      
      {/* Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/80" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 pb-20 animate-fade-in">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            {title}
          </h1>
          
          <p className="text-lg md:text-xl text-white/95 leading-relaxed max-w-3xl">
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
