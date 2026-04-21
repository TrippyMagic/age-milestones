/**
 * src/components/3d/Timeline3D.tsx
 * Full R3F scene for the 3D timeline mode.
 *
 * Scene layout:
 *  • X axis = time, normalised to [-10, 10] from range.start → range.end
 *  • Y axis = event placement (above = +1.75, below = -1.75)
 *  • Stars particle field background
 *  • Glowing pulsing sphere marks the current focus value
 *  • OrbitControls with clamped polar angle (no pan, scroll to zoom)
 *
 * NOTE: lazy-imported by Timeline3DWrapper — NOT to be imported by other code.
 */
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line, Html } from "@react-three/drei";
import * as THREE from "three";
import { EventMarker3D } from "./EventMarker3D";
import type { TimelineEvent } from "../timeline/types";
import type { Range } from "../../utils/scaleTransform";

// ── Utilities ──────────────────────────────────────────────────

/** Map a timestamp to the normalised [-10, 10] X axis position. */
function toX(t: number, range: Range): number {
  return ((t - range.start) / (range.end - range.start)) * 20 - 10;
}

type Tick = { id: string; value: number; label: string };

/** Generate clean year ticks for the 3D axis. */
function buildTicks(range: Range): Tick[] {
  const startYear = new Date(range.start).getFullYear();
  const endYear   = new Date(range.end).getFullYear();
  const span = endYear - startYear;
  const step = span > 40 ? 10 : span > 20 ? 5 : 2;
  const ticks: Tick[] = [];
  for (let y = Math.ceil(startYear / step) * step; y <= endYear; y += step) {
    const value = new Date(y, 0, 1).getTime();
    ticks.push({ id: `y-${y}`, value, label: String(y) });
  }
  return ticks;
}

// ── Pulsing "today" focus marker ───────────────────────────────
function FocusRing({ x }: { x: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const s = 1 + 0.2 * Math.sin(clock.getElapsedTime() * 2.8);
    meshRef.current.scale.setScalar(s);
  });

  return (
    <mesh ref={meshRef} position={[x, 0, 0]}>
      <sphereGeometry args={[0.28, 22, 22]} />
      <meshStandardMaterial
        color="#a5b4fc"
        emissive="#a5b4fc"
        emissiveIntensity={1.4}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// ── Scene content (must be inside Canvas context) ─────────────
type SceneProps = {
  events: TimelineEvent[];
  range: Range;
  focusValue: number;
};

function TimelineScene({ events, range, focusValue }: SceneProps) {
  const ticks   = useMemo(() => buildTicks(range), [range]);
  const focusX  = toX(focusValue, range);

  const axisPoints = useMemo<[number, number, number][]>(
    () => [[-10, 0, 0], [10, 0, 0]],
    [],
  );

  return (
    <>
      {/* ── Lighting ── */}
      <ambientLight intensity={0.32} />
      <directionalLight position={[6, 10, 5]} intensity={0.9} color="#c8c8ff" />
      <pointLight position={[0, 6, 4]} intensity={0.4} color="#818cf8" />

      {/* ── Star field ── */}
      <Stars radius={90} depth={55} count={3500} factor={4} saturation={0.6} fade />

      {/* ── Main timeline axis ── */}
      <Line points={axisPoints} color="#4f46e5" lineWidth={2.5} />

      {/* ── Year tick marks ── */}
      {ticks.map(tick => {
        const tx = toX(tick.value, range);
        if (tx < -10.2 || tx > 10.2) return null;
        return (
          <group key={tick.id} position={[tx, 0, 0]}>
            <Line
              points={[[0, -0.2, 0], [0, 0.2, 0]] as [number, number, number][]}
              color="#6366f1"
              lineWidth={1}
            />
            <Html center distanceFactor={10} position={[0, -0.55, 0]}>
              <span className="timeline-3d__tick">{tick.label}</span>
            </Html>
          </group>
        );
      })}

      {/* ── Event markers ── */}
      {events.map(ev => {
        const x          = toX(ev.value, range);
        const isPersonal = (ev.lane ?? "personal") === "personal";
        const y          = ev.placement === "below" ? -1.75 : 1.75;
        return (
          <EventMarker3D
            key={ev.id}
            event={ev}
            x={x}
            y={y}
            isPersonal={isPersonal}
            isProjection={ev.semanticKind === "projection"}
          />
        );
      })}

      {/* ── Focus / today pulse ── */}
      <FocusRing x={focusX} />

      {/* ── Camera controls ── */}
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI * 0.78}
        makeDefault
      />
    </>
  );
}

// ── Public component ───────────────────────────────────────────
type Timeline3DProps = SceneProps & {
  onExitTo2D: () => void;
};

export default function Timeline3D({ events, range, focusValue, onExitTo2D }: Timeline3DProps) {
  return (
    <div className="timeline-3d">
      {/* ── Overlay header ── */}
      <div className="timeline-3d__header">
        <span className="timeline-3d__hint">
          Drag to orbit · Scroll to zoom
        </span>
        <button
          type="button"
          className="timeline-3d__exit-btn"
          onClick={onExitTo2D}
        >
          ↩ Back to 2D
        </button>
      </div>

      {/* ── R3F Canvas ── */}
      <Canvas
        camera={{ position: [0, 4.5, 16], fov: 55 }}
        gl={{ antialias: true, alpha: false }}
        frameloop="always"
        style={{ background: "#090c1a" }}
      >
        <TimelineScene events={events} range={range} focusValue={focusValue} />
      </Canvas>
    </div>
  );
}

