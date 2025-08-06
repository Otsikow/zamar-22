import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Heart, Volume2 } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  message: string;
  status: string;
  audio_url?: string;
  created_at: string;
}

interface TestimonyModerationPanelProps {
  testimonials: Testimonial[];
  onTestimonialAction: (id: string, action: string) => Promise<void>;
}

const TestimonyModerationPanel = ({ testimonials, onTestimonialAction }: TestimonyModerationPanelProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/50';
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
          <Heart className="h-5 w-5" />
          Testimony Moderation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {testimonials.map((testimonial) => (
            <Card 
              key={testimonial.id} 
              className="border-primary/20 bg-card/50 hover:border-primary/40 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{testimonial.name}</span>
                      <Badge className={getStatusColor(testimonial.status)}>
                        {testimonial.status.toUpperCase()}
                      </Badge>
                      {testimonial.audio_url && (
                        <Badge variant="outline" className="text-primary border-primary/50">
                          <Volume2 className="w-3 h-3 mr-1" />
                          Audio
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(testimonial.created_at)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-foreground leading-relaxed">
                        "{testimonial.message}"
                      </p>
                      
                      {testimonial.audio_url && (
                        <div className="bg-muted/20 rounded-lg p-3 border border-primary/20">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Volume2 className="w-4 h-4" />
                            Audio Testimony
                          </div>
                          <audio controls className="w-full h-8">
                            <source src={testimonial.audio_url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {testimonial.status === 'pending' && (
                    <div className="flex flex-col gap-2 lg:flex-row">
                      <Button
                        onClick={() => onTestimonialAction(testimonial.id, 'approved')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => onTestimonialAction(testimonial.id, 'rejected')}
                        size="sm"
                        variant="destructive"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {testimonials.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No testimonials found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestimonyModerationPanel;