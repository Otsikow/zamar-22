import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Music, PlayCircle, Library, Users, TrendingUp, Clock, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FloatingChatButton } from "@/components/chat/FloatingChatButton";

interface DashboardStats {
  mySongs: number;
  totalPlays: number;
  pendingRequests: number;
  followers: number;
}

interface RecentActivity {
  id: string;
  type: 'song_completed' | 'song_played' | 'new_request';
  message: string;
  time: string;
  icon: 'music' | 'play' | 'clock';
}

const Dashboard = () => {
  const { user } = useAuth();
  const displayName = (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || (user?.user_metadata?.first_name as string) || (user?.email?.split('@')[0] as string) || 'there';
const [stats, setStats] = useState<DashboardStats>({
    mySongs: 0,
    totalPlays: 0,
    pendingRequests: 0,
    followers: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
      fetchRecentActivity();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      // Fetch user's custom songs count
      const { count: songsCount } = await supabase
        .from('custom_songs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch total plays for user's songs
      const { data: userSongs } = await supabase
        .from('custom_songs')
        .select('id')
        .eq('user_id', user.id);

      let totalPlays = 0;
      if (userSongs && userSongs.length > 0) {
        const songIds = userSongs.map(song => song.id);
        const { count: playsCount } = await supabase
          .from('song_plays')
          .select('*', { count: 'exact', head: true })
          .in('song_id', songIds);
        totalPlays = playsCount || 0;
      }

      // Fetch pending requests count
      const { count: pendingCount } = await supabase
        .from('custom_song_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      setStats({
        mySongs: songsCount || 0,
        totalPlays,
        pendingRequests: pendingCount || 0,
        followers: 0 // Placeholder - can be implemented when followers feature is added
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    if (!user) return;

    try {
      // Fetch recent custom songs
      const { data: recentSongs } = await supabase
        .from('custom_songs')
        .select('song_title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent requests
      const { data: recentRequests } = await supabase
        .from('custom_song_requests')
        .select('key_message, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      const activities: RecentActivity[] = [];

      // Add completed songs
      recentSongs?.forEach((song, index) => {
        activities.push({
          id: `song-${index}`,
          type: 'song_completed',
          message: `New song "${song.song_title}" completed`,
          time: formatTimeAgo(new Date(song.created_at)),
          icon: 'music'
        });
      });

      // Add recent requests
      recentRequests?.forEach((request, index) => {
        activities.push({
          id: `request-${index}`,
          type: 'new_request',
          message: `Song request: "${request.key_message}" - ${request.status}`,
          time: formatTimeAgo(new Date(request.created_at)),
          icon: 'clock'
        });
      });

      // Sort by most recent and limit to 3
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(activities.slice(0, 3));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Subscribe to custom songs changes
    const songsChannel = supabase
      .channel('dashboard-songs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'custom_songs',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchDashboardStats();
          fetchRecentActivity();
        }
      )
      .subscribe();

    // Subscribe to song requests changes
    const requestsChannel = supabase
      .channel('dashboard-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'custom_song_requests',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchDashboardStats();
          fetchRecentActivity();
        }
      )
      .subscribe();

    // Subscribe to song plays changes
    const playsChannel = supabase
      .channel('dashboard-plays')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'song_plays'
        },
        () => fetchDashboardStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(songsChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(playsChannel);
    };
  };

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'music':
        return <Music className="h-5 w-5 text-primary" />;
      case 'play':
        return <PlayCircle className="h-5 w-5 text-green-500" />;
      case 'clock':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Music className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 pt-20 pb-32">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome back, {displayName}</h1>
          <p className="text-muted-foreground">Here’s your music hub. Manage your songs, track requests, and explore your music journey.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Songs</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {loading ? "..." : stats.mySongs}
              </div>
              <p className="text-xs text-muted-foreground">Custom songs created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {loading ? "..." : stats.totalPlays.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Across all your songs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {loading ? "..." : stats.pendingRequests}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Followers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {loading ? "..." : stats.followers}
              </div>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Create New Song
              </CardTitle>
              <CardDescription>
                Submit a new song request to our AI composer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/request-song">Create Song</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-5 w-5 text-primary" />
                My Library
              </CardTitle>
              <CardDescription>
                Browse and manage your song collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link to="/library">View Library</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Analytics
              </CardTitle>
              <CardDescription>
                Track your music performance and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link to="/analytics">View Analytics</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                My Referral Earnings
              </CardTitle>
              <CardDescription>
                View referrals, earnings, and payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link to="/referrals/dashboard">View Earnings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest music activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.message}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity yet. Start by creating your first song!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default Dashboard;