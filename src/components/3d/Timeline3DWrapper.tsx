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
import { lazy, Suspense } from "react";
import type { TimelineEvent } from "../timeline/types";
import type { Range } from "../../utils/scaleTransform";
import { WEB_GL_SUPPORTED } from "../../utils/webgl";
import { useMediaQuery } from "../../hooks/useMediaQuery";

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

function NoWebGLFallback() {
  return (
    <div className="timeline-3d timeline-3d--no-webgl" role="alert">
      <p className="timeline-3d__no-webgl-msg">
        ⚠️ WebGL is not available in this browser.
        <br />
        The 3D timeline requires WebGL to render.
      </p>
    </div>
  );
}

// ── Public component ───────────────────────────────────────────
type WrapperProps = {
  events: TimelineEvent[];
  range: Range;
  focusValue: number;
  onExitTo2D: () => void;
};

export function Timeline3DWrapper(props: WrapperProps) {
  const isMobile = useMediaQuery("(max-width:719px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  if (!WEB_GL_SUPPORTED) return <NoWebGLFallback />;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Timeline3DLazy
        {...props}
        qualityProfile={isMobile || prefersReducedMotion ? "low-power" : "balanced"}
      />
    </Suspense>
  );
}
