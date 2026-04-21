/**
 * src/components/timeline/buildRenderItems.ts
 * Pure function that groups and positions timeline events for rendering.
 * Scale-mode-aware: accepts ScaleMode to support log/linear positioning.
 * Fully testable — no React or DOM dependencies.
 */
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
} from "./types";
import { MAX_GROUPING_GAP_PX, MIN_GROUPING_GAP_PX } from "./types";

const MS_IN_DAY = 24 * 60 * 60 * 1_000;

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

  // Without a measured axis, skip grouping
  if (axisWidth <= 0) {
    return positioned.map(toSingle);
  }

  const visibleCount = positioned.filter(item => isEventVisibleInRange(item.event.value, range)).length;
  const groupingGapPx = getGroupingGapPx(visibleCount, axisWidth, range);

  const items: RenderItem[] = [];
  let buffer: PositionedEvent[] = [];

  const flush = () => {
    if (!buffer.length) return;

    if (buffer.length === 1) {
      const item = buffer[0];
      items.push(toSingle(item));
      buffer = [];
      return;
    }

    const first = buffer[0];
    const last  = buffer[buffer.length - 1];
    const ratios = buffer.map(b => b.ratio);
    const avg    = ratios.reduce((acc, r) => acc + r, 0) / buffer.length;
    const rangeValues = buffer.map(b => clamp(b.event.value, range.start, range.end));

    items.push({
      type: "group",
      id: buffer.map(b => b.event.id).join("::"),
      events: buffer.map(b => b.event),
      leftPercent: toPercent(avg),
      ratio: avg,
      startRatio: first.ratio,
      endRatio: last.ratio,
      valueRange: {
        start: Math.min(...rangeValues),
        end:   Math.max(...rangeValues),
      },
    } satisfies RenderGroup);

    buffer = [];
  };

  for (const item of positioned) {
    const canGroupCurrent = groupingGapPx > 0 && isEventVisibleInRange(item.event.value, range);
    if (!canGroupCurrent) {
      flush();
      items.push(toSingle(item));
      continue;
    }

    if (!buffer.length) { buffer.push(item); continue; }
    const prev       = buffer[buffer.length - 1];
    const distancePx = Math.abs(item.ratio - prev.ratio) * axisWidth;
    if (distancePx < groupingGapPx) {
      buffer.push(item);
    } else {
      flush();
      buffer.push(item);
    }
  }
  flush();

  return items;
};

