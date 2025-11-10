import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import WikiPost from "@/components/WikiPost";
import AdPost from "@/components/AdPost";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePostTracking } from "@/hooks/usePostTracking";
import { Onboarding } from "@/components/Onboarding";
import { injectAds, isAd } from "@/utils/adInjection";
import { PostOrAd } from "@/types/ad";

interface Post {
  id: string;
  title: string;
  summary: string;
  image_url: string;
  source_url: string;
  category?: string;
  created_at: string;
}

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsWithAds, setPostsWithAds] = useState<PostOrAd[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewedPostIds, setViewedPostIds] = useState<Set<string>>(() => {
    // Load viewed posts from localStorage
    const stored = localStorage.getItem('viewedPostIds');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);
  const initialLoadRef = useRef(false);

  // Track current post being viewed (skip if it's an ad)
  const currentItem = postsWithAds[currentIndex];
  const currentPost = currentItem && !isAd(currentItem) ? currentItem : null;
  usePostTracking(currentPost?.id, userId);

  // Inject ads when posts change
  useEffect(() => {
    const injected = injectAds(posts);
    setPostsWithAds(injected);
  }, [posts]);

  // Check if user has seen onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      // Delay onboarding slightly to let the page load
      setTimeout(() => setShowOnboarding(true), 500);
    }
  }, []);

  useEffect(() => {
    // Check auth status and load preferences
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        setUserId(session.user.id);
        loadUserPreferences(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        setUserId(session.user.id);
        loadUserPreferences(session.user.id);
      } else {
        setUserId(undefined);
        setPreferredCategories([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserPreferences = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('preferred_categories')
      .eq('id', userId)
      .single();
    
    if (data?.preferred_categories) {
      setPreferredCategories(data.preferred_categories);
    }
  };

  const loadExistingPosts = useCallback(async (excludeIds: Set<string>) => {
    // 80% chance to load unviewed posts, 20% to load any posts
    const shouldLoadUnviewed = Math.random() < 0.8;
    
    let query = supabase
      .from('wiki_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (shouldLoadUnviewed && excludeIds.size > 0) {
      // Load only unviewed posts
      query = query.not('id', 'in', `(${Array.from(excludeIds).join(',')})`);
    }

    // If user has preferred categories, apply filter
    if (preferredCategories.length > 0 && Math.random() < 0.8) {
      query = query.in('category', preferredCategories);
    }

    const { data, error } = await query.limit(20);

    if (error) {
      console.error('Error loading posts:', error);
      return [];
    }

    return data || [];
  }, [preferredCategories]);

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMoreRef.current) return;
    
    isLoadingMoreRef.current = true;
    
    // Get all post IDs we've already loaded
    const allLoadedIds = new Set(posts.map(p => p.id));
    
    const existingPosts = await loadExistingPosts(allLoadedIds);
    
    // Load more posts at once for smoother experience
    const batchSize = 5;
    
    if (existingPosts.length > 0) {
      setPosts(prev => [...prev, ...existingPosts.slice(0, batchSize)]);
    }

    isLoadingMoreRef.current = false;
  }, [loadExistingPosts, posts]);

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      // Load initial batch immediately
      loadMorePosts();
    }
  }, [loadMorePosts]);

  // Background pre-loading
  useEffect(() => {
    const preloadInterval = setInterval(() => {
      // Always keep at least 3 posts ahead (accounting for ads)
      if (postsWithAds.length - currentIndex <= 5 && !isLoadingMoreRef.current) {
        loadMorePosts();
      }
    }, 2000);

    return () => clearInterval(preloadInterval);
  }, [postsWithAds.length, currentIndex, loadMorePosts]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const windowHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / windowHeight);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    toast({
      title: "🎉 Benvenuto!",
      description: "Inizia a esplorare i contenuti scorrendo verso il basso.",
    });
  };

  const handlePostViewed = useCallback(async (postId: string) => {
    // Avoid duplicate view tracking
    if (viewedPostIds.has(postId)) return;
    
    // Mark as viewed in state and localStorage
    setViewedPostIds(prev => {
      const newSet = new Set([...prev, postId]);
      localStorage.setItem('viewedPostIds', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
    
    // Increment view count in database (fire and forget, no await)
    supabase
      .from('wiki_posts')
      .select('view_count')
      .eq('id', postId)
      .single()
      .then(({ data }) => {
        if (data) {
          supabase
            .from('wiki_posts')
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq('id', postId);
        }
      });
  }, [viewedPostIds]);

  // Show loader only if no posts after 500ms
  if (postsWithAds.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      {/* Onboarding Dialog */}
      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {/* Top Navigation Bar - Desktop only */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between p-4 px-6">
          <h1 
            className="text-2xl font-bold bg-gradient-to-r from-accent via-category-science to-category-technology bg-clip-text text-transparent"
            style={{ 
              backgroundImage: 'var(--gradient-brand)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text'
            }}
          >
            WikiScroll
          </h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 hover:shadow-lg hover:shadow-accent/30"
              onClick={() => navigate("/library")}
            >
              <Library className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 hover:shadow-lg hover:shadow-accent/30"
              onClick={() => isAuthenticated ? navigate("/profile") : navigate("/auth")}
            >
              <User className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar - Mobile only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-t border-white/10">
        <div className="container flex items-center justify-around px-4 py-3">
          <h1 
            className="text-lg font-bold bg-gradient-to-r from-accent via-category-science to-category-technology bg-clip-text text-transparent"
            style={{ 
              backgroundImage: 'var(--gradient-brand)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text'
            }}
          >
            WikiScroll
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 active:scale-95"
            onClick={() => navigate("/library")}
          >
            <Library className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 active:scale-95"
            onClick={() => isAuthenticated ? navigate("/profile") : navigate("/auth")}
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        onScroll={handleScroll}
        style={{ overscrollBehaviorY: 'contain' }}
      >
        {postsWithAds.map((item, index) => 
          isAd(item) ? (
            <AdPost key={`ad-${item.id}-${index}`} ad={item} />
          ) : (
            <WikiPost
              key={item.id}
              id={item.id}
              title={item.title}
              summary={item.summary}
              imageUrl={item.image_url}
              sourceUrl={item.source_url}
              category={item.category}
              onViewed={() => handlePostViewed(item.id)}
            />
          )
        )}
        
        {isLoading && postsWithAds.length > 0 && (
          <div className="h-screen w-screen flex items-center justify-center snap-start">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}
      </div>
    </>
  );
};

export default Index;
