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
  resolveTimelineTargetAtPoint,
  type TimelineInteractiveTarget,
  type TimelineSelectionPayload,
} from "../timeline-core";
import { TimelineControls } from "./TimelineControls";
import { TimelineDetailPanel } from "./TimelineDetailPanel";
import { TimelineSceneCanvas } from "./TimelineSceneCanvas";
import { TimelineInteractiveOverlay } from "./TimelineInteractiveOverlay";
import { type DetailPanelItem, type Props } from "./types";
import { SLIDER_RESOLUTION, PAN_THRESHOLD_PX } from "./types";

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

  const effectiveViewport = activeViewport ?? FALLBACK_VIEWPORT;
  const viewRange = useMemo(() => viewportToRange(effectiveViewport), [effectiveViewport]);

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
    }),
    [events, viewRange, axisSize.width, value],
  );
  const safeValue = scene.focusValue;
  const sliderValue = scene.focusRatio * SLIDER_RESOLUTION;
  const interactiveTargets = useMemo(
    () => scene.lanes.flatMap(lane => lane.interactiveTargets),
    [scene.lanes],
  );

  const [selectedSelectionKey, setSelectedSelectionKey] = useState<string | null>(null);
  const [hoveredSelectionKey, setHoveredSelectionKey] = useState<string | null>(null);
  const [focusedSelectionKey, setFocusedSelectionKey] = useState<string | null>(null);
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
    if (target.closest(".timeline__ctrl-btn")) return;
    if (isPinchingRef.current || panStartRef.current !== null) return;
    evt.preventDefault();
    evt.currentTarget.setPointerCapture(evt.pointerId);
    const vp = viewportRef.current;
    panStartRef.current = { clientX: evt.clientX, centerAtStart: vp.center, spanAtStart: vp.spanMs };
    isPanningRef.current = false;
  }, []);

  const resolveTargetFromPointer = useCallback((clientX: number, clientY: number): TimelineInteractiveTarget | null => {
    const axis = axisNodeRef.current;
    if (!axis) return null;

    const rect = axis.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    return resolveTimelineTargetAtPoint({
      targets: interactiveTargets,
      width: rect.width,
      height: rect.height,
      x: clientX - rect.left,
      y: clientY - rect.top,
      preferredSelectionKey: focusedSelectionKey ?? hoveredSelectionKey ?? selectedSelectionKey,
    });
  }, [focusedSelectionKey, hoveredSelectionKey, interactiveTargets, selectedSelectionKey]);

  const handleAxisPointerMove = useCallback((evt: ReactPointerEvent<HTMLDivElement>) => {
    if (!evt.isPrimary) return;
    if (isPinchingRef.current) return;

    if (!panStartRef.current) {
      const nextTarget = resolveTargetFromPointer(evt.clientX, evt.clientY);
      setHoveredSelectionKey(nextTarget?.selectionKey ?? null);
      return;
    }

    const dx = evt.clientX - panStartRef.current.clientX;
    if (!isPanningRef.current && Math.abs(dx) > PAN_THRESHOLD_PX) {
      isPanningRef.current = true;
      setIsPanning(true);
      setHoveredSelectionKey(null);
    }
    if (!isPanningRef.current) return;
    const axis = axisNodeRef.current;
    if (!axis) return;
    const rect = axis.getBoundingClientRect();
    if (rect.width === 0) return;
    const msPerPx = panStartRef.current.spanAtStart / rect.width;
    setViewport(prev => ({ ...prev, center: panStartRef.current!.centerAtStart - dx * msPerPx }));
  }, [resolveTargetFromPointer]);

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
    onChange(ratioToValue(ratio, viewportToRange(vp)));
  }, [cancelPointerInteraction, onChange]);

  const handleAxisPointerCancel = useCallback(() => {
    cancelPointerInteraction();
    setHoveredSelectionKey(null);
  }, [cancelPointerInteraction]);

  const handleAxisPointerLeave = useCallback(() => {
    if (isPanningRef.current || panStartRef.current) return;
    setHoveredSelectionKey(null);
  }, []);

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

  const handleTargetActivate = useCallback((target: TimelineInteractiveTarget) => {
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

  const handleAxisPointerUp = useCallback((evt: ReactPointerEvent<HTMLDivElement>) => {
    if (!evt.isPrimary) {
      cancelPointerInteraction();
      return;
    }
    evt.currentTarget.releasePointerCapture(evt.pointerId);
    if (!isPanningRef.current && panStartRef.current) {
      const hitTarget = resolveTargetFromPointer(evt.clientX, evt.clientY);
      if (hitTarget) {
        handleTargetActivate(hitTarget);
      } else {
        const axis = axisNodeRef.current;
        if (axis) {
          const rect = axis.getBoundingClientRect();
          const relative = clamp((evt.clientX - rect.left) / rect.width, 0, 1);
          const vp = viewportRef.current;
          onChange(ratioToValue(relative, viewportToRange(vp)));
        }
      }
    }
    cancelPointerInteraction();
  }, [cancelPointerInteraction, handleTargetActivate, onChange, resolveTargetFromPointer]);

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
            !isPanning && hoveredSelectionKey ? "timeline__axis--over-target" : "",
          ].filter(Boolean).join(" ")}
          ref={setAxisRef}
          onPointerDown={handleAxisPointerDown}
          onPointerMove={handleAxisPointerMove}
          onPointerUp={handleAxisPointerUp}
          onPointerLeave={handleAxisPointerLeave}
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

          {interactiveTargets.length > 0 && axisSize.width > 0 && axisSize.height > 0 && (
            <>
              <TimelineSceneCanvas
                width={axisSize.width}
                height={axisSize.height}
                targets={interactiveTargets}
                selectedSelectionKey={selectedSelectionKey}
                hoveredSelectionKey={hoveredSelectionKey}
                focusedSelectionKey={focusedSelectionKey}
              />
              <TimelineInteractiveOverlay
                targets={interactiveTargets}
                selectedSelectionKey={selectedSelectionKey}
                hoveredSelectionKey={hoveredSelectionKey}
                focusedSelectionKey={focusedSelectionKey}
                onActivate={handleTargetActivate}
                onFocusTarget={target => setFocusedSelectionKey(target?.selectionKey ?? null)}
              />
            </>
          )}

          {scene.lanes.map(({ lane, label, topPercent }) => {
            return (
              <div
                key={lane}
                className={`timeline__lane timeline__lane--${lane}`}
                style={{ ["--timeline-line-top" as string]: `${topPercent}%` }}
              >
                <span className="timeline__lane-label">{label}</span>
                <div className="timeline__line" />
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
