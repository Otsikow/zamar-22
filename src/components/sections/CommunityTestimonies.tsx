import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Quote, User, Calendar, Play, Volume2, Video, ArrowRight, 
  Search, MapPin, Heart, RotateCcw, ChevronLeft, ChevronRight,
  Flag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

interface FilterState {
  region: string;
  userType: string;
  search: string;
  page: number;
}

const REGIONS = [
  'All',
  'USA', 
  'Africa',
  'Europe', 
  'Asia',
  'Latin America'
];

const USER_TYPES = [
  'All',
  'Church Leaders',
  'Artists', 
  'Students',
  'Families'
];

const SHORT_QUOTES = [
  "Music that touches the soul and lifts the spirit.",
  "Where worship meets artistry, lives are transformed.",
  "Every song is a prayer, every lyric a blessing.",
  "Faith expressed through melodies that heal hearts.",
  "Discovering God's love through beautiful music.",
  "Songs that speak when words aren't enough."
];

const COUNTRY_MAPPINGS = {
  'USA': ['USA', 'United States', 'US', 'America'],
  'Africa': [
    'Ghana', 'Nigeria', 'Kenya', 'South Africa', 'Uganda', 'Tanzania', 
    'Rwanda', 'Ethiopia', 'Zimbabwe', 'Zambia', 'Cameroon', 'Ivory Coast',
    'Senegal', 'Botswana', 'Namibia', 'Malawi', 'Mozambique'
  ],
  'Europe': [
    'UK', 'United Kingdom', 'England', 'Scotland', 'Wales', 'Ireland',
    'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'Netherlands',
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland'
  ],
  'Asia': [
    'India', 'Philippines', 'Singapore', 'Malaysia', 'Indonesia', 'China',
    'Japan', 'South Korea', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Thailand'
  ],
  'Latin America': [
    'Brazil', 'Mexico', 'Colombia', 'Argentina', 'Peru', 'Chile',
    'Ecuador', 'Guatemala', 'Dominican Republic', 'Venezuela', 'Uruguay'
  ]
};

const CommunityTestimonies = () => {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [mediaTestimonies, setMediaTestimonies] = useState<Testimony[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    region: 'All',
    userType: 'All', 
    search: '',
    page: 1
  });
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedTestimony, setSelectedTestimony] = useState<Testimony | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const PAGE_SIZE = 12;

  useEffect(() => {
    fetchTestimonies();
    fetchMediaTestimonies();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('community-testimonies')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'testimonies' },
        () => {
          fetchTestimonies();
          fetchMediaTestimonies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters]);

  const buildWhereClause = () => {
    const conditions = [];

    // Region filter
    if (filters.region !== 'All') {
      const countries = COUNTRY_MAPPINGS[filters.region as keyof typeof COUNTRY_MAPPINGS] || [];
      if (countries.length > 0) {
        const countryConditions = countries.map(country => 
          `country ILIKE '%${country}%'`
        ).join(' OR ');
        conditions.push(`(${countryConditions})`);
      }
    }

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.trim();
      conditions.push(
        `(display_name ILIKE '%${searchTerm}%' OR country ILIKE '%${searchTerm}%' OR message ILIKE '%${searchTerm}%')`
      );
    }

    return conditions.length > 0 ? conditions.join(' AND ') : '';
  };

  const fetchTestimonies = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from("public_testimonies")
        .select("*", { count: 'exact' })
        .order("published_at", { ascending: false });

      const whereClause = buildWhereClause();
      if (whereClause) {
        // Since we can't use raw SQL, we'll need to apply filters differently
        // For now, we'll fetch all and filter client-side for complex conditions
        const { data: allData, error: allError } = await query;
        if (allError) throw allError;

        let filteredData = allData || [];

        // Apply region filter
        if (filters.region !== 'All') {
          const countries = COUNTRY_MAPPINGS[filters.region as keyof typeof COUNTRY_MAPPINGS] || [];
          filteredData = filteredData.filter(item => 
            countries.some(country => 
              item.country?.toLowerCase().includes(country.toLowerCase())
            )
          );
        }

        // Apply search filter
        if (filters.search.trim()) {
          const searchTerm = filters.search.trim().toLowerCase();
          filteredData = filteredData.filter(item =>
            item.display_name?.toLowerCase().includes(searchTerm) ||
            item.country?.toLowerCase().includes(searchTerm) ||
            item.message?.toLowerCase().includes(searchTerm)
          );
        }

        setTotalCount(filteredData.length);
        
        // Apply pagination
        const startIndex = (filters.page - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        setTestimonies(filteredData.slice(startIndex, endIndex));
      } else {
        const { data, error, count } = await query
          .range((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE - 1);

        if (error) throw error;
        setTestimonies(data || []);
        setTotalCount(count || 0);
      }
    } catch (error: any) {
      console.error("Error fetching testimonies:", error);
      setError("Couldn't load testimonies. Please retry.");
      toast({
        title: "Error",
        description: "Couldn't load testimonies. Please retry.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMediaTestimonies = async () => {
    try {
      const { data, error } = await supabase
        .from("public_testimonies")
        .select("*")
        .not('media_url', 'is', null)
        .order("published_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      setMediaTestimonies(data || []);
    } catch (error: any) {
      console.error("Error fetching media testimonies:", error);
    }
  };

  const handleSearchChange = (value: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    }, 300);

    setSearchTimeout(timeout);
  };

  const handleFilterChange = (type: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [type]: value, page: 1 }));
  };

  const handleShareTestimony = () => {
    if (user) {
      navigate('/testimonies/submit');
    } else {
      navigate('/auth');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const truncateMessage = (message: string, maxLength: number = 280) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, 240) + "...";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  const ShortQuoteCard = ({ quote }: { quote: string }) => (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 h-full flex items-center justify-center">
      <CardContent className="p-6 text-center">
        <Quote className="w-8 h-8 text-primary mx-auto mb-4 opacity-60" />
        <p className="text-lg font-bold italic text-foreground leading-relaxed max-w-sm">
          "{quote}"
        </p>
      </CardContent>
    </Card>
  );

  const TestimonyCard = ({ testimony, index }: { testimony: Testimony; index: number }) => {
    const needsReadMore = testimony.message.length > 280;

    return (
      <Card className="bg-card border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg h-full">
        <CardContent className="p-4 sm:p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                {getInitials(testimony.display_name)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground text-sm truncate">
                    {testimony.display_name}
                  </h4>
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                    Verified User
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatTimeAgo(testimony.published_at || testimony.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Icon Background */}
          <div className="relative mb-4 flex-1">
            <Quote className="absolute top-0 right-0 w-16 h-16 text-primary/5 -z-10" />
            
            {/* Message */}
            <blockquote className="text-foreground leading-relaxed text-sm">
              {needsReadMore ? truncateMessage(testimony.message) : testimony.message}
              {needsReadMore && (
                <Dialog>
                  <DialogTrigger asChild>
                    <button 
                      className="text-primary hover:text-primary/80 ml-2 font-medium underline"
                      onClick={() => setSelectedTestimony(testimony)}
                    >
                      Read more
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs">
                          {getInitials(testimony.display_name)}
                        </div>
                        {testimony.display_name} — {testimony.country}
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        Published {formatTimeAgo(testimony.published_at || testimony.created_at)}
                      </p>
                    </DialogHeader>
                    
                    <div className="mt-4">
                      <blockquote className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {testimony.message}
                      </blockquote>
                      
                      {testimony.media_url && (
                        <div className="mt-6">
                          {testimony.media_type === 'video' ? (
                            <video 
                              controls 
                              className="w-full rounded-lg"
                              style={{ aspectRatio: '16/9' }}
                              src={testimony.media_url}
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : testimony.media_type === 'audio' ? (
                            <div className="bg-primary/10 p-4 rounded-lg">
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
                      
                      <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
                        <span>Share this testimony</span>
                        <button 
                          className="flex items-center gap-1 hover:text-destructive transition-colors"
                          onClick={() => {
                            window.location.href = 'mailto:info@zamarsongs.com?subject=Report Testimony';
                          }}
                        >
                          <Flag className="w-3 h-3" />
                          Report
                        </button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </blockquote>
          </div>

          {/* Media */}
          {testimony.media_url && (
            <div className="mb-4">
              {testimony.media_type === 'video' ? (
                <div className="relative group cursor-pointer">
                  <video 
                    className="w-full h-32 object-cover rounded-lg bg-accent"
                    src={testimony.media_url}
                    muted
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg group-hover:bg-black/30 transition-colors">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              ) : testimony.media_type === 'audio' ? (
                <div className="bg-primary/10 p-3 rounded-lg flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-primary" />
                  <span className="text-sm text-foreground">Audio testimony</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs">
            {testimony.country && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{testimony.country}</span>
              </div>
            )}
            
            <Badge 
              variant="outline" 
              className="text-primary border-primary/30 bg-primary/5"
            >
              {getMediaIcon(testimony.media_type)}
              <span className="ml-1 capitalize">{testimony.media_type}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGrid = () => {
    const items = [];
    
    for (let i = 0; i < testimonies.length; i++) {
      items.push(
        <TestimonyCard key={testimonies[i].id} testimony={testimonies[i]} index={i} />
      );
      
      // Add short quote card after every 4th item (not on mobile)
      if ((i + 1) % 4 === 0 && i < testimonies.length - 1) {
        const quoteIndex = Math.floor(i / 4) % SHORT_QUOTES.length;
        items.push(
          <div key={`quote-${i}`} className="hidden lg:block">
            <ShortQuoteCard quote={SHORT_QUOTES[quoteIndex]} />
          </div>
        );
      }
    }
    
    return items;
  };

  const startIndex = (filters.page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(filters.page * PAGE_SIZE, totalCount);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <section id="testimonies-section" className="pt-16 pb-16 bg-background dark:bg-[#0d0d0f] light:bg-[#fafafa]">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-extrabold text-foreground mb-4">
            <span className="relative">
              Community Testimonies
              <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-[#d4af37] to-[#f7d794] rounded-full"></span>
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-inter">
            Discover how Zamar is touching lives around the world
          </p>
        </div>

        {/* Action Bar */}
        <div className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Region Pills */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {REGIONS.map((region) => (
                <Button
                  key={region}
                  variant={filters.region === region ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange('region', region)}
                  className={cn(
                    "whitespace-nowrap",
                    filters.region === region && "bg-primary text-primary-foreground"
                  )}
                >
                  {region}
                </Button>
              ))}
            </div>
            
            {/* Type Pills */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {USER_TYPES.map((type) => (
                <Button
                  key={type}
                  variant={filters.userType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange('userType', type)}
                  className={cn(
                    "whitespace-nowrap",
                    filters.userType === type && "bg-primary text-primary-foreground"
                  )}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Search and CTA */}
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by name, country, or keywords..."
                className="pl-10 w-full lg:w-80"
                defaultValue={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            
            <Button onClick={handleShareTestimony} className="whitespace-nowrap">
              Share My Testimony
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-accent rounded mb-4"></div>
                  <div className="h-20 bg-accent rounded mb-4"></div>
                  <div className="h-4 bg-accent rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-destructive mb-4">{error}</div>
            <Button onClick={fetchTestimonies} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && testimonies.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No testimonies found. Try clearing filters or share yours.</p>
            <Button onClick={handleShareTestimony}>
              Share Your Testimony
            </Button>
          </div>
        )}

        {/* Testimonies Grid */}
        {!isLoading && !error && testimonies.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {renderGrid()}
            </div>

            {/* Pagination Info */}
            <div className="text-center text-sm text-muted-foreground mb-6">
              Viewing {startIndex}–{endIndex} of {totalCount} testimonies
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mb-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={filters.page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={filters.page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, page: pageNum }))}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={filters.page === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Praise in Motion Carousel */}
        {mediaTestimonies.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-playfair font-bold text-foreground text-center mb-8">
              Praise in Motion
            </h3>
            
            <div className="relative max-w-6xl mx-auto">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {mediaTestimonies.map((testimony) => (
                    <CarouselItem key={testimony.id} className="md:basis-1/2 lg:basis-1/3">
                      <TestimonyCard testimony={testimony} index={0} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            </div>
          </div>
        )}

        {/* Bottom CTAs */}
        <div className="text-center mt-16 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={handleShareTestimony}>
              Share My Testimony
            </Button>
            
            <Link to="/testimonies">
              <Button size="lg" variant="outline" className="group">
                View All Testimonies
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground italic">
            Your story could be the reason someone keeps going.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CommunityTestimonies;