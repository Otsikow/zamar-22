import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Music2, Search, Plus, Trash2, Play, Eye } from 'lucide-react';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

interface Song {
  id: string;
  title: string;
  thumbnail_url: string | null;
  audio_url: string | null;
  genre: string | null;
  added_at?: string;
}

interface PlaylistSong {
  id: string;
  added_at: string;
  songs: Song;
}

const PlaylistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchPlaylistData();
    }
  }, [user, id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      navigate('/library', { replace: true });
    } else if (!user) {
      setLoading(false);
      navigate('/auth', { replace: true });
    }
  }, [user, id, navigate]);

  const fetchPlaylistData = async () => {
    try {
      // Fetch playlist details
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (playlistError) throw playlistError;
      setPlaylist(playlistData);

      // Fetch playlist songs
      const { data: songsData, error: songsError } = await supabase
        .from('playlist_songs')
        .select(`
          id,
          added_at,
          songs (
            id,
            title,
            thumbnail_url,
            audio_url,
            genre
          )
        `)
        .eq('playlist_id', id)
        .order('added_at', { ascending: false });

      if (songsError) throw songsError;
      setPlaylistSongs(songsData || []);

      // Fetch all available songs for adding
      const { data: allSongsData, error: allSongsError } = await supabase
        .from('songs')
        .select('id, title, thumbnail_url, audio_url, genre')
        .order('title');

      if (allSongsError) throw allSongsError;
      setAllSongs(allSongsData || []);

    } catch (error) {
      console.error('Error fetching playlist data:', error);
      toast({
        title: "Error loading playlist",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addSongToPlaylist = async (songId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: id,
          song_id: songId
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Song already in playlist",
            description: "This song is already in your playlist",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Song added",
        description: "Song has been added to your playlist"
      });

      fetchPlaylistData();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      toast({
        title: "Error adding song",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const removeSongFromPlaylist = async (playlistSongId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('id', playlistSongId);

      if (error) throw error;

      toast({
        title: "Song removed",
        description: "Song has been removed from your playlist"
      });

      fetchPlaylistData();
    } catch (error) {
      console.error('Error removing song from playlist:', error);
      toast({
        title: "Error removing song",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const filteredSongs = allSongs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase());
    const notInPlaylist = !playlistSongs.some(ps => ps.songs.id === song.id);
    return matchesSearch && notInPlaylist;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-primary">Loading playlist...</div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Playlist not found</p>
            <Button onClick={() => navigate('/library')} className="mt-4">
              Back to Library
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/manage-playlists')}
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-heading text-primary">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-muted-foreground mt-1">{playlist.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className={`text-xs px-2 py-1 rounded ${
                playlist.is_public 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {playlist.is_public ? 'Public' : 'Private'}
              </span>
              <span className="text-sm text-muted-foreground">
                {playlistSongs.length} song{playlistSongs.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-background hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Songs
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-primary">Add Songs to Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 flex-1 overflow-hidden">
                <Input
                  placeholder="Search songs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-primary/30 focus:border-primary"
                />
                <div className="overflow-y-auto max-h-96">
                  {filteredSongs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {searchQuery ? 'No songs found matching your search' : 'No more songs available to add'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredSongs.map((song) => (
                        <Card key={song.id} className="border-primary/20">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                               {song.thumbnail_url ? (
                                 <img 
                                   src={song.thumbnail_url} 
                                   alt={song.title}
                                   className="w-full h-full object-contain p-1 bg-transparent"
                                 />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center">
                                   <Music2 className="w-4 h-4 text-primary" />
                                 </div>
                               )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-foreground truncate">{song.title}</h3>
                                {song.genre && (
                                  <p className="text-sm text-muted-foreground">{song.genre}</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addSongToPlaylist(song.id)}
                              >
                                Add
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Playlist Songs */}
        {playlistSongs.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="p-8 text-center">
              <Music2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-heading text-foreground mb-2">No songs yet</h3>
              <p className="text-muted-foreground mb-6">
                Start building your playlist by adding some songs
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-primary text-background hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Song
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {playlistSongs.map((playlistSong) => (
              <Card key={playlistSong.id} className="border-primary/20 shadow-lg hover:border-primary/30 transition-colors">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-[hsl(var(--thumbnail-bg))] flex-shrink-0">
                <AspectRatio ratio={1}>
                  {playlistSong.songs.thumbnail_url ? (
                    <img
                      src={playlistSong.songs.thumbnail_url}
                      alt={playlistSong.songs.title}
                      className="w-full h-full object-contain p-1 bg-transparent"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music2 className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </AspectRatio>
            </div>

            {/* Song Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-foreground text-lg mb-1 truncate">
                {playlistSong.songs.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {playlistSong.songs.genre && (
                  <span className="capitalize">{playlistSong.songs.genre}</span>
                )}
                <span>
                  Added {new Date(playlistSong.added_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-full sm:w-auto sm:justify-end gap-2 mt-2 sm:mt-0">
              <Button size="sm" variant="outline" asChild>
                <Link to={`/songs/${playlistSong.songs.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">View</span>
                </Link>
              </Button>
              {playlistSong.songs.audio_url && (
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/player/${playlistSong.songs.id}`}>
                    <Play className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Play</span>
                  </Link>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeSongFromPlaylist(playlistSong.id)}
                className="text-destructive hover:bg-destructive/10"
                aria-label="Remove from playlist"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;