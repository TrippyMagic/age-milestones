// components/scaleOverlay.tsx
"use client";

import type { JSX, ReactNode, MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Html } from "@react-three/drei";
import { Physics, InstancedRigidBodies, RigidBody } from "@react-three/rapier";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { pickStep, buildEquivalents } from "../utils/scaleConstants";

/* ---------- tipi di base ---------- */

export type ScaleKind =
  | "count"
  | "volume_L"
  | "mass_kg"
  | "distance_m"
  | "time_s"
  | "money_eur";

type ButHowMuchProps = {
  value: number;
  unit?: string;
  kind?: ScaleKind;
  children?: ReactNode;
};

type ScaleOverlayProps = {
  open: boolean;
  onClose: () => void;
  value: number;
  unit?: string;
  kind: ScaleKind;
};

type SceneProps = { value: number; unit?: string };

type InstanceDesc = {
  key: string;
  position: [number, number, number];
  rotation: [number, number, number];
};

/* Toggle per debug: se Rapier non parte, metti false e vedrai comunque le sfere */
const ENABLE_PHYSICS = true;

/* ---------- trigger + overlay ---------- */

export const ButHowMuch = ({ value, unit, kind = "count", children }: ButHowMuchProps) => {
  const [open, setOpen] = useState<boolean>(false);

  const handleOpen = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation(); // evita chiusure immediate via backdrop
    setOpen(true);
  };

  return (
    <span
      className="cursor-help underline decoration-dotted inline-flex items-center pointer-events-auto"
      onMouseDown={handleOpen} // apri prima del click che potrebbe bubblaire
      title="But how much is it?"
    >
      {children ?? value}
      <ScaleOverlay open={open} onClose={() => setOpen(false)} value={value} unit={unit} kind={kind} />
    </span>
  );
};

const ScaleOverlay = ({ open, onClose, value, unit, kind }: ScaleOverlayProps) => {
  const eq = buildEquivalents(value, kind);
  const Scene: (props: SceneProps) => JSX.Element =
    kind === "volume_L" ? PoolScene :
    kind === "distance_m" ? RulerScene :
    kind === "time_s" ? HourglassScene :
    BallsScene;

  // in SSR/non-browser non montare il portal
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] backdrop-blur-md bg-black/60 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => { e.stopPropagation(); onClose(); }} // chiudi cliccando il backdrop
        >
          <motion.div
            className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#0b1220" }} // contrasto sicuro
            initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
            onMouseDown={(e) => e.stopPropagation()} // blocca bubbling dentro il pannello
          >
            <div className="p-4 flex items-baseline justify-between text-white">
              <div className="text-xl">But how much is it?</div>
              <button
                className="opacity-70 hover:opacity-100"
                onMouseDown={(e) => { e.stopPropagation(); onClose(); }}
              >
                ✕
              </button>
            </div>

            {/* Altezza inline per evitare Canvas a 0px */}
            <div className="grid md:grid-cols-3">
              <div className="md:col-span-2" style={{ height: 420 }}>
                <Canvas camera={{ position: [0, 2.2, 4.2], fov: 55 }}>
                  {/* Background del canvas per evitare “nero pece” */}
                  <color attach="background" args={["#0e1426"]} />
                  {/* Luci più generose */}
                  <hemisphereLight intensity={0.9} />
                  <ambientLight intensity={0.7} />
                  <directionalLight position={[5, 6, 5]} intensity={1.2} />
                  <Environment preset="city" />
                  <Scene value={value} unit={unit} />
                  <OrbitControls enablePan={false} />
                </Canvas>
              </div>

              <div className="p-4 text-gray-100 space-y-3">
                <div className="text-lg">
                  <span className="font-semibold">{value.toLocaleString()}</span> {unit}
                </div>
                <ul className="space-y-2">
                  {eq.map((e, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-sm opacity-70">≈</span>
                      <span className="font-semibold">{e.approx.toLocaleString()}</span>
                      <span className="opacity-90">{e.label}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-xs opacity-60">Click & drag per ruotare. Scene illustrative.</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/* ---------- Helper UI nel 3D ---------- */

const Legend = ({ text }: { text: string }) => {
  void text;
  return (
    <group position={[0, 1.15, 0]}>
      <mesh>
        <planeGeometry args={[2.8, 0.46]} />
        <meshBasicMaterial color="#0e1627" transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

/* ---------- Scenes ---------- */

// numeri discreti → sfere
const BallsScene = ({ value, unit }: SceneProps) => {
  const step = pickStep(value, 260);
  const count = Math.min(600, Math.ceil(value / step));
  const r = 0.12, size = 3;

  const bodies = useMemo<InstanceDesc[]>(() => {
    const arr: InstanceDesc[] = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (size - 1);
      const z = (Math.random() - 0.5) * (size - 1);
      const y = 2.2 + Math.random() * 1.8;
      arr.push({ key: `b${i}`, position: [x, y, z], rotation: [0, 0, 0] });
    }
    return arr;
  }, [count]);

  return (
    <>
      {/* Stanza */}
      <RigidBody type="fixed">
        <mesh position={[0, -0.75, 0]}>
          <boxGeometry args={[size, 0.5, size]} />
          <meshStandardMaterial color="#2a365d" roughness={0.6} metalness={0.05} />
        </mesh>
        {[-1, 1].map((s, i) => (
          <mesh key={"wz" + i} position={[0, 0, (s * size) / 2]}>
            <boxGeometry args={[size, 2, 0.5]} />
            <meshStandardMaterial color="#1b243f" roughness={0.8} />
          </mesh>
        ))}
        {[-1, 1].map((s, i) => (
          <mesh key={"wx" + i} position={[(s * size) / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[size, 2, 0.5]} />
            <meshStandardMaterial color="#1b243f" roughness={0.8} />
          </mesh>
        ))}
      </RigidBody>

      {ENABLE_PHYSICS ? (
        <Physics gravity={[0, -9.8, 0]}>
          <InstancedRigidBodies instances={bodies as never} restitution={0.25} friction={0.5}>
            <instancedMesh args={[undefined as never, undefined as never, bodies.length]}>
              <sphereGeometry args={[r, 24, 24]} />
              <meshStandardMaterial roughness={0.35} metalness={0.1} color="#9db4ff" />
            </instancedMesh>
          </InstancedRigidBodies>
        </Physics>
      ) : (
        // Fallback senza fisica: vedi almeno le sfere
        <instancedMesh args={[undefined as never, undefined as never, bodies.length]}>
          <sphereGeometry args={[r, 24, 24]} />
          <meshStandardMaterial roughness={0.35} metalness={0.1} color="#9db4ff" />
        </instancedMesh>
      )}

      <Legend text={`1 sfera = ${step.toLocaleString()} ${unit ?? ""}`} />
    </>
  );
};

// volumi in litri → piscina
const PoolScene = ({ value }: SceneProps) => {
  const LtoM3 = (v: number) => v / 1000;
  const poolM3 = LtoM3(2_500_000);
  const frac = Math.min(1, LtoM3(value) / poolM3);
  const y = -0.75 + frac * 1.3;

  return (
    <>
      <mesh position={[0, -0.75, 0]}>
        <boxGeometry args={[3, 1.5, 2]} />
        <meshStandardMaterial color="#243357" roughness={0.7} />
      </mesh>
      <mesh position={[0, y, 0]}>
        <boxGeometry args={[2.9, 1.3 * frac, 1.9]} />
        <meshPhysicalMaterial transmission={0.1} transparent opacity={0.65} roughness={0.15} color="#3aa0ff" />
      </mesh>
      <Legend text={`Riempimento: ${(frac * 100).toFixed(1)}% piscina olimpionica`} />
    </>
  );
};

// distanze → righello
const RulerScene = ({ value }: SceneProps) => {
  const m = value;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <planeGeometry args={[10, 2]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* tacche visive */}
      {[...Array(11)].map((_, i) => (
        <mesh key={i} position={[-5 + i, 0, 0]}>
          <boxGeometry args={[0.02, 0.4, 0.02]} />
          <meshStandardMaterial color="#93c5fd" />
        </mesh>
      ))}
      <Legend text={`≈ ${(m / 105).toFixed(2)} campi da calcio`} />
    </>
  );
};

// tempo → clessidra minimale
const HourglassScene = ({ value }: SceneProps) => {
  const years = value / 31_557_600;
  return (
    <>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 24]} />
        <meshStandardMaterial color="#243357" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 24]} />
        <meshStandardMaterial color="#243357" roughness={0.6} />
      </mesh>
      <Legend text={`≈ ${years.toFixed(3)} anni`} />
    </>
  );
};
