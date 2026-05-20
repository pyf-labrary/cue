/**
 * usePlayheadVar — drive a `--p` CSS custom property (0..1 fraction of the
 * timeline) on an element via a single rAF loop, completely decoupled from
 * React re-renders.
 *
 * Why: updating the playhead position through React state (setState every
 * frame) re-renders the whole lane tree 60×/s and, combined with a CSS
 * `transition`, produces a stuttery "rubber-banding" playhead. Here we write
 * one CSS var per frame straight to the DOM; children position themselves with
 * `left: calc(var(--p) * 100%)` or `transform: scaleX(var(--p))` — no React, no
 * transition, no layout thrash.
 *
 * `getFraction` is read through a ref so it can close over the latest state/
 * props without restarting the rAF loop on every render.
 */
import { useEffect, useRef, type RefObject } from 'react';

export function usePlayheadVar(
  ref: RefObject<HTMLElement | null>,
  getFraction: () => number,
): void {
  const getRef = useRef(getFraction);
  getRef.current = getFraction;

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const p = getRef.current();
        el.style.setProperty('--p', String(Number.isFinite(p) ? p : 0));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref]);
}
