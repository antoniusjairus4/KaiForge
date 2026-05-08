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
import { Clock, Calendar, FileText, Trash2, Loader2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { z } from 'zod';

const practiceSchema = z.object({
  practiceType: z.string().min(1, 'Practice type is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  notes: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});

interface PracticeSession {
  id: string;
  practice_type: string;
  duration: number;
  notes: string | null;
  date: string;
  created_at: string;
}

const PracticeHub = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<'log' | 'sessions' | 'analytics'>('log');
  const [formData, setFormData] = useState({
    practiceType: '',
    duration: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const colors = ['#00FFAB', '#FF6EC7', '#00cfff', '#ffd500', '#ff9a3c', '#7d5fff'];

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching practice sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load practice sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const validated = practiceSchema.parse({
        ...formData,
        duration: parseInt(formData.duration),
      });

      const { error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          practice_type: validated.practiceType,
          duration: validated.duration,
          notes: validated.notes || null,
          date: validated.date,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Practice session logged successfully",
      });

      setFormData({
        practiceType: '',
        duration: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });

      fetchSessions();
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
          description: "Failed to log practice session",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this practice session?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('practice_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setSessions(prev => prev.filter(session => session.id !== id));
      toast({
        title: "Session Deleted",
        description: "Practice session has been removed",
      });
    } catch (error) {
      console.error('Error deleting practice session:', error);
      toast({
        title: "Error",
        description: "Failed to delete practice session",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPracticeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Forehand Loops': 'bg-red-500/10 text-red-400 border-red-500/20',
      'Backhand Loops': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Serve Practice': 'bg-green-500/10 text-green-400 border-green-500/20',
      'Footwork Drills': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      'Multi-ball Drills': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Other': 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    };
    return colors[type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  const getChartData = () => {
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

  const chartData = getChartData();
  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Practice</h1>

        <div className="max-w-[500px] mx-auto p-4 space-y-3">
          <Button 
            variant={activeView === 'log' ? 'default' : 'outline'}
            className="w-full h-auto py-3.5 rounded-lg"
            onClick={() => setActiveView('log')}
          >
            Log Practice
          </Button>
          <Button 
            variant={activeView === 'sessions' ? 'default' : 'outline'}
            className="w-full h-auto py-3.5 rounded-lg"
            onClick={() => setActiveView('sessions')}
          >
            See Practice Sessions
          </Button>
          <Button 
            variant={activeView === 'analytics' ? 'default' : 'outline'}
            className="w-full h-auto py-3.5 rounded-lg"
            onClick={() => setActiveView('analytics')}
          >
            Practice Analysis
          </Button>
        </div>

        <div className="mt-6">
          {activeView === 'log' && (
            <Card>
              <CardHeader>
                <CardTitle>Log Practice</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                    {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practiceType">Type</Label>
                    <Select
                      value={formData.practiceType}
                      onValueChange={(value) => handleInputChange('practiceType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select practice type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Forehand Loops">Forehand Loops</SelectItem>
                        <SelectItem value="Backhand Loops">Backhand Loops</SelectItem>
                        <SelectItem value="Serve Practice">Serve Practice</SelectItem>
                        <SelectItem value="Footwork Drills">Footwork Drills</SelectItem>
                        <SelectItem value="Multi-ball Drills">Multi-ball Drills</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.practiceType && <p className="text-sm text-destructive">{errors.practiceType}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      placeholder="e.g., 60"
                    />
                    {errors.duration && <p className="text-sm text-destructive">{errors.duration}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Optional notes about the session"
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
                      'Save Practice Session'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeView === 'sessions' && (
            <>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading practice sessions...</p>
              </div>
            ) : sessions.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => (
                  <Card key={session.id} className="hover-scale group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`${getPracticeTypeColor(session.practice_type)} border text-xs`}>
                          {session.practice_type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(session.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{formatDuration(session.duration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>{format(new Date(session.date), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </CardHeader>

                    {session.notes && (
                      <CardContent className="pt-0">
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <h5 className="font-medium text-sm mb-1">Notes</h5>
                              <p className="text-xs text-muted-foreground line-clamp-3">
                                {session.notes}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground">No practice sessions yet</p>
                </CardContent>
              </Card>
            )}
            </>
          )}

          {activeView === 'analytics' && (
            <>
            {sessions.length > 0 ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                      <Calendar className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalSessions}</div>
                      <p className="text-xs text-muted-foreground">Practice sessions recorded</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                      <Clock className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalHours}h {stats.totalMinutes % 60}m</div>
                      <p className="text-xs text-muted-foreground">Time spent practicing</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatDuration(stats.avgSessionLength)}</div>
                      <p className="text-xs text-muted-foreground">Average session length</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Practice Type Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
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
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

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
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground">No practice data yet</p>
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

export default PracticeHub;
