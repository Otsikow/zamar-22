import React, { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  audioElementId?: string; // Defaults to the global hidden audio element id
  barColor?: string; // Accept CSS color, defaults to themed primary
  backgroundColor?: string; // Accept CSS color, defaults transparent to blend with card
  height?: number; // Canvas internal height (for DPR scaling)
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioElementId = "radio-audio",
  barColor = "hsl(var(--primary))",
  backgroundColor = "transparent",
  height = 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Resize canvas for device pixel ratio crispness
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor((height || rect.height || 100) * dpr));
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctxRef.current = ctx;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const audioEl = (document.getElementById(audioElementId) as HTMLAudioElement) || null;
    if (!canvas || !audioEl) return;

    resizeCanvas();

    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
    const audioCtx = new AudioCtx();
    const sourceNode = audioCtx.createMediaElementSource(audioEl);
    const analyser = audioCtx.createAnalyser();

    analyser.fftSize = 256; // Reasonable performance vs detail
    analyser.smoothingTimeConstant = 0.85; // smooth visual motion
    // Connect source to analyser ONLY (avoid double playback echo)
    sourceNode.connect(analyser);

    // Resolve CSS variable colors (canvas does not understand CSS vars directly)
    const resolveColor = (input: string, fallback: string) => {
      if (!input) return fallback;
      if (input.includes('var(')) {
        const match = input.match(/var\((--[^)]+)\)/);
        const varName = match?.[1];
        if (varName) {
          const val = getComputedStyle(document.documentElement)
            .getPropertyValue(varName)
            .trim();
          if (val) {
            // If token is "220 90% 50%" style, wrap in hsl()
            if (val.includes('%')) return `hsl(${val})`;
            return val;
          }
        }
      }
      return input;
    };

    const lightenHsl = (hsl: string, delta = 12) => {
      const m = hsl.match(/hsl\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i);
      if (!m) return hsl;
      const h = Number(m[1]);
      const s = Number(m[2]);
      const l = Math.min(100, Number(m[3]) + delta);
      return `hsl(${h} ${s}% ${l}%)`;
    };
    const darkenHsl = (hsl: string, delta = 8) => {
      const m = hsl.match(/hsl\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i);
      if (!m) return hsl;
      const h = Number(m[1]);
      const s = Number(m[2]);
      const l = Math.max(0, Number(m[3]) - delta);
      return `hsl(${h} ${s}% ${l}%)`;
    };
    const parseHsl = (hsl: string) => {
      const m = hsl.match(/hsl\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i);
      if (!m) return null;
      return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) } as const;
    };
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const resolvedBarStart = resolveColor(barColor, '#F59E0B');
    const resolvedAccent = resolveColor('hsl(var(--accent))', lightenHsl(resolvedBarStart, 20));
    const startHsl = parseHsl(resolvedBarStart) || { h: 42, s: 95, l: 50 };
    const endHsl = parseHsl(resolvedAccent) || { h: startHsl.h + 20, s: Math.max(60, startHsl.s - 10), l: Math.min(70, startHsl.l + 10) };

    const resolvedBg = backgroundColor === 'transparent'
      ? 'transparent'
      : resolveColor(backgroundColor, '#0F172A');

    // Auto-resume context when audio plays (required on iOS)
    const resumeOnPlay = () => {
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
    };
    audioEl.addEventListener("play", resumeOnPlay);

    // Also resume on user interaction with canvas (click/touch)
    const resumeOnInteract = () => {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    };
    canvas.addEventListener('click', resumeOnInteract);
    canvas.addEventListener('touchstart', resumeOnInteract, { passive: true } as any);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
    sourceNodeRef.current = sourceNode;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const ctx = ctxRef.current;
      if (!ctx) return;

      analyser.getByteFrequencyData(dataArray);
      const canvasRect = canvas.getBoundingClientRect();
      const width = canvasRect.width;
      const heightPx = (height || canvasRect.height || 100);

      // Background
      ctx.clearRect(0, 0, width, heightPx);
      if (resolvedBg !== "transparent") {
        const bgGrad = ctx.createLinearGradient(0, 0, width, heightPx);
        bgGrad.addColorStop(0, darkenHsl(resolvedBg, 4));
        bgGrad.addColorStop(1, lightenHsl(resolvedBg, 6));
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, heightPx);
      }

      const barCount = bufferLength;
      const barWidth = (width / barCount) * 2.5; // Wider spacing for distinct bars
      let x = 0;
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i];
        // Emphasize low frequencies (kick/bass)
        const scale = i < barCount * 0.2 ? 1.8 : 1;
        const barHeight = (value / 255) * heightPx * 0.7 * scale;

        // Ambient color across bars using theme primary -> accent
        const t = barCount > 1 ? i / (barCount - 1) : 0;
        const h = Math.round(lerp(startHsl.h, endHsl.h, t));
        const s = Math.round(lerp(startHsl.s, endHsl.s, t));
        const l = Math.round(lerp(startHsl.l, endHsl.l, t));
        const barBase = `hsl(${h} ${s}% ${l}%)`;
        const barTop = lightenHsl(barBase, 12);

        // Glow
        ctx.shadowColor = `hsl(${h} ${s}% ${Math.min(100, l + 20)}% / 0.35)`;
        ctx.shadowBlur = Math.max(8, barWidth * 0.6);

        // Vertical gradient per bar
        const gradient = ctx.createLinearGradient(0, heightPx, 0, heightPx - barHeight);
        gradient.addColorStop(0, barBase);
        gradient.addColorStop(1, barTop);
        ctx.fillStyle = gradient;

        // Rounded top bars look nicer
        const y = heightPx - barHeight;
        const radius = Math.min(4, barHeight / 2);
        ctx.beginPath();
        ctx.moveTo(x, heightPx);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, heightPx);
        ctx.closePath();
        ctx.fill();

        x += barWidth;
      }
    };

    draw();

    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      try {
        audioEl.removeEventListener("play", resumeOnPlay);
        canvas.removeEventListener('click', resumeOnInteract);
        canvas.removeEventListener('touchstart', resumeOnInteract as any);
        sourceNode.disconnect();
        analyser.disconnect();
        audioCtx.close();
      } catch {}
      audioCtxRef.current = null;
      analyserRef.current = null;
      sourceNodeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioElementId, barColor, backgroundColor, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 md:h-40 rounded-md overflow-hidden"
      style={{ display: "block" }}
    />
  );
};

export default AudioVisualizer;
