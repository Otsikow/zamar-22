import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Music2, Search, Calendar, User, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PublicPlaylist {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  song_count?: number;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
}

const PublicPlaylists = () => {
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<PublicPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPublicPlaylists();
  }, []);

  const fetchPublicPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          id,
          name,
          description,
          created_at,
          user_id
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get song counts and profile data for each playlist
      const playlistsWithCounts = await Promise.all(
        (data || []).map(async (playlist) => {
          const { count } = await supabase
            .from('playlist_songs')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', playlist.id);

          // Get creator profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', playlist.user_id)
            .single();

          return {
            ...playlist,
            song_count: count || 0,
            profiles: profileData
          };
        })
      );

      setPlaylists(playlistsWithCounts);
    } catch (error) {
      console.error('Error fetching public playlists:', error);
      toast({
        title: "Error loading playlists",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (playlist.description && playlist.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCreatorName = (playlist: PublicPlaylist) => {
    if (playlist.profiles?.first_name || playlist.profiles?.last_name) {
      return `${playlist.profiles.first_name || ''} ${playlist.profiles.last_name || ''}`.trim();
    }
    return 'Anonymous';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-primary">Loading public playlists...</div>
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
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-heading text-primary">Public Playlists</h1>
            <p className="text-muted-foreground mt-1">
              Discover playlists shared by the community
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-primary/30 focus:border-primary"
            />
          </div>
        </div>

        {/* Playlists Grid */}
        {filteredPlaylists.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="p-8 text-center">
              <Music2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-heading text-foreground mb-2">
                {searchQuery ? 'No playlists found' : 'No public playlists yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Be the first to create and share a public playlist!'
                }
              </p>
              {!searchQuery && (
                <Button asChild className="mt-4">
                  <Link to="/playlist/create">Create Playlist</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlaylists.map((playlist) => (
              <Card 
                key={playlist.id} 
                className="border-primary/20 shadow-lg hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
              >
                <CardHeader>
                  <CardTitle className="text-lg font-heading text-foreground mb-2 flex items-center gap-2">
                    📋 {playlist.name}
                  </CardTitle>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Music2 className="w-4 h-4" />
                        <span>{playlist.song_count} songs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(playlist.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Creator */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">by</span>
                      <span className="font-medium text-foreground">{getCreatorName(playlist)}</span>
                    </div>

                    {/* Badge */}
                    <Badge variant="secondary" className="w-fit">
                      Public
                    </Badge>

                    {/* View Button */}
                    <Button 
                      asChild 
                      className="w-full bg-primary text-background hover:bg-primary/90"
                      size="sm"
                    >
                      <Link to={`/playlists/${playlist.id}/public`}>
                        <Play className="w-4 h-4 mr-2" />
                        View Playlist
                      </Link>
                    </Button>
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

export default PublicPlaylists;