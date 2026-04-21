/**
 * src/tests/scaleTransform.test.ts
 * Unit tests for pure math utilities in scaleTransform.
 */
import { describe, it, expect } from "vitest";
import {
  clamp,
  linearRatio, linearValue,
  logRatio,    logValue,
  valueToRatio, ratioToValue,
  applyZoom,   viewportToRange,
  isValidRange, createViewportFromRange, sanitizeViewport,
  toPercent,
  generateTicks,
  MIN_SPAN_MS, MAX_SPAN_MS,
  ZOOM_IN, ZOOM_OUT,
  type Range, type Viewport,
} from "../utils/scaleTransform";

// ── clamp ─────────────────────────────────────────────────────
describe("clamp", () => {
  it("returns value within range unchanged", () => expect(clamp(5, 0, 10)).toBe(5));
  it("clamps below min",                     () => expect(clamp(-5, 0, 10)).toBe(0));
  it("clamps above max",                     () => expect(clamp(15, 0, 10)).toBe(10));
  it("handles equal min/max",                () => expect(clamp(3, 7, 7)).toBe(7));
});

describe("isValidRange", () => {
  it("accepts finite positive-span ranges", () => {
    expect(isValidRange({ start: 10, end: 20 })).toBe(true);
  });

  it("rejects zero-span or inverted ranges", () => {
    expect(isValidRange({ start: 10, end: 10 })).toBe(false);
    expect(isValidRange({ start: 20, end: 10 })).toBe(false);
  });
});

// ── toPercent ─────────────────────────────────────────────────
describe("toPercent", () => {
  it("converts 0 to 0",   () => expect(toPercent(0)).toBe(0));
  it("converts 1 to 100", () => expect(toPercent(1)).toBe(100));
  it("converts 0.5 to 50",() => expect(toPercent(0.5)).toBe(50));
});

// ── linearRatio / linearValue ─────────────────────────────────
describe("linearRatio / linearValue", () => {
  const range: Range = { start: 1_000, end: 5_000 };

  it("maps start → 0",       () => expect(linearRatio(1_000, range)).toBe(0));
  it("maps end   → 1",       () => expect(linearRatio(5_000, range)).toBe(1));
  it("maps midpoint → 0.5",  () => expect(linearRatio(3_000, range)).toBe(0.5));
  it("clamps value below start", () => expect(linearRatio(0, range)).toBe(0));
  it("clamps value above end",   () => expect(linearRatio(9_999, range)).toBe(1));
  it("returns 0 for zero-span range", () =>
    expect(linearRatio(100, { start: 100, end: 100 })).toBe(0));

  it("round-trips start/mid/end", () => {
    for (const v of [1_000, 2_500, 4_999, 5_000]) {
      expect(linearValue(linearRatio(v, range), range)).toBeCloseTo(v, 5);
    }
  });

  it("linearValue(0) = start", () => expect(linearValue(0, range)).toBe(1_000));
  it("linearValue(1) = end",   () => expect(linearValue(1, range)).toBe(5_000));
});

// ── logRatio / logValue ───────────────────────────────────────
describe("logRatio / logValue", () => {
  const range: Range = { start: 0, end: 999 }; // span = 999

  it("maps start → 0", () => expect(logRatio(0,   range)).toBe(0));
  it("maps end   → 1", () => expect(logRatio(999, range)).toBeCloseTo(1, 10));

  it("mid is > 0.5 (log compression of lower values)", () => {
    expect(logRatio(499, range)).toBeGreaterThan(0.5);
  });

  it("round-trips start/quarter/half/end", () => {
    for (const v of [0, 100, 500, 999]) {
      const ratio = logRatio(v, range);
      expect(logValue(ratio, range)).toBeCloseTo(v, 2);
    }
  });

  it("falls back to linear when span ≤ 1", () => {
    const tiny: Range = { start: 100, end: 100 };
    expect(logRatio(100, tiny)).toBe(0);
  });
});

// ── valueToRatio / ratioToValue (unified) ─────────────────────
describe("valueToRatio / ratioToValue", () => {
  const range: Range = { start: 0, end: 100 };

  it("defaults to linear mode",   () =>
    expect(valueToRatio(50, range)).toBe(valueToRatio(50, range, "linear")));
  it("linear mode maps mid → 0.5", () =>
    expect(valueToRatio(50, range, "linear")).toBe(0.5));
  it("log mode delegates to logRatio", () =>
    expect(valueToRatio(50, range, "log")).toBeCloseTo(logRatio(50, range), 10));

  it("round-trips in linear mode", () => {
    const ratio = valueToRatio(50, range, "linear");
    expect(ratioToValue(ratio, range, "linear")).toBeCloseTo(50, 5);
  });
  it("round-trips in log mode", () => {
    const ratio = valueToRatio(50, range, "log");
    expect(ratioToValue(ratio, range, "log")).toBeCloseTo(50, 2);
  });
});

// ── viewportToRange ───────────────────────────────────────────
describe("viewportToRange", () => {
  it("derives range from viewport correctly", () => {
    const vp: Viewport = { center: 1_000, spanMs: 200 };
    const r = viewportToRange(vp);
    expect(r.start).toBe(900);
    expect(r.end).toBe(1_100);
  });
  it("symmetric around center", () => {
    const vp: Viewport = { center: 500, spanMs: 400 };
    const r = viewportToRange(vp);
    expect(r.end - r.start).toBe(vp.spanMs);
    expect((r.start + r.end) / 2).toBe(vp.center);
  });

  it("fails soft for invalid viewport values", () => {
    expect(viewportToRange({ center: Number.NaN, spanMs: 0 })).toEqual({ start: 0, end: 0 });
  });
});

describe("createViewportFromRange / sanitizeViewport", () => {
  it("builds a viewport from a valid range", () => {
    expect(createViewportFromRange({ start: 100, end: 500 })).toEqual({ center: 300, spanMs: MIN_SPAN_MS });
  });

  it("returns null for invalid range", () => {
    expect(createViewportFromRange({ start: 500, end: 100 })).toBeNull();
  });

  it("sanitizes an invalid viewport using fallback range", () => {
    const safe = sanitizeViewport(
      { center: Number.NaN, spanMs: -10 },
      { start: 0, end: 10 * MIN_SPAN_MS },
    );

    expect(safe).toEqual({ center: 5 * MIN_SPAN_MS, spanMs: MAX_SPAN_MS > 10 * MIN_SPAN_MS ? 10 * MIN_SPAN_MS : MAX_SPAN_MS });
  });
});

// ── applyZoom ─────────────────────────────────────────────────
describe("applyZoom", () => {
  // Use a realistic span (10 years) that won't be clamped by MIN/MAX
  const TEN_YEARS = 10 * 365.25 * 24 * 60 * 60 * 1_000;
  const vp: Viewport = { center: 0, spanMs: TEN_YEARS };

  it("zooms in (factor 0.5 halves span)", () => {
    const r = applyZoom(vp, 0.5);
    expect(r.spanMs).toBeCloseTo(TEN_YEARS * 0.5, -5);
    expect(r.center).toBe(0);
  });
  it("zooms out (factor 2 doubles span)", () => {
    const r = applyZoom(vp, 2);
    expect(r.spanMs).toBeCloseTo(TEN_YEARS * 2, -5);
  });
  it("clamps to MIN_SPAN_MS", () => {
    expect(applyZoom(vp, 0.000_001).spanMs).toBe(MIN_SPAN_MS);
  });
  it("clamps to MAX_SPAN_MS", () => {
    const big: Viewport = { center: 0, spanMs: MAX_SPAN_MS * 0.9 };
    expect(applyZoom(big, 100).spanMs).toBe(MAX_SPAN_MS);
  });
  it("preserves anchor position when anchorMs provided", () => {
    const anchor = vp.center - vp.spanMs / 2; // left edge
    const r      = applyZoom(vp, 0.5, anchor);
    // Left edge should stay fixed
    expect(r.center - r.spanMs / 2).toBeCloseTo(anchor, 5);
  });
  it("ZOOM_IN × ZOOM_OUT ≈ 1 (inverse factors)", () => {
    expect(ZOOM_IN * ZOOM_OUT).toBeCloseTo(1, 10);
  });
});

// ── generateTicks ─────────────────────────────────────────────
describe("generateTicks", () => {
  it("linear: returns at least one tick for a multi-year range", () => {
    const start = new Date("2000-01-01").getTime();
    const end   = new Date("2025-01-01").getTime();
    const ticks = generateTicks({ start, end }, "linear");
    expect(ticks.length).toBeGreaterThan(0);
  });

  it("linear: tick values are within the view range", () => {
    const start = new Date("2010-01-01").getTime();
    const end   = new Date("2020-01-01").getTime();
    const ticks = generateTicks({ start, end }, "linear");
    for (const t of ticks) {
      expect(t.value).toBeGreaterThanOrEqual(start);
      expect(t.value).toBeLessThanOrEqual(end);
    }
  });

  it("linear: produces day or week ticks for zoomed-in ranges", () => {
    const start = new Date("2024-01-01").getTime();
    const end   = new Date("2024-01-10").getTime();
    const ticks = generateTicks({ start, end }, "linear");

    expect(ticks.length).toBeGreaterThanOrEqual(5);
  });

  it("log: returns ticks for a large range", () => {
    const start = new Date("1900-01-01").getTime();
    const end   = new Date("2100-01-01").getTime();
    const ticks = generateTicks({ start, end }, "log");
    expect(ticks.length).toBeGreaterThan(0);
  });

  it("returns empty array for zero-span range", () => {
    const now = Date.now();
    expect(generateTicks({ start: now, end: now }, "linear")).toHaveLength(0);
  });
});


