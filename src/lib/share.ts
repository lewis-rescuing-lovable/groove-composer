/**
 * URL-safe base64 (base64url) helpers for sharing a project via the query string.
 *
 * We encode the UTF-8 JSON bytes with base64url (no padding, `-`/`_` instead of
 * `+`/`/`) so the result is safe to place in a URL query parameter without
 * further percent-encoding collisions.
 */

export const QUERY_PARAM = 'project';

/** Encode raw bytes as base64url (no padding). */
function bytesToUrlSafeBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Decode base64url back into bytes. Returns null on any malformed input. */
function urlSafeBase64ToBytes(str: string): Uint8Array | null {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  try {
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/** Encode a project JSON string into a URL-safe base64 query value. */
export function encodeProjectToQuery(projectJson: string): string {
  return bytesToUrlSafeBase64(new TextEncoder().encode(projectJson));
}

/** Decode a URL-safe base64 query value back into a JSON string (or null). */
export function decodeQueryToProject(query: string): string | null {
  const bytes = urlSafeBase64ToBytes(query);
  if (!bytes) return null;
  try {
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** Build an absolute share URL that rehydrates the project from `?project=...`. */
export function getShareUrl(projectJson: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?${QUERY_PARAM}=${encodeProjectToQuery(projectJson)}`;
}

/** Read + decode the `?project=` query value on the current page, or null. */
export function getQueryProjectJson(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get(QUERY_PARAM);
  if (!raw) return null;
  return decodeQueryToProject(raw);
}
