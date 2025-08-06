import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Cross, Upload, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Footer from "@/components/sections/Footer";

const formSchema = z.object({
  occasion: z.string().min(1, "Please select an occasion"),
  styleGenre: z.string().min(1, "Please select a style/genre"),
  language: z.string().optional(),
  keyMessage: z.string().min(10, "Please provide at least 10 characters for your key message"),
  scriptureQuote: z.string().optional(),
  tier: z.string().min(1, "Tier is required"),
});

type FormData = z.infer<typeof formSchema>;

const RequestSong = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      occasion: "",
      styleGenre: "",
      language: "",
      keyMessage: "",
      scriptureQuote: "",
      tier: searchParams.get("tier") || "basic",
    },
  });

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to make a custom song request.",
          variant: "destructive",
        });
        navigate("/auth"); // Redirect to auth page when it's created
        return;
      }
      setUser(session.user);
      setIsCheckingAuth(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setIsCheckingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit your request.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("custom_song_requests")
        .insert({
          user_id: user.id,
          occasion: data.occasion,
          style_genre: data.styleGenre,
          language: data.language || null,
          key_message: data.keyMessage,
          scripture_quote: data.scriptureQuote || null,
          tier: data.tier,
        });

      if (error) throw error;

      toast({
        title: "Request Submitted!",
        description: "Your custom song request has been submitted successfully.",
      });

      // Redirect to thank you page
      navigate("/thank-you");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link to="/pricing">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pricing
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
              Custom Song{" "}
              <span className="text-transparent bg-gradient-primary bg-clip-text">
                Request
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-inter">
              Tell us your story, and we'll craft a personalized song just for you.
              Every detail matters in creating your perfect musical moment.
            </p>
          </div>

          {/* Request Form */}
          <Card className="bg-gradient-card border-border mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-playfair text-foreground">
                Your Song Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Occasion */}
                  <FormField
                    control={form.control}
                    name="occasion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-inter font-medium">
                          Occasion *
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="Select your occasion" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="birthday">Birthday</SelectItem>
                            <SelectItem value="wedding">Wedding</SelectItem>
                            <SelectItem value="funeral">Funeral</SelectItem>
                            <SelectItem value="church">Church</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Style/Genre */}
                  <FormField
                    control={form.control}
                    name="styleGenre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-inter font-medium">
                          Style/Genre *
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="Choose your preferred style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gospel">Gospel</SelectItem>
                            <SelectItem value="afrobeats">Afrobeats</SelectItem>
                            <SelectItem value="rnb">R&B</SelectItem>
                            <SelectItem value="classical">Classical</SelectItem>
                            <SelectItem value="rap">Rap</SelectItem>
                            <SelectItem value="reggae">Reggae</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Language */}
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-inter font-medium">
                          Language (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., English, Yoruba"
                            className="bg-background border-border"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Key Message/Story */}
                  <FormField
                    control={form.control}
                    name="keyMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-inter font-medium">
                          Key Message/Story *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us your story... What message do you want to convey? What emotions should the song capture? This is the heart of your request."
                            className="bg-background border-border min-h-[120px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Scripture/Quote */}
                  <FormField
                    control={form.control}
                    name="scriptureQuote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-inter font-medium">
                          Scripture/Quote (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Any scripture verse or meaningful quote to include"
                            className="bg-background border-border"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Upload Reference (placeholder for future file upload) */}
                  <div className="space-y-2">
                    <label className="text-foreground font-inter font-medium text-sm">
                      Upload Reference (Optional)
                    </label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Voice note, poem, or reference file (Coming soon)
                      </p>
                    </div>
                  </div>

                  {/* Hidden Tier Field */}
                  <FormField
                    control={form.control}
                    name="tier"
                    render={({ field }) => (
                      <input type="hidden" {...field} />
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full md:w-auto"
                    disabled={isLoading}
                  >
                    {isLoading ? "Submitting..." : "Continue to Payment"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Faith Disclaimer */}
          <Alert className="bg-accent/20 border-primary/20">
            <Cross className="w-5 h-5 text-primary" />
            <AlertDescription className="text-muted-foreground font-inter">
              <strong className="text-primary">Faith-Based Platform:</strong> As a Christian platform, 
              we reserve the right to decline song requests that conflict with our values.
            </AlertDescription>
          </Alert>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RequestSong;