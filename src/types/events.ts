/**
 * src/types/events.ts
 * Shared types for historical/contextual timeline events
 */

/** Visual/thematic category for a timeline event */
export type EventCategory =
  | "historical"
  | "scientific"
  | "technological"
  | "space"
  | "cultural";

export type ProjectionType = "scheduled" | "astronomical" | "forecast" | "speculative";
export type ProjectionCertainty = "high" | "medium" | "low";

/** Category metadata: display label + dot color */
export const CATEGORY_META: Record<EventCategory, { label: string; color: string }> = {
  historical:    { label: "Historical",    color: "#ef4444" },
  scientific:    { label: "Scientific",    color: "#22d3ee" },
  technological: { label: "Technological", color: "#a855f7" },
  space:         { label: "Space",         color: "#38bdf8" },
  cultural:      { label: "Cultural",      color: "#34d399" },
};

export const PROJECTION_TYPE_META: Record<ProjectionType, { label: string }> = {
  scheduled:    { label: "Scheduled" },
  astronomical: { label: "Astronomical" },
  forecast:     { label: "Forecast" },
  speculative:  { label: "Speculative" },
};

export const PROJECTION_CERTAINTY_META: Record<ProjectionCertainty, { label: string }> = {
  high:   { label: "High confidence" },
  medium: { label: "Medium confidence" },
  low:    { label: "Low confidence" },
};

type TimelineEventRawBase = {
  id: string;
  label: string;
  /** ISO date string YYYY-MM-DD */
  date: string;
  category: EventCategory;
  description?: string;
  placement?: "above" | "below";
};

/** Raw shape coming from public/data/historical-events.json */
export type HistoricalEventRaw = TimelineEventRawBase;

/** Raw shape coming from public/data/projected-events.json */
export type ProjectedEventRaw = TimelineEventRawBase & {
  projectionType: ProjectionType;
  certainty: ProjectionCertainty;
};

/** Parsed event with resolved timestamp */
export type HistoricalEventParsed = Omit<HistoricalEventRaw, "date"> & {
  /** Unix timestamp in ms */
  timestamp: number;
  dataset: "historical";
};

export type ProjectedEventParsed = Omit<ProjectedEventRaw, "date"> & {
  /** Unix timestamp in ms */
  timestamp: number;
  dataset: "projected";
};

export const parseHistoricalEvents = (raw: HistoricalEventRaw[]): HistoricalEventParsed[] =>
  raw.map(({ date, ...rest }) => ({
    ...rest,
    timestamp: new Date(date).getTime(),
    dataset: "historical",
  }));

export const parseProjectedEvents = (raw: ProjectedEventRaw[]): ProjectedEventParsed[] =>
  raw.map(({ date, ...rest }) => ({
    ...rest,
    timestamp: new Date(date).getTime(),
    dataset: "projected",
  }));

