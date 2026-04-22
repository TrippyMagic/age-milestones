import { describe, expect, it } from "vitest";

import {
  buildRenderItems,
  buildTimelineInteractiveTargets,
  getTimelineTargetGeometry,
  TIMELINE_GROUP_TARGET_HEIGHT_PX,
  TIMELINE_GROUP_VISUAL_HEIGHT_PX,
  TIMELINE_SINGLE_TARGET_SIZE_PX,
  TIMELINE_SINGLE_VISUAL_SIZE_PX,
  resolveTimelineTargetAtPoint,
} from "../components/timeline-core";
import type { TimelineEvent } from "../components/Timeline";
import type { Range } from "../utils/scaleTransform";

const makeEvent = (
  id: string,
  value: number,
  overrides: Partial<TimelineEvent> = {},
): TimelineEvent => ({
  id,
  label: id,
  value,
  lane: "global",
  ...overrides,
});

describe("buildTimelineInteractiveTargets", () => {
  it("builds a single-event target with selection payload and aria metadata", () => {
    const range: Range = {
      start: new Date("2000-01-01").getTime(),
      end: new Date("2001-01-01").getTime(),
    };

    const items = buildRenderItems([
      makeEvent("moon-landing", new Date("2000-07-20").getTime(), {
        label: "Moon landing",
        semanticKind: "event",
        category: "space",
        subLabel: "Apollo 11 reaches the Moon.",
      }),
    ], range, 900);

    const [target] = buildTimelineInteractiveTargets({
      lane: "global",
      topPercent: 58,
      items,
    });

    expect(target).toMatchObject({
      kind: "single",
      lane: "global",
      selectionKey: "moon-landing",
      widthPx: TIMELINE_SINGLE_TARGET_SIZE_PX,
      heightPx: TIMELINE_SINGLE_TARGET_SIZE_PX,
      visualWidthPx: TIMELINE_SINGLE_VISUAL_SIZE_PX,
      visualHeightPx: TIMELINE_SINGLE_VISUAL_SIZE_PX,
      title: "Moon landing",
    });
    expect(target?.ariaLabel).toContain("Moon landing");
    expect(target?.ariaLabel).toContain("Past event");
    expect(target?.detailItems[0]?.subLabel).toBe("Apollo 11 reaches the Moon.");
    expect(target?.color).toBe("#38bdf8");
  });

  it("builds group targets with toggle payload and edge/collision descriptions", () => {
    const range: Range = {
      start: new Date("1900-01-01").getTime(),
      end: new Date("2100-01-01").getTime(),
    };

    const items = buildRenderItems([
      makeEvent("a", new Date("2000-01-10").getTime(), { label: "A" }),
      makeEvent("b", new Date("2000-01-11").getTime(), { label: "B" }),
    ], range, 400);

    const [target] = buildTimelineInteractiveTargets({
      lane: "global",
      topPercent: 58,
      items,
    });

    expect(target).toMatchObject({
      kind: "group",
      grouping: "collision",
      count: 2,
      heightPx: TIMELINE_GROUP_TARGET_HEIGHT_PX,
      visualHeightPx: TIMELINE_GROUP_VISUAL_HEIGHT_PX,
      ariaLabel: "2 overlapping events",
      title: "2 overlapping markers",
    });
    expect(target?.detailItems.map(item => item.label)).toEqual(["A", "B"]);
  });

  it("resolves pointer hits using the shared geometry, including offset group bubbles", () => {
    const range: Range = {
      start: new Date("2000-01-01").getTime(),
      end: new Date("2001-01-01").getTime(),
    };

    const items = buildRenderItems([
      makeEvent("a", new Date("2000-07-01").getTime(), { lane: "personal" }),
      makeEvent("b", new Date("2000-07-02").getTime(), { lane: "personal" }),
    ], range, 240);

    const [target] = buildTimelineInteractiveTargets({
      lane: "personal",
      topPercent: 30,
      items,
    });

    expect(target?.kind).toBe("group");
    if (!target) return;

    const geometry = getTimelineTargetGeometry(target, 960, 360);
    const hit = resolveTimelineTargetAtPoint({
      targets: [target],
      width: 960,
      height: 360,
      x: geometry.centerX,
      y: geometry.centerY,
    });

    const missOnLaneLine = resolveTimelineTargetAtPoint({
      targets: [target],
      width: 960,
      height: 360,
      x: geometry.centerX,
      y: (360 * target.topPercent) / 100,
      slopPx: 2,
    });

    expect(hit?.selectionKey).toBe(target.selectionKey);
    expect(missOnLaneLine).toBeNull();
  });
});

