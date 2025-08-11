import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/sections/Footer";
import AudioVisualizer from "@/components/player/AudioVisualizer";
import SyncedLyricsViewer from "@/components/player/SyncedLyricsViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Volume2, ArrowLeft, SkipForward, SkipBack, Maximize2, MoreHorizontal, Repeat, Shuffle } from "lucide-react";
import PlayerSlider from "@/components/player/PlayerSlider";
import { useNowPlaying } from "@/contexts/NowPlayingContext";
import { extractScriptureFromLyrics } from "@/lib/utils";
import FavouriteButton from "@/components/FavouriteButton";
import zamarLogo from "@/assets/zamar-logo.png";
import AdSlot from "@/components/ads/AdSlot";

interface Song {
  id: string;
  title: string;
  genre: string;
  occasion: string;
  audio_url: string;
  thumbnail_url: string;
  tags: string[];
  featured: boolean;
}

interface Lyrics {
  id: string;
  text: string;
  pdf_url: string;
  language: string;
}

const SongPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { state, playSong, togglePlayPause, seekTo, setVolume, toggleLoop } = useNowPlaying();
  
  const [song, setSong] = useState<Song | null>(null);
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for seek events from synced lyrics
  useEffect(() => {
    const handleSeekToTime = (event: CustomEvent) => {
      seekTo(event.detail.time);
    };

    window.addEventListener('seekToTime', handleSeekToTime as EventListener);
    return () => window.removeEventListener('seekToTime', handleSeekToTime as EventListener);
  }, [seekTo]);

  // Get current state from global context - ensure we're getting live updates
  const isPlaying = state.currentSong?.id === song?.id && state.isPlaying;
  const currentTime = state.currentTime || 0;
  const duration = state.currentSong?.duration || 0;
  const volume = Math.round(state.volume * 100);

  useEffect(() => {
    if (id) {
      fetchSong();
    }
  }, [id]);

  const fetchSong = async () => {
    try {
      setLoading(true);
      
      // Fetch song details
      const { data: songData, error: songError } = await supabase
        .from("songs")
        .select("*")
        .eq("id", id)
        .single();

      if (songError) throw songError;
      setSong(songData);

      // Fetch lyrics if available
      const { data: lyricsData } = await supabase
        .from("lyrics")
        .select("*")
        .eq("song_id", id)
        .single();

      if (lyricsData) {
        setLyrics(lyricsData);
      }

      // Log song play
      if (songData) {
        await supabase.from("song_plays").insert({
          song_id: id,
          user_id: null,
          country: null
        });
      }

    } catch (error) {
      console.error("Error fetching song:", error);
      toast({
        title: "Error",
        description: "Failed to load song",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!song || !song.audio_url) {
      toast({
        title: "Error",
        description: "No audio file available for this song",
        variant: "destructive",
      });
      return;
    }

    if (state.currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      console.log('Playing song with URL:', song.audio_url);
      const nowPlayingSong = {
        id: song.id,
        title: song.title,
        artist: "Zamar Artists",
        duration: 240,
        url: song.audio_url,
        cover: zamarLogo,
      };
      playSong(nowPlayingSong);
    }
  };

  const handleProgressChange = (value: number[]) => {
    const newTime = value[0];
    console.log('🎯 Seeking to time:', newTime);
    seekTo(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-24 px-4">
          <div className="container mx-auto text-center">
            <div className="animate-pulse">Loading song...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-24 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Song Not Found</h1>
            <Link to="/songs">
              <Button variant="outline">Back to Songs</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Link to="/songs" className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Songs
          </Link>

          {/* Song Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-3xl md:text-4xl font-playfair font-bold mb-2">{song.title}</h1>
              {song.id && <FavouriteButton songId={song.id} size="md" />}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">{song.genre}</Badge>
              <Badge variant="secondary">{song.occasion}</Badge>
              {song.tags?.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Audio Player */}
          <Card className="mb-8 bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-primary">Audio Player</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Professional Audio Visualizer */}
              <div className="bg-muted/20 h-32 md:h-40 rounded-lg border border-primary/20 overflow-hidden">
                <AudioVisualizer />
              </div>

              {/* Progress Bar - force re-render with key based on currentTime */}
              <div className="space-y-2" key={Math.floor(currentTime * 10)}>
                <PlayerSlider
                  variant="progress"
                  value={[currentTime]}
                  max={Math.max(duration, 1)}
                  step={0.1}
                  onValueChange={handleProgressChange}
                  className="w-full"
                  disabled={!song?.audio_url}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handlePlayPause}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  
                  <Button
                    onClick={() => seekTo(0)}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={toggleLoop}
                    variant={state.isLooping ? "default" : "outline"}
                    size="sm"
                  >
                    <Repeat className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 w-32">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  <PlayerSlider
                    variant="volume"
                    value={[state.volume]}
                    max={1}
                    step={0.01}
                    onValueChange={(v) => setVolume(v[0])}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Ad Slot */}
          <AdSlot placement="player_728x90" className="my-6" />

          {/* Lesson Tip Banner */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8">
            <div className="text-primary font-medium mb-1">Learn with the lyrics:</div>
            <div className="text-sm text-muted-foreground">Follow along and sing it back!</div>
          </div>

          <Tabs defaultValue="lyrics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="scripture">Scripture</TabsTrigger>
            </TabsList>

            <TabsContent value="lyrics" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lyrics</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {song?.id && (
                    <SyncedLyricsViewer
                      songId={song.id}
                      currentTime={currentTime}
                      isPlaying={isPlaying}
                    />
                  )}
                  
                   <div className="p-6">
                     {lyrics ? (
                       <div className="whitespace-pre-line text-foreground leading-relaxed">
                         {(() => {
                           const lyricsText = lyrics.text || "Lyrics not available";
                           const cleanedLyrics = lyricsText.replace(/^\s*\(?\s*Scripture(?:\s+Inspiration|\s+Reference)?\s*:[^\n\)]*\)?\s*\n\n?/im, '');
                           return cleanedLyrics;
                         })()}
                       </div>
                     ) : (
                       <div className="text-muted-foreground">Lyrics not available for this song</div>
                     )}
                   </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Song Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Genre</label>
                    <div className="text-foreground">{song.genre}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Occasion</label>
                    <div className="text-foreground">{song.occasion}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {song.tags?.map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scripture" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scripture Reference</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const scripture = extractScriptureFromLyrics(lyrics?.text || "");
                    if (scripture?.quote || scripture?.reference) {
                      return (
                        <div className="space-y-4">
                          <div className="border-l-4 border-primary pl-4">
                            {scripture.quote && (
                              <blockquote className="text-lg italic text-foreground leading-relaxed">
                                "{scripture.quote}"
                              </blockquote>
                            )}
                            {scripture.reference && (
                              <cite className="text-sm text-primary font-medium mt-2 block">
                                — {scripture.reference}
                              </cite>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="text-muted-foreground">
                        Scripture references will be displayed here when available.
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SongPlayer;
