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

      const { data, error } = await supabase.functions.invoke('grant-admin-once', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Function invoke error:', error);
        throw error;
      }
      
      if (data?.success) {
        toast({ 
          title: 'Success', 
          description: 'Admin privileges granted! The page will reload.' 
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast({ 
          title: 'Notice', 
          description: data?.error || 'Admin already exists or operation failed', 
          variant: 'destructive' 
        });
      }
    } catch (e: any) {
      console.error('Grant admin error:', e);
      toast({ 
        title: 'Error', 
        description: e?.message || 'Failed to grant admin privileges', 
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
