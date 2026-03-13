/**
 * src/components/timescales/PhenomenaComparator.tsx
 * Side-by-side comparison of two timescale phenomena.
 * Shows ratio, human-readable sentence, and visual log-scale bars.
 */
import { useState } from "react";
import { PhenomenaSearch } from "./PhenomenaSearch";
import { formatDuration, formatRatioValue } from "../../utils/formatDuration";
import type { TimescalePhenomenon } from "../../types/phenomena";
import { PHENOMENON_CATEGORY_META, PHENOMENA_LOG_MIN, PHENOMENA_LOG_MAX } from "../../types/phenomena";

// ── Bar positions on the absolute [PHENOMENA_LOG_MIN, PHENOMENA_LOG_MAX] scale ──
const barPct = (dur: number): number => {
  const log = Math.log10(dur);
  return ((log - PHENOMENA_LOG_MIN) / (PHENOMENA_LOG_MAX - PHENOMENA_LOG_MIN)) * 100;
};

// ── Selected card ────────────────────────────────────────────
function SelectedCard({ p }: { p: TimescalePhenomenon }) {
  const meta = PHENOMENON_CATEGORY_META[p.category];
  return (
    <div className="ts-comparator__selected-card">
      <span className="ts-comparator__selected-cat" style={{ color: meta.color }}>
        {meta.label}
      </span>
      <span className="ts-comparator__selected-label">{p.label}</span>
      <span className="ts-comparator__selected-duration">
        {formatDuration(p.durationSeconds)}
      </span>
      {p.examples && (
        <span className="ts-comparator__selected-examples">
          {p.examples.join(" · ")}
        </span>
      )}
    </div>
  );
}

// ── Comparison bars ──────────────────────────────────────────
function ComparisonBars({ a, b }: { a: TimescalePhenomenon; b: TimescalePhenomenon }) {
  const pctA = barPct(a.durationSeconds);
  const pctB = barPct(b.durationSeconds);
  const colorA = PHENOMENON_CATEGORY_META[a.category].color;
  const colorB = PHENOMENON_CATEGORY_META[b.category].color;

  return (
    <div className="ts-comparator__bars">
      <p className="ts-comparator__bars-legend">Position on the absolute timescale</p>
      <div className="ts-comparator__bar-row">
        <span className="ts-comparator__bar-name">A</span>
        <div className="ts-comparator__bar-track">
          <div
            className="ts-comparator__bar-fill"
            style={{ width: `${pctA}%`, background: colorA }}
          />
        </div>
        <span className="ts-comparator__bar-val">{formatDuration(a.durationSeconds)}</span>
      </div>
      <div className="ts-comparator__bar-row">
        <span className="ts-comparator__bar-name">B</span>
        <div className="ts-comparator__bar-track">
          <div
            className="ts-comparator__bar-fill"
            style={{ width: `${pctB}%`, background: colorB }}
          />
        </div>
        <span className="ts-comparator__bar-val">{formatDuration(b.durationSeconds)}</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
type ComparatorProps = {
  phenomena: TimescalePhenomenon[];
  status:    "idle" | "loading" | "success" | "error";
};

export function PhenomenaComparator({ phenomena, status }: ComparatorProps) {
  const [slotA, setSlotA] = useState<TimescalePhenomenon | null>(null);
  const [slotB, setSlotB] = useState<TimescalePhenomenon | null>(null);

  // Ratio computation
  const ratio     = slotA && slotB ? slotA.durationSeconds / slotB.durationSeconds : null;
  const aLonger   = ratio !== null && ratio >= 1;
  const bigDur    = slotA && slotB ? Math.max(slotA.durationSeconds, slotB.durationSeconds) : null;
  const smallDur  = slotA && slotB ? Math.min(slotA.durationSeconds, slotB.durationSeconds) : null;
  const ratioStr  = bigDur && smallDur ? formatRatioValue(bigDur, smallDur) : null;

  const longerLabel  = aLonger ? slotA!.label : slotB?.label ?? "";
  const shorterLabel = aLonger ? slotB?.label ?? "" : slotA!.label;

  const isLoading = status === "loading";

  return (
    <div className="ts-comparator__wrapper">
      <div className="ts-comparator">
        {/* ── Slot A ── */}
        <div className="ts-comparator__slot">
          <p className="ts-comparator__slot-heading">Phenomenon A</p>
          {isLoading
            ? <div className="ts-loading__row" style={{ height: 44 }} />
            : (
              <PhenomenaSearch
                phenomena={phenomena}
                selected={slotA}
                onSelect={setSlotA}
                placeholder="Select phenomenon A…"
                excludeId={slotB?.id}
              />
            )
          }
          {slotA && <SelectedCard p={slotA} />}
        </div>

        {/* ── VS column ── */}
        <div className="ts-comparator__vs-col">
          <span className="ts-comparator__vs">vs</span>
          {ratio !== null && ratioStr && (
            <div className="ts-comparator__ratio-panel">
              <span className="ts-comparator__ratio-value">{ratioStr}</span>
              <span className="ts-comparator__ratio-sentence">
                <strong>{longerLabel}</strong>
                {" "}is{" "}
                {ratioStr}
                {" "}longer than{" "}
                <strong>{shorterLabel}</strong>
              </span>
            </div>
          )}
        </div>

        {/* ── Slot B ── */}
        <div className="ts-comparator__slot">
          <p className="ts-comparator__slot-heading">Phenomenon B</p>
          {isLoading
            ? <div className="ts-loading__row" style={{ height: 44 }} />
            : (
              <PhenomenaSearch
                phenomena={phenomena}
                selected={slotB}
                onSelect={setSlotB}
                placeholder="Select phenomenon B…"
                excludeId={slotA?.id}
              />
            )
          }
          {slotB && <SelectedCard p={slotB} />}
        </div>
      </div>

      {/* ── Comparison bars (shown once both slots filled) ── */}
      {slotA && slotB && <ComparisonBars a={slotA} b={slotB} />}
    </div>
  );
}

