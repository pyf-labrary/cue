import { Howl, Howler } from 'howler';
import { hasRecipe, playSynthPhrase, ensureAudioStarted, stopAllSynth } from './synth';

// Default html5 pool is 10. Atlas users skim many instrument previews; bump
// it so we don't exhaust slots before the GC collects stale Howls.
(Howler as unknown as { html5PoolSize: number }).html5PoolSize = 32;

/**
 * Global audio engine — one knob to control all sound.
 *
 * Two sources:
 *  - CDN-hosted samples via Howler (real recorded phrases on ftp.ssbx.site).
 *  - Tone.js-synthesised phrases as a fallback so every instrument has
 *    *something* to play right now.
 *
 * Mutex: by default only one sound at a time; pass `mix: true` for the scene
 * player and sandbox where layering is the whole point.
 */

type PlayOpts = {
  mix?: boolean;
  loop?: boolean;
  volume?: number;
  fadeMs?: number;
};

type CacheEntry = { howl: Howl; src: string };

const cache = new Map<string, CacheEntry>();
const failedSrc = new Set<string>();
let exclusive: Howl | null = null;
let exclusiveSynthId: string | null = null;
const listeners = new Set<(playingId: string | null) => void>();
let currentId: string | null = null;

function notify() {
  for (const l of listeners) l(currentId);
}

function getOrCreate(src: string, loop = false): Howl {
  const key = src + (loop ? '#loop' : '');
  const hit = cache.get(key);
  if (hit) return hit.howl;
  const howl = new Howl({ src: [src], html5: true, loop, preload: true });
  cache.set(key, { howl, src });
  return howl;
}

export const audioEngine = {
  prefetch(src: string): void {
    getOrCreate(src);
  },

  /** Play a CDN-hosted sample (mp3/ogg/wav). */
  play(src: string, opts: PlayOpts = {}): Howl {
    const howl = getOrCreate(src, !!opts.loop);
    if (typeof opts.volume === 'number') howl.volume(opts.volume);
    if (!opts.mix) {
      stopExclusive(opts.fadeMs);
      exclusive = howl;
      currentId = src;
    }
    howl.play();
    howl.once('end', () => {
      if (exclusive === howl && !opts.loop) clearExclusive();
    });
    notify();
    return howl;
  },

  /**
   * Play a Tone.js-synthesised phrase by id. Used when there's no real sample
   * on the CDN yet. Returns a promise that resolves when the phrase ends.
   */
  async playSynth(id: string): Promise<void> {
    if (!hasRecipe(id)) return;
    await ensureAudioStarted();
    stopExclusive();
    exclusiveSynthId = id;
    currentId = `synth:${id}`;
    notify();
    try {
      await playSynthPhrase(id);
    } finally {
      if (exclusiveSynthId === id) {
        exclusiveSynthId = null;
        currentId = null;
        notify();
      }
    }
  },

  /**
   * Try a CDN sample first, fall back to the synth recipe if it 404s.
   * We use Howler's loaderror event rather than a fetch HEAD probe to avoid
   * cross-origin pre-flight noise when the CDN doesn't return CORS headers.
   */
  async playSampleOrSynth(sampleSrc: string | null, id: string): Promise<void> {
    if (!sampleSrc) return this.playSynth(id);
    if (failedSrc.has(sampleSrc)) return this.playSynth(id);

    return new Promise<void>((resolve) => {
      const howl = new Howl({
        src: [sampleSrc],
        html5: true,
        preload: true,
        onload: () => {
          // Track and play through normal exclusive path.
          cache.set(sampleSrc, { howl, src: sampleSrc });
          stopExclusive();
          exclusive = howl;
          currentId = sampleSrc;
          howl.play();
          howl.once('end', () => {
            if (exclusive === howl) clearExclusive();
            resolve();
          });
          notify();
        },
        onloaderror: () => {
          failedSrc.add(sampleSrc);
          this.playSynth(id).then(resolve);
        },
      });
    });
  },

  stop(src?: string): void {
    if (src) {
      const entry = cache.get(src) ?? cache.get(src + '#loop');
      entry?.howl.stop();
      if (exclusive === entry?.howl) clearExclusive();
      return;
    }
    stopExclusive();
    clearExclusive();
  },

  stopAll(): void {
    for (const { howl } of cache.values()) howl.stop();
    stopAllSynth();
    clearExclusive();
  },

  subscribe(cb: (playingId: string | null) => void): () => void {
    listeners.add(cb);
    cb(currentId);
    return () => listeners.delete(cb);
  },
};

function stopExclusive(fadeMs?: number) {
  if (exclusive) {
    if (fadeMs && fadeMs > 0) {
      const prev = exclusive;
      prev.fade(prev.volume(), 0, fadeMs);
      window.setTimeout(() => prev.stop(), fadeMs);
    } else {
      exclusive.stop();
    }
    exclusive = null;
  }
  if (exclusiveSynthId) {
    stopAllSynth();
    exclusiveSynthId = null;
  }
}

function clearExclusive() {
  exclusive = null;
  exclusiveSynthId = null;
  currentId = null;
  notify();
}

/* React hooks */
import { useEffect, useState } from 'react';

export function useIsPlaying(id: string): boolean {
  const [playing, setPlaying] = useState(false);
  useEffect(() => audioEngine.subscribe((cur) => setPlaying(cur === id)), [id]);
  return playing;
}
