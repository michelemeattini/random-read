import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const usePostTracking = (postId: string | undefined, userId: string | undefined) => {
  const startTime = useRef<number>(Date.now());
  const tracked = useRef<boolean>(false);

  useEffect(() => {
    if (!postId || !userId || tracked.current) return;

    const trackView = async () => {
      try {
        // Check if already viewed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: existingView } = await supabase
          .from("post_views")
          .select("id")
          .eq("user_id", userId)
          .eq("post_id", postId)
          .gte("viewed_at", today.toISOString())
          .single();

        if (!existingView) {
          await supabase.from("post_views").insert({
            user_id: userId,
            post_id: postId,
            reading_time: 0,
          });

          tracked.current = true;

          // Check for new achievements
          checkAchievements(userId);
        }
      } catch (error) {
        console.error("Error tracking view:", error);
      }
    };

    trackView();

    return () => {
      if (tracked.current) {
        const readingTime = Math.floor((Date.now() - startTime.current) / 1000 / 60);
        if (readingTime > 0) {
          supabase
            .from("post_views")
            .update({ reading_time: readingTime })
            .eq("user_id", userId)
            .eq("post_id", postId)
            .then(() => {});
        }
      }
    };
  }, [postId, userId]);
};

const checkAchievements = async (userId: string) => {
  try {
    // Get total views
    const { count: totalViews } = await supabase
      .from("post_views")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get all achievements
    const { data: achievements } = await supabase
      .from("achievements")
      .select("*")
      .eq("category", "reading");

    // Get unlocked achievements
    const { data: unlockedAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    const unlockedIds = unlockedAchievements?.map((a) => a.achievement_id) || [];

    // Check which achievements should be unlocked
    if (achievements && totalViews) {
      for (const achievement of achievements) {
        if (totalViews >= achievement.threshold && !unlockedIds.includes(achievement.id)) {
          await supabase.from("user_achievements").insert({
            user_id: userId,
            achievement_id: achievement.id,
          });

          // Show celebration toast
          toast({
            title: `🎉 Obiettivo Sbloccato!`,
            description: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
            duration: 5000,
            className: "animate-spring-bounce border-primary/50 bg-gradient-to-r from-primary/20 to-accent/20",
          });
        }
      }
    }

    // Check streak achievements
    await checkStreakAchievements(userId);

    // Check diversity achievements
    await checkDiversityAchievements(userId);
  } catch (error) {
    console.error("Error checking achievements:", error);
  }
};

const checkStreakAchievements = async (userId: string) => {
  try {
    const { data: views } = await supabase
      .from("post_views")
      .select("viewed_at")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false });

    if (!views || views.length === 0) return;

    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const viewDates = new Set(
      views.map((v) => {
        const date = new Date(v.viewed_at);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    while (viewDates.has(checkDate.getTime())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const { data: streakAchievements } = await supabase
      .from("achievements")
      .select("*")
      .eq("category", "streak");

    const { data: unlockedAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    const unlockedIds = unlockedAchievements?.map((a) => a.achievement_id) || [];

    if (streakAchievements) {
      for (const achievement of streakAchievements) {
        if (currentStreak >= achievement.threshold && !unlockedIds.includes(achievement.id)) {
          await supabase.from("user_achievements").insert({
            user_id: userId,
            achievement_id: achievement.id,
          });

          toast({
            title: `🎉 Obiettivo Sbloccato!`,
            description: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
            duration: 5000,
            className: "animate-spring-bounce border-accent/50 bg-gradient-to-r from-accent/20 to-primary/20",
          });
        }
      }
    }
  } catch (error) {
    console.error("Error checking streak achievements:", error);
  }
};

const checkDiversityAchievements = async (userId: string) => {
  try {
    const { data: views } = await supabase
      .from("post_views")
      .select("post_id, wiki_posts(category)")
      .eq("user_id", userId);

    if (!views) return;

    const categories = new Set(
      views
        .map((v: any) => v.wiki_posts?.category)
        .filter((c): c is string => c !== null && c !== undefined)
    );

    const { data: diversityAchievements } = await supabase
      .from("achievements")
      .select("*")
      .eq("category", "diversity");

    const { data: unlockedAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    const unlockedIds = unlockedAchievements?.map((a) => a.achievement_id) || [];

    if (diversityAchievements) {
      for (const achievement of diversityAchievements) {
        if (categories.size >= achievement.threshold && !unlockedIds.includes(achievement.id)) {
          await supabase.from("user_achievements").insert({
            user_id: userId,
            achievement_id: achievement.id,
          });

          toast({
            title: `🎉 Obiettivo Sbloccato!`,
            description: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
            duration: 5000,
            className: "animate-spring-bounce border-category-nature/50 bg-gradient-to-r from-category-nature/20 to-category-science/20",
          });
        }
      }
    }
  } catch (error) {
    console.error("Error checking diversity achievements:", error);
  }
};