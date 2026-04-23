/**
 * src/components/timescales/TimescaleOverview.tsx
 * Vertical SVG ruler showing all phenomena on a logarithmic time axis.
 * Largest duration at top, smallest at bottom.
 * Dots are always visible; labels appear where space permits (collision avoidance).
 * Hovering any dot shows a tooltip with full details.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useElementSize } from "../../hooks/useElementSize";
import { formatDuration } from "../../utils/formatDuration";
import {
  absoluteLogRatio,
  formatLogExponentLabel,
  roundedLogExponent,
} from "../../utils/temporalScale";
import type { TimescalePhenomenon, PhenomenonCategory } from "../../types/phenomena";
import {
  PHENOMENON_CATEGORY_META,
  PHENOMENA_LOG_MIN,
  PHENOMENA_LOG_MAX,
} from "../../types/phenomena";

// ── Layout constants ──────────────────────────────────────────
const PAD_V        = 32;   // top/bottom padding in SVG units
const TRACK_X_RATIO = 0.42; // track at 42% from left
const MIN_LABEL_GAP = 15;  // minimum vertical gap (SVG units) between shown labels
const TICK_EVERY   = 3;    // show power-of-10 tick every N orders

// ── Log tick label formatter ──────────────────────────────────
const LOG_TICK_LABELS: Record<number, string> = {
  [-44]: "Planck", [-15]: "1 fs", [-12]: "1 ps",
  [-9]: "1 ns",   [-6]: "1 μs",  [-3]: "1 ms",
  [0]:  "1 s",    [3]:  "~17 min", [6]: "~11 days",
  [9]:  "~32 yr", [12]: "~32 kyr", [15]: "~32 Myr",
  [17]: "~3 Gyr", [18]: "~32 Gyr", [21]: "~1 Tyr",
};

const PHENOMENA_ABSOLUTE_LOG_SCALE = {
  minLog: PHENOMENA_LOG_MIN,
  maxLog: PHENOMENA_LOG_MAX,
} as const;

const tickLabel = (power: number): string =>
  LOG_TICK_LABELS[power] ?? formatLogExponentLabel(power, "s");

// ── Loading skeleton ──────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="ts-loading">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="ts-loading__row" style={{ width: `${65 + (i % 3) * 12}%` }} />
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────
type OverviewProps = {
  phenomena:        TimescalePhenomenon[];
  status:           "idle" | "loading" | "success" | "error";
  activeCategories: Set<PhenomenonCategory>;
};

export function TimescaleOverview({ phenomena, status, activeCategories }: OverviewProps) {
  const [vizRef, vizSize] = useElementSize<HTMLDivElement>();
  const svgRef   = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<TimescalePhenomenon | null>(null);
  const [selected, setSelected] = useState<TimescalePhenomenon | null>(null);
  const [mouse,   setMouse]   = useState({ x: 0, y: 0 });

  // Filter by active categories
  const filtered = useMemo(
    () => phenomena.filter(p => activeCategories.has(p.category)),
    [phenomena, activeCategories],
  );

  const w = vizSize.width  || 480;
  const h = vizSize.height || 720;

  const trackX   = w * TRACK_X_RATIO;
  const usableH  = h - 2 * PAD_V;

  // Map log value to SVG y: logMax → top, logMin → bottom
  const getY = useCallback((dur: number): number => {
    const ratio = absoluteLogRatio(dur, {
      ...PHENOMENA_ABSOLUTE_LOG_SCALE,
      invert: true,
    });
    return PAD_V + ratio * usableH;
  }, [usableH]);

  const renderDurationExponent = useCallback((durationSeconds: number, className: string) => {
    const exponent = roundedLogExponent(durationSeconds);
    if (exponent === null) return null;

    return (
      <span className={className} aria-label={formatLogExponentLabel(exponent, "seconds")}>
        {" "}(10<sup>{exponent}</sup> s)
      </span>
    );
  }, []);

  // Sort all filtered phenomena by y (top → bottom)
  const sorted = useMemo(
    () => filtered.slice().sort((a, b) => getY(a.durationSeconds) - getY(b.durationSeconds)),
    [filtered, getY],
  );

  // Assign label visibility + side (alternate) via collision avoidance
  type Positioned = TimescalePhenomenon & { y: number; side: "left" | "right"; showLabel: boolean };
  const positioned = useMemo<Positioned[]>(() => {
    let lastY = -Infinity;
    let sideIdx = 0;
    return sorted.map(p => {
      const y = getY(p.durationSeconds);
      const showLabel = y - lastY >= MIN_LABEL_GAP;
      const side = sideIdx % 2 === 0 ? "right" : "left";
      if (showLabel) { lastY = y; sideIdx++; }
      return { ...p, y, side, showLabel };
    });
  }, [sorted, getY]);

  // Power-of-10 ticks every TICK_EVERY orders
  const ticks = useMemo(() => {
    const lo = Math.ceil(PHENOMENA_LOG_MIN / TICK_EVERY) * TICK_EVERY;
    const hi = Math.floor(PHENOMENA_LOG_MAX / TICK_EVERY) * TICK_EVERY;
    const out: { power: number; y: number }[] = [];
    for (let p = lo; p <= hi; p += TICK_EVERY) {
      out.push({ power: p, y: getY(Math.pow(10, p)) });
    }
    return out;
  }, [getY]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  useEffect(() => {
    if (selected && !filtered.some(phenomenon => phenomenon.id === selected.id)) {
      setSelected(null);
    }
    if (hovered && !filtered.some(phenomenon => phenomenon.id === hovered.id)) {
      setHovered(null);
    }
  }, [filtered, hovered, selected]);

  const inspected = selected ?? hovered;

  const activatePhenomenon = useCallback((phenomenon: TimescalePhenomenon) => {
    setSelected(prev => prev?.id === phenomenon.id ? null : phenomenon);
  }, []);

  const describePhenomenon = useCallback((phenomenon: TimescalePhenomenon): string => {
    const category = PHENOMENON_CATEGORY_META[phenomenon.category].label;
    return `${phenomenon.label}. ${category}. ${formatDuration(phenomenon.durationSeconds)}.`;
  }, []);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="ts-overview__container">
      {status === "loading" && <LoadingSkeleton />}
      {status === "error"   && (
        <p className="ts-overview__empty">Failed to load phenomena data.</p>
      )}
      {filtered.length === 0 && status === "success" && (
        <p className="ts-overview__empty">No categories selected.</p>
      )}

      {filtered.length > 0 && (
        <>
          <div ref={vizRef} className="ts-overview__viz">
            <svg
              ref={svgRef}
              width={w}
              height={h}
              viewBox={`0 0 ${w} ${h}`}
              className="ts-overview__svg"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Central vertical track */}
              <line
                x1={trackX} y1={PAD_V}
                x2={trackX} y2={h - PAD_V}
                className="ts-overview__track"
              />

              {/* Power-of-10 reference ticks */}
              {ticks.map(({ power, y }) => (
                <g key={`tick-${power}`}>
                  <line x1={trackX - 10} y1={y} x2={trackX + 10} y2={y} className="ts-overview__tick-line" />
                  <text x={trackX - 14} y={y + 3.5} textAnchor="end" className="ts-overview__tick-label">
                    {tickLabel(power)}
                  </text>
                </g>
              ))}

              {/* Phenomena */}
              {positioned.map(p => {
                const color = PHENOMENON_CATEGORY_META[p.category].color;
                const isHovered = hovered?.id === p.id;
                const isSelected = selected?.id === p.id;
                const isActive = isHovered || isSelected;
                const r = p.showLabel ? 4.5 : 3;
                const labelX = p.side === "right" ? trackX + 13 : trackX - 13;
                const anchor = p.side === "right" ? "start" : "end";

                return (
                  <g
                    key={p.id}
                    className="ts-overview__dot-group"
                    role="button"
                    tabIndex={0}
                    aria-label={describePhenomenon(p)}
                    aria-pressed={isSelected}
                    onMouseEnter={() => setHovered(p)}
                    onFocus={() => setHovered(p)}
                    onClick={() => activatePhenomenon(p)}
                    onKeyDown={event => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      activatePhenomenon(p);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {p.showLabel && (
                      <line
                        x1={p.side === "right" ? trackX + 5 : trackX - 5}
                        y1={p.y}
                        x2={p.side === "right" ? trackX + 11 : trackX - 11}
                        y2={p.y}
                        stroke={color}
                        strokeOpacity={isActive ? 0.72 : 0.45}
                        strokeWidth={1}
                      />
                    )}

                    {isSelected && (
                      <circle
                        cx={trackX}
                        cy={p.y}
                        r={r + 4}
                        fill="transparent"
                        stroke={color}
                        strokeOpacity={0.55}
                        strokeWidth={1.5}
                      />
                    )}

                    <circle
                      cx={trackX} cy={p.y}
                      r={isActive ? r + 2 : r}
                      fill={color}
                      fillOpacity={isActive ? 1 : 0.8}
                      style={{ transition: "r 0.1s, fill-opacity 0.1s" }}
                    />

                    {p.showLabel && (
                      <text
                        x={labelX} y={p.y + 3.5}
                        textAnchor={anchor}
                        fill={color}
                        className="ts-overview__label-text"
                        opacity={isActive ? 1 : 0.88}
                      >
                        {p.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {hovered && (
              <div
                className="ts-overview__tooltip"
                style={{
                  left: Math.min(mouse.x + 14, w - 230),
                  top:  Math.max(mouse.y - 70, 8),
                }}
              >
                <span
                  className="ts-overview__tooltip-cat"
                  style={{ color: PHENOMENON_CATEGORY_META[hovered.category].color }}
                >
                  {PHENOMENON_CATEGORY_META[hovered.category].label}
                </span>
                <span className="ts-overview__tooltip-label">{hovered.label}</span>
                <span className="ts-overview__tooltip-duration">
                  {formatDuration(hovered.durationSeconds)}
                  {renderDurationExponent(hovered.durationSeconds, "ts-overview__tooltip-exp")}
                </span>
                {hovered.description && (
                  <span className="ts-overview__tooltip-desc">{hovered.description}</span>
                )}
                {hovered.examples && (
                  <span className="ts-overview__tooltip-examples">
                    {hovered.examples.join(" · ")}
                  </span>
                )}
              </div>
            )}
          </div>

          {inspected && (
            <section
              className="ts-overview__detail"
              role="region"
              aria-label={`Phenomenon details: ${inspected.label}`}
            >
              <div className="ts-overview__detail-header">
                <div className="ts-overview__detail-copy">
                  <span
                    className="ts-overview__detail-cat"
                    style={{ color: PHENOMENON_CATEGORY_META[inspected.category].color }}
                  >
                    {PHENOMENON_CATEGORY_META[inspected.category].label}
                  </span>
                  <h3 className="ts-overview__detail-title">{inspected.label}</h3>
                </div>

                {selected && (
                  <button
                    type="button"
                    className="ts-overview__detail-clear"
                    onClick={() => setSelected(null)}
                  >
                    Clear pinned detail
                  </button>
                )}
              </div>

              <p className="ts-overview__detail-duration">
                {formatDuration(inspected.durationSeconds)}
                {renderDurationExponent(inspected.durationSeconds, "ts-overview__detail-exp")}
              </p>

              {inspected.description && (
                <p className="ts-overview__detail-desc">{inspected.description}</p>
              )}

              {inspected.examples && inspected.examples.length > 0 && (
                <ul className="ts-overview__detail-examples">
                  {inspected.examples.map(example => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

