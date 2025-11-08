import { Card, CardContent } from "@/components/ui/card";
import { Eye, Flame, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface StatsOverviewProps {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
  yearViews: number;
  currentStreak: number;
  avgReadingTime: number;
}

export const StatsOverview = ({
  totalViews,
  todayViews,
  weekViews,
  monthViews,
  yearViews,
  currentStreak,
  avgReadingTime,
}: StatsOverviewProps) => {
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedStreak, setAnimatedStreak] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const totalIncrement = totalViews / steps;
    const streakIncrement = currentStreak / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step <= steps) {
        setAnimatedTotal(Math.floor(totalIncrement * step));
        setAnimatedStreak(Math.floor(streakIncrement * step));
      } else {
        setAnimatedTotal(totalViews);
        setAnimatedStreak(currentStreak);
        clearInterval(interval);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [totalViews, currentStreak]);

  const getStreakEmoji = () => {
    if (currentStreak >= 30) return "💪";
    if (currentStreak >= 7) return "⚡";
    if (currentStreak >= 3) return "🔥";
    return "📚";
  };

  const getStreakColor = () => {
    if (currentStreak >= 30) return "text-category-space";
    if (currentStreak >= 7) return "text-category-technology";
    if (currentStreak >= 3) return "text-accent";
    return "text-primary";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-primary/20 hover:shadow-lg hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-1">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Eye className="h-8 w-8 text-primary animate-glow-pulse" />
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-bold text-foreground animate-spring-bounce">
              {animatedTotal}
            </p>
            <p className="text-sm text-muted-foreground font-medium">Articoli Letti</p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
              <div>
                <p className="text-xs text-muted-foreground">Oggi</p>
                <p className="text-lg font-semibold text-primary">{todayViews}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Settimana</p>
                <p className="text-lg font-semibold text-primary">{weekViews}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mese</p>
                <p className="text-lg font-semibold text-primary">{monthViews}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Anno</p>
                <p className="text-lg font-semibold text-primary">{yearViews}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-accent/20 hover:shadow-lg hover:shadow-accent/20 transition-all duration-500 hover:-translate-y-1">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-5xl animate-spring-bounce">{getStreakEmoji()}</span>
          </div>
          <div className="space-y-2">
            <p className={`text-4xl font-bold ${getStreakColor()} animate-spring-bounce`}>
              {animatedStreak}
            </p>
            <p className="text-sm text-muted-foreground font-medium">Giorni di Streak</p>
            {currentStreak >= 30 && (
              <p className="text-xs text-category-space font-semibold animate-glow-pulse">
                🎉 Inarrestabile!
              </p>
            )}
            {currentStreak >= 7 && currentStreak < 30 && (
              <p className="text-xs text-category-technology font-semibold animate-glow-pulse">
                ⚡ Ottimo lavoro!
              </p>
            )}
            {currentStreak >= 3 && currentStreak < 7 && (
              <p className="text-xs text-accent font-semibold">
                🔥 Continua così!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-category-technology/20 hover:shadow-lg hover:shadow-category-technology/20 transition-all duration-500 hover:-translate-y-1">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="h-8 w-8 text-category-technology" />
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-bold text-foreground">
              {avgReadingTime}
            </p>
            <p className="text-sm text-muted-foreground font-medium">Tempo Medio (min)</p>
            <p className="text-xs text-muted-foreground pt-2">
              Tempo medio di lettura per articolo
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-category-science/20 hover:shadow-lg hover:shadow-category-science/20 transition-all duration-500 hover:-translate-y-1">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">🎯</span>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-bold text-foreground">
              {Math.round((totalViews / 500) * 100)}%
            </p>
            <p className="text-sm text-muted-foreground font-medium">Verso Maestro</p>
            <p className="text-xs text-muted-foreground pt-2">
              {totalViews} / 500 articoli
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};