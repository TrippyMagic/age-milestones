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

/** Category metadata: display label + dot color */
export const CATEGORY_META: Record<EventCategory, { label: string; color: string }> = {
  historical:    { label: "Historical",    color: "#ef4444" },
  scientific:    { label: "Scientific",    color: "#22d3ee" },
  technological: { label: "Technological", color: "#a855f7" },
  space:         { label: "Space",         color: "#38bdf8" },
  cultural:      { label: "Cultural",      color: "#34d399" },
};

/** Raw shape coming from public/data/historical-events.json */
export type HistoricalEventRaw = {
  id: string;
  label: string;
  /** ISO date string YYYY-MM-DD */
  date: string;
  category: EventCategory;
  description?: string;
  placement?: "above" | "below";
};

/** Parsed event with resolved timestamp */
export type HistoricalEventParsed = Omit<HistoricalEventRaw, "date"> & {
  /** Unix timestamp in ms */
  timestamp: number;
};

