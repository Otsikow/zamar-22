import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Music2, Play, Eye, User, Calendar, Heart, MessageCircle, PlayCircle, Send, Trash2 } from 'lucide-react';
import { useNowPlaying } from '@/contexts/NowPlayingContext';
const zamarLogo = "/lovable-uploads/78355eae-a8bc-4167-9f39-fec08c253f60.png";

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

interface PlaylistComment {
  id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const PublicPlaylistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { playQueue } = useNowPlaying();
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);
  const [comments, setComments] = useState<PlaylistComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    checkUser();
    if (id) {
      fetchPlaylistData();
      fetchComments();
      fetchLikesData();
    }
  }, [id]);

  useEffect(() => {
    if (id && user !== undefined) {
      fetchLikesData();
    }
  }, [user, id]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

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

  const fetchLikesData = async () => {
    if (!id) return;
    
    try {
      // Get total likes count
      const { count } = await supabase
        .from('playlist_likes')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', id);
      
      setLikesCount(count || 0);

      // Check if current user has liked this playlist
      if (user) {
        const { data } = await supabase
          .from('playlist_likes')
          .select('id')
          .eq('playlist_id', id)
          .eq('user_id', user.id)
          .single();
        
        setIsLiked(!!data);
      }
    } catch (error) {
      console.error('Error fetching likes data:', error);
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    
    try {
      // First get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('playlist_comments')
        .select('id, comment, created_at, updated_at, user_id')
        .eq('playlist_id', id)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Then get profile data for each comment
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', comment.user_id)
            .single();

          return {
            ...comment,
            profiles: profileData
          };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to like playlists",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('playlist_likes')
          .delete()
          .eq('playlist_id', id)
          .eq('user_id', user.id);
        
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        await supabase
          .from('playlist_likes')
          .insert({
            playlist_id: id,
            user_id: user.id
          });
        
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to comment",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('playlist_comments')
        .insert({
          playlist_id: id,
          user_id: user.id,
          comment: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully"
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments();
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed"
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    }
  };

  const handlePlayAll = () => {
    const playableSongs = playlistSongs
      .filter(ps => ps.songs.audio_url)
      .map(ps => ({
        id: ps.songs.id,
        title: ps.songs.title,
        artist: 'Zamar',
        duration: 0,
        url: ps.songs.audio_url!,
        cover: zamarLogo,
      }));

    if (playableSongs.length > 0) {
      playQueue(playableSongs, 0);
      toast({
        title: "Playing playlist",
        description: `Started playing ${playableSongs.length} songs`
      });
    } else {
      toast({
        title: "No playable songs",
        description: "This playlist doesn't have any audio files",
        variant: "destructive"
      });
    }
  };

  const getCreatorName = () => {
    if (playlist?.profiles?.first_name || playlist?.profiles?.last_name) {
      return `${playlist.profiles.first_name || ''} ${playlist.profiles.last_name || ''}`.trim();
    }
    return 'Anonymous';
  };

  const getCommentorName = (comment: PlaylistComment) => {
    if (comment.profiles?.first_name || comment.profiles?.last_name) {
      return `${comment.profiles.first_name || ''} ${comment.profiles.last_name || ''}`.trim();
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
            <h1 className="text-3xl font-heading text-brand-gold">{playlist.name}</h1>
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          {playlistSongs.length > 0 && (
            <Button onClick={handlePlayAll} className="gap-2">
              <PlayCircle className="w-5 h-5" />
              Play All ({playlistSongs.filter(ps => ps.songs.audio_url).length} songs)
            </Button>
          )}
          <Button 
            variant={isLiked ? "default" : "outline"} 
            onClick={handleLike}
            className="gap-2"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            {isLiked ? 'Liked' : 'Like'} ({likesCount})
          </Button>
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
                        src={zamarLogo} 
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

        {/* Comments Section */}
        <div className="mt-12">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Comment */}
              {user ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submittingComment}
                      className="gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-muted-foreground">
                      <Link to="/auth" className="text-primary hover:underline">
                        Log in
                      </Link>{' '}
                      to leave a comment
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Comments List */}
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.id} className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {getCommentorName(comment)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {user?.id === comment.user_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-foreground whitespace-pre-wrap">{comment.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicPlaylistDetail;