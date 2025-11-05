import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Bookmark, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PostActionsProps {
  postId: string;
}

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return count.toString();
};

const PostActions = ({ postId }: PostActionsProps) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);

  useEffect(() => {
    checkAuthAndLoadState();
    loadCounts();
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

  const loadCounts = async () => {
    // Get like count
    const { count: likes } = await supabase
      .from("post_likes")
      .select("*", { count: 'exact', head: true })
      .eq("post_id", postId);

    setLikeCount(likes || 0);

    // Get save count
    const { count: saves } = await supabase
      .from("post_saves")
      .select("*", { count: 'exact', head: true })
      .eq("post_id", postId);

    setSaveCount(saves || 0);
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
        setLikeCount(prev => Math.max(0, prev - 1));
      }
    } else {
      // Like
      const { error } = await supabase
        .from("post_likes")
        .insert({ user_id: userId, post_id: postId });

      if (!error) {
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
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
        setSaveCount(prev => Math.max(0, prev - 1));
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
        setSaveCount(prev => prev + 1);
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
    <div className="absolute right-3 bottom-32 md:bottom-24 flex flex-col gap-6 z-10">
      <button
        onClick={handleLike}
        className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
      >
        <Heart
          className={`w-9 h-9 drop-shadow-lg ${isLiked ? "fill-red-500 text-red-500" : ""}`}
          strokeWidth={2}
        />
        <span className="text-xs font-semibold drop-shadow-lg">
          {formatCount(likeCount)}
        </span>
      </button>

      <button
        onClick={handleSave}
        className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
      >
        <Bookmark
          className={`w-9 h-9 drop-shadow-lg ${isSaved ? "fill-white text-white" : ""}`}
          strokeWidth={2}
        />
        <span className="text-xs font-semibold drop-shadow-lg">
          {formatCount(saveCount)}
        </span>
      </button>

      <button
        onClick={handleShare}
        className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
      >
        <Share2 className="w-9 h-9 drop-shadow-lg" strokeWidth={2} />
      </button>
    </div>
  );
};

export default PostActions;
