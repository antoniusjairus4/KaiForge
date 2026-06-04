import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Plus, Edit, Trash2, Trophy, ArrowLeft, ChevronRight, BarChart3, TrendingUp, Target } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Tournament {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface TournamentMatch {
  id: string;
  tournament_reference: string | null;
  round: string | null;
  opponent: string;
  result: string;
  score: string | null;
  notes: string | null;
  date: string;
  session_type: string;
}

interface LeagueMatch {
  id: string;
  tournament_id: string;
  opponent_name: string;
  score: string;
  result: string;
  points_gained: number;
  date: string;
  notes: string | null;
}

const Tournament = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [leagueMatches, setLeagueMatches] = useState<LeagueMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isLeagueMatchDialogOpen, setIsLeagueMatchDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [editingMatch, setEditingMatch] = useState<TournamentMatch | null>(null);
  const [editingLeagueMatch, setEditingLeagueMatch] = useState<LeagueMatch | null>(null);
  const [tournamentDate, setTournamentDate] = useState<Date>();
  const [tournamentEndDate, setTournamentEndDate] = useState<Date>();
  const [matchDate, setMatchDate] = useState<Date>();
  const [leagueMatchDate, setLeagueMatchDate] = useState<Date>();
  const [tournamentStats, setTournamentStats] = useState<Record<string, { total: number; wins: number; losses: number }>>({});

  const [tournamentFormData, setTournamentFormData] = useState({
    name: "",
    location: "",
  });

  const [matchFormData, setMatchFormData] = useState({
    round: "",
    opponent_name: "",
    result: "",
    score: "",
    notes: "",
  });

  const [leagueMatchFormData, setLeagueMatchFormData] = useState({
    opponent_name: "",
    score: "",
    result: "",
    points_gained: 0,
    notes: "",
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchAllTournamentStats = async (tournamentList: Tournament[]) => {
    const statsMap: Record<string, { total: number; wins: number; losses: number }> = {};
    for (const tournament of tournamentList) {
      const stats = await getTournamentStats(tournament.id);
      statsMap[tournament.id] = stats;
    }
    setTournamentStats(statsMap);
  };

  useEffect(() => {
    if (tournaments.length > 0) {
      fetchAllTournamentStats(tournaments);
    } else {
      setTournamentStats({});
    }
  }, [tournaments]);

  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentMatches(selectedTournament.id);
      fetchLeagueMatches(selectedTournament.id);
      refreshTournamentStats(selectedTournament.id);
    } else if (tournaments.length > 0) {
      // Re-sync card counters whenever user returns to tournament list.
      fetchAllTournamentStats(tournaments);
    }
  }, [selectedTournament, tournaments]);

  const refreshTournamentStats = async (tournamentId: string) => {
    const stats = await getTournamentStats(tournamentId);
    setTournamentStats((prev) => ({
      ...prev,
      [tournamentId]: stats,
    }));
  };

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      toast({
        title: "Error",
        description: "Failed to load tournaments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentMatches = async (tournamentId: string) => {
    try {
      const { data, error } = await supabase
        .from("performances")
        .select("*")
        .eq("tournament_reference", tournamentId)
        .order("date", { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error("Error fetching tournament matches:", error);
      toast({
        title: "Error",
        description: "Failed to load tournament matches",
        variant: "destructive",
      });
    }
  };

  const fetchLeagueMatches = async (tournamentId: string) => {
    try {
      const { data, error } = await supabase
        .from("league_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("date", { ascending: false });

      if (error) throw error;
      setLeagueMatches(data || []);
    } catch (error) {
      console.error("Error fetching league matches:", error);
      toast({
        title: "Error",
        description: "Failed to load league matches",
        variant: "destructive",
      });
    }
  };

  const resetTournamentForm = () => {
    setTournamentFormData({
      name: "",
      location: "",
    });
    setTournamentDate(new Date());
    setTournamentEndDate(undefined);
    setEditingTournament(null);
  };

  const resetMatchForm = () => {
    setMatchFormData({
      round: "",
      opponent_name: "",
      result: "",
      score: "",
      notes: "",
    });
    setMatchDate(new Date());
    setEditingMatch(null);
  };

  const resetLeagueMatchForm = () => {
    setLeagueMatchFormData({
      opponent_name: "",
      score: "",
      result: "",
      points_gained: 0,
      notes: "",
    });
    setLeagueMatchDate(new Date());
    setEditingLeagueMatch(null);
  };

  const handleTournamentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const tournamentData = {
        ...tournamentFormData,
        user_id: user.id,
        start_date: format(tournamentDate || new Date(), "yyyy-MM-dd"),
        end_date: tournamentEndDate ? format(tournamentEndDate, "yyyy-MM-dd") : null,
      };

      if (editingTournament) {
        const { error } = await supabase
          .from("tournaments")
          .update(tournamentData)
          .eq("id", editingTournament.id);

        if (error) throw error;
        toast({ title: "Success", description: "Tournament updated!" });
      } else {
        const { error } = await supabase
          .from("tournaments")
          .insert(tournamentData);

        if (error) throw error;
        toast({ title: "Success", description: "Tournament added!" });
      }

      setIsTournamentDialogOpen(false);
      resetTournamentForm();
      fetchTournaments();
    } catch (error) {
      console.error("Error saving tournament:", error);
      toast({
        title: "Error",
        description: "Failed to save tournament",
        variant: "destructive",
      });
    }
  };

  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTournament) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Validate round order for subsequent matches (not when editing)
      if (!editingMatch) {
        const roundOrder = ["R2048", "R1024", "R512", "R256", "R128", "R64", "R32", "R16", "PQF", "QF", "SF", "F"];
        
        // If there are existing matches, validate the round order
        if (matches.length > 0) {
          // Get the last round entered
          const lastMatch = matches.reduce((latest, current) => {
            const latestRoundIndex = roundOrder.indexOf(latest.round || "");
            const currentRoundIndex = roundOrder.indexOf(current.round || "");
            return currentRoundIndex > latestRoundIndex ? current : latest;
          });
          
          const lastRoundIndex = roundOrder.indexOf(lastMatch.round || "");
          const selectedRoundIndex = roundOrder.indexOf(matchFormData.round);
          
          // Check if the selected round is the next valid round
          if (selectedRoundIndex !== lastRoundIndex + 1) {
            const expectedRound = roundOrder[lastRoundIndex + 1];
            toast({
              title: "Invalid Round",
              description: `Please enter rounds in correct knockout order. Next valid round: ${expectedRound}`,
              variant: "destructive",
            });
            return;
          }
        }
      }

      const matchData = {
        opponent: matchFormData.opponent_name,
        result: matchFormData.result,
        score: matchFormData.score || null,
        notes: matchFormData.notes || null,
        round: matchFormData.round,
        tournament_reference: selectedTournament.id,
        session_type: 'Match',
        user_id: user.id,
        date: format(matchDate || new Date(), "yyyy-MM-dd"),
      };

      if (editingMatch) {
        const { error } = await supabase
          .from("performances")
          .update(matchData)
          .eq("id", editingMatch.id);

        if (error) throw error;
        toast({ title: "Success", description: "Match updated!" });
      } else {
        const { error } = await supabase
          .from("performances")
          .insert(matchData);

        if (error) throw error;
        toast({ title: "Success", description: "Match added!" });
      }

      setIsMatchDialogOpen(false);
      resetMatchForm();
      fetchTournamentMatches(selectedTournament.id);
      refreshTournamentStats(selectedTournament.id);
    } catch (error) {
      console.error("Error saving match:", error);
      toast({
        title: "Error",
        description: "Failed to save match",
        variant: "destructive",
      });
    }
  };

  const handleEditTournament = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setTournamentFormData({
      name: tournament.name,
      location: tournament.location,
    });
    setTournamentDate(new Date(tournament.start_date));
    setTournamentEndDate(tournament.end_date ? new Date(tournament.end_date) : undefined);
    setIsTournamentDialogOpen(true);
  };

  const handleEditMatch = (match: TournamentMatch) => {
    setEditingMatch(match);
    setMatchFormData({
      round: match.round || "",
      opponent_name: match.opponent,
      result: match.result,
      score: match.score || "",
      notes: match.notes || "",
    });
    setMatchDate(new Date(match.date));
    setIsMatchDialogOpen(true);
  };

  const handleDeleteTournament = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Tournament deleted!" });
      fetchTournaments();
      if (selectedTournament?.id === id) {
        setSelectedTournament(null);
      }
    } catch (error) {
      console.error("Error deleting tournament:", error);
      toast({
        title: "Error",
        description: "Failed to delete tournament",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMatch = async (id: string) => {
    try {
      const { error } = await supabase
        .from("performances")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Match deleted!" });
      if (selectedTournament) {
        fetchTournamentMatches(selectedTournament.id);
        refreshTournamentStats(selectedTournament.id);
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      toast({
        title: "Error",
        description: "Failed to delete match",
        variant: "destructive",
      });
    }
  };

  const handleLeagueMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTournament) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const leagueMatchData = {
        opponent_name: leagueMatchFormData.opponent_name,
        score: leagueMatchFormData.score,
        result: leagueMatchFormData.result,
        points_gained: leagueMatchFormData.points_gained,
        notes: leagueMatchFormData.notes || null,
        tournament_id: selectedTournament.id,
        user_id: user.id,
        date: format(leagueMatchDate || new Date(), "yyyy-MM-dd"),
      };

      if (editingLeagueMatch) {
        const { error } = await supabase
          .from("league_matches")
          .update(leagueMatchData)
          .eq("id", editingLeagueMatch.id);

        if (error) throw error;
        toast({ title: "Success", description: "League match updated!" });
      } else {
        const { error } = await supabase
          .from("league_matches")
          .insert(leagueMatchData);

        if (error) throw error;
        toast({ title: "Success", description: "League match added!" });
      }

      setIsLeagueMatchDialogOpen(false);
      resetLeagueMatchForm();
      fetchLeagueMatches(selectedTournament.id);
      refreshTournamentStats(selectedTournament.id);
    } catch (error) {
      console.error("Error saving league match:", error);
      toast({
        title: "Error",
        description: "Failed to save league match",
        variant: "destructive",
      });
    }
  };

  const handleEditLeagueMatch = (leagueMatch: LeagueMatch) => {
    setEditingLeagueMatch(leagueMatch);
    setLeagueMatchFormData({
      opponent_name: leagueMatch.opponent_name,
      score: leagueMatch.score,
      result: leagueMatch.result,
      points_gained: leagueMatch.points_gained,
      notes: leagueMatch.notes || "",
    });
    setLeagueMatchDate(new Date(leagueMatch.date));
    setIsLeagueMatchDialogOpen(true);
  };

  const handleDeleteLeagueMatch = async (id: string) => {
    try {
      const { error } = await supabase
        .from("league_matches")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "League match deleted!" });
      if (selectedTournament) {
        fetchLeagueMatches(selectedTournament.id);
        refreshTournamentStats(selectedTournament.id);
      }
    } catch (error) {
      console.error("Error deleting league match:", error);
      toast({
        title: "Error",
        description: "Failed to delete league match",
        variant: "destructive",
      });
    }
  };

  const getTournamentStats = async (tournamentId: string) => {
    try {
      const [knockoutResponse, leagueResponse] = await Promise.all([
        supabase
          .from("performances")
          .select("result")
          .eq("tournament_reference", tournamentId),
        supabase
          .from("league_matches")
          .select("result")
          .eq("tournament_id", tournamentId),
      ]);

      if (knockoutResponse.error) throw knockoutResponse.error;
      if (leagueResponse.error) throw leagueResponse.error;

      const knockoutMatches = knockoutResponse.data || [];
      const leagueMatchesData = leagueResponse.data || [];
      const allMatches = [...knockoutMatches, ...leagueMatchesData];
      const wins = allMatches.filter((m) => m.result === "Win").length;
      const losses = allMatches.filter((m) => m.result === "Loss").length;

      return { total: allMatches.length, wins, losses };
    } catch (error) {
      console.error("Error fetching tournament stats:", error);
      return { total: 0, wins: 0, losses: 0 };
    }
  };

  const getLeagueMatchStats = () => {
    const totalLeagueMatches = leagueMatches.length;
    const leagueWins = leagueMatches.filter(m => m.result === "Win").length;
    const leagueLosses = leagueMatches.filter(m => m.result === "Loss").length;
    const totalPoints = leagueMatches.reduce((sum, m) => sum + m.points_gained, 0);
    
    return { totalLeagueMatches, leagueWins, leagueLosses, totalPoints };
  };

  const getFurthestRound = () => {
    const roundOrder = ["R2048", "R1024", "R512", "R256", "R128", "R64", "R32", "R16", "PQF", "QF", "SF", "F"];
    let furthest = "";
    let furthestIndex = -1;
    
    matches.forEach((match) => {
      const index = roundOrder.indexOf(match.round);
      if (index > furthestIndex) {
        furthestIndex = index;
        furthest = match.round;
      }
    });
    
    return furthest || "N/A";
  };

  const getWinLossChartData = () => {
    const wins = matches.filter(m => m.result === "Win").length;
    const losses = matches.filter(m => m.result === "Loss").length;
    
    return [
      { name: "Wins", value: wins, color: "#10b981" },
      { name: "Losses", value: losses, color: "#ef4444" }
    ];
  };

  const getRoundPerformanceData = () => {
    const rounds = ["R2048", "R1024", "R512", "R256", "R128", "R64", "R32", "R16", "PQF", "QF", "SF", "F"];
    const data = rounds.map(round => {
      const roundMatches = matches.filter(m => m.round === round);
      const wins = roundMatches.filter(m => m.result === "Win").length;
      const losses = roundMatches.filter(m => m.result === "Loss").length;
      
      return {
        round,
        wins,
        losses,
        total: wins + losses
      };
    }).filter(d => d.total > 0);
    
    return data;
  };

  const getMatchOutcomeTimelineData = () => {
    return matches
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((match, index) => ({
        match: index + 1,
        result: match.result === "Win" ? 1 : 0,
        date: format(new Date(match.date), "MMM dd"),
        opponent: match.opponent
      }));
  };

  const getLeagueWinLossChartData = () => {
    const wins = leagueMatches.filter(m => m.result === "Win").length;
    const losses = leagueMatches.filter(m => m.result === "Loss").length;
    
    return [
      { name: "Wins", value: wins, color: "#10b981" },
      { name: "Losses", value: losses, color: "#ef4444" }
    ];
  };

  const getLeaguePointsOverTimeData = () => {
    let cumulativePoints = 0;
    return leagueMatches
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((match, index) => {
        cumulativePoints += match.points_gained;
        return {
          match: index + 1,
          points: cumulativePoints,
          date: format(new Date(match.date), "MMM dd"),
          opponent: match.opponent_name,
          matchPoints: match.points_gained
        };
      });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Tournament Detail View
  if (selectedTournament) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTournament(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8" />
              {selectedTournament.name}
            </h1>
            <p className="text-muted-foreground">
              {selectedTournament.location && `${selectedTournament.location} • `}
              {format(new Date(selectedTournament.start_date), "PPP")}
              {selectedTournament.end_date && ` - ${format(new Date(selectedTournament.end_date), "PPP")}`}
            </p>
          </div>
          
          <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetMatchForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Match
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMatch ? "Edit Match" : "Add Match"}
                </DialogTitle>
                <DialogDescription>
                  Record match details in {selectedTournament.name}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleMatchSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="round">Round *</Label>
                    <Select
                      value={matchFormData.round}
                      onValueChange={(value) => setMatchFormData({ ...matchFormData, round: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select round" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="R2048">R2048</SelectItem>
                        <SelectItem value="R1024">R1024</SelectItem>
                        <SelectItem value="R512">R512</SelectItem>
                        <SelectItem value="R256">R256</SelectItem>
                        <SelectItem value="R128">R128</SelectItem>
                        <SelectItem value="R64">R64</SelectItem>
                        <SelectItem value="R32">R32</SelectItem>
                        <SelectItem value="R16">R16</SelectItem>
                        <SelectItem value="PQF">PQF</SelectItem>
                        <SelectItem value="QF">QF</SelectItem>
                        <SelectItem value="SF">SF</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opponent_name">Opponent Name *</Label>
                    <Input
                      id="opponent_name"
                      placeholder="Opponent name"
                      value={matchFormData.opponent_name}
                      onChange={(e) => setMatchFormData({ ...matchFormData, opponent_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="result">Result *</Label>
                    <Select
                      value={matchFormData.result}
                      onValueChange={(value) => setMatchFormData({ ...matchFormData, result: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Win">Win</SelectItem>
                        <SelectItem value="Loss">Loss</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="score">Score</Label>
                    <Input
                      id="score"
                      placeholder="e.g., 3-1, 21-19"
                      value={matchFormData.score}
                      onChange={(e) => setMatchFormData({ ...matchFormData, score: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !matchDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {matchDate ? format(matchDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={matchDate}
                        onSelect={setMatchDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={matchFormData.notes}
                    onChange={(e) => setMatchFormData({ ...matchFormData, notes: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingMatch ? "Update Match" : "Add Match"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs for League Matches, Knockout Matches and Analysis */}
        <Tabs defaultValue="league" className="space-y-4">
          <TabsList>
            <TabsTrigger value="league">League Matches</TabsTrigger>
            <TabsTrigger value="matches">Knockout Matches</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          {/* League Matches Tab */}
          <TabsContent value="league" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">League Matches</h2>
                <p className="text-sm text-muted-foreground">
                  Track all league matches before knockout stage
                </p>
              </div>
              <Dialog open={isLeagueMatchDialogOpen} onOpenChange={setIsLeagueMatchDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetLeagueMatchForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log League Match
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLeagueMatch ? "Edit League Match" : "Log League Match"}
                    </DialogTitle>
                    <DialogDescription>
                      Record league match details in {selectedTournament.name}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleLeagueMatchSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="league_opponent_name">Opponent Name *</Label>
                      <Input
                        id="league_opponent_name"
                        placeholder="Opponent name"
                        value={leagueMatchFormData.opponent_name}
                        onChange={(e) => setLeagueMatchFormData({ ...leagueMatchFormData, opponent_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="league_score">Score *</Label>
                        <Input
                          id="league_score"
                          placeholder="e.g., 11-9, 8-11, 11-6"
                          value={leagueMatchFormData.score}
                          onChange={(e) => setLeagueMatchFormData({ ...leagueMatchFormData, score: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="league_result">Result *</Label>
                        <Select
                          value={leagueMatchFormData.result}
                          onValueChange={(value) => setLeagueMatchFormData({ ...leagueMatchFormData, result: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select result" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Win">Win</SelectItem>
                            <SelectItem value="Loss">Loss</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="points_gained">Points Gained *</Label>
                        <Input
                          id="points_gained"
                          type="number"
                          placeholder="0"
                          value={leagueMatchFormData.points_gained}
                          onChange={(e) => setLeagueMatchFormData({ ...leagueMatchFormData, points_gained: parseInt(e.target.value) || 0 })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !leagueMatchDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {leagueMatchDate ? format(leagueMatchDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={leagueMatchDate}
                              onSelect={setLeagueMatchDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="league_notes">Notes (optional)</Label>
                      <Textarea
                        id="league_notes"
                        placeholder="Additional notes..."
                        value={leagueMatchFormData.notes}
                        onChange={(e) => setLeagueMatchFormData({ ...leagueMatchFormData, notes: e.target.value })}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      {editingLeagueMatch ? "Update League Match" : "Log League Match"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {leagueMatches.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No league matches recorded yet.</p>
                  <p className="text-sm text-muted-foreground">Add your first league match to get started!</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* League Match Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Total League Matches</CardDescription>
                      <CardTitle className="text-3xl">
                        {getLeagueMatchStats().totalLeagueMatches}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>League Wins</CardDescription>
                      <CardTitle className="text-3xl text-green-600">
                        {getLeagueMatchStats().leagueWins}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>League Losses</CardDescription>
                      <CardTitle className="text-3xl text-red-600">
                        {getLeagueMatchStats().leagueLosses}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Total Points Earned</CardDescription>
                      <CardTitle className="text-3xl">
                        {getLeagueMatchStats().totalPoints}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {/* League Matches List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {leagueMatches.map((leagueMatch) => (
                    <Card key={leagueMatch.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{leagueMatch.opponent_name}</CardTitle>
                            <CardDescription>{format(new Date(leagueMatch.date), "PPP")}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLeagueMatch(leagueMatch)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLeagueMatch(leagueMatch.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant={leagueMatch.result === "Win" ? "default" : "secondary"}>
                            {leagueMatch.result}
                          </Badge>
                          <Badge variant="outline">
                            {leagueMatch.points_gained} pts
                          </Badge>
                        </div>
                        
                        <p className="text-sm">
                          <strong>Score:</strong> {leagueMatch.score}
                        </p>
                        
                        {leagueMatch.notes && (
                          <p className="text-sm text-muted-foreground">{leagueMatch.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Tournament Match History Tab */}
          <TabsContent value="matches" className="space-y-4">
            {matches.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No matches recorded yet.</p>
                  <p className="text-sm text-muted-foreground">Add your first match to get started!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map((match) => (
                  <Card key={match.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{match.opponent}</CardTitle>
                          <CardDescription>{format(new Date(match.date), "PPP")}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMatch(match)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMatch(match.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline">{match.round}</Badge>
                        <Badge variant={match.result === "Win" ? "default" : "secondary"}>
                          {match.result}
                        </Badge>
                      </div>
                      
                      {match.score && (
                        <p className="text-sm">
                          <strong>Score:</strong> {match.score}
                        </p>
                      )}
                      
                      {match.notes && (
                        <p className="text-sm text-muted-foreground">{match.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tournament Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {matches.length === 0 && leagueMatches.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No data to analyze yet.</p>
                  <p className="text-sm text-muted-foreground">Add league or knockout matches to see tournament analytics!</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* League Match Analytics Section */}
                {leagueMatches.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-semibold">League Stage Analytics</h3>
                    </div>

                    {/* League Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>League Matches</CardDescription>
                          <CardTitle className="text-3xl">
                            {getLeagueMatchStats().totalLeagueMatches}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>League Wins</CardDescription>
                          <CardTitle className="text-3xl text-green-600">
                            {getLeagueMatchStats().leagueWins}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>League Losses</CardDescription>
                          <CardTitle className="text-3xl text-red-600">
                            {getLeagueMatchStats().leagueLosses}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>Total Points</CardDescription>
                          <CardTitle className="text-3xl text-primary">
                            {getLeagueMatchStats().totalPoints}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </div>

                    {/* League Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      {/* League Win/Loss Pie Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle>League Win/Loss Distribution</CardTitle>
                          <CardDescription>League stage performance breakdown</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={getLeagueWinLossChartData()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {getLeagueWinLossChartData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* League Points Over Time */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Points Progression</CardTitle>
                          <CardDescription>Cumulative points earned over league matches</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={getLeaguePointsOverTimeData()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                                        <p className="font-semibold">{data.opponent}</p>
                                        <p className="text-sm text-muted-foreground">{data.date}</p>
                                        <p className="text-sm">Points gained: <span className="font-semibold text-primary">{data.matchPoints}</span></p>
                                        <p className="text-sm">Total points: <span className="font-semibold">{data.points}</span></p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="points" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                dot={{ fill: "#3b82f6", r: 4 }}
                                name="Total Points"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}

                {/* Knockout Stage Analytics Section */}
                {matches.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-semibold">Knockout Stage Analytics</h3>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Total Matches</CardDescription>
                      <CardTitle className="text-3xl flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-primary" />
                        {matches.length}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Total Wins</CardDescription>
                      <CardTitle className="text-3xl flex items-center gap-2 text-green-600">
                        <TrendingUp className="h-6 w-6" />
                        {matches.filter(m => m.result === "Win").length}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Total Losses</CardDescription>
                      <CardTitle className="text-3xl flex items-center gap-2 text-red-600">
                        <Target className="h-6 w-6" />
                        {matches.filter(m => m.result === "Loss").length}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Furthest Round</CardDescription>
                      <CardTitle className="text-3xl">
                        {getFurthestRound()}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Win/Loss Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Win/Loss Distribution</CardTitle>
                      <CardDescription>Overall performance in this tournament</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={getWinLossChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getWinLossChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Round-wise Performance Bar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Round-wise Performance</CardTitle>
                      <CardDescription>Wins and losses by round</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getRoundPerformanceData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="round" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="wins" fill="#10b981" name="Wins" />
                          <Bar dataKey="losses" fill="#ef4444" name="Losses" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Match Outcome Timeline */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Match Outcome Over Time</CardTitle>
                      <CardDescription>Performance trend across all matches</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getMatchOutcomeTimelineData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis 
                            domain={[0, 1]} 
                            ticks={[0, 1]} 
                            tickFormatter={(value) => value === 1 ? "Win" : "Loss"}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                                    <p className="font-semibold">{data.opponent}</p>
                                    <p className="text-sm text-muted-foreground">{data.date}</p>
                                    <p className={cn(
                                      "text-sm font-medium",
                                      data.result === 1 ? "text-green-600" : "text-red-600"
                                    )}>
                                      {data.result === 1 ? "Win" : "Loss"}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="result" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            dot={{ fill: "#8b5cf6", r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
                  </>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Tournament List View
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/')}>
          Back
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8" />
            Tournaments
          </h1>
          <p className="text-muted-foreground">
            Manage your tournaments and track matches
          </p>
        </div>
        
        <Dialog open={isTournamentDialogOpen} onOpenChange={setIsTournamentDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetTournamentForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tournament
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTournament ? "Edit Tournament" : "Add Tournament"}
              </DialogTitle>
              <DialogDescription>
                Create a new tournament to track matches
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleTournamentSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name *</Label>
                <Input
                  id="name"
                  placeholder="Tournament name"
                  value={tournamentFormData.name}
                  onChange={(e) => setTournamentFormData({ ...tournamentFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Location"
                  value={tournamentFormData.location}
                  onChange={(e) => setTournamentFormData({ ...tournamentFormData, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !tournamentDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tournamentDate ? format(tournamentDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={tournamentDate}
                        onSelect={setTournamentDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !tournamentEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tournamentEndDate ? format(tournamentEndDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={tournamentEndDate}
                        onSelect={setTournamentEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingTournament ? "Update Tournament" : "Add Tournament"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tournament List */}
      <div className="space-y-4">
        {tournaments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tournaments yet.</p>
              <p className="text-sm text-muted-foreground">Add your first tournament to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => {
              const stats = tournamentStats[tournament.id] || { total: 0, wins: 0, losses: 0 };
              return (
                <Card 
                  key={tournament.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedTournament(tournament)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{tournament.name}</CardTitle>
                        <CardDescription>
                          {tournament.location && `${tournament.location} • `}
                          {format(new Date(tournament.start_date), "PP")}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTournament(tournament)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTournament(tournament.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{stats.total} Matches</Badge>
                      {stats.wins > 0 && <Badge variant="default">{stats.wins} Wins</Badge>}
                      {stats.losses > 0 && <Badge variant="secondary">{stats.losses} Losses</Badge>}
                    </div>
                    <div className="flex items-center text-sm text-primary">
                      View Details <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournament;
