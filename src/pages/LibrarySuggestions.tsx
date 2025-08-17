import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Plus, ExternalLink, Calendar, BookOpen, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { SuggestSongModal } from "@/components/modals/SuggestSongModal";

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
  songs?: {
    id: string;
    title: string;
  } | null;
}

const LibrarySuggestions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<SongSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchSuggestions();
    }
  }, [user]);

  const fetchSuggestions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("song_suggestions")
        .select(`
          *,
          songs (
            id,
            title
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({
        title: "Error loading suggestions",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      approved: "default", 
      created: "default",
      rejected: "destructive"
    } as const;

    const colors = {
      pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
      approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400", 
      created: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      rejected: "bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400"
    } as const;

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const toggleDescription = (id: string) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedDescriptions(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lightbulb className="h-8 w-8 text-primary" />
              Your Song Suggestions
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your submitted song ideas and their status
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Suggestion
          </Button>
        </div>

        {suggestions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
                <Lightbulb className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No suggestions yet</h3>
              <p className="text-muted-foreground mb-4">
                Share your idea to inspire the next Zamar track.
              </p>
              <Button onClick={() => setShowModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Submit Your First Suggestion
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="rounded-2xl shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {suggestion.title || "Untitled Suggestion"}
                    </CardTitle>
                    {getStatusBadge(suggestion.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {suggestion.scripture_reference && (
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {suggestion.scripture_reference}
                      </div>
                    )}
                    {suggestion.preferred_language && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        {suggestion.preferred_language}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {suggestion.description && (
                    <div className="mb-4">
                      <p className="text-sm leading-relaxed">
                        {expandedDescriptions.has(suggestion.id) 
                          ? suggestion.description
                          : truncateText(suggestion.description)
                        }
                      </p>
                      {suggestion.description.length > 150 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-xs"
                          onClick={() => toggleDescription(suggestion.id)}
                        >
                          {expandedDescriptions.has(suggestion.id) ? "Show less" : "Read more"}
                        </Button>
                      )}
                    </div>
                  )}

                  {suggestion.admin_notes && (
                    <div className="bg-muted/50 p-3 rounded-lg mb-4">
                      <h4 className="text-sm font-medium mb-1">Admin Notes:</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.admin_notes}</p>
                    </div>
                  )}

                  {suggestion.status === 'created' && suggestion.songs && (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-400">
                          Song Created: {suggestion.songs.title}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500">
                          Your suggestion inspired a new song!
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="gap-2">
                        <Link to={`/songs/${suggestion.songs.id}`}>
                          <ExternalLink className="h-4 w-4" />
                          Go to Song
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <SuggestSongModal 
        open={showModal} 
        onOpenChange={setShowModal}
      />
    </>
  );
};

export default LibrarySuggestions;