/**
 * src/components/3d/EventMarker3D.tsx
 * A single event represented as a sphere on the 3D timeline.
 * Hovering reveals an HTML overlay label via @react-three/drei `Html`.
 *
 * NOTE: This file is loaded lazily (only when the user activates 3D mode).
 *       It must NOT be imported by non-3D code.
 */
import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import type { TimelineEvent } from "../timeline/types";
import {
  CATEGORY_META,
  PROJECTION_CERTAINTY_META,
  PROJECTION_TYPE_META,
} from "../../types/events";

// ── Colour palette ─────────────────────────────────────────────
const PERSONAL_COLOR   = "#a5b4fc";   // indigo-100 — matches app palette
const GLOBAL_COLOR     = "#4a5568";   // slate-600
const PROJECTION_COLOR = "#f59e0b";   // amber-500

// ── Component ──────────────────────────────────────────────────
type EventMarker3DProps = {
  event: TimelineEvent;
  /** X position on the normalised [-10, 10] axis */
  x: number;
  /** Signed Y offset from axis (positive = above, negative = below) */
  y: number;
  /** Lane rail Y position used as the connector anchor. */
  axisY: number;
  isPersonal: boolean;
  isProjection: boolean;
  qualityProfile: "balanced" | "low-power";
};

export function EventMarker3D({
  event,
  x,
  y,
  axisY,
  isPersonal,
  isProjection,
  qualityProfile,
}: EventMarker3DProps) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = isProjection
    ? PROJECTION_COLOR
    : (event.color ?? (isPersonal ? PERSONAL_COLOR : GLOBAL_COLOR));
  const baseScale = qualityProfile === "low-power"
    ? (isProjection ? 0.15 : (isPersonal ? 0.18 : 0.13))
    : (isProjection ? 0.18 : (isPersonal ? 0.22 : 0.15));
  const segments = qualityProfile === "low-power" ? 14 : 20;
  const semanticLabel = event.semanticKind === "projection"
    ? "Future projection"
    : event.semanticKind === "event"
    ? "Past event"
    : event.semanticKind === "marker"
    ? "Global reference"
    : "Personal marker";

  // Smooth scale animation on hover
  useFrame(() => {
    if (!meshRef.current) return;
    const target = hovered ? baseScale * 1.55 : baseScale;
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, target, 0.14),
    );
  });

  // Connector line from sphere down to axis (computed in local space)
  const connectorPoints = useMemo<[number, number, number][]>(
    () => [[0, 0, 0], [0, axisY - y, 0]],
    [axisY, y],
  );

  // Tooltip position: above sphere when event is above axis, below when below
  const labelOffsetY = y >= axisY ? 0.55 : -0.55;

  return (
    <group position={[x, y, 0]}>
      {/* ── Sphere ── */}
      <mesh
        ref={meshRef}
        onPointerOver={e => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, segments, segments]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.1 : (isPersonal ? 0.5 : 0.2)}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>

      {/* ── Vertical connector to axis ── */}
      <Line
        points={connectorPoints}
        color={color}
        lineWidth={0.8}
        transparent
        opacity={0.3}
      />

      {/* ── Hover tooltip ── */}
      {hovered && (
        <Html
          center
          distanceFactor={10}
          position={[0, labelOffsetY, 0]}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="timeline-3d__label">
            <span className="timeline-3d__label-text">{event.label}</span>
            <span className="timeline-3d__label-sub">{semanticLabel}</span>
            {event.subLabel && (
              <span className="timeline-3d__label-sub">{event.subLabel}</span>
            )}
            {event.category && (
              <span className="timeline-3d__label-sub">{CATEGORY_META[event.category].label}</span>
            )}
            {event.projectionType && (
              <span className="timeline-3d__label-sub">{PROJECTION_TYPE_META[event.projectionType].label}</span>
            )}
            {event.certainty && (
              <span className="timeline-3d__label-sub">{PROJECTION_CERTAINTY_META[event.certainty].label}</span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

