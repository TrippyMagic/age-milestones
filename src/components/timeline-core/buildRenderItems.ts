import {
  valueToRatio,
  toPercent,
  clamp,
  type Range,
  type ScaleMode,
} from "../../utils/scaleTransform";
import type {
  TimelineEvent,
  PositionedEvent,
  RenderItem,
  RenderSingle,
  RenderGroup,
} from "../timeline/types";
import { MAX_GROUPING_GAP_PX, MIN_GROUPING_GAP_PX } from "../timeline/types";

const MS_IN_DAY = 24 * 60 * 60 * 1_000;
const EDGE_GROUP_INSET_RATIO = 0.03;

const isEventVisibleInRange = (value: number, range: Range): boolean =>
  value >= range.start && value <= range.end;

const toSingle = (item: PositionedEvent): RenderSingle => ({
  type: "single",
  id: item.event.id,
  event: item.event,
  leftPercent: toPercent(item.ratio),
  ratio: item.ratio,
});

const getGroupingGapPx = (
  visibleCount: number,
  axisWidth: number,
  range: Range,
): number => {
  if (visibleCount < 2 || axisWidth <= 0) return 0;

  const spanDays = (range.end - range.start) / MS_IN_DAY;
  const density = visibleCount / axisWidth;

  let zoomTier = 0;
  if (spanDays > 365 * 10) zoomTier = 1;
  else if (spanDays > 365 * 3) zoomTier = 0.75;
  else if (spanDays > 365) zoomTier = 0.5;
  else if (spanDays > 120) zoomTier = 0.3;
  else if (spanDays > 45) zoomTier = 0.15;

  let densityTier = 0;
  if (density > 0.08) densityTier = 1;
  else if (density > 0.05) densityTier = 0.7;
  else if (density > 0.03) densityTier = 0.45;
  else if (density > 0.018) densityTier = 0.2;

  const strength = Math.max(zoomTier, densityTier);
  if (strength === 0) return MIN_GROUPING_GAP_PX;

  return MIN_GROUPING_GAP_PX + (MAX_GROUPING_GAP_PX - MIN_GROUPING_GAP_PX) * strength;
};

const toGroup = (
  items: PositionedEvent[],
  range: Range,
  grouping: RenderGroup["grouping"],
  ratioOverride?: number,
): RenderGroup => {
  const first = items[0];
  const last = items[items.length - 1];
  const ratios = items.map(item => item.ratio);
  const avg = ratioOverride ?? ratios.reduce((acc, ratio) => acc + ratio, 0) / items.length;
  const rangeValues = items.map(item => clamp(item.event.value, range.start, range.end));

  return {
    type: "group",
    id: items.map(item => item.event.id).join("::"),
    events: items.map(item => item.event),
    leftPercent: toPercent(avg),
    ratio: avg,
    startRatio: first.ratio,
    endRatio: last.ratio,
    valueRange: {
      start: Math.min(...rangeValues),
      end: Math.max(...rangeValues),
    },
    grouping,
  };
};

const toEdgeGroup = (
  items: PositionedEvent[],
  range: Range,
  side: "start" | "end",
): RenderGroup =>
  toGroup(
    items,
    range,
    side === "start" ? "edge-start" : "edge-end",
    side === "start" ? EDGE_GROUP_INSET_RATIO : 1 - EDGE_GROUP_INSET_RATIO,
  );

export const buildRenderItems = (
  events: TimelineEvent[],
  range: Range,
  axisWidth: number,
  mode: ScaleMode = "linear",
): RenderItem[] => {
  if (!events.length) return [];

  const positioned: PositionedEvent[] = events.map(event => ({
    event,
    ratio: valueToRatio(event.value, range, mode),
  }));

  const startOffscreen = positioned.filter(item => item.event.value < range.start);
  const visible = positioned.filter(item => isEventVisibleInRange(item.event.value, range));
  const endOffscreen = positioned.filter(item => item.event.value > range.end);

  const items: RenderItem[] = [];

  if (startOffscreen.length > 0) {
    items.push(toEdgeGroup(startOffscreen, range, "start"));
  }

  if (axisWidth <= 0) {
    items.push(...visible.map(toSingle));
    if (endOffscreen.length > 0) {
      items.push(toEdgeGroup(endOffscreen, range, "end"));
    }
    return items;
  }

  const visibleCount = visible.length;
  const groupingGapPx = getGroupingGapPx(visibleCount, axisWidth, range);

  let buffer: PositionedEvent[] = [];

  const flush = () => {
    if (!buffer.length) return;

    if (buffer.length === 1) {
      const item = buffer[0];
      items.push(toSingle(item));
      buffer = [];
      return;
    }

    items.push(toGroup(buffer, range, "collision"));
    buffer = [];
  };

  for (const item of visible) {
    const canGroupCurrent = groupingGapPx > 0;
    if (!canGroupCurrent) {
      flush();
      items.push(toSingle(item));
      continue;
    }

    if (!buffer.length) {
      buffer.push(item);
      continue;
    }

    const prev = buffer[buffer.length - 1];
    const distancePx = Math.abs(item.ratio - prev.ratio) * axisWidth;
    if (distancePx < groupingGapPx) {
      buffer.push(item);
    } else {
      flush();
      buffer.push(item);
    }
  }
  flush();

  if (endOffscreen.length > 0) {
    items.push(toEdgeGroup(endOffscreen, range, "end"));
  }

  return items;
};

