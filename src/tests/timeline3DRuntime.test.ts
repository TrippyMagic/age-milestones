import { describe, expect, it } from "vitest";

import {
  getTimeline3DProfileConfig,
  isTimeline3DRangeRenderable,
  resolveTimeline3DAvailability,
  resolveTimeline3DQualityProfile,
  resolveTimeline3DToggleState,
} from "../components/3d/runtimePolicy";

describe("timeline3D runtime policy", () => {
  it("resolves low-power quality when mobile or reduced-motion constraints are active", () => {
    expect(resolveTimeline3DQualityProfile({ isMobile: true, prefersReducedMotion: false })).toBe("low-power");
    expect(resolveTimeline3DQualityProfile({ isMobile: false, prefersReducedMotion: true })).toBe("low-power");
    expect(resolveTimeline3DQualityProfile({ isMobile: false, prefersReducedMotion: false })).toBe("balanced");
  });

  it("exposes explicit availability and toggle copy when WebGL is unavailable", () => {
    const availability = resolveTimeline3DAvailability(false);
    const toggle = resolveTimeline3DToggleState({ availability, show3D: false });

    expect(availability.supported).toBe(false);
    expect(availability.fallbackMessage).toMatch(/webgl is not available/i);
    expect(toggle.disabled).toBe(true);
    expect(toggle.label).toBe("Open experimental 3D");
    expect(toggle.title).toMatch(/webgl is not supported/i);
  });

  it("switches the toggle copy when the 3D scene is active and supported", () => {
    const availability = resolveTimeline3DAvailability(true);
    const closed = resolveTimeline3DToggleState({ availability, show3D: false });
    const open = resolveTimeline3DToggleState({ availability, show3D: true });

    expect(closed.disabled).toBe(false);
    expect(closed.label).toBe("Open experimental 3D");
    expect(open.label).toBe("Exit experimental 3D");
    expect(open.title).toMatch(/leave the experimental 3d scene/i);
  });

  it("returns renderer budgets that differ between balanced and low-power profiles", () => {
    const balanced = getTimeline3DProfileConfig("balanced");
    const lowPower = getTimeline3DProfileConfig("low-power");

    expect(balanced.gl.powerPreference).toBe("high-performance");
    expect(lowPower.gl.powerPreference).toBe("low-power");
    expect(balanced.dpr[1]).toBeGreaterThan(lowPower.dpr[1]);
    expect(balanced.stars.count).toBeGreaterThan(lowPower.stars.count);
    expect(balanced.performanceMin).toBeGreaterThan(lowPower.performanceMin);
    expect(lowPower.headerHint).toMatch(/low power mode/i);
  });

  it("flags only positive-span ranges as renderable for the 3D timeline", () => {
    expect(isTimeline3DRangeRenderable({ start: 0, end: 1 })).toBe(true);
    expect(isTimeline3DRangeRenderable({ start: 5, end: 5 })).toBe(false);
    expect(isTimeline3DRangeRenderable({ start: 10, end: 5 })).toBe(false);
  });
});

