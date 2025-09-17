import { useMemo, type CSSProperties, type ChangeEvent, type ReactNode } from "react";

const SLIDER_RESOLUTION = 1000;

type Range = {
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

export default function Timeline({ range, value, onChange, events, ticks = [], renderValue }: Props) {
  const rawSpan = range.end - range.start;
  const span = rawSpan <= 0 ? 1 : rawSpan;
  const isInvalidRange = rawSpan <= 0;

  const safeValue = clamp(value, range.start, range.end);
  const sliderValue = ((safeValue - range.start) / span) * SLIDER_RESOLUTION;

  const sortedEvents = useMemo(() => events.slice().sort((a, b) => a.value - b.value), [events]);
  const sortedTicks = useMemo(() => ticks.slice().sort((a, b) => a.value - b.value), [ticks]);

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const ratio = Number(evt.target.value) / SLIDER_RESOLUTION;
    const next = range.start + ratio * span;
    onChange(clamp(next, range.start, range.end));
  };

  const valueNode = renderValue?.(safeValue);

  if (isInvalidRange) return null;

  return (
    <div className="timeline">
      {valueNode && <div className="timeline__value">{valueNode}</div>}

      <input
        type="range"
        min={0}
        max={SLIDER_RESOLUTION}
        step={1}
        value={sliderValue}
        onChange={handleChange}
        className="timeline__slider"
      />

      <div className="timeline__axis">
        <div className="timeline__line" />
        {sortedTicks.map(tick => {
          const ratio = (clamp(tick.value, range.start, range.end) - range.start) / span;
          const left = ratio * 100;
          return (
            <div key={tick.id} className="timeline__tick" style={{ left: `${left}%` }}>
              <span className="timeline__tick-line" />
              <span className="timeline__tick-label">{tick.label}</span>
            </div>
          );
        })}

        {sortedEvents.map(event => {
          const ratio = (clamp(event.value, range.start, range.end) - range.start) / span;
          const left = ratio * 100;
          const placement = event.placement ?? "above";
          const markerShape = event.markerShape ?? "dot";
          const accent: Accent = event.accent ?? "default";
          const isClamped = event.value < range.start || event.value > range.end;

          const eventClasses = ["timeline__event", `timeline__event--${placement}`];
          if (isClamped) eventClasses.push("timeline__event--clamped");

          const labelClasses = ["timeline__label", `timeline__label--${accent}`];

          const markerStyle: CSSProperties = {
            ["--marker-color" as const]: accentColors[accent]
          };

          return (
            <div key={event.id} className={eventClasses.join(" ")} style={{ left: `${left}%` }}>
              <div className={labelClasses.join(" ")}>
                <span className="timeline__label-title">{event.label}</span>
                {event.subLabel && (
                  <span className="timeline__label-sub">{event.subLabel}</span>
                )}
              </div>
              <span
                className={`timeline__marker timeline__marker--${markerShape}`}
                style={markerStyle}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
