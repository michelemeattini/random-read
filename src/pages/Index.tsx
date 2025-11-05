import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import WikiPost from "@/components/WikiPost";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Post {
  id: string;
  title: string;
  summary: string;
  image_url: string;
  source_url: string;
  created_at: string;
}

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewedPostIds, setViewedPostIds] = useState<Set<string>>(() => {
    // Load viewed posts from localStorage
    const stored = localStorage.getItem('viewedPostIds');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadExistingPosts = useCallback(async (excludeIds: Set<string>) => {
    const { data, error } = await supabase
      .from('wiki_posts')
      .select('*')
      .not('id', 'in', `(${Array.from(excludeIds).join(',') || 'null'})`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading posts:', error);
      return [];
    }

    // Filter out already viewed posts
    return (data || []).filter(post => !excludeIds.has(post.id));
  }, []);

  const generateNewPost = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 2000) {
      return null;
    }
    
    lastFetchRef.current = now;
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-wiki-post');
      
      if (error) throw error;
      
      if (data?.post) {
        return data.post;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error generating post:', error);
      
      if (error?.message?.includes('429')) {
        toast({
          title: "Rallenta un attimo!",
          description: "Troppi contenuti generati. Riprova tra poco.",
          variant: "destructive",
        });
      } else if (error?.message?.includes('402')) {
        toast({
          title: "Crediti esauriti",
          description: "I crediti Lovable AI sono finiti. Contatta l'admin.",
          variant: "destructive",
        });
      }
      
      return null;
    }
  }, [toast]);

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMoreRef.current) return;
    
    isLoadingMoreRef.current = true;
    
    // Get all post IDs we've already loaded (viewed or in current list)
    const allLoadedIds = new Set([
      ...viewedPostIds,
      ...posts.map(p => p.id)
    ]);
    
    const existingPosts = await loadExistingPosts(allLoadedIds);
    const postsToAdd: Post[] = [];

    // Logic: for every 4 existing posts, 1 should be generated
    const existingCount = Math.min(4, existingPosts.length);
    
    if (existingCount > 0) {
      postsToAdd.push(...existingPosts.slice(0, existingCount));
    }

    // Generate new post if we've shown 4 existing or no existing posts available
    if (existingCount === 4 || existingPosts.length === 0) {
      const newPost = await generateNewPost();
      if (newPost && !allLoadedIds.has(newPost.id)) {
        postsToAdd.push(newPost);
      }
    }

    if (postsToAdd.length > 0) {
      setPosts(prev => [...prev, ...postsToAdd]);
    }

    setIsLoading(false);
    isLoadingMoreRef.current = false;
  }, [loadExistingPosts, generateNewPost, viewedPostIds, posts]);

  useEffect(() => {
    loadMorePosts();
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const windowHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / windowHeight);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      
      // Load more posts when approaching the end (2 posts before the last)
      if (newIndex >= posts.length - 2 && !isLoadingMoreRef.current) {
        loadMorePosts();
      }
    }
  }, [currentIndex, posts.length, loadMorePosts]);

  const handlePostViewed = useCallback(async (postId: string) => {
    // Mark as viewed in state and localStorage
    setViewedPostIds(prev => {
      const newSet = new Set([...prev, postId]);
      localStorage.setItem('viewedPostIds', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
    
    // Increment view count in database
    const { data } = await supabase
      .from('wiki_posts')
      .select('view_count')
      .eq('id', postId)
      .single();
    
    if (data) {
      await supabase
        .from('wiki_posts')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', postId);
    }
  }, []);

  if (isLoading && posts.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      {/* Top Navigation Bar - Desktop only */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-white text-xl font-bold">WikiScroll</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => isAuthenticated ? navigate("/profile") : navigate("/auth")}
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Bottom Navigation Bar - Mobile only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center justify-center p-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => isAuthenticated ? navigate("/profile") : navigate("/auth")}
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory"
        onScroll={handleScroll}
        style={{ overscrollBehaviorY: 'contain' }}
      >
        {posts.map((post) => (
          <WikiPost
            key={post.id}
            id={post.id}
            title={post.title}
            summary={post.summary}
            imageUrl={post.image_url}
            sourceUrl={post.source_url}
            onViewed={() => handlePostViewed(post.id)}
          />
        ))}
        
        {isLoading && posts.length > 0 && (
          <div className="h-screen w-screen flex items-center justify-center snap-start">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}
      </div>
    </>
  );
};

export default Index;
