/**
 * Multi-track scene player.
 *
 * MX (music) source — two paths:
 *   1. **mxAudio**: a pre-recorded mp3 (AI-generated via MiniMax music-1.5)
 *      played through Howler. Real instruments, real performance.
 *   2. **tracks.mx**: in-browser Tone.js composition. Used as fallback when
 *      no mxAudio is supplied.
 *
 * FX / NX layers are always synthesised on top via Tone.js so the lane
 * visualisation has something to show and the educational mute/solo still
 * lets users hear what each lane is doing.
 *
 * Mute/solo strategy:
 *   - MX (Howler):   `howl.mute(true)` cuts it cleanly mid-playback.
 *   - FX / NX (Tone): evaluated at scheduled trigger time. If a sample is
 *     already ringing when you mute, it decays naturally — acceptable for
 *     a teaching tool, much simpler than per-track gain plumbing.
 */

import { Howl } from 'howler';
import * as Tone from 'tone';
import {
  type Scene,
  type TrackId,
  type ComposedNote,
  type SfxHit,
  type DroneLayer,
} from '@/data/scenes';
import { ensureAudioStarted, stopAllSynth, resolveInstrument } from './synth';

type Listener = (s: ScenePlayerState) => void;

export interface ScenePlayerState {
  scene: Scene | null;
  status: 'idle' | 'loading' | 'playing' | 'paused';
  currentSec: number;
  durationSec: number;
  muted: Record<TrackId, boolean>;
  solo: TrackId | null;
  hasMxAudio: boolean;
}

class ScenePlayerImpl {
  private scene: Scene | null = null;
  private status: ScenePlayerState['status'] = 'idle';
  private currentSec = 0;
  /** Tone.now() at last play() — used when mxAudio is absent. */
  private startedAtSec = 0;
  private session = 0;
  private timeoutIds: number[] = [];
  private rafId: number | null = null;
  private muted: Record<TrackId, boolean> = { dx: false, mx: false, fx: false, nx: false, vo: false };
  private solo: TrackId | null = null;
  private listeners = new Set<Listener>();
  private mxHowl: Howl | null = null;
  private mxLoaded = false;

  /* ---------- public API ------------------------------------------------- */

  async load(scene: Scene): Promise<void> {
    this.stop();
    this.disposeHowl();
    this.scene = scene;
    this.currentSec = 0;
    this.status = 'loading';
    this.mxLoaded = false;
    this.notify();
    await ensureAudioStarted();

    const usedInsts = new Set<string>();
    for (const f of scene.tracks.fx ?? []) usedInsts.add(f.inst);
    for (const d of scene.tracks.nx ?? []) usedInsts.add(d.inst);
    if (!scene.mxAudio) {
      for (const n of scene.tracks.mx ?? []) usedInsts.add(n.inst);
    }

    const samplerWarms = Array.from(usedInsts).map(async (id) => {
      const handle = resolveInstrument(id);
      if (handle?.kind === 'sampler') {
        await Promise.race([handle.loaded, new Promise((r) => setTimeout(r, 5000))]);
      }
    });

    // Howler load — wrap in a promise so we can await
    let mxLoadP: Promise<void> = Promise.resolve();
    if (scene.mxAudio) {
      mxLoadP = new Promise<void>((resolve, reject) => {
        const url = `${import.meta.env.BASE_URL}${scene.mxAudio!.replace(/^\//, '')}`;
        this.mxHowl = new Howl({
          src: [url],
          html5: true,
          preload: true,
          volume: scene.mxAudioGain ?? 0.85,
          onload: () => {
            this.mxLoaded = true;
            resolve();
          },
          onloaderror: (_id, err) => {
            console.error(`[scenePlayer] mxAudio load failed: ${url}`, err);
            this.mxLoaded = false;
            resolve(); // don't reject — fall back to synth
          },
          onend: () => {
            if (this.status === 'playing') {
              this.status = 'idle';
              this.currentSec = this.scene?.durationSec ?? 0;
              this.cancelSynth();
              this.notify();
            }
          },
        });
      });
    }

    await Promise.race([
      Promise.all([...samplerWarms, mxLoadP]),
      new Promise((r) => setTimeout(r, 8000)),
    ]);

    this.status = 'idle';
    this.notify();
  }

  play(): void {
    if (!this.scene || this.status === 'playing') return;
    const fromSec = this.currentSec >= this.scene.durationSec ? 0 : this.currentSec;
    this.currentSec = fromSec;
    this.session++;
    const session = this.session;
    this.status = 'playing';
    this.notify();

    // Start Howler MX from current position
    if (this.mxHowl && this.mxLoaded) {
      this.mxHowl.seek(fromSec);
      this.mxHowl.mute(this.effectiveMuted('mx'));
      this.mxHowl.play();
    }

    // Anchor synth scheduling clock
    this.startedAtSec = Tone.now() - fromSec;

    this.scheduleScene(fromSec, session);
    this.startTicker();
  }

  pause(): void {
    if (!this.scene) return;
    this.cancelSynth();
    if (this.mxHowl && this.mxHowl.playing()) this.mxHowl.pause();
    this.status = 'paused';
    if (this.mxHowl && this.mxLoaded) {
      this.currentSec = Math.min(this.mxHowl.seek() as number, this.scene.durationSec);
    } else {
      this.currentSec = Math.min(Tone.now() - this.startedAtSec, this.scene.durationSec);
    }
    this.notify();
  }

  stop(): void {
    this.cancelSynth();
    if (this.mxHowl) this.mxHowl.stop();
    this.status = 'idle';
    this.currentSec = 0;
    this.notify();
  }

  seek(sec: number): void {
    if (!this.scene) return;
    const was = this.status;
    this.cancelSynth();
    if (this.mxHowl) this.mxHowl.stop();
    this.currentSec = Math.max(0, Math.min(sec, this.scene.durationSec));
    if (was === 'playing') {
      this.status = 'idle'; // play() exits early if already playing
      this.play();
    } else {
      this.status = 'paused';
      this.notify();
    }
  }

  setMuted(track: TrackId, muted: boolean): void {
    this.muted = { ...this.muted, [track]: muted };
    this.applyMxMute();
    this.notify();
  }

  setSolo(track: TrackId | null): void {
    this.solo = track;
    this.applyMxMute();
    this.notify();
  }

  toggleSolo(track: TrackId): void {
    this.solo = this.solo === track ? null : track;
    this.applyMxMute();
    this.notify();
  }

  getState(): ScenePlayerState {
    return {
      scene: this.scene,
      status: this.status,
      currentSec: this.currentSec,
      durationSec: this.scene?.durationSec ?? 0,
      muted: { ...this.muted },
      solo: this.solo,
      hasMxAudio: !!this.scene?.mxAudio,
    };
  }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => this.listeners.delete(cb);
  }

  /* ---------- internals --------------------------------------------------- */

  private effectiveMuted(track: TrackId): boolean {
    if (this.solo) return this.solo !== track;
    return !!this.muted[track];
  }

  private applyMxMute(): void {
    if (!this.mxHowl) return;
    this.mxHowl.mute(this.effectiveMuted('mx'));
  }

  private notify(): void {
    const s = this.getState();
    for (const l of this.listeners) l(s);
  }

  private cancelSynth(): void {
    this.session++;
    for (const id of this.timeoutIds) window.clearTimeout(id);
    this.timeoutIds = [];
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    stopAllSynth();
  }

  private disposeHowl(): void {
    if (this.mxHowl) {
      this.mxHowl.unload();
      this.mxHowl = null;
    }
    this.mxLoaded = false;
  }

  private scheduleScene(fromSec: number, session: number): void {
    const scene = this.scene!;
    // MX synth — only when no real audio for this scene
    if (!scene.mxAudio) {
      for (const n of scene.tracks.mx ?? []) this.scheduleNote(n, 'mx', fromSec, session);
    }
    for (const f of scene.tracks.fx ?? []) this.scheduleNote(f, 'fx', fromSec, session);
    for (const d of scene.tracks.nx ?? []) this.scheduleDrone(d, fromSec, session);

    // End marker (only meaningful when no mxAudio — Howler emits its own onend)
    if (!scene.mxAudio) {
      const endTid = window.setTimeout(() => {
        if (session !== this.session) return;
        this.status = 'idle';
        this.currentSec = scene.durationSec;
        this.notify();
      }, Math.max(0, (scene.durationSec - fromSec) * 1000));
      this.timeoutIds.push(endTid);
    }
  }

  private scheduleNote(n: ComposedNote | SfxHit, track: TrackId, fromSec: number, session: number): void {
    const delay = (n.at - fromSec) * 1000;
    if (delay < -50) return;
    const tid = window.setTimeout(() => {
      if (session !== this.session) return;
      if (this.effectiveMuted(track)) return;
      const handle = resolveInstrument(n.inst);
      if (!handle) return;
      if (handle.kind === 'sampler') {
        if (!handle.sampler.loaded) return;
        handle.sampler.triggerAttackRelease(n.note ?? 'C4', n.dur, Tone.now() + 0.02, n.vel ?? 0.8);
      } else {
        (handle.synth as Tone.PolySynth).triggerAttackRelease(n.note ?? 'C4', n.dur, Tone.now() + 0.02, n.vel ?? 0.8);
      }
    }, Math.max(0, delay));
    this.timeoutIds.push(tid);
  }

  private scheduleDrone(d: DroneLayer, fromSec: number, session: number): void {
    const startDelay = (d.startAt - fromSec) * 1000;
    const dur = Math.max(0, d.endAt - Math.max(d.startAt, fromSec));
    if (dur <= 0) return;
    const tid = window.setTimeout(() => {
      if (session !== this.session) return;
      if (this.effectiveMuted('nx')) return;
      const handle = resolveInstrument(d.inst);
      if (!handle) return;
      const notes = Array.isArray(d.note) ? d.note : [d.note];
      if (handle.kind === 'sampler') {
        if (!handle.sampler.loaded) return;
        for (const n of notes) {
          handle.sampler.triggerAttackRelease(n, dur, Tone.now() + 0.02, d.vel ?? 0.5);
        }
      } else {
        (handle.synth as Tone.PolySynth).triggerAttackRelease(notes, dur, Tone.now() + 0.02, d.vel ?? 0.5);
      }
    }, Math.max(0, startDelay));
    this.timeoutIds.push(tid);
  }

  private startTicker(): void {
    const tick = () => {
      if (this.status !== 'playing' || !this.scene) {
        this.rafId = null;
        return;
      }
      const rawHowlPos = this.mxHowl && this.mxLoaded ? (this.mxHowl.seek() as number) : null;
      const rawSynthPos = Tone.now() - this.startedAtSec;
      const pos = rawHowlPos != null ? rawHowlPos : rawSynthPos;
      this.currentSec = Math.min(pos, this.scene.durationSec);
      this.notify();

      // Hard-cap at the designed scene duration. The AI-generated mx audio
      // is usually longer than the scripted scene (MiniMax ignores duration
      // hints) — we play only the first durationSec so it lines up with
      // FX/NX events and annotations.
      if (pos >= this.scene.durationSec) {
        this.rafId = null;
        this.cancelSynth();
        if (this.mxHowl) this.mxHowl.stop();
        this.status = 'idle';
        this.currentSec = this.scene.durationSec;
        this.notify();
        return;
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}

export const scenePlayer = new ScenePlayerImpl();

import { useEffect, useState } from 'react';
export function useScenePlayer(): ScenePlayerState {
  const [s, setS] = useState<ScenePlayerState>(() => scenePlayer.getState());
  useEffect(() => scenePlayer.subscribe(setS), []);
  return s;
}
