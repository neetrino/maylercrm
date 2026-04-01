import { describe, expect, it } from 'vitest';
import {
  getEmbedPreviewUrl,
  getIframeSrc,
  isMatterportHost,
  isSketchfabHost,
} from './getEmbedPreviewUrl';

describe('isMatterportHost', () => {
  it('accepts matterport.com and subdomains', () => {
    expect(isMatterportHost('matterport.com')).toBe(true);
    expect(isMatterportHost('my.matterport.com')).toBe(true);
    expect(isMatterportHost('www.matterport.com')).toBe(true);
  });

  it('rejects hosts that only contain matterport as substring', () => {
    expect(isMatterportHost('evil.com')).toBe(false);
    expect(isMatterportHost('matterport.com.evil.com')).toBe(false);
  });
});

describe('isSketchfabHost', () => {
  it('accepts sketchfab.com and subdomains', () => {
    expect(isSketchfabHost('sketchfab.com')).toBe(true);
    expect(isSketchfabHost('www.sketchfab.com')).toBe(true);
  });

  it('rejects unrelated hosts', () => {
    expect(isSketchfabHost('evil.com')).toBe(false);
  });
});

describe('getEmbedPreviewUrl', () => {
  it('does not treat matterport substring in path on foreign host as Matterport', () => {
    const malicious = 'https://evil.com/path/matterport.com/fake';
    expect(getEmbedPreviewUrl(malicious)).toBe(malicious);
  });

  it('builds Matterport show URL from m= on real host', () => {
    const out = getEmbedPreviewUrl('https://my.matterport.com/show/?m=abc123');
    expect(out).toBe('https://my.matterport.com/show/?m=abc123');
  });

  it('builds Sketchfab embed from models path', () => {
    const out = getEmbedPreviewUrl(
      'https://sketchfab.com/3d-models/foo/abc123def4567890abcdef1234567890'
    );
    expect(out).toContain('sketchfab.com/models/');
    expect(out).toContain('/embed');
  });
});

describe('getIframeSrc', () => {
  it('passes through non-embed hosts unchanged', () => {
    const u = 'https://example.com/page';
    expect(getIframeSrc(u)).toBe(u);
  });
});
