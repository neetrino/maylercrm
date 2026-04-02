/** Полная сумма в AMD: разделители тысяч, без сокращений M/K. */
const amd = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
  minimumFractionDigits: 0,
});

/** Число с разделителями тысяч (для осей графиков и т.п.). */
export function formatAmdNumber(value: number): string {
  return amd.format(value);
}

export function formatAmd(value: number): string {
  return `${formatAmdNumber(value)} AMD`;
}
