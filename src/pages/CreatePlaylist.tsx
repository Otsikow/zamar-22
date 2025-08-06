import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus } from 'lucide-react';

const CreatePlaylist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a playlist",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Playlist name required",
        description: "Please enter a name for your playlist",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('playlists')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_public: formData.is_public,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Playlist created!",
        description: `"${formData.name}" has been created successfully.`
      });

      navigate('/library');
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: "Error creating playlist",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
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
          <div>
            <h1 className="text-3xl font-heading text-primary">Create Playlist</h1>
            <p className="text-muted-foreground mt-1">Build your custom song collection</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Plus className="h-5 w-5" />
              New Playlist
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Playlist Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Playlist Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Sunday Worship, Wedding Songs..."
                  className="border-primary/30 focus:border-primary"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for your playlist..."
                  className="border-primary/30 focus:border-primary min-h-[80px]"
                  rows={3}
                />
              </div>

              {/* Public Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="space-y-1">
                  <Label htmlFor="is_public" className="text-sm font-medium">
                    Make Public
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow others to discover and view this playlist
                  </p>
                </div>
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || !formData.name.trim()}
                >
                  {loading ? "Creating..." : "Create Playlist"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePlaylist;