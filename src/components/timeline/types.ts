/**
 * src/components/timeline/types.ts
 * All TypeScript types, interfaces, and constants
 * shared across the timeline sub-components.
 */
import type { ReactNode } from "react";
import type { Range, TimelineTick, Viewport } from "../../utils/scaleTransform";
import type {
  EventCategory,
  ProjectionCertainty,
  ProjectionType,
} from "../../types/events";

// Re-export so consumers can import from one place
export type { Range, TimelineTick, Viewport };

// ── Visual types ──────────────────────────────────────────────

export type Accent      = "default" | "highlight" | "muted";
export type MarkerShape = "dot" | "triangle";
export type TimelineSemanticKind = "personal" | "marker" | "event" | "projection";
export type TimelineTemporalStatus = "past" | "future" | "present";

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
  lane?: TimelineLane;
  subLabel?: string;
  placement?: "above" | "below";
  markerShape?: MarkerShape;
  accent?: Accent;
  /** Optional direct color override for the marker dot (e.g. from event category). */
  color?: string;
  category?: EventCategory;
  semanticKind?: TimelineSemanticKind;
  temporalStatus?: TimelineTemporalStatus;
  projectionType?: ProjectionType;
  certainty?: ProjectionCertainty;
};

export type TimelineLane = "personal" | "global";

export const LANE_META: Record<TimelineLane, { label: string }> = {
  personal: { label: "Personal" },
  global:   { label: "Global" },
};

export const ALL_TIMELINE_LANES: TimelineLane[] = ["personal", "global"];

const LEGACY_LANE_MAP: Record<string, TimelineLane | null> = {
  personal: "personal",
  global: "global",
  historical: "global",
  markers: "global",
};

export const normalizeTimelineLanes = (saved: unknown): TimelineLane[] => {
  if (!Array.isArray(saved)) return ALL_TIMELINE_LANES;

  const next = new Set<TimelineLane>();
  for (const lane of saved) {
    if (typeof lane !== "string") continue;
    const mapped = LEGACY_LANE_MAP[lane];
    if (mapped) next.add(mapped);
  }

  return next.size > 0 ? [...next] : ALL_TIMELINE_LANES;
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
  grouping: "collision" | "edge-start" | "edge-end";
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

export type DetailPanelItem = {
  id: string;
  label: string;
  subLabel?: string;
  value: number;
  category?: EventCategory;
  semanticKind?: TimelineSemanticKind;
  temporalStatus?: TimelineTemporalStatus;
  projectionType?: ProjectionType;
  certainty?: ProjectionCertainty;
};

// ── Constants ─────────────────────────────────────────────────

export const SLIDER_RESOLUTION             = 5_000;
export const MIN_GROUPING_GAP_PX           = 6;
export const MAX_GROUPING_GAP_PX           = 18;
export const SUB_TIMELINE_MIN_WIDTH      = 320;
export const SUB_TIMELINE_BUFFER_PX      = 10;
export const SUB_TIMELINE_CONNECTOR_HEIGHT = 72;
export const SUB_TIMELINE_MARGIN_RATIO   = 0.3;
export const MIN_SUB_TIMELINE_SPAN       = 86_400_000; // 1 day in ms
export const PAN_THRESHOLD_PX            = 5;
