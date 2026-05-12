/**
 * Keyboard shortcuts for transport + lane control.
 *
 *   Space        play / pause
 *   ←  →         seek -2s / +2s   (Shift = ±5s)
 *   Home / 0     stop, return to start
 *   1..5         mute  lane (DX / MX / FX / NX / VO)
 *   Shift+1..5   solo  lane
 *   Esc          stop and clear solo
 *
 * Mounting with `enabled=false` is the way to scope to "this page only".
 * Inputs / textareas are ignored automatically.
 */
import { useEffect } from 'react';
import { compositionPlayer } from './compositionPlayer';
import {
  type Composition,
  setLaneMute,
  toggleLaneSolo,
} from './composition';
import type { TrackId } from '@/data/scenes';

const LANE_BY_DIGIT: Record<string, TrackId> = {
  '1': 'dx',
  '2': 'mx',
  '3': 'fx',
  '4': 'nx',
  '5': 'vo',
};

/**
 * Full shortcuts (transport + lanes). Use when the page owns a Composition.
 */
export function useKeyboardShortcuts({
  enabled = true,
  composition,
  onCompositionChange,
}: {
  enabled?: boolean;
  composition?: Composition;
  onCompositionChange?: (next: Composition) => void;
}) {
  useTransportShortcuts({ enabled });
  useLaneShortcuts({ enabled, composition, onCompositionChange });
}

/** Transport only (space / arrows / home / 0 / esc). */
export function useTransportShortcuts({ enabled = true }: { enabled?: boolean } = {}) {
  useEffect(() => {
    if (!enabled) return;
    function handler(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const state = compositionPlayer.getState();
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (state.status === 'playing') compositionPlayer.pause();
          else compositionPlayer.play();
          return;
        case 'ArrowLeft': {
          e.preventDefault();
          const step = e.shiftKey ? 5 : 2;
          compositionPlayer.seek(Math.max(0, state.currentSec - step));
          return;
        }
        case 'ArrowRight': {
          e.preventDefault();
          const step = e.shiftKey ? 5 : 2;
          compositionPlayer.seek(state.currentSec + step);
          return;
        }
        case 'Home':
        case '0':
        case 'Escape':
          e.preventDefault();
          compositionPlayer.stop();
          return;
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled]);
}

/** Lane mute/solo only (1..5, Shift+1..5, Esc clears solo). */
export function useLaneShortcuts({
  enabled = true,
  composition,
  onCompositionChange,
}: {
  enabled?: boolean;
  composition?: Composition;
  onCompositionChange?: (next: Composition) => void;
}) {
  useEffect(() => {
    if (!enabled || !composition || !onCompositionChange) return;
    function handler(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!composition || !onCompositionChange) return;
      if (e.key === 'Escape' && composition.laneSolo) {
        onCompositionChange({ ...composition, laneSolo: null });
        return;
      }
      const lane = LANE_BY_DIGIT[e.key];
      if (!lane) return;
      e.preventDefault();
      if (e.shiftKey) onCompositionChange(toggleLaneSolo(composition, lane));
      else onCompositionChange(setLaneMute(composition, lane, !composition.laneMute[lane]));
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, composition, onCompositionChange]);
}

