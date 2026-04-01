/** Converts 3D link (Matterport, Sketchfab) to iframe embed URL for preview */
export function getEmbedPreviewUrl(url: string): string {
  try {
    const u = url.trim();
    if (u.includes('matterport.com')) {
      const mMatch = u.match(/[?&]m=([^&]+)/);
      if (mMatch) return `https://my.matterport.com/show/?m=${mMatch[1]}`;
      const spaceMatch = u.match(/\/space\/([A-Za-z0-9_-]+)/);
      if (spaceMatch) return `https://my.matterport.com/show/?m=${spaceMatch[1]}`;
      return u;
    }
    if (u.includes('sketchfab.com')) {
      const match = u.match(/3d-models\/([a-f0-9]+)/i) || u.match(/models\/([a-f0-9]+)/i);
      if (match) return `https://sketchfab.com/models/${match[1]}/embed`;
      return u;
    }
    return u;
  } catch {
    return url;
  }
}
