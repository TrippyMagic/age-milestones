/**
 * src/types/phenomena.ts
 * Type definitions for Timescales phenomena data.
 */

export type PhenomenonCategory =
  | "quantum"
  | "biological"
  | "human"
  | "geological"
  | "cosmic";

export const PHENOMENON_CATEGORY_META: Record<
  PhenomenonCategory,
  { label: string; color: string }
> = {
  quantum:    { label: "Quantum",    color: "#f472b6" }, // pink
  biological: { label: "Biological", color: "#34d399" }, // emerald
  human:      { label: "Human",      color: "#38bdf8" }, // sky blue
  geological: { label: "Geological", color: "#fb923c" }, // orange
  cosmic:     { label: "Cosmic",     color: "#a78bfa" }, // violet
};

/** The full log10 range of ALL timescales (Planck → black hole evaporation). */
export const PHENOMENA_LOG_MIN = -44; // Planck time ≈ 10^-44 s
export const PHENOMENA_LOG_MAX =  75; // Black hole evaporation ≈ 10^74 s

export type TimescalePhenomenon = {
  id: string;
  label: string;
  /** Duration in seconds */
  durationSeconds: number;
  category: PhenomenonCategory;
  description?: string;
  /** Short examples shown in tooltips/cards */
  examples?: string[];
};

