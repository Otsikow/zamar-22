import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Music, User } from 'lucide-react';

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

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const CustomSongUpload = () => {
  const { toast } = useToast();
  const [recentSongs, setRecentSongs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
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
    fetchProfiles();
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

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('first_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleFileUpload = async (file: File, bucket: string): Promise<string | null> => {
    if (!file) return null;

    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      toast({
        title: "Error",
        description: "Failed to upload custom song: " + error.message,
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
              <Select 
                value={uploadForm.userId} 
                onValueChange={(value) => setUploadForm(prev => ({ ...prev, userId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user to deliver song to" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {profile.first_name} {profile.last_name} ({profile.email})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <Button type="submit" disabled={loading} className="w-full">
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