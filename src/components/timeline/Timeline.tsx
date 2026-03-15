/**
 * src/components/timeline/Timeline.tsx
 * Main timeline component — manages viewport state, pan/zoom,
 * and composes axis, events, sub-timeline and controls.
 *
 * ~270 lines (down from 879 in the monolith).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

import { AnimatePresence } from "framer-motion";
import { useElementSize } from "../../hooks/useElementSize";
import { usePreferences } from "../../context/PreferencesContext";
import { usePinchZoom }   from "../../hooks/usePinchZoom";
import {
  viewportToRange,
  applyZoom,
  generateTicks,
  valueToRatio,
  ratioToValue,
  toPercent,
  clamp,
  ZOOM_IN,
  ZOOM_OUT,
  type Viewport,
} from "../../utils/scaleTransform";
import { buildRenderItems } from "./buildRenderItems";
import { EventElement }     from "./EventElement";
import { SubTimeline }      from "./SubTimeline";
import { TimelineControls } from "./TimelineControls";
import type { Props, RenderGroup } from "./types";
import { SLIDER_RESOLUTION, PAN_THRESHOLD_PX } from "./types";

// ── Hover formatting ──────────────────────────────────────────

const MS_IN_HOUR = 60 * 60 * 1_000;
const MS_IN_DAY  = 24 * MS_IN_HOUR;

const hoverDateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric", month: "short", year: "numeric",
});

const formatHoverTiming = (dateMs: number, now: number): string => {
  const diff    = dateMs - now;
  const absDiff = Math.abs(diff);
  if (absDiff < 1_000) return "Now";

  const years = absDiff / (365.25 * MS_IN_DAY);
  if (years >= 1.5) {
    const d = `${years >= 10 ? Math.round(years) : years.toFixed(1)} years`;
    return diff > 0 ? `In ${d}` : `${d} ago`;
  }
  const days  = Math.floor(absDiff / MS_IN_DAY);
  const hours = Math.floor((absDiff % MS_IN_DAY) / MS_IN_HOUR);
  const parts: string[] = [];
  if (days  > 0) parts.push(`${days}d`);
  if (hours > 0 && days < 60) parts.push(`${hours}h`);
  if (!parts.length) {
    const minutes = Math.floor((absDiff % MS_IN_HOUR) / 60_000);
    parts.push(minutes > 0 ? `${minutes}m` : "< 1m");
  }
  const d = parts.slice(0, 2).join(" ");
  return diff > 0 ? `In ${d}` : `${d} ago`;
};

// ── Component ─────────────────────────────────────────────────

export default function Timeline({
  range, value, onChange, events, renderValue,
}: Props) {
  // ── Viewport state ────────────────────────────────────────
  const [viewport, setViewport] = useState<Viewport>(() => ({
    center: (range.start + range.end) / 2,
    spanMs: range.end - range.start,
  }));

  // Reset viewport when external range changes (e.g. birthdate edited)
  useEffect(() => {
    setViewport({ center: (range.start + range.end) / 2, spanMs: range.end - range.start });
  }, [range.start, range.end]);

  // Always-current ref avoids stale closures in wheel/pointer callbacks
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  // ── Scale mode (lin / log) ────────────────────────────────
  const { scaleMode } = usePreferences();
  const scaleModeRef  = useRef(scaleMode);
  scaleModeRef.current = scaleMode;

  // Briefly add the transitioning class when scale mode changes so that
  // CSS position transitions fire only during the mode switch (not during pan/zoom).
  const [isScaleSwitching, setIsScaleSwitching] = useState(false);
  const prevScaleModeRef = useRef(scaleMode);
  useEffect(() => {
    if (prevScaleModeRef.current === scaleMode) return;
    prevScaleModeRef.current = scaleMode;
    setIsScaleSwitching(true);
    const id = window.setTimeout(() => setIsScaleSwitching(false), 420);
    return () => window.clearTimeout(id);
  }, [scaleMode]);

  const viewRange = useMemo(() => viewportToRange(viewport), [viewport]);

  const safeValue   = clamp(value, viewRange.start, viewRange.end);
  const valueRatio  = valueToRatio(safeValue, viewRange, scaleMode);
  const sliderValue = valueRatio * SLIDER_RESOLUTION;

  // ── Live clock ────────────────────────────────────────────
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  // ── Axis ref (size + DOM) ─────────────────────────────────
  const [axisRef, axisSize] = useElementSize<HTMLDivElement>();
  const axisNodeRef = useRef<HTMLDivElement | null>(null);
  const setAxisRef  = useCallback((node: HTMLDivElement | null) => {
    axisNodeRef.current = node;
    axisRef(node);
  }, [axisRef]);

  // ── Group button node refs ────────────────────────────────
  const groupNodesRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const setGroupNode  = useCallback((id: string, node: HTMLButtonElement | null) => {
    if (node) groupNodesRef.current.set(id, node);
    else      groupNodesRef.current.delete(id);
  }, []);

  // ── Derived rendering data ────────────────────────────────
  const sortedEvents = useMemo(
    () => events.slice().sort((a, b) => a.value - b.value),
    [events],
  );
  const autoTicks   = useMemo(() => generateTicks(viewRange, scaleMode), [viewRange, scaleMode]);
  const renderItems = useMemo(
    () => buildRenderItems(sortedEvents, viewRange, axisSize.width, scaleMode),
    [sortedEvents, viewRange, axisSize.width, scaleMode],
  );

  // ── Active group (sub-timeline) ───────────────────────────
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [hoverState, setHoverState]        = useState<{ dateMs: number; leftPercent: number } | null>(null);
  const [isPanning, setIsPanning]          = useState(false);

  const activeGroup     = useMemo(() => {
    if (!activeGroupId) return null;
    return (
      renderItems.find(i => i.type === "group" && i.id === activeGroupId) as RenderGroup | undefined
    ) ?? null;
  }, [activeGroupId, renderItems]);

  const activeGroupNode = activeGroup
    ? (groupNodesRef.current.get(activeGroup.id) ?? null)
    : null;

  // Close group if it disappears (e.g. after zoom)
  useEffect(() => {
    if (activeGroupId && !activeGroup) setActiveGroupId(null);
  }, [activeGroup, activeGroupId]);

  // Keyboard: Escape closes sub-timeline
  useEffect(() => {
    if (!activeGroupId) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setActiveGroupId(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeGroupId]);

  // ── Pan handlers ──────────────────────────────────────────
  const panStartRef  = useRef<{ clientX: number; centerAtStart: number; spanAtStart: number } | null>(null);
  const isPanningRef = useRef(false);
  /** Shared with usePinchZoom — true while a 2-finger pinch is in progress */
  const isPinchingRef = useRef(false);

  // ── Pinch-to-zoom ─────────────────────────────────────────
  const { showPinchHint } = usePinchZoom({
    axisNodeRef,
    viewportRef,
    scaleModeRef,
    setViewport,
    isPinchingRef,
    /** Abort any ongoing single-finger pan when a second finger lands */
    onPinchStart: () => {
      panStartRef.current  = null;
      isPanningRef.current = false;
      setIsPanning(false);
    },
  });

  const handleAxisPointerDown = useCallback((evt: ReactPointerEvent<HTMLDivElement>) => {
    if ((evt.target as HTMLElement).closest("button")) return;
    if (isPinchingRef.current)    return; // yield to active pinch
    if (panStartRef.current !== null) return; // already tracking a pointer
    evt.preventDefault();
    evt.currentTarget.setPointerCapture(evt.pointerId);
    const vp = viewportRef.current;
    panStartRef.current  = { clientX: evt.clientX, centerAtStart: vp.center, spanAtStart: vp.spanMs };
    isPanningRef.current = false;
  }, []);

  const handleAxisPointerMove = useCallback((evt: ReactPointerEvent<HTMLDivElement>) => {
    if (isPinchingRef.current) return; // pinch owns the gesture
    if (!panStartRef.current) return;
    const dx = evt.clientX - panStartRef.current.clientX;
    if (!isPanningRef.current && Math.abs(dx) > PAN_THRESHOLD_PX) {
      isPanningRef.current = true;
      setIsPanning(true);
    }
    if (!isPanningRef.current) return;
    const axis = axisNodeRef.current;
    if (!axis) return;
    const rect    = axis.getBoundingClientRect();
    if (rect.width === 0) return;
    const msPerPx = panStartRef.current.spanAtStart / rect.width;
    setViewport(prev => ({ ...prev, center: panStartRef.current!.centerAtStart - dx * msPerPx }));
  }, []);

  const handleAxisPointerUp = useCallback((evt: ReactPointerEvent<HTMLDivElement>) => {
    evt.currentTarget.releasePointerCapture(evt.pointerId);
    if (!isPanningRef.current && panStartRef.current) {
      const axis = axisNodeRef.current;
      if (axis) {
        const rect     = axis.getBoundingClientRect();
        const relative = clamp((evt.clientX - rect.left) / rect.width, 0, 1);
        const vp       = viewportRef.current;
        onChange(ratioToValue(relative, viewportToRange(vp), scaleModeRef.current));
      }
    }
    panStartRef.current  = null;
    isPanningRef.current = false;
    setIsPanning(false);
  }, [onChange]);

  // ── Ctrl+scroll zoom ──────────────────────────────────────
  useEffect(() => {
    const axis = axisNodeRef.current;
    if (!axis) return;
    const onWheel = (evt: WheelEvent) => {
      if (!evt.ctrlKey) return;
      evt.preventDefault();
      const rect     = axis.getBoundingClientRect();
      const relative = clamp((evt.clientX - rect.left) / rect.width, 0, 1);
      const vp       = viewportRef.current;
      const anchorMs = (vp.center - vp.spanMs / 2) + relative * vp.spanMs;
      setViewport(prev => applyZoom(prev, evt.deltaY > 0 ? ZOOM_OUT : ZOOM_IN, anchorMs));
    };
    axis.addEventListener("wheel", onWheel, { passive: false });
    return () => axis.removeEventListener("wheel", onWheel);
  }, []); // viewportRef is a stable ref — no re-registration needed

  // ── Zoom / reset buttons ──────────────────────────────────
  const handleZoomIn  = useCallback(() => setViewport(p => applyZoom(p, ZOOM_IN)),  []);
  const handleZoomOut = useCallback(() => setViewport(p => applyZoom(p, ZOOM_OUT)), []);
  const handleReset   = useCallback(
    () => setViewport({ center: (range.start + range.end) / 2, spanMs: range.end - range.start }),
    [range.start, range.end],
  );

  // ── Accessibility slider ──────────────────────────────────
  const handleSliderChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const ratio = Number(evt.target.value) / SLIDER_RESOLUTION;
    const vp    = viewportRef.current;
    onChange(ratioToValue(ratio, viewportToRange(vp), scaleModeRef.current));
  };

  // ── Group expand / collapse ───────────────────────────────
  const handleGroupToggle      = useCallback((id: string) => setActiveGroupId(p => p === id ? null : id), []);
  const handleCloseSubTimeline = useCallback(() => setActiveGroupId(null), []);

  // ── Hover tooltip ─────────────────────────────────────────
  const handleAxisMouseMove = useCallback((evt: ReactMouseEvent<HTMLDivElement>) => {
    if (isPanningRef.current || panStartRef.current) { setHoverState(null); return; }
    if ((evt.target as HTMLElement).closest(".timeline__event, .timeline__group")) {
      setHoverState(null);
      return;
    }
    const axis = axisNodeRef.current;
    if (!axis) return;
    const rect     = axis.getBoundingClientRect();
    if (rect.width === 0) return;
    const relative = clamp((evt.clientX - rect.left) / rect.width, 0, 1);
    const vp       = viewportRef.current;
    setHoverState({
      dateMs:      ratioToValue(relative, viewportToRange(vp), scaleModeRef.current),
      leftPercent: relative * 100,
    });
  }, []);

  const handleAxisMouseLeave = useCallback(() => setHoverState(null), []);

  // ── Render ────────────────────────────────────────────────
  const valueNode = renderValue?.(safeValue);
  if (viewport.spanMs <= 0) return null;

  return (
    <div className="timeline">
      {/* Visually hidden — keyboard / assistive accessibility */}
      <input
        type="range"
        min={0} max={SLIDER_RESOLUTION} step={1}
        value={sliderValue}
        onChange={handleSliderChange}
        className="timeline__slider"
        aria-label="Timeline focus"
      />

      <div className="timeline__stack">
        <div
          className={[
            "timeline__axis",
            isPanning        ? "timeline__axis--panning"      : "",
            isScaleSwitching ? "timeline__axis--transitioning" : "",
          ].filter(Boolean).join(" ")}
          ref={setAxisRef}
          onPointerDown={handleAxisPointerDown}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onMouseMove={handleAxisMouseMove}
          onMouseLeave={handleAxisMouseLeave}
        >
          <div className="timeline__line" />

          {/* Highlight range spanned by open group */}
          {activeGroup && (
            <div
              className="timeline__group-range"
              style={{
                left:  `${activeGroup.startRatio * 100}%`,
                width: `${Math.max((activeGroup.endRatio - activeGroup.startRatio) * 100, 0.5)}%`,
              }}
              aria-hidden="true"
            />
          )}

          {/* Year / quarter / month ticks */}
          {autoTicks.map(tick => {
            const left = toPercent(valueToRatio(tick.value, viewRange, scaleMode));
            return (
              <div key={tick.id} className="timeline__tick" style={{ left: `${left}%` }}>
                <span className="timeline__tick-line" />
                <span className="timeline__tick-label">{tick.label}</span>
              </div>
            );
          })}

          {/* Events and grouped bubbles */}
          {renderItems.map(item => {
            if (item.type === "group") {
              const isActive = activeGroup?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  ref={node => setGroupNode(item.id, node)}
                  className={`timeline__group${isActive ? " timeline__group--active" : ""}`}
                  style={{ left: `${item.leftPercent}%` }}
                  onClick={() => handleGroupToggle(item.id)}
                  aria-pressed={isActive}
                  aria-label={`${item.events.length} overlapping events`}
                >
                  <span className="timeline__group-count">{item.events.length}</span>
                </button>
              );
            }
            return (
              <EventElement
                key={item.event.id}
                event={item.event}
                leftPercent={item.leftPercent}
                variant="main"
                range={viewRange}
                now={now}
              />
            );
          })}

          {/* Focus cursor (current selected value) */}
          <div
            className="timeline__focus"
            style={{ left: `${toPercent(valueRatio)}%` } as CSSProperties}
            role="presentation"
            aria-hidden="true"
          >
            <span className="timeline__focus-stem" />
          </div>

          {/* Hover tooltip */}
          {hoverState !== null && (
            <div
              className="timeline__hover-tooltip"
              style={{ left: `${hoverState.leftPercent}%` }}
              aria-hidden="true"
            >
              <span className="timeline__hover-line" />
              <div className="timeline__hover-card">
                <span className="timeline__hover-date">
                  {hoverDateFormatter.format(new Date(hoverState.dateMs))}
                </span>
                <span className="timeline__hover-rel">
                  {formatHoverTiming(hoverState.dateMs, now)}
                </span>
              </div>
            </div>
          )}

          <TimelineControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleReset}
          />

          {/* Pinch-to-zoom hint — appears 3 s on first touch, then fades */}
          {showPinchHint && (
            <div className="timeline__pinch-hint" aria-live="polite" aria-atomic="true">
              Pinch to zoom
            </div>
          )}
        </div>

        {/* Expandable sub-timeline for grouped events */}
        <AnimatePresence>
          {activeGroup && axisSize.width > 0 && (
            <SubTimeline
              key={activeGroup.id}
              axisWidth={axisSize.width}
              group={activeGroup}
              range={viewRange}
              onClose={handleCloseSubTimeline}
              now={now}
              groupElement={activeGroupNode}
            />
          )}
        </AnimatePresence>
      </div>

      {valueNode && (
        <div className="timeline__value timeline__value--below">{valueNode}</div>
      )}
    </div>
  );
}









