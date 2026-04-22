import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { AnimatePresence } from "framer-motion";
import { useElementSize } from "../../hooks/useElementSize";
import { usePinchZoom } from "../../hooks/usePinchZoom";
import {
  viewportToRange,
  applyZoom,
  createViewportFromRange,
  sanitizeViewport,
  ratioToValue,
  clamp,
  MIN_SPAN_MS,
  ZOOM_IN,
  ZOOM_OUT,
  type Viewport,
} from "../../utils/scaleTransform";
import {
  buildTimelineScene,
  TIMELINE_INTERNAL_SCALE_MODE,
  toDetailPanelItem,
  type TimelineInteractiveTarget,
  type TimelineSelectionPayload,
} from "../timeline-core";
import { EventElement } from "./EventElement";
import { TimelineControls } from "./TimelineControls";
import { TimelineDetailPanel } from "./TimelineDetailPanel";
import { TimelineGlobalLaneCanvas } from "./TimelineGlobalLaneCanvas";
import { TimelineGlobalLaneOverlay } from "./TimelineGlobalLaneOverlay";
import { type DetailPanelItem, type Props, type TimelineEvent } from "./types";
import { SLIDER_RESOLUTION, PAN_THRESHOLD_PX } from "./types";

const TIMELINE_NOW_TICK_MS = 60_000;

const FALLBACK_VIEWPORT: Viewport = {
  center: 0,
  spanMs: MIN_SPAN_MS,
};

export default function Timeline({ range, value, onChange, events, renderValue }: Props) {
  const safeRange = useMemo(
    () => ({ start: range.start, end: range.end }),
    [range.start, range.end],
  );
  const baseViewport = useMemo(() => createViewportFromRange(safeRange), [safeRange]);
  const [viewport, setViewport] = useState<Viewport>(() => baseViewport ?? FALLBACK_VIEWPORT);

  useEffect(() => {
    if (baseViewport) setViewport(baseViewport);
  }, [baseViewport]);

  const activeViewport = useMemo(
    () => sanitizeViewport(viewport, safeRange) ?? baseViewport,
    [viewport, safeRange, baseViewport],
  );

  useEffect(() => {
    if (!activeViewport) return;
    if (viewport.center === activeViewport.center && viewport.spanMs === activeViewport.spanMs) return;
    setViewport(activeViewport);
  }, [activeViewport, viewport.center, viewport.spanMs]);

  const viewportRef = useRef<Viewport>(activeViewport ?? FALLBACK_VIEWPORT);
  viewportRef.current = activeViewport ?? FALLBACK_VIEWPORT;

  const scaleModeRef = useRef(TIMELINE_INTERNAL_SCALE_MODE);

  const effectiveViewport = activeViewport ?? FALLBACK_VIEWPORT;
  const viewRange = useMemo(() => viewportToRange(effectiveViewport), [effectiveViewport]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), TIMELINE_NOW_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const [axisRef, axisSize] = useElementSize<HTMLDivElement>();
  const axisNodeRef = useRef<HTMLDivElement | null>(null);
  const setAxisRef = useCallback((node: HTMLDivElement | null) => {
    axisNodeRef.current = node;
    axisRef(node);
  }, [axisRef]);

  const scene = useMemo<ReturnType<typeof buildTimelineScene>>(
    () => buildTimelineScene({
      events,
      range: viewRange,
      axisWidth: axisSize.width,
      focusValue: value,
      mode: TIMELINE_INTERNAL_SCALE_MODE,
    }),
    [events, viewRange, axisSize.width, value],
  );
  const safeValue = scene.focusValue;
  const sliderValue = scene.focusRatio * SLIDER_RESOLUTION;
  const globalLaneScene = scene.lanes.find(lane => lane.lane === "global");

  const [selectedSelectionKey, setSelectedSelectionKey] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<DetailPanelItem[]>([]);
  const [isPanning, setIsPanning] = useState(false);

  const clearSelection = useCallback(() => {
    setSelectedSelectionKey(null);
    setSelectedItems([]);
  }, []);

  const cancelPointerInteraction = useCallback(() => {
    panStartRef.current = null;
    isPanningRef.current = false;
    setIsPanning(false);
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
    if (!evt.isPrimary) return;
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
    if (!evt.isPrimary) return;
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
    if (!evt.isPrimary) {
      cancelPointerInteraction();
      return;
    }
    evt.currentTarget.releasePointerCapture(evt.pointerId);
    if (!isPanningRef.current && panStartRef.current) {
      const axis = axisNodeRef.current;
      if (axis) {
        const rect = axis.getBoundingClientRect();
        const relative = clamp((evt.clientX - rect.left) / rect.width, 0, 1);
        const vp = viewportRef.current;
          onChange(ratioToValue(relative, viewportToRange(vp), TIMELINE_INTERNAL_SCALE_MODE));
      }
    }
    cancelPointerInteraction();
  }, [cancelPointerInteraction, onChange]);

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
    () => setViewport(baseViewport ?? FALLBACK_VIEWPORT),
    [baseViewport],
  );

  const handleSliderChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    cancelPointerInteraction();
    const ratio = Number(evt.target.value) / SLIDER_RESOLUTION;
    const vp = viewportRef.current;
    onChange(ratioToValue(ratio, viewportToRange(vp), TIMELINE_INTERNAL_SCALE_MODE));
  }, [cancelPointerInteraction, onChange]);

  const handleAxisPointerCancel = useCallback(() => {
    cancelPointerInteraction();
  }, [cancelPointerInteraction]);

  const handleSingleSelect = useCallback((payload: TimelineSelectionPayload) => {
    setSelectedSelectionKey(payload.selectionKey);
    setSelectedItems(payload.detailItems);
  }, []);

  const handleGroupSelect = useCallback((payload: TimelineSelectionPayload) => {
    setSelectedSelectionKey(prev => {
      const next = prev === payload.selectionKey ? null : payload.selectionKey;
      setSelectedItems(next === null ? [] : payload.detailItems);
      return next;
    });
  }, []);

  const handleEventSelect = useCallback((event: TimelineEvent) => {
    handleSingleSelect({
      selectionKey: event.id,
      detailItems: [toDetailPanelItem(event)],
    });
  }, [handleSingleSelect]);

  const handleGlobalTargetActivate = useCallback((target: TimelineInteractiveTarget) => {
    const payload = {
      selectionKey: target.selectionKey,
      detailItems: target.detailItems,
    } satisfies TimelineSelectionPayload;

    if (target.kind === "group") {
      handleGroupSelect(payload);
      return;
    }

    handleSingleSelect(payload);
  }, [handleGroupSelect, handleSingleSelect]);

  const valueNode = renderValue?.(safeValue);
  const showFallback = !activeViewport || viewRange.end <= viewRange.start;

  if (showFallback) {
    return (
      <div className="timeline timeline--fallback">
        <div className="timeline__fallback" role="status" aria-live="polite">
          <h3 className="timeline__fallback-title">Timeline unavailable</h3>
          <p className="timeline__fallback-message">
            The current date range is invalid. Set a valid birth date in Settings and try again.
          </p>
          <button type="button" className="timeline__fallback-action" onClick={handleReset}>
            Reset view
          </button>
        </div>
      </div>
    );
  }

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
          ].filter(Boolean).join(" ")}
          ref={setAxisRef}
          onPointerDown={handleAxisPointerDown}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerCancel={handleAxisPointerCancel}
          onLostPointerCapture={handleAxisPointerCancel}
        >
          <div className="timeline__lane-ruler">
            {scene.ticks.map(tick => {
              return (
                <div key={tick.id} className="timeline__tick" style={{ left: `${tick.leftPercent}%` }}>
                  <span className="timeline__tick-line" />
                  <span className="timeline__tick-label">{tick.label}</span>
                </div>
              );
            })}
          </div>

          {globalLaneScene && axisSize.width > 0 && axisSize.height > 0 && (
            <>
              <TimelineGlobalLaneCanvas
                width={axisSize.width}
                height={axisSize.height}
                laneTopPercent={globalLaneScene.topPercent}
                targets={globalLaneScene.interactiveTargets}
              />
              <TimelineGlobalLaneOverlay
                targets={globalLaneScene.interactiveTargets}
                selectedSelectionKey={selectedSelectionKey}
                onActivate={handleGlobalTargetActivate}
              />
            </>
          )}

          {scene.lanes.map(({ lane, label, items, topPercent }) => {
            return (
              <div
                key={lane}
                className={`timeline__lane timeline__lane--${lane}`}
                style={{ ["--timeline-line-top" as string]: `${topPercent}%` }}
              >
                <span className="timeline__lane-label">{label}</span>
                <div className="timeline__line" />

                {lane === "personal" && items.map(item => {
                  if (item.type === "group") {
                    const isActive = selectedSelectionKey === item.id;
                    const detailItems = item.events.map(toDetailPanelItem);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={[
                          "timeline__group",
                          isActive ? "timeline__group--active" : "",
                          item.grouping === "edge-start" || item.grouping === "edge-end"
                            ? "timeline__group--edge"
                            : "",
                          item.grouping === "edge-start" ? "timeline__group--edge-start" : "",
                          item.grouping === "edge-end" ? "timeline__group--edge-end" : "",
                        ].filter(Boolean).join(" ")}
                        style={{ left: `${item.leftPercent}%` }}
                        onClick={() => handleGroupSelect({ selectionKey: item.id, detailItems })}
                        aria-pressed={isActive}
                        aria-label={
                          item.grouping === "edge-start"
                            ? `${item.events.length} events exist before the visible range`
                            : item.grouping === "edge-end"
                            ? `${item.events.length} events exist after the visible range`
                            : `${item.events.length} overlapping events`
                        }
                        title={
                          item.grouping === "edge-start"
                            ? `${item.events.length} marker${item.events.length === 1 ? "" : "s"} before this view`
                            : item.grouping === "edge-end"
                            ? `${item.events.length} marker${item.events.length === 1 ? "" : "s"} after this view`
                            : `${item.events.length} overlapping marker${item.events.length === 1 ? "" : "s"}`
                        }
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
                      selected={selectedSelectionKey === item.event.id}
                      onSelect={handleEventSelect}
                    />
                  );
                })}
              </div>
            );
          })}

          <div
            className="timeline__focus"
            style={{ left: `${scene.focusLeftPercent}%` } as CSSProperties}
            role="presentation"
            aria-hidden="true"
          >
            <span className="timeline__focus-stem" />
          </div>

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
