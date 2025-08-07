import { useState, useEffect } from "react";
import { useTranslation, getLocaleForLanguage } from '@/contexts/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Music, Calendar, TrendingUp, BarChart3, PieChart, Plus, Play, Download, Globe, Users, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Song {
  id: string;
  title: string;
  genre: string | null;
  occasion: string | null;
  tags: string[] | null;
  featured: boolean | null;
  created_at: string;
}

interface SongPlay {
  id: string;
  song_id: string;
  country?: string;
  created_at: string;
  songs?: {
    title: string;
  };
}

interface CustomSongRequest {
  id: string;
  status: string;
  tier: string;
  created_at: string;
  occasion: string;
  style_genre: string;
}

interface RequestStats {
  total: number;
  pending: number;
  completed: number;
  inProgress: number;
  rejected: number;
  byMonth: Record<string, number>;
  byTier: Record<string, number>;
  recentActivity: Array<{ date: string; count: number }>;
  weeklyTrend: Array<{ week: string; count: number }>;
  monthlyTrend: Array<{ month: string; count: number }>;
}

interface SongStats {
  total: number;
  featured: number;
  byGenre: Record<string, number>;
  byOccasion: Record<string, number>;
  byMonth: Record<string, number>;
  recentActivity: Array<{ date: string; count: number }>;
}

interface SongAnalyticsProps {
  songPlays?: SongPlay[];
  activeSessions?: number;
}

const SongAnalytics = ({ songPlays = [], activeSessions = 0 }: SongAnalyticsProps) => {
  const { toast } = useToast();

  // Retrieve the current language for locale aware date formatting.
  const { currentLanguage } = useTranslation();
  const locale = getLocaleForLanguage(currentLanguage);
  const [songs, setSongs] = useState<Song[]>([]);
  const [requests, setRequests] = useState<CustomSongRequest[]>([]);
  const [stats, setStats] = useState<SongStats>({
    total: 0,
    featured: 0,
    byGenre: {},
    byOccasion: {},
    byMonth: {},
    recentActivity: []
  });
  const [requestStats, setRequestStats] = useState<RequestStats>({
    total: 0,
    pending: 0,
    completed: 0,
    inProgress: 0,
    rejected: 0,
    byMonth: {},
    byTier: {},
    recentActivity: [],
    weeklyTrend: [],
    monthlyTrend: []
  });
  const [timeRange, setTimeRange] = useState("30"); // days
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSongs();
    fetchRequests();
  }, []);

  useEffect(() => {
    if (songs.length > 0) {
      calculateStats();
    }
  }, [songs, timeRange]);

  useEffect(() => {
    if (requests.length > 0) {
      calculateRequestStats();
    }
  }, [requests, timeRange]);

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSongs(data || []);
    } catch (error) {
      console.error("Error fetching songs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch song data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("custom_song_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch request data",
        variant: "destructive",
      });
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const daysAgo = parseInt(timeRange);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Filter songs by date range for growth analysis
    const recentSongs = songs.filter(song => 
      new Date(song.created_at) >= cutoffDate
    );

    // Calculate basic stats
    const total = songs.length;
    const featured = songs.filter(s => s.featured).length;

    // Calculate genre distribution
    const byGenre = songs.reduce((acc, song) => {
      const genre = song.genre || "Unspecified";
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate occasion distribution
    const byOccasion = songs.reduce((acc, song) => {
      const occasion = song.occasion || "General";
      acc[occasion] = (acc[occasion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate monthly growth (last 12 months)
    const byMonth = songs.reduce((acc, song) => {
      const date = new Date(song.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate daily activity for selected time range
    const recentActivity: Array<{ date: string; count: number }> = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const count = recentSongs.filter(song => 
        song.created_at.split('T')[0] === dateKey
      ).length;
      recentActivity.push({ date: dateKey, count });
    }

    setStats({
      total,
      featured,
      byGenre,
      byOccasion,
      byMonth,
      recentActivity
    });
  };

  const calculateRequestStats = () => {
    const now = new Date();
    const daysAgo = parseInt(timeRange);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Calculate basic stats
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    const inProgress = requests.filter(r => r.status === 'in_progress').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;

    // Calculate tier distribution
    const byTier = requests.reduce((acc, request) => {
      const tier = request.tier || "Basic";
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate monthly growth
    const byMonth = requests.reduce((acc, request) => {
      const date = new Date(request.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate daily activity for selected time range
    const recentActivity: Array<{ date: string; count: number }> = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const count = requests.filter(request => 
        request.created_at.split('T')[0] === dateKey
      ).length;
      recentActivity.push({ date: dateKey, count });
    }

    // Calculate weekly trend (last 12 weeks)
    const weeklyTrend: Array<{ week: string; count: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      const weekKey = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      
      const count = requests.filter(request => {
        const requestDate = new Date(request.created_at);
        return requestDate >= weekStart && requestDate <= weekEnd;
      }).length;
      
      weeklyTrend.push({ week: weekKey, count });
    }

    // Calculate monthly trend (last 12 months)
    const monthlyTrend: Array<{ month: string; count: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const count = requests.filter(request => {
        const requestDate = new Date(request.created_at);
        return requestDate >= monthStart && requestDate <= monthEnd;
      }).length;
      
      monthlyTrend.push({ month: monthKey, count });
    }

    setRequestStats({
      total,
      pending,
      completed,
      inProgress,
      rejected,
      byMonth,
      byTier,
      recentActivity,
      weeklyTrend,
      monthlyTrend
    });
  };

  const getTopCategories = (data: Record<string, number>, limit = 5) => {
    return Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-gradient-card border-border animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-accent rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-accent rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const recentGrowth = stats.recentActivity.reduce((sum, day) => sum + day.count, 0);
  const avgDaily = recentGrowth / parseInt(timeRange);

  // Calculate analytics from song plays
  const topPlayedSongs = songPlays.reduce((acc, play) => {
    const songTitle = play.songs?.title || 'Unknown Song';
    acc[songTitle] = (acc[songTitle] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSongs = Object.entries(topPlayedSongs)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const countryStats = songPlays.reduce((acc, play) => {
    const country = play.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCountries = Object.entries(countryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const totalPlays = songPlays.length;
  const maxPlays = Math.max(...Object.values(topPlayedSongs), 1);
  const maxCountryPlays = Math.max(...Object.values(countryStats), 1);

  return (
    <div className="space-y-6">
      {/* Song Request Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{requestStats.total}</div>
            <p className="text-xs text-muted-foreground">All time requests</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Pending</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{requestStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{requestStats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {requestStats.total > 0 ? ((requestStats.completed / requestStats.total) * 100).toFixed(1) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{requestStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Being processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Real-Time Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Real-Time Listeners</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeSessions}</div>
            <p className="text-xs text-muted-foreground">Active sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Plays</CardTitle>
            <Play className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalPlays}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Countries Reached</CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{Object.keys(countryStats).length}</div>
            <p className="text-xs text-muted-foreground">Unique countries</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Songs</CardTitle>
            <Music className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.featured} featured songs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Played Songs */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              Top Played Songs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topSongs.map(([songTitle, playCount], index) => (
              <div key={songTitle} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    {index + 1}. {songTitle}
                  </span>
                  <span className="text-xs text-muted-foreground">{playCount} plays</span>
                </div>
                <Progress value={(playCount / maxPlays) * 100} className="h-2" />
              </div>
            ))}
            {topSongs.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No song plays recorded yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Downloads by Country */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Download className="h-5 w-5" />
              Plays by Country
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCountries.map(([country, playCount], index) => (
              <div key={country} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    {index + 1}. {country}
                  </span>
                  <span className="text-xs text-muted-foreground">{playCount}</span>
                </div>
                <Progress value={(playCount / maxCountryPlays) * 100} className="h-2" />
              </div>
            ))}
            {topCountries.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No location data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Library Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Genres</CardTitle>
            <PieChart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {Object.keys(stats.byGenre).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {getTopCategories(stats.byGenre, 1)[0]?.[0] || "No genres"} is most popular
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Occasions</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {Object.keys(stats.byOccasion).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {getTopCategories(stats.byOccasion, 1)[0]?.[0] || "No occasions"} most common
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Recent Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{recentGrowth}</div>
            <p className="text-xs text-muted-foreground">
              {avgDaily.toFixed(1)} songs/day average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="distribution" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-secondary">
            <TabsTrigger value="distribution" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Distribution
            </TabsTrigger>
            <TabsTrigger value="growth" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Growth Trends
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Insights
            </TabsTrigger>
          </TabsList>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="distribution" className="space-y-4">
          {/* Request Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Weekly Request Trend */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <TrendingUp className="h-5 w-5" />
                  Weekly Request Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={requestStats.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="week" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Request Trend */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Request Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={requestStats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Genre Distribution */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <BarChart3 className="h-5 w-5" />
                  Genre Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getTopCategories(stats.byGenre).map(([genre, count]) => {
                  const percentage = (count / stats.total) * 100;
                  return (
                    <div key={genre} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">{genre}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{count} songs</span>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
                {Object.keys(stats.byGenre).length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No genre data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Occasion Distribution */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Calendar className="h-5 w-5" />
                  Occasion Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getTopCategories(stats.byOccasion).map(([occasion, count]) => {
                  const percentage = (count / stats.total) * 100;
                  return (
                    <div key={occasion} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">{occasion}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{count} songs</span>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
                {Object.keys(stats.byOccasion).length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No occasion data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity ({timeRange} days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentActivity.slice(-7).map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{formatDate(day.date)}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${day.count > 0 ? Math.max((day.count / Math.max(...stats.recentActivity.map(d => d.count), 1)) * 100, 10) : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {day.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Growth */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Calendar className="h-5 w-5" />
                  Monthly Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byMonth)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .slice(0, 6)
                    .map(([month, count]) => {
                      const maxCount = Math.max(...Object.values(stats.byMonth));
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={month} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-foreground">
                              {formatMonth(month)}
                            </span>
                            <span className="text-xs text-muted-foreground">{count} songs</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Gaps */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Plus className="h-5 w-5" />
                  Content Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Underrepresented Genres</h4>
                  <div className="space-y-2">
                    {["Gospel", "Afrobeats", "R&B", "Classical", "Rap", "Reggae"]
                      .filter(genre => !stats.byGenre[genre] || stats.byGenre[genre] < 3)
                      .map(genre => (
                        <div key={genre} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{genre}</span>
                          <Badge variant="outline" className="text-xs">
                            {stats.byGenre[genre] || 0} songs
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Missing Occasions</h4>
                  <div className="space-y-2">
                    {["Birthday", "Wedding", "Funeral", "Church", "Business"]
                      .filter(occasion => !stats.byOccasion[occasion] || stats.byOccasion[occasion] < 2)
                      .map(occasion => (
                        <div key={occasion} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{occasion}</span>
                          <Badge variant="outline" className="text-xs">
                            {stats.byOccasion[occasion] || 0} songs
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <BarChart3 className="h-5 w-5" />
                  Library Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Featured Content</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(stats.featured / stats.total) * 100} className="w-16 h-2" />
                      <span className="text-xs text-muted-foreground">
                        {((stats.featured / stats.total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Genre Diversity</span>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min((Object.keys(stats.byGenre).length / 6) * 100, 100)} className="w-16 h-2" />
                      <span className="text-xs text-muted-foreground">
                        {Object.keys(stats.byGenre).length}/6
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Occasion Coverage</span>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min((Object.keys(stats.byOccasion).length / 5) * 100, 100)} className="w-16 h-2" />
                      <span className="text-xs text-muted-foreground">
                        {Object.keys(stats.byOccasion).length}/5
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Recent Activity</span>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min((recentGrowth / 10) * 100, 100)} className="w-16 h-2" />
                      <span className="text-xs text-muted-foreground">
                        {recentGrowth} songs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Aim for 20%+ featured content</p>
                    <p>• Target 6+ genres for diversity</p>
                    <p>• Cover all 5 main occasions</p>
                    <p>• Maintain steady upload schedule</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SongAnalytics;