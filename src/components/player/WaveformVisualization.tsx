
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
  const [animationFrame, setAnimationFrame] = useState(0);

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
      height: Math.random() * 0.3 + 0.1,
      colorIndex: Math.floor(Math.random() * colorClasses.length),
      intensity: Math.random() * 0.4 + 0.2
    }));
    setBars(initialBars);
  }, []);

  // Main animation effect - runs continuously when playing
  useEffect(() => {
    let animationInterval: NodeJS.Timeout;
    
    if (state.isPlaying && state.currentSong) {
      console.log('🎵 Starting waveform animation');
      
      animationInterval = setInterval(() => {
        setAnimationFrame(prev => prev + 1);
        
        setBars(prevBars => prevBars.map((_, index) => {
          // Create wave-like patterns across the spectrum
          const time = Date.now() * 0.001; // Convert to seconds
          const waveOffset = Math.sin((index * 0.08) + (time * 2)) * 0.4;
          const secondaryWave = Math.cos((index * 0.05) + (time * 1.5)) * 0.3;
          const tertiaryWave = Math.sin((index * 0.12) + (time * 2.5)) * 0.2;
          
          // Simulate different frequency bands with realistic distribution
          let baseHeight;
          let colorIndex;
          let intensity;
          
          if (index < 20) {
            // Bass frequencies - deep, powerful, slower movement
            baseHeight = 0.5 + (Math.random() * 0.4) + waveOffset * 0.8;
            intensity = 0.7 + (Math.random() * 0.3) + (waveOffset * 0.2);
            colorIndex = Math.random() > 0.8 ? 15 : Math.floor(Math.random() * 2);
          } else if (index < 40) {
            // Low-mid frequencies - warm, moderate movement
            baseHeight = 0.6 + (Math.random() * 0.35) + waveOffset + (secondaryWave * 0.5);
            intensity = 0.6 + (Math.random() * 0.4) + (waveOffset * 0.3);
            colorIndex = 2 + Math.floor(Math.random() * 3);
          } else if (index < 70) {
            // Mid frequencies - most active, dynamic movement
            baseHeight = 0.7 + (Math.random() * 0.3) + waveOffset * 1.2 + (tertiaryWave * 0.6);
            intensity = 0.8 + (Math.random() * 0.2) + (waveOffset * 0.4);
            colorIndex = 5 + Math.floor(Math.random() * 3);
          } else if (index < 95) {
            // High-mid frequencies - quick, responsive movement
            baseHeight = 0.4 + (Math.random() * 0.5) + secondaryWave * 0.9 + (tertiaryWave * 0.4);
            intensity = 0.5 + (Math.random() * 0.5) + (secondaryWave * 0.3);
            colorIndex = 8 + Math.floor(Math.random() * 3);
          } else {
            // Treble frequencies - sparkly, erratic movement
            baseHeight = 0.3 + (Math.random() * 0.6) + waveOffset * 0.7 + (tertiaryWave * 0.8);
            intensity = 0.4 + (Math.random() * 0.6) + (tertiaryWave * 0.4);
            colorIndex = 11 + Math.floor(Math.random() * 4);
          }

          // Add random spikes for dynamic feel
          if (Math.random() > 0.88) {
            baseHeight *= 1.5;
            intensity = Math.min(1, intensity * 1.3);
          }

          // Add beat-like pulses
          const beatPulse = Math.sin(time * 8) * 0.15;
          baseHeight += Math.abs(beatPulse);

          return {
            height: Math.max(0.05, Math.min(baseHeight, 0.95)),
            colorIndex,
            intensity: Math.max(0.1, Math.min(intensity, 1))
          };
        }));
      }, 60); // 60ms for smooth 16fps animation
    } else {
      console.log('🎵 Stopping waveform animation');
      // When not playing, set to minimal state immediately
      setBars(prevBars => prevBars.map(() => ({
        height: Math.random() * 0.15 + 0.05,
        colorIndex: Math.floor(Math.random() * colorClasses.length),
        intensity: 0.2 + Math.random() * 0.2
      })));
    }

    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [state.isPlaying, state.currentSong?.id]); // Depend on song ID for fresh animation

  return (
    <div className={`flex items-end justify-center h-full w-full gap-px px-1 py-2 ${className}`}>
      {bars.map((bar, index) => (
        <div
          key={`${index}-${animationFrame}`}
          className={`${colorClasses[bar.colorIndex]} rounded-t-[1px] transition-all duration-75 ease-out ${
            state.isPlaying ? 'shadow-sm' : ''
          }`}
          style={{
            height: `${bar.height * 100}%`,
            width: `${100 / bars.length}%`,
            minHeight: '2px',
            maxHeight: '100%',
            opacity: state.isPlaying 
              ? Math.max(0.6, bar.intensity * 0.9) 
              : 0.4,
            transform: `scaleY(${state.isPlaying ? (0.7 + (bar.intensity * 0.6)) : 0.3})`,
            filter: state.isPlaying 
              ? `brightness(${1 + (bar.intensity * 0.4)}) saturate(${1.3})` 
              : 'brightness(0.6) saturate(0.6)',
            boxShadow: state.isPlaying && bar.intensity > 0.7 
              ? `0 0 6px ${index < 20 ? 'rgba(239, 68, 68, 0.5)' : 
                          index < 70 ? 'rgba(34, 197, 94, 0.5)' : 
                          'rgba(168, 85, 247, 0.5)'}` 
              : 'none'
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualization;
