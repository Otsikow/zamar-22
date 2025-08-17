import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Send, Upload } from "lucide-react";

interface SuggestSongModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SuggestSongModal = ({ open, onOpenChange }: SuggestSongModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scripture_reference: "",
    preferred_language: "English"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validation
    if (formData.description.length < 20) {
      toast({
        title: "Description Required",
        description: "Please provide at least 20 characters describing your song idea.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.scripture_reference.trim()) {
      toast({
        title: "Scripture Reference Required",
        description: "Please provide a scripture reference for inspiration.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("song_suggestions")
        .insert({
          user_id: user.id,
          title: formData.title || null,
          description: formData.description,
          scripture_reference: formData.scripture_reference,
          preferred_language: formData.preferred_language,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Suggestion submitted 🎉",
        description: "Thank you! Your suggestion was received. We'll review it prayerfully."
      });

      onOpenChange(false);
      navigate("/library/suggestions");
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        scripture_reference: "",
        preferred_language: "English"
      });
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast({
        title: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ zIndex: 9999 }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto !z-[9999]">
          <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Suggest a Song
          </DialogTitle>
          <DialogDescription>
            Share your inspiration for a new worship song. Help shape our collection!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Song Title (Optional)</Label>
            <Input
              id="title"
              placeholder="Enter a title for your suggested song..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Theme / Inspiration <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the song you'd like to hear. What themes, message, or feeling should it convey? (minimum 20 characters)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/20 minimum characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scripture">
              Scripture Reference <span className="text-destructive">*</span>
            </Label>
            <Input
              id="scripture"
              placeholder="e.g., Psalm 91, John 3:16"
              value={formData.scripture_reference}
              onChange={(e) => setFormData(prev => ({ ...prev, scripture_reference: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Which Bible verse or passage inspires this song idea?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Preferred Language</Label>
            <Select 
              value={formData.preferred_language} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_language: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border z-[10000]">
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="German">German</SelectItem>
                <SelectItem value="Italian">Italian</SelectItem>
                <SelectItem value="Portuguese">Portuguese</SelectItem>
                <SelectItem value="Russian">Russian</SelectItem>
                <SelectItem value="Chinese">Chinese</SelectItem>
                <SelectItem value="Japanese">Japanese</SelectItem>
                <SelectItem value="Arabic">Arabic</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 p-4 rounded-2xl">
            <h4 className="font-medium mb-2 text-sm">What happens next?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Our team will review your suggestion prayerfully</li>
              <li>• If we create a song based on your idea, you'll be credited</li>
              <li>• Your name will appear as "Inspired by [Your Name]" on the song</li>
              <li>• Thank you for helping shape our worship music!</li>
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || formData.description.length < 20 || !formData.scripture_reference.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit Suggestion"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};