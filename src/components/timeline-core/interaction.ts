import {
  CATEGORY_META,
  PROJECTION_CERTAINTY_META,
  PROJECTION_TYPE_META,
} from "../../types/events";
import type {
  DetailPanelItem,
  RenderGroup,
  RenderItem,
  TimelineEvent,
  TimelineLane,
} from "../timeline/types";

export const TIMELINE_SINGLE_TARGET_SIZE_PX = 28;
export const TIMELINE_GROUP_TARGET_HEIGHT_PX = 32;
export const TIMELINE_SINGLE_VISUAL_SIZE_PX = 12;
export const TIMELINE_GROUP_VISUAL_HEIGHT_PX = 16;
export const TIMELINE_GROUP_CENTER_OFFSET_PX = -28;

type TimelineTargetGeometryShape = "circle" | "triangle" | "capsule";

export type TimelineSelectionPayload = {
  selectionKey: string;
  detailItems: DetailPanelItem[];
};

export type TimelineSingleEventDescriptor = TimelineSelectionPayload & {
  id: string;
  title: string;
  color: string;
  ariaLabel: string;
  semanticLabel: string;
  metaLabels: string[];
  semanticKind?: TimelineEvent["semanticKind"];
  markerShape: NonNullable<TimelineEvent["markerShape"]>;
};

export type TimelineInteractiveTarget = TimelineSelectionPayload & {
  id: string;
  lane: TimelineLane;
  kind: "single" | "group";
  leftPercent: number;
  topPercent: number;
   centerOffsetPx: number;
  widthPx: number;
  heightPx: number;
   visualWidthPx: number;
   visualHeightPx: number;
  count: number;
  color: string;
  ariaLabel: string;
  title: string;
   semanticKind?: TimelineEvent["semanticKind"];
   markerShape?: TimelineEvent["markerShape"];
  grouping?: RenderGroup["grouping"];
};

export type TimelineTargetGeometry = {
  centerX: number;
  centerY: number;
  hitLeft: number;
  hitTop: number;
  hitRight: number;
  hitBottom: number;
  visualWidthPx: number;
  visualHeightPx: number;
  shape: TimelineTargetGeometryShape;
};

export type BuildTimelineInteractiveTargetsOptions = {
  lane: TimelineLane;
  topPercent: number;
  items: RenderItem[];
};

export const toDetailPanelItem = (event: TimelineEvent): DetailPanelItem => ({
  id: event.id,
  label: event.label,
  subLabel: event.subLabel,
  value: event.value,
  category: event.category,
  semanticKind: event.semanticKind,
  temporalStatus: event.temporalStatus,
  projectionType: event.projectionType,
  certainty: event.certainty,
});

export const createTimelineEventSelectionPayload = (
  event: TimelineEvent,
): TimelineSelectionPayload => ({
  selectionKey: event.id,
  detailItems: [toDetailPanelItem(event)],
});

export const resolveTimelineEventColor = (event: TimelineEvent): string => {
  if (event.color) return event.color;
  if (event.category) return CATEGORY_META[event.category].color;
  if (event.semanticKind === "projection") return "#f59e0b";
  return "#a5b4fc";
};

export const getTimelineSemanticLabel = (
  item: Pick<TimelineEvent, "semanticKind"> | Pick<DetailPanelItem, "semanticKind">,
): string => {
  switch (item.semanticKind) {
    case "projection":
      return "Future projection";
    case "event":
      return "Past event";
    case "marker":
      return "Global reference";
    default:
      return "Personal marker";
  }
};

export const getTimelineGroupVisualWidthPx = (count: number): number =>
  Math.max(24, Math.min(54, 20 + count * 5));

export const getTimelineEventMetaLabels = (event: TimelineEvent): string[] => {
  const labels: string[] = [];
  if (event.subLabel) labels.push(event.subLabel);
  if (event.category) labels.push(CATEGORY_META[event.category].label);
  if (event.projectionType) labels.push(PROJECTION_TYPE_META[event.projectionType].label);
  if (event.certainty) labels.push(PROJECTION_CERTAINTY_META[event.certainty].label);
  return labels;
};

export const buildTimelineSingleEventDescriptor = (
  event: TimelineEvent,
): TimelineSingleEventDescriptor => {
  const semanticLabel = getTimelineSemanticLabel(event);
  const metaLabels = getTimelineEventMetaLabels(event);
  return {
    id: event.id,
    title: event.label,
    color: resolveTimelineEventColor(event),
    ariaLabel: [event.label, semanticLabel, ...metaLabels].join(". "),
    semanticLabel,
    metaLabels,
    semanticKind: event.semanticKind,
    markerShape: event.markerShape ?? "dot",
    ...createTimelineEventSelectionPayload(event),
  };
};

const getTimelineTargetShape = (target: TimelineInteractiveTarget): TimelineTargetGeometryShape => {
  if (target.kind === "group") return "capsule";
  return target.markerShape === "triangle" ? "triangle" : "circle";
};

export const getTimelineTargetGeometry = (
  target: TimelineInteractiveTarget,
  width: number,
  height: number,
): TimelineTargetGeometry => {
  const centerX = (width * target.leftPercent) / 100;
  const laneY = (height * target.topPercent) / 100;
  const centerY = laneY + target.centerOffsetPx;
  const halfHitWidth = target.widthPx / 2;
  const halfHitHeight = target.heightPx / 2;

  return {
    centerX,
    centerY,
    hitLeft: centerX - halfHitWidth,
    hitTop: centerY - halfHitHeight,
    hitRight: centerX + halfHitWidth,
    hitBottom: centerY + halfHitHeight,
    visualWidthPx: target.visualWidthPx,
    visualHeightPx: target.visualHeightPx,
    shape: getTimelineTargetShape(target),
  };
};

type ResolveTimelineTargetAtPointOptions = {
  targets: TimelineInteractiveTarget[];
  width: number;
  height: number;
  x: number;
  y: number;
  slopPx?: number;
  preferredSelectionKey?: string | null;
};

const getTargetDistanceScore = (
  target: TimelineInteractiveTarget,
  geometry: TimelineTargetGeometry,
  x: number,
  y: number,
  slopPx: number,
): number | null => {
  const dx = x - geometry.centerX;
  const dy = y - geometry.centerY;

  if (geometry.shape === "circle" || geometry.shape === "triangle") {
    const radius = Math.max(target.widthPx, target.heightPx) / 2 + slopPx;
    const distanceSq = dx * dx + dy * dy;
    return distanceSq <= radius * radius ? distanceSq : null;
  }

  const expandedHalfWidth = target.widthPx / 2 + slopPx;
  const expandedHalfHeight = target.heightPx / 2 + slopPx;
  const outsideX = Math.max(Math.abs(dx) - expandedHalfWidth, 0);
  const outsideY = Math.max(Math.abs(dy) - expandedHalfHeight, 0);
  const distanceSq = outsideX * outsideX + outsideY * outsideY;
  return distanceSq === 0 || distanceSq <= slopPx * slopPx ? distanceSq : null;
};

export const resolveTimelineTargetAtPoint = ({
  targets,
  width,
  height,
  x,
  y,
  slopPx = 8,
  preferredSelectionKey = null,
}: ResolveTimelineTargetAtPointOptions): TimelineInteractiveTarget | null => {
  let bestTarget: TimelineInteractiveTarget | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const target of targets) {
    const geometry = getTimelineTargetGeometry(target, width, height);
    const score = getTargetDistanceScore(target, geometry, x, y, slopPx);
    if (score === null) continue;

    const bias = preferredSelectionKey === target.selectionKey ? -0.25 : 0;
    const areaBias = (target.widthPx * target.heightPx) / 10_000;
    const nextScore = score + areaBias + bias;

    if (nextScore < bestScore) {
      bestScore = nextScore;
      bestTarget = target;
    }
  }

  return bestTarget;
};

export const resolveTimelineItemColor = (item: RenderItem): string => {
  if (item.type === "single") {
    return resolveTimelineEventColor(item.event);
  }

  const firstColoredEvent = item.events.find(event => event.color || event.category);
  if (firstColoredEvent) return resolveTimelineEventColor(firstColoredEvent);
  if (item.grouping === "edge-start" || item.grouping === "edge-end") return "#cbd5e1";
  return "#818cf8";
};

const describeGroupAriaLabel = (grouping: RenderGroup["grouping"], count: number): string => {
  if (grouping === "edge-start") return `${count} events exist before the visible range`;
  if (grouping === "edge-end") return `${count} events exist after the visible range`;
  return `${count} overlapping events`;
};

const describeGroupTitle = (grouping: RenderGroup["grouping"], count: number): string => {
  if (grouping === "edge-start") return `${count} marker${count === 1 ? "" : "s"} before this view`;
  if (grouping === "edge-end") return `${count} marker${count === 1 ? "" : "s"} after this view`;
  return `${count} overlapping marker${count === 1 ? "" : "s"}`;
};

export const buildTimelineInteractiveTargets = ({
  lane,
  topPercent,
  items,
}: BuildTimelineInteractiveTargetsOptions): TimelineInteractiveTarget[] =>
  items.map(item => {
    if (item.type === "single") {
      const descriptor = buildTimelineSingleEventDescriptor(item.event);
      return {
        id: item.id,
        lane,
        kind: "single",
        leftPercent: item.leftPercent,
        topPercent,
        centerOffsetPx: 0,
        widthPx: TIMELINE_SINGLE_TARGET_SIZE_PX,
        heightPx: TIMELINE_SINGLE_TARGET_SIZE_PX,
        visualWidthPx: item.event.id === "birth"
          ? TIMELINE_SINGLE_VISUAL_SIZE_PX + 4
          : TIMELINE_SINGLE_VISUAL_SIZE_PX,
        visualHeightPx: item.event.id === "birth"
          ? TIMELINE_SINGLE_VISUAL_SIZE_PX + 4
          : TIMELINE_SINGLE_VISUAL_SIZE_PX,
        count: 1,
        color: descriptor.color,
        selectionKey: descriptor.selectionKey,
        detailItems: descriptor.detailItems,
        ariaLabel: descriptor.ariaLabel,
        title: descriptor.title,
        semanticKind: descriptor.semanticKind,
        markerShape: descriptor.markerShape,
      };
    }

    const groupWidth = getTimelineGroupVisualWidthPx(item.events.length);
    return {
      id: item.id,
      lane,
      kind: "group",
      leftPercent: item.leftPercent,
      topPercent,
      centerOffsetPx: TIMELINE_GROUP_CENTER_OFFSET_PX,
      widthPx: groupWidth + 10,
      heightPx: TIMELINE_GROUP_TARGET_HEIGHT_PX,
      visualWidthPx: groupWidth,
      visualHeightPx: TIMELINE_GROUP_VISUAL_HEIGHT_PX,
      count: item.events.length,
      color: resolveTimelineItemColor(item),
      selectionKey: item.id,
      detailItems: item.events.map(toDetailPanelItem),
      ariaLabel: describeGroupAriaLabel(item.grouping, item.events.length),
      title: describeGroupTitle(item.grouping, item.events.length),
      grouping: item.grouping,
    };
  });

