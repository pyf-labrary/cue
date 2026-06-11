/** Per-lesson completion flags in localStorage — no accounts, device-local. */
const KEY = 'cue:lesson-progress';

export function getProgress(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function markLessonDone(id: string): void {
  try {
    const p = getProgress();
    if (p[id]) return;
    p[id] = true;
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable — progress is a nicety, not a requirement */
  }
}
