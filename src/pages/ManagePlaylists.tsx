import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, Trash2, Eye, Plus } from 'lucide-react';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

const ManagePlaylists = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    is_public: false
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPlaylists();
    }
  }, [user]);

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast({
        title: "Error loading playlists",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setEditForm({
      name: playlist.name,
      description: playlist.description || '',
      is_public: playlist.is_public
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingPlaylist) return;

    try {
      const { error } = await supabase
        .from('playlists')
        .update({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          is_public: editForm.is_public
        })
        .eq('id', editingPlaylist.id);

      if (error) throw error;

      toast({
        title: "Playlist updated",
        description: `"${editForm.name}" has been updated successfully.`
      });

      setIsEditDialogOpen(false);
      setEditingPlaylist(null);
      fetchPlaylists();
    } catch (error) {
      console.error('Error updating playlist:', error);
      toast({
        title: "Error updating playlist",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (playlist: Playlist) => {
    if (!confirm(`Are you sure you want to delete "${playlist.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlist.id);

      if (error) throw error;

      toast({
        title: "Playlist deleted",
        description: `"${playlist.name}" has been deleted.`
      });

      fetchPlaylists();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast({
        title: "Error deleting playlist",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-primary">Loading playlists...</div>
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
            onClick={() => navigate(-1)}
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-heading text-primary">Manage Playlists</h1>
            <p className="text-muted-foreground mt-1">Edit, delete, or view your playlists</p>
          </div>
          <Button
            onClick={() => navigate('/playlist/create')}
            className="bg-primary text-background hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Playlist
          </Button>
        </div>

        {/* Playlists List */}
        {playlists.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't created any playlists yet.</p>
              <Button
                onClick={() => navigate('/playlist/create')}
                className="bg-primary text-background hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Playlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="border-primary/20 shadow-lg">
                <CardHeader className="border-b border-primary/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/playlists/${playlist.id}`)}>
                      <CardTitle className="text-primary hover:text-primary/80 transition-colors">{playlist.name}</CardTitle>
                      {playlist.description && (
                        <p className="text-muted-foreground mt-1">{playlist.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          playlist.is_public 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {playlist.is_public ? 'Public' : 'Private'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Created {new Date(playlist.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/playlists/${playlist.id}`)}
                        className="text-primary hover:bg-primary/10"
                        title="View playlist"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(playlist)}
                        className="text-primary hover:bg-primary/10"
                        title="Edit playlist"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(playlist)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Delete playlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">Edit Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Playlist Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="border-primary/30 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                className="border-primary/30 focus:border-primary"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="space-y-1">
                <Label htmlFor="edit-public">Make Public</Label>
                <p className="text-xs text-muted-foreground">
                  Allow others to discover and view this playlist
                </p>
              </div>
              <Switch
                id="edit-public"
                checked={editForm.is_public}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_public: checked }))}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                className="flex-1"
                disabled={!editForm.name.trim()}
              >
                Update Playlist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagePlaylists;