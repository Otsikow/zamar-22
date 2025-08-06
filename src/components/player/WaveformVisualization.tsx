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
    const initialBars = Array.from({ length: 60 }, () => Math.random() * 0.5 + 0.1);
    setBars(initialBars);
  }, []);

  // Animate bars when playing
  useEffect(() => {
    if (!state.isPlaying) return;

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 0.8 + 0.2));
    }, 150);

    return () => clearInterval(interval);
  }, [state.isPlaying]);

  // Static bars when paused
  useEffect(() => {
    if (state.isPlaying) return;

    setBars(prev => prev.map(() => Math.random() * 0.4 + 0.1));
  }, [state.isPlaying]);

  return (
    <div className={`flex items-center justify-center h-24 gap-1 ${className}`}>
      {bars.map((height, index) => (
        <div
          key={index}
          className={`bg-gradient-to-t from-primary to-primary/60 rounded-sm transition-all duration-150 ${
            state.isPlaying ? 'animate-pulse' : ''
          }`}
          style={{
            height: `${height * 100}%`,
            width: '3px',
            minHeight: '4px',
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualization;