/**
 * src/hooks/usePinchZoom.ts
 *
 * Adds pinch-to-zoom gesture support to the timeline axis.
 *
 * Usage:
 *   const { showPinchHint } = usePinchZoom({
 *     axisNodeRef, viewportRef, scaleModeRef, setViewport,
 *     isPinchingRef, onPinchStart,
 *   });
 *
 * The caller owns `isPinchingRef` (MutableRefObject<boolean>) so that
 * existing PointerEvent pan handlers can guard against concurrent pinch.
 *
 * Listeners are registered with `{ passive: false }` so that
 * evt.preventDefault() can block native browser zoom / page-scroll.
 */

import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import {
  applyZoom,
  clamp,
  ratioToValue,
  viewportToRange,
  type ScaleMode,
  type Viewport,
} from "../utils/scaleTransform";

// ── Types ──────────────────────────────────────────────────────

type PinchZoomOptions = {
  /** Ref to the axis DOM node — populated after mount. */
  axisNodeRef:   MutableRefObject<HTMLDivElement | null>;
  /** Ref to the current viewport (avoids stale closure). */
  viewportRef:   MutableRefObject<Viewport>;
  /** Ref to the current scale mode (avoids stale closure). */
  scaleModeRef:  MutableRefObject<ScaleMode>;
  /** React state setter (function-updater form). */
  setViewport:   (updater: (prev: Viewport) => Viewport) => void;
  /**
   * Shared boolean ref — set to `true` while a pinch is active.
   * Pan handlers in Timeline.tsx read this to yield to pinch.
   */
  isPinchingRef: MutableRefObject<boolean>;
  /**
   * Called the moment a 2-finger touch is detected.
   * Timeline.tsx uses this to abort any in-progress single-finger pan.
   */
  onPinchStart?: () => void;
};

// ── Hook ───────────────────────────────────────────────────────

export function usePinchZoom({
  axisNodeRef,
  viewportRef,
  scaleModeRef,
  setViewport,
  isPinchingRef,
  onPinchStart,
}: PinchZoomOptions): { showPinchHint: boolean } {

  // ── Per-gesture state ────────────────────────────────────────
  // Stored in a ref so touch handlers never become stale.
  const pinchStateRef = useRef<{ dist: number } | null>(null);

  // ── Pinch-to-zoom hint ───────────────────────────────────────
  // Shown for 3 s on the very first touch interaction.
  const hintShownRef   = useRef(false);
  const hintTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPinchHint, setShowPinchHint] = useState(false);

  // Keep a stable ref to the callback so the effect doesn't re-register
  const onPinchStartRef = useRef(onPinchStart);
  useEffect(() => { onPinchStartRef.current = onPinchStart; });

  // ── Main effect — register touch listeners ───────────────────
  useEffect(() => {
    const axis = axisNodeRef.current;
    if (!axis) return;

    // ── touchstart ─────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      // Show "Pinch to zoom" hint on the very first touch (any finger count)
      if (!hintShownRef.current) {
        hintShownRef.current = true;
        setShowPinchHint(true);
        if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
        hintTimerRef.current = setTimeout(() => setShowPinchHint(false), 3_000);
      }

      if (e.touches.length !== 2) return;

      e.preventDefault(); // block native pinch-zoom / page-scroll

      isPinchingRef.current = true;
      onPinchStartRef.current?.(); // abort ongoing single-finger pan

      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(
        t2.clientX - t1.clientX,
        t2.clientY - t1.clientY,
      );
      pinchStateRef.current = { dist };
    };

    // ── touchmove ──────────────────────────────────────────────
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !isPinchingRef.current || !pinchStateRef.current) return;
      e.preventDefault();

      const [t1, t2] = [e.touches[0], e.touches[1]];
      const newDist = Math.hypot(
        t2.clientX - t1.clientX,
        t2.clientY - t1.clientY,
      );
      const midX = (t1.clientX + t2.clientX) / 2;

      const prevDist = pinchStateRef.current.dist;
      if (prevDist < 1) return; // guard against near-zero distance

      // factor < 1 when fingers spread (zoom in); > 1 when fingers close (zoom out)
      const factor = prevDist / newDist;

      // Map touch midpoint to a timeline anchor in milliseconds
      const rect     = axis.getBoundingClientRect();
      const relative = clamp((midX - rect.left) / rect.width, 0, 1);
      const vp       = viewportRef.current;
      const anchorMs = ratioToValue(relative, viewportToRange(vp), scaleModeRef.current);

      setViewport(prev => applyZoom(prev, factor, anchorMs));

      // Incremental update so every move frame gets the correct delta
      pinchStateRef.current = { dist: newDist };
    };

    // ── touchend / touchcancel ──────────────────────────────────
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinchingRef.current = false;
        pinchStateRef.current = null;
      }
    };

    axis.addEventListener("touchstart",  onTouchStart,  { passive: false });
    axis.addEventListener("touchmove",   onTouchMove,   { passive: false });
    axis.addEventListener("touchend",    onTouchEnd);
    axis.addEventListener("touchcancel", onTouchEnd);

    return () => {
      axis.removeEventListener("touchstart",  onTouchStart);
      axis.removeEventListener("touchmove",   onTouchMove);
      axis.removeEventListener("touchend",    onTouchEnd);
      axis.removeEventListener("touchcancel", onTouchEnd);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
    // All deps (axisNodeRef, viewportRef, scaleModeRef, setViewport, isPinchingRef)
    // are stable React refs or the guaranteed-stable setState dispatcher.
    // Re-registering on every render would be wasteful — safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { showPinchHint };
}


