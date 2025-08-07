
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Song {
  id: string;
  title: string;
  genre: string;
  occasion: string;
  tags: string[];
  featured: boolean;
  language: string;
  audio_url?: string;
  thumbnail_url?: string;
}

interface SongEditFormProps {
  song: Song;
  onSave: (updatedSong: Song) => void;
  onCancel: () => void;
}

const SongEditForm = ({ song, onSave, onCancel }: SongEditFormProps) => {
  const [title, setTitle] = useState(song.title);
  const [genre, setGenre] = useState(song.genre);
  const [occasion, setOccasion] = useState(song.occasion);
  const [tags, setTags] = useState(song.tags.join(", "));
  const [featured, setFeatured] = useState(song.featured);
  const [language, setLanguage] = useState(song.language || "English");
  const [isLoading, setIsLoading] = useState(false);

  const languages = ["English", "Spanish", "Twi"];

  const handleFeaturedChange = (checked: boolean | "indeterminate") => {
    setFeatured(checked === true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const tagsArray = tags.split(",").map(tag => tag.trim()).filter(tag => tag);
      
      const { error } = await supabase
        .from("songs")
        .update({
          title,
          genre,
          occasion,
          tags: tagsArray,
          featured,
          language
        })
        .eq("id", song.id);

      if (error) throw error;

      const updatedSong = {
        ...song,
        title,
        genre,
        occasion,
        tags: tagsArray,
        featured,
        language
      };

      onSave(updatedSong);
      toast.success("Song updated successfully!");
    } catch (error) {
      console.error("Error updating song:", error);
      toast.error("Failed to update song");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="text-primary">Edit Song</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-foreground">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-background border-border text-foreground"
          />
        </div>

        <div>
          <Label htmlFor="genre" className="text-foreground">Genre</Label>
          <Input
            id="genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="bg-background border-border text-foreground"
          />
        </div>

        <div>
          <Label htmlFor="occasion" className="text-foreground">Occasion</Label>
          <Input
            id="occasion"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className="bg-background border-border text-foreground"
          />
        </div>

        <div>
          <Label htmlFor="language" className="text-foreground">Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tags" className="text-foreground">Tags</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Enter tags separated by commas"
            className="bg-background border-border text-foreground"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="featured"
            checked={featured}
            onCheckedChange={handleFeaturedChange}
          />
          <Label htmlFor="featured" className="text-foreground">Featured Song</Label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SongEditForm;
