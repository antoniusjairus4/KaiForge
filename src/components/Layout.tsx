import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Trophy, 
  User, 
  LogOut,
  Menu,
  X,
  Target,
  Dumbbell
} from 'lucide-react';
import { useState } from 'react';
import kaiforge from '@/assets/kaiforge-logo.png';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Practice', href: '/practice', icon: Dumbbell },
    { name: 'Matches', href: '/matches-hub', icon: Target },
    { name: 'Tournaments', href: '/tournament', icon: Trophy },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center space-x-2">
            <img src={kaiforge} alt="KaiForge Logo" className="w-8 h-8" />
            <span className="font-bold text-xl hidden sm:block">KaiForge 2.0</span>
            <span className="font-bold text-lg sm:hidden">KF</span>
          </Link>

          {/* Desktop Navigation - Full Height Sidebar */}
          <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden xl:block">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden md:flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:block">Sign Out</span>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-card/95 backdrop-blur-lg">
            <nav className="px-4 py-2 space-y-1 max-h-96 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main content with responsive container */}
      <main className="responsive-container mx-auto py-4 md:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}