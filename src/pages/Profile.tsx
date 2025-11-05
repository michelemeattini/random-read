import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { User, LogOut, Heart, Bookmark, Loader2 } from "lucide-react";

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

    setIsLoading(false);
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

      {/* Tabs for Liked, Saved Posts, and Categories */}
      <Tabs defaultValue="liked" className="w-full">
        <TabsList className="w-full grid grid-cols-3 sticky top-[73px] z-40 bg-background rounded-none border-b">
          <TabsTrigger value="liked" className="gap-2">
            <Heart className="w-4 h-4" />
            Mi piace
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Bookmark className="w-4 h-4" />
            Salvati
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            Categorie
          </TabsTrigger>
        </TabsList>

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
