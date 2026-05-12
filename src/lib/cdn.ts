/**
 * CDN base for large assets (samples, scenes, art).
 * Production: ftp.ssbx.site
 * Dev override: set VITE_CDN_BASE in .env.local
 */
export const CDN_BASE =
  (import.meta.env.VITE_CDN_BASE as string | undefined) ??
  'https://ftp.ssbx.site/cue';

export function cdn(path: string): string {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${CDN_BASE}/${clean}`;
}
