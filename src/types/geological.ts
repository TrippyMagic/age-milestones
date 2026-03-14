/**
 * src/types/geological.ts
 * Type definitions for the Geological & Cosmic Explorer (Phase 4).
 */

export type GeologicalRank = "eon" | "era" | "period" | "epoch";

export type GeologicalUnit = {
  id: string;
  name: string;
  rank: GeologicalRank;
  /** Millions of years ago — start of the unit (larger = older). */
  startMya: number;
  /** Millions of years ago — end of the unit (0 = present). */
  endMya: number;
  /** ICS standard colour (hex). */
  color: string;
  description?: string;
  keyEvents?: string[];
  /** Sub-units one rank below (eon → era → period → epoch). */
  children?: GeologicalUnit[];
};

export type CosmicMilestone = {
  id: string;
  name: string;
  /** Millions of years ago (0 = present). */
  timeAgoMya: number;
  description?: string;
  /** Emoji icon shown on the timeline. */
  icon?: string;
};

export type GeoExplorerData = {
  geological: GeologicalUnit[];
  cosmic: CosmicMilestone[];
};

/** Labels for each geological rank (display use). */
export const RANK_LABELS: Record<GeologicalRank, string> = {
  eon:    "Eon",
  era:    "Era",
  period: "Period",
  epoch:  "Epoch",
};

/** Abbreviations for rank badges. */
export const RANK_ABBR: Record<GeologicalRank, string> = {
  eon:    "EON",
  era:    "ERA",
  period: "PERIOD",
  epoch:  "EPOCH",
};

