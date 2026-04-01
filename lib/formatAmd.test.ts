import { describe, expect, it } from 'vitest';
import { formatAmd } from './formatAmd';

describe('formatAmd', () => {
  it('formats thousands with grouping', () => {
    expect(formatAmd(1000)).toBe('1,000 AMD');
  });

  it('formats decimals', () => {
    expect(formatAmd(1234.56)).toMatch(/1,234\.56 AMD/);
  });
});
