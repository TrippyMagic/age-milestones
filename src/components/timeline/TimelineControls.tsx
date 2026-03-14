/**
 * src/components/timeline/TimelineControls.tsx
 * Zoom-in / Zoom-out / Reset buttons + Lin/Log scale switcher.
 */
import { usePreferences } from "../../context/PreferencesContext";

type TimelineControlsProps = {
  onZoomIn:  () => void;
  onZoomOut: () => void;
  onReset:   () => void;
};

export function TimelineControls({ onZoomIn, onZoomOut, onReset }: TimelineControlsProps) {
  const { scaleMode, setScaleMode } = usePreferences();
  const isLog = scaleMode === "log";

  return (
    <div className="timeline__controls" aria-label="Timeline controls">
      <button
        type="button"
        className="timeline__ctrl-btn"
        onClick={onZoomIn}
        title="Zoom in (Ctrl+scroll)"
      >
        +
      </button>
      <button
        type="button"
        className="timeline__ctrl-btn"
        onClick={onZoomOut}
        title="Zoom out (Ctrl+scroll)"
      >
        −
      </button>
      <button
        type="button"
        className="timeline__ctrl-btn timeline__ctrl-btn--reset"
        onClick={onReset}
        title="Reset view"
      >
        ↺
      </button>

      {/* Ctrl+scroll hint */}
      <span className="timeline__ctrl-scroll-hint" aria-hidden="true">
        Ctrl+scroll
      </span>

      {/* Scale mode switcher */}
      <span className="timeline__scale-divider" aria-hidden="true" />
      <button
        type="button"
        className={`timeline__ctrl-btn timeline__scale-toggle${isLog ? " timeline__scale-toggle--active" : ""}`}
        onClick={() => setScaleMode(isLog ? "linear" : "log")}
        title={isLog ? "Logarithmic scale — click for linear" : "Linear scale — click for logarithmic"}
        aria-pressed={isLog}
        aria-label="Toggle scale mode"
      >
        {isLog ? "Log" : "Lin"}
      </button>
    </div>
  );
}
