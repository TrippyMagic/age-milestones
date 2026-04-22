import type { CSSProperties, KeyboardEvent } from "react";

import type { TimelineInteractiveTarget } from "../timeline-core";

type Props = {
  targets: TimelineInteractiveTarget[];
  selectedSelectionKey: string | null;
  hoveredSelectionKey: string | null;
  focusedSelectionKey: string | null;
  onActivate: (target: TimelineInteractiveTarget) => void;
  onFocusTarget: (target: TimelineInteractiveTarget | null) => void;
};

const isActivationKey = (key: string) => key === "Enter" || key === " ";

export function TimelineInteractiveOverlay({
  targets,
  selectedSelectionKey,
  hoveredSelectionKey,
  focusedSelectionKey,
  onActivate,
  onFocusTarget,
}: Props) {
  const handleKeyDown = (target: TimelineInteractiveTarget) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isActivationKey(event.key)) return;
    event.preventDefault();
    onActivate(target);
  };

  const tooltipTarget = targets.find(target => target.selectionKey === focusedSelectionKey)
    ?? targets.find(target => target.selectionKey === hoveredSelectionKey)
    ?? null;

  return (
    <div className="timeline__interactive-overlay">
      {targets.map(target => {
        const isSelected = selectedSelectionKey === target.selectionKey;
        const style = {
          left: `${target.leftPercent}%`,
          top: `calc(${target.topPercent}% + ${target.centerOffsetPx}px)`,
          width: `${target.widthPx}px`,
          height: `${target.heightPx}px`,
          ["--timeline-target-color" as string]: target.color,
        } as CSSProperties;

        return (
          <button
            key={target.id}
            type="button"
            className={[
              "timeline__interactive-target",
              target.kind === "group" ? "timeline__interactive-target--group" : "timeline__interactive-target--single",
              isSelected ? "timeline__interactive-target--selected" : "",
            ].filter(Boolean).join(" ")}
            style={style}
            onClick={() => onActivate(target)}
            onKeyDown={handleKeyDown(target)}
            onFocus={() => onFocusTarget(target)}
            onBlur={() => onFocusTarget(null)}
            aria-pressed={isSelected}
            aria-label={target.ariaLabel}
            title={target.title}
          />
        );
      })}

      {tooltipTarget && (
        <div
          className="timeline__interactive-tooltip"
          style={{
            left: `${tooltipTarget.leftPercent}%`,
            top: `calc(${tooltipTarget.topPercent}% + ${tooltipTarget.centerOffsetPx}px)`,
          } as CSSProperties}
          aria-hidden="true"
        >
          <span className="timeline__interactive-tooltip-title">{tooltipTarget.title}</span>
          {tooltipTarget.kind === "group" ? (
            <span className="timeline__interactive-tooltip-meta">
              {tooltipTarget.count} grouped items
            </span>
          ) : tooltipTarget.detailItems[0]?.subLabel ? (
            <span className="timeline__interactive-tooltip-meta">
              {tooltipTarget.detailItems[0].subLabel}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}



