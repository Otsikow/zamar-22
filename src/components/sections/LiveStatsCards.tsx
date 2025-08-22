import { useState, useEffect } from "react";
import { Music2, Clock, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const LiveStatsCards = () => {
  const [songsCount, setSongsCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [countriesCount, setCountriesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchSongsCount = async () => {
      try {
        const { count, error } = await supabase
          .from('songs')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('Error fetching songs count:', error);
          return;
        }

        setSongsCount(count || 0);
      } catch (error) {
        console.error('Error fetching songs count:', error);
      }
    };

    const fetchOnlineCount = async () => {
      try {
        // Update current session
        const sessionId = localStorage.getItem('zamar_session_id') || crypto.randomUUID();
        localStorage.setItem('zamar_session_id', sessionId);
        
        await supabase.from('active_sessions').upsert({
          session_id: sessionId,
          last_ping: new Date().toISOString(),
          user_agent: navigator.userAgent
        }, {
          onConflict: 'session_id'
        });

        // Get active count
        const { data, error } = await supabase.rpc('get_active_session_count', { 
          minutes_threshold: 2 
        });
        
        if (error) {
          console.error('Error fetching online count:', error);
          return;
        }
        
        setOnlineUsers(data || 0);
      } catch (error) {
        console.error('Error fetching online users:', error);
      }
    };

    const fetchCountriesCount = async () => {
      try {
        const { data, error } = await supabase
          .from('public_testimonies')
          .select('country')
          .not('country', 'is', null)
          .neq('country', '');

        if (error) {
          console.error('Error fetching countries:', error);
          return;
        }

        // Count unique countries
        const uniqueCountries = new Set(
          data?.map(item => item.country).filter(Boolean) || []
        );
        
        setCountriesCount(uniqueCountries.size);
      } catch (error) {
        console.error('Error fetching countries count:', error);
      }
    };

    const fetchAllStats = async () => {
      await Promise.all([fetchSongsCount(), fetchOnlineCount(), fetchCountriesCount()]);
      setLoading(false);
    };

    // Initial fetch
    fetchAllStats();

    // Update online count every 30 seconds
    intervalId = setInterval(() => {
      fetchOnlineCount();
    }, 30000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Music2 className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Songs in the library</h3>
                <div className="w-16 h-6 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Worshippers online</h3>
                <div className="w-12 h-6 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Countries reached</h3>
                <div className="w-12 h-6 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
      <Card className="bg-card/80 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Music2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Songs in the library</h3>
              <p className="text-2xl font-bold text-primary">{songsCount.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Worshippers online</h3>
              <p className="text-2xl font-bold text-primary">{onlineUsers.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Countries reached</h3>
              <p className="text-2xl font-bold text-primary">{countriesCount.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveStatsCards;