import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface UpcomingMatch {
  id: string;
  date: string;
  opponent: string;
  match_type: string;
  goal: string;
}

export default function UpcomingMatches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<UpcomingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    opponent: '',
    match_type: '',
    goal: '',
  });

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('upcoming_matches')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) {
        toast({
          title: "Error fetching matches",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setMatches(data || []);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('upcoming_matches')
        .insert({
          user_id: user.id,
          date: formData.date,
          opponent: formData.opponent,
          match_type: formData.match_type,
          goal: formData.goal || null,
        });

      if (error) {
        toast({
          title: "Error saving match",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Match scheduled! 🗓️",
          description: `Match against ${formData.opponent} has been added.`,
        });
        setFormData({ date: '', opponent: '', match_type: '', goal: '' });
        setShowForm(false);
        fetchMatches();
      }
    } catch (error) {
      console.error('Error saving match:', error);
    }
  };

  return (
    <div className="space-y-8 animate-fade-slide">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Calendar className="w-8 h-8 text-primary" />
            <span>🗓️ Manage Your Upcoming Matches</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Add, view, and edit your upcoming matches with custom goals
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="animate-scale-bounce">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Match
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Match</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opponent">Opponent *</Label>
                <Input
                  id="opponent"
                  value={formData.opponent}
                  onChange={(e) => setFormData(prev => ({ ...prev, opponent: e.target.value }))}
                  placeholder="Opponent name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="match_type">Match Type *</Label>
                <Select value={formData.match_type} onValueChange={(value) => setFormData(prev => ({ ...prev, match_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select match type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tournament">Tournament</SelectItem>
                    <SelectItem value="Friendly">Friendly</SelectItem>
                    <SelectItem value="Practice Match">Practice Match</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Goal</Label>
                <Input
                  id="goal"
                  value={formData.goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                  placeholder="Your goal for this match"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">Schedule</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {matches.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <Card key={match.id} className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{match.opponent}</span>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {format(new Date(match.date), 'PPP')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Type: {match.match_type}
                  </div>
                  {match.goal && (
                    <div className="p-2 bg-muted/30 rounded text-sm">
                      <strong>Goal:</strong> {match.goal}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No upcoming matches</h3>
            <p className="text-muted-foreground mb-6">
              Schedule your first match to start planning your games
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Your First Match
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}