import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LiveCounter = () => {
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateSession = async () => {
      try {
        const sessionId = localStorage.getItem('zamar_session_id') || crypto.randomUUID();
        localStorage.setItem('zamar_session_id', sessionId);

        await supabase
          .from('active_sessions')
          .upsert({
            session_id: sessionId,
            last_ping: new Date().toISOString(),
            user_agent: navigator.userAgent
          }, {
            onConflict: 'session_id'
          });
      } catch (error) {
        console.error('Error updating session:', error);
      }
    };

    const fetchActiveCount = async () => {
      try {
        const cutoffTime = new Date(Date.now() - 90 * 1000).toISOString(); // 90 seconds ago
        
        const { count, error } = await supabase
          .from('active_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('last_ping', cutoffTime);

        if (error) throw error;
        
        setActiveUsers(count || 0);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching active users:', error);
        setLoading(false);
      }
    };

    // Initial session update and count fetch
    updateSession().then(fetchActiveCount);

    // Update session every 30 seconds
    intervalId = setInterval(() => {
      updateSession();
      fetchActiveCount();
    }, 30000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Globe className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm font-inter">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-2 bg-card/50 backdrop-blur-sm px-6 py-3 rounded-full border border-primary/20">
        <Globe className="h-5 w-5 text-primary animate-pulse" />
        <span className="text-sm font-inter text-foreground">
          <span className="font-bold text-primary">{activeUsers}</span>{" "}
          {activeUsers === 1 ? "person is" : "people are"} listening now
        </span>
      </div>
    </div>
  );
};

export default LiveCounter;