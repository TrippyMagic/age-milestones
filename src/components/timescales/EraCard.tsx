/**
 * src/components/timescales/EraCard.tsx
 * Card representing a single geological unit (eon / era / period / epoch).
 * Shows ICS colour swatch, rank badge, name, log-scale proportional bar,
 * date range, and duration.
 * Clicking selects the card; if the unit has children an "Explore" button
 * allows drilling deeper.
 */
import type { CSSProperties } from "react";
import type { GeologicalUnit } from "../../types/geological";
import { RANK_ABBR } from "../../types/geological";
import { formatMya, formatMyaDuration } from "../../utils/formatDuration";

type EraCardProps = {
  unit: GeologicalUnit;
  isSelected: boolean;
  /** Max duration among sibling cards — used to normalise the log bar. */
  maxDuration: number;
  detailPanelId?: string;
  onSelect: (unit: GeologicalUnit) => void;
  onDrillDown: (unit: GeologicalUnit) => void;
};

/**
 * Map a duration to a bar width percentage [0, 100] using linear scale.
 * Linear is preferable here because siblings within a geological level
 * are all the same order of magnitude — log scale compresses them all
 * into 80-100% with little visual difference.
 */
const linearBarPct = (duration: number, maxDuration: number): number => {
  if (duration <= 0 || maxDuration <= 0) return 0;
  return Math.min((duration / maxDuration) * 100, 100);
};

export function EraCard({
  unit,
  isSelected,
  maxDuration,
  detailPanelId,
  onSelect,
  onDrillDown,
}: EraCardProps) {
  const duration  = unit.startMya - unit.endMya;
  const barPct    = linearBarPct(duration, maxDuration);
  const hasKids   = Boolean(unit.children && unit.children.length > 0);

  return (
    <div
      className={`ts-era-card${isSelected ? " ts-era-card--selected" : ""}`}
      style={{ "--era-color": unit.color } as CSSProperties}
      role="article"
    >
      {/* ── Header ── */}
      <div className="ts-era-card__header">
        <span
          className="ts-era-card__swatch"
          aria-hidden="true"
        />
        <span className="ts-era-card__rank">
          {RANK_ABBR[unit.rank] ?? unit.rank.toUpperCase()}
        </span>
        <span className="ts-era-card__name">{unit.name}</span>
      </div>

      {/* ── Log-scale proportional bar ── */}
      <div className="ts-era-card__bar-track" title={`~${formatMyaDuration(unit.startMya, unit.endMya)} long`}>
        <div
          className="ts-era-card__bar-fill"
          style={{ width: `${barPct}%` }}
        />
      </div>

      {/* ── Date range + duration ── */}
      <div className="ts-era-card__meta">
        <span className="ts-era-card__range">
          {formatMya(unit.startMya)} — {formatMya(unit.endMya)}
        </span>
        <span className="ts-era-card__duration">
          {formatMyaDuration(unit.startMya, unit.endMya)}
        </span>
      </div>

      {/* ── Action buttons ── */}
      <div className="ts-era-card__actions">
        <button
          type="button"
          className={`ts-era-card__btn-select${isSelected ? " ts-era-card__btn-select--active" : ""}`}
          onClick={() => onSelect(unit)}
          aria-pressed={isSelected}
          aria-expanded={isSelected}
          aria-controls={detailPanelId}
        >
          {isSelected ? "Hide details" : "Show details"}
        </button>
        {hasKids && (
          <button
            type="button"
            className="ts-era-card__btn-explore"
            onClick={() => onDrillDown(unit)}
            aria-label={`Explore sub-units inside ${unit.name}`}
          >
            Explore sub-units
            <span className="ts-era-card__btn-explore-icon" aria-hidden="true">›</span>
          </button>
        )}
      </div>
    </div>
  );
}



