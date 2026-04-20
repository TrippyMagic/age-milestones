import { useEffect, useState, useRef, useMemo } from "react";
import { useBirthDate } from "../context/BirthDateContext";
import { useUserProfile } from "../context/UserProfileContext";
import { formatDisplay, formatFraction, formatEstimate, formatRange, formatCompact } from "../utils/format";
import { refineRange } from "../utils/refineMetrics";
import { inferKindUnit } from "../utils/scaleConstants";
import { ScaleOverlay } from "./scaleOverlay";
import dayjs from "dayjs";

export type MetricType = "deterministic" | "estimate";

export type UnitRow = {
  label: string;
  seconds: number;
  type?: MetricType;
  rangeFactor?: {
    low: number;
    high: number;
  };
  personalizable?: boolean;
  displayMode?: "fraction";
};

type AgeTableProps = {
  rows: UnitRow[];
};

type ValRow = UnitRow & {
  value: string;       // compact display: formatCompact (det) or formatEstimate (est)
  exactValue: string;  // full display: formatDisplay (det only)
  raw: number;
  updated: boolean;
  isEstimate: boolean;
  rangeLabel?: string;
};

export default function AgeTable({ rows }: AgeTableProps) {
  const { birthDate, birthTime } = useBirthDate();
  const { profile } = useUserProfile();
  const [showRanges, setShowRanges] = useState(false);
  const [showExact, setShowExact] = useState(false);
  const [overlayRow, setOverlayRow] = useState<string | null>(null);

  // Minimum raw value to offer the "how much is it?" overlay (matches scaleHint logic)
  const MIN_OVERLAY_VALUE = 1000;

  const hasEstimates     = useMemo(() => rows.some(r => r.type === "estimate" && r.rangeFactor), [rows]);
  const hasDeterministic = useMemo(() => rows.some(r => r.type !== "estimate" && r.displayMode !== "fraction"), [rows]);

  const refinedRows = useMemo(
    () => rows.map(r => {
      if (r.type !== "estimate") return r;
      const refined = refineRange(r, profile);
      return { ...r, seconds: refined.base, rangeFactor: { low: refined.low, high: refined.high } };
    }),
    [rows, profile],
  );

  const [vals, setVals] = useState<ValRow[]>(() =>
    refinedRows.map(r => ({ ...r, value: "--", exactValue: "--", raw: NaN, updated: false, isEstimate: r.type === "estimate" }))
  );
  const glowResetId = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!birthDate) return;
    const base = dayjs(`${dayjs(birthDate).format("YYYY-MM-DD")}T${birthTime}`);

    const tick = () => {
      if (document.hidden) return;
      const now = dayjs();
      const nowSeconds = now.unix();
      const birthSeconds = base.unix();

      setVals(prev =>
        refinedRows.map((r, idx) => {
          const isEstimate = r.type === "estimate";
          let display: string;
          let exactValue = "";
          let raw: number;
          let rangeLabel: string | undefined;

          if (r.label === "Dog years") {
            const humanYears = now.diff(base, "year", true);
            const dY =
              humanYears <= 15 ? humanYears / 15
              : humanYears <= 24 ? 1 + (humanYears - 15) / 9
              : 2 + (humanYears - 24) / 5;
            raw = dY;
            if (isEstimate && r.rangeFactor) {
              display = formatEstimate(dY);
              rangeLabel = formatRange(dY * r.rangeFactor.low, dY * r.rangeFactor.high);
            } else {
              display = formatCompact(dY);
              exactValue = dY.toFixed(4);
            }
          } else {
            raw = (nowSeconds - birthSeconds) / r.seconds;
            if (r.displayMode === "fraction") {
              display = formatFraction(raw);
              exactValue = "";
            } else if (isEstimate) {
              display = formatEstimate(raw);
              if (r.rangeFactor) rangeLabel = formatRange(raw * r.rangeFactor.low, raw * r.rangeFactor.high);
            } else {
              display = formatCompact(raw);
              exactValue = formatDisplay(raw);
            }
          }

          const oldVal = prev[idx]?.value ?? "--";
          const oldExact = prev[idx]?.exactValue ?? "";
          // For deterministic rows, track exactValue changes (every second) so the
          // glow animation fires in exact mode. Estimate rows track display changes.
          const updated = isEstimate ? display !== oldVal : (exactValue !== oldExact || display !== oldVal);
          return { ...r, value: display, exactValue, raw, updated, isEstimate, rangeLabel };
        })
      );

      if (glowResetId.current) clearTimeout(glowResetId.current);
      glowResetId.current = setTimeout(
        () => setVals(v => v.map(o => ({ ...o, updated: false }))),
        300
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    const onVisChange = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisChange);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisChange);
      if (glowResetId.current) clearTimeout(glowResetId.current);
    };
  }, [birthDate, birthTime, refinedRows]);

  if (!birthDate) return null;

  return (
    <div className="age-table__wrap">
      {(hasEstimates || hasDeterministic) && (
        <div className="age-table__toolbar">
          {hasDeterministic && (
            <button
              type="button"
              className={`age-table__range-toggle${showExact ? " age-table__range-toggle--active" : ""}`}
              onClick={() => setShowExact(v => !v)}
              title={showExact ? "Switch to compact display" : "Show exact values"}
            >
              {showExact ? "# Compact" : "# Show exact"}
            </button>
          )}
          {hasEstimates && (
            <button
              type="button"
              className={`age-table__range-toggle${showRanges ? " age-table__range-toggle--active" : ""}`}
              onClick={() => setShowRanges(v => !v)}
              title={showRanges ? "Hide estimate ranges" : "Show estimate ranges"}
            >
              {showRanges ? "≈ Hide ranges" : "≈ Show ranges"}
            </button>
          )}
        </div>
      )}
      <table className="age-table">
        <tbody>
          {vals.map(r => {
            const { kind, disableOverlay } = inferKindUnit(r.label);
            // Row opens overlay if: count kind, not disabled, in range, and not an estimate in range-mode
            const canOverlay =
              kind === "count" &&
              !disableOverlay &&
              Number.isFinite(r.raw) &&
              r.raw > MIN_OVERLAY_VALUE &&
              !(r.isEstimate && showRanges);

            return (
              <tr
                key={r.label}
                className={canOverlay ? "age-table__row--clickable" : undefined}
                onClick={canOverlay ? () => setOverlayRow(r.label) : undefined}
                title={canOverlay ? "But how much is it?" : undefined}
              >
                <td>
                  {r.label}
                  {r.isEstimate && <span className="age-table__estimate-badge" aria-hidden="true"> ≈</span>}
                  {canOverlay && <span className="age-table__overlay-hint" aria-hidden="true"> ?</span>}
                </td>
                <td className={`age-val ${r.updated ? "updated" : ""} ${r.isEstimate ? "age-val--estimate" : ""}`}>
                  {r.displayMode === "fraction" ? (
                    r.value
                  ) : r.isEstimate ? (
                    <span>{showRanges && r.rangeLabel ? r.rangeLabel : r.value}</span>
                  ) : (
                    <span>{showExact ? r.exactValue : r.value}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Single portalled overlay — rendered for the currently open row */}
      {overlayRow !== null && (() => {
        const r = vals.find(v => v.label === overlayRow);
        if (!r) return null;
        const { kind, unit } = inferKindUnit(r.label);
        return (
          <ScaleOverlay
            open={true}
            onClose={() => setOverlayRow(null)}
            value={r.raw}
            unit={unit}
            kind={kind}
            isEstimate={r.isEstimate}
            rangeFactor={r.rangeFactor}
          />
        );
      })()}
    </div>
  );
}
