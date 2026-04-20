/**
 * src/components/timeline/EventElement.tsx
 * Renders a single timeline event marker + hover label.
 */
import type { CSSProperties } from "react";
import type { Range } from "../../utils/scaleTransform";
import type { TimelineEvent, Accent } from "./types";
import { accentColors } from "./types";

// ── Time formatting helpers ───────────────────────────────────

const MS_IN_SECOND = 1_000;
const MS_IN_MINUTE = MS_IN_SECOND * 60;
const MS_IN_HOUR   = MS_IN_MINUTE * 60;
const MS_IN_DAY    = MS_IN_HOUR   * 24;

const formatEventTiming = (eventValue: number, now: number): string => {
  const diff    = eventValue - now;
  const absDiff = Math.abs(diff);
  if (absDiff < MS_IN_SECOND) return "Happening now";

  const days    = Math.floor(absDiff / MS_IN_DAY);
  const hours   = Math.floor((absDiff % MS_IN_DAY)    / MS_IN_HOUR);
  const minutes = Math.floor((absDiff % MS_IN_HOUR)   / MS_IN_MINUTE);
  const seconds = Math.floor((absDiff % MS_IN_MINUTE) / MS_IN_SECOND);

  const parts: string[] = [];
  if (days    > 0) parts.push(`${days}d`);
  if (hours   > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${seconds}s`);

  const descriptor = parts.slice(0, 2).join(" ");
  return diff > 0 ? `In ${descriptor}` : `${descriptor} ago`;
};

// ── Component ─────────────────────────────────────────────────

type EventElementProps = {
  event: TimelineEvent;
  leftPercent: number;
  variant: "main" | "sub";
  range: Range;
  now: number;
  onSelect?: (event: TimelineEvent) => void;
  selected?: boolean;
};

export function EventElement({
  event,
  leftPercent,
  variant,
  range,
  now,
  onSelect,
  selected = false,
}: EventElementProps) {
  const placement   = event.placement  ?? "above";
  const markerShape = event.markerShape ?? "dot";
  const accent: Accent = event.accent  ?? "default";

  const isClamped   = event.value < range.start || event.value > range.end;
  const showTiming  = event.id !== "today" && !event.id.startsWith("hist-");
  const timing      = showTiming ? formatEventTiming(event.value, now) : null;
  const isFuture    = event.value - now > 0;
  const timingClass = isFuture
    ? "timeline__label-relative--future"
    : "timeline__label-relative--past";

  const labelId = `${variant}-${event.id}-label`;

  const eventClasses = [
    "timeline__event",
    `timeline__event--${placement}`,
    `timeline__event--${variant}`,
  ];
  if (variant === "main" && isClamped) eventClasses.push("timeline__event--clamped");
  if (event.id === "birth") eventClasses.push("timeline__event--birth");
  if (selected) eventClasses.push("timeline__event--selected");

  const labelClasses = ["timeline__label", `timeline__label--${accent}`];

  const markerStyle: CSSProperties = {
    ["--marker-color" as string]: event.color ?? accentColors[accent],
  };

  return (
    <div
      className={eventClasses.join(" ")}
      style={{ left: `${leftPercent}%` }}
      tabIndex={0}
      aria-labelledby={labelId}
      aria-label={event.label}
      aria-pressed={selected}
      onClick={() => onSelect?.(event)}
      onKeyDown={evt => {
        if (!onSelect) return;
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          onSelect(event);
        }
      }}
    >
      <span
        className={`timeline__marker timeline__marker--${markerShape}`}
        style={markerStyle}
        aria-hidden="true"
      />
      <div className={labelClasses.join(" ")} id={labelId}>
        <span className="timeline__label-title">{event.label}</span>
        {event.subLabel && (
          <span className="timeline__label-sub">{event.subLabel}</span>
        )}
        {showTiming && timing && (
          <span className={`timeline__label-relative ${timingClass}`}>{timing}</span>
        )}
      </div>
    </div>
  );
}
