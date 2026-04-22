/**
 * src/components/timescales/GeoCosmicExplorer.tsx
 * Phase 4 — Geological & Cosmic Explorer.
 *
 * Two sub-tabs:
 *  • "Geological" — breadcrumb-based drilldown through Eons → Eras → Periods
 *  • "Cosmic"     — vertical log-scale timeline of cosmological milestones
 *
 * Geological tab interaction model:
 *  - Cards are shown for the current navigation level.
 *  - "Details" button → selects card, shows detail panel below the grid.
 *  - "Explore ›" button (only on units with children) → drills one level deeper.
 *  - Breadcrumb links → navigate back to any ancestor level.
 */
import { useMemo, useState } from "react";
import { useGeologicalEras } from "../../hooks/useGeologicalEras";
import { useExplorerDrilldown } from "../../hooks/useExplorerDrilldown";
import { EraCard } from "./EraCard";
import { formatMya, formatMyaDuration } from "../../utils/formatDuration";
import type { GeologicalUnit, CosmicMilestone } from "../../types/geological";
import { RANK_LABELS } from "../../types/geological";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui";

// ── Loading skeleton ───────────────────────────────────────────
function ExplorerSkeleton() {
  return (
    <div className="ts-loading">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="ts-loading__row" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}

// ── Detail panel for the selected geological unit ──────────────
function EraDetailPanel({
  unit,
  onClose,
  onExplore,
}: {
  unit: GeologicalUnit;
  onClose: () => void;
  onExplore: (unit: GeologicalUnit) => void;
}) {
  const hasKids = Boolean(unit.children?.length);

  return (
    <div className="ts-explorer__detail" role="region" aria-label={`Details: ${unit.name}`}>
      {/* Header */}
      <div className="ts-explorer__detail-header">
        <span
          className="ts-explorer__detail-swatch"
          style={{ background: unit.color }}
          aria-hidden="true"
        />
        <div className="ts-explorer__detail-title-group">
          <span className="ts-explorer__detail-rank">
            {RANK_LABELS[unit.rank]}
          </span>
          <h3 className="ts-explorer__detail-name">{unit.name}</h3>
        </div>
        <button
          type="button"
          className="ts-explorer__detail-close"
          onClick={onClose}
          aria-label="Close detail panel"
        >
          ×
        </button>
      </div>

      {/* Time range */}
      <div className="ts-explorer__detail-range">
        <span className="ts-explorer__detail-range-label">Time range</span>
        <span className="ts-explorer__detail-range-value">
          {formatMya(unit.startMya)} — {formatMya(unit.endMya)}
        </span>
        <span className="ts-explorer__detail-duration">
          {formatMyaDuration(unit.startMya, unit.endMya)}
        </span>
      </div>

      {/* Description */}
      {unit.description && (
        <p className="ts-explorer__detail-desc">{unit.description}</p>
      )}

      {/* Key events */}
      {unit.keyEvents && unit.keyEvents.length > 0 && (
        <div className="ts-explorer__detail-events">
          <p className="ts-explorer__detail-events-title">Key events</p>
          <ul className="ts-explorer__detail-events-list">
            {unit.keyEvents.map((ev, i) => (
              <li key={i} className="ts-explorer__detail-event-item">{ev}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Drill-down CTA */}
      {hasKids && (
        <button
          type="button"
          className="ts-explorer__detail-explore-btn"
          onClick={() => onExplore(unit)}
        >
          Explore sub-units
          <span aria-hidden="true"> ›</span>
        </button>
      )}
    </div>
  );
}

// ── Geological tab ─────────────────────────────────────────────
function GeologicalExplorer({ geological }: { geological: GeologicalUnit[] }) {
  const explorer = useExplorerDrilldown(geological);

  const maxDuration = useMemo(
    () =>
      explorer.currentItems.reduce(
        (max, u) => Math.max(max, u.startMya - u.endMya),
        0,
      ),
    [explorer.currentItems],
  );

  return (
    <div className="ts-explorer">
      {/* ── Breadcrumb ── */}
      <nav className="ts-explorer__breadcrumb" aria-label="Geological navigation">
        {explorer.breadcrumbs.map((crumb, idx) => {
          const isLast = idx === explorer.breadcrumbs.length - 1;
          return (
            <span key={crumb.depth} className="ts-explorer__breadcrumb-item">
              {isLast ? (
                <span className="ts-explorer__breadcrumb-current">{crumb.label}</span>
              ) : (
                <>
                  <button
                    type="button"
                    className="ts-explorer__breadcrumb-link"
                    onClick={() => explorer.drillTo(crumb.depth)}
                  >
                    {crumb.label}
                  </button>
                  <span className="ts-explorer__breadcrumb-sep" aria-hidden="true">›</span>
                </>
              )}
            </span>
          );
        })}
      </nav>

      {/* ── Cards grid ── */}
      <div className="ts-explorer__grid">
        {explorer.currentItems.map(unit => (
          <EraCard
            key={unit.id}
            unit={unit}
            isSelected={explorer.selected?.id === unit.id}
            maxDuration={maxDuration}
            onSelect={u => explorer.setSelected(explorer.selected?.id === u.id ? null : u)}
            onDrillDown={explorer.drillDown}
          />
        ))}
      </div>

      {/* ── Detail panel ── */}
      {explorer.selected && (
        <EraDetailPanel
          unit={explorer.selected}
          onClose={() => explorer.setSelected(null)}
          onExplore={explorer.drillDown}
        />
      )}
    </div>
  );
}

// ── Cosmic timeline item ───────────────────────────────────────
const COSMIC_LOG_MIN = Math.log10(0.01);        // ~10,000 yr ago
const COSMIC_LOG_MAX = Math.log10(13800 + 1);   // Big Bang

function cosmicBarPct(timeAgoMya: number): number {
  if (timeAgoMya <= 0) return 0;
  const log = Math.log10(timeAgoMya + 0.001);
  return Math.max(0, Math.min(100,
    ((log - COSMIC_LOG_MIN) / (COSMIC_LOG_MAX - COSMIC_LOG_MIN)) * 100,
  ));
}

function CosmicMilestoneItem({
  milestone,
  isSelected,
  onSelect,
}: {
  milestone: CosmicMilestone;
  isSelected: boolean;
  onSelect: (m: CosmicMilestone) => void;
}) {
  const pct = cosmicBarPct(milestone.timeAgoMya);

  return (
    <button
      type="button"
      className={`ts-cosmic__item${isSelected ? " ts-cosmic__item--selected" : ""}`}
      onClick={() => onSelect(milestone)}
      aria-pressed={isSelected}
    >
      <span className="ts-cosmic__icon" aria-hidden="true">{milestone.icon ?? "•"}</span>
      <div className="ts-cosmic__content">
        <div className="ts-cosmic__top">
          <span className="ts-cosmic__name">{milestone.name}</span>
          <span className="ts-cosmic__time">
            {milestone.timeAgoMya === 0 ? "Now" : formatMya(milestone.timeAgoMya) + " ago"}
          </span>
        </div>
        {/* Position bar */}
        <div className="ts-cosmic__bar-track" title="Position on cosmic timescale">
          <div className="ts-cosmic__bar-fill" style={{ width: `${pct}%` }} />
        </div>
        {/* Expanded description */}
        {isSelected && milestone.description && (
          <p className="ts-cosmic__desc">{milestone.description}</p>
        )}
      </div>
    </button>
  );
}

function CosmicTimeline({ milestones }: { milestones: CosmicMilestone[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...milestones].sort((a, b) => b.timeAgoMya - a.timeAgoMya),
    [milestones],
  );

  const toggle = (m: CosmicMilestone) =>
    setSelectedId(prev => (prev === m.id ? null : m.id));

  return (
    <div className="ts-cosmic">
      <p className="ts-cosmic__legend">
        From the Big Bang (13.8 Gyr ago) to today — click any event for details.
        Bar length reflects position on a logarithmic timescale.
      </p>
      <div className="ts-cosmic__list">
        {sorted.map(m => (
          <CosmicMilestoneItem
            key={m.id}
            milestone={m}
            isSelected={selectedId === m.id}
            onSelect={toggle}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
type ExplorerSubTab = "geological" | "cosmic";

export function GeoCosmicExplorer() {
  const { data, status, error } = useGeologicalEras();
  const [subTab, setSubTab]     = useState<ExplorerSubTab>("geological");

  if (status === "loading" || status === "idle") {
    return <ExplorerSkeleton />;
  }

  if (status === "error" || !data) {
    return (
      <p className="ts-overview__empty">
        {error ?? "Failed to load geological data."}
      </p>
    );
  }

  return (
    <Tabs value={subTab} onValueChange={(value) => value === "geological" || value === "cosmic" ? setSubTab(value) : undefined} className="ts-explorer-root">
      <TabsList className="ts-explorer__subtabs" aria-label="Explorer sections">
        <TabsTrigger className="ts-explorer__subtab" value="geological">
          🌍 Geological
        </TabsTrigger>
        <TabsTrigger className="ts-explorer__subtab" value="cosmic">
          🌌 Cosmic
        </TabsTrigger>
      </TabsList>

      <TabsContent value="geological">
        <GeologicalExplorer geological={data.geological} />
      </TabsContent>
      <TabsContent value="cosmic">
        <CosmicTimeline milestones={data.cosmic} />
      </TabsContent>
    </Tabs>
  );
}

