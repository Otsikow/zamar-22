import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Music, AlertTriangle, Lock } from 'lucide-react';
import UserSearchSelect from '@/components/admin/UserSearchSelect';
interface CustomSongRequest {
  id: string;
  occasion: string;
  style_genre: string;
  key_message: string;
  tier: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}


const CustomSongUpload = () => {
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [recentSongs, setRecentSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    userId: '',
    songTitle: '',
    audioFile: null as File | null,
    lyricsFile: null as File | null,
    status: 'created' as 'pending' | 'created' | 'delivered',
  });

  useEffect(() => {
    fetchRecentSongs();
  }, []);

  const fetchRecentSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_songs')
        .select(`
          *,
          profiles!inner(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentSongs(data || []);
    } catch (error) {
      console.error('Error fetching recent songs:', error);
    }
  };


  const handleFileUpload = async (file: File, bucket: string): Promise<string | null> => {
    if (!file) return null;

    console.log(`Attempting to upload ${file.name} to bucket: ${bucket}`);
    
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      console.error(`Storage upload error for ${bucket}:`, error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log(`Successfully uploaded to: ${publicUrl}`);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast({
        title: "Error",
        description: "Admin access required to upload songs",
        variant: "destructive",
      });
      return;
    }

    if (!uploadForm.userId || !uploadForm.songTitle || !uploadForm.audioFile) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Starting upload process...');
      
      // Upload files
      const audioUrl = await handleFileUpload(uploadForm.audioFile, 'songs');
      const lyricsUrl = uploadForm.lyricsFile ? await handleFileUpload(uploadForm.lyricsFile, 'lyrics') : null;

      // Create custom song record
      const { error } = await supabase
        .from('custom_songs')
        .insert({
          user_id: uploadForm.userId,
          song_title: uploadForm.songTitle,
          audio_url: audioUrl,
          lyrics_url: lyricsUrl,
          status: uploadForm.status
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Custom song uploaded and delivered to user's library!",
      });

      // Reset form
      setUploadForm({
        userId: '',
        songTitle: '',
        audioFile: null,
        lyricsFile: null,
        status: 'created',
      });

      // Refresh recent songs
      fetchRecentSongs();

    } catch (error: any) {
      console.error('Error uploading custom song:', error);
      
      let errorMessage = "Failed to upload custom song";
      if (error.message) {
        errorMessage += ": " + error.message;
      }
      
      // Provide specific guidance for common errors
      if (error.message && error.message.includes('new row violates row-level security policy')) {
        errorMessage = "Upload failed: Admin permissions required. Please ensure you're logged in as an admin user.";
      } else if (error.message && error.message.includes('bucket')) {
        errorMessage = "Upload failed: Storage bucket access denied. Contact system administrator.";
      }

      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending" },
      created: { variant: "default" as const, label: "Created" },
      delivered: { variant: "default" as const, label: "Delivered" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (adminLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Checking admin permissions...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Admin access required to upload custom songs. Please contact an administrator for access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Custom Song for User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Select User */}
            <div>
              <Label htmlFor="userId">Select User *</Label>
              <UserSearchSelect
                value={uploadForm.userId}
                onChange={(id) => setUploadForm(prev => ({ ...prev, userId: id }))}
                placeholder="Search by name or email"
              />
            </div>

            {/* Song Title */}
            <div>
              <Label htmlFor="songTitle">Song Title *</Label>
              <Input
                id="songTitle"
                value={uploadForm.songTitle}
                onChange={(e) => setUploadForm(prev => ({ ...prev, songTitle: e.target.value }))}
                placeholder="Enter custom song title"
                required
              />
            </div>

            {/* Song Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={uploadForm.status} 
                onValueChange={(value: 'pending' | 'created' | 'delivered') => setUploadForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Audio File */}
            <div>
              <Label htmlFor="audioFile">Audio File (MP3) *</Label>
              <Input
                id="audioFile"
                type="file"
                accept="audio/mp3,audio/mpeg"
                onChange={(e) => setUploadForm(prev => ({ ...prev, audioFile: e.target.files?.[0] || null }))}
                required
              />
            </div>

            {/* Lyrics File */}
            <div>
              <Label htmlFor="lyricsFile">Lyrics File (PDF/TXT - Optional)</Label>
              <Input
                id="lyricsFile"
                type="file"
                accept="application/pdf,.txt"
                onChange={(e) => setUploadForm(prev => ({ ...prev, lyricsFile: e.target.files?.[0] || null }))}
              />
            </div>

            <Button type="submit" disabled={loading || !isAdmin} className="w-full">
              {loading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Music className="w-4 h-4 mr-2" />
                  Upload & Deliver Custom Song
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Custom Songs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Recent Custom Songs (Latest 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSongs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Song Title</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSongs.map((song) => (
                  <TableRow key={song.id}>
                    <TableCell className="font-medium">{song.song_title}</TableCell>
                    <TableCell>
                      {song.profiles?.first_name} {song.profiles?.last_name}
                      <br />
                      <span className="text-sm text-muted-foreground">{song.profiles?.email}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(song.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(song.created_at).toLocaleDateString()} {new Date(song.created_at).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No custom songs uploaded yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomSongUpload;