import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Heart, Eye, Check, X, Copy, Clock, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/sections/Footer";

interface AdminTestimony {
  id: string;
  user_id?: string;
  display_name?: string;
  country?: string;
  message: string;
  media_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  approved_by?: string;
  approved_at?: string;
}

const AdminTestimonies = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  
  const [testimonies, setTestimonies] = useState<AdminTestimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedTestimony, setSelectedTestimony] = useState<AdminTestimony | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
      return;
    }
    if (isAdmin) {
      fetchTestimonies();
    }
  }, [isAdmin, adminLoading, navigate]);

  const fetchTestimonies = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonies(data || []);
    } catch (error: any) {
      console.error('Error fetching testimonies:', error);
      toast({
        title: "Error",
        description: "Failed to load testimonies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.rpc('approve_testimony', {
        p_testimony_id: id,
        p_admin: user.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Approved & published",
      });

      fetchTestimonies();
    } catch (error: any) {
      console.error('Error approving testimony:', error);
      toast({
        title: "Error",
        description: "Failed to approve testimony",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string, reason: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.rpc('reject_testimony', {
        p_testimony_id: id,
        p_admin: user.id,
        p_reason: reason
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rejected",
      });

      setRejectReason('');
      fetchTestimonies();
    } catch (error: any) {
      console.error('Error rejecting testimony:', error);
      toast({
        title: "Error",
        description: "Failed to reject testimony",
        variant: "destructive",
      });
    }
  };

  const copyPublicLink = (id: string) => {
    const url = `${window.location.origin}/testimonies#${id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Public testimony link copied to clipboard",
    });
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateMessage = (message: string, length = 100) => {
    return message.length > length ? message.substring(0, length) + '...' : message;
  };

  const filteredTestimonies = testimonies.filter(t => 
    activeTab === 'all' ? true : t.status === activeTab
  );

  if (adminLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">Loading...</div>
    </div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6 flex items-center justify-center gap-3">
              <Heart className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              <span className="text-transparent bg-gradient-primary bg-clip-text">
                Testimony Moderation
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto font-inter">
              Review and moderate community testimonies
            </p>
          </div>

          {/* Filters */}
          <Card className="bg-gradient-card border-border mb-8">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Testimonies Table */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="bg-gradient-card border-border animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-6 bg-accent rounded"></div>
                        <div className="w-32 h-4 bg-accent rounded"></div>
                        <div className="w-20 h-6 bg-accent rounded"></div>
                      </div>
                      <div className="h-4 bg-accent rounded w-full"></div>
                      <div className="h-4 bg-accent rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTestimonies.length === 0 ? (
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-8 text-center">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-playfair text-foreground mb-2">
                  No Testimonies Found
                </h3>
                <p className="text-muted-foreground font-inter">
                  No testimonies match the current filter.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTestimonies.map((testimony) => (
                <Card key={testimony.id} className="bg-gradient-card border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">
                            {testimony.display_name || 'Anonymous'}
                          </span>
                          {testimony.country && (
                            <Badge variant="outline" className="text-xs">
                              {testimony.country}
                            </Badge>
                          )}
                          <Badge className={getStatusColor(testimony.status)}>
                            {getStatusIcon(testimony.status)}
                            <span className="ml-1">{testimony.status.toUpperCase()}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(testimony.created_at)}
                          </span>
                        </div>
                        
                        {/* Message */}
                        <p className="text-foreground leading-relaxed">
                          "{truncateMessage(testimony.message)}"
                        </p>
                        
                        {/* Media */}
                        {testimony.media_url && (
                          <div className="bg-muted/20 rounded-lg p-3 border border-primary/20">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <ExternalLink className="w-4 h-4" />
                              Media URL
                            </div>
                            <a 
                              href={testimony.media_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm"
                            >
                              {testimony.media_url}
                            </a>
                          </div>
                        )}

                        {/* Admin Notes */}
                        {testimony.admin_notes && (
                          <div className="bg-muted/20 rounded-lg p-3 border border-muted/40">
                            <h4 className="font-medium text-foreground mb-1 text-sm">Admin Notes:</h4>
                            <p className="text-muted-foreground text-sm">{testimony.admin_notes}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-2 lg:flex-row">
                        {/* View Details */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedTestimony(testimony)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                {selectedTestimony?.display_name || 'Anonymous Testimony'}
                              </DialogTitle>
                              <DialogDescription>
                                Submitted on {selectedTestimony && formatDate(selectedTestimony.created_at)}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Message:</h4>
                                <p className="text-foreground leading-relaxed">
                                  "{selectedTestimony?.message}"
                                </p>
                              </div>
                              {selectedTestimony?.country && (
                                <div>
                                  <h4 className="font-medium mb-2">Country:</h4>
                                  <Badge variant="outline">{selectedTestimony.country}</Badge>
                                </div>
                              )}
                              {selectedTestimony?.media_url && (
                                <div>
                                  <h4 className="font-medium mb-2">Media URL:</h4>
                                  <a 
                                    href={selectedTestimony.media_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {selectedTestimony.media_url}
                                  </a>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Pending Actions */}
                        {testimony.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => handleApprove(testimony.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Testimony</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Please provide a reason for rejecting this testimony.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <Textarea
                                  placeholder="Reason for rejection..."
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  className="min-h-[100px]"
                                />
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setRejectReason('')}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleReject(testimony.id, rejectReason)}
                                    disabled={!rejectReason.trim()}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Reject
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}

                        {/* Approved Actions */}
                        {testimony.status === 'approved' && (
                          <Button
                            onClick={() => copyPublicLink(testimony.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Link
                          </Button>
                        )}
                      </div>
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

export default AdminTestimonies;