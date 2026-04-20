import { useEffect, useState, useRef, useMemo, type ReactNode } from "react";
import { useBirthDate } from "../context/BirthDateContext";
import { useUserProfile } from "../context/UserProfileContext";
import { formatDisplay, formatFraction, formatEstimate, formatRange } from "../utils/format";
import { refineRange } from "../utils/refineMetrics";
import dayjs from "dayjs";

export type MetricType = "deterministic" | "estimate";

export type UnitRow = {
  label: string;
  seconds: number;
  type?: MetricType;
  rangeFactor?: {
    low: number;   // multiplier for low bound (e.g. 0.7 = -30%)
    high: number;  // multiplier for high bound (e.g. 1.4 = +40%)
  };
  personalizable?: boolean;
  displayMode?: "fraction";
};

type AgeTableProps = {
  rows: UnitRow[];
  renderNumber?: (value: number, label: string) => ReactNode;
};

type ValRow = UnitRow & {
  value: string;
  raw: number;
  updated: boolean;
  isEstimate: boolean;
  rangeLabel?: string;   // tooltip: "2.2M – 3.7M"
};

export default function AgeTable({ rows, renderNumber }: AgeTableProps) {
  const { birthDate, birthTime } = useBirthDate();
  const { profile } = useUserProfile();
  const [showRanges, setShowRanges] = useState(false);

  // Check if current tab has any estimate rows with range data
  const hasEstimates = useMemo(() => rows.some(r => r.type === "estimate" && r.rangeFactor), [rows]);

  // Pre-compute refined rows (profile-aware base + range)
  const refinedRows = useMemo(
    () => rows.map(r => {
      if (r.type !== "estimate") return r;
      const refined = refineRange(r, profile);
      return {
        ...r,
        seconds: refined.base,
        rangeFactor: { low: refined.low, high: refined.high },
      };
    }),
    [rows, profile],
  );

  const [vals, setVals] = useState<ValRow[]>(() =>
    refinedRows.map(r => ({ ...r, value: "--", raw: NaN, updated: false, isEstimate: r.type === "estimate" }))
  );
  const glowResetId = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!birthDate) return;
    const base = dayjs(`${dayjs(birthDate).format("YYYY-MM-DD")}T${birthTime}`);

    const tick = () => {
      // Skip recalculation when the tab is not visible
      if (document.hidden) return;

      const now = dayjs();
      const nowSeconds = now.unix();
      const birthSeconds = base.unix();

      setVals(prev =>
        refinedRows.map((r, idx) => {
          let display: string;
          let raw: number;
          const isEstimate = r.type === "estimate";
          let rangeLabel: string | undefined;

          if (r.label === "Dog years") {
            const humanYears = now.diff(base, "year", true);
            const dogYears =
              humanYears <= 15
                ? humanYears / 15
                : humanYears <= 24
                ? 1 + (humanYears - 15) / 9
                : 2 + (humanYears - 24) / 5;
            raw = dogYears;
            if (isEstimate && r.rangeFactor) {
              display = formatEstimate(dogYears);
              rangeLabel = formatRange(dogYears * r.rangeFactor.low, dogYears * r.rangeFactor.high);
            } else {
              display = dogYears.toFixed(4);
            }
          } else {
            raw = (nowSeconds - birthSeconds) / r.seconds;
            if (isEstimate) {
              display = formatEstimate(raw);
              if (r.rangeFactor) {
                rangeLabel = formatRange(raw * r.rangeFactor.low, raw * r.rangeFactor.high);
              }
            } else {
              display = r.displayMode === "fraction" ? formatFraction(raw) : formatDisplay(raw);
            }
          }

          const oldVal = prev[idx]?.value ?? "--";
          return {
            ...r,
            value: display,
            raw,
            updated: display !== oldVal,
            isEstimate,
            rangeLabel,
          };
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

    // Resume ticking immediately when tab becomes visible again
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
      {hasEstimates && (
        <div className="age-table__toolbar">
          <button
            type="button"
            className={`age-table__range-toggle${showRanges ? " age-table__range-toggle--active" : ""}`}
            onClick={() => setShowRanges(v => !v)}
            title={showRanges ? "Hide estimate ranges" : "Show estimate ranges"}
          >
            {showRanges ? "≈ Hide ranges" : "≈ Show ranges"}
          </button>
        </div>
      )}
      <table className="age-table">
        <tbody>
          {vals.map(r => (
            <tr key={r.label}>
              <td>
                {r.label}
                {r.isEstimate && <span className="age-table__estimate-badge" aria-hidden="true"> ≈</span>}
              </td>
              <td
                className={`age-val ${r.updated ? "updated" : ""} ${r.isEstimate ? "age-val--estimate" : ""}`}
              >
                {r.displayMode === "fraction" ? (
                  r.value
                ) : r.isEstimate ? (
                  <>
                    <span>{showRanges && r.rangeLabel ? r.rangeLabel : r.value}</span>
                    {renderNumber ? renderNumber(r.raw, r.label) : null}
                  </>
                ) : renderNumber ? (
                  renderNumber(r.raw, r.label)
                ) : (
                  r.value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
