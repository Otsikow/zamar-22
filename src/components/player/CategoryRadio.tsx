
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNowPlaying } from "@/contexts/NowPlayingContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat,
  Radio,
  Music,
  Heart,
  Globe
} from "lucide-react";
import PlayerSlider from "@/components/player/PlayerSlider";
// Visualizer powered by Web Audio API
import { Volume2 } from "lucide-react";
import AudioVisualizer from "@/components/player/AudioVisualizer";
import zamarLogo from "@/assets/zamar-logo.png";

interface Song {
  id: string;
  title: string;
  genre: string;
  occasion: string;
  audio_url: string;
  thumbnail_url: string;
  tags: string[];
  featured: boolean;
  language?: string;
}

interface CategoryRadioProps {
  className?: string;
}

const CategoryRadio = ({ className }: CategoryRadioProps) => {
  const { state, playQueue, togglePlayPause, nextSong, previousSong, toggleShuffle, setQueueMode, stopRadio, seekTo, setVolume } = useNowPlaying();
  const { toast } = useToast();
  
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableOccasions, setAvailableOccasions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>("");
  const [toppingUp, setToppingUp] = useState(false);
  
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  useEffect(() => {
    const el = document.getElementById('radio-audio') as HTMLAudioElement | null;
    setAudioEl(el || null);
  }, []);
  
  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
  // time format helper
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Reset current category when radio stops
  useEffect(() => {
    if (!state.isQueueMode || !state.isPlaying) {
      console.log('🎵 Radio stopped, clearing category');
      setCurrentCategory("");
    }
  }, [state.isQueueMode, state.isPlaying]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // First try to get all songs with basic fields
      const { data: songs, error } = await supabase
        .from("songs")
        .select("genre, occasion")
        .not("audio_url", "is", null)
        .range(0, 99);

      if (error) {
        console.error("Error fetching categories:", error);
        return;
      }

      if (songs && songs.length > 0) {
        const genres = [...new Set(songs.map(song => song.genre).filter(Boolean))] as string[];
        const occasions = [...new Set(songs.map(song => song.occasion).filter(Boolean))] as string[];
        
        setAvailableGenres(genres);
        setAvailableOccasions(occasions);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };


  const playByCategory = async (category: string, type: 'genre' | 'occasion') => {
    try {
      setLoading(true);
      setCurrentCategory(category);

      const { data: songs, error } = await supabase
        .from("songs")
        .select("*")
        .eq(type, category)
        .not("audio_url", "is", null)
        .range(0, 99)
        .order("created_at", { ascending: false });


      if (error) throw error;

      if (!songs || songs.length === 0) {
        toast({
          title: "No Songs Found",
          description: `No songs available in ${category}`,
          variant: "destructive",
        });
        return;
      }

      // Convert to queue format
      const queue = songs.map(song => ({
        id: song.id,
        title: song.title,
        artist: "Zamar Artists",
        duration: 240, // Will be updated when audio loads
        url: song.audio_url,
        cover: zamarLogo,
      }));

      // Start continuous playback
      playQueue(queue, 0);
      setQueueMode(true);

      toast({
        title: "Radio Started",
        description: `Playing ${songs.length} songs from ${category}`,
      });

    } catch (error) {
      console.error("Error loading category:", error);
      toast({
        title: "Error",
        description: "Failed to load songs for this category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const playAllSongs = async () => {
    try {
      setLoading(true);
      setCurrentCategory("All Songs");

      const { data: songs, error } = await supabase
        .from("songs")
        .select("*")
        .not("audio_url", "is", null)
        .range(0, 99)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!songs || songs.length === 0) {
        toast({
          title: "No Songs Found",
          description: "No songs available",
          variant: "destructive",
        });
        return;
      }

      const queue = songs.map(song => ({
        id: song.id,
        title: song.title,
        artist: "Zamar Artists",
        duration: 240,
        url: song.audio_url,
        cover: zamarLogo,
      }));

      playQueue(queue, 0);
      setQueueMode(true);

      toast({
        title: "All Songs Radio",
        description: `Playing all ${songs.length} songs`,
      });

    } catch (error) {
      console.error("Error loading all songs:", error);
      toast({
        title: "Error",
        description: "Failed to load songs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  // Ensure the queue never runs out by topping up with random songs
  const shuffleArrayLocal = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const ensureQueueHasNext = async (minRemaining = 5) => {
    try {
      const remaining = state.queue.length - (state.currentIndex + 1);
      if (remaining >= minRemaining || toppingUp) return;
      setToppingUp(true);

      const excludeIds = Array.from(new Set(state.queue.map((s) => s.id)));
      let query = supabase
        .from("songs")
        .select("*")
        .not("audio_url", "is", null)
        .limit(40);

      if (excludeIds.length) {
        const list = `(${excludeIds.map((id) => `'${id}'`).join(",")})`;
        // Exclude already queued songs if possible
        // @ts-ignore PostgREST supports NOT.IN syntax
        query = query.not("id", "in", list);
      }

      const { data: more, error } = await query;
      if (error) throw error;

      if (more && more.length) {
        const newSongs = more.map((song) => ({
          id: song.id,
          title: song.title,
          artist: "Zamar Artists",
          duration: 240,
          url: song.audio_url,
          cover: zamarLogo,
        }));

        const toAppend = shuffleArrayLocal(newSongs);
        const newQueue = [...state.queue, ...toAppend];
        // Keep current song/index stable while extending the tail
        playQueue(newQueue, state.currentIndex);
        setQueueMode(true);
      }
    } catch (e) {
      console.error("Error topping up radio queue:", e);
    } finally {
      setToppingUp(false);
    }
  };

  // Watch playback position and keep queue topped up
  useEffect(() => {
    if (!state.isQueueMode) return;
    ensureQueueHasNext(5);
  }, [state.currentIndex, state.queue.length, state.isQueueMode]);

  const isPlaying = state.isPlaying && state.isQueueMode;
  const currentSong = state.currentSong;
  const queueLength = state.queue.length;
  const currentPosition = state.currentIndex + 1;
  
  // Helper to check if a category is currently playing
  const isCategoryPlaying = (category: string) => {
    console.log('🎵 Checking if category playing:', category, 'current:', currentCategory, 'isQueueMode:', state.isQueueMode, 'isPlaying:', state.isPlaying);
    return state.isQueueMode && state.isPlaying && currentCategory === category;
  };
  
  return (
    <div className={`space-y-4 ${className}`}>

      {/* Current Playing */}
      {state.isQueueMode && currentSong && (
        <Card className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-background shadow-md">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <Music className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 max-w-none">
                <h3 className="font-playfair font-bold text-2xl md:text-3xl leading-tight whitespace-normal hyphens-none line-clamp-3">{currentSong.title}</h3>
                <p className="text-muted-foreground text-sm">{currentSong.artist}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-xs rounded-full bg-background/60">
                    {currentCategory}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {currentPosition} of {queueLength}
                  </span>
                </div>
              </div>
              <TooltipProvider>
                <div className="flex items-center gap-1 bg-muted/40 border rounded-full p-1 shadow-sm flex-shrink-0 w-full sm:w-auto justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={previousSong} variant="ghost" size="sm" aria-label="Previous" className="h-8 w-8 p-0 rounded-full">
                        <SkipBack className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Previous</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={togglePlayPause} size="sm" aria-label={isPlaying ? 'Pause' : 'Play'} className="h-9 w-9 p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow">
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isPlaying ? 'Pause' : 'Play'}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={nextSong} variant="ghost" size="sm" aria-label="Next" className="h-8 w-8 p-0 rounded-full">
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Next</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={toggleShuffle} variant="ghost" size="sm" aria-label="Shuffle" className={`h-8 w-8 p-0 rounded-full ${state.isShuffling ? 'bg-primary/10 text-primary' : ''}`}>
                        <Shuffle className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{state.isShuffling ? 'Shuffle: On' : 'Shuffle'}</TooltipContent>
                  </Tooltip>

                  {isLocalhost && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={() => {
                            console.log('🧪 Manual test: simulating song ended event');
                            const audio = document.querySelector('audio');
                            if (audio) {
                              audio.dispatchEvent(new Event('ended'));
                            }
                          }} 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full text-orange-500"
                          aria-label="Next (dev)"
                        >
                          ⚡
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Next (dev)</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            </div>

            {/* Visualizer */}
            <div className="mt-4 rounded-xl border border-border/50 bg-card/40 overflow-hidden">
              <AudioVisualizer />
            </div>

            {/* Progress + Volume */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatTime(state.currentTime)}</span>
                <span>{formatTime(state.currentSong?.duration || 0)}</span>
              </div>
              <PlayerSlider
                variant="progress"
                value={[state.currentTime || 0]}
                max={Math.max(state.currentSong?.duration || 0, 1)}
                step={0.1}
                onValueChange={(v) => seekTo(v[0])}
              />
              <div className="flex items-center gap-3 pt-1">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <PlayerSlider
                  variant="volume"
                  value={[state.volume]}
                  max={1}
                  step={0.01}
                  onValueChange={(v) => setVolume(v[0])}
                  className="w-40"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Selection */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="all" className="text-sm">All Songs</TabsTrigger>
          <TabsTrigger value="genres" className="text-sm">By Genre</TabsTrigger>
          <TabsTrigger value="occasions" className="text-sm">By Occasion</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Radio className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">All Songs Radio</h3>
                   <p className="text-muted-foreground text-sm mb-4">
                     Play all available songs in continuous mode
                   </p>
                  <Button
                    onClick={playAllSongs}
                    disabled={loading}
                    className={`rounded-xl px-8 h-12 transition ${
                      isCategoryPlaying("All Songs") 
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/50 shadow"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {isCategoryPlaying("All Songs") ? (
                      <Pause className="w-5 h-5 mr-2" />
                    ) : (
                      <Play className="w-5 h-5 mr-2" />
                    )}
                    {isCategoryPlaying("All Songs") ? "Playing" : "Start All Songs Radio"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="genres" className="space-y-3 mt-4">
          <div className="space-y-3">
            {availableGenres.map((genre) => (
              <Card key={genre} className="bg-card/50 border-border/50 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{genre}</h3>
                       <p className="text-muted-foreground text-sm">
                         Genre Radio
                       </p>
                    </div>
                    <Button
                      onClick={() => playByCategory(genre, 'genre')}
                      disabled={loading}
                      className={`rounded-xl px-6 h-10 transition ${
                        isCategoryPlaying(genre)
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/50 shadow"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {isCategoryPlaying(genre) ? (
                        <Pause className="w-4 h-4 mr-2" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      {isCategoryPlaying(genre) ? "Playing" : "Play"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="occasions" className="space-y-3 mt-4">
          <div className="space-y-3">
            {availableOccasions.map((occasion) => (
              <Card key={occasion} className="bg-card/50 border-border/50 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{occasion}</h3>
                       <p className="text-muted-foreground text-sm">
                         Occasion Radio
                       </p>
                    </div>
                    <Button
                      onClick={() => playByCategory(occasion, 'occasion')}
                      disabled={loading}
                      className={`rounded-xl px-6 h-10 transition ${
                        isCategoryPlaying(occasion)
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/50 shadow"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {isCategoryPlaying(occasion) ? (
                        <Pause className="w-4 h-4 mr-2" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      {isCategoryPlaying(occasion) ? "Playing" : "Play"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Queue Info */}
      {state.isQueueMode && queueLength > 0 && (
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Radio Active</p>
                 <p className="text-xs text-muted-foreground">
                   {queueLength} songs • {state.isShuffling ? 'Shuffled' : 'In order'}
                 </p>
              </div>
              <Button
                onClick={stopRadio}
                variant="outline"
                size="sm"
                className="text-xs hover:bg-destructive hover:text-destructive-foreground"
              >
                Stop Radio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CategoryRadio;
