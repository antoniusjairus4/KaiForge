import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Target, Clock, Flame, Lightbulb, Loader2 } from 'lucide-react';

interface Drill {
  drill_type: string;
  focus_area: string;
  duration: number;
  difficulty: string;
  description: string;
  tip: string;
}

const AIDrillCoach = () => {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateDrills = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate personalized drills",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-drill-recommendations', {
        body: { userId: user.id }
      });

      if (error) throw error;

      setDrills(data.drills || []);
      toast({
        title: "🎯 Smart Drills Generated!",
        description: "Your personalized training plan is ready",
      });
    } catch (error) {
      console.error('Error generating drills:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate drills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Drill Coach
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get personalized training drills based on your match and practice data. 
            Our AI analyzes your performance to create targeted improvement plans.
          </p>
        </div>

        {/* Generate Button */}
        <div className="text-center mb-8">
          <Button
            onClick={generateDrills}
            disabled={isGenerating}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl hover-scale"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Your Game...
              </>
            ) : (
              <>
                <Bot className="w-5 h-5 mr-2" />
                🎯 Generate Smart Drills
              </>
            )}
          </Button>
        </div>

        {/* Drills Grid */}
        {drills.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {drills.map((drill, index) => (
              <Card 
                key={index} 
                className="glass-card hover-scale group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {drill.drill_type}
                    </CardTitle>
                    <Badge className={`${getDifficultyColor(drill.difficulty)} border`}>
                      <Flame className="w-3 h-3 mr-1" />
                      {drill.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-primary" />
                      <span>{drill.focus_area}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{drill.duration} mins</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">📋 Drill Details</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {drill.description}
                    </p>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-sm text-primary mb-1">💡 Coach Tip</h5>
                        <p className="text-xs text-foreground/80">
                          {drill.tip}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {drills.length === 0 && !isGenerating && (
          <div className="text-center py-12 animate-fade-in">
            <Bot className="w-24 h-24 text-muted-foreground/50 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              Ready to Level Up Your Game?
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Click the button above to generate personalized drills based on your performance history. 
              The more matches you track, the smarter the recommendations become!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDrillCoach;