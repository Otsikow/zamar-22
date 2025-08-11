import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Music2, Play, Eye, User, Calendar } from 'lucide-react';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
}

interface Song {
  id: string;
  title: string;
  thumbnail_url: string | null;
  audio_url: string | null;
  genre: string | null;
}

interface PlaylistSong {
  id: string;
  added_at: string;
  songs: Song;
}

const PublicPlaylistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPlaylistData();
    }
  }, [id]);

  const fetchPlaylistData = async () => {
    try {
      // Fetch public playlist details
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select(`
          id,
          name,
          description,
          created_at,
          user_id
        `)
        .eq('id', id)
        .eq('is_public', true)
        .single();

      if (playlistError) throw playlistError;

      // Get creator profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', playlistData.user_id)
        .single();

      setPlaylist({
        ...playlistData,
        profiles: profileData
      });

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

    } catch (error) {
      console.error('Error fetching playlist data:', error);
      toast({
        title: "Error loading playlist",
        description: "This playlist may be private or no longer available",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCreatorName = () => {
    if (playlist?.profiles?.first_name || playlist?.profiles?.last_name) {
      return `${playlist.profiles.first_name || ''} ${playlist.profiles.last_name || ''}`.trim();
    }
    return 'Anonymous';
  };

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
            <p className="text-muted-foreground">Playlist not found or not public</p>
            <Button asChild className="mt-4">
              <Link to="/playlists/public">Back to Public Playlists</Link>
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
            asChild
            className="text-primary hover:bg-primary/10"
          >
            <Link to="/playlists/public">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-heading text-primary">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-muted-foreground mt-1">{playlist.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="secondary">Public</Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>by {getCreatorName()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{new Date(playlist.created_at).toLocaleDateString()}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {playlistSongs.length} song{playlistSongs.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Playlist Songs */}
        {playlistSongs.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="p-8 text-center">
              <Music2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-heading text-foreground mb-2">No songs in this playlist</h3>
              <p className="text-muted-foreground">
                This playlist is empty
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {playlistSongs.map((playlistSong) => (
              <Card key={playlistSong.id} className="border-primary/20 shadow-lg hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[hsl(var(--thumbnail-bg))] flex-shrink-0">
                      <img 
                        src={playlistSong.songs.thumbnail_url || zamarLogo} 
                        alt={playlistSong.songs.title}
                        className="w-full h-full object-contain p-1 bg-transparent"
                      />
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-foreground text-lg mb-1 truncate">
                        {playlistSong.songs.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {playlistSong.songs.genre && (
                          <span>{playlistSong.songs.genre}</span>
                        )}
                        <span>
                          Added {new Date(playlistSong.added_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/songs/${playlistSong.songs.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Link>
                      </Button>
                      {playlistSong.songs.audio_url && (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/player/${playlistSong.songs.id}`}>
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </Link>
                        </Button>
                      )}
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

export default PublicPlaylistDetail;