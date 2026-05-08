import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { Clock, TrendingUp, Calendar, Activity } from 'lucide-react';

interface PracticeSession {
  id: string;
  practice_type: string;
  duration: number;
  date: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

const PracticeAnalytics = () => {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const colors = ['#ff3c38', '#ff9a3c', '#ffd500', '#00cfff', '#7d5fff', '#ff5fc1'];

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('id, practice_type, duration, date')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching practice sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load practice analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getChartData = (): ChartData[] => {
    const typeMap = new Map<string, number>();
    
    sessions.forEach(session => {
      const current = typeMap.get(session.practice_type) || 0;
      typeMap.set(session.practice_type, current + session.duration);
    });

    return Array.from(typeMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getTotalStats = () => {
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
    const avgSessionLength = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
    
    return {
      totalSessions,
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      avgSessionLength
    };
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTimelineData = () => {
    const dateMap = new Map<string, number>();
    
    sessions.forEach(session => {
      const current = dateMap.get(session.date) || 0;
      dateMap.set(session.date, current + session.duration);
    });

    return Array.from(dateMap.entries())
      .map(([date, duration]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        duration
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 days
  };

  const getSessionCountData = () => {
    const typeMap = new Map<string, number>();
    
    sessions.forEach(session => {
      const current = typeMap.get(session.practice_type) || 0;
      typeMap.set(session.practice_type, current + 1);
    });

    return Array.from(typeMap.entries())
      .map(([name, count], index) => ({
        name,
        count,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.count - a.count);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatDuration(data.value)} ({((data.value / getTotalStats().totalMinutes) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading practice analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = getChartData();
  const stats = getTotalStats();
  const timelineData = getTimelineData();
  const sessionCountData = getSessionCountData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-responsive">
      <div className="responsive-container mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="text-xl md:text-2xl">📊</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Practice Overview</h1>
          </div>
          <p className="text-muted-foreground text-base md:text-lg">
            Analyze your training patterns and progress
          </p>
        </div>

        {sessions.length > 0 ? (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid-responsive animate-fade-in">
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Practice sessions recorded
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                  <Clock className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalHours}h {stats.totalMinutes % 60}m</div>
                  <p className="text-xs text-muted-foreground">
                    Time spent practicing
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(stats.avgSessionLength)}</div>
                  <p className="text-xs text-muted-foreground">
                    Average session length
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Practice Duration Timeline */}
            <Card className="glass-card animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Practice Duration Over Time
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Daily practice minutes (last 14 days)
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any) => [`${value} min`, 'Duration']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="duration" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sessions by Type Bar Chart */}
            <Card className="glass-card animate-fade-in" style={{ animationDelay: '150ms' }}>
              <CardHeader>
                <CardTitle className="text-xl">Session Count by Type</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Number of sessions per practice type
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessionCountData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        label={{ value: 'Sessions', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any) => [`${value} sessions`, 'Count']}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {sessionCountData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart - Practice Type Distribution */}
            <Card className="glass-card animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <CardTitle className="text-xl">Practice Type Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Time spent on different practice types
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  {chartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              No Practice Data Yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Start logging your practice sessions to see detailed analytics about your training patterns and progress.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeAnalytics;