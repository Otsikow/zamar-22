import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LogIn, UserPlus, Lightbulb } from "lucide-react";

interface AuthRequiredSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthRequiredSheet = ({ open, onOpenChange }: AuthRequiredSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Lightbulb className="h-8 w-8 text-primary" />
          </div>
          <SheetTitle className="text-xl">Join Our Community</SheetTitle>
          <SheetDescription className="text-base">
            Sign in to share your song ideas and help shape our worship collection
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <Button asChild size="lg" className="w-full gap-2">
            <Link to="/auth" onClick={() => onOpenChange(false)}>
              <LogIn className="h-5 w-5" />
              Sign In
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="w-full gap-2">
            <Link to="/auth" onClick={() => onOpenChange(false)}>
              <UserPlus className="h-5 w-5" />
              Create Free Account
            </Link>
          </Button>

          <div className="bg-muted/50 p-4 rounded-2xl mt-6">
            <h4 className="font-medium mb-2 text-sm">Why join Zamar?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Suggest songs that inspire you</li>
              <li>• Get credited when your ideas become songs</li>
              <li>• Build your personal library</li>
              <li>• Join a community of faith-driven music lovers</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};