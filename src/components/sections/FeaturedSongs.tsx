
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNowPlaying } from "@/contexts/NowPlayingContext";
import { useTranslation } from "@/contexts/TranslationContext";

interface Song {
  id: string;
  title: string;
  genre: string;
  occasion: string;
  thumbnail_url: string;
  audio_url?: string;
  tags: string[];
}

const FeaturedSongs = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { playSong, togglePlayPause, state } = useNowPlaying();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchFeaturedSongs = async () => {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .eq('featured', true)
          .limit(12);
        
        if (error) throw error;
        
        // Use database songs only, no fallback to demo songs
        setSongs(data || []);
      } catch (error) {
        console.error('Error fetching featured songs:', error);
        setSongs([]); // Empty array if there's an error
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedSongs();
  }, []);

  const handlePlaySong = (song: Song) => {
    console.log('🎵 FeaturedSongs handlePlaySong called for:', song.title);
    
    // If same song is already current but not playing, just toggle play
    if (state.currentSong?.id === song.id && !state.isPlaying) {
      console.log('🎵 Same song, toggling play');
      togglePlayPause();
      return;
    }
    
    // Always play the song - don't check if it's current
    const songWithAudio = {
      id: song.id,
      title: song.title,
      artist: song.genre,
      duration: 180, // Default duration, will be updated when audio loads
      url: song.audio_url || "", // Use audio URL from database
      cover: "/lovable-uploads/06166d3e-4587-43fa-a895-e4ed180ce6b6.png" // Use new thumbnail for all songs
    };
    
    console.log('🎵 Calling playSong with URL:', songWithAudio.url);
    playSong(songWithAudio, [songWithAudio]);
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container-responsive">
          <h2 className="text-3xl font-playfair font-bold text-center text-foreground mb-12">
            {t('featured.title', 'Featured Songs')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="bg-card border-border animate-pulse">
                <div className="aspect-square bg-muted rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container-responsive">
        <h2 className="text-3xl font-playfair font-bold text-center text-foreground mb-12">
          {t('featured.title', 'Featured Songs')}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {songs.map((song) => (
            <Card key={song.id} className="group bg-card border-border hover:shadow-elegant transition-all duration-300 hover:scale-105 cursor-pointer"
                  onClick={() => handlePlaySong(song)}>
              <div className="relative aspect-square bg-muted rounded-t-lg overflow-hidden">
                <img 
                  src="/lovable-uploads/06166d3e-4587-43fa-a895-e4ed180ce6b6.png" 
                  alt={song.title}
                  className="w-full h-full object-contain p-4 bg-gradient-to-br from-amber-50 to-amber-100"
                />
                
                {/* Play/pause button overlay */}
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                  <Button 
                    size="icon" 
                    variant="secondary"
                    className="bg-white/70 hover:bg-white/90 w-10 h-10 rounded-full shadow-lg backdrop-blur-sm border border-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySong(song);
                    }}
                  >
                    {state.currentSong?.id === song.id && state.isPlaying ? (
                      <Pause className="h-5 w-5 text-black" />
                    ) : (
                      <Play className="h-5 w-5 text-black ml-0.5" />
                    )}
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-3">
                <h3 className="font-playfair font-semibold text-foreground mb-1 line-clamp-1 text-sm">
                  {song.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {song.genre} • {song.occasion}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {song.tags?.slice(0, 1).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-xs bg-primary/10 text-primary border-primary/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg" asChild>
            <a href="/songs">{t('featured.view_all', 'View All Songs')}</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSongs;
