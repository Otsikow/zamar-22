import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SyncedLyric {
  id: string;
  line_index: number;
  time_seconds: number;
  text: string;
}

interface SyncedLyricsViewerProps {
  songId: string;
  currentTime: number;
  isPlaying: boolean;
}

const SyncedLyricsViewer = ({ songId, currentTime, isPlaying }: SyncedLyricsViewerProps) => {
  const [syncedLyrics, setSyncedLyrics] = useState<SyncedLyric[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSyncedLyrics();
  }, [songId]);

  useEffect(() => {
    if (!isPlaying || syncedLyrics.length === 0) return;

    // Find the current line based on playback time
    const currentLine = syncedLyrics.findIndex((line, index) => {
      const nextLine = syncedLyrics[index + 1];
      return currentTime >= line.time_seconds && 
             (!nextLine || currentTime < nextLine.time_seconds);
    });

    if (currentLine !== -1 && currentLine !== currentLineIndex) {
      setCurrentLineIndex(currentLine);
      
      // Auto-scroll to current line
      const lineElement = document.getElementById(`sync-line-${currentLine}`);
      if (lineElement && containerRef.current) {
        lineElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentTime, isPlaying, syncedLyrics, currentLineIndex]);

  const fetchSyncedLyrics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("synced_lyrics")
        .select("*")
        .eq("song_id", songId)
        .order("line_index");

      if (error) throw error;
      
      setSyncedLyrics(data || []);
    } catch (error) {
      console.error("Error fetching synced lyrics:", error);
      setSyncedLyrics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLineClick = (timeSeconds: number) => {
    // Emit custom event to seek to this time
    window.dispatchEvent(new CustomEvent('seekToTime', { 
      detail: { time: timeSeconds } 
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading synced lyrics...</div>
      </div>
    );
  }

  if (syncedLyrics.length === 0) {
    return null; // Fallback to regular lyrics
  }

  return (
    <div 
      ref={containerRef}
      className="h-96 overflow-y-auto scrollbar-hide space-y-1 px-4 py-6"
      style={{ scrollBehavior: 'smooth' }}
    >
      {syncedLyrics.map((line, index) => (
        <div
          key={line.id}
          id={`sync-line-${index}`}
          onClick={() => handleLineClick(line.time_seconds)}
          className={`
            cursor-pointer transition-all duration-300 py-2 px-3 rounded-lg
            ${index === currentLineIndex 
              ? 'text-primary font-bold text-lg bg-primary/10 scale-105' 
              : 'text-muted-foreground hover:text-foreground text-base opacity-80 hover:opacity-100'
            }
          `}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
};

export default SyncedLyricsViewer;