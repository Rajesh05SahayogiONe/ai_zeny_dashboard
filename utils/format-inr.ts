const nf = new Intl.NumberFormat("en-IN");

export function formatCount(n: number): string { return nf.format(n); }
export function toLakh(rupees: number): number { return rupees / 100000; }
export function formatLakh(rupees: number): string { return `${toLakh(rupees).toFixed(1)}L`; }
export function formatInrCompact(rupees: number): string {
  const sign = rupees < 0 ? "-" : "";
  const v = Math.abs(rupees);
  if (v >= 1e7) return `${sign}₹${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e5) return `${sign}₹${(v / 1e5).toFixed(2)}L`;
  if (v >= 1e3) return `${sign}₹${(v / 1e3).toFixed(1)}K`;
  return `${sign}₹${v}`;
}
