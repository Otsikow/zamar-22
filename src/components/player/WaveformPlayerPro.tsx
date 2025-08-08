import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import WaveSurfer, { WaveSurferOptions } from "wavesurfer.js";
import { Button } from "@/components/ui/button";

export type WaveformPlayerProRef = {
  play: () => void;
  pause: () => void;
  seekTo: (fraction: number) => void; // 0..1
  getCurrentTime: () => number;
};

type Props = {
  audioUrl: string;
  /** External control: player state from your existing controls */
  isPlaying?: boolean;
  /** When audio is ready (duration in sec) */
  onReady?: (duration: number) => void;
  /** Time updates from the waveform (sec) */
  onTimeUpdate?: (currentTime: number) => void;
  /** When user play/pause inside the waveform */
  onPlayState?: (playing: boolean) => void;
  /** Optional starting time (sec) */
  startAt?: number;
  className?: string;
};

// Read HSL colors from the design system; fall back to gold hues
const getThemeHsl = (varName: string, fallbackHex: string) => {
  if (typeof window === "undefined") return fallbackHex;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    varName
  );
  return raw?.trim() ? `hsl(${raw.trim()})` : fallbackHex;
};

const DEFAULT_WAVE = "#F6C10F"; // gold
const DEFAULT_PROGRESS = "#C69200"; // deep gold

const WaveformPlayerPro = forwardRef<WaveformPlayerProRef, Props>(
  (
    {
      audioUrl,
      isPlaying,
      onReady,
      onTimeUpdate,
      onPlayState,
      startAt = 0,
      className,
    }: Props,
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const progressGlowRef = useRef<HTMLDivElement | null>(null);
    const ws = useRef<WaveSurfer | null>(null);

    // Beat-reactive scale value (1.0 = normal)
    const [beatScale, setBeatScale] = useState(1);
    // Progress % (for sizing the glowing overlay)
    const [percent, setPercent] = useState(0);

    // WebAudio analyser for beat detection
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    useImperativeHandle(ref, () => ({
      play: () => ws.current?.play(),
      pause: () => ws.current?.pause(),
      seekTo: (fraction: number) =>
        ws.current?.seekTo(Math.min(1, Math.max(0, fraction))),
      getCurrentTime: () => ws.current?.getCurrentTime() ?? 0,
    }));

    // Create wavesurfer
    useEffect(() => {
      if (!containerRef.current || !audioUrl) return;

      // Clean up any prior instance
      ws.current?.destroy();

      const waveColor = getThemeHsl("--primary", DEFAULT_WAVE);
      // Using same token for progress but it could be a darker variant
      const progressColor = getThemeHsl("--primary", DEFAULT_PROGRESS);

      const options: WaveSurferOptions = {
        container: containerRef.current,
        height: 96,
        waveColor,
        progressColor,
        cursorColor: "transparent",
        barWidth: 2,
        barGap: 1,
        barRadius: 3,
        interact: true,
      };
      ws.current = WaveSurfer.create(options);
      ws.current.load(audioUrl);

      ws.current.on("ready", () => {
        if (startAt > 0) ws.current?.setTime(startAt);
        onReady?.(ws.current!.getDuration());
        setupAnalyser();
        // Sync initial external state
        if (typeof isPlaying !== "undefined") {
          const playing = ws.current!.isPlaying();
          if (isPlaying && !playing) ws.current!.play();
          if (!isPlaying && playing) ws.current!.pause();
        }
      });

      ws.current.on("timeupdate", (time) => {
        onTimeUpdate?.(time);
        const dur = ws.current!.getDuration() || 1;
        setPercent((time / dur) * 100);
      });

      // Some versions emit a 'seeking' event; timeupdate handler above keeps UI in sync
      // We intentionally omit unsupported events to satisfy types.

      ws.current.on("play", () => onPlayState?.(true));
      ws.current.on("pause", () => onPlayState?.(false));
      ws.current.on("finish", () => {
        onPlayState?.(false);
        setPercent(100);
      });

      return () => {
        teardownAnalyser();
        ws.current?.destroy();
        ws.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl]);

    // Sync with external controls
    useEffect(() => {
      if (!ws.current || typeof isPlaying === "undefined") return;
      const playing = ws.current.isPlaying();
      if (isPlaying && !playing) ws.current.play();
      if (!isPlaying && playing) ws.current.pause();
    }, [isPlaying]);

    // Progress glow width
    useEffect(() => {
      if (!progressGlowRef.current) return;
      progressGlowRef.current.style.width = `${percent}%`;
    }, [percent]);

    /** Beat detection: simple adaptive energy threshold on low frequencies */
    const setupAnalyser = () => {
      if (!ws.current) return;
      const media = ws.current.getMediaElement();
      if (!media) return;

      audioCtxRef.current =
        audioCtxRef.current ||
        new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;

      // Reuse node graph if already set
      if (!mediaSourceRef.current) {
        mediaSourceRef.current = ctx.createMediaElementSource(media);
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.8;
        mediaSourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
      }

      startBeatLoop();
    };

    const teardownAnalyser = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      // Keep AudioContext for reuse across tracks (avoids iOS unlock issues)
    };

    const startBeatLoop = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;

      const buf = new Uint8Array(analyser.frequencyBinCount);
      let baseline = 0.0; // adaptive baseline

      const loop = () => {
        analyser.getByteFrequencyData(buf);

        // Focus on low freqs (drums). Empirically: first ~40 bins
        const lowBins = 40;
        let sum = 0;
        for (let i = 0; i < Math.min(lowBins, buf.length); i++) sum += buf[i];
        const energy = sum / Math.min(lowBins, buf.length); // 0..255

        // Exponential moving average baseline
        const alpha = 0.05;
        baseline = baseline * (1 - alpha) + energy * alpha;

        // "Beat" when energy exceeds baseline by a factor
        const diff = Math.max(0, energy - baseline);
        const strength = Math.min(1, diff / 60);

        const targetScale = 1 + strength * 0.18; // 1..1.18
        setBeatScale((prev) => prev * 0.85 + targetScale * 0.15);

        rafIdRef.current = requestAnimationFrame(loop);
      };

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(loop);
    };

    return (
      <div className={`w-full relative ${className ?? ""}`}>
        {/* Waveform wrapper with beat-reactive vertical scaling */}
        <div
          className="relative w-full"
          style={{
            transform: `scaleY(${beatScale})`,
            transformOrigin: "center",
            transition: "transform 80ms linear",
          }}
        >
          {/* Pulsing glow track under the waveform (progress only) */}
          <div className="absolute inset-y-0 left-0 pointer-events-none">
            <div
              ref={progressGlowRef}
              className="h-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(198,146,0,0.35), rgba(246,193,15,0.2))",
                boxShadow:
                  "0 0 18px 4px rgba(198,146,0,1), inset 0 0 8px rgba(246,193,15,1)",
                filter: "blur(0.2px)",
                transition: "width 120ms linear",
                width: "0%",
              }}
            />
          </div>

          {/* Wavesurfer renders <canvas> inside this */}
          <div
            ref={containerRef}
            className="w-full"
            style={{
              filter: "drop-shadow(0 0 6px rgba(246,193,15,0.45))",
            }}
          />
        </div>

        {/* Internal controls (optional—hide if using external buttons) */}
        <div className="mt-3 flex items-center gap-2">
          <Button
            onClick={() => ws.current?.playPause()}
            className="rounded-full px-4"
          >
            ▶ / ⏸
          </Button>
          <Button
            variant="secondary"
            onClick={() => ws.current?.seekTo(0)}
            className="rounded-full px-3"
          >
            ⟲
          </Button>
        </div>
      </div>
    );
  }
);

WaveformPlayerPro.displayName = "WaveformPlayerPro";

export default WaveformPlayerPro;
