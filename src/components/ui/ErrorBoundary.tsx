/**
 * Last-resort error boundary. With HashRouter a render crash unmounts the
 * whole React root and every subsequent click is a dead blank page — this
 * catches the crash and offers a one-click way back instead.
 */
import { Component, type ReactNode } from 'react';

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-ink-900">
        <div className="max-w-md text-center">
          <div className="h-eyebrow text-accent mb-4">出了点状况</div>
          <h1 className="h-display text-3xl text-ink-100 mb-3">页面崩了，但你的作品还在</h1>
          <p className="text-ink-300 text-sm leading-relaxed mb-8">
            本地保存的 composition 不受影响。点下面回到首页继续。
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              window.location.hash = '#/';
            }}
            className="px-5 py-2.5 rounded-full bg-accent text-ink-900 text-sm hover:scale-105 transition"
          >
            回到首页
          </button>
          <pre className="mt-8 text-left text-[10px] text-ink-500 overflow-auto max-h-32 font-mono">
            {String(this.state.error)}
          </pre>
        </div>
      </div>
    );
  }
}
