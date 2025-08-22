import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Quote, User, Calendar, Play, Volume2, Video, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Testimonial {
  id: string;
  display_name: string;
  message: string;
  media_url: string | null;
  media_type: string;
  created_at: string;
  country?: string;
}

const TestimonialsCarousel = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
    
    // Set up realtime subscription for approved testimonials
    const channel = supabase
      .channel('testimonials-carousel')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'testimonies',
          filter: 'status=eq.approved'
        },
        () => {
          fetchTestimonials();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase.rpc('testimonies_feed', {
        limit_rows: 6,
        before_time: new Date().toISOString()
      });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error: any) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const truncateMessage = (message: string, maxLength: number = 120) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Volume2 className="w-4 h-4" />;
      default:
        return <Quote className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
              Community Testimonies
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover how Zamar is touching lives around the world
            </p>
          </div>
          
          <div className="flex justify-center">
            <div className="animate-pulse">
              <div className="h-48 w-80 bg-accent rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4 flex items-center justify-center gap-3">
            <Quote className="w-8 h-8 text-primary" />
            <span className="text-transparent bg-gradient-primary bg-clip-text">
              Community Testimonies
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-inter">
            Discover how Zamar is touching lives around the world
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="bg-gradient-card border-primary/20 hover:border-primary/40 transition-colors h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-playfair font-semibold text-foreground text-sm">
                              {testimonial.display_name || "Anonymous"}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(testimonial.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1"
                        >
                          {getMediaIcon(testimonial.media_type)}
                          {testimonial.media_type || 'text'}
                        </Badge>
                      </div>

                      <blockquote className="flex-1 mb-4">
                        <Quote className="w-4 h-4 text-primary/30 mb-2" />
                        <p className="text-foreground font-inter leading-relaxed text-sm">
                          {truncateMessage(testimonial.message)}
                        </p>
                      </blockquote>

                      {testimonial.media_url && (
                        <div className="mb-4">
                          {testimonial.media_type === 'video' ? (
                            <div className="relative">
                              <video 
                                controls 
                                className="w-full h-32 object-cover rounded-lg bg-accent"
                                src={testimonial.media_url}
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          ) : testimonial.media_type === 'audio' ? (
                            <div className="bg-primary/10 p-4 rounded-lg">
                              <audio 
                                controls 
                                className="w-full"
                                src={testimonial.media_url}
                              >
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {testimonial.country && (
                        <div className="text-xs text-muted-foreground">
                          📍 {testimonial.country}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>

        <div className="text-center mt-12">
          <Link to="/testimonies">
            <Button size="lg" variant="outline" className="group">
              View All Testimonies
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;