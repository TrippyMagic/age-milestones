/**
 * src/utils/scaleTransform.ts
 * Pure math utilities for timeline scale transformations.
 * Framework-free — fully testable with Vitest.
 *
 * Public API
 * ──────────
 *  valueToRatio(value, range, mode?)   → [0, 1]
 *  ratioToValue(ratio, range, mode?)   → number
 *  applyZoom(viewport, factor, anchor?)→ Viewport
 *  viewportToRange(viewport)           → Range
 *  generateTicks(viewRange, mode?)     → TimelineTick[]
 */

// ── Types ─────────────────────────────────────────────────────

export type ScaleMode = "linear" | "log";

export type Range = {
  start: number;
  end: number;
};

/** Internal viewport — what is currently visible on the axis */
export type Viewport = {
  center: number;
  spanMs: number;
};

export type TimelineTick = {
  id: string;
  value: number;
  label: string;
};

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

// ── Constants ─────────────────────────────────────────────────

export const ZOOM_IN        = 0.65;
export const ZOOM_OUT       = 1 / 0.65;
export const MIN_SPAN_MS    = 7 * 24 * 60 * 60 * 1000;             // 1 week
export const MAX_SPAN_MS    = 2_000 * 365.25 * 24 * 60 * 60 * 1000; // 2 000 years

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

// ── Basic helpers ─────────────────────────────────────────────

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const isValidRange = (range: Range): boolean =>
  isFiniteNumber(range.start) && isFiniteNumber(range.end) && range.end > range.start;

export const createViewportFromRange = (range: Range): Viewport | null => {
  if (!isValidRange(range)) return null;
  return {
    center: (range.start + range.end) / 2,
    spanMs: clamp(range.end - range.start, MIN_SPAN_MS, MAX_SPAN_MS),
  };
};

export const sanitizeViewport = (vp: Viewport, fallbackRange?: Range): Viewport | null => {
  const fallback = fallbackRange ? createViewportFromRange(fallbackRange) : null;
  if (!isFiniteNumber(vp.center) || !isFiniteNumber(vp.spanMs) || vp.spanMs <= 0) {
    return fallback;
  }

  return {
    center: vp.center,
    spanMs: clamp(vp.spanMs, MIN_SPAN_MS, MAX_SPAN_MS),
  };
};

export const toPercent = (ratio: number): number => ratio * 100;

// ── Linear scale ──────────────────────────────────────────────

/**
 * Map a value in [range.start, range.end] to [0, 1] linearly.
 * Values outside the range are clamped.
 */
export const linearRatio = (value: number, range: Range): number => {
  const span = range.end - range.start;
  if (span <= 0) return 0;
  return (clamp(value, range.start, range.end) - range.start) / span;
};

/** Inverse of linearRatio. */
export const linearValue = (ratio: number, range: Range): number =>
  range.start + clamp(ratio, 0, 1) * (range.end - range.start);

// ── Logarithmic scale ─────────────────────────────────────────

/**
 * Map a value to [0, 1] in log space.
 * Shifts the range so range.start → log(1) = 0, avoiding log(0).
 * Falls back to linear when span ≤ 1.
 */
export const logRatio = (value: number, range: Range): number => {
  const span = range.end - range.start;
  if (span <= 1) return linearRatio(value, range);
  const shifted = clamp(value, range.start, range.end) - range.start + 1;
  return Math.log(shifted) / Math.log(span + 1);
};

/** Inverse of logRatio. */
export const logValue = (ratio: number, range: Range): number => {
  const span = range.end - range.start;
  if (span <= 1) return linearValue(ratio, range);
  const shifted = Math.pow(span + 1, clamp(ratio, 0, 1));
  return range.start + shifted - 1;
};

// ── Unified API ───────────────────────────────────────────────

/** Convert a timeline value to a [0, 1] display ratio. */
export const valueToRatio = (
  value: number,
  range: Range,
  mode: ScaleMode = "linear",
): number => (mode === "log" ? logRatio(value, range) : linearRatio(value, range));

/** Convert a [0, 1] display ratio back to a timeline value. */
export const ratioToValue = (
  ratio: number,
  range: Range,
  mode: ScaleMode = "linear",
): number => (mode === "log" ? logValue(ratio, range) : linearValue(ratio, range));

// ── Viewport helpers ──────────────────────────────────────────

export const viewportToRange = (vp: Viewport): Range => ({
  start: !isFiniteNumber(vp.center) || !isFiniteNumber(vp.spanMs) || vp.spanMs <= 0
    ? 0
    : vp.center - vp.spanMs / 2,
  end: !isFiniteNumber(vp.center) || !isFiniteNumber(vp.spanMs) || vp.spanMs <= 0
    ? 0
    : vp.center + vp.spanMs / 2,
});

export const applyZoom = (
  vp: Viewport,
  factor: number,
  anchorMs?: number,
): Viewport => {
  const safeViewport = sanitizeViewport(vp) ?? { center: 0, spanMs: MIN_SPAN_MS };
  const safeFactor = isFiniteNumber(factor) && factor > 0 ? factor : 1;
  const newSpan = clamp(safeViewport.spanMs * safeFactor, MIN_SPAN_MS, MAX_SPAN_MS);
  if (anchorMs === undefined || !isFiniteNumber(anchorMs)) {
    return { center: safeViewport.center, spanMs: newSpan };
  }
  const currentStart = safeViewport.center - safeViewport.spanMs / 2;
  const anchorRatio  = (anchorMs - currentStart) / safeViewport.spanMs;
  const newStart     = anchorMs - anchorRatio * newSpan;
  return { center: newStart + newSpan / 2, spanMs: newSpan };
};

// ── Tick generation ───────────────────────────────────────────

const pushYear = (ticks: TimelineTick[], year: number, viewRange: Range) => {
  const v = new Date(year, 0, 1).getTime();
  if (v >= viewRange.start && v <= viewRange.end)
    ticks.push({ id: `atick-${v}`, value: v, label: `${year}` });
};

const pushDateTick = (
  ticks: TimelineTick[],
  date: Date,
  viewRange: Range,
  formatter: Intl.DateTimeFormat,
) => {
  const value = date.getTime();
  if (value >= viewRange.start && value <= viewRange.end) {
    ticks.push({ id: `atick-${value}`, value, label: formatter.format(date) });
  }
};

const generateLinearTicks = (viewRange: Range): TimelineTick[] => {
  if (!isValidRange(viewRange)) return [];

  const span      = viewRange.end - viewRange.start;
  const spanYears = span / MS_PER_YEAR;
  const ticks: TimelineTick[] = [];
  const monthFmt = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" });
  const dayFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

  if (spanYears > 200) {
    const s = 100; const f = Math.ceil(new Date(viewRange.start).getFullYear() / s) * s;
    for (let y = f; y <= new Date(viewRange.end).getFullYear() + s; y += s) pushYear(ticks, y, viewRange);
  } else if (spanYears > 80) {
    const s = 50;  const f = Math.ceil(new Date(viewRange.start).getFullYear() / s) * s;
    for (let y = f; y <= new Date(viewRange.end).getFullYear() + s; y += s) pushYear(ticks, y, viewRange);
  } else if (spanYears > 30) {
    const s = 10;  const f = Math.ceil(new Date(viewRange.start).getFullYear() / s) * s;
    for (let y = f; y <= new Date(viewRange.end).getFullYear() + s; y += s) pushYear(ticks, y, viewRange);
  } else if (spanYears > 10) {
    const s = 5;   const f = Math.ceil(new Date(viewRange.start).getFullYear() / s) * s;
    for (let y = f; y <= new Date(viewRange.end).getFullYear() + s; y += s) pushYear(ticks, y, viewRange);
  } else if (spanYears > 4) {
    const s = 2;   const f = Math.ceil(new Date(viewRange.start).getFullYear() / s) * s;
    for (let y = f; y <= new Date(viewRange.end).getFullYear() + s; y += s) pushYear(ticks, y, viewRange);
  } else if (spanYears > 1.5) {
    const f = new Date(viewRange.start).getFullYear();
    for (let y = f; y <= new Date(viewRange.end).getFullYear() + 1; y++) pushYear(ticks, y, viewRange);
  } else if (spanYears > 0.5) {
    let d = new Date(viewRange.start);
    d = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
    while (d.getTime() <= viewRange.end) {
      pushDateTick(ticks, d, viewRange, monthFmt);
      d = new Date(d.getFullYear(), d.getMonth() + 3, 1);
    }
  } else if (spanYears > 0.35) {
    let d = new Date(viewRange.start);
    d = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
    while (d.getTime() <= viewRange.end) {
      pushDateTick(ticks, d, viewRange, monthFmt);
      d = new Date(d.getFullYear(), d.getMonth() + 3, 1);
    }
  } else if (spanYears > 0.12) {
    let d = new Date(viewRange.start);
    d = new Date(d.getFullYear(), d.getMonth(), 1);
    while (d.getTime() <= viewRange.end) {
      pushDateTick(ticks, d, viewRange, monthFmt);
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  } else if (spanYears > 0.04) {
    let d = new Date(viewRange.start);
    const dayOffset = (d.getDay() + 6) % 7;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayOffset);
    while (d.getTime() <= viewRange.end) {
      pushDateTick(ticks, d, viewRange, dayFmt);
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
    }
  } else {
    let d = new Date(viewRange.start);
    d = new Date(d.getFullYear(), d.getMonth(), 1);
    while (d.getTime() <= viewRange.end) {
      pushDateTick(ticks, d, viewRange, dayFmt);
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
  }
  return ticks;
};

const generateLogTicks = (viewRange: Range, targetCount = 8): TimelineTick[] => {
  const ticks: TimelineTick[] = [];
  if (!isValidRange(viewRange)) return ticks;
  const seen = new Set<string>();
  for (let i = 0; i <= targetCount; i++) {
    const ratio = i / targetCount;
    const value = logValue(ratio, viewRange);
    const v     = clamp(Math.round(value), viewRange.start, viewRange.end);
    const label = `${new Date(v).getFullYear()}`;
    if (!seen.has(label)) {
      seen.add(label);
      ticks.push({ id: `ltick-${i}`, value: v, label });
    }
  }
  return ticks;
};

/**
 * Generate date-based ticks for the given view range.
 * Linear mode: adaptive year/quarter/month intervals.
 * Log mode: evenly spaced in log space (useful for Eons-scale ranges).
 */
export const generateTicks = (
  viewRange: Range,
  mode: ScaleMode = "linear",
): TimelineTick[] =>
  mode === "log" ? generateLogTicks(viewRange) : generateLinearTicks(viewRange);

