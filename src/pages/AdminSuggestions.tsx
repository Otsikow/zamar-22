import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Calendar, User, FileText, Tag } from "lucide-react";
import { format } from "date-fns";

interface SongSuggestion {
  id: string;
  title: string | null;
  description: string | null;
  scripture_reference: string | null;
  preferred_language: string | null;
  status: string;
  admin_notes: string | null;
  song_id: string | null;
  created_at: string;
  fulfilled_at: string | null;
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  songs: {
    title: string;
  } | null;
}

interface Song {
  id: string;
  title: string;
}

const AdminSuggestions = () => {
  const { isAdmin, loading } = useIsAdmin();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<SongSuggestion[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SongSuggestion | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formData, setFormData] = useState({
    status: "",
    song_id: "",
    admin_notes: ""
  });

  useEffect(() => {
    if (isAdmin) {
      fetchSuggestions();
      fetchSongs();
    }
  }, [isAdmin]);

  const fetchSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from("song_suggestions")
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          ),
          songs (
            title
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch suggestions",
        variant: "destructive"
      });
    }
  };

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title")
        .order("title");

      if (error) throw error;
      setSongs(data || []);
    } catch (error) {
      console.error("Error fetching songs:", error);
    }
  };

  const handleOpenSuggestion = (suggestion: SongSuggestion) => {
    setSelectedSuggestion(suggestion);
    setFormData({
      status: suggestion.status,
      song_id: suggestion.song_id || "",
      admin_notes: suggestion.admin_notes || ""
    });
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!selectedSuggestion) return;

    // Validate: if status is 'created', song_id must be selected
    if (formData.status === "created" && !formData.song_id) {
      toast({
        title: "Validation Error",
        description: "Please select the created song.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("song_suggestions")
        .update({
          status: formData.status,
          song_id: formData.song_id || null,
          admin_notes: formData.admin_notes
        })
        .eq("id", selectedSuggestion.id);

      if (error) throw error;

      await fetchSuggestions();
      setIsSheetOpen(false);
      
      const successMessage = formData.status === "created" 
        ? "Linked! Supporter credited on the song."
        : "Suggestion updated.";
      
      toast({
        title: "Success",
        description: successMessage
      });
    } catch (error) {
      console.error("Error updating suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to update suggestion",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      approved: "default", 
      created: "sponsored",
      rejected: "destructive"
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const getUserName = (suggestion: SongSuggestion) => {
    if (!suggestion.profiles) return "Supporter";
    const { first_name, last_name, email } = suggestion.profiles;
    if (first_name || last_name) {
      return `${first_name || ""} ${last_name || ""}`.trim();
    }
    return email || "Supporter";
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (suggestion.title?.toLowerCase().includes(searchLower)) ||
      (suggestion.scripture_reference?.toLowerCase().includes(searchLower)) ||
      (getUserName(suggestion).toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="text-center text-muted-foreground">Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Suggestions Manager</h1>
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suggestions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredSuggestions.map((suggestion) => (
          <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(suggestion.created_at), "PPP")}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getUserName(suggestion)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {suggestion.title || "No title"}
                    </span>
                  </div>

                  {suggestion.scripture_reference && (
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{suggestion.scripture_reference}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(suggestion.status)}
                    {suggestion.songs && (
                      <Badge variant="outline">
                        Linked to: {suggestion.songs.title}
                      </Badge>
                    )}
                  </div>
                </div>

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => handleOpenSuggestion(suggestion)}
                    >
                      Open
                    </Button>
                  </SheetTrigger>
                </Sheet>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[600px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Manage Suggestion</SheetTitle>
          </SheetHeader>
          
          {selectedSuggestion && (
            <div className="space-y-6 mt-6">
              {/* Readonly Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Submitter</label>
                  <p className="text-sm text-muted-foreground">
                    {getUserName(selectedSuggestion)}
                  </p>
                </div>

                {selectedSuggestion.description && (
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedSuggestion.description}
                    </p>
                  </div>
                )}

                {selectedSuggestion.scripture_reference && (
                  <div>
                    <label className="text-sm font-medium">Scripture Reference</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedSuggestion.scripture_reference}
                    </p>
                  </div>
                )}

                {selectedSuggestion.preferred_language && (
                  <div>
                    <label className="text-sm font-medium">Preferred Language</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedSuggestion.preferred_language}
                    </p>
                  </div>
                )}
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={formData.status} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="created">Created</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Link to Song</label>
                  <Select value={formData.song_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, song_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a song..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {songs.map((song) => (
                        <SelectItem key={song.id} value={song.id}>
                          {song.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Admin Notes</label>
                  <Textarea
                    value={formData.admin_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                    placeholder="Internal notes..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSave} className="flex-1">
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsSheetOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminSuggestions;