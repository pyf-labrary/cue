/**
 * Sandbox video panel. Upload an MP4/MOV/WebM, syncs play/pause/seek with the
 * compositionPlayer transport, hands its `<video>` ref to the recorder so
 * webm export can capture frames alongside the mixed audio.
 *
 * The video is muted (sandbox supplies the audio); a "use video audio too"
 * toggle could be added later.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { compositionPlayer, useCompositionPlayer } from '@/lib/compositionPlayer';

export interface VideoPanelHandle {
  /** The actual <video> element, for captureStream(). */
  el: HTMLVideoElement | null;
  /** Reset position to 0 and pause. */
  reset: () => void;
  /** Whether a file is currently loaded. */
  hasVideo: boolean;
}

interface Props {
  /** Composition total duration — used to size the timeline overlay hint. */
  durationSec: number;
}

const VideoPanel = forwardRef<VideoPanelHandle, Props>(function VideoPanel({ durationSec }, ref) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const state = useCompositionPlayer();

  useImperativeHandle(ref, () => ({
    el: videoRef.current,
    reset: () => {
      const v = videoRef.current;
      if (v) {
        v.pause();
        try { v.currentTime = 0; } catch { /* ignore */ }
      }
    },
    hasVideo: !!url,
  }), [url]);

  // Sync play/pause with composition transport.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !url) return;
    if (state.status === 'playing') {
      // Realign in case we drifted.
      const drift = Math.abs(v.currentTime - state.currentSec);
      if (drift > 0.4) {
        try { v.currentTime = state.currentSec; } catch { /* ignore */ }
      }
      void v.play().catch(() => { /* autoplay blocked is fine, video is muted */ });
    } else {
      v.pause();
      if (state.status === 'idle' && state.currentSec === 0) {
        try { v.currentTime = 0; } catch { /* ignore */ }
      } else {
        try { v.currentTime = state.currentSec; } catch { /* ignore */ }
      }
    }
  }, [state.status, state.currentSec, url]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (url) URL.revokeObjectURL(url);
    const objUrl = URL.createObjectURL(file);
    setUrl(objUrl);
    setFilename(file.name);
    compositionPlayer.stop();
  }

  function onClear() {
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    setFilename('');
    compositionPlayer.stop();
  }

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/60 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-ink-700/60 text-[12px]">
        <span className="h-eyebrow">视频</span>
        {url ? (
          <>
            <span className="text-ink-300 truncate max-w-[200px]" title={filename}>{filename}</span>
            <button
              type="button"
              onClick={onClear}
              className="ml-auto text-[11px] text-ink-400 hover:text-accent-alert transition"
            >
              清空
            </button>
          </>
        ) : (
          <label className="ml-auto inline-flex items-center gap-2 text-[11px] text-ink-300 hover:text-accent transition cursor-pointer">
            <span>上传无声视频</span>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/*"
              className="hidden"
              onChange={onPick}
            />
            <span className="px-2 py-1 rounded border border-ink-700 hover:border-accent">选文件…</span>
          </label>
        )}
      </div>
      <div className="relative bg-black aspect-video flex items-center justify-center text-ink-500 text-[12px]">
        {url ? (
          <video
            ref={videoRef}
            src={url}
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="opacity-60 text-center px-6">
            选一段 mp4 / mov / webm，把视频和 composition 时间线对齐<br />
            <span className="text-ink-600">视频时长 ≥ {durationSec.toFixed(0)}s 时整段被采用</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default VideoPanel;
