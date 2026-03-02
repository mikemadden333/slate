/** Format as dollar: $XXX.XM for millions, $X.XK for thousands, $X for smaller */
export function fmt(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}$${abs.toFixed(0)}`;
}

/** Format number with commas */
export function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}

/** Format as percentage with 1 decimal place */
export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

/** Format as DSCR ratio: X.XXx */
export function fmtDscr(n: number): string {
  return `${n.toFixed(2)}x`;
}
