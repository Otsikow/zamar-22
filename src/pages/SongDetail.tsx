import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Pause, Download, Heart, Share2, Music2, Volume2, SkipBack, SkipForward, Scroll } from "lucide-react";
import SocialShare from "@/components/ui/social-share";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNowPlaying } from "@/contexts/NowPlayingContext";
import SyncedLyricsViewer from "@/components/player/SyncedLyricsViewer";
import Footer from "@/components/sections/Footer";

interface Song {
  id: string;
  title: string;
  genre: string | null;
  occasion: string | null;
  audio_url: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  featured: boolean | null;
}

interface Lyrics {
  id: string;
  text: string;
  pdf_url: string;
  language: string;
}

const SongDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { state, playSong, togglePlayPause, seekTo } = useNowPlaying();
  
  const [song, setSong] = useState<Song | null>(null);
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [relatedSongs, setRelatedSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  // Check if this song is currently playing
  const isPlaying = state.currentSong?.id === song?.id && state.isPlaying;
  const currentTime = state.currentTime;
  const duration = state.currentSong?.duration || 180;

  // Listen for seek events from synced lyrics
  useEffect(() => {
    const handleSeekToTime = (event: CustomEvent) => {
      seekTo(event.detail.time);
    };

    window.addEventListener('seekToTime', handleSeekToTime as EventListener);
    return () => window.removeEventListener('seekToTime', handleSeekToTime as EventListener);
  }, [seekTo]);

  useEffect(() => {
    const fetchSong = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("songs")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setSong(data);

        // Fetch lyrics if available
        const { data: lyricsData } = await supabase
          .from("lyrics")
          .select("*")
          .eq("song_id", id)
          .single();

        if (lyricsData) {
          setLyrics(lyricsData);
        }

        // Fetch related songs with similar tags
        if (data) {
          const { data: related } = await supabase
            .from("songs")
            .select("*")
            .eq("featured", true)
            .neq("id", id)
            .limit(6);
          
          setRelatedSongs(related || []);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Song not found or failed to load.",
          variant: "destructive",
        });
        console.error("Error fetching song:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSong();
  }, [id, toast]);

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
      // If this song is currently playing, toggle play/pause
      togglePlayPause();
    } else {
      // If this is a different song, start playing it
      const nowPlayingSong = {
        id: song.id,
        title: song.title,
        artist: "Zamar Artists",
        duration: duration,
        url: song.audio_url,
        cover: song.thumbnail_url || undefined,
      };
      playSong(nowPlayingSong);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: `${song?.title} ${isLiked ? "removed from" : "added to"} your favorites`,
    });
  };

  const handleShare = async () => {
    if (navigator.share && song) {
      try {
        await navigator.share({
          title: song.title,
          text: `Check out "${song.title}" by Zamar Artists`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Song link copied to clipboard",
    });
  };

  const handleDownload = () => {
    if (!song?.audio_url) {
      toast({
        title: "Error",
        description: "No audio file available for download",
        variant: "destructive",
      });
      return;
    }

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = song.audio_url;
    link.download = `${song.title} - Zamar Artists.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: `Downloading "${song.title}"`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-accent rounded w-32 mb-8"></div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="aspect-square bg-accent rounded-lg"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-accent rounded w-3/4"></div>
                  <div className="h-4 bg-accent rounded w-1/2"></div>
                  <div className="h-12 bg-accent rounded w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <Music2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-playfair text-foreground mb-2">Song Not Found</h2>
              <p className="text-muted-foreground font-inter mb-6">
                The song you're looking for doesn't exist or isn't available.
              </p>
              <Button asChild>
                <Link to="/songs">Back to Library</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back Button */}
          <div className="mb-8">
            <Button variant="outline" size="sm" asChild>
              <Link to="/songs">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Library
              </Link>
            </Button>
          </div>

          {/* Song Details */}
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            {/* Album Art */}
            <div className="aspect-square rounded-lg overflow-hidden bg-gradient-subtle">
              {song.thumbnail_url ? (
                <img 
                  src={song.thumbnail_url} 
                  alt={song.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 className="w-24 h-24 text-primary" />
                </div>
              )}
            </div>

            {/* Song Info */}
            <div className="flex flex-col justify-center space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-4">
                  {song.title}
                </h1>
                <p className="text-xl text-muted-foreground font-inter mb-4">
                  Zamar Artists
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {song.genre && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {song.genre}
                    </Badge>
                  )}
                  {song.occasion && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {song.occasion}
                    </Badge>
                  )}
                  {song.tags?.map((tag, index) => (
                    <Badge key={index} variant="outline" className="border-border text-muted-foreground">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  onClick={handlePlayPause}
                  className="flex-1 md:flex-none"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 mr-2" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                
                <Button variant="outline" size="lg" onClick={handleLike}>
                  <Heart className={`w-5 h-5 mr-2 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
                  {isLiked ? "Liked" : "Like"}
                </Button>
                
                <SocialShare
                  title={song.title}
                  description={`Check out "${song.title}" by Zamar Artists - Custom songs with purpose and faith`}
                  hashtags={['ZamarMusic', 'FaithMusic', 'CustomSongs', song.genre || '', song.occasion || '']}
                  trigger={
                    <Button variant="outline" size="lg">
                      <Share2 className="w-5 h-5 mr-2" />
                      Share
                    </Button>
                  }
                />
                
                <Button variant="outline" size="lg" onClick={handleDownload}>
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* Audio Player */}
          <Card className="bg-gradient-card border-border mb-8">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Waveform/Progress */}
                <div className="relative">
                  <div className="w-full h-3 bg-accent rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary transition-all duration-300 ease-out"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-primary/10 rounded-full opacity-50"></div>
                </div>

                {/* Player Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button size="icon" variant="ghost">
                      <SkipBack className="w-4 h-4 text-primary" />
                    </Button>
                    <Button size="icon" onClick={handlePlayPause}>
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </Button>
                    <Button size="icon" variant="ghost">
                      <SkipForward className="w-4 h-4 text-primary" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-primary" />
                      <div className="w-16 h-1 bg-accent rounded-full">
                        <div className="w-3/4 h-full bg-primary rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lyrics and Info Tabs */}
          <Tabs defaultValue="lyrics" className="mb-12">
            <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-3">
              <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
              <TabsTrigger value="info">Song Info</TabsTrigger>
              <TabsTrigger value="scripture" className="hidden md:block">Scripture</TabsTrigger>
            </TabsList>
            
            <TabsContent value="lyrics" className="mt-6">
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="font-playfair text-foreground flex items-center gap-2">
                    <Scroll className="w-5 h-5 text-primary" />
                    Lyrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {song?.id && (
                    <SyncedLyricsViewer
                      songId={song.id}
                      currentTime={currentTime}
                      isPlaying={isPlaying}
                    />
                  )}
                  
                  {/* Fallback to regular lyrics if no synced lyrics */}
                  <div className="p-6">
                    {lyrics ? (
                      <div className="whitespace-pre-line text-foreground leading-relaxed">
                        {(() => {
                          // Remove scripture inspiration line from lyrics display
                          const lyricsText = lyrics.text || "Lyrics not available";
                          const cleanedLyrics = lyricsText.replace(/Scripture Inspiration:[^\n]*\n\n?/, '');
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
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="font-playfair text-foreground">Song Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Genre:</span>
                      <span className="ml-2 text-primary">{song.genre || "Gospel"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Occasion:</span>
                      <span className="ml-2 text-primary">{song.occasion || "Worship"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2 text-foreground">{formatTime(duration)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Artist:</span>
                      <span className="ml-2 text-foreground">Zamar Artists</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scripture" className="mt-6">
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="font-playfair text-foreground">Scripture Reference</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Extract scripture inspiration from lyrics text
                    const scriptureMatch = lyrics?.text?.match(/Scripture Inspiration:\s*([^–\n]+)\s*–\s*([^"\n]+)/);
                    if (scriptureMatch) {
                      const reference = scriptureMatch[1].trim();
                      const quote = scriptureMatch[2].trim().replace(/"/g, '');
                      return (
                        <div className="space-y-4">
                          <div className="border-l-4 border-primary pl-4">
                            <blockquote className="text-lg italic text-foreground leading-relaxed">
                              "{quote}"
                            </blockquote>
                            <cite className="text-sm text-primary font-medium mt-2 block">
                              — {reference}
                            </cite>
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

          {/* Related Songs */}
          {relatedSongs.length > 0 && (
            <div>
              <h3 className="text-2xl font-playfair font-bold text-foreground mb-6">
                Related Songs
              </h3>
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 w-max">
                  {relatedSongs.map((relatedSong) => (
                    <Card 
                      key={relatedSong.id}
                      className="w-48 bg-gradient-card border-border hover:border-primary/30 transition-all duration-300 cursor-pointer flex-shrink-0"
                      onClick={() => window.location.href = `/songs/${relatedSong.id}`}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-square rounded-t-lg overflow-hidden bg-accent">
                          {relatedSong.thumbnail_url ? (
                            <img 
                              src={relatedSong.thumbnail_url} 
                              alt={relatedSong.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music2 className="w-8 h-8 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="font-playfair font-semibold text-foreground text-sm mb-1 line-clamp-1">
                            {relatedSong.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">Zamar Artists</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SongDetail;