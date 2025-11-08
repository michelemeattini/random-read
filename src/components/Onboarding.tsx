import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Scroll, 
  Library, 
  BarChart3, 
  Heart,
  Sparkles,
  Zap,
  TrendingUp
} from "lucide-react";

interface OnboardingStep {
  icon: React.ElementType;
  title: string;
  description: string;
  tip: string;
  gradient: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    icon: Sparkles,
    title: "Benvenuto su WikiScroll!",
    description: "Scopri contenuti interessanti scorrevoli in un feed infinito di articoli curati.",
    tip: "Scorri verso il basso per esplorare nuovi articoli",
    gradient: "from-primary via-primary-glow to-accent"
  },
  {
    icon: Scroll,
    title: "Scroll Verticale",
    description: "Naviga attraverso gli articoli con uno scroll fluido. Ogni articolo occupa l'intera schermata per un'esperienza immersiva.",
    tip: "Usa la rotella del mouse o swipe per scorrere",
    gradient: "from-accent via-secondary to-primary"
  },
  {
    icon: Heart,
    title: "Salva i Preferiti",
    description: "Metti like agli articoli che ti piacciono e ritrovalli nella tua Libreria personale.",
    tip: "Clicca sul cuore per salvare un articolo",
    gradient: "from-pink-500 via-rose-500 to-red-500"
  },
  {
    icon: Library,
    title: "La Tua Libreria",
    description: "Accedi a tutti gli articoli che hai salvato, organizzati e sempre disponibili.",
    tip: "Trova la Libreria nel menu di navigazione",
    gradient: "from-blue-500 via-indigo-500 to-purple-500"
  },
  {
    icon: BarChart3,
    title: "Statistiche Avanzate",
    description: "Traccia le tue letture, scopri le tue categorie preferite e sblocca achievement.",
    tip: "Visita la sezione Stats nel tuo Profilo",
    gradient: "from-green-500 via-emerald-500 to-teal-500"
  },
  {
    icon: TrendingUp,
    title: "Inizia a Esplorare!",
    description: "Sei pronto per scoprire contenuti straordinari. Buona lettura!",
    tip: "Ricorda: ogni articolo conta per le tue statistiche",
    gradient: "from-orange-500 via-amber-500 to-yellow-500"
  }
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const currentStepData = onboardingSteps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={isVisible} onOpenChange={handleComplete}>
      <DialogContent className="sm:max-w-2xl border-2 border-primary/20 shadow-2xl bg-background/95 backdrop-blur-xl">
        <div className="relative">
          {/* Header with progress */}
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <Badge variant="secondary" className="animate-pulse">
              {currentStep + 1} / {onboardingSteps.length}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleComplete}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <Progress 
            value={progress} 
            className="h-2 mb-8 bg-muted"
          />

          {/* Content */}
          <div className="space-y-6 py-4 animate-fade-in">
            {/* Icon with gradient background */}
            <div className="flex justify-center">
              <div className={`relative p-6 rounded-full bg-gradient-to-br ${currentStepData.gradient} shadow-lg animate-scale-in`}>
                <Icon className="h-12 w-12 text-white" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent animate-glow-pulse" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent animate-fade-in">
              {currentStepData.title}
            </h2>

            {/* Description */}
            <p className="text-center text-muted-foreground text-lg leading-relaxed px-4 animate-fade-in">
              {currentStepData.description}
            </p>

            {/* Tip badge */}
            <div className="flex justify-center animate-fade-in">
              <Badge 
                variant="outline" 
                className="px-4 py-2 text-sm border-primary/30 bg-primary/5"
              >
                <Zap className="h-4 w-4 mr-2 text-primary animate-pulse" />
                {currentStepData.tip}
              </Badge>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8 gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Indietro
            </Button>

            <div className="flex gap-1">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep 
                      ? "w-8 bg-primary" 
                      : index < currentStep
                      ? "w-2 bg-primary/50"
                      : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="gap-2 bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg hover:shadow-primary/50 transition-all duration-300"
            >
              {currentStep === onboardingSteps.length - 1 ? "Inizia" : "Avanti"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Skip button */}
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleComplete}
              className="text-muted-foreground hover:text-foreground"
            >
              Salta tutorial
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
