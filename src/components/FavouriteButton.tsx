import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Props {
  songId: string;
  size?: "sm" | "md";
  className?: string;
}

export default function FavouriteButton({ songId, size = "sm", className }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(user?.id ?? null);
      if (!user?.id) return;
      try {
        const { data, error } = await (supabase.from as any)("user_favourites")
          .select("id")
          .eq("user_id", user.id)
          .eq("song_id", songId)
          .maybeSingle();
        if (error) console.debug("favourites check error", error);
        setIsFav(!!data);
      } catch (e) {
        console.debug("favourites check failed", e);
      }
    })();
    return () => { mounted = false };
  }, [songId]);

  const toggleFavourite = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!userId) {
      toast({ title: "Sign in required", description: "Please sign in to save favourites." });
      navigate("/auth");
      return;
    }
    setLoading(true);
    try {
      if (isFav) {
        const { error } = await (supabase.from as any)("user_favourites")
          .delete()
          .eq("user_id", userId)
          .eq("song_id", songId);
        if (error) {
          console.error("Favourite delete error", error);
          toast({ title: "Could not remove from Favourites", description: error.message, variant: "destructive" });
          return;
        }
        setIsFav(false);
        window.dispatchEvent(new CustomEvent('favourites:changed', { detail: { songId, added: false } }));
        toast({ title: "Removed from Favourites" });
      } else {
        const { error } = await (supabase.from as any)("user_favourites")
          .insert({ user_id: userId, song_id: songId });
        if (error) {
          console.error("Favourite insert error", error);
          toast({ title: "Could not add to Favourites", description: error.message, variant: "destructive" });
          return;
        }
        setIsFav(true);
        window.dispatchEvent(new CustomEvent('favourites:changed', { detail: { songId, added: true } }));
        toast({ title: "Added to Favourites" });
      }
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-pressed={isFav}
      aria-label={isFav ? "Remove from Favourites" : "Add to Favourites"}
      disabled={loading}
      onClick={toggleFavourite}
      className={`rounded-full bg-background/70 hover:bg-background/90 border border-border ${sizeClasses} ${className || ""}`}
    >
      <Heart className={`w-4 h-4 ${isFav ? "text-primary fill-current" : "text-muted-foreground"}`} />
    </Button>
  );
}
