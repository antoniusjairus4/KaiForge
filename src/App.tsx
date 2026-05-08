import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TrackPerformance from "./pages/TrackPerformance";
import PerformanceHistory from "./pages/PerformanceHistory";
import Analytics from "./pages/Analytics";
import UpcomingMatches from "./pages/UpcomingMatches";
import Profile from "./pages/Profile";
import PracticeSessions from "./pages/PracticeSessions";
import PracticeHistory from "./pages/PracticeHistory";
import PracticeAnalytics from "./pages/PracticeAnalytics";
import DoublesMatchSession from "./pages/DoublesMatchSession";
import DoublesHistory from "./pages/DoublesHistory";
import DoublesAnalytics from "./pages/DoublesAnalytics";
import MatchSession from "./pages/MatchSession";
import Tournament from "./pages/Tournament";
import PracticeHub from "./pages/PracticeHub";
import MatchesHub from "./pages/MatchesHub";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/track" element={
              <ProtectedRoute>
                <TrackPerformance />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <PerformanceHistory />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/matches" element={
              <ProtectedRoute>
                <UpcomingMatches />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/practice-sessions" element={
              <ProtectedRoute>
                <PracticeSessions />
              </ProtectedRoute>
            } />
            <Route path="/practice-history" element={
              <ProtectedRoute>
                <PracticeHistory />
              </ProtectedRoute>
            } />
            <Route path="/practice-analytics" element={
              <ProtectedRoute>
                <PracticeAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/doubles-match" element={
              <ProtectedRoute>
                <DoublesMatchSession />
              </ProtectedRoute>
            } />
            <Route path="/doubles-history" element={
              <ProtectedRoute>
                <DoublesHistory />
              </ProtectedRoute>
            } />
            <Route path="/doubles-analytics" element={
              <ProtectedRoute>
                <DoublesAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/match-session" element={
              <ProtectedRoute>
                <MatchSession />
              </ProtectedRoute>
            } />
            <Route path="/tournament" element={
              <ProtectedRoute>
                <Tournament />
              </ProtectedRoute>
            } />
            <Route path="/practice" element={
              <ProtectedRoute>
                <PracticeHub />
              </ProtectedRoute>
            } />
            <Route path="/matches-hub" element={
              <ProtectedRoute>
                <MatchesHub />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
