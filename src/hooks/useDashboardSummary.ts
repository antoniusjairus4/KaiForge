import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type IsoDate = string;

export interface DashboardStats {
  totalMatches: number;
  totalWins: number;
  winRate: number;
  winStreak: number;
  totalPracticeMinutes: number;
  totalTournaments: number;
}

export type RecentActivityItem =
  | {
      kind: "singles";
      date: IsoDate;
      opponent: string;
      result: string;
      tournament_reference: string | null;
    }
  | {
      kind: "practice";
      date: IsoDate;
      practice_type: string;
      duration: number;
    };

const normalizeResult = (result: string | null | undefined) => (result ?? "").trim().toLowerCase();
const isWin = (result: string | null | undefined) => {
  const r = normalizeResult(result);
  return r === "win" || r === "won" || r === "w";
};

export function useDashboardSummary(userId?: string) {
  const [stats, setStats] = useState<DashboardStats>({
    totalMatches: 0,
    totalWins: 0,
    winRate: 0,
    winStreak: 0,
    totalPracticeMinutes: 0,
    totalTournaments: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Singles: all non-practice performances (includes tournament matches too)
      const { data: singles } = await supabase
        .from("performances")
        .select("id, session_type, opponent, result, date, tournament_reference")
        .eq("user_id", userId)
        .neq("session_type", "Practice")
        .order("date", { ascending: false });

      // Doubles
      const { data: doubles } = await supabase
        .from("doubles_performances")
        .select("id, result, date")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      // League matches (played inside tournaments)
      const { data: league } = await supabase
        .from("league_matches")
        .select("id, result, date")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      // Practice sessions for minutes
      const { data: practices } = await supabase
        .from("practice_sessions")
        .select("id, practice_type, duration, date")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      // Tournaments count
      const { data: tournaments } = await supabase.from("tournaments").select("id").eq("user_id", userId);

      const singlesMatches = singles ?? [];
      const doublesMatches = doubles ?? [];
      const leagueMatches = league ?? [];

      const singlesWins = singlesMatches.filter((m) => isWin(m.result)).length;
      const doublesWins = doublesMatches.filter((m) => isWin(m.result)).length;
      const leagueWins = leagueMatches.filter((m) => isWin(m.result)).length;

      const totalMatches = singlesMatches.length + doublesMatches.length + leagueMatches.length;
      const totalWins = singlesWins + doublesWins + leagueWins;
      const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

      // Win streak: based on most recent matches across all 3 sources
      const allMatchesChrono = [
        ...singlesMatches.map((m) => ({ date: m.date as IsoDate, result: m.result })),
        ...doublesMatches.map((m) => ({ date: m.date as IsoDate, result: m.result })),
        ...leagueMatches.map((m) => ({ date: m.date as IsoDate, result: m.result })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let streak = 0;
      for (const match of allMatchesChrono) {
        if (isWin(match.result)) streak++;
        else break;
      }

      setStats({
        totalMatches,
        totalWins,
        winRate,
        winStreak: streak,
        totalPracticeMinutes: practices ? practices.reduce((sum, p) => sum + p.duration, 0) : 0,
        totalTournaments: tournaments?.length || 0,
      });

      // Recent activity: keep existing behavior (singles + practice) but with safer typing
      const combined: RecentActivityItem[] = [
        ...(singlesMatches.slice(0, 2).map((m) => ({
          kind: "singles" as const,
          date: m.date as IsoDate,
          opponent: m.opponent,
          result: m.result,
          tournament_reference: m.tournament_reference ?? null,
        })) || []),
        ...((practices ?? []).map((p) => ({
          kind: "practice" as const,
          date: p.date as IsoDate,
          practice_type: p.practice_type,
          duration: p.duration,
        })) || []),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

      setRecentActivity(combined);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchDashboardData();
  }, [userId, fetchDashboardData]);

  useEffect(() => {
    const handleFocus = () => {
      if (userId) fetchDashboardData();
    };
    const handleVisibilityChange = () => {
      if (!document.hidden && userId) fetchDashboardData();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userId, fetchDashboardData]);

  return { stats, recentActivity, loading, refresh: fetchDashboardData };
}
