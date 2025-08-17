import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Crown, Sparkles, Heart } from "lucide-react";

interface UpgradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeSheet = ({ open, onOpenChange }: UpgradeSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <SheetTitle className="text-xl">Become a Supporter</SheetTitle>
          <SheetDescription className="text-base">
            Support our mission and unlock the ability to suggest songs that inspire you
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-2xl border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-primary">Supporter Benefits</h4>
            </div>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary/70" />
                Suggest songs and get credited
              </li>
              <li className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary/70" />
                Ad-free listening experience
              </li>
              <li className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary/70" />
                Support faith-based music creation
              </li>
              <li className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary/70" />
                Early access to new releases
              </li>
            </ul>
          </div>

          <Button asChild size="lg" className="w-full gap-2">
            <Link to="/pricing" onClick={() => onOpenChange(false)}>
              <Crown className="h-5 w-5" />
              Go Ad-Free & Suggest
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full" 
            onClick={() => onOpenChange(false)}
          >
            Maybe Later
          </Button>

          <div className="bg-muted/50 p-4 rounded-2xl mt-6">
            <p className="text-xs text-muted-foreground text-center">
              Your support helps us create more faith-inspired music and reach more hearts with worship
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};