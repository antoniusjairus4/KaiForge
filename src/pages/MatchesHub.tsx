import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Edit, Trash2, Trophy, Target, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { z } from 'zod';

const singlesSchema = z.object({
  opponent: z.string().min(1, 'Opponent name is required'),
  result: z.enum(['Win', 'Loss'], { required_error: 'Please select a result' }),
  score: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});

const doublesSchema = z.object({
  partnerName: z.string().min(1, 'Partner name is required'),
  opponentNames: z.string().min(1, 'Opponent names are required'),
  result: z.enum(['Win', 'Loss'], { required_error: 'Please select a result' }),
  score: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});

interface Performance {
  id: string;
  session_type: string;
  opponent: string;
  result: string;
  score: string;
  notes: string;
  date: string;
}

interface DoublesPerformance {
  id: string;
  partner_name: string;
  opponent_names: string;
  result: string;
  score: string | null;
  notes: string | null;
  date: string;
}

const MatchesHub = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [singlesMatches, setSinglesMatches] = useState<Performance[]>([]);
  const [doublesMatches, setDoublesMatches] = useState<DoublesPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<'log' | 'records' | 'analytics'>('log');
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  
  const [singlesFormData, setSinglesFormData] = useState({
    opponent: '',
    result: '',
    score: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [doublesFormData, setDoublesFormData] = useState({
    partnerName: '',
    opponentNames: '',
    result: '',
    score: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      const { data: singlesData, error: singlesError } = await supabase
        .from('performances')
        .select('*')
        .eq('user_id', user?.id)
        .eq('session_type', 'Match')
        .order('date', { ascending: false });

      if (singlesError) throw singlesError;

      const { data: doublesData, error: doublesError } = await supabase
        .from('doubles_performances')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (doublesError) throw doublesError;

      setSinglesMatches(singlesData || []);
      setDoublesMatches(doublesData || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to load match history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSinglesInputChange = (name: string, value: string) => {
    setSinglesFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDoublesInputChange = (name: string, value: string) => {
    setDoublesFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSinglesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const validated = singlesSchema.parse(singlesFormData);

      const { error } = await supabase
        .from('performances')
        .insert({
          user_id: user.id,
          session_type: 'Match',
          opponent: validated.opponent,
          result: validated.result,
          score: validated.score || null,
          notes: validated.notes || null,
          date: validated.date,
        });

      if (error) throw error;

      toast({
        title: "Match recorded",
        description: `Singles match against ${validated.opponent} saved successfully.`,
      });

      setSinglesFormData({
        opponent: '',
        result: '',
        score: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });

      fetchMatches();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Error",
          description: "Failed to save match",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDoublesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const validated = doublesSchema.parse(doublesFormData);

      const { error } = await supabase
        .from('doubles_performances')
        .insert({
          user_id: user.id,
          partner_name: validated.partnerName,
          opponent_names: validated.opponentNames,
          result: validated.result,
          score: validated.score || null,
          notes: validated.notes || null,
          date: validated.date,
        });

      if (error) throw error;

      toast({
        title: "Match recorded",
        description: "Doubles match saved successfully.",
      });

      setDoublesFormData({
        partnerName: '',
        opponentNames: '',
        result: '',
        score: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });

      fetchMatches();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Error",
          description: "Failed to save match",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSingles = async (id: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;

    try {
      const { error } = await supabase
        .from('performances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSinglesMatches(prev => prev.filter(m => m.id !== id));
      toast({ title: "Match deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete match", variant: "destructive" });
    }
  };

  const handleDeleteDoubles = async (id: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;

    try {
      const { error } = await supabase
        .from('doubles_performances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDoublesMatches(prev => prev.filter(m => m.id !== id));
      toast({ title: "Match deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete match", variant: "destructive" });
    }
  };

  const getResultBadgeVariant = (result: string) => {
    return result === 'Win' ? 'default' : 'destructive';
  };

  const allMatches = [
    ...singlesMatches.map(m => ({ ...m, type: 'Singles' })),
    ...doublesMatches.map(m => ({ ...m, type: 'Doubles', opponent: m.opponent_names }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalMatches = allMatches.length;
  const totalWins = allMatches.filter(m => m.result === 'Win').length;
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

  const pieData = [
    { name: 'Wins', value: totalWins, color: 'hsl(var(--primary))' },
    { name: 'Losses', value: totalMatches - totalWins, color: 'hsl(var(--destructive))' }
  ];

  const performanceByType = [
    {
      name: 'Singles',
      wins: singlesMatches.filter(m => m.result === 'Win').length,
      losses: singlesMatches.filter(m => m.result === 'Loss').length,
    },
    {
      name: 'Doubles',
      wins: doublesMatches.filter(m => m.result === 'Win').length,
      losses: doublesMatches.filter(m => m.result === 'Loss').length,
    }
  ];

  // Performance trend over time (last 30 days or all available data)
  const trendData = allMatches
    .reduce((acc, match) => {
      const dateStr = format(new Date(match.date), 'MMM dd');
      const existing = acc.find(item => item.date === dateStr);
      
      if (existing) {
        if (match.result === 'Win') existing.wins++;
        else existing.losses++;
      } else {
        acc.push({
          date: dateStr,
          wins: match.result === 'Win' ? 1 : 0,
          losses: match.result === 'Loss' ? 1 : 0,
        });
      }
      return acc;
    }, [] as { date: string; wins: number; losses: number }[])
    .slice(-30); // Last 30 entries

  // Calculate win streak
  let currentStreak = 0;
  let maxStreak = 0;
  let streakData: { match: number; streak: number }[] = [];
  
  allMatches.reverse().forEach((match, index) => {
    if (match.result === 'Win') {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
    streakData.push({ match: index + 1, streak: currentStreak });
  });

  // Opponent performance (top 5 opponents by matches played)
  const opponentStats = allMatches.reduce((acc, match) => {
    if (!acc[match.opponent]) {
      acc[match.opponent] = { opponent: match.opponent, wins: 0, losses: 0, total: 0 };
    }
    acc[match.opponent].total++;
    if (match.result === 'Win') acc[match.opponent].wins++;
    else acc[match.opponent].losses++;
    return acc;
  }, {} as Record<string, { opponent: string; wins: number; losses: number; total: number }>);

  const topOpponents = Object.values(opponentStats)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Matches</h1>

        <div className="max-w-[500px] mx-auto p-4 space-y-4">
          <Card className="bg-card/80 backdrop-blur-sm p-3 space-y-2.5">
            <p className="text-sm font-medium text-muted-foreground px-1">Log Match</p>
            <Button 
              variant={activeView === 'log' && matchType === 'singles' ? 'default' : 'outline'}
              className="w-full h-auto py-3.5 rounded-lg"
              onClick={() => {
                setActiveView('log');
                setMatchType('singles');
              }}
            >
              Singles
            </Button>
            <Button 
              variant={activeView === 'log' && matchType === 'doubles' ? 'default' : 'outline'}
              className="w-full h-auto py-3.5 rounded-lg"
              onClick={() => {
                setActiveView('log');
                setMatchType('doubles');
              }}
            >
              Doubles
            </Button>
          </Card>

          <Button 
            variant={activeView === 'records' ? 'default' : 'outline'}
            className="w-full h-auto py-3.5 rounded-lg"
            onClick={() => setActiveView('records')}
          >
            See Match Records
          </Button>

          <Button 
            variant={activeView === 'analytics' ? 'default' : 'outline'}
            className="w-full h-auto py-3.5 rounded-lg"
            onClick={() => setActiveView('analytics')}
          >
            Match Analytics
          </Button>
        </div>

        <div className="mt-6">
          {activeView === 'log' && (
            <Card>
              <CardHeader>
                <CardTitle>Log {matchType === 'singles' ? 'Singles' : 'Doubles'} Match</CardTitle>
              </CardHeader>
              <CardContent>
                {matchType === 'singles' ? (
                    <form onSubmit={handleSinglesSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="opponent">Opponent</Label>
                        <Input
                          id="opponent"
                          value={singlesFormData.opponent}
                          onChange={(e) => handleSinglesInputChange('opponent', e.target.value)}
                          placeholder="Enter opponent's name"
                        />
                        {errors.opponent && <p className="text-sm text-destructive">{errors.opponent}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="score">Score</Label>
                        <Input
                          id="score"
                          value={singlesFormData.score}
                          onChange={(e) => handleSinglesInputChange('score', e.target.value)}
                          placeholder="e.g., 3-1, 11-9, 11-7, 11-5"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="result">Result</Label>
                        <Select
                          value={singlesFormData.result}
                          onValueChange={(value) => handleSinglesInputChange('result', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select result" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Win">Win</SelectItem>
                            <SelectItem value="Loss">Loss</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.result && <p className="text-sm text-destructive">{errors.result}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={singlesFormData.date}
                          onChange={(e) => handleSinglesInputChange('date', e.target.value)}
                        />
                        {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={singlesFormData.notes}
                          onChange={(e) => handleSinglesInputChange('notes', e.target.value)}
                          placeholder="Optional notes about the match"
                          rows={4}
                        />
                      </div>

                      <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Singles Match'
                        )}
                      </Button>
                    </form>
                ) : (
                    <form onSubmit={handleDoublesSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="partnerName">Partner</Label>
                        <Input
                          id="partnerName"
                          value={doublesFormData.partnerName}
                          onChange={(e) => handleDoublesInputChange('partnerName', e.target.value)}
                          placeholder="Enter partner's name"
                        />
                        {errors.partnerName && <p className="text-sm text-destructive">{errors.partnerName}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="opponentNames">Opponents</Label>
                        <Input
                          id="opponentNames"
                          value={doublesFormData.opponentNames}
                          onChange={(e) => handleDoublesInputChange('opponentNames', e.target.value)}
                          placeholder="e.g., Player A and Player B"
                        />
                        {errors.opponentNames && <p className="text-sm text-destructive">{errors.opponentNames}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="doublesScore">Score</Label>
                        <Input
                          id="doublesScore"
                          value={doublesFormData.score}
                          onChange={(e) => handleDoublesInputChange('score', e.target.value)}
                          placeholder="e.g., 3-1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="doublesResult">Result</Label>
                        <Select
                          value={doublesFormData.result}
                          onValueChange={(value) => handleDoublesInputChange('result', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select result" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Win">Win</SelectItem>
                            <SelectItem value="Loss">Loss</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.result && <p className="text-sm text-destructive">{errors.result}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="doublesDate">Date</Label>
                        <Input
                          id="doublesDate"
                          type="date"
                          value={doublesFormData.date}
                          onChange={(e) => handleDoublesInputChange('date', e.target.value)}
                        />
                        {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="doublesNotes">Notes</Label>
                        <Textarea
                          id="doublesNotes"
                          value={doublesFormData.notes}
                          onChange={(e) => handleDoublesInputChange('notes', e.target.value)}
                          placeholder="Optional notes about the match"
                          rows={4}
                        />
                      </div>

                      <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Doubles Match'
                        )}
                      </Button>
                    </form>
                )}
              </CardContent>
            </Card>
          )}

          {activeView === 'records' && (
            <>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading match records...</p>
              </div>
            ) : allMatches.length > 0 ? (
              <div className="space-y-4">
                {allMatches.map((match) => (
                  <Card key={match.id} className="hover-lift">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-lg">{match.opponent}</h3>
                            <Badge variant={getResultBadgeVariant(match.result)}>
                              {match.result}
                            </Badge>
                            <Badge variant="outline">{match.type}</Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{format(new Date(match.date), 'PPP')}</span>
                            {match.score && <span className="font-mono font-medium">Score: {match.score}</span>}
                          </div>

                          {match.notes && (
                            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                              <p className="text-sm">{match.notes}</p>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => 
                            match.type === 'Singles' 
                              ? handleDeleteSingles(match.id) 
                              : handleDeleteDoubles(match.id)
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground">No match records yet</p>
                </CardContent>
              </Card>
            )}
            </>
          )}

          {activeView === 'analytics' && (
            <>
            {allMatches.length > 0 ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{winRate}%</div>
                      <p className="text-xs text-muted-foreground">
                        {totalWins} wins of {totalMatches} matches
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalMatches}</div>
                      <p className="text-xs text-muted-foreground">Matches played</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Singles</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{singlesMatches.length}</div>
                      <p className="text-xs text-muted-foreground">Singles matches</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Doubles</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{doublesMatches.length}</div>
                      <p className="text-xs text-muted-foreground">Doubles matches</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={performanceByType}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Bar dataKey="wins" fill="hsl(var(--primary))" name="Wins" />
                            <Bar dataKey="losses" fill="hsl(var(--destructive))" name="Losses" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Win Rate Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {trendData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Trend Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="wins" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              name="Wins"
                              dot={{ fill: 'hsl(var(--primary))' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="losses" 
                              stroke="hsl(var(--destructive))" 
                              strokeWidth={2}
                              name="Losses"
                              dot={{ fill: 'hsl(var(--destructive))' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  {streakData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Win Streak Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={streakData}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="match" label={{ value: 'Match Number', position: 'insideBottom', offset: -5 }} />
                              <YAxis label={{ value: 'Current Streak', angle: -90, position: 'insideLeft' }} />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                }}
                              />
                              <Line 
                                type="stepAfter" 
                                dataKey="streak" 
                                stroke="hsl(var(--accent))" 
                                strokeWidth={2}
                                name="Win Streak"
                                dot={{ fill: 'hsl(var(--accent))' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {topOpponents.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Top 5 Opponents</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topOpponents} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis type="number" />
                              <YAxis dataKey="opponent" type="category" width={100} />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                }}
                              />
                              <Bar dataKey="wins" fill="hsl(var(--primary))" name="Wins" stackId="a" />
                              <Bar dataKey="losses" fill="hsl(var(--destructive))" name="Losses" stackId="a" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground">No match data yet</p>
                </CardContent>
              </Card>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchesHub;
