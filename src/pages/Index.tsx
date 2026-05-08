import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, TrendingUp, Target, Dumbbell, Swords, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useDashboardSummary, type RecentActivityItem } from '@/hooks/useDashboardSummary';

interface Stats {
  totalMatches: number;
  totalWins: number;
  winRate: number;
  winStreak: number;
  totalPracticeMinutes: number;
  totalTournaments: number;
}

const motivationalQuotes = [
  "Excellence is not a skill. It is an attitude.",
  "Champions keep playing until they get it right.",
  "The harder the battle, the sweeter the victory.",
  "Success is where preparation and opportunity meet.",
  "It's not whether you get knocked down, it's whether you get up.",
  "The only way to prove you are a good sport is to lose.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones."
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quote] = useState(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  const { stats, recentActivity, loading } = useDashboardSummary(user?.id);

  const getActivityIcon = (item: RecentActivityItem) => {
    if (item.kind === 'singles') {
      return item.tournament_reference ? <Trophy className="w-4 h-4" /> : <Swords className="w-4 h-4" />;
    }
    return <Dumbbell className="w-4 h-4" />;
  };

  const getActivityText = (item: RecentActivityItem) => {
    if (item.kind === 'singles') {
      return `${item.result} vs ${item.opponent}`;
    }
    return `${item.practice_type} - ${item.duration}min`;
  };

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Section with Quote */}
        <div className="text-center space-y-4 py-12">
          <div className="inline-block">
            <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-medium border-primary/30">
              KaiForge Performance Tracker
            </Badge>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto italic">
            "{quote}"
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card hover-lift border-primary/10 transition-all duration-300 hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Matches</CardTitle>
              <Trophy className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalMatches}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalWins} victories
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift border-primary/10 transition-all duration-300 hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
              <Target className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.winRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Success rate
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift border-primary/10 transition-all duration-300 hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Streak</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.winStreak}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Consecutive wins
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift border-primary/10 transition-all duration-300 hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Practice Time</CardTitle>
              <Dumbbell className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatMinutes(stats.totalPracticeMinutes)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Training logged
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <Card className="glass-card border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest sessions and matches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200 hover:bg-secondary/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getActivityIcon(item)}
                      </div>
                      <div>
                        <p className="font-medium">{getActivityText(item)}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(item.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                     {item.kind === 'singles' && (
                      <Badge variant={item.result === 'Win' ? 'default' : 'destructive'}>
                        {item.result}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Navigation Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card 
            className="glass-card hover-lift cursor-pointer border-primary/10 group transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
            onClick={() => navigate('/practice')}
          >
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300">
                  <Dumbbell className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Practice</h3>
                  <p className="text-sm text-muted-foreground">
                    Log training sessions and track improvement
                  </p>
                </div>
                <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all duration-300">
                  <span>Enter</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass-card hover-lift cursor-pointer border-primary/10 group transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
            onClick={() => navigate('/matches-hub')}
          >
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 group-hover:from-secondary/30 group-hover:to-secondary/10 transition-all duration-300">
                  <Swords className="w-12 h-12 text-secondary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Matches</h3>
                  <p className="text-sm text-muted-foreground">
                    Record match results and analyze performance
                  </p>
                </div>
                <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all duration-300">
                  <span>Enter</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass-card hover-lift cursor-pointer border-primary/10 group transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
            onClick={() => navigate('/tournament')}
          >
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300">
                  <Trophy className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Tournaments</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage tournaments and competitive matches
                  </p>
                </div>
                <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all duration-300">
                  <span>Enter</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
