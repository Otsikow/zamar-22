
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
  const { state, playQueue, togglePlayPause, nextSong, previousSong, toggleShuffle, setQueueMode, stopRadio } = useNowPlaying();
  const { toast } = useToast();
  
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableOccasions, setAvailableOccasions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>("");
  
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
        cover: song.thumbnail_url || undefined,
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
        cover: song.thumbnail_url || undefined,
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
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0 max-w-none">
                <h3 className="font-bold text-lg leading-tight break-words">{currentSong.title}</h3>
                <p className="text-muted-foreground text-sm">{currentSong.artist}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs bg-background/50">
                    {currentCategory}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {currentPosition} of {queueLength}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-1 flex-shrink-0 pt-1">
                <Button onClick={previousSong} variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button onClick={togglePlayPause} size="sm" className="h-8 w-8 p-0 bg-primary text-primary-foreground">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button onClick={nextSong} variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <SkipForward className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={toggleShuffle} 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Shuffle className={`w-4 h-4 ${state.isShuffling ? 'text-primary' : ''}`} />
                </Button>
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
                  className="h-8 w-8 p-0 text-orange-500"
                  title="Test next song (dev)"
                >
                  ⚡
                </Button>
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
                    className={`rounded-xl px-8 h-12 ${
                      isCategoryPlaying("All Songs") 
                        ? "bg-green-500 hover:bg-green-600 text-white" 
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
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
                      className={`rounded-xl px-6 h-10 ${
                        isCategoryPlaying(genre)
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
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
                      className={`rounded-xl px-6 h-10 ${
                        isCategoryPlaying(occasion)
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
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
