import { useEffect, useRef } from "react";

import {
  getTimelineTargetGeometry,
  type TimelineInteractiveTarget,
} from "../timeline-core";

type Props = {
  width: number;
  height: number;
  targets: TimelineInteractiveTarget[];
  selectedSelectionKey: string | null;
  hoveredSelectionKey: string | null;
  focusedSelectionKey: string | null;
};

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

const drawTriangle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  const half = size / 2;
  ctx.beginPath();
  ctx.moveTo(x, y - half);
  ctx.lineTo(x - half, y + half);
  ctx.lineTo(x + half, y + half);
  ctx.closePath();
};

export function TimelineSceneCanvas({
  width,
  height,
  targets,
  selectedSelectionKey,
  hoveredSelectionKey,
  focusedSelectionKey,
}: Props) {
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

    const laneTops = [...new Set(targets.map(target => target.topPercent))].sort((a, b) => a - b);

    context.save();
    for (const topPercent of laneTops) {
      const laneY = (height * topPercent) / 100;
      context.save();
      context.strokeStyle = topPercent <= 32
        ? "rgba(129, 140, 248, 0.18)"
        : "rgba(148, 163, 184, 0.18)";
      context.lineWidth = 10;
      context.beginPath();
      context.moveTo(12, laneY);
      context.lineTo(width - 12, laneY);
      context.stroke();
      context.restore();
    }

    for (const target of targets) {
      const geometry = getTimelineTargetGeometry(target, width, height);
      const x = geometry.centerX;
      const y = geometry.centerY;
      const laneY = (height * target.topPercent) / 100;
      const color = target.color;
      const isSelected = selectedSelectionKey === target.selectionKey;
      const isHovered = hoveredSelectionKey === target.selectionKey;
      const isFocused = focusedSelectionKey === target.selectionKey;
      const isActive = isSelected || isHovered || isFocused;

      if (target.kind === "single") {
        context.save();
        context.fillStyle = hexToRgba(color, isActive ? 0.28 : 0.18);
        context.beginPath();
        context.arc(x, y, SINGLE_MARKER_RADIUS * (isActive ? 2.8 : 2.2), 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = hexToRgba(color, isActive ? 0.34 : 0.24);
        context.lineWidth = isActive ? 2.5 : 2;
        context.beginPath();
        context.moveTo(x, laneY - 20);
        context.lineTo(x, laneY + 20);
        context.stroke();

        if (target.markerShape === "triangle") {
          context.fillStyle = hexToRgba(color, 0.56);
          drawTriangle(context, x, y, target.visualWidthPx + (isActive ? 4 : 0));
          context.fill();
        } else {
          context.fillStyle = hexToRgba(color, 0.56);
          context.beginPath();
          context.arc(x, y, target.visualWidthPx / 2, 0, Math.PI * 2);
          context.fill();
        }

        if (target.semanticKind === "projection") {
          context.strokeStyle = hexToRgba("#f59e0b", isActive ? 0.8 : 0.56);
          context.setLineDash([4, 3]);
          context.lineWidth = 2;
          context.beginPath();
          context.arc(x, y, target.visualWidthPx / 2 + 3, 0, Math.PI * 2);
          context.stroke();
          context.setLineDash([]);
        }
        context.restore();
        continue;
      }

      const capsuleWidth = target.visualWidthPx;
      const capsuleX = x - capsuleWidth / 2;
      const capsuleHeight = target.visualHeightPx;
      const capsuleY = y - capsuleHeight / 2;

      context.save();
      context.strokeStyle = hexToRgba(color, isActive ? 0.4 : 0.22);
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(x, laneY - 6);
      context.lineTo(x, y + capsuleHeight / 2);
      context.stroke();

      drawRoundedRect(context, capsuleX, capsuleY, capsuleWidth, capsuleHeight, capsuleHeight / 2);
      context.fillStyle = hexToRgba(color, isActive ? 0.44 : target.grouping === "collision" ? 0.32 : 0.18);
      context.fill();

      context.lineWidth = isActive ? 2 : 1.5;
      context.strokeStyle = hexToRgba(color, isActive ? 0.68 : target.grouping === "collision" ? 0.44 : 0.28);
      context.stroke();

      context.fillStyle = isActive ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.92)";
      context.font = "600 12px Inter, system-ui, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(target.count), x, y + 0.5);
      context.restore();
    }

    context.restore();
  }, [focusedSelectionKey, height, hoveredSelectionKey, selectedSelectionKey, targets, width]);

  return <canvas ref={canvasRef} className="timeline__hybrid-canvas" aria-hidden="true" />;
}



