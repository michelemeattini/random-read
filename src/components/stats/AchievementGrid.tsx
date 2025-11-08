import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  category: string;
  unlocked: boolean;
  progress?: number;
}

interface AchievementGridProps {
  achievements: Achievement[];
}

export const AchievementGrid = ({ achievements }: AchievementGridProps) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      reading: "bg-category-science/20 text-category-science border-category-science/50",
      streak: "bg-accent/20 text-accent border-accent/50",
      diversity: "bg-category-nature/20 text-category-nature border-category-nature/50",
    };
    return colors[category] || "bg-primary/20 text-primary border-primary/50";
  };

  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    return 0;
  });

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          Obiettivi e Traguardi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAchievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`relative overflow-hidden transition-all duration-500 ${
                achievement.unlocked
                  ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 hover:scale-105"
                  : "bg-muted/20 border-border/30 opacity-70"
              }`}
            >
              <CardContent className="p-4">
                {achievement.unlocked && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="h-5 w-5 text-primary animate-spring-bounce" />
                  </div>
                )}
                {!achievement.unlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className={`text-4xl transition-transform duration-300 ${
                      achievement.unlocked ? "animate-spring-bounce" : "grayscale"
                    }`}
                  >
                    {achievement.icon}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-1">{achievement.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {achievement.description}
                    </p>
                  </div>
                </div>
                {!achievement.unlocked && achievement.progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold">
                        {achievement.progress} / {achievement.threshold}
                      </span>
                    </div>
                    <Progress
                      value={(achievement.progress / achievement.threshold) * 100}
                      className="h-2 animate-fade-in"
                    />
                  </div>
                )}
                <Badge
                  variant="outline"
                  className={`mt-3 text-xs ${getCategoryColor(achievement.category)}`}
                >
                  {achievement.category === "reading" && "Lettura"}
                  {achievement.category === "streak" && "Costanza"}
                  {achievement.category === "diversity" && "Esplorazione"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};