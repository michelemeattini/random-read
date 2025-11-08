import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface Post {
  id: string;
  title: string;
  summary: string;
  image_url: string;
  source_url: string;
  category?: string;
  created_at: string;
}

interface GroupedPosts {
  [category: string]: Post[];
}

const Library = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [groupedPosts, setGroupedPosts] = useState<GroupedPosts>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);
  const POSTS_PER_PAGE = 30;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  const loadPosts = useCallback(async () => {
    if (!hasMore) return;
    if (isLoading) return;
    
    setIsLoading(true);
    const from = pageRef.current * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('wiki_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error loading posts:', error);
      setIsLoading(false);
      return;
    }

    if (data) {
      if (data.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }
      setPosts(prev => [...prev, ...data]);
      pageRef.current += 1;
    }
    
    setIsLoading(false);
  }, [hasMore, isLoading, POSTS_PER_PAGE]);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    // Group posts by category
    const grouped = posts.reduce((acc, post) => {
      const category = post.category || 'Generale';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(post);
      return acc;
    }, {} as GroupedPosts);
    
    setGroupedPosts(grouped);
  }, [posts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadPosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadPosts]);

  const handlePostClick = (sourceUrl: string) => {
    window.open(sourceUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Libreria</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => isAuthenticated ? navigate("/profile") : navigate("/auth")}
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {Object.keys(groupedPosts).length === 0 && !isLoading ? (
          <p className="text-center text-muted-foreground py-8">Nessun contenuto disponibile</p>
        ) : (
          Object.entries(groupedPosts).map(([category, categoryPosts]) => (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-bold mb-4 capitalize">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handlePostClick(post.source_url)}
                    className="group cursor-pointer bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all duration-300"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-[700] text-base mb-2 line-clamp-2">{post.title}</h3>
                      <p className="font-[300] text-sm text-muted-foreground line-clamp-3">{post.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg overflow-hidden border border-border">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intersection observer target */}
        <div ref={observerTarget} className="h-4" />
      </div>
    </div>
  );
};

export default Library;
