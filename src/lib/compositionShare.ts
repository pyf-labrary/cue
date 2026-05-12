/**
 * Composition persistence + share URL.
 *
 * - `localStorage` auto-save under a caller-supplied key (e.g. `cue:sandbox`).
 * - URL `?s=<base64url>` encodes the full composition. HashRouter friendly
 *   (the share param lives inside the hash query, e.g. `/#/sandbox?s=…`).
 *
 * Schema versioned via `__v` so we can break shape later without surprising
 * old links. Today's payload is small (~1–3 KB JSON for typical sandboxes)
 * so we do not bother gzipping; base64url is enough.
 */
import type { Composition } from './composition';

const SCHEMA_VERSION = 1;
const LS_PREFIX = 'cue:composition:';

interface SerializedComposition {
  __v: number;
  comp: Composition;
}

/* -------------------------------------------------------------------------- */
/*  base64url codec                                                           */
/* -------------------------------------------------------------------------- */

function toBase64Url(s: string): string {
  // UTF-8 safe path: encode to bytes first, then to base64.
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string | null {
  try {
    let b = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    const bin = atob(b);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Encode / decode                                                           */
/* -------------------------------------------------------------------------- */

export function encodeComposition(comp: Composition): string {
  const payload: SerializedComposition = { __v: SCHEMA_VERSION, comp };
  return toBase64Url(JSON.stringify(payload));
}

export function decodeComposition(s: string): Composition | null {
  const raw = fromBase64Url(s);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SerializedComposition;
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.__v !== SCHEMA_VERSION) return null;
    const c = parsed.comp;
    if (!c || !Array.isArray(c.clips) || typeof c.durationSec !== 'number') return null;
    return c;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  localStorage                                                              */
/* -------------------------------------------------------------------------- */

export function loadFromStorage(key: string): Composition | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SerializedComposition;
    if (parsed.__v !== SCHEMA_VERSION) return null;
    const c = parsed.comp;
    if (!c || !Array.isArray(c.clips)) return null;
    return c;
  } catch {
    return null;
  }
}

export function saveToStorage(key: string, comp: Composition): void {
  try {
    const payload: SerializedComposition = { __v: SCHEMA_VERSION, comp };
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(payload));
  } catch {
    // localStorage quota or disabled — silently ignore.
  }
}

export function clearStorage(key: string): void {
  try {
    localStorage.removeItem(LS_PREFIX + key);
  } catch {
    /* noop */
  }
}

/* -------------------------------------------------------------------------- */
/*  Share URL                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Build the full shareable URL for the current page + composition.
 * HashRouter: window.location.href looks like `https://host/cue/#/sandbox`.
 * We append `?s=<encoded>` inside the hash.
 */
export function buildShareUrl(comp: Composition): string {
  const encoded = encodeComposition(comp);
  const url = new URL(window.location.href);
  const hash = url.hash || '#/';
  const [path, query = ''] = hash.slice(1).split('?');
  const params = new URLSearchParams(query);
  params.set('s', encoded);
  url.hash = `#${path}?${params.toString()}`;
  return url.toString();
}

/**
 * Read `?s=…` out of the HashRouter hash and decode it. Returns null if
 * absent or invalid.
 */
export function readShareFromHash(): Composition | null {
  const hash = window.location.hash;
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return null;
  const params = new URLSearchParams(hash.slice(qIdx + 1));
  const s = params.get('s');
  if (!s) return null;
  return decodeComposition(s);
}

/**
 * Remove `?s=…` from the URL bar after we have absorbed it into state.
 * Keeps the back/forward history clean.
 */
export function stripShareFromHash(): void {
  const hash = window.location.hash;
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return;
  const path = hash.slice(0, qIdx);
  const params = new URLSearchParams(hash.slice(qIdx + 1));
  params.delete('s');
  const rest = params.toString();
  const next = rest ? `${path}?${rest}` : path;
  history.replaceState(null, '', window.location.pathname + window.location.search + next);
}
