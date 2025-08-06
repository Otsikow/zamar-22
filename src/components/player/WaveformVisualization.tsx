
import React, { useEffect, useState } from 'react';
import { useNowPlaying } from '@/contexts/NowPlayingContext';

interface WaveformVisualizationProps {
  className?: string;
}

interface Bar {
  height: number;
  colorIndex: number;
  intensity: number;
}

const WaveformVisualization: React.FC<WaveformVisualizationProps> = ({ className }) => {
  const { state } = useNowPlaying();
  const [bars, setBars] = useState<Bar[]>([]);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Enhanced color palette for different frequencies and intensities
  const colorClasses = [
    // Bass frequencies (red spectrum)
    'bg-gradient-to-t from-red-600 via-red-400 to-red-200',
    'bg-gradient-to-t from-rose-600 via-rose-400 to-rose-200',
    // Low-mid frequencies (orange/yellow spectrum)
    'bg-gradient-to-t from-orange-600 via-orange-400 to-orange-200',
    'bg-gradient-to-t from-amber-600 via-amber-400 to-amber-200',
    'bg-gradient-to-t from-yellow-600 via-yellow-400 to-yellow-200',
    // Mid frequencies (green spectrum)
    'bg-gradient-to-t from-lime-600 via-lime-400 to-lime-200',
    'bg-gradient-to-t from-green-600 via-green-400 to-green-200',
    'bg-gradient-to-t from-emerald-600 via-emerald-400 to-emerald-200',
    // High-mid frequencies (blue spectrum)
    'bg-gradient-to-t from-cyan-600 via-cyan-400 to-cyan-200',
    'bg-gradient-to-t from-blue-600 via-blue-400 to-blue-200',
    'bg-gradient-to-t from-indigo-600 via-indigo-400 to-indigo-200',
    // Treble frequencies (purple/pink spectrum)
    'bg-gradient-to-t from-purple-600 via-purple-400 to-purple-200',
    'bg-gradient-to-t from-violet-600 via-violet-400 to-violet-200',
    'bg-gradient-to-t from-fuchsia-600 via-fuchsia-400 to-fuchsia-200',
    'bg-gradient-to-t from-pink-600 via-pink-400 to-pink-200',
    // Primary theme color for special moments
    'bg-gradient-to-t from-primary via-primary/70 to-primary/30',
  ];

  // Generate initial bars - more bars for fuller visualization
  useEffect(() => {
    const initialBars = Array.from({ length: 120 }, (_, index) => ({
      height: Math.random() * 0.2 + 0.05,
      colorIndex: Math.floor(Math.random() * colorClasses.length),
      intensity: Math.random() * 0.3 + 0.1
    }));
    setBars(initialBars);
  }, []);

  // Enhanced animation when playing - more realistic frequency simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let phaseInterval: NodeJS.Timeout;
    
    if (state.isPlaying && state.currentSong) {
      // Update animation phase for wave-like movement
      phaseInterval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 360);
      }, 50);

      interval = setInterval(() => {
        setBars(prev => prev.map((_, index) => {
          // Create wave-like patterns across the spectrum
          const waveOffset = Math.sin((index * 0.1) + (animationPhase * 0.02)) * 0.3;
          const secondaryWave = Math.cos((index * 0.05) + (animationPhase * 0.015)) * 0.2;
          
          // Simulate different frequency bands with more realistic distribution
          let baseHeight;
          let colorIndex;
          let intensity;
          
          if (index < 20) {
            // Bass frequencies - deep, powerful, consistent
            baseHeight = 0.6 + (Math.random() * 0.4) + waveOffset;
            intensity = 0.8 + (Math.random() * 0.2);
            colorIndex = Math.random() > 0.7 ? 15 : Math.floor(Math.random() * 2); // Mostly red, occasionally primary
          } else if (index < 40) {
            // Low-mid frequencies - warm tones
            baseHeight = 0.7 + (Math.random() * 0.3) + waveOffset + secondaryWave;
            intensity = 0.7 + (Math.random() * 0.3);
            colorIndex = 2 + Math.floor(Math.random() * 3); // Orange/yellow spectrum
          } else if (index < 70) {
            // Mid frequencies - most active, green spectrum
            baseHeight = 0.8 + (Math.random() * 0.2) + waveOffset * 1.5;
            intensity = 0.9 + (Math.random() * 0.1);
            colorIndex = 5 + Math.floor(Math.random() * 3); // Green spectrum
          } else if (index < 95) {
            // High-mid frequencies - blue spectrum
            baseHeight = 0.5 + (Math.random() * 0.4) + secondaryWave;
            intensity = 0.6 + (Math.random() * 0.4);
            colorIndex = 8 + Math.floor(Math.random() * 3); // Blue spectrum
          } else {
            // Treble frequencies - sparkly, purple/pink
            baseHeight = 0.3 + (Math.random() * 0.6) + waveOffset * 0.5;
            intensity = 0.5 + (Math.random() * 0.5);
            colorIndex = 11 + Math.floor(Math.random() * 4); // Purple/pink spectrum
          }

          // Add some random spikes for dynamic feel
          if (Math.random() > 0.92) {
            baseHeight *= 1.4;
            intensity = Math.min(1, intensity * 1.2);
          }

          return {
            height: Math.min(baseHeight, 1),
            colorIndex,
            intensity: Math.min(intensity, 1)
          };
        }));
      }, 80); // Faster updates for more fluid animation
    } else {
      // When not playing, gradually reduce to minimal state
      setBars(prev => prev.map(() => ({
        height: Math.random() * 0.08 + 0.02,
        colorIndex: Math.floor(Math.random() * colorClasses.length),
        intensity: 0.2 + Math.random() * 0.1
      })));
    }

    return () => {
      if (interval) clearInterval(interval);
      if (phaseInterval) clearInterval(phaseInterval);
    };
  }, [state.isPlaying, state.currentSong, animationPhase]);

  return (
    <div className={`flex items-end justify-center h-full w-full gap-0.5 px-2 py-3 ${className}`}>
      {bars.map((bar, index) => (
        <div
          key={index}
          className={`${colorClasses[bar.colorIndex]} rounded-t-sm transition-all duration-100 ${
            state.isPlaying ? 'shadow-sm' : ''
          }`}
          style={{
            height: `${bar.height * 95}%`, // Use almost full height
            width: `${100 / bars.length}%`,
            minHeight: state.isPlaying ? '3px' : '1px',
            maxHeight: '95%',
            transform: state.isPlaying 
              ? `scaleY(${0.8 + (bar.intensity * 0.4)})` 
              : 'scaleY(0.2)',
            opacity: state.isPlaying 
              ? Math.max(0.7, bar.intensity) 
              : 0.3,
            filter: state.isPlaying 
              ? `brightness(${1 + (bar.intensity * 0.3)}) saturate(${1.2})` 
              : 'brightness(0.7) saturate(0.5)',
            boxShadow: state.isPlaying && bar.intensity > 0.8 
              ? `0 0 8px ${index < 20 ? 'rgba(239, 68, 68, 0.4)' : 
                          index < 70 ? 'rgba(34, 197, 94, 0.4)' : 
                          'rgba(168, 85, 247, 0.4)'}` 
              : 'none'
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualization;
