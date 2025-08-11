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
      const { data, error } = await supabase.functions.invoke('grant-admin-once');
      if (error) throw error;
      if (data?.success) {
        toast({ title: 'Success', description: 'You are now an admin. Please reload.' });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast({ title: 'Info', description: data?.error || 'Already initialized', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to grant admin', variant: 'destructive' });
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
