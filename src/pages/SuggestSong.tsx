import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Send } from "lucide-react";

const SuggestSong = () => {
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
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to suggest a song",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title && !formData.description) {
      toast({
        title: "Missing Information", 
        description: "Please provide either a title or description for your suggestion",
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
          description: formData.description || null,
          scripture_reference: formData.scripture_reference || null,
          preferred_language: formData.preferred_language
        });

      if (error) throw error;

      toast({
        title: "Suggestion Submitted!",
        description: "Thank you for your suggestion. Our team will review it soon."
      });

      navigate("/");
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your suggestion. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Lightbulb className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-3xl font-bold">Suggest a Song</h1>
        </div>
        <p className="text-muted-foreground">
          Help shape our worship collection! Share your ideas for new songs you'd love to hear.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Send className="h-5 w-5 mr-2" />
            Your Suggestion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Song Title (Optional)
              </label>
              <Input
                id="title"
                placeholder="Enter a title for your suggested song..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="description"
                placeholder="Describe the song you'd like to hear. What themes, message, or feeling should it convey?"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[120px]"
              />
            </div>

            <div>
              <label htmlFor="scripture" className="block text-sm font-medium mb-2">
                Scripture Reference (Optional)
              </label>
              <Input
                id="scripture"
                placeholder="e.g., Psalm 23:1-3, John 3:16"
                value={formData.scripture_reference}
                onChange={(e) => setFormData(prev => ({ ...prev, scripture_reference: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                If your suggestion is inspired by a specific Bible verse or passage
              </p>
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium mb-2">
                Preferred Language
              </label>
              <Select 
                value={formData.preferred_language} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_language: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="Portuguese">Portuguese</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">What happens next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Our team will review your suggestion</li>
                <li>• If we create a song based on your idea, you'll be credited</li>
                <li>• Your name will appear as "Inspired by [Your Name]" on the song</li>
                <li>• Thank you for helping shape our worship music!</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !user}
            >
              {isSubmitting ? "Submitting..." : "Submit Suggestion"}
            </Button>
            
            {!user && (
              <p className="text-center text-sm text-muted-foreground">
                Please sign in to submit a suggestion
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuggestSong;