import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import zamarLogo from '@/assets/zamar-logo.png';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Play, Pause, Music2, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Footer from "@/components/sections/Footer";
import { useNowPlaying } from "@/contexts/NowPlayingContext";

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

const SongsLibrary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playSong, togglePlayPause, state } = useNowPlaying();
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedOccasion, setSelectedOccasion] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch songs from Supabase
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const { data, error } = await supabase
          .from("songs")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSongs(data || []);
        setFilteredSongs(data || []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load songs. Please try again.",
          variant: "destructive",
        });
        console.error("Error fetching songs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, [toast]);

  // Use only database songs
  const displaySongs = songs;

  // Filter songs based on search term and filters
  useEffect(() => {
    let filtered = displaySongs;

    // Search by title and tags
    if (searchTerm) {
      filtered = filtered.filter(song => 
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (song.tags && song.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    // Filter by genre
    if (selectedGenre !== "all") {
      filtered = filtered.filter(song => 
        song.genre?.toLowerCase() === selectedGenre.toLowerCase()
      );
    }

    // Filter by occasion
    if (selectedOccasion !== "all") {
      filtered = filtered.filter(song => 
        song.occasion?.toLowerCase() === selectedOccasion.toLowerCase()
      );
    }

    setFilteredSongs(filtered);
  }, [displaySongs, searchTerm, selectedGenre, selectedOccasion]);

  const handleSongClick = (songId: string) => {
    navigate(`/songs/${songId}`);
  };

  const handlePlaySong = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation(); // Prevent card click
    
    // Check if this song is currently playing
    const isCurrentSong = state.currentSong?.id === song.id;
    
    if (isCurrentSong) {
      // If same song, toggle play/pause
      togglePlayPause();
    } else {
      // Convert to NowPlaying format
      const nowPlayingSong = {
        id: song.id,
        title: song.title,
        artist: "Zamar Artists",
        duration: 180, // Mock duration
        url: song.audio_url || undefined,
        cover: song.thumbnail_url || zamarLogo,
      };
      
      // Create queue from all filtered songs  
      const queue = filteredSongs.map(s => ({
        id: s.id,
        title: s.title,
        artist: "Zamar Artists",
        duration: 180,
        url: s.audio_url || undefined,
        cover: s.thumbnail_url || zamarLogo,
      }));
      
      playSong(nowPlayingSong, queue);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGenre("all");
    setSelectedOccasion("all");
  };


  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6 flex items-center justify-center gap-3">
              <Music2 className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              Songs{" "}
              <span className="text-transparent bg-gradient-primary bg-clip-text">
                Library
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-inter">
              Discover our collection of faith-inspired music. Each song crafted with love, 
              purpose, and Christian values.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-gradient-card border border-border rounded-lg p-6 mb-8">
            <div className="flex flex-col space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4" />
                <Input
                  placeholder="Search by title or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border focus:border-primary/50"
                />
              </div>

              {/* Filter Toggle Button (Mobile) */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                
                {(searchTerm || selectedGenre !== "all" || selectedOccasion !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-primary border-primary/30 hover:bg-primary/10"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Filters */}
              <div className={`grid md:grid-cols-2 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    <SelectItem value="afrobeats">Afrobeats</SelectItem>
                    <SelectItem value="classical">Classical</SelectItem>
                    <SelectItem value="gospel">Gospel</SelectItem>
                    <SelectItem value="gospel-reggae">Gospel Reggae</SelectItem>
                    <SelectItem value="rnb">R&B</SelectItem>
                    <SelectItem value="rap">Rap</SelectItem>
                    <SelectItem value="reggae">Reggae</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedOccasion} onValueChange={setSelectedOccasion}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="All Occasions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Occasions</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="funeral">Funeral</SelectItem>
                    <SelectItem value="church">Church</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground font-inter">
              {isLoading ? "Loading..." : `${filteredSongs.length} song${filteredSongs.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* Songs Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="bg-gradient-card border-border animate-pulse">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-accent rounded-t-lg mb-4"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-accent rounded w-3/4"></div>
                      <div className="h-3 bg-accent rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSongs.length === 0 ? (
            <div className="text-center py-16">
              <Music2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-playfair text-foreground mb-2">No Songs Found</h3>
              <p className="text-muted-foreground font-inter mb-4">
                Try adjusting your search terms or filters.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSongs.map((song) => (
                <Card 
                  key={song.id} 
                  className="bg-gradient-card border-border hover:border-primary/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleSongClick(song.id)}
                >
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                     <div className="relative aspect-square rounded-t-lg overflow-hidden bg-accent">
                       <img 
                         src={song.thumbnail_url || zamarLogo} 
                         alt={song.title}
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                       />
                      
                      {/* Play/Pause Button Overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="rounded-full bg-primary/20 hover:bg-primary/30 border-primary/30"
                          onClick={(e) => handlePlaySong(e, song)}
                        >
                          {state.currentSong?.id === song.id && state.isPlaying ? (
                            <Pause className="w-5 h-5 text-primary fill-primary" />
                          ) : (
                            <Play className="w-5 h-5 text-primary fill-primary" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Song Info */}
                    <div className="p-4">
                      <h3 className="font-playfair font-semibold text-foreground mb-2 line-clamp-1">
                        {song.title}
                      </h3>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {song.genre && (
                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                            {song.genre}
                          </Badge>
                        )}
                        {song.occasion && (
                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                            {song.occasion}
                          </Badge>
                        )}
                        {song.tags?.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-border text-muted-foreground">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-xs text-muted-foreground font-inter">
                        Zamar Artists
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SongsLibrary;