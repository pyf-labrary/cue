/**
 * Render the composition + (optional) video to a downloadable webm.
 *
 * Flow:
 *   1. Caller passes a videoEl (may be null) and the total duration.
 *   2. We call compositionPlayer.stop()/play() to start playback from 0.
 *   3. startRecording() builds an audio mixer stream (Tone + Howler) and
 *      combines it with the video stream into a MediaRecorder.
 *   4. After durationSec elapses we stop the recorder, download the blob.
 *
 * The audio pipeline requires that the user has played at least once so
 * the AudioContexts have been resumed — we warn about this if needed.
 */
import { useState } from 'react';
import { compositionPlayer } from '@/lib/compositionPlayer';
import { startRecording, downloadBlob } from '@/lib/recorder';

interface Props {
  durationSec: number;
  /** Live ref to the <video> element if a clip is loaded; else null. */
  getVideoEl: () => HTMLVideoElement | null;
  /** Optional filename slug — appended to `cue-export-`. */
  slug?: string;
}

type Phase = 'idle' | 'recording' | 'finalizing' | 'done' | 'error';

export default function ExportControls({ durationSec, getVideoEl, slug = 'sandbox' }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (phase === 'recording' || phase === 'finalizing') return;
    setError(null);
    setPhase('recording');
    setProgress(0);

    const videoEl = getVideoEl();
    // Reset playback to 0 first.
    compositionPlayer.stop();
    if (videoEl) {
      try { videoEl.currentTime = 0; } catch { /* ignore */ }
    }

    const handle = startRecording({
      videoEl,
      durationSec,
      onStart: () => {
        compositionPlayer.play();
        if (videoEl) void videoEl.play().catch(() => {});
      },
      onProgress: ({ currentSec }) => {
        setProgress(Math.min(1, currentSec / durationSec));
      },
      onStop: (blob) => {
        compositionPlayer.stop();
        if (videoEl) videoEl.pause();
        setPhase('finalizing');
        const ext = blob.type.includes('webm') ? 'webm' : 'bin';
        downloadBlob(blob, `cue-export-${slug}-${Date.now()}.${ext}`);
        setPhase('done');
        setTimeout(() => setPhase('idle'), 3000);
      },
      onError: (e) => {
        setError(e.message);
        setPhase('error');
        compositionPlayer.stop();
      },
    });

    // Safety net — if user navigates away we cancel.
    function onUnload() {
      handle.cancel();
    }
    window.addEventListener('beforeunload', onUnload, { once: true });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleExport}
        disabled={phase === 'recording' || phase === 'finalizing' || durationSec <= 0}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] border border-ink-700 text-ink-200 hover:text-accent hover:border-accent transition disabled:opacity-40"
        title="实时把 composition + 视频录成 webm"
      >
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
          <circle cx="6" cy="6" r="3.5" fill={phase === 'recording' ? '#D86B6B' : 'currentColor'} />
        </svg>
        {phase === 'recording' && `导出中… ${Math.floor(progress * 100)}%`}
        {phase === 'finalizing' && '保存…'}
        {phase === 'done' && '已下载'}
        {phase === 'idle' && '导出 webm'}
        {phase === 'error' && '重试'}
      </button>
      {phase === 'recording' && (
        <div className="h-1 w-32 rounded bg-ink-700 overflow-hidden">
          <div className="h-full bg-accent-alert" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      {error && <span className="text-[11px] text-accent-alert">{error}</span>}
      {phase === 'idle' && (
        <span className="text-[10px] text-ink-500">
          录的是实时播放：建议先按一次播放，再点导出。
        </span>
      )}
    </div>
  );
}
