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
import { usePinchZoom } from "../../hooks/usePinchZoom";
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
import { EventElement } from "./EventElement";
import { TimelineControls } from "./TimelineControls";
import { TimelineDetailPanel } from "./TimelineDetailPanel";
import { LANE_META, type DetailPanelItem, type Props, type TimelineLane } from "./types";
import { SLIDER_RESOLUTION, PAN_THRESHOLD_PX } from "./types";

const MS_IN_HOUR = 60 * 60 * 1_000;
const MS_IN_DAY = 24 * MS_IN_HOUR;
const LANE_ORDER: TimelineLane[] = ["personal", "historical", "markers"];

const hoverDateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric", month: "short", year: "numeric",
});

const formatHoverTiming = (dateMs: number, now: number): string => {
  const diff = dateMs - now;
  const absDiff = Math.abs(diff);
  if (absDiff < 1_000) return "Now";

  const years = absDiff / (365.25 * MS_IN_DAY);
  if (years >= 1.5) {
    const d = `${years >= 10 ? Math.round(years) : years.toFixed(1)} years`;
    return diff > 0 ? `In ${d}` : `${d} ago`;
  }

  const days = Math.floor(absDiff / MS_IN_DAY);
  const hours = Math.floor((absDiff % MS_IN_DAY) / MS_IN_HOUR);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 && days < 60) parts.push(`${hours}h`);
  if (!parts.length) {
    const minutes = Math.floor((absDiff % MS_IN_HOUR) / 60_000);
    parts.push(minutes > 0 ? `${minutes}m` : "< 1m");
  }

  const d = parts.slice(0, 2).join(" ");
  return diff > 0 ? `In ${d}` : `${d} ago`;
};

export default function Timeline({ range, value, onChange, events, renderValue }: Props) {
  const [viewport, setViewport] = useState<Viewport>(() => ({
    center: (range.start + range.end) / 2,
    spanMs: range.end - range.start,
  }));

  useEffect(() => {
    setViewport({ center: (range.start + range.end) / 2, spanMs: range.end - range.start });
  }, [range.start, range.end]);

  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const { scaleMode } = usePreferences();
  const scaleModeRef = useRef(scaleMode);
  scaleModeRef.current = scaleMode;

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
  const safeValue = clamp(value, viewRange.start, viewRange.end);
  const valueRatio = valueToRatio(safeValue, viewRange, scaleMode);
  const sliderValue = valueRatio * SLIDER_RESOLUTION;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const [axisRef, axisSize] = useElementSize<HTMLDivElement>();
  const axisNodeRef = useRef<HTMLDivElement | null>(null);
  const setAxisRef = useCallback((node: HTMLDivElement | null) => {
    axisNodeRef.current = node;
    axisRef(node);
  }, [axisRef]);

  const sortedEvents = useMemo(() => events.slice().sort((a, b) => a.value - b.value), [events]);
  const autoTicks = useMemo(() => generateTicks(viewRange, scaleMode), [viewRange, scaleMode]);

  const renderItemsByLane = useMemo(() => {
    const map: Record<TimelineLane, ReturnType<typeof buildRenderItems>> = {
      personal: [], historical: [], markers: [],
    };

    for (const lane of LANE_ORDER) {
      const laneEvents = sortedEvents.filter(event => (event.lane ?? "personal") === lane);
      map[lane] = buildRenderItems(laneEvents, viewRange, axisSize.width, scaleMode);
    }

    return map;
  }, [sortedEvents, viewRange, axisSize.width, scaleMode]);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<DetailPanelItem[]>([]);
  const [hoverState, setHoverState] = useState<{ dateMs: number; leftPercent: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const clearSelection = useCallback(() => {
    setSelectedGroupId(null);
    setSelectedItems([]);
  }, []);

  const panStartRef = useRef<{ clientX: number; centerAtStart: number; spanAtStart: number } | null>(null);
  const isPanningRef = useRef(false);
  const isPinchingRef = useRef(false);

  const { showPinchHint } = usePinchZoom({
    axisNodeRef,
    viewportRef,
    scaleModeRef,
    setViewport,
    isPinchingRef,
    onPinchStart: () => {
      panStartRef.current = null;
      isPanningRef.current = false;
      setIsPanning(false);
    },
  });

  const handleAxisPointerDown = useCallback((evt: ReactPointerEvent<HTMLDivElement>) => {
    const target = evt.target as HTMLElement;
    if (target.closest("button") || target.closest(".timeline__event")) return;
    if (isPinchingRef.current || panStartRef.current !== null) return;
    evt.preventDefault();
    evt.currentTarget.setPointerCapture(evt.pointerId);
    const vp = viewportRef.current;
    panStartRef.current = { clientX: evt.clientX, centerAtStart: vp.center, spanAtStart: vp.spanMs };
    isPanningRef.current = false;
  }, []);

  const handleAxisPointerMove = useCallback((evt: ReactPointerEvent<HTMLDivElement>) => {
    if (isPinchingRef.current || !panStartRef.current) return;
    const dx = evt.clientX - panStartRef.current.clientX;
    if (!isPanningRef.current && Math.abs(dx) > PAN_THRESHOLD_PX) {
      isPanningRef.current = true;
      setIsPanning(true);
    }
    if (!isPanningRef.current) return;
    const axis = axisNodeRef.current;
    if (!axis) return;
    const rect = axis.getBoundingClientRect();
    if (rect.width === 0) return;
    const msPerPx = panStartRef.current.spanAtStart / rect.width;
    setViewport(prev => ({ ...prev, center: panStartRef.current!.centerAtStart - dx * msPerPx }));
  }, []);

  const handleAxisPointerUp = useCallback((evt: ReactPointerEvent<HTMLDivElement>) => {
    evt.currentTarget.releasePointerCapture(evt.pointerId);
    if (!isPanningRef.current && panStartRef.current) {
      const axis = axisNodeRef.current;
      if (axis) {
        const rect = axis.getBoundingClientRect();
        const relative = clamp((evt.clientX - rect.left) / rect.width, 0, 1);
        const vp = viewportRef.current;
        onChange(ratioToValue(relative, viewportToRange(vp), scaleModeRef.current));
      }
    }
    panStartRef.current = null;
    isPanningRef.current = false;
    setIsPanning(false);
  }, [onChange]);

  useEffect(() => {
    const axis = axisNodeRef.current;
    if (!axis) return;
    const onWheel = (evt: WheelEvent) => {
      if (!evt.ctrlKey) return;
      evt.preventDefault();
      const rect = axis.getBoundingClientRect();
      const relative = clamp((evt.clientX - rect.left) / rect.width, 0, 1);
      const vp = viewportRef.current;
      const anchorMs = (vp.center - vp.spanMs / 2) + relative * vp.spanMs;
      setViewport(prev => applyZoom(prev, evt.deltaY > 0 ? ZOOM_OUT : ZOOM_IN, anchorMs));
    };
    axis.addEventListener("wheel", onWheel, { passive: false });
    return () => axis.removeEventListener("wheel", onWheel);
  }, []);

  const handleZoomIn = useCallback(() => setViewport(p => applyZoom(p, ZOOM_IN)), []);
  const handleZoomOut = useCallback(() => setViewport(p => applyZoom(p, ZOOM_OUT)), []);
  const handleReset = useCallback(
    () => setViewport({ center: (range.start + range.end) / 2, spanMs: range.end - range.start }),
    [range.start, range.end],
  );

  const handleSliderChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const ratio = Number(evt.target.value) / SLIDER_RESOLUTION;
    const vp = viewportRef.current;
    onChange(ratioToValue(ratio, viewportToRange(vp), scaleModeRef.current));
  };

  const handleAxisMouseMove = useCallback((evt: ReactMouseEvent<HTMLDivElement>) => {
    if (isPanningRef.current || panStartRef.current) {
      setHoverState(null);
      return;
    }
    if ((evt.target as HTMLElement).closest(".timeline__event, .timeline__group")) {
      setHoverState(null);
      return;
    }
    const axis = axisNodeRef.current;
    if (!axis) return;
    const rect = axis.getBoundingClientRect();
    if (rect.width === 0) return;
    const relative = clamp((evt.clientX - rect.left) / rect.width, 0, 1);
    const vp = viewportRef.current;
    setHoverState({
      dateMs: ratioToValue(relative, viewportToRange(vp), scaleModeRef.current),
      leftPercent: relative * 100,
    });
  }, []);

  const handleAxisMouseLeave = useCallback(() => setHoverState(null), []);

  const handleSingleSelect = useCallback((item: DetailPanelItem) => {
    setSelectedGroupId(item.id);
    setSelectedItems([item]);
  }, []);

  const handleGroupSelect = useCallback((id: string, items: DetailPanelItem[]) => {
    setSelectedGroupId(prev => {
      const next = prev === id ? null : id;
      setSelectedItems(next === null ? [] : items);
      return next;
    });
  }, []);

  const valueNode = renderValue?.(safeValue);
  if (viewport.spanMs <= 0) return null;

  return (
    <div className="timeline">
      <input
        type="range"
        min={0}
        max={SLIDER_RESOLUTION}
        step={1}
        value={sliderValue}
        onChange={handleSliderChange}
        className="timeline__slider"
        aria-label="Timeline focus"
      />

      <div className="timeline__stack">
        <div
          className={[
            "timeline__axis",
            isPanning ? "timeline__axis--panning" : "",
            isScaleSwitching ? "timeline__axis--transitioning" : "",
          ].filter(Boolean).join(" ")}
          ref={setAxisRef}
          onPointerDown={handleAxisPointerDown}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onMouseMove={handleAxisMouseMove}
          onMouseLeave={handleAxisMouseLeave}
        >
          <div className="timeline__lane-ruler">
            {autoTicks.map(tick => {
              const left = toPercent(valueToRatio(tick.value, viewRange, scaleMode));
              return (
                <div key={tick.id} className="timeline__tick" style={{ left: `${left}%` }}>
                  <span className="timeline__tick-line" />
                  <span className="timeline__tick-label">{tick.label}</span>
                </div>
              );
            })}
          </div>

          {LANE_ORDER.map((lane, idx) => {
            const laneItems = renderItemsByLane[lane];
            const laneTop = 30 + idx * 28;
            return (
              <div
                key={lane}
                className="timeline__lane"
                style={{ ["--timeline-line-top" as string]: `${laneTop}%` }}
              >
                <span className="timeline__lane-label">{LANE_META[lane].label}</span>
                <div className="timeline__line" />

                {laneItems.map(item => {
                  if (item.type === "group") {
                    const isActive = selectedGroupId === item.id;
                    const detailItems = item.events.map(event => ({
                      id: event.id,
                      label: event.label,
                      subLabel: event.subLabel,
                      value: event.value,
                    }));

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`timeline__group${isActive ? " timeline__group--active" : ""}`}
                        style={{ left: `${item.leftPercent}%` }}
                        onClick={() => handleGroupSelect(item.id, detailItems)}
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
                      selected={selectedGroupId === item.event.id}
                      onSelect={event => handleSingleSelect({
                        id: event.id,
                        label: event.label,
                        subLabel: event.subLabel,
                        value: event.value,
                      })}
                    />
                  );
                })}
              </div>
            );
          })}

          <div
            className="timeline__focus"
            style={{ left: `${toPercent(valueRatio)}%` } as CSSProperties}
            role="presentation"
            aria-hidden="true"
          >
            <span className="timeline__focus-stem" />
          </div>

          {hoverState !== null && (
            <div className="timeline__hover-tooltip" style={{ left: `${hoverState.leftPercent}%` }} aria-hidden="true">
              <span className="timeline__hover-line" />
              <div className="timeline__hover-card">
                <span className="timeline__hover-date">{hoverDateFormatter.format(new Date(hoverState.dateMs))}</span>
                <span className="timeline__hover-rel">{formatHoverTiming(hoverState.dateMs, now)}</span>
              </div>
            </div>
          )}

          <TimelineControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleReset} />

          {showPinchHint && (
            <div className="timeline__pinch-hint" aria-live="polite" aria-atomic="true">
              Pinch to zoom
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedItems.length > 0 && (
            <TimelineDetailPanel items={selectedItems} onClose={clearSelection} />
          )}
        </AnimatePresence>
      </div>

      {valueNode && <div className="timeline__value timeline__value--below">{valueNode}</div>}
    </div>
  );
}
