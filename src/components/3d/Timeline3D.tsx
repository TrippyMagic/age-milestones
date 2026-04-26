/**
 * src/components/3d/Timeline3D.tsx
 * Full R3F scene for the 3D timeline mode.
 *
 * Scene layout:
 *  • X axis = time, normalised to [-10, 10] from range.start → range.end
 *  • Two lane rails = Personal / Global
 *  • Adaptive ticks derived from the same date logic used by the 2D timeline
 *  • Quality profile to keep the scene usable on mobile and reduced-motion devices
 *
 * NOTE: lazy-imported by Timeline3DWrapper — NOT to be imported by other code.
 */
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Html, Line, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

import { EventMarker3D } from "./EventMarker3D";
import type { TimelineEvent } from "../Timeline";
import type { Range } from "../../utils/scaleTransform";
import {
  buildTimeline3DScene,
  TIMELINE_3D_AXIS_MAX_X,
  TIMELINE_3D_AXIS_MIN_X,
} from "../timeline-core";
import {
  getTimeline3DProfileConfig,
  type Timeline3DQualityProfile,
} from "./runtimePolicy";

const laneAxisPoints = (y: number): [number, number, number][] => [[-10, y, 0], [10, y, 0]];

const getLaneLineColor = (lane: "personal" | "global") =>
  lane === "personal" ? "#818cf8" : "#475569";

function FocusRing({ x, qualityProfile }: { x: number; qualityProfile: Timeline3DQualityProfile }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const beamPoints = useMemo<[number, number, number][]>(
    () => [[0, -2.65, 0], [0, 2.65, 0]],
    [],
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const scale = 1 + 0.2 * Math.sin(clock.getElapsedTime() * 2.8);
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <group position={[x, 0, 0]}>
      <Line points={beamPoints} color="#818cf8" lineWidth={1.2} transparent opacity={0.22} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[qualityProfile === "low-power" ? 0.22 : 0.28, qualityProfile === "low-power" ? 14 : 22, qualityProfile === "low-power" ? 14 : 22]} />
        <meshStandardMaterial
          color="#a5b4fc"
          emissive="#a5b4fc"
          emissiveIntensity={1.2}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

type SceneProps = {
  events: TimelineEvent[];
  range: Range;
  focusValue: number;
  qualityProfile: Timeline3DQualityProfile;
  selectedSelectionKey: string | null;
  onSelectMarker: (selectionKey: string, focusValue: number) => void;
};

function TimelineScene({
  events,
  range,
  focusValue,
  qualityProfile,
  selectedSelectionKey,
  onSelectMarker,
}: SceneProps) {
  const scene = useMemo(
    () => buildTimeline3DScene({ events, range, focusValue }),
    [events, range, focusValue],
  );
  const profileConfig = useMemo(() => getTimeline3DProfileConfig(qualityProfile), [qualityProfile]);

  return (
    <>
      <ambientLight intensity={profileConfig.lighting.ambientIntensity} />
      <directionalLight position={[6, 10, 5]} intensity={profileConfig.lighting.directionalIntensity} color="#c8c8ff" />
      <pointLight position={[0, 6, 4]} intensity={profileConfig.lighting.pointIntensity} color="#818cf8" />

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <Stars
        radius={profileConfig.stars.radius}
        depth={profileConfig.stars.depth}
        count={profileConfig.stars.count}
        factor={profileConfig.stars.factor}
        saturation={0.6}
        fade
      />

      {scene.lanes.map(lane => (
        <group key={lane.lane}>
          <Line
            points={laneAxisPoints(lane.axisY)}
            color={getLaneLineColor(lane.lane)}
            lineWidth={lane.lane === "personal" ? 2.5 : 2.2}
          />
          <Html center distanceFactor={10} position={[-9.35, lane.axisY + 0.55, 0]}>
            <span className={`timeline-3d__lane-label timeline-3d__lane-label--${lane.lane}`}>
              {lane.label}
            </span>
          </Html>
        </group>
      ))}

      {scene.ticks.map(tick => {
        const x = tick.x;
        if (x < TIMELINE_3D_AXIS_MIN_X - 0.2 || x > TIMELINE_3D_AXIS_MAX_X + 0.2) return null;

        return (
          <group key={tick.id} position={[x, 0, 0]}>
            <Line
              points={[[0, -2.23, 0], [0, 2.23, 0]] as [number, number, number][]}
              color="#6366f1"
              lineWidth={1}
              transparent
              opacity={0.24}
            />
            <Html center distanceFactor={10} position={[0, -2.63, 0]}>
              <span className="timeline-3d__tick">{tick.label}</span>
            </Html>
          </group>
        );
      })}

      {scene.markers.map(marker => {
        return (
          <EventMarker3D
            key={marker.id}
            marker={marker}
            qualityProfile={qualityProfile}
            selected={selectedSelectionKey === marker.selectionKey}
            onActivate={nextMarker => onSelectMarker(nextMarker.selectionKey, nextMarker.value)}
          />
        );
      })}

      <FocusRing x={scene.focusX} qualityProfile={qualityProfile} />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={profileConfig.orbitControls.dampingFactor}
        minDistance={profileConfig.orbitControls.minDistance}
        maxDistance={profileConfig.orbitControls.maxDistance}
        maxPolarAngle={profileConfig.orbitControls.maxPolarAngle}
        makeDefault
      />
    </>
  );
}

type Timeline3DProps = SceneProps & {
  onExitTo2D: () => void;
};

export default function Timeline3D({
  events,
  range,
  focusValue,
  onExitTo2D,
  qualityProfile,
  selectedSelectionKey,
  onSelectMarker,
}: Timeline3DProps) {
  const profileConfig = useMemo(() => getTimeline3DProfileConfig(qualityProfile), [qualityProfile]);

  return (
    <div className={profileConfig.containerClassName}>
      <div className="timeline-3d__header">
        <span className="timeline-3d__hint">{profileConfig.headerHint}</span>
        <button type="button" className="timeline-3d__exit-btn" onClick={onExitTo2D}>
          ↩ Back to 2D
        </button>
      </div>

      <Canvas
        camera={profileConfig.camera}
        dpr={profileConfig.dpr}
        gl={profileConfig.gl}
        performance={{ min: profileConfig.performanceMin }}
        frameloop="always"
        style={{ background: "#090c1a" }}
      >
        <TimelineScene
          events={events}
          range={range}
          focusValue={focusValue}
          qualityProfile={qualityProfile}
          selectedSelectionKey={selectedSelectionKey}
          onSelectMarker={onSelectMarker}
        />
      </Canvas>
    </div>
  );
}

