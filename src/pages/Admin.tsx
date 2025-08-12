import { useState, useEffect } from "react";
import Footer from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Music, Users, FileText, TrendingUp, Play, Pause, Download, Globe, BookOpen, Heart, Edit, Trash2, MessageCircle } from "lucide-react";
import BackButton from "@/components/ui/back-button";
import AnalyticsPanel from "@/components/admin/AnalyticsPanel";
import RequestReviewPanel from "@/components/admin/RequestReviewPanel";
import TestimonyModerationPanel from "@/components/admin/TestimonyModerationPanel";
import { ReferralAnalytics } from "@/components/admin/ReferralAnalytics";
import CustomSongUpload from "@/components/admin/CustomSongUpload";
import SongAnalytics from "@/components/admin/SongAnalytics";
import UserRoleManagement from "@/components/admin/UserRoleManagement";
import RoleChangeHistory from "@/components/admin/RoleChangeHistory";
import { LiveChats } from "@/components/admin/LiveChats";
const zamarLogo = "/lovable-uploads/78355eae-a8bc-4167-9f39-fec08c253f60.png";
import { useNowPlaying } from "@/contexts/NowPlayingContext";
import AdManagerList from "@/components/admin/AdManagerList";
import AdApprovalTabs from "@/components/admin/AdApprovalTabs";
import GrantAdminOnce from "@/components/admin/GrantAdminOnce";
interface CustomSongRequest {
  id: string;
  occasion: string;
  style_genre: string;
  key_message: string;
  tier: string;
  status: string;
  created_at: string;
  language?: string;
  scripture_quote?: string;
}

interface Testimonial {
  id: string;
  name: string;
  message: string;
  status: string;
  audio_url?: string;
  created_at: string;
}

interface SongPlay {
  id: string;
  song_id: string;
  country?: string;
  created_at: string;
  songs?: {
    title: string;
  };
}

interface Lyric {
  id: string;
  song_id: string;
  text?: string;
  language: string;
  pdf_url?: string;
  created_at: string;
  songs?: {
    title: string;
  };
}

interface Donation {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  campaign?: string;
  status: string;
  created_at: string;
}

const Admin = () => {
  const { toast } = useToast();
  const { state, playSong, togglePlayPause } = useNowPlaying();

  const handlePreviewSong = (song: any) => {
    const nowPlayingSong = {
      id: song.id,
      title: song.title,
      artist: song.genre || "Zamar",
      duration: 180,
      url: song.audio_url || undefined,
      cover: zamarLogo,
    };

    if (!nowPlayingSong.url) return;

    if (state.currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      playSong(nowPlayingSong);
    }
  };
  const [requests, setRequests] = useState<CustomSongRequest[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [songPlays, setSongPlays] = useState<SongPlay[]>([]);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [editingSong, setEditingSong] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState(0);
  const [loading, setLoading] = useState(true);

  // Read tab from URL
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const rawInitialTab = params.get('tab') || 'upload';
  const initialTab = rawInitialTab === 'ads' ? 'advertising' : rawInitialTab;
const [activeTab, setActiveTab] = useState(initialTab);

  // Ensure the selected tab scrolls into view (helps on mobile where users think it didn't open)
  useEffect(() => {
    if (activeTab === 'advertising') {
      document.getElementById('ads-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab]);

  // Manage Songs search state
  const [q, setQ] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const fetchSongsSearch = async (query: string) => {
    try {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .or([
          `title.ilike.%${query}%`,
          `genre.ilike.%${query}%`,
          `occasion.ilike.%${query}%`,
          // tags is text[]; cs means array contains
          `tags.cs.{${query}}`
        ].join(","))
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error) setSearchResults(data || []);
    } catch (e) {
      console.error("Song search failed:", e);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      const query = q.trim();
      if (query) {
        fetchSongsSearch(query);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [q]);

  // Song upload form state
  const [songForm, setSongForm] = useState({
    title: "",
    genre: "",
    occasion: "",
    scriptureRef: "",
    tags: "",
    language: "English",
    featured: false,
    audioFile: null as File | null,
    lyrics: ""
  });

  // Lyrics form state
  const [lyricsForm, setLyricsForm] = useState({
    songId: "",
    text: "",
    language: "English"
  });

  // Edit lyrics state
  const [editingLyric, setEditingLyric] = useState<Lyric | null>(null);
  const [editingLyricForm, setEditingLyricForm] = useState({
    text: "",
    language: "English",
  });

  // Add lyrics form for song dialog
  const [newLyricForm, setNewLyricForm] = useState({
    text: "",
    language: "English",
  });

  // Ad form state
  const [adForm, setAdForm] = useState({
    title: "",
    adType: "banner",
    targetUrl: "",
    isActive: true,
    frequency: 1,
    placement: "home_hero" as "home_hero" | "sidebar_300x250" | "player_728x90",
    startDate: "",
    endDate: "",
    bannerFile: null as File | null,
    audioFile: null as File | null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch songs for dropdown
      const { data: songsData } = await supabase
        .from("songs")
        .select("id, title")
        .order("title");

      // Fetch all songs for management
      const { data: allSongsData } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch custom song requests
      const { data: requestsData } = await supabase
        .from("custom_song_requests")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch testimonials
      const { data: testimonialsData } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch song plays for analytics
      const { data: playsData } = await supabase
        .from("song_plays")
        .select(`
          *,
          songs(title)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      // Fetch lyrics
      const { data: lyricsData } = await supabase
        .from("lyrics")
        .select(`
          *,
          songs(title)
        `)
        .order("created_at", { ascending: false });

      // Fetch donations
      const { data: donationsData } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch active sessions count
      const { count: sessionsCount } = await supabase
        .from("active_sessions")
        .select("*", { count: "exact" });

      setSongs(songsData || []);
      setAllSongs(allSongsData || []);
      setRequests(requestsData || []);
      setTestimonials(testimonialsData || []);
      setSongPlays(playsData || []);
      setLyrics(lyricsData || []);
      setDonations(donationsData || []);
      setActiveSessions(sessionsCount || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (id: string, action: string) => {
    try {
      const { error } = await supabase
        .from("custom_song_requests")
        .update({ status: action } as any)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Request ${action} successfully`,
      });

      fetchData();
    } catch (error) {
      console.error("Error updating request:", error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    }
  };

  const handleTestimonialAction = async (id: string, action: string) => {
    try {
      const { error } = await supabase
        .from("testimonials")
        .update({ status: action, moderated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Testimonial ${action} successfully`,
      });

      fetchData();
    } catch (error) {
      console.error("Error updating testimonial:", error);
      toast({
        title: "Error",
        description: "Failed to update testimonial",
        variant: "destructive",
      });
    }
  };

  const handleSongUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!songForm.title || !songForm.title.trim()) {
      toast({ title: "Error", description: "Please enter a song title", variant: "destructive" });
      return;
    }

    if (!songForm.audioFile) {
      toast({ title: "Error", description: "Please select an MP3 file", variant: "destructive" });
      return;
    }
    
    try {
      // Upload audio file to storage
      const audioFileName = `${Date.now()}_${songForm.audioFile.name}`;
        const { data: audioData, error: audioError } = await supabase.storage
          .from('advertisements')
          .upload(audioFileName, songForm.audioFile);

        if (audioError) throw audioError;

        // Get public URL for the audio file
        const { data: { publicUrl: audioUrl } } = supabase.storage
          .from('advertisements')
          .getPublicUrl(audioFileName);

      // Insert song into database
      const { data: songData, error: songError } = await supabase
        .from("songs")
        .insert({
          title: songForm.title,
          genre: songForm.genre,
          occasion: songForm.occasion,
          tags: songForm.tags.split(",").map(tag => tag.trim()),
          featured: songForm.featured,
          audio_url: audioUrl
        })
        .select()
        .single();

      if (songError) throw songError;

      // If lyrics are provided, save them
      if (songForm.lyrics.trim()) {
        const { error: lyricsError } = await supabase
          .from("lyrics")
          .insert({
            song_id: songData.id,
            text: songForm.lyrics,
            language: songForm.language
          });

        if (lyricsError) throw lyricsError;
      }

      toast({
        title: "Success",
        description: "Song uploaded successfully",
      });

      setSongForm({
        title: "",
        genre: "",
        occasion: "",
        scriptureRef: "",
        tags: "",
        language: "English",
        featured: false,
        audioFile: null,
        lyrics: ""
      });
    } catch (error) {
      console.error("Error uploading song:", error);
      toast({
        title: "Error",
        description: "Failed to upload song",
        variant: "destructive",
      });
    }
  };

  const handleSongUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSong) return;
    
    try {
      const { error } = await supabase
        .from("songs")
        .update({
          title: editingSong.title,
          genre: editingSong.genre,
          occasion: editingSong.occasion,
          tags: editingSong.tags,
          featured: editingSong.featured
        })
        .eq("id", editingSong.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Song updated successfully",
      });

      setEditingSong(null);
      const query = q.trim();
      if (query) {
        await fetchSongsSearch(query);
      } else {
        await fetchData();
      }
    } catch (error) {
      console.error("Error updating song:", error);
      toast({
        title: "Error",
        description: "Failed to update song",
        variant: "destructive",
      });
    }
  };

  const handleSongDelete = async (songId: string) => {
    if (!confirm("Are you sure you want to delete this song? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("songs")
        .delete()
        .eq("id", songId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Song deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error("Error deleting song:", error);
      toast({
        title: "Error",
        description: "Failed to delete song",
        variant: "destructive",
      });
    }
  };

  const handleLyricsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("lyrics")
        .insert({
          song_id: lyricsForm.songId,
          text: lyricsForm.text,
          language: lyricsForm.language
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lyrics added successfully",
      });

      setLyricsForm({
        songId: "",
        text: "",
        language: "English"
      });

      fetchData();
    } catch (error) {
      console.error("Error adding lyrics:", error);
      toast({
        title: "Error",
        description: "Failed to add lyrics",
        variant: "destructive",
      });
    }
  };

  // Update existing lyrics
  const handleLyricUpdate = async (lyricId: string) => {
    try {
      const { error } = await supabase
        .from("lyrics")
        .update({
          text: editingLyricForm.text,
          language: editingLyricForm.language,
        })
        .eq("id", lyricId);

      if (error) throw error;

      toast({ title: "Success", description: "Lyrics updated successfully" });
      setEditingLyric(null);
      await fetchData();
    } catch (error) {
      console.error("Error updating lyrics:", error);
      toast({ title: "Error", description: "Failed to update lyrics", variant: "destructive" });
    }
  };

  // Delete existing lyrics
  const handleLyricDelete = async (lyricId: string) => {
    if (!confirm("Delete these lyrics? This cannot be undone.")) return;
    try {
      const { error } = await supabase.from("lyrics").delete().eq("id", lyricId);
      if (error) throw error;
      toast({ title: "Deleted", description: "Lyrics deleted." });
      await fetchData();
    } catch (error) {
      console.error("Error deleting lyrics:", error);
      toast({ title: "Error", description: "Failed to delete lyrics", variant: "destructive" });
    }
  };

  // Create new lyrics for a song from the song row dialog
  const handleLyricCreateForSong = async (songId: string) => {
    if (!newLyricForm.text.trim()) {
      toast({ title: "Lyrics required", description: "Please enter lyrics text before saving.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from("lyrics").insert({
        song_id: songId,
        text: newLyricForm.text,
        language: newLyricForm.language,
      });
      if (error) throw error;
      toast({ title: "Success", description: "Lyrics added successfully" });
      setNewLyricForm({ text: "", language: "English" });
      await fetchData();
    } catch (error) {
      console.error("Error adding lyrics:", error);
      toast({ title: "Error", description: "Failed to add lyrics", variant: "destructive" });
    }
  };

  const handleAdCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let mediaUrl: string | null = null;

      if (adForm.adType === "banner" && adForm.bannerFile) {
        const fileName = `${Date.now()}_${adForm.bannerFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("advertisements")
          .upload(fileName, adForm.bannerFile);
        if (uploadErr) throw uploadErr;
        const { data: pub } = supabase.storage.from("advertisements").getPublicUrl(fileName);
        mediaUrl = pub.publicUrl;
      }

      if (adForm.adType === "audio" && adForm.audioFile) {
        const fileName = `${Date.now()}_${adForm.audioFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("advertisements")
          .upload(fileName, adForm.audioFile);
        if (uploadErr) throw uploadErr;
        const { data: pub } = supabase.storage.from("advertisements").getPublicUrl(fileName);
        mediaUrl = pub.publicUrl;
      }

      const { error } = await supabase
        .from("advertisements")
        .insert({
          title: adForm.title,
          ad_type: adForm.adType,
          target_url: adForm.targetUrl,
          is_active: adForm.isActive,
          frequency: adForm.frequency,
          media_url: mediaUrl,
          placement: adForm.placement,
          start_date: adForm.startDate || null,
          end_date: adForm.endDate || null,
        });

      if (error) throw error;

      toast({ title: "Success", description: "Ad created successfully" });

      setAdForm({
        title: "",
        adType: "banner",
        targetUrl: "",
        isActive: true,
        frequency: 1,
        placement: "home_hero",
        startDate: "",
        endDate: "",
        bannerFile: null,
        audioFile: null,
      });
    } catch (error) {
      console.error("Error creating ad:", error);
      toast({ title: "Error", description: "Failed to create ad", variant: "destructive" });
    }
  };

  // Analytics calculations
  const topSongs = songPlays.reduce((acc, play) => {
    const title = play.songs?.title || "Unknown";
    acc[title] = (acc[title] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const downloadsByCountry = songPlays.reduce((acc, play) => {
    const country = play.country || "Unknown";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Donation analytics
  const totalDonations = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const monthlyDonations = donations.filter(d => d.type === 'monthly').length;
  const oneTimeDonations = donations.filter(d => d.type === 'one-time').length;

  const donationsByCampaign = donations.reduce((acc, donation) => {
    const campaign = donation.campaign || "General";
    acc[campaign] = (acc[campaign] || 0) + donation.amount;
    return acc;
  }, {} as Record<string, number>);
  
  // Song duration handling for admin list
  const [durations, setDurations] = useState<Record<string, number>>({});
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };
  const loadDuration = (song: any) => {
    if (!song?.audio_url || durations[song.id]) return;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    audio.src = song.audio_url;
    const onLoaded = () => {
      if (!isNaN(audio.duration)) {
        setDurations(prev => ({ ...prev, [song.id]: Math.floor(audio.duration) }));
      }
      cleanup();
    };
    const onError = () => { cleanup(); };
    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
    };
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
  };
  useEffect(() => {
    (allSongs || []).forEach(loadDuration);
  }, [allSongs]);
  useEffect(() => {
    (searchResults || []).forEach(loadDuration);
  }, [searchResults]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-primary">Loading admin dashboard...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-heading text-primary mb-4">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Manage all platform content, user activity, and system updates.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <Link to="/admin/notifications">
              <Button variant="outline" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Notification Center
              </Button>
            </Link>
            <Link to="/admin/chat-inbox">
              <Button variant="outline" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat Inbox
              </Button>
            </Link>
          </div>
        </div>

        {/* First-time admin grant helper */}
        <GrantAdminOnce />


        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-2 p-1">
            <TabsTrigger value="upload" className="w-full justify-center text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Upload</TabsTrigger>
            <TabsTrigger value="songs" className="w-full justify-center text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Songs</TabsTrigger>
            <TabsTrigger value="analytics" className="w-full justify-center text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Analytics</TabsTrigger>
            <TabsTrigger value="chat" className="w-full justify-center text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Chat</TabsTrigger>
            <TabsTrigger value="lyrics" className="w-full justify-center text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Lyrics</TabsTrigger>
            <TabsTrigger value="donations" className="w-full justify-center text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Donations</TabsTrigger>
            <TabsTrigger value="testimonials" className="w-full justify-center text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Testimonials</TabsTrigger>
            <TabsTrigger value="users" className="w-full justify-center text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">User Management</TabsTrigger>
            <TabsTrigger value="advertising" className="w-full justify-center text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ads</TabsTrigger>
            <TabsTrigger value="referrals" className="w-full justify-center text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Referrals</TabsTrigger>
          </TabsList>

          {/* Upload New Song */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload New Song
                </CardTitle>
                <CardDescription>
                  Add a new song to the platform library
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSongUpload} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={songForm.title}
                        onChange={(e) => setSongForm({...songForm, title: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="genre">Genre</Label>
                      <Select value={songForm.genre} onValueChange={(value) => setSongForm({...songForm, genre: value})}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select a genre" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border z-50">
                          <SelectItem value="african-worship">African Worship</SelectItem>
                          <SelectItem value="afrobeats">Afrobeats</SelectItem>
                          <SelectItem value="christmas">Christmas</SelectItem>
                          <SelectItem value="contemporary">Contemporary Christian</SelectItem>
                          <SelectItem value="easter">Easter</SelectItem>
                          <SelectItem value="gospel">Gospel</SelectItem>
                          <SelectItem value="gospel-reggae">Gospel Reggae</SelectItem>
                          <SelectItem value="instrumental">Instrumental</SelectItem>
                          <SelectItem value="praise">Praise</SelectItem>
                          <SelectItem value="prayer">Prayer Songs</SelectItem>
                          <SelectItem value="spiritual">Spiritual</SelectItem>
                          <SelectItem value="traditional">Traditional Hymns</SelectItem>
                          <SelectItem value="worship">Worship</SelectItem>
                          <SelectItem value="youth-worship">Youth Worship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="occasion">Occasion</Label>
                      <Select value={songForm.occasion} onValueChange={(value) => setSongForm({...songForm, occasion: value})}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select an occasion" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border z-50">
                          <SelectItem value="sunday-service">Sunday Service</SelectItem>
                          <SelectItem value="worship-night">Worship Night</SelectItem>
                          <SelectItem value="prayer-meeting">Prayer Meeting</SelectItem>
                          <SelectItem value="youth-service">Youth Service</SelectItem>
                          <SelectItem value="bible-study">Bible Study</SelectItem>
                          <SelectItem value="baptism">Baptism</SelectItem>
                          <SelectItem value="communion">Communion</SelectItem>
                          <SelectItem value="wedding">Wedding</SelectItem>
                          <SelectItem value="funeral">Funeral/Memorial</SelectItem>
                          <SelectItem value="christmas">Christmas</SelectItem>
                          <SelectItem value="easter">Easter</SelectItem>
                          <SelectItem value="thanksgiving">Thanksgiving</SelectItem>
                          <SelectItem value="new-year">New Year</SelectItem>
                          <SelectItem value="revival">Revival/Conference</SelectItem>
                          <SelectItem value="graduation">Graduation</SelectItem>
                          <SelectItem value="anniversary">Church Anniversary</SelectItem>
                          <SelectItem value="birthday">Birthday</SelectItem>
                          <SelectItem value="dedication">Child Dedication</SelectItem>
                          <SelectItem value="general">General Worship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select value={songForm.language} onValueChange={(value) => setSongForm({...songForm, language: value})}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border z-50">
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                          <SelectItem value="Portuguese">Portuguese</SelectItem>
                          <SelectItem value="Italian">Italian</SelectItem>
                          <SelectItem value="Dutch">Dutch</SelectItem>
                          <SelectItem value="Chinese">Chinese</SelectItem>
                          <SelectItem value="Japanese">Japanese</SelectItem>
                          <SelectItem value="Korean">Korean</SelectItem>
                          <SelectItem value="Arabic">Arabic</SelectItem>
                          <SelectItem value="Hebrew">Hebrew</SelectItem>
                          <SelectItem value="Swahili">Swahili</SelectItem>
                          <SelectItem value="Yoruba">Yoruba</SelectItem>
                          <SelectItem value="Igbo">Igbo</SelectItem>
                          <SelectItem value="Hausa">Hausa</SelectItem>
                          <SelectItem value="Amharic">Amharic</SelectItem>
                          <SelectItem value="Hindi">Hindi</SelectItem>
                          <SelectItem value="Bengali">Bengali</SelectItem>
                          <SelectItem value="Tamil">Tamil</SelectItem>
                          <SelectItem value="Telugu">Telugu</SelectItem>
                          <SelectItem value="Marathi">Marathi</SelectItem>
                          <SelectItem value="Gujarati">Gujarati</SelectItem>
                          <SelectItem value="Punjabi">Punjabi</SelectItem>
                          <SelectItem value="Urdu">Urdu</SelectItem>
                          <SelectItem value="Russian">Russian</SelectItem>
                          <SelectItem value="Ukrainian">Ukrainian</SelectItem>
                          <SelectItem value="Polish">Polish</SelectItem>
                          <SelectItem value="Czech">Czech</SelectItem>
                          <SelectItem value="Hungarian">Hungarian</SelectItem>
                          <SelectItem value="Romanian">Romanian</SelectItem>
                          <SelectItem value="Bulgarian">Bulgarian</SelectItem>
                          <SelectItem value="Croatian">Croatian</SelectItem>
                          <SelectItem value="Serbian">Serbian</SelectItem>
                          <SelectItem value="Swedish">Swedish</SelectItem>
                          <SelectItem value="Norwegian">Norwegian</SelectItem>
                          <SelectItem value="Danish">Danish</SelectItem>
                          <SelectItem value="Finnish">Finnish</SelectItem>
                          <SelectItem value="Tagalog">Tagalog</SelectItem>
                          <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                          <SelectItem value="Thai">Thai</SelectItem>
                          <SelectItem value="Indonesian">Indonesian</SelectItem>
                          <SelectItem value="Malay">Malay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="scriptureRef">Scripture Reference</Label>
                      <Input
                        id="scriptureRef"
                        value={songForm.scriptureRef}
                        onChange={(e) => setSongForm({...songForm, scriptureRef: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={songForm.tags}
                      onChange={(e) => setSongForm({...songForm, tags: e.target.value})}
                      placeholder="worship, praise, contemporary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="audioFile">MP3 Audio File</Label>
                    <Input
                      id="audioFile"
                      type="file"
                      accept=".mp3,audio/mpeg"
                      onChange={(e) => setSongForm({...songForm, audioFile: e.target.files?.[0] || null})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lyrics">Lyrics</Label>
                    <Textarea
                      id="lyrics"
                      value={songForm.lyrics}
                      onChange={(e) => setSongForm({...songForm, lyrics: e.target.value})}
                      placeholder="Enter song lyrics here..."
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={songForm.featured}
                      onCheckedChange={(checked) => setSongForm({...songForm, featured: checked})}
                    />
                    <Label htmlFor="featured">Featured Song</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    <Music className="h-4 w-4 mr-2" />
                    Upload Song
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Songs Management */}
          <TabsContent value="songs">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full grid grid-cols-3 gap-2 p-1">
                <TabsTrigger value="all" className="w-full justify-center text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Songs</TabsTrigger>
                <TabsTrigger value="custom" className="w-full justify-center text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Custom Songs</TabsTrigger>
                <TabsTrigger value="requests" className="w-full justify-center text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Requests</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="h-5 w-5 text-primary" />
                      Manage Songs
                    </CardTitle>
                    <CardDescription>
                      View, edit, and delete existing songs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="mb-4">
                        <div className="flex items-center gap-2">
                          <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search title, genre, occasion, tags…"
                            className="max-w-md"
                          />
                          {q && (
                            <Button variant="outline" onClick={() => setQ("")}>Clear</Button>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {q ? (searchLoading ? 'Searching…' : `Showing ${searchResults.length} result(s)`) : `Showing ${allSongs.length} song(s)`}
                        </div>
                      </div>
                      {(q ? searchResults : allSongs).map((song) => (
                        <div key={song.id} className="border border-primary/20 rounded-lg p-4">
                          {editingSong?.id === song.id ? (
                            <form onSubmit={handleSongUpdate} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="editTitle">Title</Label>
                                  <Input
                                    id="editTitle"
                                    value={editingSong.title}
                                    onChange={(e) => setEditingSong({...editingSong, title: e.target.value})}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="editGenre">Genre</Label>
                                  <Input
                                    id="editGenre"
                                    value={editingSong.genre || ""}
                                    onChange={(e) => setEditingSong({...editingSong, genre: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="editOccasion">Occasion</Label>
                                  <Input
                                    id="editOccasion"
                                    value={editingSong.occasion || ""}
                                    onChange={(e) => setEditingSong({...editingSong, occasion: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="editTags">Tags</Label>
                                  <Input
                                    id="editTags"
                                    value={Array.isArray(editingSong.tags) ? editingSong.tags.join(", ") : ""}
                                    onChange={(e) => setEditingSong({...editingSong, tags: e.target.value.split(",").map(tag => tag.trim())})}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="editFeatured"
                                  checked={editingSong.featured}
                                  onCheckedChange={(checked) => setEditingSong({...editingSong, featured: checked})}
                                />
                                <Label htmlFor="editFeatured">Featured Song</Label>
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit" size="sm">
                                  Save Changes
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingSong(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-primary text-lg mb-2">
                                  {song.title}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Genre: </span>
                                    <span>{song.genre || "Not specified"}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Occasion: </span>
                                    <span>{song.occasion || "Not specified"}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Length: </span>
                                    <span>{durations[song.id] ? formatDuration(durations[song.id]) : "—"}</span>
                                  </div>
                                  <div className="md:col-span-2">
                                    <span className="text-muted-foreground">Tags: </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {Array.isArray(song.tags) && song.tags.length > 0 ? (
                                        song.tags.map((tag, index) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-muted-foreground text-sm">No tags</span>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Featured: </span>
                                    <Badge variant={song.featured ? "default" : "secondary"}>
                                      {song.featured ? "Yes" : "No"}
                                    </Badge>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Created: </span>
                                    <span>{new Date(song.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!song.audio_url}
                                    onClick={() => handlePreviewSong(song)}
                                    aria-label={state.currentSong?.id === song.id && state.isPlaying ? "Pause preview" : "Play preview"}
                                  >
                                    {state.currentSong?.id === song.id && state.isPlaying ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Edit Lyrics
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh]">
                                      <DialogHeader>
                                        <DialogTitle className="text-xl font-semibold text-primary">
                                          {song.title} - Lyrics
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                        {lyrics.filter((l) => l.song_id === song.id).length === 0 ? (
                                          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLyricCreateForSong(song.id); }}>
                                            <div>
                                              <Label htmlFor={`new-lang-${song.id}`}>Language</Label>
                                              <Select value={newLyricForm.language} onValueChange={(value) => setNewLyricForm({ ...newLyricForm, language: value })}>
                                                <SelectTrigger id={`new-lang-${song.id}`}>
                                                  <SelectValue placeholder="Select a language" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="English">English</SelectItem>
                                                  <SelectItem value="Spanish">Spanish</SelectItem>
                                                  <SelectItem value="French">French</SelectItem>
                                                  <SelectItem value="German">German</SelectItem>
                                                  <SelectItem value="Portuguese">Portuguese</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div>
                                              <Label htmlFor={`new-lyrics-${song.id}`}>Lyrics Text</Label>
                                              <Textarea
                                                id={`new-lyrics-${song.id}`}
                                                rows={8}
                                                placeholder="Enter song lyrics..."
                                                value={newLyricForm.text}
                                                onChange={(e) => setNewLyricForm({ ...newLyricForm, text: e.target.value })}
                                              />
                                            </div>
                                            <div className="flex gap-2">
                                              <Button type="submit" size="sm">Save Lyrics</Button>
                                              <Button type="button" size="sm" variant="outline" onClick={() => setNewLyricForm({ text: "", language: "English" })}>Cancel</Button>
                                            </div>
                                          </form>
                                        ) : (
                                          lyrics
                                            .filter((l) => l.song_id === song.id)
                                            .map((lyric) => (
                                              <div key={lyric.id} className="border border-primary/20 rounded-lg p-4">
                                                <div className="mb-2 flex items-center justify-between">
                                                  <div>
                                                    <Badge variant="outline" className="mr-2">{lyric.language}</Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                      Added on {new Date(lyric.created_at).toLocaleDateString()}
                                                    </span>
                                                  </div>
                                                  <div className="flex gap-2">
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => {
                                                        setEditingLyric(lyric);
                                                        setEditingLyricForm({
                                                          text: lyric.text || "",
                                                          language: lyric.language || "English",
                                                        });
                                                      }}
                                                    >
                                                      <Edit className="h-4 w-4 mr-2" />
                                                      Edit
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="destructive"
                                                      onClick={() => handleLyricDelete(lyric.id)}
                                                    >
                                                      <Trash2 className="h-4 w-4 mr-2" />
                                                      Delete
                                                    </Button>
                                                  </div>
                                                </div>

                                                {editingLyric?.id === lyric.id ? (
                                                  <div className="space-y-3 mt-3">
                                                    <div>
                                                      <Label htmlFor={`edit-lang-${lyric.id}`}>Language</Label>
                                                      <Select
                                                        value={editingLyricForm.language}
                                                        onValueChange={(value) =>
                                                          setEditingLyricForm({ ...editingLyricForm, language: value })
                                                        }
                                                      >
                                                        <SelectTrigger id={`edit-lang-${lyric.id}`}>
                                                          <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          <SelectItem value="English">English</SelectItem>
                                                          <SelectItem value="Spanish">Spanish</SelectItem>
                                                          <SelectItem value="French">French</SelectItem>
                                                          <SelectItem value="German">German</SelectItem>
                                                          <SelectItem value="Portuguese">Portuguese</SelectItem>
                                                        </SelectContent>
                                                      </Select>
                                                    </div>
                                                    <div>
                                                      <Label htmlFor={`edit-text-${lyric.id}`}>Lyrics Text</Label>
                                                      <Textarea
                                                        id={`edit-text-${lyric.id}`}
                                                        value={editingLyricForm.text}
                                                        onChange={(e) =>
                                                          setEditingLyricForm({ ...editingLyricForm, text: e.target.value })
                                                        }
                                                        rows={6}
                                                      />
                                                    </div>
                                                    <div className="flex gap-2">
                                                      <Button size="sm" onClick={() => handleLyricUpdate(lyric.id)}>Save</Button>
                                                      <Button size="sm" variant="outline" onClick={() => setEditingLyric(null)}>
                                                        Cancel
                                                      </Button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <>
                                                    {lyric.text ? (
                                                      <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/20 p-4 rounded-lg">
                                                        {lyric.text}
                                                      </div>
                                                    ) : (
                                                      <p className="text-muted-foreground">No lyrics text available.</p>
                                                    )}
                                                    {lyric.pdf_url && (
                                                      <div className="mt-4">
                                                        <Button variant="outline" asChild>
                                                          <a href={lyric.pdf_url} target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download PDF
                                                          </a>
                                                        </Button>
                                                      </div>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            ))
                                        )}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingSong(song)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleSongDelete(song.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {allSongs.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No songs found. Upload your first song using the Upload tab.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="custom">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Custom Songs</span>
                      <Button asChild size="sm">
                        <Link to="/admin/custom-songs">Open Manager</Link>
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Manage quotes, assignments, drafts, messages, and final deliveries for custom song requests.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Use the Custom Songs Manager for full workflow controls. This tab provides a quick entry point.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requests">
                <RequestReviewPanel 
                  requests={requests} 
                  onRequestAction={handleRequestAction}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Combined Analytics & Song Insights */}
          <TabsContent value="analytics">
            <SongAnalytics 
              songPlays={songPlays} 
              activeSessions={activeSessions}
            />
          </TabsContent>


          {/* Chat Inbox */}
          <TabsContent value="chat">
            <LiveChats />
          </TabsContent>

          {/* Lyrics Management */}
          <TabsContent value="lyrics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Lyrics Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Add Lyrics
                  </CardTitle>
                  <CardDescription>
                    Add lyrics to existing songs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLyricsSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="songSelect">Song</Label>
                      <Select value={lyricsForm.songId} onValueChange={(value) => setLyricsForm({...lyricsForm, songId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a song" />
                        </SelectTrigger>
                        <SelectContent>
                          {songs.map((song) => (
                            <SelectItem key={song.id} value={song.id}>
                              {song.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select value={lyricsForm.language} onValueChange={(value) => setLyricsForm({...lyricsForm, language: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                          <SelectItem value="Portuguese">Portuguese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="lyricsText">Lyrics Text</Label>
                      <Textarea
                        id="lyricsText"
                        value={lyricsForm.text}
                        onChange={(e) => setLyricsForm({...lyricsForm, text: e.target.value})}
                        placeholder="Enter song lyrics..."
                        rows={8}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Add Lyrics
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Existing Lyrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Lyrics</CardTitle>
                  <CardDescription>
                    Manage existing song lyrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                     {lyrics.map((lyric) => (
                       <Dialog key={lyric.id}>
                         <DialogTrigger asChild>
                           <div className="border border-primary/20 rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                             <div className="flex justify-between items-start mb-2">
                               <div>
                                 <h4 className="font-semibold text-primary">
                                   {lyric.songs?.title || "Unknown Song"}
                                 </h4>
                                 <Badge variant="outline">{lyric.language}</Badge>
                               </div>
                               <div className="text-xs text-muted-foreground">
                                 {new Date(lyric.created_at).toLocaleDateString()}
                               </div>
                             </div>
                             {lyric.text && (
                               <p className="text-sm text-muted-foreground line-clamp-3">
                                 {lyric.text}
                               </p>
                             )}
                             {lyric.pdf_url && (
                               <div className="mt-2">
                                 <Badge variant="secondary">PDF Available</Badge>
                               </div>
                             )}
                             <p className="text-xs text-primary mt-2">Click to view full lyrics</p>
                           </div>
                         </DialogTrigger>
                         <DialogContent className="max-w-2xl max-h-[80vh]">
                           <DialogHeader>
                             <DialogTitle className="text-xl font-semibold text-primary">
                               {lyric.songs?.title || "Unknown Song"} - Lyrics
                             </DialogTitle>
                           </DialogHeader>
                           <div className="mt-4 max-h-[60vh] overflow-y-auto">
                              <div className="mb-4 flex items-center justify-between">
                                <div>
                                  <Badge variant="outline" className="mr-2">{lyric.language}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Added on {new Date(lyric.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingLyric(lyric);
                                      setEditingLyricForm({
                                        text: lyric.text || "",
                                        language: lyric.language || "English",
                                      });
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Lyrics
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleLyricDelete(lyric.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                             {lyric.text ? (
                               <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/20 p-4 rounded-lg">
                                 {lyric.text}
                               </div>
                             ) : (
                               <p className="text-muted-foreground">No lyrics text available.</p>
                             )}
                             {lyric.pdf_url && (
                               <div className="mt-4">
                                 <Button variant="outline" asChild>
                                   <a href={lyric.pdf_url} target="_blank" rel="noopener noreferrer">
                                     <Download className="h-4 w-4 mr-2" />
                                     Download PDF
                                   </a>
                                 </Button>
                               </div>
                             )}
                           </div>
                         </DialogContent>
                       </Dialog>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Donations Management */}
          <TabsContent value="donations">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                  <Heart className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    ${(totalDonations / 100).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">All time total</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Donors</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{monthlyDonations}</div>
                  <p className="text-xs text-muted-foreground">Recurring supporters</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">One-Time Donations</CardTitle>
                  <Heart className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{oneTimeDonations}</div>
                  <p className="text-xs text-muted-foreground">Individual contributions</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Donations by Campaign */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Donations by Campaign
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(donationsByCampaign)
                      .sort(([,a], [,b]) => b - a)
                      .map(([campaign, amount]) => (
                        <div key={campaign} className="flex justify-between items-center">
                          <span className="text-sm">{campaign}</span>
                          <Badge variant="outline">${(amount / 100).toFixed(2)}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Donations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Recent Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {donations.slice(0, 10).map((donation) => (
                      <div key={donation.id} className="border border-primary/20 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-primary">
                              ${(donation.amount / 100).toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {donation.campaign || "General"}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              donation.type === "monthly" ? "default" : "secondary"
                            }>
                              {donation.type}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(donation.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Testimony Moderation */}
          <TabsContent value="testimonials">
            <TestimonyModerationPanel 
              testimonials={testimonials} 
              onTestimonialAction={handleTestimonialAction}
            />
          </TabsContent>

          {/* Ad Manager */}
          <TabsContent value="advertising" id="ads-section">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Ad Manager
                </CardTitle>
                <CardDescription>
                  Create and manage platform advertisements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Show submitted/approval workflow first */}
                <div className="space-y-8">
                  <AdApprovalTabs />
                  <AdManagerList />
                </div>

                {/* Creation form moved below lists for clarity */}
                <div className="mt-10">
                  <form onSubmit={handleAdCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="adTitle">Ad Title</Label>
                        <Input
                          id="adTitle"
                          value={adForm.title}
                          onChange={(e) => setAdForm({...adForm, title: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="adType">Ad Type</Label>
                        <Select value={adForm.adType} onValueChange={(value) => setAdForm({...adForm, adType: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="banner">Banner</SelectItem>
                            <SelectItem value="audio">Audio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="placement">Placement</Label>
                        <Select value={adForm.placement} onValueChange={(value) => setAdForm({...adForm, placement: value as any})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose placement" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home_hero">Home Hero</SelectItem>
                            <SelectItem value="sidebar_300x250">Sidebar 300x250</SelectItem>
                            <SelectItem value="player_728x90">Player 728x90</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="targetUrl">Target URL</Label>
                        <Input
                          id="targetUrl"
                          type="url"
                          value={adForm.targetUrl}
                          onChange={(e) => setAdForm({...adForm, targetUrl: e.target.value})}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="frequency">Frequency</Label>
                        <Input
                          id="frequency"
                          type="number"
                          min="1"
                          value={adForm.frequency}
                          onChange={(e) => setAdForm({...adForm, frequency: parseInt(e.target.value) || 1})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" type="date" value={adForm.startDate} onChange={(e) => setAdForm({...adForm, startDate: e.target.value})} />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input id="endDate" type="date" value={adForm.endDate} onChange={(e) => setAdForm({...adForm, endDate: e.target.value})} />
                      </div>
                    </div>
                    
                    {/* File Upload Section */}
                    {adForm.adType === "banner" && (
                      <div>
                        <Label htmlFor="bannerFile">Upload Banner Image</Label>
                        <Input
                          id="bannerFile"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAdForm({...adForm, bannerFile: e.target.files?.[0] || null})}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Supported formats: JPG, PNG, GIF. Recommended size: 728x90 or 300x250
                        </p>
                      </div>
                    )}
                    
                    {adForm.adType === "audio" && (
                      <div>
                        <Label htmlFor="audioFile">Upload Audio File</Label>
                        <Input
                          id="audioFile"
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setAdForm({...adForm, audioFile: e.target.files?.[0] || null})}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Supported formats: MP3, WAV. Maximum duration: 30 seconds
                        </p>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={adForm.isActive}
                        onCheckedChange={(checked) => setAdForm({...adForm, isActive: checked})}
                      />
                      <Label htmlFor="isActive">Is Active</Label>
                    </div>
                    <Button type="submit" className="w-full">
                      Create Ad
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management (with sub-tabs) */}
          <TabsContent value="users">
            <Tabs defaultValue="manage" className="w-full">
              <TabsList className="w-full overflow-x-auto p-1">
                <TabsTrigger value="manage" className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">User Management</TabsTrigger>
                <TabsTrigger value="history" className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Role History</TabsTrigger>
              </TabsList>
              <TabsContent value="manage">
                <UserRoleManagement />
              </TabsContent>
              <TabsContent value="history">
                <RoleChangeHistory />
              </TabsContent>
            </Tabs>
          </TabsContent>


          {/* Referrals Analytics */}
          <TabsContent value="referrals">
            <ReferralAnalytics />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
