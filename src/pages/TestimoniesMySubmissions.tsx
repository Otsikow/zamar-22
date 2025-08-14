import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, Plus, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { Link, useNavigate } from "react-router-dom";
import Footer from "@/components/sections/Footer";

interface MyTestimony {
  id: string;
  display_name?: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  admin_notes?: string;
  published_at?: string;
  country?: string;
}

const TestimoniesMySubmissions = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [testimonies, setTestimonies] = useState<MyTestimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchMyTestimonies();
    }
  }, [user]);

  const fetchMyTestimonies = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('testimonies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonies(data || []);
    } catch (error: any) {
      console.error('Error fetching testimonies:', error);
      toast({
        title: "Error",
        description: "Failed to load your testimonies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/testimonies')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Testimonies
            </Button>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6 flex items-center justify-center gap-3">
              <Quote className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              <span className="text-transparent bg-gradient-primary bg-clip-text">
                My Submissions
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto font-inter">
              Track the status of your submitted testimonies
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-center mb-8">
            <Link to="/testimonies/submit">
              <Button size="lg" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Submit New Testimony
              </Button>
            </Link>
          </div>

          {/* Testimonies List */}
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-gradient-card border-border animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-6 bg-accent rounded"></div>
                        <div className="w-32 h-4 bg-accent rounded"></div>
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
          ) : testimonies.length === 0 ? (
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-8 text-center">
                <Quote className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-playfair text-foreground mb-2">
                  No Testimonies Yet
                </h3>
                <p className="text-muted-foreground font-inter mb-6">
                  You haven't submitted any testimonies yet.
                </p>
                <Link to="/testimonies/submit">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Your First Testimony
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {testimonies.map((testimony) => (
                <Card key={testimony.id} className="bg-gradient-card border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-playfair">
                        {testimony.display_name || 'Anonymous Testimony'}
                      </CardTitle>
                      <Badge className={getStatusColor(testimony.status)}>
                        {getStatusIcon(testimony.status)}
                        <span className="ml-2">{testimony.status.toUpperCase()}</span>
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Submitted: {formatDate(testimony.created_at)}
                      {testimony.published_at && (
                        <> • Published: {formatDate(testimony.published_at)}</>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-foreground leading-relaxed">
                        "{testimony.message}"
                      </p>
                      
                      {testimony.country && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Country:</span>
                          <Badge variant="outline">{testimony.country}</Badge>
                        </div>
                      )}

                      {testimony.admin_notes && (
                        <div className="bg-muted/20 rounded-lg p-4 border border-muted/40">
                          <h4 className="font-medium text-foreground mb-2">Admin Notes:</h4>
                          <p className="text-muted-foreground text-sm">{testimony.admin_notes}</p>
                        </div>
                      )}

                      {testimony.status === 'approved' && (
                        <div className="flex items-center gap-2 pt-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">Your testimony is now public!</span>
                          <Link 
                            to={`/testimonies#${testimony.id}`}
                            className="text-sm text-primary hover:underline ml-2"
                          >
                            View Public Page
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TestimoniesMySubmissions;