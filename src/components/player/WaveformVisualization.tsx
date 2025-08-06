
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
      height: Math.random() * 0.2 + 0.1, // Start with smaller heights
      colorIndex: Math.floor(Math.random() * colorClasses.length),
      intensity: Math.random() * 0.3 + 0.1
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
          // Create more realistic and varied wave patterns
          const time = Date.now() * 0.0015; // Slightly slower time progression
          
          // Multiple wave layers with different frequencies and phases
          const primaryWave = Math.sin((index * 0.1) + (time * 2.2)) * 0.3;
          const secondaryWave = Math.cos((index * 0.07) + (time * 1.8) + Math.PI/3) * 0.25;
          const tertiaryWave = Math.sin((index * 0.13) + (time * 2.7) + Math.PI/6) * 0.2;
          const quaternaryWave = Math.cos((index * 0.05) + (time * 1.5) + Math.PI/2) * 0.15;
          
          // Add random noise for unpredictability
          const randomNoise = (Math.random() - 0.5) * 0.4;
          const smoothNoise = Math.sin(Math.random() * time) * 0.2;
          
          // Simulate different frequency bands with more realistic behavior
          let baseHeight;
          let colorIndex;
          let intensity;
          
          if (index < 25) {
            // Bass frequencies - deep, powerful, but not always dominant
            const bassEnergy = Math.abs(primaryWave + quaternaryWave) * 0.8;
            baseHeight = 0.3 + bassEnergy + (Math.random() * 0.3) + (smoothNoise * 0.5);
            intensity = 0.5 + bassEnergy * 0.4 + (Math.random() * 0.3);
            colorIndex = Math.random() > 0.7 ? 15 : Math.floor(Math.random() * 2);
          } else if (index < 50) {
            // Low-mid frequencies - warm, varied movement
            const midLowEnergy = Math.abs(secondaryWave + tertiaryWave) * 0.7;
            baseHeight = 0.25 + midLowEnergy + (Math.random() * 0.35) + (randomNoise * 0.3);
            intensity = 0.4 + midLowEnergy * 0.5 + (Math.random() * 0.4);
            colorIndex = 2 + Math.floor(Math.random() * 3);
          } else if (index < 80) {
            // Mid frequencies - most dynamic, but not predictably high
            const midEnergy = Math.abs(primaryWave + secondaryWave + tertiaryWave) * 0.6;
            baseHeight = 0.2 + midEnergy + (Math.random() * 0.4) + (randomNoise * 0.4);
            intensity = 0.3 + midEnergy * 0.6 + (Math.random() * 0.5);
            colorIndex = 5 + Math.floor(Math.random() * 3);
          } else if (index < 105) {
            // High-mid frequencies - quick, sparkly, but varied
            const highMidEnergy = Math.abs(tertiaryWave + quaternaryWave) * 0.8;
            baseHeight = 0.15 + highMidEnergy + (Math.random() * 0.45) + (smoothNoise * 0.6);
            intensity = 0.2 + highMidEnergy * 0.7 + (Math.random() * 0.6);
            colorIndex = 8 + Math.floor(Math.random() * 3);
          } else {
            // Treble frequencies - erratic, but not always present
            const trebleEnergy = Math.abs(primaryWave + tertiaryWave) * 0.9;
            baseHeight = 0.1 + trebleEnergy + (Math.random() * 0.5) + (randomNoise * 0.7);
            intensity = 0.1 + trebleEnergy * 0.8 + (Math.random() * 0.7);
            colorIndex = 11 + Math.floor(Math.random() * 4);
          }

          // Add occasional dramatic spikes, but less frequently
          if (Math.random() > 0.92) {
            baseHeight *= 1.8;
            intensity = Math.min(1, intensity * 1.5);
          }

          // Add subtle beat-like pulses with variation
          const beatPulse = Math.sin(time * 6.5 + (index * 0.1)) * 0.12;
          const accentPulse = Math.cos(time * 3.2 + (index * 0.05)) * 0.08;
          baseHeight += Math.abs(beatPulse) + Math.abs(accentPulse);

          // Add frequency-specific modulation to prevent predictability
          const frequencyMod = Math.sin((index / 120) * Math.PI * 4 + time) * 0.15;
          baseHeight += Math.abs(frequencyMod);

          // Ensure bars don't touch ceiling (max 85% height) and have minimum presence
          return {
            height: Math.max(0.03, Math.min(baseHeight * 0.85, 0.85)), // Cap at 85% to avoid ceiling
            colorIndex,
            intensity: Math.max(0.1, Math.min(intensity, 1))
          };
        }));
      }, 75); // Slightly slower for more natural movement
    } else {
      console.log('🎵 Stopping waveform animation');
      // When not playing, set to minimal ambient state
      setBars(prevBars => prevBars.map(() => ({
        height: Math.random() * 0.12 + 0.03, // Very low ambient heights
        colorIndex: Math.floor(Math.random() * colorClasses.length),
        intensity: 0.15 + Math.random() * 0.15
      })));
    }

    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [state.isPlaying, state.currentSong?.id]);

  return (
    <div className={`flex items-end justify-center h-full w-full gap-px px-1 py-3 ${className}`}>
      {bars.map((bar, index) => (
        <div
          key={`${index}-${animationFrame}`}
          className={`${colorClasses[bar.colorIndex]} rounded-t-sm transition-all duration-100 ease-out ${
            state.isPlaying ? 'shadow-sm' : ''
          }`}
          style={{
            height: `${bar.height * 100}%`,
            width: `${100 / bars.length}%`,
            minHeight: '3px',
            maxHeight: '85%', // Ensure no touching ceiling
            opacity: state.isPlaying 
              ? Math.max(0.5, bar.intensity * 0.95) 
              : 0.3,
            transform: `scaleY(${state.isPlaying ? (0.6 + (bar.intensity * 0.7)) : 0.2})`,
            filter: state.isPlaying 
              ? `brightness(${0.9 + (bar.intensity * 0.5)}) saturate(${1.1 + (bar.intensity * 0.3)})` 
              : 'brightness(0.5) saturate(0.5)',
            boxShadow: state.isPlaying && bar.intensity > 0.6 
              ? `0 0 4px ${index < 25 ? 'rgba(239, 68, 68, 0.4)' : 
                          index < 80 ? 'rgba(34, 197, 94, 0.4)' : 
                          'rgba(168, 85, 247, 0.4)'}` 
              : 'none'
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualization;
