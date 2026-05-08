import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Trophy, TrendingUp, Target, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface Performance {
  id: string;
  session_type: string;
  opponent: string;
  result: string;
  score: string;
  date: string;
}

interface UpcomingMatch {
  id: string;
  date: string;
  opponent: string;
  match_type: string;
  goal: string;
}

interface Stats {
  totalMatches: number;
  totalWins: number;
  winRate: number;
  recentStreak: number;
}

interface TournamentAchievement {
  tournamentName: string;
  result: 'Winner' | 'Runner';
  date: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [nextMatch, setNextMatch] = useState<UpcomingMatch | null>(null);
  const [recentPerformances, setRecentPerformances] = useState<Performance[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalMatches: 0,
    totalWins: 0,
    winRate: 0,
    recentStreak: 0
  });
  const [tournamentAchievements, setTournamentAchievements] = useState<TournamentAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const normalizeResult = (result: string | null | undefined) => (result ?? '').trim().toLowerCase();

  const isWin = (result: string | null | undefined) => {
    const r = normalizeResult(result);
    return r === 'win' || r === 'won' || r === 'w';
  };

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch next upcoming match
      const { data: matches } = await supabase
        .from('upcoming_matches')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(1);

      if (matches && matches.length > 0) {
        setNextMatch(matches[0]);
      }

      // Fetch recent performances (we'll use all and slice for display)
      const { data: performances } = await supabase
        .from('performances')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Fetch doubles performances
      const { data: doublesPerformances } = await supabase
        .from('doubles_performances')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Fetch league matches
      const { data: leagueMatches } = await supabase
        .from('league_matches')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (performances) {
        setRecentPerformances(performances);
        
        // Calculate stats including singles, doubles, and league matches
        // Include both regular matches and tournament matches for win rate
        const singlesMatches = performances.filter(
          (p) => (p.session_type ?? '').toLowerCase() !== 'practice'
        );
        const singlesWins = singlesMatches.filter((p) => isWin(p.result)).length;
        
        const doublesMatches = doublesPerformances || [];
        const doublesWins = doublesMatches.filter((p) => isWin(p.result)).length;

        const leagueMatchesData = leagueMatches || [];
        const leagueWins = leagueMatchesData.filter((p) => isWin(p.result)).length;
        
        const totalMatches = singlesMatches.length + doublesMatches.length + leagueMatchesData.length;
        const totalWins = singlesWins + doublesWins + leagueWins;
        const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
        
        // Calculate recent streak (last 5 matches from singles, doubles, and league)
        const allMatches = [
          ...singlesMatches.map(m => ({ ...m, type: 'singles' })),
          ...doublesMatches.map(m => ({ ...m, type: 'doubles' })),
          ...leagueMatchesData.map(m => ({ ...m, type: 'league' }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        let streak = 0;
        for (const match of allMatches.slice(0, 5)) {
          if (isWin(match.result)) {
            streak++;
          } else {
            break;
          }
        }

        setStats({
          totalMatches,
          totalWins,
          winRate,
          recentStreak: streak
        });
      }

      // Fetch tournament finals (both wins and losses)
      const { data: finals } = await supabase
        .from('performances')
        .select('result, date, tournaments(name)')
        .eq('user_id', user.id)
        .eq('round', 'Final')
        .not('tournament_reference', 'is', null);

      if (finals) {
        const achievements = finals.map((final: any) => ({
          tournamentName: final.tournaments?.name || 'Unknown Tournament',
          result: isWin(final.result) ? 'Winner' : 'Runner',
          date: final.date,
        })) as TournamentAchievement[];
        setTournamentAchievements(achievements);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultBadgeVariant = (result: string) => {
    switch (result) {
      case 'Win':
        return 'default';
      case 'Loss':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-slide">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Welcome to KaiForge 2.0, your digital coach! 👊</h1>
        <p className="text-xl text-muted-foreground">Let's level up your game!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMatches}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalWins} wins recorded
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalWins} of {stats.totalMatches} matches
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentStreak}</div>
            <p className="text-xs text-muted-foreground">
              Current winning streak
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentPerformances.length}</div>
            <p className="text-xs text-muted-foreground">
              Matches & practices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tournament Achievements */}
      {tournamentAchievements.length > 0 && (
        <Card className="glass-card hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span>🏆 Tournament Achievements</span>
            </CardTitle>
            <CardDescription>
              Your tournament final appearances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {tournamentAchievements.map((achievement, index) => (
                <Badge 
                  key={index} 
                  variant={achievement.result === 'Winner' ? 'default' : 'secondary'}
                  className="text-sm px-3 py-1.5"
                >
                  {achievement.result === 'Winner' ? '🥇' : '🥈'} {achievement.result} of "{achievement.tournamentName}"
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Next Match Preview */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>🗓️ Your Next Match</span>
            </CardTitle>
            <CardDescription>
              Upcoming scheduled match
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nextMatch ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">{nextMatch.opponent}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(nextMatch.date), 'PPP')}
                    </p>
                    <Badge variant="outline">{nextMatch.match_type}</Badge>
                  </div>
                </div>
                {nextMatch.goal && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      <strong>Goal:</strong> {nextMatch.goal}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Link to="/matches">
                    <Button variant="outline" size="sm">
                      View All Matches
                    </Button>
                  </Link>
                  <Link to="/track">
                    <Button size="sm">
                      Record Result
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No upcoming matches scheduled</p>
                <Link to="/matches">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule a Match
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Performance */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Recent Sessions</span>
            </CardTitle>
            <CardDescription>
              Your latest matches and practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPerformances.length > 0 ? (
              <div className="space-y-3">
                {recentPerformances.slice(0, 5).map((performance) => (
                  <div key={performance.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm">{performance.opponent}</p>
                        <Badge 
                          variant={getResultBadgeVariant(performance.result)}
                          className="text-xs"
                        >
                          {performance.result}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {performance.session_type} • {format(new Date(performance.date), 'MMM d')}
                      </p>
                      {performance.score && (
                        <p className="text-xs font-mono">{performance.score}</p>
                      )}
                    </div>
                  </div>
                ))}
                <Link to="/history">
                  <Button variant="outline" className="w-full mt-4">
                    View All Sessions
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No sessions recorded yet</p>
                <Link to="/track">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Record Your First Session
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/track">
          <Card className="glass-card hover-lift cursor-pointer transition-all duration-300 hover:scale-105">
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Record Session</h3>
                <p className="text-sm text-muted-foreground">Track a new match or practice</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/analytics">
          <Card className="glass-card hover-lift cursor-pointer transition-all duration-300 hover:scale-105">
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">View Analytics</h3>
                <p className="text-sm text-muted-foreground">Analyze your performance trends</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/matches">
          <Card className="glass-card hover-lift cursor-pointer transition-all duration-300 hover:scale-105">
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Schedule Match</h3>
                <p className="text-sm text-muted-foreground">Plan your upcoming games</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}