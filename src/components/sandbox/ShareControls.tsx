import { useState } from 'react';
import type { Composition } from '@/lib/composition';
import { buildShareUrl, clearStorage, stripShareFromHash } from '@/lib/compositionShare';

type Props = {
  composition: Composition;
  storageKey: string;
  /** Reset target — called when user clicks 重置. */
  onReset: () => void;
  /** Compact mode for lesson-embedded use. */
  compact?: boolean;
};

export default function ShareControls({ composition, storageKey, onReset, compact }: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    setError(null);
    const url = buildShareUrl(composition);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API blocked (insecure context, permission denied). Fall back
      // to legacy execCommand path.
      const ok = legacyCopy(url);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setError('复制失败，请手动选中地址栏 URL');
      }
    }
    // Make the share visible in the address bar too.
    try {
      const u = new URL(url);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch { /* noop */ }
  }

  function handleReset() {
    clearStorage(storageKey);
    stripShareFromHash();
    onReset();
  }

  const btn = compact
    ? 'text-[11px] px-2 py-1 rounded border'
    : 'text-xs px-3 py-1.5 rounded-full border';

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        className={`${btn} border-ink-700 text-ink-300 hover:text-accent hover:border-accent transition inline-flex items-center gap-1.5`}
        title="生成可分享链接（已复制到剪贴板）"
      >
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
          <circle cx="3" cy="6" r="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="9" cy="2.5" r="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="9" cy="9.5" r="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M4.3 5.3 L7.7 3.2 M4.3 6.7 L7.7 8.8" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
        {copied ? '已复制' : '分享'}
      </button>
      <button
        type="button"
        onClick={handleReset}
        className={`${btn} border-ink-700 text-ink-400 hover:text-accent-alert hover:border-accent-alert/60 transition`}
        title="清空本地保存，恢复初始状态"
      >
        重置
      </button>
      {error && <span className="text-[11px] text-accent-alert">{error}</span>}
    </div>
  );
}

function legacyCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
