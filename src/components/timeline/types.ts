/**
 * src/components/timeline/types.ts
 * All TypeScript types, interfaces, and constants
 * shared across the timeline sub-components.
 */
import type { ReactNode } from "react";
import type { Range, TimelineTick, Viewport } from "../../utils/scaleTransform";

// Re-export so consumers can import from one place
export type { Range, TimelineTick, Viewport };

// ── Visual types ──────────────────────────────────────────────

export type Accent      = "default" | "highlight" | "muted";
export type MarkerShape = "dot" | "triangle";

export const accentColors: Record<Accent, string> = {
  default:   "var(--indigo-300)",
  highlight: "var(--indigo-100)",
  muted:     "var(--slate-700)",
};

// ── Public event / tick types ─────────────────────────────────

export type TimelineEvent = {
  id: string;
  label: string;
  value: number;
  subLabel?: string;
  placement?: "above" | "below";
  markerShape?: MarkerShape;
  accent?: Accent;
};

// ── Component props ───────────────────────────────────────────

export type Props = {
  range: Range;
  value: number;
  onChange: (value: number) => void;
  events: TimelineEvent[];
  ticks?: TimelineTick[];
  renderValue?: (value: number) => ReactNode;
};

// ── Internal render types ─────────────────────────────────────

export type PositionedEvent = {
  event: TimelineEvent;
  ratio: number;
};

export type RenderSingle = {
  type: "single";
  id: string;
  event: TimelineEvent;
  leftPercent: number;
  ratio: number;
};

export type RenderGroup = {
  type: "group";
  id: string;
  events: TimelineEvent[];
  leftPercent: number;
  ratio: number;
  startRatio: number;
  endRatio: number;
  valueRange: Range;
};

export type RenderItem = RenderSingle | RenderGroup;

export type SubTimelineProps = {
  axisWidth: number;
  group: RenderGroup;
  range: Range;
  onClose: () => void;
  now: number;
  groupElement: HTMLButtonElement | null;
};

export type SubTick = {
  id: string;
  value: number;
  leftPercent: number;
  label: string;
};

// ── Constants ─────────────────────────────────────────────────

export const SLIDER_RESOLUTION           = 5_000;
export const GROUPING_GAP_PX             = 48;
export const SUB_TIMELINE_MIN_WIDTH      = 320;
export const SUB_TIMELINE_BUFFER_PX      = 10;
export const SUB_TIMELINE_CONNECTOR_HEIGHT = 72;
export const SUB_TIMELINE_MARGIN_RATIO   = 0.3;
export const MIN_SUB_TIMELINE_SPAN       = 86_400_000; // 1 day in ms
export const PAN_THRESHOLD_PX            = 5;

