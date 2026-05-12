/**
 * Composition player — successor to scenePlayer, designed to be edited
 * while running.
 *
 * Three execution paths:
 *   - NoteClip  → schedule each note via setTimeout, fire on Tone.Sampler
 *   - DroneClip → schedule one sustained triggerAttackRelease at clip.startSec
 *   - AudioClip → Howl per clip; play() / stop() / seek() / mute() per clip
 *
 * Clock:
 *   A wall-clock anchor drives `currentSec`. Each play() records when the
 *   transport started and the offset it started from. The rAF ticker computes
 *   `currentSec = startedFromSec + (performance.now() - startedAtMs)/1000`.
 *   Audio clips are scheduled relative to this clock so they stay in sync.
 *
 * Edits while playing:
 *   - Volume / mute / solo changes apply live (lane gain on samplers, per-clip
 *     howl.volume()/.mute() on audio).
 *   - Clip add/remove or startSec/durSec changes re-schedule from currentSec.
 *
 * Mute rules mirror scenePlayer:
 *   - laneSolo: only that lane audible.
 *   - laneMute: hides one lane.
 *   - clip.muted: hides one clip even if lane is audible.
 */

import { Howl } from 'howler';
import * as Tone from 'tone';
import { useEffect, useState } from 'react';
import {
  type Clip,
  type ClipId,
  type Composition,
  type NoteClip,
  type DroneClip,
  type AudioClip,
  emptyComposition,
  isLaneAudible,
} from './composition';
import type { TrackId } from '@/data/scenes';
import { ensureAudioStarted, resolveInstrument, stopAllSynth } from './synth';

type Listener = (s: CompositionPlayerState) => void;

export interface CompositionPlayerState {
  composition: Composition;
  status: 'idle' | 'loading' | 'playing' | 'paused';
  currentSec: number;
}

class CompositionPlayerImpl {
  private comp: Composition = emptyComposition();
  private status: CompositionPlayerState['status'] = 'idle';
  private currentSec = 0;

  /** Wall-clock anchor at last play(). */
  private startedAtMs = 0;
  /** currentSec value when we hit play() — added to (now-startedAtMs)/1000. */
  private startedFromSec = 0;

  private session = 0;
  private timeoutIds: number[] = [];
  private rafId: number | null = null;
  private listeners = new Set<Listener>();

  /** Howl per AudioClip — kept alive across play/pause for fast restarts. */
  private howls = new Map<ClipId, Howl>();
  /** Whether each howl has finished its initial preload. */
  private howlLoaded = new Map<ClipId, boolean>();

  /* ---------- public API ------------------------------------------------- */

  /**
   * Replace the composition. Returns when audio buffers have been warmed
   * (or the warm timeout elapses). Status stays 'idle' throughout — the UI
   * shouldn't lock waiting for audio context, which can't resume until a
   * user gesture (button click) anyway.
   */
  async setComposition(comp: Composition): Promise<void> {
    const wasPlaying = this.status === 'playing';
    this.stop();
    this.disposeHowls();
    this.comp = comp;
    this.currentSec = 0;
    this.status = 'idle';
    this.notify();

    // Warm samplers + audio clips in the background. Don't gate on
    // ensureAudioStarted — Tone.start() blocks until user gesture under
    // autoplay policy, and Howler / fetch don't need the audio context.
    const warms: Promise<unknown>[] = [];
    const usedInsts = new Set<string>();
    for (const c of comp.clips) {
      if (c.kind === 'notes' || c.kind === 'drone') usedInsts.add(c.inst);
      if (c.kind === 'audio') warms.push(this.preloadAudio(c));
    }
    for (const id of usedInsts) {
      const handle = resolveInstrument(id);
      if (handle?.kind === 'sampler') {
        warms.push(Promise.race([handle.loaded, new Promise((r) => setTimeout(r, 5000))]));
      }
    }
    await Promise.race([Promise.all(warms), new Promise((r) => setTimeout(r, 8000))]);

    if (wasPlaying) this.play();
  }

  /** Replace composition state without re-warming — for live knob/clip edits. */
  patchComposition(next: Composition): void {
    const prev = this.comp;
    const structurallyChanged = clipsStructurallyDiffer(prev.clips, next.clips);
    this.comp = next;
    // Live-apply lane vol / clip vol on audio howls
    for (const c of next.clips) {
      if (c.kind === 'audio') {
        const howl = this.howls.get(c.id);
        if (howl) {
          howl.volume(this.effectiveAudioGain(c));
          howl.mute(!this.shouldPlay(c));
        }
      }
    }
    if (structurallyChanged && this.status === 'playing') {
      this.reschedule();
    }
    this.notify();
  }

  play(): void {
    if (this.status === 'playing') return;
    if (!this.comp.clips.length && this.comp.durationSec <= 0) return;

    // play() is reached only from a user gesture (button click), so it is
    // the right place to start the AudioContext. Tone.start() resolves
    // immediately once context.resume() succeeds.
    void ensureAudioStarted();

    const fromSec = this.currentSec >= this.comp.durationSec ? 0 : this.currentSec;
    this.currentSec = fromSec;
    this.session += 1;
    this.startedAtMs = performance.now();
    this.startedFromSec = fromSec;
    this.status = 'playing';
    this.notify();

    this.schedule(fromSec, this.session);
    this.startTicker();
  }

  pause(): void {
    if (this.status !== 'playing') return;
    this.cancelScheduled();
    for (const [id, howl] of this.howls) {
      if (howl.playing()) howl.pause();
      void id;
    }
    this.currentSec = this.computeNowSec();
    this.status = 'paused';
    this.notify();
  }

  stop(): void {
    this.cancelScheduled();
    for (const howl of this.howls.values()) howl.stop();
    this.status = 'idle';
    this.currentSec = 0;
    this.notify();
  }

  seek(sec: number): void {
    const was = this.status;
    this.cancelScheduled();
    for (const howl of this.howls.values()) howl.stop();
    this.currentSec = Math.max(0, Math.min(sec, this.comp.durationSec));
    if (was === 'playing') {
      this.status = 'idle';
      this.play();
    } else {
      this.status = 'paused';
      this.notify();
    }
  }

  getState(): CompositionPlayerState {
    return {
      composition: this.comp,
      status: this.status,
      currentSec: this.currentSec,
    };
  }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => this.listeners.delete(cb);
  }

  dispose(): void {
    this.stop();
    this.disposeHowls();
    this.comp = emptyComposition();
    this.notify();
  }

  /* ---------- internals --------------------------------------------------- */

  private notify(): void {
    const s = this.getState();
    for (const l of this.listeners) l(s);
  }

  private cancelScheduled(): void {
    this.session += 1;
    for (const id of this.timeoutIds) window.clearTimeout(id);
    this.timeoutIds = [];
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    stopAllSynth();
  }

  private reschedule(): void {
    if (this.status !== 'playing') return;
    const fromSec = this.computeNowSec();
    this.cancelScheduled();
    for (const howl of this.howls.values()) howl.stop();
    this.session += 1;
    this.startedAtMs = performance.now();
    this.startedFromSec = fromSec;
    this.currentSec = fromSec;
    this.schedule(fromSec, this.session);
    this.startTicker();
  }

  private computeNowSec(): number {
    if (this.status !== 'playing') return this.currentSec;
    const delta = (performance.now() - this.startedAtMs) / 1000;
    return Math.min(this.startedFromSec + delta, this.comp.durationSec);
  }

  private schedule(fromSec: number, session: number): void {
    for (const clip of this.comp.clips) {
      if (clip.startSec + clip.durSec <= fromSec) continue; // already past
      if (clip.kind === 'audio') this.scheduleAudio(clip, fromSec, session);
      else if (clip.kind === 'drone') this.scheduleDrone(clip, fromSec, session);
      else this.scheduleNotes(clip, fromSec, session);
    }
    // End marker
    const endDelay = Math.max(0, (this.comp.durationSec - fromSec) * 1000);
    const endTid = window.setTimeout(() => {
      if (session !== this.session) return;
      this.cancelScheduled();
      for (const howl of this.howls.values()) howl.stop();
      this.status = 'idle';
      this.currentSec = this.comp.durationSec;
      this.notify();
    }, endDelay);
    this.timeoutIds.push(endTid);
  }

  private scheduleAudio(clip: AudioClip, fromSec: number, session: number): void {
    const howl = this.howls.get(clip.id);
    if (!howl) return;
    const startDelay = Math.max(0, (clip.startSec - fromSec) * 1000);
    const seekInto = fromSec > clip.startSec ? fromSec - clip.startSec : 0;
    const playFn = () => {
      if (session !== this.session) return;
      const offset = (clip.audioOffsetSec ?? 0) + seekInto;
      try {
        howl.seek(offset);
      } catch {
        // ignore — howl may not be fully loaded
      }
      howl.volume(this.effectiveAudioGain(clip));
      howl.mute(!this.shouldPlay(clip));
      howl.play();
      // Hard-stop at clip end
      const clipEndDelay = Math.max(0, (clip.startSec + clip.durSec - this.computeNowSec()) * 1000);
      const stopTid = window.setTimeout(() => {
        if (session !== this.session) return;
        try { howl.stop(); } catch { /* ignore */ }
      }, clipEndDelay);
      this.timeoutIds.push(stopTid);
    };
    if (startDelay <= 0) playFn();
    else this.timeoutIds.push(window.setTimeout(playFn, startDelay));
  }

  private scheduleNotes(clip: NoteClip, fromSec: number, session: number): void {
    const handle = resolveInstrument(clip.inst);
    if (!handle) return;
    for (const n of clip.notes) {
      const at = clip.startSec + n.at;
      if (at + 0.05 < fromSec) continue;
      if (at >= clip.startSec + clip.durSec) continue;
      const delay = Math.max(0, (at - fromSec) * 1000);
      const tid = window.setTimeout(() => {
        if (session !== this.session) return;
        if (!this.shouldPlay(clip)) return;
        const v = (n.vel ?? 0.8) * clip.vol * this.laneGain(clip.lane);
        if (handle.kind === 'sampler') {
          if (!handle.sampler.loaded) return;
          handle.sampler.triggerAttackRelease(n.note, n.dur, Tone.now() + 0.02, v);
        } else {
          (handle.synth as Tone.PolySynth).triggerAttackRelease(n.note, n.dur, Tone.now() + 0.02, v);
        }
      }, delay);
      this.timeoutIds.push(tid);
    }
  }

  private scheduleDrone(clip: DroneClip, fromSec: number, session: number): void {
    const handle = resolveInstrument(clip.inst);
    if (!handle) return;
    const startAt = Math.max(clip.startSec, fromSec);
    const remaining = clip.startSec + clip.durSec - startAt;
    if (remaining <= 0) return;
    const delay = Math.max(0, (clip.startSec - fromSec) * 1000);
    const tid = window.setTimeout(() => {
      if (session !== this.session) return;
      if (!this.shouldPlay(clip)) return;
      const notes = Array.isArray(clip.hold) ? clip.hold : [clip.hold];
      const v = (clip.vel ?? 0.5) * clip.vol * this.laneGain(clip.lane);
      const dur = clip.durSec - Math.max(0, fromSec - clip.startSec);
      if (handle.kind === 'sampler') {
        if (!handle.sampler.loaded) return;
        for (const n of notes) {
          handle.sampler.triggerAttackRelease(n, dur, Tone.now() + 0.02, v);
        }
      } else {
        (handle.synth as Tone.PolySynth).triggerAttackRelease(notes, dur, Tone.now() + 0.02, v);
      }
    }, delay);
    this.timeoutIds.push(tid);
  }

  private startTicker(): void {
    const tick = () => {
      if (this.status !== 'playing') {
        this.rafId = null;
        return;
      }
      this.currentSec = this.computeNowSec();
      this.notify();
      if (this.currentSec >= this.comp.durationSec) {
        this.rafId = null;
        return; // end-of-composition setTimeout will finalize
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  /* ---------- mute / gain plumbing ---------------------------------------- */

  private shouldPlay(clip: Clip): boolean {
    if (clip.muted) return false;
    return isLaneAudible(this.comp, clip.lane);
  }

  private laneGain(lane: TrackId): number {
    if (!isLaneAudible(this.comp, lane)) return 0;
    return this.comp.laneVol[lane] ?? 0.8;
  }

  private effectiveAudioGain(clip: AudioClip): number {
    return clip.vol * this.laneGain(clip.lane);
  }

  /* ---------- howl management --------------------------------------------- */

  private preloadAudio(clip: AudioClip): Promise<void> {
    return new Promise((resolve) => {
      const url = `${import.meta.env.BASE_URL}${clip.url.replace(/^\//, '')}`;
      const howl = new Howl({
        src: [url],
        html5: true,
        preload: true,
        volume: this.effectiveAudioGain(clip),
        onload: () => {
          this.howlLoaded.set(clip.id, true);
          resolve();
        },
        onloaderror: (_id, err) => {
          console.error(`[compositionPlayer] audio load failed: ${url}`, err);
          this.howlLoaded.set(clip.id, false);
          resolve();
        },
      });
      this.howls.set(clip.id, howl);
    });
  }

  private disposeHowls(): void {
    for (const howl of this.howls.values()) {
      try { howl.unload(); } catch { /* ignore */ }
    }
    this.howls.clear();
    this.howlLoaded.clear();
  }
}

function clipsStructurallyDiffer(a: Clip[], b: Clip[]): boolean {
  if (a.length !== b.length) return true;
  const byId = new Map(a.map((c) => [c.id, c]));
  for (const nb of b) {
    const oa = byId.get(nb.id);
    if (!oa) return true;
    if (oa.kind !== nb.kind) return true;
    if (oa.startSec !== nb.startSec) return true;
    if (oa.durSec !== nb.durSec) return true;
    if (oa.lane !== nb.lane) return true;
    if ((oa as NoteClip).inst !== (nb as NoteClip).inst) return true;
    // Note arrays / hold values — shallow check by reference; UI passes new arrays only on edit
    if (oa.kind === 'notes' && (oa as NoteClip).notes !== (nb as NoteClip).notes) return true;
    if (oa.kind === 'drone' && (oa as DroneClip).hold !== (nb as DroneClip).hold) return true;
    if (oa.kind === 'audio' && (oa as AudioClip).url !== (nb as AudioClip).url) return true;
  }
  return false;
}

export const compositionPlayer = new CompositionPlayerImpl();

export function useCompositionPlayer(): CompositionPlayerState {
  const [s, setS] = useState<CompositionPlayerState>(() => compositionPlayer.getState());
  useEffect(() => compositionPlayer.subscribe(setS), []);
  return s;
}
