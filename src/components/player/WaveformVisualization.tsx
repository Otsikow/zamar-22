
import React, { useEffect, useState } from 'react';
import { useNowPlaying } from '@/contexts/NowPlayingContext';

interface WaveformVisualizationProps {
  className?: string;
}

const WaveformVisualization: React.FC<WaveformVisualizationProps> = ({ className }) => {
  const { state } = useNowPlaying();
  const [bars, setBars] = useState<number[]>([]);

  // Generate initial random bars
  useEffect(() => {
    const initialBars = Array.from({ length: 60 }, () => Math.random() * 0.3 + 0.1);
    setBars(initialBars);
  }, []);

  // Animate bars when playing - more responsive animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.isPlaying && state.currentSong) {
      interval = setInterval(() => {
        setBars(prev => prev.map(() => Math.random() * 0.9 + 0.3));
      }, 100); // Faster updates for more responsive animation
    } else {
      // When not playing, set to low static bars
      setBars(prev => prev.map(() => Math.random() * 0.2 + 0.05));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isPlaying, state.currentSong]);

  return (
    <div className={`flex items-end justify-center h-24 gap-1 ${className}`}>
      {bars.map((height, index) => (
        <div
          key={index}
          className={`bg-gradient-to-t from-primary to-primary/60 rounded-sm transition-all duration-100 ${
            state.isPlaying ? 'animate-pulse' : ''
          }`}
          style={{
            height: `${height * 100}%`,
            width: '3px',
            minHeight: '2px',
            transform: state.isPlaying ? `scaleY(${0.8 + Math.random() * 0.4})` : 'scaleY(1)',
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualization;
