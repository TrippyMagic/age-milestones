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
import type { Timeline3DSceneMarker } from "../timeline-core";

// ── Component ──────────────────────────────────────────────────
type EventMarker3DProps = {
  marker: Timeline3DSceneMarker;
  qualityProfile: "balanced" | "low-power";
  selected?: boolean;
  onActivate?: (marker: Timeline3DSceneMarker) => void;
};

export function EventMarker3D({
  marker,
  qualityProfile,
  selected = false,
  onActivate,
}: EventMarker3DProps) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const isPersonal = marker.lane === "personal";
  const isProjection = marker.semanticKind === "projection";
  const baseScale = qualityProfile === "low-power"
    ? (isProjection ? 0.15 : (isPersonal ? 0.18 : 0.13))
    : (isProjection ? 0.18 : (isPersonal ? 0.22 : 0.15));
  const segments = qualityProfile === "low-power" ? 14 : 20;
  const isHighlighted = hovered || selected;

  // Smooth scale animation on hover
  useFrame(() => {
    if (!meshRef.current) return;
    const target = isHighlighted ? baseScale * 1.55 : baseScale;
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, target, 0.14),
    );
  });

  // Connector line from sphere down to axis (computed in local space)
  const connectorPoints = useMemo<[number, number, number][]>(
    () => [[0, 0, 0], [0, marker.axisY - marker.y, 0]],
    [marker.axisY, marker.y],
  );

  // Tooltip position: above sphere when event is above axis, below when below
  const labelOffsetY = marker.y >= marker.axisY ? 0.55 : -0.55;

  return (
    <group position={[marker.x, marker.y, 0]}>
      {/* ── Sphere ── */}
      <mesh
        ref={meshRef}
        onPointerDown={e => { e.stopPropagation(); }}
        onPointerOver={e => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={e => {
          e.stopPropagation();
          onActivate?.(marker);
        }}
      >
        <sphereGeometry args={[1, segments, segments]} />
        <meshStandardMaterial
          color={marker.color}
          emissive={marker.color}
          emissiveIntensity={isHighlighted ? 1.1 : (isPersonal ? 0.5 : 0.2)}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>

      {/* ── Vertical connector to axis ── */}
      <Line
        points={connectorPoints}
        color={marker.color}
        lineWidth={0.8}
        transparent
        opacity={0.3}
      />

      {/* ── Hover tooltip ── */}
      {isHighlighted && (
        <Html
          center
          distanceFactor={10}
          position={[0, labelOffsetY, 0]}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="timeline-3d__label">
            <span className="timeline-3d__label-text">{marker.title}</span>
            <span className="timeline-3d__label-sub">{marker.semanticLabel}</span>
            {marker.metaLabels.map((metaLabel, index) => (
              <span key={`${index}-${metaLabel}`} className="timeline-3d__label-sub">{metaLabel}</span>
            ))}
          </div>
        </Html>
      )}
    </group>
  );
}

