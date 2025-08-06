import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Music } from "lucide-react";

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

interface RequestReviewPanelProps {
  requests: CustomSongRequest[];
  onRequestAction: (id: string, action: string) => Promise<void>;
}

const RequestReviewPanel = ({ requests, onRequestAction }: RequestReviewPanelProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'completed': return 'bg-primary/20 text-primary border-primary/50';
      default: return 'bg-muted/20 text-muted-foreground border-muted/50';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-primary/20 text-primary border-primary/50';
      case 'standard': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'basic': return 'bg-muted/20 text-muted-foreground border-muted/50';
      default: return 'bg-muted/20 text-muted-foreground border-muted/50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Music className="h-5 w-5" />
          Review Custom Song Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getTierColor(request.tier)}>
                        {request.tier.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(request.created_at)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-primary">Occasion:</span>
                        <span className="ml-2 text-foreground">{request.occasion}</span>
                      </div>
                      <div>
                        <span className="font-medium text-primary">Genre:</span>
                        <span className="ml-2 text-foreground">{request.style_genre}</span>
                      </div>
                      {request.language && (
                        <div>
                          <span className="font-medium text-primary">Language:</span>
                          <span className="ml-2 text-foreground">{request.language}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-primary text-sm">Key Message:</span>
                        <p className="text-foreground text-sm mt-1 leading-relaxed">
                          {request.key_message}
                        </p>
                      </div>
                      
                      {request.scripture_quote && (
                        <div>
                          <span className="font-medium text-primary text-sm">Scripture Quote:</span>
                          <p className="text-foreground text-sm mt-1 italic leading-relaxed">
                            "{request.scripture_quote}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {request.status === 'pending' && (
                    <div className="flex flex-col gap-2 lg:flex-row">
                      <Button
                        onClick={() => onRequestAction(request.id, 'approved')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => onRequestAction(request.id, 'rejected')}
                        size="sm"
                        variant="destructive"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                  
                  {request.status === 'approved' && (
                    <Button
                      onClick={() => onRequestAction(request.id, 'completed')}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Mark Completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {requests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No custom song requests found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestReviewPanel;