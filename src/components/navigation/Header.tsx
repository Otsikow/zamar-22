
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, User, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useTranslation } from '@/contexts/TranslationContext';
import { LanguageSelector } from '@/components/ui/language-selector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const Header = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { t } = useTranslation();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchNotifications = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    channel = supabase
      .channel('notifications-header')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-background/20 backdrop-blur-xl border-b border-white/10 shadow-lg supports-[backdrop-filter]:bg-background/20 z-50">
          <div className="container-responsive py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/lovable-uploads/afeffcca-3646-4967-b85e-0646f2b6bcf2.png" alt="Zamar" className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="text-lg sm:text-xl font-bold text-primary font-playfair">Zamar</span>
            </Link>
            <div className="w-20 h-8 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-background/20 backdrop-blur-xl border-b border-white/10 shadow-lg supports-[backdrop-filter]:bg-background/20 z-50">
      <div className="container-responsive py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/lovable-uploads/afeffcca-3646-4967-b85e-0646f2b6bcf2.png" alt="Zamar" className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="hidden xs:inline text-base sm:text-xl font-bold text-primary font-playfair">{t('app.title', 'Zamar')}</span>
          </Link>

          {/* Right Side - Auth & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Selector */}
            <LanguageSelector className="min-w-[90px] sm:min-w-[140px]" />
            {user ? (
              <>
                {/* Notifications */}
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/notifications" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">{t('nav.account', 'Account')}</span>
                    </Button>
                  </DropdownMenuTrigger>
<DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        <User className="mr-2 h-4 w-4" />
                        {t('nav.profile', 'Profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {t('nav.user_dashboard', 'Dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/library">
                        <Settings className="mr-2 h-4 w-4" />
                        {t('nav.library', 'Library')}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          {t('nav.admin', 'Admin')}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('auth.signout', 'Sign Out')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">{t('auth.signin', 'Sign In')}</Link>
              </Button>
            )}

          </div>
        </div>

        {/* Mobile Navigation - removed as navigation links are no longer needed */}
      </div>
    </header>
  );
};

export default Header;
