import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function GrantAdminOnce() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGrant = async () => {
    try {
      setLoading(true);
      
      // Get the current session for authorization
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast({ 
          title: 'Error', 
          description: 'You must be logged in to grant admin privileges', 
          variant: 'destructive' 
        });
        return;
      }

      // Make raw fetch call to handle non-200 status codes properly
      const supabaseUrl = "https://wtnebvhrjnpygkftjreo.supabase.co";
      const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bmVidmhyam5weWdrZnRqcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTgyMTEsImV4cCI6MjA2OTg5NDIxMX0.wvJKP1_ElkexhVY84VPYT_FjTEx_f-kYYJIW_y5XReg";
      
      const response = await fetch(`${supabaseUrl}/functions/v1/grant-admin-once`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({}),
      });

      const responseData = await response.json();
      
      if (response.ok && responseData?.success) {
        toast({ 
          title: 'Success', 
          description: 'Admin privileges granted! The page will reload.' 
        });
        setTimeout(() => window.location.reload(), 1500);
      } else if (response.status === 403) {
        // Admin already exists - this is expected behavior
        toast({ 
          title: 'Information', 
          description: 'An admin user already exists. Only the first user can claim admin privileges.',
          variant: 'default'
        });
      } else if (response.status === 401) {
        toast({ 
          title: 'Authentication Error', 
          description: 'Please log in first to claim admin privileges.',
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Error', 
          description: responseData?.error || `Server returned status ${response.status}`,
          variant: 'destructive' 
        });
      }
    } catch (e: any) {
      console.error('Grant admin error:', e);
      toast({ 
        title: 'Network Error', 
        description: e?.message || 'Failed to connect to server', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border border-primary/30">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="text-sm">
          <div className="font-medium">First-time setup</div>
          <div className="text-muted-foreground">Grant your account admin if no admin exists yet.</div>
        </div>
        <Button onClick={handleGrant} disabled={loading}>
          <ShieldCheck className="h-4 w-4 mr-2" /> {loading ? 'Granting…' : 'Grant me admin'}
        </Button>
      </CardContent>
    </Card>
  );
}
