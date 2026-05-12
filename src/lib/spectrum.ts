/**
 * Unified spectrum source — taps Tone.js synth bus AND Howler master gain so a
 * single AnalyserNode visualisation reflects both engines.
 *
 * The two AudioContexts (Tone's vs Howler's) are independent, so we keep two
 * AnalyserNodes and max-merge per-bin into one Float32Array on every tick.
 * 32 bins is enough for an educational meter.
 */
import { Howler } from 'howler';
import * as Tone from 'tone';
import { getToneAnalyser } from './synth';

const NUM_BARS = 32;
const SRC_BINS = 128; // Tone.Analyser('fft', 128) + Howler analyser fftSize 256
const MIN_BIN = 1;    // skip DC
const MAX_BIN = 90;   // ≈15.5kHz at 44.1k — past here is mostly silence for music

// Precompute log-spaced bin ranges so bar k spans freq band [lo, hi).
const BAR_RANGES: Array<[number, number]> = (() => {
  const out: Array<[number, number]> = [];
  const logRange = Math.log(MAX_BIN / MIN_BIN);
  for (let k = 0; k < NUM_BARS; k++) {
    const lo = Math.floor(MIN_BIN * Math.exp((k / NUM_BARS) * logRange));
    let hi = Math.floor(MIN_BIN * Math.exp(((k + 1) / NUM_BARS) * logRange));
    if (hi <= lo) hi = lo + 1;
    out.push([lo, Math.min(hi, SRC_BINS)]);
  }
  return out;
})();

let howlAnalyser: AnalyserNode | null = null;
let attachedHowl = false;

function attachHowlerAnalyser(): void {
  if (attachedHowl) return;
  const ctx = (Howler as unknown as { ctx?: AudioContext }).ctx;
  const master = (Howler as unknown as { masterGain?: GainNode }).masterGain;
  if (!ctx || !master) return;
  const a = ctx.createAnalyser();
  a.fftSize = SRC_BINS * 2; // matches Tone bin count
  a.smoothingTimeConstant = 0.75;
  master.connect(a);
  howlAnalyser = a;
  attachedHowl = true;
}

const toneFreqBuf = new Float32Array(SRC_BINS);
const howlFreqBuf = new Float32Array(SRC_BINS);

/**
 * Fill `out` (length NUM_BARS) with normalised 0..1 magnitudes. Returns true
 * if any analyser produced data; false if audio hasn't been initialised yet.
 */
export function readSpectrum(out: Float32Array): boolean {
  attachHowlerAnalyser();
  let anyData = false;

  const tone = getToneAnalyser();
  if (tone) {
    const data = tone.getValue() as Float32Array; // dBFS values, typically -100..0
    for (let i = 0; i < toneFreqBuf.length; i++) toneFreqBuf[i] = data[i] ?? -100;
    anyData = true;
  } else {
    toneFreqBuf.fill(-100);
  }

  if (howlAnalyser) {
    howlAnalyser.getFloatFrequencyData(howlFreqBuf);
    anyData = true;
  } else {
    howlFreqBuf.fill(-100);
  }

  // Log-spaced down-sample across both engines (max-merge).
  for (let i = 0; i < NUM_BARS; i++) {
    const [lo, hi] = BAR_RANGES[i];
    let peak = -120;
    for (let idx = lo; idx < hi; idx++) {
      const t = toneFreqBuf[idx] ?? -120;
      const h = howlFreqBuf[idx] ?? -120;
      if (t > peak) peak = t;
      if (h > peak) peak = h;
    }
    // Map -70 dB → 0, -10 dB → 1 (typical music dynamic range we care about).
    const v = Math.max(0, Math.min(1, (peak + 70) / 60));
    out[i] = v;
  }
  return anyData;
}

export const SPECTRUM_BARS = NUM_BARS;

/**
 * Prime the audio bus so the Tone analyser exists. Safe to call without a
 * user gesture — buildFxBus() only constructs the node graph; Tone.start()
 * is what would fail.
 */
export function primeSpectrum(): void {
  // touch the lazy-init path
  getToneAnalyser();
  attachHowlerAnalyser();
  void Tone;
}
