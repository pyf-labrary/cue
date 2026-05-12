/**
 * Phrase engine.
 *
 * Backends (all behind `playSynthPhrase(id)`):
 *   1. Tone.Sampler with CC recordings hosted on nbrosowsky.github.io
 *      — 10 western orchestral + 5 surrogate maps for Chinese folk + choir
 *      (real samples, just rebadged: guzheng→harp, pipa→guitar-nylon,
 *      guqin→harp, erhu→bassoon, choir→harmonium).
 *   2. Synth fallback for the remaining instruments without close surrogates.
 *
 * All output is scheduled on Tone.Transport so it can be hard-stopped.
 */

import * as Tone from 'tone';

type Note = string;
type Beat = string;

export interface SynthPhrase {
  durationMs: number;
  notes: Array<{ note: Note; dur: Beat; at: number; vel?: number }>;
}

interface SamplerDef {
  folder: string;
  urls: Record<string, string>;
  release?: number;
  gain?: number;
  /** If true, this entry borrows samples from another instrument family. */
  surrogate?: boolean;
}

interface SynthRecipe {
  build: () => Tone.PolySynth | Tone.MembraneSynth | Tone.PluckSynth | Tone.FMSynth | Tone.AMSynth;
  chain?: () => Tone.ToneAudioNode[];
  gain?: number;
}

/* -------------------------------------------------------------------------- */
/*  Global state                                                              */
/* -------------------------------------------------------------------------- */

let started = false;
let fxIn: Tone.Gain | null = null;
let activeSources: Array<Tone.ToneAudioNode> = [];
let toneAnalyser: Tone.Analyser | null = null;

export async function ensureAudioStarted(): Promise<void> {
  if (started) return;
  await Tone.start();
  started = true;
  buildFxBus();
}

let toneRecordDest: MediaStreamAudioDestinationNode | null = null;
let toneRecordGain: Tone.Gain | null = null;

function buildFxBus(): void {
  if (fxIn) return;
  const limiter = new Tone.Limiter(-3).toDestination();
  const reverb = new Tone.Reverb({ decay: 3.0, preDelay: 0.025, wet: 0.28 }).connect(limiter);
  fxIn = new Tone.Gain(0.85).connect(reverb);
  fxIn.connect(limiter); // also dry to preserve transients
  // FFT analyser tap — pre-limiter so we see raw synth dynamics. 128 bins
  // → ~172 Hz/bin at 44.1k, enough low-frequency resolution for bass content.
  toneAnalyser = new Tone.Analyser('fft', 128);
  fxIn.connect(toneAnalyser);
  // Parallel recording bus — taps the same signal as the limiter so a
  // MediaRecorder elsewhere can capture audio without affecting playback.
  const rawCtx = (Tone.context as unknown as { rawContext?: BaseAudioContext }).rawContext as AudioContext | undefined;
  const ctxForRec = rawCtx ?? (Tone.context as unknown as AudioContext);
  toneRecordDest = ctxForRec.createMediaStreamDestination();
  toneRecordGain = new Tone.Gain(1);
  fxIn.connect(toneRecordGain);
  toneRecordGain.connect(toneRecordDest);
}

/** FFT analyser on the Tone synth bus. Null until ensureAudioStarted resolves. */
export function getToneAnalyser(): Tone.Analyser | null {
  if (!toneAnalyser) buildFxBus();
  return toneAnalyser;
}

/** MediaStream carrying the Tone synth/sampler output for recording. */
export function getToneRecordStream(): MediaStream | null {
  if (!toneRecordDest) buildFxBus();
  return toneRecordDest?.stream ?? null;
}

function fxNode(): Tone.Gain {
  if (!fxIn) buildFxBus();
  return fxIn!;
}

/* -------------------------------------------------------------------------- */
/*  Sampler backend                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Served from public/samples/ — vite copies these straight to the dist root,
 * so production URLs become /samples/<folder>/<note>.mp3.
 *
 * Originally sourced from nbrosowsky/tonejs-instruments (CC samples). Mirrored
 * locally by scripts/download-samples.sh so playback is instant and offline.
 */
const SAMPLE_BASE = `${import.meta.env.BASE_URL}samples`;

/** All URLs below have been HTTP-200 verified against the source. */
const SAMPLERS: Record<string, SamplerDef> = {
  /* --- Western orchestral (real samples) ---------------------------------- */
  cello: {
    folder: 'cello',
    urls: { 'C2': 'C2.mp3', 'C3': 'C3.mp3', 'C4': 'C4.mp3', 'A2': 'A2.mp3', 'A3': 'A3.mp3', 'E3': 'E3.mp3' },
    gain: 0.65,
  },
  violin: {
    folder: 'violin',
    urls: { 'A3': 'A3.mp3', 'A4': 'A4.mp3', 'A5': 'A5.mp3', 'C5': 'C5.mp3', 'E5': 'E5.mp3', 'G4': 'G4.mp3' },
    gain: 0.55,
  },
  contrabass: {
    folder: 'contrabass',
    urls: { 'C2': 'C2.mp3', 'D2': 'D2.mp3', 'E2': 'E2.mp3', 'A2': 'A2.mp3', 'E3': 'E3.mp3' },
    gain: 0.65,
  },
  flute: {
    folder: 'flute',
    urls: { 'A4': 'A4.mp3', 'C5': 'C5.mp3', 'E5': 'E5.mp3', 'A5': 'A5.mp3', 'C6': 'C6.mp3' },
    gain: 0.55,
  },
  clarinet: {
    folder: 'clarinet',
    /** A3 is 404 on this host — use As3 (Bb3) as the lowest anchor. */
    urls: { 'A#3': 'As3.mp3', 'D4': 'D4.mp3', 'F4': 'F4.mp3', 'D5': 'D5.mp3', 'F5': 'F5.mp3' },
    gain: 0.6,
  },
  oboe: {
    folder: 'bassoon', // surrogate: oboe samples missing; bassoon is the other double-reed
    urls: { 'C3': 'C3.mp3', 'G3': 'G3.mp3', 'A3': 'A3.mp3', 'C4': 'C4.mp3', 'E4': 'E4.mp3', 'G4': 'G4.mp3', 'C5': 'C5.mp3' },
    gain: 0.55,
    surrogate: true,
  },
  'french-horn': {
    folder: 'french-horn',
    urls: { 'C2': 'C2.mp3', 'D3': 'D3.mp3', 'F3': 'F3.mp3', 'A3': 'A3.mp3', 'C4': 'C4.mp3' },
    gain: 0.6,
  },
  trumpet: {
    folder: 'trumpet',
    urls: { 'C4': 'C4.mp3', 'D#4': 'Ds4.mp3', 'F4': 'F4.mp3', 'G4': 'G4.mp3', 'D5': 'D5.mp3', 'F5': 'F5.mp3', 'A5': 'A5.mp3' },
    gain: 0.45,
  },
  piano: {
    folder: 'piano',
    urls: { 'C2': 'C2.mp3', 'C3': 'C3.mp3', 'C4': 'C4.mp3', 'F4': 'F4.mp3', 'A4': 'A4.mp3', 'C5': 'C5.mp3' },
    gain: 0.65,
  },
  xylophone: {
    folder: 'xylophone',
    urls: { 'G4': 'G4.mp3', 'C5': 'C5.mp3', 'G5': 'G5.mp3', 'C6': 'C6.mp3', 'G6': 'G6.mp3', 'C7': 'C7.mp3' },
    gain: 0.5,
  },
  'pipe-organ': {
    folder: 'organ',
    urls: { 'C2': 'C2.mp3', 'A2': 'A2.mp3', 'C3': 'C3.mp3', 'A3': 'A3.mp3', 'C4': 'C4.mp3', 'A4': 'A4.mp3', 'C5': 'C5.mp3' },
    gain: 0.45,
  },

  /* --- Chinese folk + choir (FluidR3_GM via gleitz/midi-js-soundfonts)
   * Each folder has all 88 chromatic notes pre-rendered (~2MB / instrument).
   * GM patches used (see scripts/unpack-soundfonts.mjs for rationale):
   *   erhu    <- fiddle (GM 110)
   *   pipa    <- sitar  (GM 105)
   *   guzheng <- koto   (GM 108)
   *   guqin   <- shamisen
   *   choir   <- choir_aahs (GM 52)
   * --------------------------------------------------------------------- */
  erhu: {
    folder: 'erhu',
    urls: { 'C3': 'C3.mp3', 'F3': 'F3.mp3', 'A3': 'A3.mp3', 'C4': 'C4.mp3', 'F4': 'F4.mp3', 'A4': 'A4.mp3', 'C5': 'C5.mp3' },
    release: 1.2,
    gain: 0.6,
  },
  pipa: {
    folder: 'pipa',
    urls: { 'C3': 'C3.mp3', 'F3': 'F3.mp3', 'A3': 'A3.mp3', 'C4': 'C4.mp3', 'F4': 'F4.mp3', 'A4': 'A4.mp3', 'C5': 'C5.mp3' },
    gain: 0.65,
  },
  guzheng: {
    folder: 'guzheng',
    urls: { 'C3': 'C3.mp3', 'F3': 'F3.mp3', 'A3': 'A3.mp3', 'C4': 'C4.mp3', 'F4': 'F4.mp3', 'A4': 'A4.mp3', 'C5': 'C5.mp3' },
    gain: 0.65,
  },
  guqin: {
    folder: 'guqin',
    urls: { 'C2': 'C2.mp3', 'F2': 'F2.mp3', 'A2': 'A2.mp3', 'C3': 'C3.mp3', 'F3': 'F3.mp3', 'A3': 'A3.mp3', 'C4': 'C4.mp3' },
    release: 2.2,
    gain: 0.7,
  },
  choir: {
    folder: 'choir',
    urls: { 'C3': 'C3.mp3', 'F3': 'F3.mp3', 'A3': 'A3.mp3', 'C4': 'C4.mp3', 'F4': 'F4.mp3', 'A4': 'A4.mp3', 'C5': 'C5.mp3' },
    release: 1.8,
    gain: 0.5,
  },
};

const samplerCache = new Map<string, { sampler: Tone.Sampler; loaded: Promise<void>; gain: Tone.Gain }>();

function getSampler(id: string): { sampler: Tone.Sampler; loaded: Promise<void>; gain: Tone.Gain } | null {
  const def = SAMPLERS[id];
  if (!def) return null;
  let slot = samplerCache.get(id);
  if (slot) return slot;
  let resolve!: () => void;
  const loaded = new Promise<void>((r) => (resolve = r));
  const sampler = new Tone.Sampler({
    urls: def.urls,
    baseUrl: `${SAMPLE_BASE}/${def.folder}/`,
    release: def.release ?? 0.8,
    onload: () => resolve(),
    onerror: (err) => console.error(`[synth] ${id} buffer decode failed`, err),
  });
  const gain = new Tone.Gain(def.gain ?? 0.6).connect(fxNode());
  sampler.connect(gain);
  slot = { sampler, loaded, gain };
  samplerCache.set(id, slot);
  return slot;
}

export function isSurrogate(id: string): boolean {
  return !!SAMPLERS[id]?.surrogate;
}

/**
 * Hand the scene player a fully-built handle to an instrument so it can
 * trigger notes directly. For samplers, expose the `loaded` promise so the
 * caller can pre-warm before pressing play.
 */
export type InstrumentHandle =
  | { kind: 'sampler'; sampler: Tone.Sampler; loaded: Promise<void> }
  | { kind: 'synth'; synth: Tone.ToneAudioNode };

export function resolveInstrument(id: string): InstrumentHandle | null {
  if (id in SAMPLERS) {
    const slot = getSampler(id);
    if (!slot) return null;
    return { kind: 'sampler', sampler: slot.sampler, loaded: slot.loaded };
  }
  if (id in RECIPES) {
    const synth = getSynth(id);
    if (!synth) return null;
    return { kind: 'synth', synth };
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Synth backend (only what we couldn't sample-surrogate)                    */
/* -------------------------------------------------------------------------- */

const synthCache = new Map<string, Tone.ToneAudioNode>();

function getSynth(id: string): Tone.ToneAudioNode | null {
  const recipe = RECIPES[id];
  if (!recipe) return null;
  let inst = synthCache.get(id);
  if (inst) return inst;
  const built = recipe.build();
  let head: Tone.ToneAudioNode = built;
  const tail = recipe.chain?.() ?? [];
  for (const node of tail) {
    head.connect(node);
    head = node;
  }
  const gain = new Tone.Gain(recipe.gain ?? 0.55).connect(fxNode());
  head.connect(gain);
  inst = built;
  synthCache.set(id, inst);
  return inst;
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

export function hasRecipe(id: string): boolean {
  return id in SAMPLERS || id in RECIPES;
}

/**
 * Cancel anything in flight. Bumping `playSession` makes any pending
 * setTimeout-scheduled triggers turn into no-ops; `releaseAll()` cuts
 * voices that are already sounding.
 */
let playSession = 0;
const timeoutIds: number[] = [];

export function stopAllSynth(): void {
  playSession++;
  for (const id of timeoutIds) window.clearTimeout(id);
  timeoutIds.length = 0;
  for (const src of activeSources) {
    try {
      (src as Tone.PolySynth).releaseAll?.();
    } catch {
      // ignore
    }
  }
  activeSources = [];
}

export async function playSynthPhrase(id: string): Promise<void> {
  await ensureAudioStarted();
  const phrase = PHRASES[id];
  if (!phrase) return;

  stopAllSynth();
  const session = ++playSession;

  let trigger: (note: string, dur: string, vel: number) => void;

  if (id in SAMPLERS) {
    const slot = getSampler(id);
    if (!slot) return;
    // Wait for ALL Tone-pending loads (more reliable than the per-Sampler
    // onload, which can fire before the AudioBuffer is fully wired up).
    await Promise.race([
      Promise.all([slot.loaded, Tone.loaded()]),
      new Promise((res) => window.setTimeout(res, 5000)),
    ]);
    if (session !== playSession) return;
    if (!slot.sampler.loaded) {
      console.warn(`[synth] sampler ${id} not loaded after 5s timeout`);
      return;
    }
    trigger = (n, d, v) => slot.sampler.triggerAttackRelease(n, d, Tone.now() + 0.02, v);
    activeSources = [slot.sampler];
  } else {
    const synth = getSynth(id);
    if (!synth) return;
    trigger = (n, d, v) => (synth as Tone.PolySynth).triggerAttackRelease(n, d, Tone.now() + 0.01, v);
    activeSources = [synth];
  }

  return new Promise((resolve) => {
    for (const n of phrase.notes) {
      const tid = window.setTimeout(() => {
        if (session !== playSession) return;
        trigger(n.note, n.dur, n.vel ?? 0.9);
      }, Math.round(n.at * 1000));
      timeoutIds.push(tid);
    }
    const endTid = window.setTimeout(() => {
      if (session === playSession) {
        activeSources = [];
      }
      resolve();
    }, phrase.durationMs);
    timeoutIds.push(endTid);
  });
}

/* -------------------------------------------------------------------------- */
/*  Phrase composer                                                           */
/* -------------------------------------------------------------------------- */

function compose(beats: Array<[Note | Note[], Beat, number?]>, bpm = 80): SynthPhrase {
  const secPerBeat = 60 / bpm;
  const durSec: Record<Beat, number> = {
    '32n': secPerBeat / 8,
    '16n': secPerBeat / 4,
    '8n': secPerBeat / 2,
    '8n.': secPerBeat * 0.75,
    '4n': secPerBeat,
    '4n.': secPerBeat * 1.5,
    '2n': secPerBeat * 2,
    '2n.': secPerBeat * 3,
    '1n': secPerBeat * 4,
  };
  let cursor = 0;
  const notes: SynthPhrase['notes'] = [];
  for (const [n, d, vel] of beats) {
    const arr = Array.isArray(n) ? n : [n];
    for (const note of arr) notes.push({ note, dur: d, at: cursor, vel });
    cursor += durSec[d] ?? secPerBeat;
  }
  return { durationMs: Math.round((cursor + 1.6) * 1000), notes };
}

/* -------------------------------------------------------------------------- */
/*  Phrases (shared between sampler + synth)                                  */
/* -------------------------------------------------------------------------- */

const PHRASES: Record<string, SynthPhrase> = {
  cello: compose([['E3', '4n.'], ['G3', '4n'], ['F3', '4n.'], ['E3', '2n'], [['C3', 'G3'], '2n']], 70),
  violin: compose([['A4', '8n'], ['B4', '8n'], ['D5', '4n'], ['C#5', '4n.'], ['E5', '2n'], ['D5', '2n']], 90),
  contrabass: compose([['C2', '2n'], ['D#2', '4n.'], ['C2', '1n']], 60),
  flute: compose([['D5', '8n'], ['F5', '8n'], ['A5', '8n'], ['G5', '8n.'], ['F5', '4n'], ['D5', '2n']], 96),
  clarinet: compose([['A#3', '4n'], ['C4', '4n.'], ['D4', '4n'], ['C4', '4n.'], ['A#3', '2n']], 80),
  oboe: compose([['E4', '4n'], ['D4', '8n'], ['F#4', '4n.'], ['E4', '4n.'], ['B3', '2n']], 70),
  'french-horn': compose([['F3', '4n.'], ['A3', '4n'], ['C4', '2n'], ['A#3', '2n.']], 64),
  trumpet: compose([['G4', '8n'], ['C5', '8n'], ['E5', '4n'], ['G5', '4n.'], ['E5', '2n']], 100),
  piano: compose([[['C4', 'E4'], '4n'], ['G4', '8n'], ['B4', '8n'], [['C5', 'E5'], '4n.'], ['A4', '4n'], [['F4', 'A4', 'C5'], '2n']], 84),
  xylophone: compose([['C5', '16n'], ['E5', '16n'], ['G5', '16n'], ['C6', '8n'], ['G5', '8n'], ['E5', '8n'], ['C5', '4n']], 120),
  'pipe-organ': compose([[['C3', 'E3', 'G3'], '2n'], [['A2', 'C3', 'E3'], '2n'], [['F2', 'A2', 'C3'], '2n'], [['G2', 'B2', 'D3'], '2n']], 64),

  /* Now sampler-surrogate-backed */
  erhu: compose([['D4', '4n'], ['F4', '4n.'], ['G4', '4n'], ['F4', '4n.'], ['D4', '2n'], ['A3', '2n']], 72),
  // 古筝：8n 一弹给采样足够时间衰减出共鸣；之前 16n 把每次拨都掐死成"嘀"。
  guzheng: compose([
    ['D4', '4n'], ['F4', '8n'], ['A4', '8n'], ['C5', '4n'],
    ['A4', '8n'], ['G4', '8n'], ['F4', '4n'], ['D4', '2n'],
  ], 96),
  // 琵琶：把 16n 改 8n + BPM 从 132 降到 100，让"扫弦后的回声"听得见。
  pipa: compose([
    ['A3', '8n'], ['A3', '8n'], ['E4', '8n'], ['A4', '4n'],
    ['E4', '8n'], ['C#4', '8n'], ['A3', '4n.'], ['A3', '2n'],
  ], 100),
  // 古琴：BPM 从 50 提到 72；保留长尾感但不再拖沓。
  guqin: compose([
    ['D3', '4n.'], ['F3', '4n'], ['G3', '4n.'], ['F3', '2n'], ['D3', '2n.'],
  ], 72),
  choir: compose([[['C4', 'E4', 'G4'], '2n'], [['B3', 'D4', 'G4'], '2n'], [['C4', 'E4', 'G4', 'C5'], '1n']], 56),

  /* Still synth */
  timpani: compose([['C2', '4n'], ['C2', '4n'], ['G2', '4n'], ['C2', '2n']], 60),
  taiko: compose([['A1', '8n'], ['A1', '8n'], ['D2', '4n'], ['A1', '8n'], ['A1', '8n'], ['D2', '4n.']], 110),
  celesta: compose([['C6', '8n'], ['E6', '8n'], ['G6', '8n'], ['E6', '8n'], ['B5', '4n'], ['C6', '2n']], 110),
  'synth-pad': compose([[['C3', 'G3', 'C4'], '1n'], [['A#2', 'F3', 'A#3'], '1n']], 50),
  'pizzicato-strings': compose([['G3', '8n'], ['B3', '8n'], ['D4', '8n'], ['G4', '8n'], ['D4', '8n'], ['B3', '4n'], ['G3', '4n']], 110),
};

/* -------------------------------------------------------------------------- */
/*  Synth recipes (only the few that have no good surrogate sample)           */
/* -------------------------------------------------------------------------- */

const RECIPES: Record<string, SynthRecipe> = {
  timpani: {
    build: () =>
      new Tone.MembraneSynth({
        pitchDecay: 0.12,
        octaves: 6,
        envelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 1.8 },
      }) as unknown as Tone.PolySynth,
    gain: 0.7,
  },

  taiko: {
    build: () =>
      new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.5 },
      }) as unknown as Tone.PolySynth,
    gain: 0.75,
  },

  celesta: {
    build: () =>
      new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 2,
        modulationIndex: 5,
        envelope: { attack: 0.002, decay: 1.4, sustain: 0, release: 1.6 },
        modulationEnvelope: { attack: 0.002, decay: 0.6, sustain: 0, release: 0.8 },
        modulation: { type: 'sine' },
      }),
    gain: 0.38,
  },

  'synth-pad': {
    build: () =>
      // Cast through unknown — Tone's PolySynth options strictly forbid `custom`/`fat*`
      // oscillator subtypes in its public type, but they work fine at runtime.
      new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 35 },
        envelope: { attack: 1.5, decay: 0.3, sustain: 0.9, release: 2.8 },
      } as unknown as Partial<Tone.SynthOptions>),
    chain: () => [
      new Tone.Filter({ type: 'lowpass', frequency: 1800, Q: 1 }),
      new Tone.Chorus({ frequency: 0.4, delayTime: 6, depth: 0.7, wet: 0.55 }).start(),
    ],
    gain: 0.4,
  },

  'pizzicato-strings': {
    build: () => new Tone.PluckSynth({ attackNoise: 0.8, dampening: 4000, resonance: 0.91 }) as unknown as Tone.PolySynth,
    gain: 0.65,
  },
};
