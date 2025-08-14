import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Quote, Upload, Heart, User, Calendar, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { Link } from "react-router-dom";
import Footer from "@/components/sections/Footer";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  message: z.string().min(10, "Please provide at least 10 characters for your testimony"),
});

type FormData = z.infer<typeof formSchema>;

interface Testimonial {
  id: string;
  display_name: string;
  message: string;
  media_url: string | null;
  created_at: string;
  published_at: string;
  country?: string;
}

const Testimonies = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      message: "",
    },
  });

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchTestimonials();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('testimonies-public')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'testimonies' },
        () => {
          fetchTestimonials(); // Refresh on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("public_testimonies")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error: any) {
      console.error("Error fetching testimonials:", error);
      toast({
        title: "Error",
        description: "Failed to load testimonials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a testimony.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("testimonies")
        .insert({
          user_id: user.id,
          display_name: data.name,
          message: data.message,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Testimony Submitted!",
        description: "Thank you for sharing your testimony. It will be reviewed before being published.",
      });

      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit testimony. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6 flex items-center justify-center gap-3">
              <Quote className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              <span className="text-transparent bg-gradient-primary bg-clip-text">
                {t('testimonies.title', 'Testimonies')}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-inter">
              {t('testimonies.subtitle', 'Read inspiring stories from our community and share how Zamar has touched your life.')}
            </p>
          </div>

          {/* Testimonial Feed */}
          <div className="mb-16">
            <h2 className="text-2xl font-playfair font-bold text-foreground mb-8 flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              Community Stories
            </h2>

            {isLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="bg-gradient-card border-border animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-accent rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-accent rounded w-32 mb-2"></div>
                            <div className="h-3 bg-accent rounded w-24"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-accent rounded w-full"></div>
                          <div className="h-4 bg-accent rounded w-3/4"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : testimonials.length === 0 ? (
              <Card className="bg-gradient-card border-border">
                <CardContent className="p-8 text-center">
                  <Quote className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-playfair text-foreground mb-2">
                    No Testimonies Yet
                  </h3>
                  <p className="text-muted-foreground font-inter">
                    Be the first to share your story with our community.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                {testimonials.map((testimonial) => (
                  <Card key={testimonial.id} className="bg-gradient-card border-primary/20 hover:border-primary/40 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-playfair font-semibold text-foreground">
                                {testimonial.display_name}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(testimonial.published_at || testimonial.created_at)}</span>
                                {testimonial.country && (
                                  <>
                                    <span>•</span>
                                    <span>{testimonial.country}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Badge className="bg-primary/20 text-primary border-primary/30">
                              Verified
                            </Badge>
                          </div>
                          
                          <blockquote className="relative">
                            <Quote className="absolute -top-2 -left-2 w-6 h-6 text-primary/30" />
                            <p className="text-foreground font-inter leading-relaxed pl-6">
                              {testimonial.message}
                            </p>
                          </blockquote>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Testimonial Submission Form */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-playfair font-bold text-foreground mb-8 flex items-center justify-center gap-2">
              <Quote className="w-6 h-6 text-primary" />
              Share Your Story
            </h2>
            
            <div className="space-y-4">
              <p className="text-muted-foreground font-inter max-w-xl mx-auto">
                Tell us how Zamar has blessed your life and encouraged your faith journey.
              </p>
              <Link to="/testimonies/submit">
                <Button size="lg" className="flex items-center gap-2">
                  <Quote className="w-4 h-4" />
                  Submit Your Testimony
                </Button>
              </Link>
            </div>
          </div>

          {/* Info Box */}
          <Alert className="bg-primary/10 border-primary/30">
            <Info className="w-5 h-5 text-primary" />
            <AlertDescription className="text-muted-foreground font-inter italic">
              <strong className="text-primary not-italic">Moderation Notice:</strong> All testimonies are reviewed before publishing to ensure respectful and uplifting content that honors our Christian values.
            </AlertDescription>
          </Alert>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Testimonies;