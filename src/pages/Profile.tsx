import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { User, LogOut, Heart, Bookmark, Loader2, BarChart3 } from "lucide-react";
import { StatsOverview } from "@/components/stats/StatsOverview";
import { CategoryChart } from "@/components/stats/CategoryChart";
import { AchievementGrid } from "@/components/stats/AchievementGrid";

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

interface Profile {
  full_name: string;
  birth_date: string;
  preferred_categories?: string[];
}

interface Post {
  id: string;
  title: string;
  summary: string;
  image_url: string;
  source_url: string;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [isSavingCategories, setIsSavingCategories] = useState(false);
  const [stats, setStats] = useState({
    totalViews: 0,
    todayViews: 0,
    weekViews: 0,
    monthViews: 0,
    yearViews: 0,
    currentStreak: 0,
    avgReadingTime: 0,
    categoryStats: [] as { category: string; count: number }[],
    achievements: [] as any[],
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setPreferredCategories(profileData.preferred_categories || []);
    }

    // Load liked posts
    const { data: likes } = await supabase
      .from("post_likes")
      .select(`
        post_id,
        wiki_posts (*)
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (likes) {
      setLikedPosts(likes.map((like: any) => like.wiki_posts).filter(Boolean));
    }

    // Load saved posts
    const { data: saves } = await supabase
      .from("post_saves")
      .select(`
        post_id,
        wiki_posts (*)
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (saves) {
      setSavedPosts(saves.map((save: any) => save.wiki_posts).filter(Boolean));
    }

    // Load statistics
    await loadStatistics(session.user.id);

    setIsLoading(false);
  };

  const loadStatistics = async (userId: string) => {
    // Get all views
    const { data: views } = await supabase
      .from("post_views")
      .select("*, wiki_posts(category)")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false });

    if (!views) return;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const todayViews = views.filter(v => new Date(v.viewed_at) >= todayStart).length;
    const weekViews = views.filter(v => new Date(v.viewed_at) >= weekStart).length;
    const monthViews = views.filter(v => new Date(v.viewed_at) >= monthStart).length;
    const yearViews = views.filter(v => new Date(v.viewed_at) >= yearStart).length;

    // Calculate streak
    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const viewDates = new Set(
      views.map(v => {
        const date = new Date(v.viewed_at);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    while (viewDates.has(checkDate.getTime())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate average reading time
    const totalReadingTime = views.reduce((acc, v) => acc + (v.reading_time || 0), 0);
    const avgReadingTime = views.length > 0 ? Math.round(totalReadingTime / views.length) : 0;

    // Calculate category stats
    const categoryCount: Record<string, number> = {};
    views.forEach((v: any) => {
      const category = v.wiki_posts?.category || "Altro";
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const categoryStats = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Get achievements
    const { data: allAchievements } = await supabase
      .from("achievements")
      .select("*")
      .order("threshold", { ascending: true });

    const { data: unlockedAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    const unlockedIds = unlockedAchievements?.map(a => a.achievement_id) || [];
    const uniqueCategories = Object.keys(categoryCount).length;

    const achievements = allAchievements?.map(achievement => ({
      ...achievement,
      unlocked: unlockedIds.includes(achievement.id),
      progress:
        achievement.category === "reading"
          ? views.length
          : achievement.category === "streak"
          ? currentStreak
          : uniqueCategories,
    })) || [];

    setStats({
      totalViews: views.length,
      todayViews,
      weekViews,
      monthViews,
      yearViews,
      currentStreak,
      avgReadingTime,
      categoryStats,
      achievements,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout effettuato",
      description: "A presto!",
    });
    navigate("/auth");
  };

  const handleCategoryToggle = (category: string) => {
    setPreferredCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSaveCategories = async () => {
    setIsSavingCategories(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({ preferred_categories: preferredCategories })
      .eq("id", session.user.id);

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare le categorie",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Categorie salvate",
        description: "Le tue preferenze sono state aggiornate",
      });
    }
    
    setIsSavingCategories(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
          >
            ← Indietro
          </Button>
          <h1 className="text-lg font-semibold">Profilo</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
            <User className="w-10 h-10 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
            <p className="text-muted-foreground">
              Nato il {new Date(profile?.birth_date || "").toLocaleDateString("it-IT")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs for Liked, Saved Posts, Statistics, and Categories */}
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="w-full grid grid-cols-4 sticky top-[73px] z-40 bg-background rounded-none border-b">
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="liked" className="gap-2">
            <Heart className="w-4 h-4" />
            Like
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Bookmark className="w-4 h-4" />
            Salvati
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            Categorie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-0 p-4 space-y-6">
          <StatsOverview
            totalViews={stats.totalViews}
            todayViews={stats.todayViews}
            weekViews={stats.weekViews}
            monthViews={stats.monthViews}
            yearViews={stats.yearViews}
            currentStreak={stats.currentStreak}
            avgReadingTime={stats.avgReadingTime}
          />
          
          {stats.categoryStats.length > 0 && (
            <CategoryChart data={stats.categoryStats} />
          )}
          
          <AchievementGrid achievements={stats.achievements} />
        </TabsContent>

        <TabsContent value="liked" className="mt-0">
          {likedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
              <Heart className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nessun post piaciuto</h3>
              <p className="text-muted-foreground">
                I post che ti piacciono appariranno qui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-2">
              {likedPosts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-[9/16] rounded-lg overflow-hidden relative cursor-pointer group"
                  onClick={() => navigate(`/?post=${post.id}`)}
                >
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-white text-sm font-semibold line-clamp-2">
                      {post.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-0">
          {savedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
              <Bookmark className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nessun post salvato</h3>
              <p className="text-muted-foreground">
                I post che salvi appariranno qui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-2">
              {savedPosts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-[9/16] rounded-lg overflow-hidden relative cursor-pointer group"
                  onClick={() => navigate(`/?post=${post.id}`)}
                >
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-white text-sm font-semibold line-clamp-2">
                      {post.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-0 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorie Preferite</CardTitle>
              <CardDescription>
                Seleziona le tue categorie di interesse. Riceverai l'80% dei contenuti da queste categorie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={preferredCategories.includes(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    />
                    <label
                      htmlFor={category}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
              <Button 
                onClick={handleSaveCategories} 
                disabled={isSavingCategories}
                className="w-full"
              >
                {isSavingCategories ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  "Salva Categorie"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
