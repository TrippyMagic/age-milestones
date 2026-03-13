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
import { GROUPING_GAP_PX } from "./types";

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
    return positioned.map(item => ({
      type: "single" as const,
      id: item.event.id,
      event: item.event,
      leftPercent: toPercent(item.ratio),
      ratio: item.ratio,
    }));
  }

  const items: RenderItem[] = [];
  let buffer: PositionedEvent[] = [];

  const flush = () => {
    if (!buffer.length) return;

    if (buffer.length === 1) {
      const item = buffer[0];
      items.push({
        type: "single",
        id: item.event.id,
        event: item.event,
        leftPercent: toPercent(item.ratio),
        ratio: item.ratio,
      } satisfies RenderSingle);
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
    if (!buffer.length) { buffer.push(item); continue; }
    const prev       = buffer[buffer.length - 1];
    const distancePx = Math.abs(item.ratio - prev.ratio) * axisWidth;
    if (distancePx < GROUPING_GAP_PX) {
      buffer.push(item);
    } else {
      flush();
      buffer.push(item);
    }
  }
  flush();

  return items;
};

