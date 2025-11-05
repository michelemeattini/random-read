import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Bookmark, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface PostActionsProps {
  postId: string;
}

const PostActions = ({ postId }: PostActionsProps) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadState();
  }, [postId]);

  const checkAuthAndLoadState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setUserId(null);
      return;
    }

    setUserId(session.user.id);

    // Check if post is liked
    const { data: likeData } = await supabase
      .from("post_likes")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("post_id", postId)
      .single();

    setIsLiked(!!likeData);

    // Check if post is saved
    const { data: saveData } = await supabase
      .from("post_saves")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("post_id", postId)
      .single();

    setIsSaved(!!saveData);
  };

  const handleLike = async () => {
    if (!userId) {
      toast({
        title: "Accedi per continuare",
        description: "Devi essere autenticato per mettere mi piace",
        variant: "destructive",
      });
      return;
    }

    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);

      if (!error) {
        setIsLiked(false);
      }
    } else {
      // Like
      const { error } = await supabase
        .from("post_likes")
        .insert({ user_id: userId, post_id: postId });

      if (!error) {
        setIsLiked(true);
      }
    }
  };

  const handleSave = async () => {
    if (!userId) {
      toast({
        title: "Accedi per continuare",
        description: "Devi essere autenticato per salvare",
        variant: "destructive",
      });
      return;
    }

    if (isSaved) {
      // Unsave
      const { error } = await supabase
        .from("post_saves")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);

      if (!error) {
        setIsSaved(false);
        toast({
          title: "Post rimosso",
          description: "Post rimosso dai salvati",
        });
      }
    } else {
      // Save
      const { error } = await supabase
        .from("post_saves")
        .insert({ user_id: userId, post_id: postId });

      if (!error) {
        setIsSaved(true);
        toast({
          title: "Post salvato",
          description: "Puoi trovarlo nella sezione Salvati del tuo profilo",
        });
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "WikiScroll",
          text: "Scopri questo post su WikiScroll!",
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiato!",
        description: "Il link è stato copiato negli appunti",
      });
    }
  };

  return (
    <div className="absolute right-4 bottom-24 flex flex-col gap-4 z-10">
      <Button
        variant="ghost"
        size="icon"
        className="h-14 w-14 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50"
        onClick={handleLike}
      >
        <Heart
          className={`h-7 w-7 ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`}
        />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-14 w-14 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50"
        onClick={handleSave}
      >
        <Bookmark
          className={`h-7 w-7 ${isSaved ? "fill-yellow-500 text-yellow-500" : "text-white"}`}
        />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-14 w-14 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50"
        onClick={handleShare}
      >
        <Share2 className="h-7 w-7 text-white" />
      </Button>
    </div>
  );
};

export default PostActions;
