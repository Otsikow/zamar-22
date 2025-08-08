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
    // Connect source to analyser ONLY (avoid double playback echo)
    sourceNode.connect(analyser);

    // Auto-resume context when audio plays (required on iOS)
    const resumeOnPlay = () => {
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
    };
    audioEl.addEventListener("play", resumeOnPlay);

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
      if (backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, heightPx);
      }

      const barCount = bufferLength;
      const barWidth = (width / barCount) * 1.5; // Spacing between bars
      let x = 0;
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i];
        // Emphasize low frequencies (kick/bass)
        const scale = i < barCount * 0.15 ? 1.5 : 1;
        const barHeight = (value / 255) * heightPx * 0.75 * scale;

        ctx.fillStyle = barColor;
        // Rounded top bars look nicer
        const y = heightPx - barHeight;
        const radius = Math.min(3, barHeight / 2);
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
