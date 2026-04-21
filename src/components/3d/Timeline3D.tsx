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
import type { TimelineEvent } from "../timeline/types";
import { generateTicks, type Range, type TimelineTick } from "../../utils/scaleTransform";

type QualityProfile = "balanced" | "low-power";
type Tick = TimelineTick;

const PERSONAL_LANE_Y = 1.85;
const GLOBAL_LANE_Y = -1.85;
const LANE_OFFSET_Y = 0.5;

function toX(value: number, range: Range): number {
  if (range.end <= range.start) return 0;
  return ((value - range.start) / (range.end - range.start)) * 20 - 10;
}

function buildTicks(range: Range): Tick[] {
  const ticks = generateTicks(range, "linear");
  if (ticks.length <= 10) return ticks;

  const step = Math.ceil(ticks.length / 10);
  return ticks.filter((_, index) => index % step === 0 || index === ticks.length - 1);
}

const getLaneBaseY = (event: TimelineEvent) =>
  (event.lane ?? "personal") === "global" ? GLOBAL_LANE_Y : PERSONAL_LANE_Y;

const getMarkerY = (event: TimelineEvent) =>
  getLaneBaseY(event) + (event.placement === "below" ? -LANE_OFFSET_Y : LANE_OFFSET_Y);

const getCameraConfig = (qualityProfile: QualityProfile) =>
  qualityProfile === "low-power"
    ? { position: [0, 3.9, 18] as [number, number, number], fov: 58 }
    : { position: [0, 4.5, 16] as [number, number, number], fov: 55 };

const getDpr = (qualityProfile: QualityProfile): [number, number] =>
  qualityProfile === "low-power" ? [1, 1.15] : [1, 1.75];

const getStarsConfig = (qualityProfile: QualityProfile) =>
  qualityProfile === "low-power"
    ? { radius: 72, depth: 42, count: 900, factor: 3 }
    : { radius: 90, depth: 55, count: 2200, factor: 4 };

const laneAxisPoints = (y: number): [number, number, number][] => [[-10, y, 0], [10, y, 0]];

function FocusRing({ x, qualityProfile }: { x: number; qualityProfile: QualityProfile }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const beamPoints = useMemo<[number, number, number][]>(
    () => [[0, GLOBAL_LANE_Y - 0.8, 0], [0, PERSONAL_LANE_Y + 0.8, 0]],
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
  qualityProfile: QualityProfile;
};

function TimelineScene({ events, range, focusValue, qualityProfile }: SceneProps) {
  const ticks = useMemo(() => buildTicks(range), [range]);
  const focusX = toX(focusValue, range);
  const personalAxisPoints = useMemo<[number, number, number][]>(() => laneAxisPoints(PERSONAL_LANE_Y), []);
  const globalAxisPoints = useMemo<[number, number, number][]>(() => laneAxisPoints(GLOBAL_LANE_Y), []);
  const starsConfig = useMemo(() => getStarsConfig(qualityProfile), [qualityProfile]);

  return (
    <>
      <ambientLight intensity={qualityProfile === "low-power" ? 0.4 : 0.32} />
      <directionalLight position={[6, 10, 5]} intensity={qualityProfile === "low-power" ? 0.7 : 0.9} color="#c8c8ff" />
      <pointLight position={[0, 6, 4]} intensity={qualityProfile === "low-power" ? 0.28 : 0.4} color="#818cf8" />

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <Stars
        radius={starsConfig.radius}
        depth={starsConfig.depth}
        count={starsConfig.count}
        factor={starsConfig.factor}
        saturation={0.6}
        fade
      />

      <Line points={personalAxisPoints} color="#818cf8" lineWidth={2.5} />
      <Line points={globalAxisPoints} color="#475569" lineWidth={2.2} />

      <Html center distanceFactor={10} position={[-9.35, PERSONAL_LANE_Y + 0.55, 0]}>
        <span className="timeline-3d__lane-label timeline-3d__lane-label--personal">Personal</span>
      </Html>
      <Html center distanceFactor={10} position={[-9.35, GLOBAL_LANE_Y + 0.55, 0]}>
        <span className="timeline-3d__lane-label timeline-3d__lane-label--global">Global</span>
      </Html>

      {ticks.map(tick => {
        const x = toX(tick.value, range);
        if (x < -10.2 || x > 10.2) return null;

        return (
          <group key={tick.id} position={[x, 0, 0]}>
            <Line
              points={[[0, GLOBAL_LANE_Y - 0.38, 0], [0, PERSONAL_LANE_Y + 0.38, 0]] as [number, number, number][]}
              color="#6366f1"
              lineWidth={1}
              transparent
              opacity={0.24}
            />
            <Html center distanceFactor={10} position={[0, GLOBAL_LANE_Y - 0.78, 0]}>
              <span className="timeline-3d__tick">{tick.label}</span>
            </Html>
          </group>
        );
      })}

      {events.map(event => {
        const x = toX(event.value, range);
        const axisY = getLaneBaseY(event);
        const y = getMarkerY(event);
        const isPersonal = (event.lane ?? "personal") === "personal";

        return (
          <EventMarker3D
            key={event.id}
            event={event}
            x={x}
            y={y}
            axisY={axisY}
            isPersonal={isPersonal}
            isProjection={event.semanticKind === "projection"}
            qualityProfile={qualityProfile}
          />
        );
      })}

      <FocusRing x={focusX} qualityProfile={qualityProfile} />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={qualityProfile === "low-power" ? 0.08 : 0.1}
        minDistance={qualityProfile === "low-power" ? 6 : 5}
        maxDistance={qualityProfile === "low-power" ? 26 : 30}
        maxPolarAngle={Math.PI * 0.78}
        makeDefault
      />
    </>
  );
}

type Timeline3DProps = SceneProps & {
  onExitTo2D: () => void;
};

export default function Timeline3D({ events, range, focusValue, onExitTo2D, qualityProfile }: Timeline3DProps) {
  const camera = useMemo(() => getCameraConfig(qualityProfile), [qualityProfile]);

  return (
    <div className={`timeline-3d${qualityProfile === "low-power" ? " timeline-3d--low-power" : ""}`}>
      <div className="timeline-3d__header">
        <span className="timeline-3d__hint">
          {qualityProfile === "low-power" ? "Experimental 3D · low power mode" : "Drag to orbit · Scroll to zoom"}
        </span>
        <button type="button" className="timeline-3d__exit-btn" onClick={onExitTo2D}>
          ↩ Back to 2D
        </button>
      </div>

      <Canvas
        camera={camera}
        dpr={getDpr(qualityProfile)}
        gl={{
          antialias: qualityProfile !== "low-power",
          alpha: false,
          powerPreference: qualityProfile === "low-power" ? "low-power" : "high-performance",
        }}
        performance={{ min: qualityProfile === "low-power" ? 0.35 : 0.5 }}
        frameloop="always"
        style={{ background: "#090c1a" }}
      >
        <TimelineScene
          events={events}
          range={range}
          focusValue={focusValue}
          qualityProfile={qualityProfile}
        />
      </Canvas>
    </div>
  );
}

