"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

import { buildEquivalents, pickStep } from "../utils/scaleConstants";
import { formatBig } from "../utils/format";

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

const MAX_DOTS = 360;
const mediumFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const smallFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });

const formatCount = (value: number) => {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return formatBig(value);
  if (abs >= 1_000) return Math.round(value).toLocaleString();
  if (abs >= 1) return mediumFormatter.format(value);
  return smallFormatter.format(value);
};

const formatLegend = (value: number, unit?: string) => {
  if (!Number.isFinite(value)) return unit ?? "1";
  const abs = Math.abs(value);
  let maximumFractionDigits = 0;
  if (abs < 0.001) maximumFractionDigits = 6;
  else if (abs < 0.01) maximumFractionDigits = 4;
  else if (abs < 1) maximumFractionDigits = 3;
  else if (abs < 10) maximumFractionDigits = 2;
  const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits });
  const base = formatter.format(value);
  return unit ? `${base} ${unit}` : base;
};

const useAnimatedNumber = (target: number, active: boolean, duration = 700) => {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    if (!active) {
      fromRef.current = target;
      setDisplay(target);
      return;
    }

    const start = performance.now();
    const from = fromRef.current;
    fromRef.current = target;
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (target - from) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);

  return display;
};

export const ButHowMuch = ({ value, unit, kind = "count", children }: ButHowMuchProps) => {
  const [open, setOpen] = useState(false);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (kind !== "count") return;
    setOpen(true);
  };

  return (
    <span
      className="cursor-help underline decoration-dotted inline-flex items-center pointer-events-auto"
      onMouseDown={handleOpen}
      title="But how much is it?"
    >
      {children ?? value}
      {kind === "count" && (
        <ScaleOverlay open={open} onClose={() => setOpen(false)} value={value} unit={unit} kind={kind} />
      )}
    </span>
  );
};

const ScaleOverlay = ({ open, onClose, value, unit, kind }: ScaleOverlayProps) => {
  const shouldRender = kind === "count";
  const animatedValue = useAnimatedNumber(value, open);
  const equivalents = useMemo(
    () => (shouldRender ? buildEquivalents(value, "count") : []),
    [shouldRender, value],
  );

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (typeof document === "undefined" || !shouldRender) return null;

  const handleClose = () => onClose();
  const unitLabel = unit;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="scale-overlay__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={handleClose}
        >
          <motion.div
            className="scale-overlay__panel"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            onMouseDown={event => event.stopPropagation()}
          >
            <div className="scale-overlay__header">
              <h2 className="scale-overlay__heading">But how much is it?</h2>
              <button
                type="button"
                className="scale-overlay__close"
                onClick={handleClose}
                aria-label="Close scale overlay"
              >
                ×
              </button>
            </div>
            <div className="scale-overlay__content">
              <CountScene value={value} unit={unitLabel} active={open} />
              <div className="scale-overlay__details">
                <div>
                  <div className="scale-overlay__counter-label">Approximate count</div>
                  <div>
                    <span className="scale-overlay__counter-value">{formatCount(animatedValue)}</span>
                    {unitLabel && <span className="scale-overlay__counter-unit">{unitLabel}</span>}
                  </div>
                </div>
                <div>
                  <div className="scale-overlay__hints">Exact value</div>
                  <div className="scale-overlay__exact-row">
                    <span className="scale-overlay__approx">{formatCount(value)}</span>
                    {unitLabel && <span className="scale-overlay__counter-unit">{unitLabel}</span>}
                  </div>
                </div>
                {equivalents.length > 0 && (
                  <div>
                    <div className="scale-overlay__hints">In other words</div>
                    <ul className="scale-overlay__equivalents">
                      {equivalents.map(item => (
                        <li key={item.label}>
                          <span className="scale-overlay__approx">{formatCount(item.approx)}</span>
                          <span>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

type CountSceneProps = {
  value: number;
  unit?: string;
  active: boolean;
};

const CountScene = ({ value, unit, active }: CountSceneProps) => {
  const { dots, legend } = useMemo(() => {
    if (!Number.isFinite(value) || value <= 0) {
      return { dots: [0], legend: formatLegend(1, unit) };
    }

    const baseStep = pickStep(value, 160);
    const step = value < baseStep ? value : baseStep;
    const dotCount = Math.max(1, Math.min(MAX_DOTS, Math.round(value / step)));
    const dots = Array.from({ length: dotCount }, (_, index) => index);
    return { dots, legend: formatLegend(step, unit) };
  }, [unit, value]);

  return (
    <div className="scale-overlay__visual">
      <div className="count-scene__grid">
        {dots.map(index => (
          <span
            key={index}
            className="count-scene__dot"
            style={{ animationDelay: active ? `${index * 0.018}s` : undefined }}
          />
        ))}
      </div>
      <p className="count-scene__legend">1 dot = {legend}</p>
    </div>
  );
};
