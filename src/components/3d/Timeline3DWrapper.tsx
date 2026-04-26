/**
 * src/components/3d/Timeline3DWrapper.tsx
 * Lazy-loading shell for the 3D timeline.
 *
 * Responsibilities:
 *  1. Check WebGL support (via utils/webgl.ts).
 *  2. Lazy-import Timeline3D so @react-three/fiber + three.js are
 *     NOT included in the main JS bundle — they land in `three-vendor` chunk.
 *  3. Show a spinner while the chunk is downloading.
 *  4. Show a graceful fallback when WebGL is not supported.
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { TimelineEvent } from "../Timeline";
import type { Range } from "../../utils/scaleTransform";
import { WEB_GL_SUPPORTED } from "../../utils/webgl";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { TimelineDetailPanel } from "../timeline/TimelineDetailPanel";
import { buildTimelineSingleEventDescriptor } from "../timeline-core";
import {
  resolveTimeline3DAvailability,
  resolveTimeline3DQualityProfile,
} from "./runtimePolicy";

// ── Lazy import ────────────────────────────────────────────────
const Timeline3DLazy = lazy(() => import("./Timeline3D"));

// ── Loading / error fallbacks ──────────────────────────────────
function LoadingFallback() {
  return (
    <div className="timeline-3d timeline-3d--loading" role="status" aria-label="Loading 3D view">
      <div className="timeline-3d__spinner" />
      <p className="timeline-3d__loading-text">Loading 3D engine…</p>
    </div>
  );
}

function NoWebGLFallback({ message }: { message: string }) {
  return (
    <div className="timeline-3d timeline-3d--no-webgl" role="alert">
      <p className="timeline-3d__no-webgl-msg">{message}</p>
    </div>
  );
}

// ── Public component ───────────────────────────────────────────
type WrapperProps = {
  events: TimelineEvent[];
  range: Range;
  focusValue: number;
  onExitTo2D: () => void;
  onFocusValueChange: (value: number) => void;
};

export function Timeline3DWrapper(props: WrapperProps) {
  const {
    events,
    range,
    focusValue,
    onExitTo2D,
    onFocusValueChange,
  } = props;
  const isMobile = useMediaQuery("(max-width:719px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const availability = resolveTimeline3DAvailability(WEB_GL_SUPPORTED);
  const qualityProfile = resolveTimeline3DQualityProfile({ isMobile, prefersReducedMotion });
  const [selectedSelectionKey, setSelectedSelectionKey] = useState<string | null>(null);

  const selectedDescriptor = useMemo(() => {
    if (!selectedSelectionKey) return null;
    const selectedEvent = events.find(event => event.id === selectedSelectionKey);
    return selectedEvent ? buildTimelineSingleEventDescriptor(selectedEvent) : null;
  }, [events, selectedSelectionKey]);

  useEffect(() => {
    if (selectedSelectionKey && !selectedDescriptor) {
      setSelectedSelectionKey(null);
    }
  }, [selectedDescriptor, selectedSelectionKey]);

  const clearSelection = useCallback(() => {
    setSelectedSelectionKey(null);
  }, []);

  const handleMarkerSelect = useCallback((nextSelectionKey: string, nextFocusValue: number) => {
    setSelectedSelectionKey(nextSelectionKey);
    onFocusValueChange(nextFocusValue);
  }, [onFocusValueChange]);

  if (!availability.supported) return <NoWebGLFallback message={availability.fallbackMessage} />;

  return (
    <div className="timeline-3d-stack">
      <p className="timeline__surface-note timeline-3d__surface-note">
        Click or tap a marker to inspect it below and keep the shared time focus aligned with the 2D map.
      </p>

      <Suspense fallback={<LoadingFallback />}>
        <Timeline3DLazy
          events={events}
          range={range}
          focusValue={focusValue}
          onExitTo2D={onExitTo2D}
          qualityProfile={qualityProfile}
          selectedSelectionKey={selectedSelectionKey}
          onSelectMarker={handleMarkerSelect}
        />
      </Suspense>

      <AnimatePresence>
        {selectedDescriptor && (
          <TimelineDetailPanel items={selectedDescriptor.detailItems} onClose={clearSelection} />
        )}
      </AnimatePresence>
    </div>
  );
}
