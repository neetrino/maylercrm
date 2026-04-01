/**
 * Converts 3D links (Matterport, Sketchfab) to iframe embed URLs for preview.
 * Host checks use URL.hostname — not substring search (CodeQL: incomplete URL sanitization).
 */

function tryParseUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

function isHttpsOrHttp(url: URL): boolean {
  return url.protocol === 'https:' || url.protocol === 'http:';
}

/** e.g. matterport.com, my.matterport.com, www.matterport.com */
export function isMatterportHost(hostname: string): boolean {
  return hostname === 'matterport.com' || hostname.endsWith('.matterport.com');
}

/** e.g. sketchfab.com, www.sketchfab.com */
export function isSketchfabHost(hostname: string): boolean {
  return hostname === 'sketchfab.com' || hostname.endsWith('.sketchfab.com');
}

export function getEmbedPreviewUrl(url: string): string {
  try {
    const parsed = tryParseUrl(url);
    if (!parsed || !isHttpsOrHttp(parsed)) {
      return url.trim();
    }

    const hrefForMatch = `${parsed.pathname}${parsed.search}`;

    if (isMatterportHost(parsed.hostname)) {
      const params = new URLSearchParams(parsed.search);
      const m = params.get('m');
      if (m) {
        return `https://my.matterport.com/show/?m=${encodeURIComponent(m)}`;
      }
      const spaceMatch = hrefForMatch.match(/\/space\/([A-Za-z0-9_-]+)/);
      if (spaceMatch) {
        return `https://my.matterport.com/show/?m=${encodeURIComponent(spaceMatch[1])}`;
      }
      return parsed.href;
    }

    if (isSketchfabHost(parsed.hostname)) {
      const match =
        hrefForMatch.match(/3d-models\/([a-f0-9]+)/i) ||
        hrefForMatch.match(/models\/([a-f0-9]+)/i);
      if (match) {
        return `https://sketchfab.com/models/${match[1]}/embed`;
      }
      return parsed.href;
    }

    return url.trim();
  } catch {
    return url;
  }
}

/** Prefer embed URL for known 3D hosts; otherwise return original URL for iframe src. */
export function getIframeSrc(url: string): string {
  const parsed = tryParseUrl(url);
  if (!parsed || !isHttpsOrHttp(parsed)) {
    return url.trim();
  }
  if (isMatterportHost(parsed.hostname) || isSketchfabHost(parsed.hostname)) {
    return getEmbedPreviewUrl(url);
  }
  return url.trim();
}
