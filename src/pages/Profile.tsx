import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { supabase } from '@/integrations/supabase/client';
import { User, Trophy, Target, Calendar } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { stats: dashboardStats } = useDashboardSummary(user?.id);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalMatches: 0,
    winRate: 0,
    totalSessions: 0,
    joinDate: '',
  });
  const [tournamentAchievements, setTournamentAchievements] = useState<Array<{
    tournamentName: string;
    result: '1st' | '2nd' | '3rd';
    date: string;
    tournamentId: string;
  }>>([]);

  const normalizeResult = (result: string | null | undefined) => (result ?? '').trim().toLowerCase();
  const isWin = (result: string | null | undefined) => {
    const r = normalizeResult(result);
    return r === 'win' || r === 'won' || r === 'w';
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTournamentAchievements();
    }
  }, [user]);

  // Sync stats from dashboard hook (includes singles + doubles + league matches)
  useEffect(() => {
    if (!user) return;
    setStats({
      totalMatches: dashboardStats.totalMatches,
      winRate: dashboardStats.winRate,
      totalSessions: dashboardStats.totalMatches,
      joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown',
    });
  }, [user, dashboardStats]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setProfile(data);
  };

  const fetchTournamentAchievements = async () => {
    if (!user) return;

    // Fetch all final appearances (winners = 1st place)
    const { data: finals } = await supabase
      .from('performances')
      .select('tournament_reference, date, result, tournaments(name)')
      .eq('user_id', user.id)
      .eq('round', 'Final')
      .not('tournament_reference', 'is', null);

    // Fetch semi-final losses (3rd place - lost in semi means 3rd/4th)
    const { data: semiFinals } = await supabase
      .from('performances')
      .select('tournament_reference, date, result, tournaments(name)')
      .eq('user_id', user.id)
      .eq('round', 'Semi Final')
      .not('tournament_reference', 'is', null);

    const achievements: Array<{
      tournamentName: string;
      result: '1st' | '2nd' | '3rd';
      date: string;
      tournamentId: string;
    }> = [];

    // Process finals
    if (finals) {
      finals.forEach((match: any) => {
        achievements.push({
          tournamentName: match.tournaments?.name || 'Unknown Tournament',
          result: isWin(match.result) ? '1st' : '2nd',
          date: match.date,
          tournamentId: match.tournament_reference,
        });
      });
    }

    // Process semi-final losses as 3rd place
    if (semiFinals) {
      semiFinals.forEach((match: any) => {
        if (!isWin(match.result)) {
          // Only count losses in semi-final as 3rd place
          achievements.push({
            tournamentName: match.tournaments?.name || 'Unknown Tournament',
            result: '3rd',
            date: match.date,
            tournamentId: match.tournament_reference,
          });
        }
      });
    }

    // Sort by date descending
    achievements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTournamentAchievements(achievements);
  };

  return (
    <div className="space-y-8 animate-fade-slide">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center space-x-2">
          <User className="w-8 h-8 text-primary" />
          <span>👤 Your Player Stats</span>
        </h1>
        <p className="text-muted-foreground">
          Your table tennis journey summary
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: tournamentAchievements.length > 0 ? 'repeat(2, 1fr)' : '1fr' }}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {tournamentAchievements.length > 0 && (
            <TabsTrigger value="tournaments">
              🏆 Tournament Achievements
              <Badge variant="default" className="ml-2">
                {tournamentAchievements.length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg">{profile?.name || user?.email?.split('@')[0] || 'Player'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="text-lg">{stats.joinDate}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Matches Played</span>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {stats.totalMatches}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Win Rate (%)</span>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {stats.winRate}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Sessions</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {stats.totalSessions}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-card text-center p-6">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalMatches}</div>
              <div className="text-sm text-muted-foreground">Matches Played</div>
            </Card>
            <Card className="glass-card text-center p-6">
              <Target className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.winRate}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </Card>
            <Card className="glass-card text-center p-6">
              <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </Card>
          </div>
        </TabsContent>

        {tournamentAchievements.length > 0 && (
          <TabsContent value="tournaments" className="space-y-6 mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  Your Tournament Achievements
                </CardTitle>
                <CardDescription>
                  Podium finishes in tournaments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tournamentAchievements.map((achievement, index) => {
                    const medal = achievement.result === '1st' ? '🥇' : achievement.result === '2nd' ? '🥈' : '🥉';
                    const badgeVariant = achievement.result === '1st' ? 'default' : achievement.result === '2nd' ? 'secondary' : 'outline';
                    const label = achievement.result === '1st' ? 'Champion' : achievement.result === '2nd' ? 'Runner-up' : '3rd Place';
                    
                    return (
                      <div
                        key={`${achievement.tournamentId}-${achievement.result}-${index}`}
                        className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                            {medal}
                          </div>
                          <div>
                            <p className="font-medium">{achievement.tournamentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(achievement.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={badgeVariant}>
                          {label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}