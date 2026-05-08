import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Trophy, Target, Calendar } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface Performance {
  id: string;
  session_type: string;
  opponent: string;
  result: string;
  score: string;
  date: string;
}

interface ChartData {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  total: number;
}

interface TrendData {
  date: string;
  wins: number;
  losses: number;
  winRate: number;
}

const COLORS = {
  wins: 'hsl(var(--primary))',
  losses: 'hsl(var(--destructive))',
  draws: 'hsl(var(--muted-foreground))',
};

export default function Analytics() {
  const { user } = useAuth();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionTypeData, setSessionTypeData] = useState<ChartData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalWins: 0,
    winRate: 0,
    bestOpponent: '',
    worstOpponent: '',
    winStreak: 0,
    mostPlayedOpponent: '',
  });

  useEffect(() => {
    if (user) {
      fetchPerformances();
    }
  }, [user]);

  useEffect(() => {
    if (performances.length > 0) {
      processAnalytics();
    }
  }, [performances]);

  const fetchPerformances = async () => {
    if (!user) return;

    try {
      // Fetch singles performances
      const { data: singlesData, error: singlesError } = await supabase
        .from('performances')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      // Fetch doubles performances
      const { data: doublesData, error: doublesError } = await supabase
        .from('doubles_performances')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (singlesError) {
        console.error('Error fetching singles performances:', singlesError);
      }
      if (doublesError) {
        console.error('Error fetching doubles performances:', doublesError);
      }
      
      // Combine singles and doubles data
      const combinedData = [
        ...(singlesData || []),
        ...(doublesData || []).map(d => ({
          ...d,
          session_type: 'Match',
          opponent: d.opponent_names
        }))
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setPerformances(combinedData);
    } catch (error) {
      console.error('Error fetching performances:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = () => {
    // Session type breakdown
    const sessionTypes = ['Practice', 'Match'];
    const sessionTypeStats = sessionTypes.map(type => {
      const sessions = performances.filter(p => p.session_type === type);
      const wins = sessions.filter(p => p.result === 'Win').length;
      const losses = sessions.filter(p => p.result === 'Loss').length;
      const draws = sessions.filter(p => p.result === 'Draw').length;
      
      return {
        name: type,
        wins,
        losses,
        draws,
        total: sessions.length,
      };
    });
    setSessionTypeData(sessionTypeStats);

    // Pie chart data for overall results
    const allResults = performances.reduce((acc, p) => {
      acc[p.result] = (acc[p.result] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieChartData = Object.entries(allResults).map(([result, count]) => ({
      name: result,
      value: count,
      color: COLORS[result.toLowerCase() as keyof typeof COLORS] || COLORS.draws,
    }));
    setPieData(pieChartData);

    // Trend analysis (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayPerformances = performances.filter(p => p.date === dateStr);
      
      const wins = dayPerformances.filter(p => p.result === 'Win').length;
      const losses = dayPerformances.filter(p => p.result === 'Loss').length;
      const total = dayPerformances.length;
      
      return {
        date: format(date, 'MMM dd'),
        wins,
        losses,
        winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      };
    }).filter(d => d.wins > 0 || d.losses > 0); // Only show days with activity

    setTrendData(last30Days);

    // Calculate general stats
    const matches = performances.filter(p => p.session_type === 'Match');
    const totalMatches = matches.length;
    const totalWins = matches.filter(p => p.result === 'Win').length;
    const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

    // Find best/worst opponents (by win rate, minimum 2 matches)
    const opponentStats = matches.reduce((acc, match) => {
      if (!acc[match.opponent]) {
        acc[match.opponent] = { wins: 0, total: 0 };
      }
      acc[match.opponent].total++;
      if (match.result === 'Win') {
        acc[match.opponent].wins++;
      }
      return acc;
    }, {} as Record<string, { wins: number; total: number }>);

    const qualifiedOpponents = Object.entries(opponentStats).filter(([_, stats]) => stats.total >= 2);
    
    let bestOpponent = '';
    let worstOpponent = '';
    let bestWinRate = 0;
    let worstWinRate = 100;

    qualifiedOpponents.forEach(([opponent, stats]) => {
      const winRate = (stats.wins / stats.total) * 100;
      if (winRate > bestWinRate) {
        bestWinRate = winRate;
        bestOpponent = opponent;
      }
      if (winRate < worstWinRate) {
        worstWinRate = winRate;
        worstOpponent = opponent;
      }
    });

    // Find most played opponent
    const mostPlayedOpponent = Object.entries(opponentStats)
      .sort(([,a], [,b]) => b.total - a.total)[0]?.[0] || '';

    // Calculate current win streak
    let winStreak = 0;
    for (let i = matches.length - 1; i >= 0; i--) {
      if (matches[i].result === 'Win') {
        winStreak++;
      } else {
        break;
      }
    }

    setStats({
      totalMatches,
      totalWins,
      winRate,
      bestOpponent,
      worstOpponent,
      winStreak,
      mostPlayedOpponent,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
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

  if (performances.length === 0) {
    return (
      <div className="space-y-8 animate-fade-slide">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center space-x-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            <span>📈 Your Growth Overview</span>
          </h1>
          <p className="text-muted-foreground">
            Analyze your performance trends and track your improvement
          </p>
        </div>

        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <TrendingUp className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data to analyze yet</h3>
            <p className="text-muted-foreground mb-6">
              Start recording your matches and practice sessions to see your performance analytics
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-slide">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center space-x-2">
          <TrendingUp className="w-8 h-8 text-primary" />
          <span>📈 Your Growth Overview</span>
        </h1>
        <p className="text-muted-foreground">
          Analyze your performance trends and track your improvement
        </p>
      </div>

      {/* Key Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalWins} wins of {stats.totalMatches} matches
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Streak</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winStreak}</div>
            <p className="text-xs text-muted-foreground">
              Current winning streak
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Played</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{stats.mostPlayedOpponent || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Favorite opponent
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Matchup</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{stats.bestOpponent || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Highest win rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Wins vs Losses by Session Type */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <CardTitle>Performance by Session Type</CardTitle>
            <CardDescription>
              Compare your wins and losses in matches vs practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionTypeData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Bar dataKey="wins" fill={COLORS.wins} name="Wins" />
                  <Bar dataKey="losses" fill={COLORS.losses} name="Losses" />
                  <Bar dataKey="draws" fill={COLORS.draws} name="Draws" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Overall Results Distribution */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <CardTitle>Results Distribution</CardTitle>
            <CardDescription>
              Overall breakdown of your match results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend */}
      {trendData.length > 0 && (
        <Card className="glass-card hover-lift">
          <CardHeader>
            <CardTitle>Performance Trend (Last 30 Days)</CardTitle>
            <CardDescription>
              Track your win rate and activity over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="wins" 
                    stroke={COLORS.wins} 
                    strokeWidth={2}
                    name="Wins"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="losses" 
                    stroke={COLORS.losses} 
                    strokeWidth={2}
                    name="Losses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            Key takeaways from your playing data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.winRate >= 60 && (
              <div className="flex items-center space-x-2">
                <Badge variant="default">Strong Performance</Badge>
                <span className="text-sm">Your {stats.winRate}% win rate shows excellent consistency!</span>
              </div>
            )}
            {stats.winStreak >= 3 && (
              <div className="flex items-center space-x-2">
                <Badge variant="default">Hot Streak</Badge>
                <span className="text-sm">You're on fire with a {stats.winStreak}-game win streak!</span>
              </div>
            )}
            {stats.totalMatches >= 10 && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Dedicated Player</Badge>
                <span className="text-sm">You've recorded {stats.totalMatches} matches - great commitment!</span>
              </div>
            )}
            {stats.bestOpponent && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Favorable Matchup</Badge>
                <span className="text-sm">You perform best against {stats.bestOpponent}</span>
              </div>
            )}
            {stats.worstOpponent && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Challenge Ahead</Badge>
                <span className="text-sm">{stats.worstOpponent} has been your toughest opponent</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}