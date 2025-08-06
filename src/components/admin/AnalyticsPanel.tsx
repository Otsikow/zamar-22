import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Play, Download, Globe, Users } from "lucide-react";

interface SongPlay {
  id: string;
  song_id: string;
  country?: string;
  created_at: string;
  songs?: {
    title: string;
  };
}

interface AnalyticsPanelProps {
  songPlays: SongPlay[];
  activeSessions: number;
}

const AnalyticsPanel = ({ songPlays, activeSessions }: AnalyticsPanelProps) => {
  // Calculate top played songs
  const songPlayCounts = songPlays.reduce((acc, play) => {
    const songTitle = play.songs?.title || 'Unknown Song';
    acc[songTitle] = (acc[songTitle] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSongs = Object.entries(songPlayCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Calculate downloads by country
  const countryStats = songPlays.reduce((acc, play) => {
    const country = play.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCountries = Object.entries(countryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const totalPlays = songPlays.length;
  const maxPlays = Math.max(...Object.values(songPlayCounts), 1);
  const maxCountryPlays = Math.max(...Object.values(countryStats), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Real-Time Listeners */}
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

      {/* Total Plays */}
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

      {/* Countries Reached */}
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

      {/* Top Played Songs */}
      <Card className="md:col-span-2 bg-gradient-card border-border">
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
            Downloads by Country
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
  );
};

export default AnalyticsPanel;