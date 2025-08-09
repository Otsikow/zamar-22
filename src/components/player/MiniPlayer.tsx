
import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Maximize2, Shuffle, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlayerSlider from '@/components/player/PlayerSlider';
import { useNowPlaying } from '@/contexts/NowPlayingContext';
import { useNavigate } from 'react-router-dom';
import zamarLogo from '@/assets/zamar-logo.png';

const MiniPlayer: React.FC = () => {
  const { state, togglePlayPause, nextSong, previousSong, seekTo, toggleShuffle, toggleLoop } = useNowPlaying();
  const navigate = useNavigate();

  if (!state.currentSong) return null;

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (value: number[]) => {
    console.log('🎯 MiniPlayer seeking to:', value[0]);
    seekTo(value[0]);
  };

  const handleExpand = () => {
    navigate(`/player/${state.currentSong?.id}`);
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border z-40 animate-fade-in">
      {/* Interactive Progress Slider */}
      <div className="px-0 py-0 relative z-0">
        <PlayerSlider
          variant="progress"
          value={[state.currentTime || 0]}
          max={Math.max(state.currentSong?.duration || 100, 1)}
          step={0.1}
          onValueChange={handleProgressChange}
          className="w-full cursor-pointer"
          disabled={!state.currentSong?.url}
        />
      </div>
      
      {/* Player Content */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-3">
        {/* Song Cover */}
        <div className="w-10 h-10 bg-accent rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
          <img 
            src={state.currentSong.cover || zamarLogo} 
            alt="Album cover" 
            className="w-full h-full object-cover rounded-md"
          />
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate animate-fade-in">
            {state.currentSong.title}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {state.currentSong.artist}
          </div>
        </div>

        {/* Time Display */}
        <div className="text-xs text-muted-foreground hidden sm:block">
          {formatTime(state.currentTime)} / {formatTime(state.currentSong.duration)}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShuffle}
            className={`w-8 h-8 p-0 hover:bg-accent ${state.isShuffling ? 'text-primary' : ''}`}
            aria-label="Toggle shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={previousSong}
            disabled={state.queue.length === 0}
            className="w-8 h-8 p-0 hover:bg-accent"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlayPause}
            className="w-8 h-8 p-0 hover:bg-accent hover:scale-105 transition-transform"
          >
            {state.isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={nextSong}
            disabled={state.queue.length === 0}
            className="w-8 h-8 p-0 hover:bg-accent"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLoop}
            className={`w-8 h-8 p-0 hover:bg-accent ${state.isLooping ? 'text-primary' : ''}`}
            aria-label="Toggle repeat"
          >
            <Repeat className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpand}
            className="w-8 h-8 p-0 hover:bg-accent ml-1"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;
