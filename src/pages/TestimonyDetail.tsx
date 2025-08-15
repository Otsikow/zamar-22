import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Quote, Calendar, Volume2, Video, ArrowLeft, 
  MapPin, Flag, Share2, Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { shareTestimony } from "@/lib/share";

interface Testimony {
  id: string;
  display_name: string;
  message: string;
  media_url: string | null;
  media_type: string;
  created_at: string;
  published_at: string;
  country?: string;
  song_id?: string;
}

const TestimonyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [testimony, setTestimony] = useState<Testimony | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchTestimony();
    }
  }, [id]);

  const fetchTestimony = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("public_testimonies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setTestimony(data);
    } catch (error: any) {
      console.error("Error fetching testimony:", error);
      setError("Testimony not found or unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleShare = async () => {
    if (!testimony) return;

    await shareTestimony({
      id: testimony.id,
      body: testimony.message,
      author: testimony.display_name,
      location: testimony.country,
      baseUrl: "https://www.zamarsongs.com",
      utm: { 
        utm_source: "app", 
        utm_medium: "share", 
        utm_campaign: "testimony_detail" 
      },
      toast: (message, type) => {
        toast({
          title: message,
          variant: type === "error" ? "destructive" : "default"
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="bg-card rounded-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-muted rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-muted rounded w-48"></div>
                  <div className="h-4 bg-muted rounded w-32"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !testimony) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
        <div className="text-center">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Testimony Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "This testimony may have been removed or is no longer available."}
          </p>
          <Link to="/testimonies">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              View All Testimonies
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* SEO Meta Tags */}
      <title>{`Testimony by ${testimony.display_name} | Zamar Songs`}</title>
      <meta 
        name="description" 
        content={`Read this inspiring testimony from ${testimony.display_name}: "${testimony.message.substring(0, 140)}..."`}
      />
      <meta property="og:title" content={`Testimony by ${testimony.display_name} | Zamar Songs`} />
      <meta property="og:description" content={testimony.message.substring(0, 140) + "..."} />
      <meta property="og:type" content="article" />
      
      <div className="max-w-4xl mx-auto p-4 pt-8">
        {/* Back Button */}
        <Link to="/testimonies" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Testimonies
        </Link>

        {/* Main Content */}
        <Card className="bg-card border-primary/20 shadow-lg">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                  {getInitials(testimony.display_name)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {testimony.display_name}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {testimony.country && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {testimony.country}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatTimeAgo(testimony.published_at || testimony.created_at)}
                    </div>
                  </div>
                  <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border-primary/20">
                    Verified Zamar User
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quote Icon Background */}
            <div className="relative mb-8">
              <Quote className="absolute top-0 right-0 w-24 h-24 text-primary/5 -z-10" />
              
              {/* Testimony Message */}
              <blockquote className="text-foreground leading-relaxed text-lg whitespace-pre-wrap">
                {testimony.message}
              </blockquote>
            </div>

            {/* Media */}
            {testimony.media_url && (
              <div className="mb-8">
                {testimony.media_type === 'video' ? (
                  <video 
                    controls 
                    className="w-full rounded-lg shadow-md"
                    style={{ aspectRatio: '16/9' }}
                    src={testimony.media_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : testimony.media_type === 'audio' ? (
                  <div className="bg-primary/10 p-6 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <Volume2 className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Audio Testimony</span>
                    </div>
                    <audio 
                      controls 
                      className="w-full"
                      src={testimony.media_url}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ) : null}
              </div>
            )}

            {/* Actions */}
            <div className="pt-6 border-t border-border flex justify-between items-center">
              <Button 
                variant="outline"
                className="gap-2 hover:bg-primary/5"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
                Share this testimony
              </Button>
              
              <Button 
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive gap-1"
                onClick={() => {
                  window.location.href = 'mailto:info@zamarsongs.com?subject=Report Testimony';
                }}
              >
                <Flag className="w-3 h-3" />
                Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            Have a testimony to share? Your story could inspire others.
          </p>
          <Link to="/testimonies/submit">
            <Button className="gap-2">
              Share Your Testimony
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TestimonyDetail;