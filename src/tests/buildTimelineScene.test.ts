import { describe, expect, it } from "vitest";

import {
  buildTimelineScene,
  TIMELINE_INTERNAL_SCALE_MODE,
  TIMELINE_LANE_ORDER,
} from "../components/timeline-core";
import type { TimelineEvent } from "../components/Timeline";
import type { Range } from "../utils/scaleTransform";

const makeEvent = (id: string, value: number, lane: TimelineEvent["lane"]): TimelineEvent => ({
  id,
  label: id,
  value,
  lane,
});

describe("buildTimelineScene", () => {
  it("keeps the canonical lane order and splits render items by lane", () => {
    const range: Range = {
      start: new Date("2000-01-01").getTime(),
      end: new Date("2001-01-01").getTime(),
    };

    const scene = buildTimelineScene({
      events: [
        makeEvent("global-a", new Date("2000-07-10").getTime(), "global"),
        makeEvent("personal-a", new Date("2000-03-10").getTime(), "personal"),
      ],
      range,
      axisWidth: 900,
      focusValue: new Date("2000-06-01").getTime(),
    });

    expect(scene.mode).toBe(TIMELINE_INTERNAL_SCALE_MODE);
    expect(scene.lanes.map(lane => lane.lane)).toEqual(TIMELINE_LANE_ORDER);
    expect(scene.lanes[0]?.items).toHaveLength(1);
    expect(scene.lanes[1]?.items).toHaveLength(1);
    expect(scene.lanes[0]?.interactiveTargets).toHaveLength(1);
    expect(scene.lanes[1]?.interactiveTargets).toHaveLength(1);

    const personalItem = scene.lanes[0]?.items[0];
    const globalItem = scene.lanes[1]?.items[0];
    const globalTarget = scene.lanes[1]?.interactiveTargets[0];
    expect(personalItem?.type).toBe("single");
    expect(globalItem?.type).toBe("single");
    if (personalItem?.type === "single") expect(personalItem.event.id).toBe("personal-a");
    if (globalItem?.type === "single") expect(globalItem.event.id).toBe("global-a");
    expect(globalTarget?.kind).toBe("single");
    expect(globalTarget?.selectionKey).toBe("global-a");
  });

  it("clamps the focus value to the visible range and exposes a display ratio", () => {
    const range: Range = {
      start: new Date("2020-01-01").getTime(),
      end: new Date("2020-12-31").getTime(),
    };

    const scene = buildTimelineScene({
      events: [],
      range,
      axisWidth: 0,
      focusValue: new Date("2035-01-01").getTime(),
    });

    expect(scene.focusValue).toBe(range.end);
    expect(scene.focusRatio).toBe(1);
    expect(scene.focusLeftPercent).toBe(100);
  });

  it("reuses collision grouping through the extracted core scene builder", () => {
    const range: Range = {
      start: new Date("1900-01-01").getTime(),
      end: new Date("2100-01-01").getTime(),
    };

    const scene = buildTimelineScene({
      events: [
        makeEvent("global-a", new Date("2000-01-10").getTime(), "global"),
        makeEvent("global-b", new Date("2000-01-11").getTime(), "global"),
      ],
      range,
      axisWidth: 400,
      focusValue: new Date("2000-01-10").getTime(),
    });

    const globalLane = scene.lanes.find(lane => lane.lane === "global");
    expect(globalLane?.items).toHaveLength(1);
    expect(globalLane?.interactiveTargets).toHaveLength(1);
    expect(globalLane?.items[0]?.type).toBe("group");
    if (globalLane?.items[0]?.type === "group") {
      expect(globalLane.items[0].grouping).toBe("collision");
    }
    expect(globalLane?.interactiveTargets[0]?.kind).toBe("group");
    expect(globalLane?.interactiveTargets[0]?.detailItems).toHaveLength(2);
  });
});


