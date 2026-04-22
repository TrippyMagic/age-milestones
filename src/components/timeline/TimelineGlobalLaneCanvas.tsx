import { useEffect, useRef } from "react";

import {
  type TimelineInteractiveTarget,
} from "../timeline-core";

type Props = {
  width: number;
  height: number;
  laneTopPercent: number;
  targets: TimelineInteractiveTarget[];
};

const CAPSULE_HEIGHT = 16;
const SINGLE_MARKER_RADIUS = 6;

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return `rgba(129, 140, 248, ${alpha})`;

  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
};

export function TimelineGlobalLaneCanvas({ width, height, laneTopPercent, targets }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);
    context.clearRect(0, 0, width, height);

    const laneY = (height * laneTopPercent) / 100;

    context.save();
    context.strokeStyle = "rgba(129, 140, 248, 0.18)";
    context.lineWidth = 10;
    context.beginPath();
    context.moveTo(12, laneY);
    context.lineTo(width - 12, laneY);
    context.stroke();

    for (const target of targets) {
      const x = (width * target.leftPercent) / 100;
      const color = target.color;

      if (target.kind === "single") {
        context.save();
        context.fillStyle = hexToRgba(color, 0.2);
        context.beginPath();
        context.arc(x, laneY, SINGLE_MARKER_RADIUS * 2.2, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = hexToRgba(color, 0.24);
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(x, laneY - 20);
        context.lineTo(x, laneY + 20);
        context.stroke();

        context.fillStyle = hexToRgba(color, 0.46);
        context.beginPath();
        context.arc(x, laneY, SINGLE_MARKER_RADIUS, 0, Math.PI * 2);
        context.fill();
        context.restore();
        continue;
      }

      const capsuleWidth = target.widthPx;
      const capsuleX = x - capsuleWidth / 2;
      const capsuleY = laneY - CAPSULE_HEIGHT / 2;

      context.save();
      drawRoundedRect(context, capsuleX, capsuleY, capsuleWidth, CAPSULE_HEIGHT, CAPSULE_HEIGHT / 2);
      context.fillStyle = hexToRgba(color, target.grouping === "collision" ? 0.3 : 0.18);
      context.fill();

      context.lineWidth = 1.5;
      context.strokeStyle = hexToRgba(color, target.grouping === "collision" ? 0.44 : 0.28);
      context.stroke();
      context.restore();
    }

    context.restore();
  }, [height, laneTopPercent, targets, width]);

  return <canvas ref={canvasRef} className="timeline__hybrid-canvas" aria-hidden="true" />;
}


