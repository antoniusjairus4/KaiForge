import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Trash2, Clock, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface PracticeSession {
  id: string;
  practice_type: string;
  duration: number;
  notes: string | null;
  date: string;
  created_at: string;
}

const PracticeHistory = () => {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading practice sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📁</span>
            </div>
            <h1 className="text-3xl font-bold">Past Practice Sessions</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Review and manage your training history
          </p>
        </div>

        {/* Sessions Grid */}
        {sessions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session, index) => (
              <Card 
                key={session.id} 
                className="glass-card hover-scale group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`${getPracticeTypeColor(session.practice_type)} border text-xs`}>
                      {session.practice_type}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(session.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
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
          <div className="text-center py-12 animate-fade-in">
            <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🏓</span>
            </div>
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              No Practice Sessions Yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Start logging your practice sessions to track your training progress and see your improvement over time.
            </p>
            <Button 
              onClick={() => window.location.href = '/practice-sessions'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Log Your First Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeHistory;