/**
 * Recording pipeline — mixes Tone synth output and Howler audio-clip output
 * into a single MediaStream, combines it with a user-supplied video track,
 * and writes a webm via MediaRecorder.
 *
 * The two engines run on independent AudioContexts, so we route both into a
 * third "mixer" AudioContext via MediaStreamSourceNodes that feed one
 * MediaStreamDestinationNode. That destination's `.stream` is the audio
 * track passed to MediaRecorder.
 *
 * Caveat: only synth + composition audio clips are captured. Anything that
 * bypasses Tone or Howl (Atlas preview PlayButton via audioEngine.howl) is
 * already inside Howler, so it will be captured.
 */
import { Howler } from 'howler';
import { getToneRecordStream } from './synth';

let mixerCtx: AudioContext | null = null;
let mixerDest: MediaStreamAudioDestinationNode | null = null;
let mixedStream: MediaStream | null = null;
const wiredStreams = new WeakSet<MediaStream>();
let howlerDest: MediaStreamAudioDestinationNode | null = null;

function ensureMixer(): MediaStream | null {
  // Lazy build only once.
  if (mixedStream && mixerCtx?.state !== 'closed') return mixedStream;
  try {
    mixerCtx = new AudioContext();
    mixerDest = mixerCtx.createMediaStreamDestination();
  } catch {
    return null;
  }

  // Tone tap — its MediaStreamDestination was already created on Tone's context.
  const toneStream = getToneRecordStream();
  if (toneStream && !wiredStreams.has(toneStream)) {
    const src = mixerCtx.createMediaStreamSource(toneStream);
    src.connect(mixerDest);
    wiredStreams.add(toneStream);
  }

  // Howler tap — build a fresh MediaStreamDestination on Howler's own ctx.
  const ctx = (Howler as unknown as { ctx?: AudioContext }).ctx;
  const master = (Howler as unknown as { masterGain?: GainNode }).masterGain;
  if (ctx && master) {
    if (!howlerDest) {
      howlerDest = ctx.createMediaStreamDestination();
      master.connect(howlerDest);
    }
    if (!wiredStreams.has(howlerDest.stream)) {
      const src = mixerCtx.createMediaStreamSource(howlerDest.stream);
      src.connect(mixerDest);
      wiredStreams.add(howlerDest.stream);
    }
  }

  mixedStream = mixerDest.stream;
  return mixedStream;
}

/**
 * Return a combined audio MediaStream with both Tone and Howler output, or
 * null if the audio system hasn't been primed yet (caller should kick a
 * play() first to unlock the contexts).
 */
export function getMixedAudioStream(): MediaStream | null {
  return ensureMixer();
}

type Progress = (info: { currentSec: number; totalSec: number }) => void;

export interface RecordOptions {
  videoEl: HTMLVideoElement | null;
  durationSec: number;
  /** Called once recording starts so the caller can also start playback. */
  onStart?: () => void;
  /** Called on rAF with the elapsed seconds. */
  onProgress?: Progress;
  /** Called when MediaRecorder stops; receives the final blob. */
  onStop?: (blob: Blob) => void;
  /** Called when an unrecoverable error happens. */
  onError?: (err: Error) => void;
}

/**
 * Start a MediaRecorder that captures (videoEl track if present + mixed audio
 * stream). Returns a handle with `stop()` and `cancel()`. Caller controls
 * playback start/stop independently.
 */
export function startRecording(opts: RecordOptions): { stop: () => void; cancel: () => void } {
  const audioStream = ensureMixer();
  if (!audioStream) {
    opts.onError?.(new Error('Audio system not primed — press play once before exporting.'));
    return { stop: () => {}, cancel: () => {} };
  }

  const tracks: MediaStreamTrack[] = [];
  if (opts.videoEl) {
    const videoStream = (opts.videoEl as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.();
    if (videoStream) tracks.push(...videoStream.getVideoTracks());
  }
  tracks.push(...audioStream.getAudioTracks());

  if (tracks.length === 0) {
    opts.onError?.(new Error('No tracks to record.'));
    return { stop: () => {}, cancel: () => {} };
  }

  const combined = new MediaStream(tracks);

  // Pick the best supported mimeType.
  const mimeCandidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'audio/webm',
  ];
  const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
  const recorder = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];
  let stopped = false;
  let cancelled = false;
  let rafId = 0;
  let startMs = 0;

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  recorder.onstop = () => {
    cancelAnimationFrame(rafId);
    if (cancelled) return;
    const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
    opts.onStop?.(blob);
  };
  recorder.onerror = (e) => {
    opts.onError?.((e as ErrorEvent).error ?? new Error('recorder error'));
  };

  recorder.start(250);
  startMs = performance.now();
  opts.onStart?.();

  function tick() {
    if (stopped) return;
    const elapsed = (performance.now() - startMs) / 1000;
    opts.onProgress?.({ currentSec: elapsed, totalSec: opts.durationSec });
    if (elapsed >= opts.durationSec) {
      stopRecorder();
      return;
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  function stopRecorder() {
    if (stopped) return;
    stopped = true;
    try { recorder.stop(); } catch { /* ignore */ }
  }

  return {
    stop: stopRecorder,
    cancel: () => {
      cancelled = true;
      stopRecorder();
    },
  };
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
