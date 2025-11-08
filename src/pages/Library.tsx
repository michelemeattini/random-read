import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Search, X, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
  id: string;
  title: string;
  summary: string;
  image_url: string;
  source_url: string;
  category?: string;
  created_at: string;
  view_count?: number;
}

interface GroupedPosts {
  [category: string]: Post[];
}

const AVAILABLE_CATEGORIES = [
  "Scienza e Tecnologia",
  "Storia",
  "Arte e Cultura",
  "Natura",
  "Geografia",
  "Sport",
  "Medicina",
  "Astronomia",
  "Musica",
  "Letteratura"
];

type SortOption = 'recent' | 'popular' | 'alphabetical';

const Library = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [groupedPosts, setGroupedPosts] = useState<GroupedPosts>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showViewed, setShowViewed] = useState<boolean | null>(null); // null = all, true = viewed, false = not viewed
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewedPostIds, setViewedPostIds] = useState<Set<string>>(new Set());
  const observerTarget = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);
  const POSTS_PER_PAGE = 30;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    
    // Load viewed posts from localStorage
    const stored = localStorage.getItem('viewedPostIds');
    if (stored) {
      setViewedPostIds(new Set(JSON.parse(stored)));
    }
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
    // Filter posts based on search query
    let filteredPosts = searchQuery
      ? posts.filter(post => 
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.summary.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : posts;

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filteredPosts = filteredPosts.filter(post => 
        selectedCategories.includes(post.category || 'Generale')
      );
    }

    // Filter by viewed status
    if (showViewed !== null) {
      filteredPosts = filteredPosts.filter(post => 
        showViewed ? viewedPostIds.has(post.id) : !viewedPostIds.has(post.id)
      );
    }

    // Sort posts
    const sortedPosts = [...filteredPosts].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'popular':
          return (b.view_count || 0) - (a.view_count || 0);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    // Group filtered posts by category
    const grouped = sortedPosts.reduce((acc, post) => {
      const category = post.category || 'Generale';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(post);
      return acc;
    }, {} as GroupedPosts);
    
    setGroupedPosts(grouped);
  }, [posts, searchQuery, selectedCategories, showViewed, sortBy, viewedPostIds]);

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

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleViewedFilter = () => {
    setShowViewed(prev => {
      if (prev === null) return true; // Show only viewed
      if (prev === true) return false; // Show only not viewed
      return null; // Show all
    });
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setShowViewed(null);
    setSearchQuery("");
  };

  const getCategoryColor = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('scien') || lowerCategory.includes('tecn')) return 'bg-category-science/20 text-category-science border-category-science/50 hover:bg-category-science/30';
    if (lowerCategory.includes('stor') || lowerCategory.includes('hist')) return 'bg-category-history/20 text-category-history border-category-history/50 hover:bg-category-history/30';
    if (lowerCategory.includes('natur')) return 'bg-category-nature/20 text-category-nature border-category-nature/50 hover:bg-category-nature/30';
    if (lowerCategory.includes('spaz') || lowerCategory.includes('astron')) return 'bg-category-space/20 text-category-space border-category-space/50 hover:bg-category-space/30';
    if (lowerCategory.includes('art') || lowerCategory.includes('cultur') || lowerCategory.includes('music') || lowerCategory.includes('letter')) return 'bg-category-art/20 text-category-art border-category-art/50 hover:bg-category-art/30';
    return 'bg-category-default/20 text-category-default border-category-default/50 hover:bg-category-default/30';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="hover:scale-110 transition-all duration-300 hover:bg-accent/10"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 
              className="text-xl font-bold bg-gradient-to-r from-accent via-category-science to-category-technology bg-clip-text text-transparent"
              style={{ 
                backgroundImage: 'var(--gradient-brand)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text'
              }}
            >
              Libreria
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="hover:scale-110 transition-all duration-300 hover:bg-accent/10"
              onClick={() => isAuthenticated ? navigate("/profile") : navigate("/auth")}
            >
              <User className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca per titolo o parole chiave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Bar */}
          <div className="space-y-3">
            {/* Sort and Viewed Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2 hover:scale-105 transition-all duration-300"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {sortBy === 'recent' ? 'Più recenti' : sortBy === 'popular' ? 'Più popolari' : 'Alfabetico'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-card/95 backdrop-blur-xl border-border/50">
                  <DropdownMenuItem onClick={() => setSortBy('recent')}>
                    Più recenti
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('popular')}>
                    Più popolari
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('alphabetical')}>
                    Alfabetico
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Badge
                variant="outline"
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  showViewed === true 
                    ? 'bg-accent/20 text-accent border-accent/50' 
                    : showViewed === false 
                    ? 'bg-muted/20 text-muted-foreground border-muted-foreground/50'
                    : 'hover:bg-accent/10'
                }`}
                onClick={toggleViewedFilter}
              >
                {showViewed === true ? 'Solo visti' : showViewed === false ? 'Non visti' : 'Tutti'}
              </Badge>

              {(selectedCategories.length > 0 || showViewed !== null || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  Cancella filtri
                </Button>
              )}
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {AVAILABLE_CATEGORIES.map((category) => (
                <Badge
                  key={category}
                  variant="outline"
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedCategories.includes(category)
                      ? getCategoryColor(category)
                      : 'hover:bg-accent/10'
                  }`}
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {Object.keys(groupedPosts).length === 0 && !isLoading ? (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery ? "Nessun risultato trovato" : "Nessun contenuto disponibile"}
          </p>
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
