
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Settings, LayoutDashboard } from 'lucide-react';
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
import { NotificationBell } from '@/components/ui/notification-bell';

const Header = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { t } = useTranslation();
  const location = useLocation();

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
      <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-white/10 shadow-lg supports-[backdrop-filter]:bg-background/20 z-[100]">
        <div className="container mx-auto px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between min-h-[48px]">
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <img src="/lovable-uploads/78355eae-a8bc-4167-9f39-fec08c253f60.png" alt="Zamar logo" className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="text-base sm:text-xl font-bold text-primary font-playfair">Zamar</span>
            </Link>
            <div className="w-20 h-8 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-white/10 shadow-lg supports-[backdrop-filter]:bg-background/20 z-[100]">
      <div className="container mx-auto px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between min-h-[48px]">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <img src="/lovable-uploads/78355eae-a8bc-4167-9f39-fec08c253f60.png" alt="Zamar logo" className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="text-base sm:text-xl font-bold text-primary font-playfair">{t('app.title', 'Zamar')}</span>
          </Link>

          {/* Right Side - Auth & Actions */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
            <Button variant="secondary" size="sm" className="text-xs sm:text-sm px-1 sm:px-2 md:px-4 hidden xs:flex" asChild>
              <Link to="/advertise">Advertise</Link>
            </Button>
            {/* Language Selector */}
            <LanguageSelector className="min-w-[60px] sm:min-w-[80px] md:min-w-[120px]" />
            {user ? (
              <>
                {/* Notifications */}
                <NotificationBell />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">{t('nav.account', 'Account')}</span>
                    </Button>
                  </DropdownMenuTrigger>
<DropdownMenuContent align="end" className="bg-background border border-border shadow-lg z-[110]">
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
                      <Link to="/referrals/analytics">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {t('nav.referral_analytics', 'Referral Analytics')}
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
