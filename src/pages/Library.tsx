import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Music2, Clock, CheckCircle, Loader, XCircle, Calendar, Library as LibraryIcon, Gift, ClipboardList, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation, getLocaleForLanguage } from "@/contexts/TranslationContext";
import Footer from "@/components/sections/Footer";
import { useNowPlaying } from "@/contexts/NowPlayingContext";
const zamarLogo = "/lovable-uploads/78355eae-a8bc-4167-9f39-fec08c253f60.png";
import AdSlot from "@/components/ads/AdSlot";

interface Purchase {
  id: string;
  song_id: string;
  amount: number;
  created_at: string;
  songs: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    audio_url: string | null;
  };
}

interface CustomRequest {
  id: string;
  occasion: string;
  style_genre: string;
  tier: string;
  status: string;
  created_at: string;
  key_message: string;
}

interface CustomSong {
  id: string;
  song_title: string;
  audio_url: string;
  lyrics_url: string | null;
  status: string;
  created_at: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

interface Favourite {
  created_at: string;
  songs: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    audio_url: string | null;
  } | null;
}

const Library = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, currentLanguage } = useTranslation();
  const locale = getLocaleForLanguage(currentLanguage);
  const [user, setUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [customSongs, setCustomSongs] = useState<CustomSong[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("songs");
  const { playQueue } = useNowPlaying();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: t('auth.authRequired', 'Authentication Required'),
          description: t('auth.loginToViewLibrary', 'Please log in to view your library.'),
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      setUser(session.user);
      
      // Fetch user's purchases, requests, custom songs, playlists, and favourites
      await Promise.all([
        fetchPurchases(session.user.id),
        fetchRequests(session.user.id),
        fetchCustomSongs(session.user.id),
        fetchPlaylists(session.user.id),
        fetchFavourites(session.user.id),
      ]);

      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  // Refresh favourites when toggled elsewhere
  useEffect(() => {
    const handler = () => {
      if (user?.id) fetchFavourites(user.id);
    };
    window.addEventListener('favourites:changed', handler as EventListener);
    return () => window.removeEventListener('favourites:changed', handler as EventListener);
  }, [user]);

  const fetchPurchases = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          id,
          song_id,
          amount,
          created_at,
          songs (
            id,
            title,
            thumbnail_url,
            audio_url
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error: any) {
      console.error("Error fetching purchases:", error);
    }
  };

  const fetchRequests = async (userId: string) => {
    try {
      console.log("Fetching requests for user:", userId);
      
      const { data, error } = await supabase
        .from("custom_song_requests")
        .select("id, occasion, style_genre, tier, status, created_at, key_message")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      console.log("Requests query result:", { data, error });

      if (error) {
        console.error("Database error:", error);
        toast({
          title: t('errors.fetchRequestsTitle', 'Error fetching requests'),
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      console.log("Setting requests:", data);
      setRequests(data || []);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      toast({
        title: t('errors.general', 'Error'),
        description: t('errors.fetchRequestsDescription', 'Failed to load your custom song requests. Please try refreshing the page.'),
        variant: "destructive",
      });
    }
  };

  const fetchCustomSongs = async (userId: string) => {
    try {
      console.log("Fetching custom songs for user:", userId);
      
      const { data, error } = await supabase
        .from("custom_songs")
        .select("id, song_title, audio_url, lyrics_url, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      console.log("Custom songs query result:", { data, error });

      if (error) {
        console.error("Database error:", error);
        toast({
          title: t('errors.fetchCustomSongsTitle', 'Error fetching custom songs'),
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      console.log("Setting custom songs:", data);
      setCustomSongs(data || []);
    } catch (error: any) {
      console.error("Error fetching custom songs:", error);
      toast({
        title: t('errors.general', 'Error'),
        description: t('errors.fetchCustomSongsDescription', 'Failed to load your custom songs. Please try refreshing the page.'),
        variant: "destructive",
      });
    }
  };

  const fetchPlaylists = async (userId: string) => {
    try {
      console.log("Fetching playlists for user:", userId);
      
      const { data, error } = await supabase
        .from("playlists")
        .select("id, name, description, is_public, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      console.log("Playlists query result:", { data, error });

      if (error) {
        console.error("Database error:", error);
        toast({
          title: t('errors.fetchPlaylistsTitle', 'Error fetching playlists'),
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      console.log("Setting playlists:", data);
      setPlaylists(data || []);
    } catch (error: any) {
      console.error("Error fetching playlists:", error);
      toast({
        title: t('errors.general', 'Error'),
        description: t('errors.fetchPlaylistsDescription', 'Failed to load your playlists. Please try refreshing the page.'),
        variant: "destructive",
      });
    }
  };

  const fetchFavourites = async (userId: string) => {
    try {
      // Cast to any to avoid type errors until Supabase types are refreshed
      const { data, error } = await (supabase.from as any)("user_favourites")
        .select(`
          created_at,
          songs:song_id (
            id,
            title,
            thumbnail_url,
            audio_url
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setFavourites((data as Favourite[]) || []);
    } catch (error: any) {
      console.error("Error fetching favourites:", error);
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Loader className="w-4 h-4 text-yellow-500 animate-spin" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      in_progress: "outline", 
      completed: "default",
      cancelled: "destructive"
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: "numeric",
      month: "short", 
      year: "numeric"
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('library.loading', 'Loading your library...')}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6 flex items-center justify-center gap-3">
              <LibraryIcon className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              {t('library.title', 'My Library').split(' ')[0]}{" "}
              <span className="text-transparent bg-gradient-primary bg-clip-text">
                {t('library.title', 'My Library').split(' ')[1] || 'Library'}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-inter">
              {t('library.subtitle', 'Track your custom song requests and access your completed songs.')}
            </p>
          </div>

          {/* Sidebar ad for desktop */}
          <div className="hidden lg:block w-full">
            <div className="max-w-[300px] ml-auto mb-6">
              <AdSlot placement="sidebar_300x250" />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList aria-label="Library sections">
              <TabsTrigger value="songs">
                <Music2 className="w-4 h-4" />
                {t('library.tabs.mySongs', 'My Songs')} ({purchases.length})
              </TabsTrigger>
              <TabsTrigger value="favourites">
                <Heart className="w-4 h-4" />
                {t('library.tabs.favourites', 'Favourites')} ({favourites.length})
              </TabsTrigger>
              <TabsTrigger value="playlists">
                <ClipboardList className="w-4 h-4" />
                {t('library.tabs.playlists', 'Playlists')} ({playlists.length})
              </TabsTrigger>
              <TabsTrigger value="custom">
                <Gift className="w-4 h-4" />
                {t('library.tabs.customSongs', 'Custom Songs')} ({customSongs.length})
              </TabsTrigger>
              <TabsTrigger value="requests">
                <Calendar className="w-4 h-4" />
                {t('library.tabs.myRequests', 'My Requests')} ({requests.length})
              </TabsTrigger>
            </TabsList>


            {/* My Songs Tab */}
            <TabsContent value="songs" className="mt-6">
              {purchases.length === 0 ? (
                <Card className="bg-gradient-card border-border">
                  <CardContent className="p-8 text-center">
                    <Music2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-playfair text-foreground mb-2">
                      {t('library.noSongsYet', 'No Songs Yet')}
                    </h3>
                    <p className="text-muted-foreground font-inter mb-6">
                      {t('library.noSongsDescription', 'You haven\'t purchased any songs yet. Start by exploring our library or requesting a custom song.')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button asChild>
                        <Link to="/songs">{t('library.browseSongs', 'Browse Songs')}</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/request-song">{t('library.requestCustomSong', 'Request Custom Song')}</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <Card key={purchase.id} className="bg-gradient-card border-border hover:border-primary/30 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          {/* Thumbnail */}
                           <div className="w-16 h-16 rounded-lg overflow-hidden bg-[hsl(var(--thumbnail-bg))] flex-shrink-0">
                             <img 
                               src={zamarLogo} 
                               alt={purchase.songs.title}
                               className="w-full h-full object-contain p-1 bg-transparent"
                             />
                          </div>

                           {/* Song Info */}
                           <div className="flex-1 min-w-0 pr-4">
                             <h3 className="font-playfair font-semibold text-foreground text-lg mb-1 break-words">
                               {purchase.songs.title}
                             </h3>
                             <p className="text-sm text-muted-foreground flex items-center gap-2">
                               <Calendar className="w-4 h-4 flex-shrink-0" />
                               <span>{t('library.purchasedOn', 'Purchased on')} {formatDate(purchase.created_at)}</span>
                             </p>
                           </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/songs/${purchase.songs.id}`}>
                                {t('library.view', 'View')}
                              </Link>
                            </Button>
                            {purchase.songs.audio_url && (
                              <Button size="sm" asChild>
                                <a
                                  href={purchase.songs.audio_url ?? "#"}
                                  download={`${purchase.songs.title}.mp3`}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  {t('library.download', 'Download')}
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Favourites Tab */}
            <TabsContent value="favourites" className="mt-6">
              {favourites.length === 0 ? (
                <Card className="bg-gradient-card border-border">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-400 to-amber-400 rounded-full flex items-center justify-center">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-playfair text-foreground mb-2">
                      {t('library.noFavourites', 'No favourites yet.')}
                    </h3>
                    <p className="text-muted-foreground font-inter">
                      {t('library.noFavouritesDescription', 'Tap the heart on any song to save it here.')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => {
                      const queue = favourites
                        .map(f => f.songs)
                        .filter((s): s is NonNullable<Favourite['songs']> => !!s && !!s.audio_url)
                        .map(s => ({
                          id: s.id,
                          title: s.title,
                          artist: 'Zamar',
                          duration: 0,
                          url: s.audio_url || undefined,
                          cover: zamarLogo,
                        }));
                      if (queue.length > 0) playQueue(queue, 0);
                    }}>
                      {t('library.playAll', 'Play All')}
                    </Button>
                  </div>
                  {favourites.map((fav, idx) => (
                    <Card key={idx} className="bg-gradient-card border-border hover:border-primary/30 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-[hsl(var(--thumbnail-bg))] flex-shrink-0">
                            <img src={zamarLogo} alt={fav.songs?.title || 'Song'} className="w-full h-full object-contain p-1 bg-transparent" />
                          </div>
                           <div className="flex-1 min-w-0 pr-4">
                             <h3 className="font-playfair font-semibold text-foreground text-lg mb-1 break-words">
                               {fav.songs?.title || t('library.unknownSong', 'Unknown Song')}
                             </h3>
                             <p className="text-sm text-muted-foreground flex items-center gap-2">
                               <Calendar className="w-4 h-4 flex-shrink-0" />
                               <span>{t('library.savedOn', 'Saved on')} {formatDate(fav.created_at)}</span>
                             </p>
                           </div>
                          <div className="flex gap-2">
                            {fav.songs?.id && (
                              <Button size="sm" variant="outline" asChild>
                                <Link to={`/songs/${fav.songs.id}`}>
                                  {t('library.view', 'View')}
                                </Link>
                              </Button>
                            )}
                            {fav.songs?.audio_url && (
                               <Button size="sm" onClick={() => {
                                playQueue([{ id: fav.songs!.id, title: fav.songs!.title, artist: 'Zamar', duration: 0, url: fav.songs!.audio_url || undefined, cover: zamarLogo }], 0);
                               }}>
                                {t('library.play', 'Play')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Playlists Tab */}
            <TabsContent value="playlists" className="mt-6">
              {playlists.length === 0 ? (
                <Card className="bg-gradient-card border-border">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                      <Music2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-playfair text-foreground mb-2">
                      {t('library.noPlaylists', 'No playlists yet.')}
                    </h3>
                    <p className="text-muted-foreground font-inter mb-6">
                      {t('library.noPlaylistsDescription', 'Create your first playlist to organize your favorite songs.')}
                    </p>
                    <div className="flex justify-center">
                      <Button asChild>
                        <Link to="/manage-playlists">{t('library.managePlaylists', 'Manage Playlists')}</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {playlists.map((playlist) => (
                    <Card 
                      key={playlist.id} 
                      className="bg-gradient-card border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg cursor-pointer"
                      onClick={() => navigate(`/playlists/${playlist.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-playfair font-bold text-foreground mb-2 flex items-center gap-2">
                              📋 {playlist.name}
                            </CardTitle>
                            {playlist.description && (
                              <p className="text-muted-foreground text-sm mb-2">{playlist.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                playlist.is_public 
                                  ? 'bg-primary/20 text-primary' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {playlist.is_public ? t('library.public', 'Public') : t('library.private', 'Private')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(playlist.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Custom Songs Tab */}
            <TabsContent value="custom" className="mt-6">
              {customSongs.length === 0 ? (
                <Card className="bg-gradient-card border-border">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Music2 className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-xl font-playfair text-foreground mb-2">
                      {t('library.noCustomSongs', 'No custom songs yet.')}
                    </h3>
                    <p className="text-muted-foreground font-inter mb-6">
                      {t('library.noCustomSongsDescription', 'Request your own song and see it here when ready.')}
                    </p>
                    <Button asChild className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-black">
                      <Link to="/request-song">{t('library.requestCustomSong', 'Request Custom Song')}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {customSongs.map((song) => (
                    <Card 
                      key={song.id} 
                      className={`bg-gradient-card border transition-all duration-300 hover:shadow-lg ${
                        song.status === 'delivered' 
                          ? 'border-amber-400/50 shadow-amber-400/20 shadow-lg bg-gradient-to-br from-amber-50/5 to-orange-50/5' 
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-playfair font-bold text-foreground mb-2 flex items-center gap-2">
                              🎁 {song.song_title}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={song.status === 'delivered' ? 'default' : 'secondary'}
                                className={song.status === 'delivered' 
                                  ? 'bg-amber-400/20 text-amber-700 border-amber-400/30' 
                                  : 'bg-blue-100 text-blue-700 border-blue-200'
                                }
                              >
                                {song.status === 'delivered' ? `✨ ${t('library.delivered', 'Delivered')}` : song.status === 'created' ? `🎵 ${t('library.created', 'Created')}` : `⏳ ${t('library.pending', 'Pending')}`}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Audio Player */}
                        {song.audio_url && (
                          <div className="bg-accent/30 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                                <Music2 className="w-5 h-5 text-white" />
                              </div>
                              <span className="font-medium text-foreground">{t('library.yourCustomSong', 'Your Custom Song')}</span>
                            </div>
                            <audio 
                              controls 
                              className="w-full h-10"
                              style={{
                                filter: 'sepia(20%) saturate(70%) hue-rotate(35deg) brightness(1.1)',
                              }}
                            >
                              <source src={song.audio_url} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {song.lyrics_url && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              asChild
                              className="flex-1 min-w-0"
                            >
                              <a 
                                href={song.lyrics_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                download
                              >
                                <Download className="w-4 h-4 mr-2" />
                                📄 {t('library.downloadLyrics', 'Download Lyrics')}
                              </a>
                            </Button>
                          )}
                          
                          {song.audio_url && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              asChild
                              className="flex-1 min-w-0"
                            >
                              <a 
                                href={song.audio_url} 
                                download={`${song.song_title}.mp3`}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                {t('library.download', 'Download')} Song
                              </a>
                            </Button>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(song.created_at)}
                          </span>
                          {song.status === 'delivered' && (
                            <span className="text-amber-600 font-medium">✨ Ready to enjoy!</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* My Requests Tab */}
            <TabsContent value="requests" className="mt-6">
              {requests.length === 0 ? (
                <Card className="bg-gradient-card border-border">
                  <CardContent className="p-8 text-center">
                    <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-playfair text-foreground mb-2">
                      {t('library.noRequestsYet', 'No requests yet')}
                    </h3>
                    <p className="text-muted-foreground font-inter mb-6">
                      {t('library.noRequestsDescription', 'You haven\'t made any custom song requests yet. Create your first request to get started.')}
                    </p>
                    <Button asChild>
                      <Link to="/request-song">{t('library.requestCustomSong', 'Request Custom Song')}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <Card key={request.id} className="bg-gradient-card border-border hover:border-primary/30 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                             <h3 className="font-playfair font-semibold text-foreground text-lg">
                                {request.occasion} Song
                              </h3>
                              {getStatusIcon(request.status)}
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">{t('library.genre', 'Genre')}:</span> {request.style_genre}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">{t('library.tier', 'Tier')}:</span> {request.tier}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                <span className="font-medium">Message:</span> {request.key_message}
                              </p>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {t('library.requestedOn', 'Requested on')} {formatDate(request.created_at)}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Library;