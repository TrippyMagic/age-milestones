import type { CSSProperties, KeyboardEvent } from "react";

import type { TimelineInteractiveTarget } from "../timeline-core";

type Props = {
  targets: TimelineInteractiveTarget[];
  selectedSelectionKey: string | null;
  onActivate: (target: TimelineInteractiveTarget) => void;
};

const isActivationKey = (key: string) => key === "Enter" || key === " ";

export function TimelineGlobalLaneOverlay({ targets, selectedSelectionKey, onActivate }: Props) {
  const handleKeyDown = (target: TimelineInteractiveTarget) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isActivationKey(event.key)) return;
    event.preventDefault();
    onActivate(target);
  };

  return (
    <div className="timeline__global-overlay">
      {targets.map(target => {
        const isSelected = selectedSelectionKey === target.selectionKey;
        const style = {
          left: `${target.leftPercent}%`,
          top: `${target.topPercent}%`,
          width: `${target.widthPx}px`,
          height: `${target.heightPx}px`,
          ["--timeline-target-color" as string]: target.color,
        } as CSSProperties;

        if (target.kind === "group") {
          return (
            <button
              key={target.id}
              type="button"
              className={[
                "timeline__group",
                "timeline__global-target",
                "timeline__global-target--group",
                isSelected ? "timeline__group--active timeline__global-target--selected" : "",
                target.grouping === "edge-start" || target.grouping === "edge-end"
                  ? "timeline__group--edge"
                  : "",
                target.grouping === "edge-start" ? "timeline__group--edge-start" : "",
                target.grouping === "edge-end" ? "timeline__group--edge-end" : "",
              ].filter(Boolean).join(" ")}
              style={style}
              onClick={() => onActivate(target)}
              onKeyDown={handleKeyDown(target)}
              aria-pressed={isSelected}
              aria-label={target.ariaLabel}
              title={target.title}
            >
              <span className="timeline__group-count">{target.count}</span>
              <span className="timeline__global-target-tooltip" aria-hidden="true">{target.title}</span>
            </button>
          );
        }

        return (
          <button
            key={target.id}
            type="button"
            className={[
              "timeline__global-target",
              "timeline__global-target--single",
              isSelected ? "timeline__global-target--selected" : "",
            ].filter(Boolean).join(" ")}
            style={style}
            onClick={() => onActivate(target)}
            onKeyDown={handleKeyDown(target)}
            aria-pressed={isSelected}
            aria-label={target.ariaLabel}
            title={target.title}
          >
            <span className="timeline__global-target-tooltip" aria-hidden="true">{target.title}</span>
          </button>
        );
      })}
    </div>
  );
}


