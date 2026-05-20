/**
 * Realtime spectrum strip — 32 bars driven by readSpectrum() on rAF.
 *
 * Visually a thin DAW-style meter; pairs with the transport bar.
 */
import { useEffect, useRef } from 'react';
import { readSpectrum, SPECTRUM_BARS } from '@/lib/spectrum';

type Props = {
  /** Height in CSS px. Default 28. */
  height?: number;
  /** Bar color. Default accent. */
  color?: string;
  /** Background opacity (0..1). Default 0. */
  bg?: string;
};

export default function SpectrumStrip({ height = 28, color = '#E6C36B', bg }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const buf = new Float32Array(SPECTRUM_BARS);
    const decay = new Float32Array(SPECTRUM_BARS);
    let raf = 0;
    // Cached CSS size — refreshed only on resize, never read in the rAF loop.
    // Calling getBoundingClientRect() every frame forces a synchronous layout
    // which, paired with the playhead writing `left`/transforms, thrashed.
    let w = 0;
    let h = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = Math.max(1, Math.floor(w * dpr));
      canvas!.height = Math.max(1, Math.floor(h * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function tick() {
      readSpectrum(buf);
      ctx!.clearRect(0, 0, w, h);
      if (bg) {
        ctx!.fillStyle = bg;
        ctx!.fillRect(0, 0, w, h);
      }
      const gap = 1.5;
      const bw = (w - gap * (SPECTRUM_BARS - 1)) / SPECTRUM_BARS;
      ctx!.fillStyle = color;
      for (let i = 0; i < SPECTRUM_BARS; i++) {
        // Peak-decay: bars rise instantly, fall slowly.
        const target = buf[i];
        if (target > decay[i]) decay[i] = target;
        else decay[i] = Math.max(0, decay[i] - 0.04);
        const bh = decay[i] * h;
        ctx!.globalAlpha = 0.55 + decay[i] * 0.45;
        ctx!.fillRect(i * (bw + gap), h - bh, bw, bh);
      }
      ctx!.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [color, bg]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height, display: 'block' }}
      aria-hidden
    />
  );
}
