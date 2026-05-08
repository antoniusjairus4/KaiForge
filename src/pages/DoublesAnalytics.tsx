import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

type DoublesPerformance = {
  id: string;
  partner_name: string;
  opponent_names: string;
  result: string;
  score: string | null;
  notes: string | null;
  date: string;
  created_at: string;
};

export default function DoublesAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<DoublesPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('doubles_performances')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch doubles matches.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for charts
  const resultData = matches.reduce((acc, match) => {
    const existing = acc.find(item => item.result === match.result);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ result: match.result, count: 1 });
    }
    return acc;
  }, [] as { result: string; count: number }[]);

  const trendsData = matches.map((match, index) => ({
    date: match.date,
    match: index + 1,
    result: match.result === 'Win' ? 1 : match.result === 'Draw' ? 0.5 : 0,
    resultLabel: match.result
  }));

  const pieColors = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--secondary))'];

  if (loading) {
    return (
      <div className="responsive-container mx-auto">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="responsive-container mx-auto">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">📈 Doubles Performance Overview</CardTitle>
            <CardDescription>Your doubles match analytics will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No doubles matches recorded yet. Start logging matches to see your analytics!
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="responsive-container mx-auto space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">📈 Doubles Performance Overview</CardTitle>
          <CardDescription>Analyze your doubles match performance and trends</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wins vs Losses Bar Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Wins vs Losses</CardTitle>
            <CardDescription>Distribution of match results</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={resultData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="result" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Results Pie Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Match Results Distribution</CardTitle>
            <CardDescription>Breakdown of wins, losses, and draws</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={resultData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="count"
                  label={({ result, count }) => `${result}: ${count}`}
                >
                  {resultData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Match Trends Over Time */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Match Trends Over Time</CardTitle>
          <CardDescription>Performance progression across matches</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="match" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{ value: 'Match Number', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                domain={[0, 1]}
                ticks={[0, 0.5, 1]}
                tickFormatter={(value) => value === 1 ? 'Win' : value === 0.5 ? 'Draw' : 'Loss'}
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value, name, props) => [props.payload.resultLabel, 'Result']}
                labelFormatter={(label) => `Match ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="result" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{matches.length}</div>
              <div className="text-sm text-muted-foreground">Total Matches</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {((matches.filter(m => m.result === 'Win').length / matches.length) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {new Set(matches.map(m => m.partner_name)).size}
              </div>
              <div className="text-sm text-muted-foreground">Different Partners</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}