import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  ListPlus, 
  Settings, 
  MessageCircle, 
  Heart, 
  Sliders, 
  LogOut,
  ChevronRight,
  CreditCard,
  DollarSign,
  LayoutDashboard
} from 'lucide-react';

const More = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const menuItems = [
    { label: "My Account", icon: User, action: () => navigate('/profile') },
    ...(isAdmin ? [{ label: "Dashboard", icon: LayoutDashboard, action: () => navigate('/admin') }] : []),
    { label: "Create Playlist", icon: ListPlus, action: () => navigate('/playlist/create') },
    { label: "Manage Playlists", icon: Settings, action: () => navigate('/playlist/manage') },
    { label: "Pricing", icon: CreditCard, action: () => navigate('/pricing') },
    { label: "Referral Calculator", icon: DollarSign, action: () => navigate('/referral') },
    { label: "Testimonies", icon: MessageCircle, action: () => navigate('/testimonies') },
    { label: "Donate", icon: Heart, action: () => navigate('/donate') },
    { label: "Settings", icon: Sliders, action: () => navigate('/settings') },
    { label: "Logout", icon: LogOut, action: handleLogout, variant: "destructive" as const }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading text-primary mb-2">Menu</h1>
          {user && (
            <p className="text-muted-foreground">
              Welcome back, {user.email}
            </p>
          )}
        </div>

        {/* Menu Items */}
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="p-0">
            <div className="space-y-0">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                const isLast = index === menuItems.length - 1;
                const isLogout = item.variant === "destructive";
                
                return (
                  <div key={item.label}>
                    <Button
                      variant="ghost"
                      onClick={item.action}
                      className={`w-full justify-between h-auto p-4 rounded-none ${
                        isLogout 
                          ? 'text-destructive hover:text-destructive hover:bg-destructive/10' 
                          : 'text-foreground hover:bg-primary/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${
                          isLogout 
                            ? 'border-destructive/20 bg-destructive/5' 
                            : 'border-primary/20 bg-primary/5'
                        }`}>
                          <IconComponent className={`h-5 w-5 ${
                            isLogout ? 'text-destructive' : 'text-primary'
                          }`} />
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {!isLast && <div className="border-b border-primary/10 mx-4" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="mt-8 text-center">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="font-heading text-primary text-lg mb-2">Zamar</h3>
              <p className="text-sm text-muted-foreground">
                Custom Songs for Every Occasion
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Version 1.0.0
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default More;