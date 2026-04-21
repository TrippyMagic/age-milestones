/**
 * src/components/timeline/TimelineControls.tsx
 * Zoom-in / Zoom-out / Reset buttons.
 */
type TimelineControlsProps = {
  onZoomIn:  () => void;
  onZoomOut: () => void;
  onReset:   () => void;
};

export function TimelineControls({ onZoomIn, onZoomOut, onReset }: TimelineControlsProps) {
  return (
    <div className="timeline__controls" aria-label="Zoom and reset controls">
      <button
        type="button"
        className="timeline__ctrl-btn"
        onClick={onZoomIn}
        title="Zoom in (Ctrl+scroll)"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        type="button"
        className="timeline__ctrl-btn"
        onClick={onZoomOut}
        title="Zoom out (Ctrl+scroll)"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        className="timeline__ctrl-btn timeline__ctrl-btn--reset"
        onClick={onReset}
        title="Reset view"
        aria-label="Reset view"
      >
        ↺
      </button>

      {/* Ctrl+scroll hint */}
      <span className="timeline__ctrl-scroll-hint" aria-hidden="true">
        Ctrl+scroll
      </span>
    </div>
  );
}
