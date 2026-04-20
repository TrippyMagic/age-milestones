export const formatNice = (n: number) => {
    if (n >= 1_000_000_000) return `${(n/1e9).toFixed(n%1e9?1:0)} billion`;
    if (n >= 1_000_000)     return `${(n/1e6).toFixed(n%1e6?1:0)} million`;
    return n.toLocaleString();
};

/**
 * Format an estimate with aggressive rounding and ~ prefix.
 * 2,847,293 → "~2.8M"   |   342 → "~340"   |   0.47 → "~0.5"
 */
export const formatEstimate = (n: number): string => {
  if (!Number.isFinite(n) || n === 0) return "~0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  if (abs >= 1e12)      return `~${sign}${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9)       return `~${sign}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)       return `~${sign}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e4)       return `~${sign}${(abs / 1e3).toFixed(1)}K`;
  if (abs >= 1000)      return `~${sign}${(abs / 1e3).toFixed(1)}K`;
  if (abs >= 100)       return `~${sign}${Math.round(abs / 10) * 10}`;
  if (abs >= 10)        return `~${sign}${Math.round(abs)}`;
  if (abs >= 1)         return `~${sign}${abs.toFixed(1)}`;
  return `~${sign}${abs.toPrecision(2)}`;
};

/**
 * Format a range for tooltip display: "2.2M – 3.7M"
 */
export const formatRange = (low: number, high: number): string =>
  `${formatEstimate(low).slice(1)} – ${formatEstimate(high).slice(1)}`;

/**
 * Compact abbreviated format for deterministic values (no ~ prefix).
 * 2,847,293,847 → "2.8B"   |   342 → "342"   |   0.47 → "0.47"
 */
export const formatCompact = (n: number): string => {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12)  return `${sign}${(abs / 1e12).toFixed(1)} Trillions`;
  if (abs >= 1e9)   return `${sign}${(abs / 1e9).toFixed(1)} Billions`;
  if (abs >= 1e6)   return `${sign}${(abs / 1e6).toFixed(1)} Millions`;
  if (abs >= 1e4)   return `${sign}${(abs / 1e3).toFixed(1)}K`;
  if (abs >= 1000)  return `${sign}${(abs / 1e3).toFixed(1)}K`;
  if (abs >= 100)   return `${sign}${Math.round(abs)}`;
  if (abs >= 10)    return `${sign}${abs.toFixed(1)}`;
  if (abs >= 1)     return `${sign}${abs.toFixed(2)}`;
  return formatDisplay(n);
};

export const formatBig = (n: number): string =>
  n >= 1e15 ? n.toExponential(2).replace("+", "") : n.toLocaleString();

const formatStandard = (n: number, digits: number) => {
    return n.toFixed(digits).toLocaleString();
}

export const formatSmall = (n: number) => {
    if (n === 0) return '0';
    const [mantissa, exp] = n.toExponential(16).split('e');
    const exponent = parseInt(exp, 10);
    if (exponent >= 0) return n.toFixed(2);
    const digits = mantissa.replace('.', '');
    const zeros = Math.abs(exponent) - 1;
    if (zeros < 5) return n.toFixed(zeros + 4).replace("0.", "0,")
    return '0, ' + zeros + ' zeros ...' + digits.slice(0, 4)
};

export const formatFraction = (n: number): string => {
  if (!Number.isFinite(n) || n <= 0) return "< 1";
  if (n >= 1) return formatDisplay(n);
  const inv = 1 / n;
  if (inv >= 1_000_000_000) return `1 in ${(inv / 1e9).toFixed(1)} billion`;
  if (inv >= 1_000_000)     return `1 in ${(inv / 1e6).toFixed(1)} million`;
  if (inv >= 1_000)         return `1 in ${Math.round(inv).toLocaleString()}`;
  return `1 in ${Math.round(inv)}`;
};

export const formatDisplay = (n: number) => {
    let display;
    if (n < 1) {
        display = formatSmall(n);
    } else if (n < 10){
        display = formatStandard(n, 4);
        display = display.slice(0, -5) + display.slice(-5).replace(".", ",")
    } else if (n < 1000) {
        display = formatStandard(n, 2);
        display = display.slice(0, -3) + display.slice(-3).replace(".", ",")
    } else {
        display = formatBig(Math.floor(n));
    }
    return display;
}
