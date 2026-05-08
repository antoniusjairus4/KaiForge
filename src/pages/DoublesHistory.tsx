import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Calendar, Users, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

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

export default function DoublesHistory() {
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
        .order('date', { ascending: false });

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

  const deleteMatch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('doubles_performances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMatches(prev => prev.filter(match => match.id !== id));
      toast({
        title: "Success",
        description: "Match deleted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete match.",
        variant: "destructive",
      });
    }
  };

  const getResultVariant = (result: string) => {
    switch (result) {
      case 'Win': return 'default';
      case 'Loss': return 'destructive';
      case 'Draw': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="responsive-container mx-auto">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="responsive-container mx-auto">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            📁 Past Doubles Matches
          </CardTitle>
          <CardDescription>
            View and manage your doubles match history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No doubles matches recorded yet. Start by logging your first match!
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={getResultVariant(match.result)}>
                            {match.result}
                          </Badge>
                          {match.score && (
                            <Badge variant="outline">{match.score}</Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span><strong>Partner:</strong> {match.partner_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-muted-foreground" />
                            <span><strong>Opponents:</strong> {match.opponent_names}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{format(new Date(match.date), 'PPP')}</span>
                          </div>
                        </div>

                        {match.notes && (
                          <div className="text-sm text-muted-foreground bg-secondary/50 p-2 rounded">
                            <strong>Notes:</strong> {match.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 self-end sm:self-center">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteMatch(match.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}