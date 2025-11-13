import { Home, FileText, Map as MapIcon, MapPin, Bell, Menu, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: MapIcon, label: 'Map', path: '/map' },
  { icon: FileText, label: 'Report', path: '/report' },
  { icon: MapPin, label: 'Services', path: '/services' },
  { icon: Bell, label: 'Alerts', path: '/notifications' },
  { icon: Menu, label: 'More', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      if (user?.id) {
        // Delete read user-specific alerts on signout
        await supabase.from('alerts').delete().eq('user_id', user.id).eq('is_read', true);
      }
    } catch {}
    await logout();
    navigate('/');
    setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 0);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-colors",
            "text-muted-foreground hover:text-foreground"
          )}
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
