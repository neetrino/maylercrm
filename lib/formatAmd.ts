/** Полная сумма в AMD: разделители тысяч, без сокращений M/K. */
const amd = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
  minimumFractionDigits: 0,
});

export function formatAmd(value: number): string {
  return `${amd.format(value)} AMD`;
}
