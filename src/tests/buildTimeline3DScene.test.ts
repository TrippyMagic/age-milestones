import { describe, expect, it } from "vitest";

import {
  buildTimeline3DScene,
  TIMELINE_3D_AXIS_MAX_X,
  TIMELINE_3D_AXIS_MIN_X,
  TIMELINE_3D_LANE_OFFSET_Y,
  TIMELINE_3D_LANE_Y,
  TIMELINE_LANE_ORDER,
} from "../components/timeline-core";
import type { TimelineEvent } from "../components/Timeline";
import type { Range } from "../utils/scaleTransform";

const makeEvent = (
  id: string,
  value: number,
  lane: TimelineEvent["lane"],
  placement: TimelineEvent["placement"] = "above",
  semanticKind: TimelineEvent["semanticKind"] = "personal",
): TimelineEvent => ({
  id,
  label: id,
  value,
  lane,
  placement,
  semanticKind,
});

describe("buildTimeline3DScene", () => {
  const range: Range = {
    start: new Date("2000-01-01").getTime(),
    end: new Date("2001-01-01").getTime(),
  };

  it("keeps the canonical lane order and shared lane labels for the 3D scene", () => {
    const scene = buildTimeline3DScene({ events: [], range, focusValue: range.start });

    expect(scene.lanes.map(lane => lane.lane)).toEqual(TIMELINE_LANE_ORDER);
    expect(scene.lanes.map(lane => lane.label)).toEqual(["Personal", "Global"]);
    expect(scene.lanes.map(lane => lane.axisY)).toEqual([
      TIMELINE_3D_LANE_Y.personal,
      TIMELINE_3D_LANE_Y.global,
    ]);
  });

  it("clamps the focus value to the visible range and projects it to the 3D axis", () => {
    const scene = buildTimeline3DScene({
      events: [],
      range,
      focusValue: new Date("2005-01-01").getTime(),
    });

    expect(scene.focusValue).toBe(range.end);
    expect(scene.focusX).toBe(TIMELINE_3D_AXIS_MAX_X);
  });

  it("projects markers onto the shared 3D axis bounds", () => {
    const scene = buildTimeline3DScene({
      events: [
        makeEvent("at-start", range.start, "personal"),
        makeEvent("at-end", range.end, "global"),
      ],
      range,
      focusValue: range.start,
    });

    expect(scene.markers[0]?.x).toBe(TIMELINE_3D_AXIS_MIN_X);
    expect(scene.markers[1]?.x).toBe(TIMELINE_3D_AXIS_MAX_X);
  });

  it("places markers above or below the correct lane rail and preserves projection semantics", () => {
    const scene = buildTimeline3DScene({
      events: [
        makeEvent("personal-above", new Date("2000-03-01").getTime(), "personal", "above"),
        {
          ...makeEvent("global-below", new Date("2000-06-01").getTime(), "global", "below", "projection"),
          label: "Halley return",
          subLabel: "Comet visibility window.",
          projectionType: "astronomical",
          certainty: "high",
        },
      ],
      range,
      focusValue: range.start,
    });

    const personalMarker = scene.markers.find(marker => marker.id === "personal-above");
    const globalMarker = scene.markers.find(marker => marker.id === "global-below");

    expect(personalMarker?.axisY).toBe(TIMELINE_3D_LANE_Y.personal);
    expect(personalMarker?.y).toBe(TIMELINE_3D_LANE_Y.personal + TIMELINE_3D_LANE_OFFSET_Y);
    expect(personalMarker?.selectionKey).toBe("personal-above");
    expect(personalMarker?.semanticLabel).toBe("Personal marker");

    expect(globalMarker?.axisY).toBe(TIMELINE_3D_LANE_Y.global);
    expect(globalMarker?.y).toBe(TIMELINE_3D_LANE_Y.global - TIMELINE_3D_LANE_OFFSET_Y);
    expect(globalMarker?.semanticKind).toBe("projection");
    expect(globalMarker?.semanticLabel).toBe("Future projection");
    expect(globalMarker?.color).toBe("#f59e0b");
    expect(globalMarker?.metaLabels).toEqual([
      "Comet visibility window.",
      "Astronomical",
      "High confidence",
    ]);
    expect(globalMarker?.detailItems[0]).toEqual(expect.objectContaining({
      id: "global-below",
      label: "Halley return",
      projectionType: "astronomical",
      certainty: "high",
    }));
  });

  it("thins dense tick output while preserving the last visible tick", () => {
    const denseRange: Range = {
      start: new Date("1900-01-01").getTime(),
      end: new Date("2100-01-01").getTime(),
    };

    const scene = buildTimeline3DScene({
      events: [],
      range: denseRange,
      focusValue: denseRange.start,
      maxTickCount: 4,
    });
    const lastTick = scene.ticks[scene.ticks.length - 1];

    expect(scene.ticks.length).toBeLessThanOrEqual(5);
    expect(lastTick?.value).toBeLessThanOrEqual(denseRange.end);
    expect(lastTick?.x).toBeLessThanOrEqual(TIMELINE_3D_AXIS_MAX_X);
  });
});


