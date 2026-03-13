/**
 * src/components/timeline/SubTimeline.tsx
 * Expandable sub-timeline shown when the user clicks a grouped event bubble.
 */
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import {
  valueToRatio,
  toPercent,
  clamp,
  type Range,
} from "../../utils/scaleTransform";
import { EventElement } from "./EventElement";
import type { RenderGroup, SubTimelineProps, SubTick } from "./types";
import {
  SUB_TIMELINE_CONNECTOR_HEIGHT,
  SUB_TIMELINE_MIN_WIDTH,
  SUB_TIMELINE_BUFFER_PX,
  SUB_TIMELINE_MARGIN_RATIO,
  MIN_SUB_TIMELINE_SPAN,
} from "./types";

// ── Helpers ───────────────────────────────────────────────────

const createSubRange = (group: RenderGroup, range: Range): Range => {
  const { start, end } = group.valueRange;
  const rawSpan = Math.max(end - start, 0);
  const margin  = Math.max(rawSpan * SUB_TIMELINE_MARGIN_RATIO, MIN_SUB_TIMELINE_SPAN);

  let nextStart = clamp(start - margin, range.start, range.end);
  let nextEnd   = clamp(end   + margin, range.start, range.end);

  if (nextEnd - nextStart < 1) {
    const middle = (nextStart + nextEnd) / 2;
    nextStart = Math.max(range.start, middle - MIN_SUB_TIMELINE_SPAN / 2);
    nextEnd   = Math.min(range.end,   middle + MIN_SUB_TIMELINE_SPAN / 2);
  }
  if (nextEnd <= nextStart) {
    nextEnd = Math.min(range.end, nextStart + MIN_SUB_TIMELINE_SPAN);
  }
  return { start: nextStart, end: nextEnd };
};

const createSubTicks = (range: Range): SubTick[] => {
  const span = range.end - range.start;
  if (span <= 0) return [];

  const formatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });

  const midpoint = range.start + span / 2;
  const values   = [range.start, midpoint, range.end];
  const seen     = new Set<number>();

  return values
    .map((value, index) => {
      const safeValue = clamp(value, range.start, range.end);
      if (seen.has(safeValue)) return null;
      seen.add(safeValue);
      return {
        id: `subtick-${safeValue}-${index}`,
        value: safeValue,
        leftPercent: toPercent(valueToRatio(safeValue, range)),
        label: formatter.format(new Date(safeValue)),
      } satisfies SubTick;
    })
    .filter((t): t is SubTick => t !== null);
};

// ── Component ─────────────────────────────────────────────────

export function SubTimeline({
  axisWidth,
  group,
  range,
  onClose,
  now,
  groupElement,
}: SubTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, onClose);

  const [connectorGap, setConnectorGap] = useState(SUB_TIMELINE_CONNECTOR_HEIGHT);

  useLayoutEffect(() => {
    const updateGap = () => {
      const wrapper = containerRef.current;
      if (!wrapper) return;

      if (!groupElement) {
        setConnectorGap(prev =>
          Math.abs(prev - SUB_TIMELINE_CONNECTOR_HEIGHT) < 0.5
            ? prev
            : SUB_TIMELINE_CONNECTOR_HEIGHT,
        );
        return;
      }

      const containerRect = wrapper.getBoundingClientRect();
      const groupRect     = groupElement.getBoundingClientRect();
      const measured      = containerRect.top - groupRect.bottom;
      const nextGap       = Number.isFinite(measured) && measured > 0
        ? measured
        : SUB_TIMELINE_CONNECTOR_HEIGHT;

      setConnectorGap(prev => (Math.abs(prev - nextGap) < 0.5 ? prev : nextGap));
    };

    updateGap();
    window.addEventListener("resize", updateGap);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateGap);
      if (containerRef.current) ro.observe(containerRef.current);
      if (groupElement)         ro.observe(groupElement);
    }

    return () => {
      window.removeEventListener("resize", updateGap);
      ro?.disconnect();
    };
  }, [groupElement]);

  const subRange  = useMemo(() => createSubRange(group, range), [group, range]);
  const subTicks  = useMemo(() => createSubTicks(subRange),     [subRange]);
  const subEvents = useMemo(
    () => group.events.map(event => ({
      event,
      leftPercent: toPercent(valueToRatio(event.value, subRange)),
    })),
    [group.events, subRange],
  );

  const baseWidth    = Math.max(axisWidth * (group.endRatio - group.startRatio), 0);
  const desiredWidth = Math.max(baseWidth + SUB_TIMELINE_BUFFER_PX * 2, SUB_TIMELINE_MIN_WIDTH);
  const width        = Math.min(axisWidth, desiredWidth);
  const center       = axisWidth * group.ratio;
  const left         = clamp(center - width / 2, 0, Math.max(axisWidth - width, 0));
  const groupCenterPx       = axisWidth * group.ratio;
  const startConnectorTarget = left;
  const endConnectorTarget   = left + width;
  const connectorsHeight     = Math.max(connectorGap, 1);

  const subTimelineStyle: CSSProperties = {
    ["--timeline-sub-gap" as string]: `${connectorsHeight}px`,
  };
  const axisWrapperStyle: CSSProperties = {
    width: `${width}px`,
    left:  `${left}px`,
  };

  return (
    <div className="timeline__subtimeline" style={subTimelineStyle}>
      <svg
        className="timeline__subtimeline-connectors"
        width={axisWidth}
        height={connectorsHeight}
        viewBox={`0 0 ${axisWidth} ${connectorsHeight}`}
        preserveAspectRatio="none"
      >
        <line x1={groupCenterPx} y1={0} x2={startConnectorTarget} y2={connectorsHeight} />
        <line x1={groupCenterPx} y1={0} x2={endConnectorTarget}   y2={connectorsHeight} />
      </svg>

      <div
        ref={containerRef}
        className="timeline__subtimeline-axis-wrapper"
        style={axisWrapperStyle}
      >
        <div className="timeline__subtimeline-axis">
          <div className="timeline__line" />
          {subTicks.map(tick => (
            <div
              key={tick.id}
              className="timeline__subtimeline-tick"
              style={{ left: `${tick.leftPercent}%` }}
            >
              <span className="timeline__subtimeline-tick-line" />
              <span className="timeline__subtimeline-tick-label">{tick.label}</span>
            </div>
          ))}
          {subEvents.map(item => (
            <EventElement
              key={`sub-${item.event.id}`}
              event={item.event}
              leftPercent={item.leftPercent}
              variant="sub"
              range={subRange}
              now={now}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

