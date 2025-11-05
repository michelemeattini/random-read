import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import WikiPost from "@/components/WikiPost";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<number>(0);

  const loadExistingPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('wiki_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading posts:', error);
      return [];
    }

    return data || [];
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
    const existingPosts = await loadExistingPosts();
    const unviewedExisting = existingPosts.filter(p => !viewedPosts.has(p.id));

    const postsToAdd: Post[] = [];

    // Logic: for every 4 existing posts, 1 should be generated
    const existingCount = Math.min(4, unviewedExisting.length);
    postsToAdd.push(...unviewedExisting.slice(0, existingCount));

    if (existingCount === 4 || unviewedExisting.length === 0) {
      const newPost = await generateNewPost();
      if (newPost) {
        postsToAdd.push(newPost);
      }
    }

    if (postsToAdd.length > 0) {
      setPosts(prev => [...prev, ...postsToAdd]);
    }

    setIsLoading(false);
  }, [loadExistingPosts, generateNewPost, viewedPosts]);

  useEffect(() => {
    loadMorePosts();

    // Subscribe to new posts from other users
    const channel = supabase
      .channel('wiki-posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wiki_posts'
        },
        (payload) => {
          const newPost = payload.new as Post;
          if (!viewedPosts.has(newPost.id)) {
            setPosts(prev => {
              const exists = prev.some(p => p.id === newPost.id);
              if (exists) return prev;
              return [...prev, newPost];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const windowHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / windowHeight);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      
      // Preload more posts when approaching the end
      if (newIndex >= posts.length - 2) {
        loadMorePosts();
      }
    }
  }, [currentIndex, posts.length, loadMorePosts]);

  const handlePostViewed = useCallback(async (postId: string) => {
    setViewedPosts(prev => new Set([...prev, postId]));
    
    // Get current view count and increment
    const { data } = await supabase
      .from('wiki_posts')
      .select('view_count')
      .eq('id', postId)
      .single();
    
    if (data) {
      await supabase
        .from('wiki_posts')
        .update({ view_count: data.view_count + 1 })
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
  );
};

export default Index;
