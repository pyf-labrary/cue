/**
 * Composition — the editable score that powers Sandbox (M5) and the
 * interactive widgets inside Lessons (M4).
 *
 * Three clip kinds cover everything the existing scenes do plus what the
 * sandbox needs:
 *
 *   - `notes`  : a sequence of triggered notes (Tone.Sampler / synth recipe).
 *                Used for melodic phrases, ostinati, stinger volleys.
 *   - `drone`  : one or more held notes for the lifetime of the clip.
 *                Used for pad beds, organ pedal tones, ambient nx.
 *   - `audio`  : a pre-recorded sound file (Howler). Used for AI-generated
 *                MX recordings, vocal samples, foley.
 *
 * Mute strategy mirrors scenePlayer:
 *   - lane-level mute/solo wraps everything in that lane.
 *   - clip-level `muted` lets a lesson hide one clip without changing UI.
 *
 * This module is data-only — playback lives in compositionPlayer.ts so the
 * shape can be inspected/serialised without pulling in Tone.js.
 */
import type { TrackId } from '@/data/scenes';
import { EMOTION_PREVIEWS, type EmotionId } from '@/data/emotions';

export type ClipId = string;

export interface ClipNote {
  /** Pitch in scientific notation, e.g. "C4", "F#3". */
  note: string;
  /** Duration as a Tone.js beat string, e.g. "8n", "4n.", "2n". */
  dur: string;
  /** Start offset in seconds, relative to the clip's startSec. */
  at: number;
  /** 0..1 velocity. Default 0.8. */
  vel?: number;
}

interface ClipBase {
  id: ClipId;
  lane: TrackId;
  /** Start time in seconds, relative to composition. */
  startSec: number;
  /** Length in seconds. Hard cutoff for everything inside this clip. */
  durSec: number;
  /** Clip gain 0..1. Default 1. */
  vol: number;
  /** Optional per-clip mute (orthogonal to lane mute). */
  muted?: boolean;
  /** Display name in the sandbox UI. Falls back to inst/file name. */
  label?: string;
  /** Optional color override for the clip block. */
  color?: string;
}

export interface NoteClip extends ClipBase {
  kind: 'notes';
  /** Instrument id understood by resolveInstrument() in synth.ts. */
  inst: string;
  notes: ClipNote[];
}

export interface DroneClip extends ClipBase {
  kind: 'drone';
  inst: string;
  /** Single note or chord — held for the entire clip duration. */
  hold: string | string[];
  vel?: number;
}

export interface AudioClip extends ClipBase {
  kind: 'audio';
  /** URL relative to site root, e.g. "/scenes/jaws/mx.mp3". */
  url: string;
  /** Seek into the source file when starting playback. Default 0. */
  audioOffsetSec?: number;
}

export type Clip = NoteClip | DroneClip | AudioClip;

export interface Composition {
  durationSec: number;
  /** Optional grid hint for the sandbox UI; not used by the engine. */
  bpm?: number;
  laneVol: Record<TrackId, number>;
  laneMute: Record<TrackId, boolean>;
  laneSolo: TrackId | null;
  clips: Clip[];
}

/* -------------------------------------------------------------------------- */
/*  Factories / helpers                                                       */
/* -------------------------------------------------------------------------- */

const LANES: TrackId[] = ['dx', 'mx', 'fx', 'nx', 'vo'];

export function emptyComposition(durationSec = 24): Composition {
  return {
    durationSec,
    bpm: 80,
    laneVol: Object.fromEntries(LANES.map((l) => [l, 0.8])) as Record<TrackId, number>,
    laneMute: Object.fromEntries(LANES.map((l) => [l, false])) as Record<TrackId, boolean>,
    laneSolo: null,
    clips: [],
  };
}

let cidCounter = 0;
export function newClipId(prefix = 'c'): ClipId {
  cidCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${cidCounter}`;
}

/**
 * Build a NoteClip from a phrase — quick path for sandbox drop-in and lesson
 * widgets. `at` values inside `notes` should already be relative to clip start.
 */
export function makeNoteClip(opts: {
  lane: TrackId;
  inst: string;
  notes: ClipNote[];
  startSec: number;
  durSec: number;
  vol?: number;
  label?: string;
}): NoteClip {
  return {
    id: newClipId('n'),
    kind: 'notes',
    lane: opts.lane,
    inst: opts.inst,
    notes: opts.notes,
    startSec: opts.startSec,
    durSec: opts.durSec,
    vol: opts.vol ?? 1,
    label: opts.label,
  };
}

export function makeDroneClip(opts: {
  lane: TrackId;
  inst: string;
  hold: string | string[];
  startSec: number;
  durSec: number;
  vol?: number;
  vel?: number;
  label?: string;
}): DroneClip {
  return {
    id: newClipId('d'),
    kind: 'drone',
    lane: opts.lane,
    inst: opts.inst,
    hold: opts.hold,
    startSec: opts.startSec,
    durSec: opts.durSec,
    vol: opts.vol ?? 1,
    vel: opts.vel,
    label: opts.label,
  };
}

export function makeAudioClip(opts: {
  lane: TrackId;
  url: string;
  startSec: number;
  durSec: number;
  vol?: number;
  audioOffsetSec?: number;
  label?: string;
}): AudioClip {
  return {
    id: newClipId('a'),
    kind: 'audio',
    lane: opts.lane,
    url: opts.url,
    startSec: opts.startSec,
    durSec: opts.durSec,
    vol: opts.vol ?? 1,
    audioOffsetSec: opts.audioOffsetSec,
    label: opts.label,
  };
}

/* -------------------------------------------------------------------------- */
/*  Scene → Composition bridge                                                */
/* -------------------------------------------------------------------------- */

import type { Scene } from '@/data/scenes';

/**
 * Adapter so a Scene can be played through the new engine. This lets the
 * sandbox open any scene as a starting composition and lets lessons reuse
 * scene data without dragging in scenePlayer.
 */
export function sceneToComposition(scene: Scene): Composition {
  const comp = emptyComposition(scene.durationSec);
  comp.bpm = 80;

  if (scene.mxAudio) {
    comp.clips.push(
      makeAudioClip({
        lane: 'mx',
        url: scene.mxAudio,
        startSec: 0,
        durSec: scene.durationSec,
        vol: scene.mxAudioGain ?? 0.85,
        label: '真录音 MX',
      }),
    );
  } else {
    for (const n of scene.tracks.mx ?? []) {
      comp.clips.push(
        makeNoteClip({
          lane: 'mx',
          inst: n.inst,
          notes: [{ note: n.note, dur: n.dur, at: 0, vel: n.vel }],
          startSec: n.at,
          durSec: estimateDurSec(n.dur) + 0.2,
          label: n.inst,
        }),
      );
    }
  }
  for (const f of scene.tracks.fx ?? []) {
    comp.clips.push(
      makeNoteClip({
        lane: 'fx',
        inst: f.inst,
        notes: [{ note: f.note ?? 'C4', dur: f.dur, at: 0, vel: f.vel }],
        startSec: f.at,
        durSec: estimateDurSec(f.dur) + 0.1,
        label: f.inst,
      }),
    );
  }
  for (const d of scene.tracks.nx ?? []) {
    comp.clips.push(
      makeDroneClip({
        lane: 'nx',
        inst: d.inst,
        hold: d.note,
        startSec: d.startAt,
        durSec: Math.max(0.1, d.endAt - d.startAt),
        vol: 1,
        vel: d.vel,
        label: d.inst,
      }),
    );
  }
  return comp;
}

/**
 * Build a tiny multi-instrument composition from an emotion's preview phrase.
 * Notes are grouped into one NoteClip per instrument so they play together.
 * Used by the home-page "听一下" preview — distinct per emotion (see
 * EMOTION_PREVIEWS), unlike the old "play the first instrument's phrase".
 */
export function emotionToComposition(id: EmotionId): Composition {
  const preview = EMOTION_PREVIEWS[id] ?? [];
  const byInst = new Map<string, ClipNote[]>();
  let maxEnd = 0;
  for (const p of preview) {
    const notes = Array.isArray(p.note) ? p.note : [p.note];
    const arr = byInst.get(p.inst) ?? [];
    for (const n of notes) arr.push({ note: n, dur: p.dur, at: p.at, vel: p.vel });
    byInst.set(p.inst, arr);
    maxEnd = Math.max(maxEnd, p.at + estimateDurSec(p.dur));
  }
  const durationSec = Math.max(2, maxEnd + 1.5);
  const comp = emptyComposition(durationSec);
  for (const [inst, notes] of byInst) {
    comp.clips.push(makeNoteClip({ lane: 'mx', inst, notes, startSec: 0, durSec: durationSec, label: inst }));
  }
  return comp;
}

export function estimateDurSec(dur: string, bpm = 80): number {
  const sec = 60 / bpm;
  switch (dur) {
    case '32n': return sec / 8;
    case '16n': return sec / 4;
    case '8n':  return sec / 2;
    case '8n.': return sec * 0.75;
    case '4n':  return sec;
    case '4n.': return sec * 1.5;
    case '2n':  return sec * 2;
    case '2n.': return sec * 3;
    case '1n':  return sec * 4;
    default:    return sec;
  }
}

/* -------------------------------------------------------------------------- */
/*  Pure mutators (return new Composition — kept immutable for React state)   */
/* -------------------------------------------------------------------------- */

export function withClip(comp: Composition, clip: Clip): Composition {
  return { ...comp, clips: [...comp.clips, clip] };
}

export function withoutClip(comp: Composition, id: ClipId): Composition {
  return { ...comp, clips: comp.clips.filter((c) => c.id !== id) };
}

export function updateClip(comp: Composition, id: ClipId, patch: Partial<Clip>): Composition {
  return {
    ...comp,
    clips: comp.clips.map((c) => (c.id === id ? ({ ...c, ...patch } as Clip) : c)),
  };
}

export function setLaneVol(comp: Composition, lane: TrackId, vol: number): Composition {
  return { ...comp, laneVol: { ...comp.laneVol, [lane]: clamp01(vol) } };
}

export function setLaneMute(comp: Composition, lane: TrackId, muted: boolean): Composition {
  return { ...comp, laneMute: { ...comp.laneMute, [lane]: muted } };
}

export function toggleLaneSolo(comp: Composition, lane: TrackId): Composition {
  return { ...comp, laneSolo: comp.laneSolo === lane ? null : lane };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function isLaneAudible(comp: Composition, lane: TrackId): boolean {
  if (comp.laneSolo) return comp.laneSolo === lane;
  return !comp.laneMute[lane];
}
