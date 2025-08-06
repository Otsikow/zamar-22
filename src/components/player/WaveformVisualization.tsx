
import React, { useEffect, useState } from 'react';
import { useNowPlaying } from '@/contexts/NowPlayingContext';

interface WaveformVisualizationProps {
  className?: string;
}

interface Bar {
  height: number;
  colorIndex: number;
}

const WaveformVisualization: React.FC<WaveformVisualizationProps> = ({ className }) => {
  const { state } = useNowPlaying();
  const [bars, setBars] = useState<Bar[]>([]);

  // Color palette for different pitches/moods
  const colorClasses = [
    'bg-gradient-to-t from-red-500 to-red-300',      // Deep/Bass
    'bg-gradient-to-t from-orange-500 to-orange-300', // Low-mid
    'bg-gradient-to-t from-yellow-500 to-yellow-300', // Mid
    'bg-gradient-to-t from-green-500 to-green-300',   // High-mid
    'bg-gradient-to-t from-blue-500 to-blue-300',     // High
    'bg-gradient-to-t from-purple-500 to-purple-300', // Treble
    'bg-gradient-to-t from-pink-500 to-pink-300',     // Very high
    'bg-gradient-to-t from-primary to-primary/60',    // Zamar gold
  ];

  // Generate initial bars with varied colors
  useEffect(() => {
    const initialBars = Array.from({ length: 60 }, (_, index) => ({
      height: Math.random() * 0.3 + 0.1,
      colorIndex: Math.floor(Math.random() * colorClasses.length)
    }));
    setBars(initialBars);
  }, []);

  // Animate bars when playing - simulate frequency analysis
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.isPlaying && state.currentSong) {
      interval = setInterval(() => {
        setBars(prev => prev.map((_, index) => {
          // Simulate different frequency bands
          const bassWeight = index < 10 ? 1.2 : 0.8; // Lower indices = bass
          const midWeight = index >= 10 && index < 30 ? 1.3 : 0.7; // Mid frequencies
          const trebleWeight = index >= 30 ? 1.1 : 0.6; // Higher indices = treble
          
          // Create more realistic frequency distribution
          let height;
          if (index < 10) {
            // Bass frequencies - deeper, more consistent
            height = (Math.random() * 0.8 + 0.5) * bassWeight;
          } else if (index < 30) {
            // Mid frequencies - most active
            height = (Math.random() * 0.9 + 0.4) * midWeight;
          } else {
            // Treble frequencies - more sporadic
            height = (Math.random() * 0.7 + 0.3) * trebleWeight;
          }
          
          // Assign colors based on frequency band and intensity
          let colorIndex;
          if (height > 0.8) {
            colorIndex = index < 15 ? 0 : index < 35 ? 7 : 6; // Red for bass, gold for mid, pink for treble
          } else if (height > 0.6) {
            colorIndex = index < 15 ? 1 : index < 35 ? 3 : 4; // Orange for bass, green for mid, blue for treble
          } else if (height > 0.4) {
            colorIndex = index < 15 ? 2 : index < 35 ? 2 : 5; // Yellow for all mid-range
          } else {
            colorIndex = Math.floor(Math.random() * colorClasses.length); // Random for low activity
          }
          
          return {
            height: Math.min(height, 1), // Cap at 100%
            colorIndex
          };
        }));
      }, 120); // Slightly slower for more realistic feel
    } else {
      // When not playing, immediately set to very low static bars
      setBars(prev => prev.map(() => ({
        height: Math.random() * 0.15 + 0.05, // Very low bars
        colorIndex: Math.floor(Math.random() * colorClasses.length)
      })));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isPlaying, state.currentSong]);

  return (
    <div className={`flex items-end justify-center h-24 gap-1 ${className}`}>
      {bars.map((bar, index) => (
        <div
          key={index}
          className={`${colorClasses[bar.colorIndex]} rounded-sm transition-all duration-150 ${
            state.isPlaying ? 'animate-pulse' : ''
          }`}
          style={{
            height: `${bar.height * 100}%`,
            width: '3px',
            minHeight: state.isPlaying ? '4px' : '2px',
            transform: state.isPlaying 
              ? `scaleY(${0.7 + Math.random() * 0.6})` 
              : 'scaleY(0.3)', // Much smaller when not playing
            opacity: state.isPlaying ? 0.9 : 0.4, // Dimmer when not playing
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualization;
