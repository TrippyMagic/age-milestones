import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode
} from "react";

import { useElementSize } from "../hooks/useElementSize";
import { useOutsideClick } from "../hooks/useOutsideClick";

const SLIDER_RESOLUTION = 5000;
const GROUPING_GAP_PX = 48;
const SUB_TIMELINE_MIN_WIDTH = 320;
const SUB_TIMELINE_BUFFER_PX = 10;
const SUB_TIMELINE_CONNECTOR_HEIGHT = 72;
const SUB_TIMELINE_MARGIN_RATIO = 0.3;
const MIN_SUB_TIMELINE_SPAN = 86_400_000;

export type Range = {
  start: number;
  end: number;
};

type Accent = "default" | "highlight" | "muted";

type MarkerShape = "dot" | "triangle";

const accentColors: Record<Accent, string> = {
  default: "var(--indigo-300)",
  highlight: "var(--indigo-100)",
  muted: "var(--slate-700)"
};

const MS_IN_SECOND = 1000;
const MS_IN_MINUTE = MS_IN_SECOND * 60;
const MS_IN_HOUR = MS_IN_MINUTE * 60;
const MS_IN_DAY = MS_IN_HOUR * 24;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export type TimelineEvent = {
  id: string;
  label: string;
  value: number;
  subLabel?: string;
  placement?: "above" | "below";
  markerShape?: MarkerShape;
  accent?: Accent;
};

export type TimelineTick = {
  id: string;
  value: number;
  label: string;
};

type Props = {
  range: Range;
  value: number;
  onChange: (value: number) => void;
  events: TimelineEvent[];
  ticks?: TimelineTick[];
  renderValue?: (value: number) => ReactNode;
};

type PositionedEvent = {
  event: TimelineEvent;
  ratio: number;
};

type RenderSingle = {
  type: "single";
  id: string;
  event: TimelineEvent;
  leftPercent: number;
  ratio: number;
};

type RenderGroup = {
  type: "group";
  id: string;
  events: TimelineEvent[];
  leftPercent: number;
  ratio: number;
  startRatio: number;
  endRatio: number;
  valueRange: Range;
};

type RenderItem = RenderSingle | RenderGroup;

type SubTimelineProps = {
  axisWidth: number;
  group: RenderGroup;
  range: Range;
  onClose: () => void;
  now: number;
  groupElement: HTMLButtonElement | null;
};

type SubTick = {
  id: string;
  value: number;
  leftPercent: number;
  label: string;
};

const getRatio = (value: number, range: Range, span: number) => {
  if (span <= 0) return 0;
  const clamped = clamp(value, range.start, range.end);
  return (clamped - range.start) / span;
};

const toPercent = (ratio: number) => ratio * 100;

const buildRenderItems = (
  events: TimelineEvent[],
  range: Range,
  span: number,
  axisWidth: number
): RenderItem[] => {
  if (!events.length) return [];

  const positioned: PositionedEvent[] = events.map(event => ({
    event,
    ratio: getRatio(event.value, range, span)
  }));

  if (axisWidth <= 0) {
    return positioned.map(item => ({
      type: "single",
      id: item.event.id,
      event: item.event,
      leftPercent: toPercent(item.ratio),
      ratio: item.ratio
    }));
  }

  const items: RenderItem[] = [];
  let buffer: PositionedEvent[] = [];

  const flush = () => {
    if (!buffer.length) return;
    if (buffer.length === 1) {
      const item = buffer[0];
      items.push({
        type: "single",
        id: item.event.id,
        event: item.event,
        leftPercent: toPercent(item.ratio),
        ratio: item.ratio
      });
      buffer = [];
      return;
    }

    const first = buffer[0];
    const last = buffer[buffer.length - 1];
    const ratios = buffer.map(b => b.ratio);
    const avg = ratios.reduce((acc, current) => acc + current, 0) / buffer.length;
    const rangeValues = buffer.map(b => clamp(b.event.value, range.start, range.end));
    const startValue = Math.min(...rangeValues);
    const endValue = Math.max(...rangeValues);

    items.push({
      type: "group",
      id: buffer.map(b => b.event.id).join("::"),
      events: buffer.map(b => b.event),
      leftPercent: toPercent(avg),
      ratio: avg,
      startRatio: first.ratio,
      endRatio: last.ratio,
      valueRange: { start: startValue, end: endValue }
    });

    buffer = [];
  };

  for (const item of positioned) {
    if (!buffer.length) {
      buffer.push(item);
      continue;
    }

    const prev = buffer[buffer.length - 1];
    const distancePx = Math.abs(item.ratio - prev.ratio) * axisWidth;
    if (distancePx < GROUPING_GAP_PX) {
      buffer.push(item);
    } else {
      flush();
      buffer.push(item);
    }
  }

  flush();

  return items;
};

const createSubRange = (group: RenderGroup, range: Range): Range => {
  const { start, end } = group.valueRange;
  const rawSpan = Math.max(end - start, 0);
  const margin = Math.max(rawSpan * SUB_TIMELINE_MARGIN_RATIO, MIN_SUB_TIMELINE_SPAN);

  let nextStart = clamp(start - margin, range.start, range.end);
  let nextEnd = clamp(end + margin, range.start, range.end);

  if (nextEnd - nextStart < 1) {
    const middle = (nextStart + nextEnd) / 2;
    nextStart = Math.max(range.start, middle - MIN_SUB_TIMELINE_SPAN / 2);
    nextEnd = Math.min(range.end, middle + MIN_SUB_TIMELINE_SPAN / 2);
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
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  const midpoint = range.start + span / 2;
  const values = [range.start, midpoint, range.end];
  const seen = new Set<number>();

  return values
    .map((value, index) => {
      const safeValue = clamp(value, range.start, range.end);
      if (seen.has(safeValue)) return null;
      seen.add(safeValue);
      const ratio = getRatio(safeValue, range, span);

      return {
        id: `subtick-${safeValue}-${index}`,
        value: safeValue,
        leftPercent: toPercent(ratio),
        label: formatter.format(new Date(safeValue))
      } satisfies SubTick;
    })
    .filter((tick): tick is SubTick => Boolean(tick));
};

const formatEventTiming = (eventValue: number, now: number) => {
  const diff = eventValue - now;
  const absDiff = Math.abs(diff);
  if (absDiff < MS_IN_SECOND) return "Happening now";

  const days = Math.floor(absDiff / MS_IN_DAY);
  const hours = Math.floor((absDiff % MS_IN_DAY) / MS_IN_HOUR);
  const minutes = Math.floor((absDiff % MS_IN_HOUR) / MS_IN_MINUTE);
  const seconds = Math.floor((absDiff % MS_IN_MINUTE) / MS_IN_SECOND);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  const descriptor = parts.join(" ");
  return diff > 0 ? `In ${descriptor}` : `Time elapsed ${descriptor}`;
};

export default function Timeline({ range, value, onChange, events, ticks = [], renderValue }: Props) {
  const rawSpan = range.end - range.start;
  const span = rawSpan <= 0 ? 1 : rawSpan;
  const isInvalidRange = rawSpan <= 0;

  const safeValue = clamp(value, range.start, range.end);
  const valueRatio = getRatio(safeValue, range, span);
  const sliderValue = valueRatio * SLIDER_RESOLUTION;

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const [axisRef, axisSize] = useElementSize<HTMLDivElement>();
  const axisNodeRef = useRef<HTMLDivElement | null>(null);
  const setAxisRef = useCallback(
    (node: HTMLDivElement | null) => {
      axisNodeRef.current = node;
      axisRef(node);
    },
    [axisRef]
  );

  const groupNodesRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const setGroupNode = useCallback((groupId: string, node: HTMLButtonElement | null) => {
    if (node) {
      groupNodesRef.current.set(groupId, node);
    } else {
      groupNodesRef.current.delete(groupId);
    }
  }, []);

  const sortedEvents = useMemo(() => events.slice().sort((a, b) => a.value - b.value), [events]);
  const sortedTicks = useMemo(() => ticks.slice().sort((a, b) => a.value - b.value), [ticks]);

  const renderItems = useMemo(
    () => buildRenderItems(sortedEvents, range, span, axisSize.width),
    [sortedEvents, range, span, axisSize.width]
  );

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const activeGroup = useMemo(() => {
    if (!activeGroupId) return null;
    return (
      renderItems.find(item => item.type === "group" && item.id === activeGroupId) as RenderGroup | undefined
    ) ?? null;
  }, [activeGroupId, renderItems]);

  const activeGroupNode = activeGroup ? groupNodesRef.current.get(activeGroup.id) ?? null : null;

  useEffect(() => {
    if (!activeGroupId) return;
    if (activeGroup) return;
    setActiveGroupId(null);
  }, [activeGroup, activeGroupId]);

  useEffect(() => {
    if (!activeGroupId) return;
    const handleKey = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") setActiveGroupId(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeGroupId]);

  const updateValueFromClientX = useCallback(
    (clientX: number) => {
      const axis = axisNodeRef.current;
      if (!axis) return;
      const rect = axis.getBoundingClientRect();
      if (rect.width === 0) return;
      const relative = clamp((clientX - rect.left) / rect.width, 0, 1);
      const next = range.start + relative * span;
      onChange(clamp(next, range.start, range.end));
    },
    [onChange, range.end, range.start, span]
  );

  const draggingRef = useRef(false);

  const handleFocusPointerDown = useCallback(
    (evt: ReactPointerEvent<HTMLDivElement>) => {
      evt.preventDefault();
      draggingRef.current = true;
      const target = evt.target as HTMLElement | null;
      if (target && typeof target.setPointerCapture === "function") {
        target.setPointerCapture(evt.pointerId);
      }
      updateValueFromClientX(evt.clientX);
    },
    [updateValueFromClientX]
  );

  const handleFocusPointerMove = useCallback(
    (evt: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      updateValueFromClientX(evt.clientX);
    },
    [updateValueFromClientX]
  );

  const handleFocusPointerUp = useCallback((evt: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const target = evt.target as HTMLElement | null;
    if (target && typeof target.releasePointerCapture === "function") {
      target.releasePointerCapture(evt.pointerId);
    }
  }, []);

  const handleSliderChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const ratio = Number(evt.target.value) / SLIDER_RESOLUTION;
    const next = range.start + ratio * span;
    onChange(clamp(next, range.start, range.end));
  };

  const handleGroupToggle = useCallback((groupId: string) => {
    setActiveGroupId(prev => (prev === groupId ? null : groupId));
  }, []);

  const handleCloseSubTimeline = useCallback(() => setActiveGroupId(null), []);

  const valueNode = renderValue?.(safeValue);

  if (isInvalidRange) return null;

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
        <div className="timeline__axis" ref={setAxisRef}>
          <div className="timeline__line" />

          {sortedTicks.map(tick => {
            const ratio = getRatio(tick.value, range, span);
            const left = toPercent(ratio);
            return (
              <div key={tick.id} className="timeline__tick" style={{ left: `${left}%` }}>
                <span className="timeline__tick-line" />
                <span className="timeline__tick-label">{tick.label}</span>
              </div>
            );
          })}

          {renderItems.map(item => {
            if (item.type === "group") {
              const isActive = activeGroup?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  ref={node => setGroupNode(item.id, node)}
                  className={`timeline__group ${isActive ? "timeline__group--active" : ""}`.trim()}
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
                range={range}
                now={now}
              />
            );
          })}

          <div
            className="timeline__focus"
            style={{ left: `${toPercent(valueRatio)}%` }}
            onPointerDown={handleFocusPointerDown}
            onPointerMove={handleFocusPointerMove}
            onPointerUp={handleFocusPointerUp}
            role="presentation"
          >
            <span className="timeline__focus-handle" />
            <span className="timeline__focus-stem" />
          </div>
        </div>

        {activeGroup && axisSize.width > 0 && (
          <SubTimeline
            axisWidth={axisSize.width}
            group={activeGroup}
            range={range}
            onClose={handleCloseSubTimeline}
            now={now}
            groupElement={activeGroupNode}
          />
        )}
      </div>

      {valueNode && <div className="timeline__value timeline__value--below">{valueNode}</div>}
    </div>
  );
}

const SubTimeline = ({ axisWidth, group, range, onClose, now, groupElement }: SubTimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, onClose);

  const [connectorGap, setConnectorGap] = useState(SUB_TIMELINE_CONNECTOR_HEIGHT);

  useLayoutEffect(() => {
    const updateGap = () => {
      const wrapper = containerRef.current;
      if (!wrapper) return;

      if (!groupElement) {
        setConnectorGap(prev =>
          Math.abs(prev - SUB_TIMELINE_CONNECTOR_HEIGHT) < 0.5 ? prev : SUB_TIMELINE_CONNECTOR_HEIGHT
        );
        return;
      }

      const containerRect = wrapper.getBoundingClientRect();
      const groupRect = groupElement.getBoundingClientRect();
      const measured = containerRect.top - groupRect.bottom;
      const fallback = SUB_TIMELINE_CONNECTOR_HEIGHT;
      const nextGap = Number.isFinite(measured) && measured > 0 ? measured : fallback;

      setConnectorGap(prev => (Math.abs(prev - nextGap) < 0.5 ? prev : nextGap));
    };

    updateGap();

    window.addEventListener("resize", updateGap);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateGap);
      const wrapper = containerRef.current;
      if (wrapper) resizeObserver.observe(wrapper);
      if (groupElement) resizeObserver.observe(groupElement);
    }

    return () => {
      window.removeEventListener("resize", updateGap);
      resizeObserver?.disconnect();
    };
  }, [groupElement]);

  const subRange = useMemo(() => createSubRange(group, range), [group, range]);
  const subSpan = subRange.end - subRange.start || 1;

  const subTicks = useMemo(() => createSubTicks(subRange), [subRange]);

  const subEvents = useMemo(
    () =>
      group.events.map(event => ({
        event,
        leftPercent: toPercent(getRatio(event.value, subRange, subSpan))
      })),
    [group.events, subRange, subSpan]
  );

  const baseWidth = Math.max(axisWidth * (group.endRatio - group.startRatio), 0);
  const desiredWidth = Math.max(baseWidth + SUB_TIMELINE_BUFFER_PX * 2, SUB_TIMELINE_MIN_WIDTH);
  const width = Math.min(axisWidth, desiredWidth);
  const center = axisWidth * group.ratio;
  const left = clamp(center - width / 2, 0, Math.max(axisWidth - width, 0));
  const groupCenterPx = axisWidth * group.ratio;

  const startConnectorTarget = left;
  const endConnectorTarget = left + width;

  const connectorsHeight = Math.max(connectorGap, 1);

  const subTimelineStyle: CSSProperties = {
    ["--timeline-sub-gap" as string]: `${connectorsHeight}px`
  };

  const axisWrapperStyle: CSSProperties = {
    width: `${width}px`,
    left: `${left}px`
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
        <line x1={groupCenterPx} y1={0} x2={endConnectorTarget} y2={connectorsHeight} />
      </svg>

      <div
        ref={containerRef}
        className="timeline__subtimeline-axis-wrapper"
        style={axisWrapperStyle}
      >
        <div className="timeline__subtimeline-axis">
          <div className="timeline__line" />
          {subTicks.map(tick => (
            <div key={tick.id} className="timeline__subtimeline-tick" style={{ left: `${tick.leftPercent}%` }}>
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
};

type EventElementProps = {
  event: TimelineEvent;
  leftPercent: number;
  variant: "main" | "sub";
  range: Range;
  now: number;
};

const EventElement = ({ event, leftPercent, variant, range, now }: EventElementProps) => {
  const placement = event.placement ?? "above";
  const markerShape = event.markerShape ?? "dot";
  const accent: Accent = event.accent ?? "default";
  const isClamped = event.value < range.start || event.value > range.end;
  const showTiming = event.id !== "today";
  const timing = showTiming ? formatEventTiming(event.value, now) : null;
  const isFuture = event.value - now > 0;
  const timingClass = isFuture ? "timeline__label-relative--future" : "timeline__label-relative--past";
  const labelId = `${variant}-${event.id}-label`;

  const eventClasses = [
    "timeline__event",
    `timeline__event--${placement}`,
    `timeline__event--${variant}`
  ];

  if (variant === "main" && isClamped) eventClasses.push("timeline__event--clamped");
  if (event.id === "birth") eventClasses.push("timeline__event--birth");

  const labelClasses = ["timeline__label", `timeline__label--${accent}`];

  const markerStyle: CSSProperties = {
    ["--marker-color" as string]: accentColors[accent]
  };

  return (
    <div
      className={eventClasses.join(" ")}
      style={{ left: `${leftPercent}%` }}
      tabIndex={0}
      aria-labelledby={labelId}
      aria-label={event.label}
    >
      <span className={`timeline__marker timeline__marker--${markerShape}`} style={markerStyle} aria-hidden="true" />
      <div className={labelClasses.join(" ")} id={labelId}>
        <span className="timeline__label-title">{event.label}</span>
        {event.subLabel && <span className="timeline__label-sub">{event.subLabel}</span>}
        {showTiming && timing && (
          <span className={`timeline__label-relative ${timingClass}`}>{timing}</span>
        )}
      </div>
    </div>
  );
};
