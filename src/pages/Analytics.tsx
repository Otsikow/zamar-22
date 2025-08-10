import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Music, PlayCircle, Users, ArrowLeft, BarChart3 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PlayRow {
  id: string;
  song_id: string | null;
  user_id: string | null;
  created_at: string;
}

interface SongRow {
  id: string;
  song_title: string;
}

const daysArray = (n: number) => {
  const arr: { date: string; label: string }[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    arr.push({ date: d.toISOString().slice(0, 10), label });
  }
  return arr;
};

const Analytics = () => {
  const { user } = useAuth();
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [plays, setPlays] = useState<PlayRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Music Analytics | Zamar";
    const desc = "Track plays, top songs, and listeners with Zamar analytics.";
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = desc;

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const href = window.location.origin + '/analytics';
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = href;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch user's songs
        const { data: songRows } = await supabase
          .from("custom_songs")
          .select("id, song_title")
          .eq("user_id", user.id);

        const s = songRows || [];
        setSongs(s as SongRow[]);

        if (s.length > 0) {
          const ids = s.map((x) => x.id);
          const since = new Date();
          since.setDate(since.getDate() - 30);

          const { data: playRows } = await supabase
            .from("song_plays")
            .select("id, song_id, user_id, created_at")
            .in("song_id", ids)
            .gte("created_at", since.toISOString());

          setPlays((playRows || []) as PlayRow[]);
        } else {
          setPlays([]);
        }
      } catch (e) {
        console.error("Error loading analytics:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const totalPlays = plays.length;
  const songsCreated = songs.length;

  // Unique listeners (by user_id, ignoring nulls)
  const uniqueListeners = useMemo(() => {
    const setU = new Set(plays.map((p) => p.user_id).filter(Boolean));
    return setU.size;
  }, [plays]);

  // Top songs by play count
  const topSongs = useMemo(() => {
    const counts = new Map<string, number>();
    plays.forEach((p) => {
      if (!p.song_id) return;
      counts.set(p.song_id, (counts.get(p.song_id) || 0) + 1);
    });
    const byIdTitle = new Map(songs.map((s) => [s.id, s.song_title] as const));
    return Array.from(counts.entries())
      .map(([id, count]) => ({ id, title: byIdTitle.get(id) || "Unknown", count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [plays, songs]);

  // Plays per day for last 30 days
  const chartData = useMemo(() => {
    const template = daysArray(30);
    const map = new Map<string, number>(template.map((d) => [d.date, 0]));
    plays.forEach((p) => {
      const key = p.created_at.slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return template.map((d) => ({ label: d.label, plays: map.get(d.date) || 0 }));
  }, [plays]);

  const avgPlaysPerSong = useMemo(() => {
    return songsCreated ? Math.round((totalPlays / songsCreated) * 10) / 10 : 0;
  }, [totalPlays, songsCreated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 pt-24 pb-32">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header with Back */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/dashboard" aria-label="Back to Dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Link>
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-primary" /> Analytics
            </h1>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "…" : totalPlays.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all your songs (30 days)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Songs Created</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "…" : songsCreated}</div>
              <p className="text-xs text-muted-foreground">Your compositions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Plays / Song</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "…" : avgPlaysPerSong}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Listeners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "…" : uniqueListeners}</div>
              <p className="text-xs text-muted-foreground">Signed-in listeners (30 days)</p>
            </CardContent>
          </Card>
        </div>

        {/* Plays Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Plays – Last 30 Days
            </CardTitle>
            <CardDescription>Your daily plays across all your songs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
                  <defs>
                    <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" interval={3} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="plays" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPlays)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Songs */}
        <Card>
          <CardHeader>
            <CardTitle>Top Songs</CardTitle>
            <CardDescription>Your most played songs over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {topSongs.length === 0 ? (
              <div className="text-sm text-muted-foreground">No plays yet. Share your songs to get started.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Song</TableHead>
                      <TableHead className="text-right">Plays</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSongs.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.title}</TableCell>
                        <TableCell className="text-right">{s.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
