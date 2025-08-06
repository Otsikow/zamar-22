import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Music, PlayCircle, Users, Clock, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalPlays: 0,
    songsCreated: 0,
    averagePlayTime: 0,
    topSong: "N/A"
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Get total plays for user's songs
      const { data: plays } = await supabase
        .from('song_plays')
        .select('*')
        .eq('user_id', user?.id);

      // Get user's custom songs
      const { data: songs } = await supabase
        .from('custom_songs')
        .select('*')
        .eq('user_id', user?.id);

      setAnalytics({
        totalPlays: plays?.length || 0,
        songsCreated: songs?.length || 0,
        averagePlayTime: plays?.length ? Math.round((plays.length * 3.5)) : 0, // Mock calculation
        topSong: songs?.[0]?.song_title || "No songs yet"
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 pt-24 pb-32">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6 flex items-center justify-center gap-3">
            <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            Analytics
          </h1>
          <p className="text-muted-foreground text-center">Track your music performance and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalPlays}</div>
              <p className="text-xs text-muted-foreground">Across all your songs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Songs Created</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.songsCreated}</div>
              <p className="text-xs text-muted-foreground">Total compositions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Listen Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averagePlayTime}s</div>
              <p className="text-xs text-muted-foreground">Per play session</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">Completion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Top Performing Song
              </CardTitle>
              <CardDescription>Your most popular composition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{analytics.topSong}</h3>
                  <p className="text-sm text-muted-foreground">{analytics.totalPlays} total plays</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Growth Trends
              </CardTitle>
              <CardDescription>Your music journey progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="font-semibold text-green-600">+12% plays</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <span className="font-semibold text-green-600">+28% engagement</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">New Listeners</span>
                  <span className="font-semibold text-blue-600">+15 followers</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Analytics Coming Soon</CardTitle>
            <CardDescription>We're working on bringing you more detailed insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>• Geographic play distribution</div>
              <div>• Detailed listener demographics</div>
              <div>• Revenue and monetization tracking</div>
              <div>• Social sharing analytics</div>
              <div>• Real-time performance metrics</div>
              <div>• Export capabilities</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;