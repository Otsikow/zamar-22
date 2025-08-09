import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url?: string;
  cover?: string;
}

interface NowPlayingState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  queue: Song[];
  currentIndex: number;
  isLooping: boolean;
  isShuffling: boolean;
  isQueueMode: boolean;
}

interface NowPlayingContextType {
  state: NowPlayingState;
  playSong: (song: Song, queue?: Song[]) => void;
  playQueue: (queue: Song[], startIndex?: number) => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  nextSong: () => void;
  previousSong: () => void;
  updateCurrentTime: (time: number) => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  setQueueMode: (enabled: boolean) => void;
  stopRadio: () => void;
}

const NowPlayingContext = createContext<NowPlayingContextType | undefined>(undefined);

export const useNowPlaying = () => {
  const context = useContext(NowPlayingContext);
  if (!context) {
    console.error('useNowPlaying called outside NowPlayingProvider. Component stack:', new Error().stack);
    throw new Error('useNowPlaying must be used within a NowPlayingProvider');
  }
  return context;
};

export const NowPlayingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout>();
  
  const [state, setState] = useState<NowPlayingState>({
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    volume: 1,
    queue: [],
    currentIndex: -1,
    isLooping: false,
    isShuffling: false,
    isQueueMode: false,
  });

  // Read Auto-Play setting from localStorage
  const getAutoPlayEnabled = () => {
    try {
      const raw = localStorage.getItem('zamar_settings');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!parsed.autoPlay;
    } catch {
      return false;
    }
  };

  // More frequent time updates for smoother UI
  useEffect(() => {
    if (state.isPlaying && audioRef.current) {
      timeUpdateIntervalRef.current = setInterval(() => {
        if (audioRef.current && !audioRef.current.paused) {
          const currentTime = audioRef.current.currentTime;
          setState(prev => ({
            ...prev,
            currentTime: currentTime
          }));
        }
      }, 100); // Update every 100ms for smooth slider movement
    } else {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    }

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [state.isPlaying]);

  // Effect to handle audio element changes
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      console.log('✅ Audio metadata loaded, duration:', audio.duration);
      console.log('✅ Audio URL:', audio.src);
      console.log('✅ Audio readyState:', audio.readyState);
      setState(prev => ({
        ...prev,
        currentSong: prev.currentSong ? {
          ...prev.currentSong,
          duration: Math.floor(audio.duration)
        } : null
      }));
    };

    const handleEnded = () => {
      console.log('🎵 Song ended, handling queue advance...');
      const audio = audioRef.current;
      let nextUrl: string | null = null;

      setState(prev => {
        console.log('🎵 Current state during ended:', {
          isQueueMode: prev.isQueueMode,
          isLooping: prev.isLooping,
          currentIndex: prev.currentIndex,
          queueLength: prev.queue.length,
          currentSong: prev.currentSong?.title
        });

        if (prev.isLooping) {
          // Loop the current song - restart immediately
          console.log('🎵 Looping current song');
          if (audio) {
            audio.currentTime = 0;
            audio.play().catch(console.error);
          }
          return {
            ...prev,
            currentTime: 0,
            isPlaying: true,
          };
        }

        if ((prev.isQueueMode || getAutoPlayEnabled()) && prev.queue.length > 0) {
          // Determine next index (advance or wrap)
          const isLast = prev.currentIndex >= prev.queue.length - 1;
          const nextIndex = isLast ? 0 : prev.currentIndex + 1;
          const nextSong = prev.queue[nextIndex];
          nextUrl = nextSong?.url ?? null;
          console.log(isLast ? '🎵 End of queue, looping to first' : '🎵 Auto-advancing to next', nextSong?.title);
          return {
            ...prev,
            currentSong: nextSong,
            currentIndex: nextIndex,
            currentTime: 0,
            isPlaying: true,
          };
        }

        // Otherwise stop playback
        console.log('🎵 Song ended, stopping playback');
        return {
          ...prev,
          isPlaying: false,
          currentTime: 0,
        };
      });

      // Proactively set next src and play to ensure seamless handoff
      if (nextUrl && audio) {
        try {
          audio.src = nextUrl;
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise) playPromise.catch(err => console.warn('⚠️ Auto-advance play blocked:', err));
        } catch (e) {
          console.warn('⚠️ Could not auto-advance audio element immediately:', e);
        }
      }
    };

    // Handle audio pause events (like when audio stops loading)
    const handlePause = () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
      }));
    };

    // Handle audio play events
    const handlePlay = () => {
      setState(prev => ({
        ...prev,
        isPlaying: true,
      }));
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [state.currentSong?.id]);

  // Effect to sync audio playback with state
  useEffect(() => {
    console.log('🎵 Playback effect triggered - isPlaying:', state.isPlaying, 'song:', state.currentSong?.title || 'null');
    
    if (!audioRef.current || !state.currentSong || !state.currentSong.url) {
      console.log('❌ Missing audio ref or song URL');
      return;
    }

    const audio = audioRef.current;

    // Only process playback changes if audio is ready and has correct source
    if (audio.src !== state.currentSong.url) {
      console.log('🎵 Waiting for audio source to load before playback control');
      return;
    }

    if (state.isPlaying) {
      console.log('🎵 Attempting to play audio...');
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Audio playback started successfully');
          })
          .catch(error => {
            console.error('❌ Play error:', error);
            setState(prev => ({ ...prev, isPlaying: false }));
          });
      }
    } else {
      console.log('⏸️ Pausing audio');
      audio.pause();
    }
  }, [state.isPlaying, state.currentSong?.url]);

  // Effect to change audio source when song changes
  useEffect(() => {
    console.log('🎵 Audio source effect triggered for song:', state.currentSong?.title || 'null');
    
    if (!audioRef.current) {
      console.log('❌ No audio ref available');
      return;
    }

    const audio = audioRef.current;
    
    if (!state.currentSong?.url) {
      console.log('❌ No audio URL, clearing source');
      audio.src = '';
      setState(prev => ({ ...prev, isPlaying: false }));
      return;
    }
    
    // Only reload if the source is actually different
    if (audio.src !== state.currentSong.url) {
      console.log('🎵 Loading new audio source...');
      
      // Stop current playback to prevent AbortError
      audio.pause();
      audio.currentTime = 0;
      
      audio.src = state.currentSong.url;
      audio.volume = state.volume;
      audio.loop = state.isLooping;
      
      console.log('🎵 Audio src set, calling load()');
      
      // Wait for loadedmetadata before trying to play
      const handleLoadedMetadata = () => {
        const duration = audio.duration;
        
        // Only set duration if it's a valid number
        if (isFinite(duration) && !isNaN(duration) && duration > 0) {
          setState(prev => ({ 
            ...prev, 
            currentSong: prev.currentSong ? {
              ...prev.currentSong,
              duration: Math.floor(duration)
            } : null,
            currentTime: 0
          }));
          
          // Check if we should auto-play (for queue mode or when explicitly playing)
          setTimeout(() => {
            setState(currentState => {
              if (currentState.isQueueMode || currentState.isPlaying) {
                console.log('🎵 Attempting auto-play after metadata load for queue mode...');
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                  playPromise
                    .then(() => {
                      console.log('✅ Auto-play successful');
                      setState(prev => ({ ...prev, isPlaying: true }));
                    })
                    .catch(error => {
                      console.log('⚠️ Auto-play blocked by browser, user must interact first');
                      setState(prev => ({ ...prev, isPlaying: false }));
                    });
                }
              }
              return currentState;
            });
          }, 0);
        }
      };

      // Add error handler for loading failures
      const handleLoadError = (e) => {
        console.error('❌ Failed to load audio source:', state.currentSong.url);
        console.error('❌ Audio error details:', e.target?.error);
        setState(prev => ({ ...prev, isPlaying: false }));
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      audio.addEventListener('error', handleLoadError, { once: true });
      
      // Force load the audio
      audio.load();
    }
  }, [state.currentSong?.url]);

  // Separate effect to handle volume changes without reloading audio
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = state.volume;
  }, [state.volume]);

  // Separate effect to handle loop changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.loop = state.isLooping;
  }, [state.isLooping]);

  const playSong = useCallback((song: Song, queue: Song[] = []) => {
    if (!song || typeof song !== 'object') {
      console.error('❌ Invalid song object provided:', song);
      return;
    }
    
    console.log('🎵 playSong called with:', song.title, 'URL:', song.url);
    
    if (!song.url) {
      console.error('❌ No URL provided for song:', song.title);
      return;
    }
    
    const newQueue = queue.length > 0 ? queue : [song];
    const index = newQueue.findIndex(s => s.id === song.id);
    
    console.log('🎵 Setting new song state...');
    setState(prev => ({
      ...prev,
      currentSong: song,
      isPlaying: false,
      queue: newQueue,
      currentIndex: index >= 0 ? index : 0,
      currentTime: 0,
      isQueueMode: getAutoPlayEnabled() || newQueue.length > 1,
    }));
  }, []);

  const togglePlayPause = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  }, []);

  const seekTo = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    const clampedTime = Math.max(0, Math.min(time, audio.duration || 0));
    
    audio.currentTime = clampedTime;
    setState(prev => ({
      ...prev,
      currentTime: clampedTime,
    }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    const newVolume = Math.max(0, Math.min(1, volume));
    
    setState(prev => ({
      ...prev,
      volume: newVolume,
    }));
  }, []);

  const nextSong = useCallback(() => {
    setState(prev => {
      if (prev.queue.length === 0) {
        return prev;
      }

      // If shuffle is enabled, jump to a random different index
      if (prev.isShuffling) {
        if (prev.queue.length === 1) return prev;
        let rand = Math.floor(Math.random() * prev.queue.length);
        if (rand === prev.currentIndex) {
          rand = (rand + 1) % prev.queue.length;
        }
        return {
          ...prev,
          currentSong: prev.queue[rand],
          currentIndex: rand,
          currentTime: 0,
          isPlaying: true,
        };
      }

      let nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.queue.length) {
        if (prev.isQueueMode) {
          nextIndex = 0; // wrap around in radio/queue mode
        } else {
          return prev;
        }
      }
      return {
        ...prev,
        currentSong: prev.queue[nextIndex],
        currentIndex: nextIndex,
        currentTime: 0,
        isPlaying: true,
      };
    });
  }, []);

  const previousSong = useCallback(() => {
    setState(prev => {
      if (prev.queue.length === 0) {
        return prev;
      }
      let prevIndex = prev.currentIndex - 1;
      if (prevIndex < 0) {
        if (prev.isQueueMode) {
          prevIndex = Math.max(prev.queue.length - 1, 0); // wrap around
        } else {
          return prev;
        }
      }
      return {
        ...prev,
        currentSong: prev.queue[prevIndex],
        currentIndex: prevIndex,
        currentTime: 0,
        isPlaying: true,
      };
    });
  }, []);

  const updateCurrentTime = useCallback((time: number) => {
    setState(prev => ({
      ...prev,
      currentTime: time,
    }));
  }, []);

  const toggleLoop = useCallback(() => {
    console.log('🔄 Toggle loop called');
    setState(prev => {
      const newLoopState = !prev.isLooping;
      console.log('🔄 Loop state changing from', prev.isLooping, 'to', newLoopState);
      return {
        ...prev,
        isLooping: newLoopState,
      };
    });
  }, []);

  const shuffleArray = useCallback((array: Song[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const playQueue = useCallback((queue: Song[], startIndex: number = 0) => {
    const processedQueue = queue.length > 0 ? queue : [];
    const safeStartIndex = Math.max(0, Math.min(startIndex, processedQueue.length - 1));
    
    setState(prev => ({
      ...prev,
      queue: processedQueue,
      currentIndex: safeStartIndex,
      currentSong: processedQueue[safeStartIndex] || null,
      isPlaying: processedQueue.length > 0,
      isQueueMode: true,
      currentTime: 0,
    }));
  }, []);

  const toggleShuffle = useCallback(() => {
    setState(prev => {
      if (!prev.isShuffling && prev.queue.length > 0) {
        const currentSong = prev.currentSong;
        const shuffledQueue = shuffleArray(prev.queue);
        const newCurrentIndex = currentSong ? shuffledQueue.findIndex(s => s.id === currentSong.id) : 0;
        
        return {
          ...prev,
          isShuffling: true,
          queue: shuffledQueue,
          currentIndex: newCurrentIndex,
        };
      } else {
        return {
          ...prev,
          isShuffling: false,
        };
      }
    });
  }, [shuffleArray]);

  const stopRadio = useCallback(() => {
    const audio = audioRef.current;
    
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
    }
    
    setState(prev => ({
      ...prev,
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      queue: [],
      currentIndex: 0,
      isQueueMode: false,
      isShuffling: false,
      isLooping: false
    }));
  }, []);

  const setQueueMode = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      isQueueMode: enabled,
    }));
  }, []);

  const value: NowPlayingContextType = {
    state,
    playSong,
    playQueue,
    togglePlayPause,
    seekTo,
    setVolume,
    nextSong,
    previousSong,
    updateCurrentTime,
    toggleLoop,
    toggleShuffle,
    setQueueMode,
    stopRadio,
  };

  return (
    <NowPlayingContext.Provider value={value}>
      {/* Hidden audio element for global playback */}
      <audio
        id="radio-audio"
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
        onError={(e) => {
          const error = e.currentTarget.error;
          if (error && error.code !== 4) {
            console.error('❌ Audio element error:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
          }
          setState(prev => ({ ...prev, isPlaying: false }));
        }}
      />
      {children}
    </NowPlayingContext.Provider>
  );
};
