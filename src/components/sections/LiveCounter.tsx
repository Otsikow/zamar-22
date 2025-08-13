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
        await supabase.from('active_sessions').upsert({
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
        console.log('📊 LiveCounter: Fetching active session count...');
        // Use secure function that only returns count, no sensitive data
        const { data, error } = await supabase.rpc('get_active_session_count', { 
          minutes_threshold: 2 // 2 minutes threshold for active sessions
        });
        
        if (error) {
          console.error('📊 LiveCounter: RPC error:', error);
          throw error;
        }
        
        console.log('📊 LiveCounter: Active users count:', data);
        setActiveUsers(data || 0);
        setLoading(false);
      } catch (error) {
        console.error('📊 LiveCounter: Error fetching active users:', error);
        // Set a default value and stop loading even on error
        setActiveUsers(0);
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
    return <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Globe className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm font-inter">Loading...</span>
        </div>
      </div>;
  }
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Globe className="h-5 w-5 text-primary" />
        <span className="text-sm font-inter">{activeUsers} online now</span>
      </div>
    </div>
  );
};
export default LiveCounter;