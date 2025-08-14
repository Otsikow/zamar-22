import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Quote, Send, Heart, User, Globe, Info, Video, Volume2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import Footer from "@/components/sections/Footer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const formSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
  country: z.string().optional(),
  message: z.string().min(30, "Please provide at least 30 characters for your testimony"),
  media_url: z.string().url().optional().or(z.literal("")),
  media_type: z.enum(["text", "video", "audio"]).default("text"),
});

type FormData = z.infer<typeof formSchema>;

const TestimoniesSubmit = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const songId = searchParams.get('song_id');
  
  const [user, setUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      display_name: "",
      country: "",
      message: "",
      media_url: "",
      media_type: "text",
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
      if (session?.user && showLoginModal) {
        setShowLoginModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [showLoginModal]);

  const onSubmit = async (data: FormData) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("testimonies")
        .insert({
          user_id: user.id,
          display_name: data.display_name || null,
          country: data.country || null,
          message: data.message,
          media_url: data.media_url || null,
          media_type: data.media_type,
          song_id: songId || null,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: "Your testimony was submitted and awaits approval.",
      });

      form.reset();
      navigate("/testimonies/my-submissions");
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

  const handleSignIn = async () => {
    // Redirect to auth page
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6 flex items-center justify-center gap-3">
              <Quote className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              <span className="text-transparent bg-gradient-primary bg-clip-text">
                Share Your Testimony
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto font-inter">
              Tell us how Zamar has blessed your life and encouraged your faith journey.
            </p>
          </div>

          {/* Submission Form */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-playfair text-foreground flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Your Testimony
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Display Name Field */}
                  <FormField
                    control={form.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-inter font-medium flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Display Name (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="A Grateful Listener"
                            className="bg-background border-primary/30 focus:border-primary/60"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Country Field */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-inter font-medium flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Country (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your country"
                            className="bg-background border-primary/30 focus:border-primary/60"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Message Field */}
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-inter font-medium">
                          Your Testimony *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share how Zamar has impacted your life, blessed you, or helped you through a difficult time..."
                            className="bg-background border-primary/30 focus:border-primary/60 min-h-[150px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Media Type Field */}
                  <FormField
                    control={form.control}
                    name="media_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-inter font-medium flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Testimony Type
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-primary/30 focus:border-primary/60">
                              <SelectValue placeholder="Select testimony type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="text">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Text Only
                              </div>
                            </SelectItem>
                            <SelectItem value="video">
                              <div className="flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Video Testimony
                              </div>
                            </SelectItem>
                            <SelectItem value="audio">
                              <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4" />
                                Audio Testimony
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Media URL Field - conditionally shown */}
                  {form.watch("media_type") !== "text" && (
                    <FormField
                      control={form.control}
                      name="media_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-inter font-medium">
                            {form.watch("media_type") === "video" ? "Video URL" : "Audio URL"} (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={`https://example.com/${form.watch("media_type")}-file`}
                              className="bg-background border-primary/30 focus:border-primary/60"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Testimony
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Alert className="bg-primary/10 border-primary/30 mt-8">
            <Info className="w-5 h-5 text-primary" />
            <AlertDescription className="text-muted-foreground font-inter">
              <strong className="text-primary">Moderation Notice:</strong> All testimonies are reviewed before publishing to ensure respectful and uplifting content that honors our Christian values.
            </AlertDescription>
          </Alert>
        </div>
      </main>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              Please sign in to submit your testimony.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => setShowLoginModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignIn}>
              Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default TestimoniesSubmit;