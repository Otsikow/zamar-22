import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, Music, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SingleSongPurchaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: {
    id: string;
    title: string;
    thumbnail_url?: string | null;
  };
}

export function SingleSongPurchaseSheet({ open, onOpenChange, song }: SingleSongPurchaseSheetProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to purchase and download songs",
          variant: "destructive",
        });
        return;
      }

      // Create checkout session for single song
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          type: 'single_song',
          song_id: song.id,
          amount: 129, // £1.29 in pence
          user_id: user.id,
          metadata: {
            type: 'single_song',
            song_id: song.id,
            user_id: user.id
          }
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start purchase process",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-md">
        <SheetHeader>
          <SheetTitle className="text-2xl font-playfair text-center mb-4">
            Purchase Single Song
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Song Info */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              {song.thumbnail_url ? (
                <img 
                  src={song.thumbnail_url} 
                  alt={song.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {song.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                by Zamar Artists
              </p>
            </div>
          </div>

          {/* Package Details */}
          <div className="p-6 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground">Single Song Download</h4>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">£1.29</div>
                <div className="text-xs text-muted-foreground">one-time</div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-muted-foreground">High-quality MP3 download</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-muted-foreground">Offline listening forever</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-muted-foreground">Support Christian artists</span>
              </div>
            </div>
          </div>

          {/* Purchase Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              After purchase, the download will start automatically and the song 
              will be available in your library forever.
            </p>
          </div>
        </div>

        <SheetFooter className="mt-6 gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePurchase}
            disabled={loading}
            className="min-w-[140px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Purchase £1.29
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}