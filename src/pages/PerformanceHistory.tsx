import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Trophy, Edit, Trash2, Search, Filter, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface Performance {
  id: string;
  session_type: string;
  opponent: string;
  result: string;
  score: string;
  notes: string;
  date: string;
  created_at: string;
}

export default function PerformanceHistory() {
  const { user } = useAuth();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [filteredPerformances, setFilteredPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [editingPerformance, setEditingPerformance] = useState<Performance | null>(null);

  useEffect(() => {
    if (user) {
      fetchPerformances();
    }
  }, [user]);

  useEffect(() => {
    filterPerformances();
  }, [performances, searchTerm, filterType, filterResult]);

  const fetchPerformances = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('performances')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching performances",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setPerformances(data || []);
      }
    } catch (error) {
      console.error('Error fetching performances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPerformances = () => {
    let filtered = performances;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.opponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.session_type === filterType);
    }

    // Result filter
    if (filterResult !== 'all') {
      filtered = filtered.filter(p => p.result === filterResult);
    }

    setFilteredPerformances(filtered);
  };

  const deletePerformance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('performances')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error deleting session",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Session deleted",
          description: "The session has been removed from your history.",
        });
        fetchPerformances();
      }
    } catch (error) {
      console.error('Error deleting performance:', error);
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

  const getResultEmoji = (result: string) => {
    switch (result) {
      case 'Win':
        return '🏆';
      case 'Loss':
        return '😤';
      default:
        return '🤝';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Trophy className="w-8 h-8 text-primary" />
            <span>📁 Past Sessions</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Review and analyze your table tennis journey
          </p>
        </div>
        <Link to="/track">
          <Button className="animate-scale-bounce">
            <Plus className="w-4 h-4 mr-2" />
            Record New Session
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by opponent or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  <SelectItem value="Match">Matches Only</SelectItem>
                  <SelectItem value="Practice">Practice Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterResult} onValueChange={setFilterResult}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="Win">Wins</SelectItem>
                  <SelectItem value="Loss">Losses</SelectItem>
                  <SelectItem value="Draw">Draws</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredPerformances.length}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredPerformances.filter(p => p.result === 'Win').length}
              </div>
              <div className="text-sm text-muted-foreground">Wins</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredPerformances.filter(p => p.result === 'Loss').length}
              </div>
              <div className="text-sm text-muted-foreground">Losses</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredPerformances.filter(p => p.result === 'Draw').length}
              </div>
              <div className="text-sm text-muted-foreground">Draws</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance List */}
      {filteredPerformances.length > 0 ? (
        <div className="space-y-4">
          {filteredPerformances.map((performance) => (
            <Card key={performance.id} className="glass-card hover-lift">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-lg">{performance.opponent}</h3>
                      <Badge 
                        variant={getResultBadgeVariant(performance.result)}
                        className="flex items-center space-x-1"
                      >
                        <span>{getResultEmoji(performance.result)}</span>
                        <span>{performance.result}</span>
                      </Badge>
                      <Badge variant="outline">
                        {performance.session_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{format(new Date(performance.date), 'PPP')}</span>
                      {performance.score && (
                        <span className="font-mono font-medium">
                          Score: {performance.score}
                        </span>
                      )}
                    </div>

                    {performance.notes && (
                      <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">{performance.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPerformance(performance)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Session</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this session? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline">Cancel</Button>
                          <Button 
                            variant="destructive"
                            onClick={() => deletePerformance(performance.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <Trophy className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterType !== 'all' || filterResult !== 'all' 
                ? 'Try adjusting your filters to see more results'
                : 'Start recording your table tennis sessions to build your performance history'
              }
            </p>
            <Link to="/track">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Record Your First Session
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}